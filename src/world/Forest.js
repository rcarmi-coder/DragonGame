// ==========================================================
// DRAGON FURY - BOSQUE DE ÁRBOLES Y VEGETACIÓN INFLAMABLE
// ==========================================================
// Genera cientos de árboles medievales y vegetación con materiales PBR
// distribuidos en los valles. Cada árbol está registrado en el motor de
// combustión física para arder, carbonizarse y colapsar.

import * as THREE from 'three';

export class Forest {
  constructor(scene, terrain, burningPhysics) {
    this.scene = scene;
    this.terrain = terrain;
    this.burning = burningPhysics;
    this.trees = [];

    this.buildForest();
  }

  buildForest() {
    const treeCount = 140;
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 5.0, 6);
    const foliageGeo = new THREE.ConeGeometry(3.5, 8.0, 6);

    for (let i = 0; i < treeCount; i++) {
      // Dispersar por los valles del mundo (evitando las cumbres de nieve perpetua)
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 550 + 60;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getHeight(x, z);

      // Solo plantar en altitudes con vegetación (bajo la línea de nieve)
      if (y > (this.terrain.snowAltitude + 5)) continue;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, y + 2.5, z);

      // Variación de escala individual
      const scale = Math.random() * 0.6 + 0.8;
      treeGroup.scale.set(scale, scale, scale);

      // Tronco de madera inflamable
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4a2a12,
        roughness: 0.9,
        metalness: 0.1
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Copa de pino / follaje inflamable
      const foliageMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x1f441e : 0x2d5a27,
        roughness: 0.8,
        metalness: 0.05
      });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 4.5;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);

      this.scene.add(treeGroup);

      // Registrar en el motor de combustión
      this.burning.registerBurnable(treeGroup, {
        isFlammable: true,
        burnRate: 0.25,
        radius: 3.2 * scale,
        health: 50,
        onCollapsed: () => {
          // El árbol colapsado queda como tocón carbonizado
        }
      });

      this.trees.push(treeGroup);
    }
  }
}
