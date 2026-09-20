// ==========================================================
// DRAGON FURY - GRAN JEFE FINAL: EL TITÁN DE LOS 4 ELEMENTOS
// ==========================================================
// Un dragón colosal de 4 cuernos elementales y ojos prismáticos.
// Domina Fuego, Hielo, Agua y Plantas con 3 fases de combate:
// Fase 1: Vórtice de Fuego y Vapor de Agua
// Fase 2: Escudos Glaciares y Raíces de Gaia
// Fase 3: Omnipotencia Elemental (todos los ataques a la vez)

import * as THREE from 'three';

export class BossDragon {
  constructor(scene, terrain, elementalSystem) {
    this.scene = scene;
    this.terrain = terrain;
    this.elementals = elementalSystem;

    this.group = new THREE.Group();
    this.maxHealth = 2500;
    this.health = 2500;
    this.phase = 1; // 1, 2, 3
    this.isActive = false;

    // Posición en la cumbre nevada más alta
    this.position = new THREE.Vector3(0, 110, -500);
    this.velocity = new THREE.Vector3();
    this.rotationTimer = 0;
    this.attackCooldown = 2.5;

    this.buildBossModel();
  }

  buildBossModel() {
    // Material Titánico PBR Obsidian/Prismático
    const titanMat = new THREE.MeshStandardMaterial({
      color: 0x111119,
      roughness: 0.3,
      metalness: 0.8
    });

    const fireWingMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xaa2200,
      emissiveIntensity: 1.5,
      side: THREE.DoubleSide
    });

    const iceWingMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0088cc,
      emissiveIntensity: 1.5,
      side: THREE.DoubleSide
    });

    // Torso Gigante (Escala 4x)
    const torsoGeo = new THREE.ConeGeometry(4.5, 14.0, 8);
    torsoGeo.rotateX(Math.PI / 2);
    const torso = new THREE.Mesh(torsoGeo, titanMat);
    torso.castShadow = true;
    this.group.add(torso);

    // Cabeza de Titán Ancestral
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 4.0, 8.0);
    torso.add(headGroup);

    const skullGeo = new THREE.BoxGeometry(4.0, 3.2, 5.0);
    const skull = new THREE.Mesh(skullGeo, titanMat);
    headGroup.add(skull);

    // 4 Cuernos Elementales
    const createHorn = (color, x, y, rotZ) => {
      const hornGeo = new THREE.ConeGeometry(0.7, 7.0, 6);
      hornGeo.rotateX(-Math.PI / 2.5);
      const hornMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2
      });
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(x, y, -0.5);
      horn.rotation.z = rotZ;
      headGroup.add(horn);
    };

    createHorn(0xff3300, 1.8, 2.2, -0.3);  // Cuerno de Fuego
    createHorn(0x00e5ff, -1.8, 2.2, 0.3);  // Cuerno de Hielo
    createHorn(0x1e90ff, 2.5, 0.8, -0.6);  // Cuerno de Agua
    createHorn(0x39ff14, -2.5, 0.8, 0.6);  // Cuerno de Plantas

    // Ojos cambiantes
    const eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffea00,
      emissiveIntensity: 3.0
    });
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    leftEye.position.set(1.6, 1.0, 2.2);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    rightEye.position.set(-1.6, 1.0, 2.2);
    headGroup.add(rightEye);

    // 4 Alas Majestuosas
    this.wings = [];
    const makeBigWing = (mat, side, zOffset) => {
      const wingBase = new THREE.Group();
      wingBase.position.set(side * 3.5, 2.0, zOffset);
      torso.add(wingBase);

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(side * 18.0, 6.0);
      shape.lineTo(side * 24.0, -4.0);
      shape.lineTo(side * 12.0, -12.0);
      shape.closePath();

      const wingMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
      wingBase.add(wingMesh);
      this.wings.push({ base: wingBase, side });
    };

    makeBigWing(fireWingMat, 1, 3.0);
    makeBigWing(iceWingMat, -1, 3.0);
    makeBigWing(fireWingMat, 1, -3.0);
    makeBigWing(iceWingMat, -1, -3.0);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  activate() {
    this.isActive = true;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Transición de fases
    if (this.health < this.maxHealth * 0.35) {
      this.phase = 3; // Omnipotencia
      this.eyeMat.color.setHex(0xff00ff);
      this.eyeMat.emissive.setHex(0xff00ff);
    } else if (this.health < this.maxHealth * 0.7) {
      this.phase = 2; // Hielo y Plantas
      this.eyeMat.color.setHex(0x00ffff);
      this.eyeMat.emissive.setHex(0x00ffff);
    }

    return this.health <= 0;
  }

  update(delta, playerDragonPos) {
    if (!this.isActive || this.health <= 0) return;

    this.rotationTimer += delta;

    // Vuelo en círculo majestuoso sobre el valle
    const radius = 280;
    const targetX = Math.sin(this.rotationTimer * 0.35) * radius;
    const targetZ = -450 + Math.cos(this.rotationTimer * 0.35) * radius;
    const targetY = 120 + Math.sin(this.rotationTimer * 0.7) * 20;

    this.group.position.set(targetX, targetY, targetZ);
    this.group.lookAt(playerDragonPos.x, playerDragonPos.y, playerDragonPos.z);

    // Animación de las 4 alas
    const wingAngle = Math.sin(this.rotationTimer * 4.0) * 0.45;
    this.wings.forEach((w) => {
      w.base.rotation.z = w.side * wingAngle;
    });

    // Inteligencia de Ataque según Fase
    this.attackCooldown -= delta;
    if (this.attackCooldown <= 0) {
      this.performBossAttack(playerDragonPos);
      this.attackCooldown = this.phase === 3 ? 1.4 : 2.6;
    }
  }

  performBossAttack(targetPos) {
    const dir = targetPos.clone().sub(this.group.position).normalize();
    const origin = this.group.position.clone().add(dir.clone().multiplyScalar(15.0));

    if (this.phase === 1) {
      // Alterna Fuego y Agua
      const elem = Math.random() > 0.5 ? 'fire' : 'water';
      this.elementals.fireProjectile(origin, dir, elem, 2.5);
    } else if (this.phase === 2) {
      // Hielo y Plantas
      const elem = Math.random() > 0.5 ? 'ice' : 'plants';
      this.elementals.fireProjectile(origin, dir, elem, 3.0);
    } else {
      // Fase 3: Ráfaga omnielemental cuádruple
      const elements = ['fire', 'ice', 'water', 'plants'];
      elements.forEach((elem, idx) => {
        const spreadDir = dir.clone().add(new THREE.Vector3(
          (idx - 1.5) * 0.15,
          (Math.random() - 0.5) * 0.1,
          0
        )).normalize();
        this.elementals.fireProjectile(origin, spreadDir, elem, 3.5);
      });
    }
  }
}
