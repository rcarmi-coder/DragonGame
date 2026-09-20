// ==========================================================
// DRAGON FURY - MUNDO ABIERTO Y GENERACIÓN DE TERRENO
// ==========================================================
// Terreno continuo con biomas: valles exuberantes, gargantas
// escarpadas y majestuosas cumbres nevadas con cálculo de altura exacto.

import * as THREE from 'three';
import { SnowShader } from './SnowShader.js';

export class WorldTerrain {
  constructor(scene) {
    this.scene = scene;
    this.size = 2000;         // Dimensión del mundo abierto (2000x2000 unidades)
    this.segments = 250;      // Resolución de malla para relieve detallado
    this.maxHeight = 160.0;   // Altura de las cumbres más altas
    this.snowAltitude = 45.0; // Línea de nieve

    this.mesh = null;
    this.geometry = null;

    this.buildTerrain();
  }

  // Función matemática armónica de relieve procedural continuo
  getHeight(x, z) {
    // Escalas de frecuencia múltiples (octavas de terreno fractal)
    const scale1 = 0.0018;
    const scale2 = 0.006;
    const scale3 = 0.018;

    // Colinas base suaves
    let h = Math.sin(x * scale1) * Math.cos(z * scale1) * 45.0;

    // Cadenas montañosas escarpadas
    const ridges = Math.abs(Math.sin(x * scale2 + Math.cos(z * scale2) * 1.5));
    h += Math.pow(ridges, 1.8) * 85.0;

    // Micro relieve y crestas de roca
    h += Math.sin(x * scale3 + z * scale3) * 8.0;

    // Valle central despejado para vuelo y castillos
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 250) {
      const flatten = distFromCenter / 250;
      h = h * flatten + (1 - flatten) * 6.0;
    }

    return Math.max(0, h);
  }

  buildTerrain() {
    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    const pos = this.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getHeight(vx, vz);
      pos.setY(i, vy);
    }

    this.geometry.computeVertexNormals();

    const mat = SnowShader.createTerrainMaterial();
    this.mesh = new THREE.Mesh(this.geometry, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);

    // Borde de agua místico en los límites del valle
    this.buildWater();
  }

  buildWater() {
    const waterGeo = new THREE.PlaneGeometry(this.size * 1.2, this.size * 1.2);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x005577,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1.8;
    this.scene.add(water);
  }

  // Saber si en cierta coordenada hay nieve realista
  isSnowAt(x, z) {
    return this.getHeight(x, z) >= (this.snowAltitude - 5.0);
  }
}
