// ==========================================================
// DRAGON FURY - SHADER DE NIEVE REALISTA Y NUBES DE POLVO
// ==========================================================
// Shader con brillo especular de cristales de hielo (subsurface sparkle),
// gradiente altimétrico y sistema de partículas de nieve en polvo levantadas
// por el aleteo y los surcos al volar a baja altura o aterrizar.

import * as THREE from 'three';

export class SnowShader {
  static createTerrainMaterial() {
    // Material estándar modificado con GLSL para nieve hiperrealista
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirection = { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() };
      shader.uniforms.uSnowLevel = { value: 35.0 }; // Altura donde comienza la nieve

      // Inyectar uniforms y funciones de ruido para el brillo de los cristales de hielo
      shader.vertexShader = `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      );

      shader.fragmentShader = `
        uniform vec3 uSunDirection;
        uniform float uSnowLevel;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        // Pseudo-ruido para destellos de escarcha (Ice crystal sparkle)
        float sparkleNoise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }

        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        float height = vWorldPosition.y;
        float slope = 1.0 - max(0.0, dot(vWorldNormal, vec3(0.0, 1.0, 0.0)));

        // Colores de Biomas
        vec3 valleyRock = vec3(0.18, 0.22, 0.20);
        vec3 grassGreen = vec3(0.22, 0.35, 0.18);
        vec3 pureSnow = vec3(0.95, 0.97, 1.0);
        vec3 iceBlue = vec3(0.75, 0.88, 0.98);

        // Mezcla de terreno
        vec3 terrainColor = mix(grassGreen, valleyRock, smoothstep(0.15, 0.55, slope));

        // Transición a cumbres nevadas
        float snowFactor = smoothstep(uSnowLevel - 15.0, uSnowLevel + 12.0, height);
        snowFactor *= (1.0 - smoothstep(0.5, 0.85, slope)); // Las paredes casi verticales pierden nieve

        // Brillo especular de microcristales de nieve bajo el sol
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(uSunDirection + viewDir);
        float spec = pow(max(0.0, dot(vWorldNormal, halfDir)), 32.0);
        float sparkle = step(0.96, sparkleNoise(floor(vWorldPosition * 25.0))) * spec * 2.5;

        vec3 finalSnow = mix(pureSnow, iceBlue, 0.2) + vec3(sparkle);
        diffuseColor.rgb = mix(terrainColor, finalSnow, snowFactor);
        `
      );
    };

    return mat;
  }
}

// Sistema de Nubes de Polvo de Nieve Blanca
export class SnowDustSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 600;
    this.particleIndex = 0;

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.scales = new Float32Array(this.maxParticles);
    this.alphas = new Float32Array(this.maxParticles);
    this.velocities = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -999;
      this.positions[i * 3 + 2] = 0;
      this.scales[i] = 0;
      this.alphas[i] = 0;
      this.velocities.push(new THREE.Vector3());
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(this.scales, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    // Shader personalizado para partículas de polvo de nieve algodonoso
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0.96, 0.98, 1.0) }
      },
      vertexShader: `
        attribute float scale;
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = scale * (250.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          // Borde suave circular de nube
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float falloff = smoothstep(0.5, 0.05, dist);
          gl_FragColor = vec4(uColor, vAlpha * falloff * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.points = new THREE.Points(geometry, dustMaterial);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    // Sistema de surcos terrestres
    this.furrows = [];
    this.furrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a6572,
      transparent: true,
      opacity: 0.55
    });
  }

  // Generar polvo blanco cuando el dragón aletea cerca de la nieve
  emitSnowPuff(pos, intensity = 1.0, count = 6) {
    for (let i = 0; i < count; i++) {
      const idx = this.particleIndex;
      this.particleIndex = (this.particleIndex + 1) % this.maxParticles;

      // Dispersión radial
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() * 3.5 + 1.0) * intensity;
      const px = pos.x + Math.cos(angle) * spread;
      const py = pos.y + (Math.random() * 1.5 - 0.5);
      const pz = pos.z + Math.sin(angle) * spread;

      this.positions[idx * 3] = px;
      this.positions[idx * 3 + 1] = py;
      this.positions[idx * 3 + 2] = pz;

      this.scales[idx] = (Math.random() * 8.0 + 4.0) * intensity;
      this.alphas[idx] = 0.85;

      this.velocities[idx].set(
        Math.cos(angle) * (Math.random() * 4.0 + 2.0),
        Math.random() * 4.0 + 1.5,
        Math.sin(angle) * (Math.random() * 4.0 + 2.0)
      );
    }
  }

  // Crear surco en la nieve
  addFurrow(pos, direction, width = 2.5) {
    if (this.furrows.length > 80) {
      const old = this.furrows.shift();
      this.scene.remove(old);
      old.geometry.dispose();
    }

    const furrowGeo = new THREE.PlaneGeometry(width, 4.0);
    furrowGeo.rotateX(-Math.PI / 2);
    const furrowMesh = new THREE.Mesh(furrowGeo, this.furrowMaterial);
    furrowMesh.position.set(pos.x, pos.y + 0.1, pos.z);
    furrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    this.scene.add(furrowMesh);
    this.furrows.push(furrowMesh);
  }

  update(delta) {
    const posAttr = this.points.geometry.attributes.position;
    const scaleAttr = this.points.geometry.attributes.scale;
    const alphaAttr = this.points.geometry.attributes.alpha;

    for (let i = 0; i < this.maxParticles; i++) {
      if (this.alphas[i] > 0.005) {
        // Mover partículas
        this.positions[i * 3] += this.velocities[i].x * delta;
        this.positions[i * 3 + 1] += this.velocities[i].y * delta;
        this.positions[i * 3 + 2] += this.velocities[i].z * delta;

        // Resistencia del aire y gravedad suave
        this.velocities[i].x *= 0.94;
        this.velocities[i].y = Math.max(-0.5, this.velocities[i].y - delta * 1.5);
        this.velocities[i].z *= 0.94;

        // Expansión y desvanecimiento
        this.scales[i] += delta * 6.0;
        this.alphas[i] = Math.max(0, this.alphas[i] - delta * 0.55);
      } else {
        this.alphas[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }
}
