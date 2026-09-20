// ==========================================================
// DRAGON FURY - SISTEMA ELEMENTAL COMPLETO (4 ELEMENTOS)
// ==========================================================
// Fuego 🔥, Hielo ❄️, Agua 💧 y Plantas 🌿.
// Alientos continuos, proyectiles explosivos balísticos y
// Superpoderes Definitivos con efectos visuales cinematográficos de área.

import * as THREE from 'three';

export class ElementalSystem {
  constructor(scene, burningPhysics, soundManager) {
    this.scene = scene;
    this.burning = burningPhysics;
    this.audio = soundManager;

    // Almacén de proyectiles activos
    this.projectiles = [];
    this.elementalParticles = [];

    // Estado del superpoder
    this.ultimateCharge = 100; // 0 a 100
    this.isUltimateActive = false;
    this.ultimateTimer = 0;
    this.activeUltimateElement = 'fire';

    // Objeto visual para el superpoder de raíces gigantes / meteoros
    this.ultimateVisualGroup = new THREE.Group();
    this.scene.add(this.ultimateVisualGroup);

    // Sistema de partículas para chorros elementales
    this.initBeamParticles();
  }

  initBeamParticles() {
    this.maxParticles = 900;
    this.particleIndex = 0;

    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.alphas = new Float32Array(this.maxParticles);
    this.velocities = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -999;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
      this.alphas[i] = 0;
      this.velocities.push(new THREE.Vector3());
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;
          float falloff = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, vAlpha * falloff);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  // 1. Chorro Continuo del Elemento Activo
  emitBreath(origin, direction, element, dragonScale = 1.0) {
    const count = 4;
    const soundThrottle = Math.random();

    // Disparar sonido según elemento
    if (soundThrottle < 0.1) {
      if (element === 'fire') this.audio.playFireBreath(0.3);
      if (element === 'ice') this.audio.playIceBlast(0.3);
      if (element === 'water') this.audio.playWaterTorrent(0.3);
      if (element === 'plants') this.audio.playNatureStrike();
    }

    // Comprobar colisión e ignición en el trayecto
    const impactPoint = origin.clone().add(direction.clone().multiplyScalar(25.0 * dragonScale));
    if (element === 'fire') {
      this.burning.igniteAt(impactPoint, 6.0 * dragonScale);
    } else if (element === 'ice' || element === 'water') {
      this.burning.extinguishAt(impactPoint, 8.0 * dragonScale);
    }

    // Partículas visuales
    for (let i = 0; i < count; i++) {
      const idx = this.particleIndex;
      this.particleIndex = (this.particleIndex + 1) % this.maxParticles;

      const spread = 0.8 * dragonScale;
      this.positions[idx * 3] = origin.x + (Math.random() - 0.5) * spread;
      this.positions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * spread;
      this.positions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * spread;

      const baseSpeed = (Math.random() * 25.0 + 45.0) * dragonScale;
      this.velocities[idx].copy(direction).multiplyScalar(baseSpeed).add(new THREE.Vector3(
        (Math.random() - 0.5) * 6.0,
        (Math.random() - 0.5) * 6.0,
        (Math.random() - 0.5) * 6.0
      ));

      this.sizes[idx] = (Math.random() * 8.0 + 6.0) * dragonScale;
      this.alphas[idx] = 0.9;

      // Asignar color según elemento
      if (element === 'fire') {
        this.colors[idx * 3] = 1.0;
        this.colors[idx * 3 + 1] = Math.random() * 0.4 + 0.1;
        this.colors[idx * 3 + 2] = 0.0;
      } else if (element === 'ice') {
        this.colors[idx * 3] = 0.2;
        this.colors[idx * 3 + 1] = 0.9;
        this.colors[idx * 3 + 2] = 1.0;
      } else if (element === 'water') {
        this.colors[idx * 3] = 0.1;
        this.colors[idx * 3 + 1] = 0.5;
        this.colors[idx * 3 + 2] = 1.0;
      } else if (element === 'plants') {
        this.colors[idx * 3] = 0.2;
        this.colors[idx * 3 + 1] = 1.0;
        this.colors[idx * 3 + 2] = 0.1;
      }
    }
  }

  // 2. Proyectil Balístico Cargado
  fireProjectile(origin, direction, element, dragonScale = 1.0) {
    const projGeo = new THREE.SphereGeometry(1.2 * dragonScale, 8, 8);
    let color = 0xff4400;
    if (element === 'ice') color = 0x00e5ff;
    if (element === 'water') color = 0x1e90ff;
    if (element === 'plants') color = 0x39ff14;

    const projMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 2.5
    });

    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.audio.playExplosion();

    this.projectiles.push({
      mesh,
      velocity: direction.clone().multiplyScalar(75.0 * dragonScale),
      life: 3.5,
      element,
      scale: dragonScale
    });
  }

  // 3. Superpoder Definitivo de Pantalla Completa (Visiblemente Épico)
  triggerUltimate(dragonPos, element, targets = []) {
    if (this.ultimateCharge < 100) return false;

    this.ultimateCharge = 0;
    this.isUltimateActive = true;
    this.ultimateTimer = 5.0; // 5 segundos de cataclismo
    this.activeUltimateElement = element;

    this.audio.playAncestralRoar();
    this.audio.playEvolutionFanfare();

    // Limpiar visuales anteriores
    while (this.ultimateVisualGroup.children.length > 0) {
      this.ultimateVisualGroup.remove(this.ultimateVisualGroup.children[0]);
    }

    // Efecto específico según elemento
    if (element === 'fire') {
      // Tormenta de Cataclismo: Columnas de magma brotando
      for (let i = 0; i < 15; i++) {
        const pillarGeo = new THREE.CylinderGeometry(2, 6, 60, 8);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0xff3300,
          emissive: 0xff5500,
          emissiveIntensity: 3.0
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 120,
          10,
          (Math.random() - 0.5) * 120
        );
        pillar.position.copy(dragonPos).add(offset);
        this.ultimateVisualGroup.add(pillar);

        // Prender fuego en masa
        this.burning.igniteAt(pillar.position, 20.0);
      }
    } else if (element === 'plants') {
      // Furia de Gaia: Raíces y espinas gigantescas emergen del suelo
      for (let i = 0; i < 20; i++) {
        const rootGeo = new THREE.ConeGeometry(3, 40, 6);
        const rootMat = new THREE.MeshStandardMaterial({
          color: 0x228811,
          roughness: 0.8
        });
        const root = new THREE.Mesh(rootGeo, rootMat);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 140,
          5,
          (Math.random() - 0.5) * 140
        );
        root.position.copy(dragonPos).add(offset);
        root.rotation.z = (Math.random() - 0.5) * 0.5;
        this.ultimateVisualGroup.add(root);
      }
    } else if (element === 'ice') {
      // Glaciación Absoluta: Monolitos de hielo gigantes
      for (let i = 0; i < 16; i++) {
        const iceGeo = new THREE.ConeGeometry(4, 50, 5);
        const iceMat = new THREE.MeshStandardMaterial({
          color: 0x88eeff,
          emissive: 0x00ccff,
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.85
        });
        const ice = new THREE.Mesh(iceGeo, iceMat);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 130,
          15,
          (Math.random() - 0.5) * 130
        );
        ice.position.copy(dragonPos).add(offset);
        this.ultimateVisualGroup.add(ice);
        this.burning.extinguishAt(ice.position, 25.0);
      }
    } else if (element === 'water') {
      // Maelstrom Torrencial: Anillos de agua giratorios
      const ringGeo = new THREE.TorusGeometry(35, 3, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x0044cc,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(dragonPos);
      this.ultimateVisualGroup.add(ring);
    }

    return true;
  }

  update(delta, terrain) {
    // 1. Carga pasiva del superpoder
    if (this.ultimateCharge < 100) {
      this.ultimateCharge = Math.min(100, this.ultimateCharge + delta * 3.5);
    }

    // 2. Actualizar tiempo del superpoder activo
    if (this.isUltimateActive) {
      this.ultimateTimer -= delta;
      this.ultimateVisualGroup.rotation.y += delta * 0.8;
      if (this.ultimateTimer <= 0) {
        this.isUltimateActive = false;
        while (this.ultimateVisualGroup.children.length > 0) {
          this.ultimateVisualGroup.remove(this.ultimateVisualGroup.children[0]);
        }
      }
    }

    // 3. Actualizar proyectiles balísticos
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Colisión con el terreno
      const groundH = terrain.getHeight(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y <= groundH || p.life <= 0) {
        // Impacto y explosión
        if (p.element === 'fire') {
          this.burning.igniteAt(p.mesh.position, 12.0 * p.scale);
        } else if (p.element === 'ice' || p.element === 'water') {
          this.burning.extinguishAt(p.mesh.position, 15.0 * p.scale);
        }
        this.audio.playExplosion();

        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Actualizar partículas de chorros elementales
    const posAttr = this.points.geometry.attributes.position;
    const colAttr = this.points.geometry.attributes.color;
    const sizeAttr = this.points.geometry.attributes.size;
    const alphaAttr = this.points.geometry.attributes.alpha;

    for (let i = 0; i < this.maxParticles; i++) {
      if (this.alphas[i] > 0.01) {
        this.positions[i * 3] += this.velocities[i].x * delta;
        this.positions[i * 3 + 1] += this.velocities[i].y * delta;
        this.positions[i * 3 + 2] += this.velocities[i].z * delta;

        this.sizes[i] += delta * 4.0;
        this.alphas[i] = Math.max(0, this.alphas[i] - delta * 1.8);
      } else {
        this.alphas[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }
}
