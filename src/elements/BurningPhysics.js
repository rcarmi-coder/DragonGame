// ==========================================================
// DRAGON FURY - MOTOR DE FÍSICAS DE COMBUSTIÓN Y DESTRUCCIÓN
// ==========================================================
// Sistema que quema todo elemento inflamable en el mundo:
// árboles, torres de madera, empalizadas y vegetación.
// Se carbonizan progresivamente, emiten fuego y humo volumétrico,
// y colapsan en cenizas. El agua y el hielo extinguen las llamas.

import * as THREE from 'three';

export class BurningPhysics {
  constructor(scene) {
    this.scene = scene;
    this.burnables = []; // Entidades inflamables registradas
    this.fireParticles = [];

    // Sistema de partículas de fuego y humo compartido
    this.initParticleSystem();
  }

  initParticleSystem() {
    this.maxFireParticles = 800;
    this.fireIndex = 0;

    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxFireParticles * 3);
    this.colors = new Float32Array(this.maxFireParticles * 3);
    this.sizes = new Float32Array(this.maxFireParticles);
    this.alphas = new Float32Array(this.maxFireParticles);
    this.velocities = [];

    for (let i = 0; i < this.maxFireParticles; i++) {
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

    const fireMat = new THREE.ShaderMaterial({
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
          gl_PointSize = size * (200.0 / -mvPosition.z);
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
          float falloff = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, vAlpha * falloff);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.firePoints = new THREE.Points(geo, fireMat);
    this.firePoints.frustumCulled = false;
    this.scene.add(this.firePoints);
  }

  // Registrar un objeto como inflamable (árbol, torre, empalizada)
  registerBurnable(object3D, options = {}) {
    const burnable = {
      object: object3D,
      isFlammable: options.isFlammable !== false, // Las rocas son false, madera/plantas true
      isBurning: false,
      burnProgress: 0.0,  // 0 a 1 (1 = totalmente destruido/cenizas)
      burnRate: options.burnRate || 0.15,
      health: options.health || 100,
      originalMaterials: [],
      boundsRadius: options.radius || 3.0,
      position: object3D.position,
      onCollapsed: options.onCollapsed || null
    };

    // Guardar materiales originales para transición a carbonizado
    object3D.traverse((child) => {
      if (child.isMesh && child.material) {
        burnable.originalMaterials.push({
          mesh: child,
          origColor: child.material.color ? child.material.color.clone() : null
        });
      }
    });

    this.burnables.push(burnable);
    return burnable;
  }

  // Intentar prender fuego en una posición con cierto radio
  igniteAt(position, radius = 5.0) {
    let ignitedCount = 0;
    for (const item of this.burnables) {
      if (!item.isFlammable || item.burnProgress >= 1.0) continue;

      const dist = position.distanceTo(item.position);
      if (dist <= (radius + item.boundsRadius)) {
        if (!item.isBurning) {
          item.isBurning = true;
          ignitedCount++;
        }
      }
    }
    return ignitedCount;
  }

  // Extinguir fuego con Hielo o Agua
  extinguishAt(position, radius = 8.0) {
    for (const item of this.burnables) {
      if (item.isBurning) {
        const dist = position.distanceTo(item.position);
        if (dist <= (radius + item.boundsRadius)) {
          item.isBurning = false;
        }
      }
    }
  }

  emitFireParticle(pos, isSmoke = false) {
    const idx = this.fireIndex;
    this.fireIndex = (this.fireIndex + 1) % this.maxFireParticles;

    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.5;

    this.positions[idx * 3] = pos.x + Math.cos(angle) * r;
    this.positions[idx * 3 + 1] = pos.y + Math.random() * 2.0;
    this.positions[idx * 3 + 2] = pos.z + Math.sin(angle) * r;

    if (isSmoke) {
      this.colors[idx * 3] = 0.15;
      this.colors[idx * 3 + 1] = 0.15;
      this.colors[idx * 3 + 2] = 0.15;
      this.sizes[idx] = Math.random() * 7.0 + 5.0;
      this.alphas[idx] = 0.5;
      this.velocities[idx].set(Math.cos(angle) * 0.5, Math.random() * 3.0 + 2.0, Math.sin(angle) * 0.5);
    } else {
      // Fuego ardiente (rojo, naranja, amarillo)
      this.colors[idx * 3] = 1.0;
      this.colors[idx * 3 + 1] = Math.random() * 0.6 + 0.2;
      this.colors[idx * 3 + 2] = 0.05;
      this.sizes[idx] = Math.random() * 6.0 + 3.0;
      this.alphas[idx] = 0.9;
      this.velocities[idx].set(Math.cos(angle) * 0.8, Math.random() * 4.0 + 3.0, Math.sin(angle) * 0.8);
    }
  }

  update(delta) {
    // 1. Actualizar propagación y consumo de entidades en llamas
    for (let i = this.burnables.length - 1; i >= 0; i--) {
      const item = this.burnables[i];
      if (item.isBurning && item.burnProgress < 1.0) {
        item.burnProgress += delta * item.burnRate;

        // Emitir partículas de fuego y humo
        this.emitFireParticle(item.position, false);
        if (Math.random() < 0.4) {
          this.emitFireParticle(item.position, true);
        }

        // Carbonizar los materiales visualmente (negro carbón)
        const charFactor = 1.0 - Math.min(1.0, item.burnProgress * 1.5);
        item.originalMaterials.forEach(({ mesh, origColor }) => {
          if (mesh.material && origColor) {
            mesh.material.color.r = origColor.r * charFactor;
            mesh.material.color.g = origColor.g * charFactor;
            mesh.material.color.b = origColor.b * charFactor;
          }
        });

        // Colapso estructural si se consume por completo
        if (item.burnProgress >= 1.0) {
          item.isBurning = false;
          // Colapso en cenizas
          item.object.scale.set(0.2, 0.05, 0.2);
          item.object.position.y -= 0.5;
          if (item.onCollapsed) item.onCollapsed();
        }
      }
    }

    // 2. Actualizar partículas de fuego en la GPU
    const posAttr = this.firePoints.geometry.attributes.position;
    const colAttr = this.firePoints.geometry.attributes.color;
    const sizeAttr = this.firePoints.geometry.attributes.size;
    const alphaAttr = this.firePoints.geometry.attributes.alpha;

    for (let i = 0; i < this.maxFireParticles; i++) {
      if (this.alphas[i] > 0.01) {
        this.positions[i * 3] += this.velocities[i].x * delta;
        this.positions[i * 3 + 1] += this.velocities[i].y * delta;
        this.positions[i * 3 + 2] += this.velocities[i].z * delta;

        this.sizes[i] += delta * 2.0;
        this.alphas[i] = Math.max(0, this.alphas[i] - delta * 1.2);
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
