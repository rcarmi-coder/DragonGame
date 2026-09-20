// ==========================================================
// DRAGON FURY - CABALLEROS CON ARMADURAS BRILLANTES
// ==========================================================
// Soldados medievales con armaduras de metal reflectante (PBR de alta calidad),
// yelmos con plumas y lanzas. Patrullan en escuadras y disparan flechas al dragón.

import * as THREE from 'three';

export class KnightSquad {
  constructor(scene, terrain, burningPhysics, count = 35) {
    this.scene = scene;
    this.terrain = terrain;
    this.burning = burningPhysics;
    this.knights = [];

    this.spawnSquad(count);
  }

  spawnSquad(count) {
    // Material de armadura brillante reflectante de consola
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.15,
      metalness: 0.95 // Alta reflectividad metálica
    });

    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0044aa,
      roughness: 0.3,
      metalness: 0.7
    });

    const plumeMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      roughness: 0.6
    });

    for (let i = 0; i < count; i++) {
      const knightGroup = new THREE.Group();

      // Dispersar en campamentos del valle
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 400 + 80;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getHeight(x, z);

      knightGroup.position.set(x, y + 1.2, z);

      // Cuerpo / Coraza
      const torsoGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8);
      const torso = new THREE.Mesh(torsoGeo, armorMat);
      torso.castShadow = true;
      knightGroup.add(torso);

      // Yelmo con visera
      const helmGeo = new THREE.SphereGeometry(0.32, 8, 8);
      const helm = new THREE.Mesh(helmGeo, armorMat);
      helm.position.y = 0.85;
      helm.castShadow = true;
      knightGroup.add(helm);

      // Penacho / Pluma roja
      const plumeGeo = new THREE.ConeGeometry(0.08, 0.4, 4);
      const plume = new THREE.Mesh(plumeGeo, plumeMat);
      plume.position.set(0, 1.15, -0.1);
      knightGroup.add(plume);

      // Escudo con heráldica
      const shieldGeo = new THREE.BoxGeometry(0.5, 0.8, 0.1);
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(-0.45, 0.2, 0.3);
      knightGroup.add(shield);

      // Lanza / Alabarda
      const spearGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6);
      const spear = new THREE.Mesh(spearGeo, armorMat);
      spear.position.set(0.45, 0.6, 0.2);
      spear.rotation.x = 0.2;
      knightGroup.add(spear);

      this.scene.add(knightGroup);

      this.knights.push({
        group: knightGroup,
        health: 40,
        alive: true,
        basePos: new THREE.Vector2(x, z),
        patrolTimer: Math.random() * 10
      });
    }
  }

  update(delta, dragonPos, onKnightDefeated) {
    for (let i = 0; i < this.knights.length; i++) {
      const k = this.knights[i];
      if (!k.alive) continue;

      k.patrolTimer += delta;
      // Pequeño patrullaje circular
      k.group.position.x = k.basePos.x + Math.sin(k.patrolTimer * 0.8) * 4.0;
      k.group.position.z = k.basePos.y + Math.cos(k.patrolTimer * 0.8) * 4.0;
      k.group.position.y = this.terrain.getHeight(k.group.position.x, k.group.position.z) + 1.2;

      // Orientarse hacia el dragón cuando está cerca
      const distToDragon = k.group.position.distanceTo(dragonPos);
      if (distToDragon < 120) {
        k.group.lookAt(dragonPos.x, k.group.position.y, dragonPos.z);
      }

      // Daño por cercanía de fuego o picada sísmica
      if (distToDragon < 8.0) {
        k.alive = false;
        k.group.rotation.x = Math.PI / 2;
        k.group.position.y -= 0.5;
        if (onKnightDefeated) onKnightDefeated(k.group.position);
      }
    }
  }
}
