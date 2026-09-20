// ==========================================================
// DRAGON FURY - SISTEMA DE EVOLUCIÓN Y METAMORFOSIS
// ==========================================================
// Gestiona el crecimiento en tiempo real, umbrales de puntos,
// estallido de luz cegadora, sonido épico y desbloqueo de superpoderes.

import * as THREE from 'three';

export class DragonEvolution {
  constructor(dragon, scene, soundManager) {
    this.dragon = dragon;
    this.scene = scene;
    this.audio = soundManager;

    this.points = 0;
    this.stage = 1; // 1: Cría Feroz, 2: Dragón Joven, 3: Anciano Colosal

    // Umbrales de puntos para metamorfosis
    this.thresholds = {
      stage2: 500,
      stage3: 1500
    };

    // Luz de estallido de metamorfosis
    this.evolutionFlashLight = new THREE.PointLight(0xfffae0, 0, 80);
    this.scene.add(this.evolutionFlashLight);
    this.flashTimer = 0;

    // Sistema de partículas de orbes de luz ascendentes
    this.initLightBurstParticles();
  }

  initLightBurstParticles() {
    this.particleCount = 200;
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.alphas = new Float32Array(this.particleCount);
    this.velocities = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -999;
      this.positions[i * 3 + 2] = 0;
      this.alphas[i] = 0;
      this.velocities.push(new THREE.Vector3());
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 25.0 * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float falloff = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(1.0, 0.9, 0.4, vAlpha * falloff);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.burstPoints = new THREE.Points(geo, mat);
    this.burstPoints.frustumCulled = false;
    this.scene.add(this.burstPoints);
  }

  addPoints(amount, onEvolvedCallback) {
    this.points += amount;

    // Comprobar evolución a Etapa 2
    if (this.stage === 1 && this.points >= this.thresholds.stage2) {
      this.stage = 2;
      this.triggerMetamorphosis(2, onEvolvedCallback);
    }
    // Comprobar evolución a Etapa 3
    else if (this.stage === 2 && this.points >= this.thresholds.stage3) {
      this.stage = 3;
      this.triggerMetamorphosis(3, onEvolvedCallback);
    }
  }

  triggerMetamorphosis(newStage, callback) {
    // 1. Escalar al dragón
    this.dragon.evolveToStage(newStage);

    // 2. Disparar fanfarria orquestal épica y rugido de bestia ancestral
    this.audio.playEvolutionFanfare();

    // 3. Estallido de Luz Cegadora
    const pos = this.dragon.group.position;
    this.evolutionFlashLight.position.copy(pos);
    this.evolutionFlashLight.intensity = 15.0;
    this.flashTimer = 1.8;

    // 4. Emitir partículas de orbes dorados
    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = pos.y;
      this.positions[i * 3 + 2] = pos.z;
      this.alphas[i] = 1.0;

      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const speed = Math.random() * 25.0 + 15.0;

      this.velocities[i].set(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed + 5.0,
        Math.cos(theta) * speed
      );
    }

    if (callback) {
      const stageName = newStage === 2 ? 'DRAGÓN JOVEN' : 'DRAGÓN ANCIANO COLOSAL';
      const powerUnlocked = newStage === 2
        ? '¡Desbloqueado: Proyectiles Balísticos Concentrados!'
        : '¡Desbloqueado: SUPERPODERES DEFINITIVOS DE CATACLISMO!';
      callback(stageName, powerUnlocked);
    }
  }

  update(delta) {
    // Atenuar destello de luz
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      this.evolutionFlashLight.intensity = Math.max(0, this.flashTimer * 10.0);
    }

    // Mover partículas del estallido
    const posAttr = this.burstPoints.geometry.attributes.position;
    const alphaAttr = this.burstPoints.geometry.attributes.alpha;

    for (let i = 0; i < this.particleCount; i++) {
      if (this.alphas[i] > 0.01) {
        this.positions[i * 3] += this.velocities[i].x * delta;
        this.positions[i * 3 + 1] += this.velocities[i].y * delta;
        this.positions[i * 3 + 2] += this.velocities[i].z * delta;

        this.velocities[i].multiplyScalar(0.96);
        this.alphas[i] = Math.max(0, this.alphas[i] - delta * 0.8);
      }
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }
}
