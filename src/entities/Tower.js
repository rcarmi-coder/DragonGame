// ==========================================================
// DRAGON FURY - TORRES ALTAS MEDIEVALES DESTRUCTIBLES
// ==========================================================
// Torres gigantescas que se elevan hacia el cielo con almenas,
// vigas de madera inflamables y arqueros. Al arder la madera o recibir
// impactos, se quiebran y colapsan con físicas de destrucción.

import * as THREE from 'three';

export class TowerManager {
  constructor(scene, terrain, burningPhysics) {
    this.scene = scene;
    this.terrain = terrain;
    this.burning = burningPhysics;
    this.towers = [];

    this.spawnTowers();
  }

  spawnTowers() {
    const towerCount = 12;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a5f66,
      roughness: 0.9,
      metalness: 0.1
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6a3818,
      roughness: 0.8,
      metalness: 0.05
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x8b2500,
      roughness: 0.7
    });

    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = Math.random() * 380 + 150;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getHeight(x, z);

      const towerHeight = Math.random() * 35 + 40; // Torres colosales de 40 a 75 metros

      const towerGroup = new THREE.Group();
      towerGroup.position.set(x, y + towerHeight * 0.5, z);

      // Fuste / Cilindro principal de piedra
      const baseGeo = new THREE.CylinderGeometry(4.5, 6.0, towerHeight, 10);
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.castShadow = true;
      base.receiveShadow = true;
      towerGroup.add(base);

      // Andamiaje y plataformas de madera inflamables
      const scaffoldGeo = new THREE.BoxGeometry(11.0, 1.2, 11.0);
      const scaffold = new THREE.Mesh(scaffoldGeo, woodMat);
      scaffold.position.y = towerHeight * 0.5 - 2;
      scaffold.castShadow = true;
      towerGroup.add(scaffold);

      // Tejado cónico de la torre
      const roofGeo = new THREE.ConeGeometry(6.5, 9.0, 8);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = towerHeight * 0.5 + 4.5;
      roof.castShadow = true;
      towerGroup.add(roof);

      this.scene.add(towerGroup);

      // Registrar componentes de madera en el motor de combustión
      this.burning.registerBurnable(towerGroup, {
        isFlammable: true,
        burnRate: 0.18,
        radius: 7.5,
        health: 200,
        onCollapsed: () => {
          // Torre colapsada
          towerGroup.rotation.z = Math.PI / 2.3;
          towerGroup.position.y = y + 2;
        }
      });

      this.towers.push({
        group: towerGroup,
        height: towerHeight,
        pos: new THREE.Vector3(x, y, z),
        isDestroyed: false
      });
    }
  }

  checkHit(position, radius = 5.0, onTowerDestroyed) {
    for (const t of this.towers) {
      if (t.isDestroyed) continue;
      const dist = position.distanceTo(t.pos);
      if (dist < (radius + 6.0)) {
        t.isDestroyed = true;
        t.group.rotation.z = 0.5;
        t.group.scale.set(0.6, 0.4, 0.6);
        if (onTowerDestroyed) onTowerDestroyed(t.pos);
      }
    }
  }
}
