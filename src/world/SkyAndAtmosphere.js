// ==========================================================
// DRAGON FURY - ILUMINACIÓN CINEMATOGRÁFICA Y ATMÓSFERA
// ==========================================================
// Sol dinámico con sombras suaves (PCFSoftShadowMap), niebla
// atmosférica para montañas lejanas y cúpula de cielo degradada.

import * as THREE from 'three';

export class SkyAndAtmosphere {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.setupLighting();
    this.setupFogAndSky();
  }

  setupLighting() {
    // 1. Luz Hemisférica para tonalidades naturales (Cielo azul / Tierra cálida)
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x332211, 0.7);
    this.scene.add(this.hemiLight);

    // 2. Luz Solar Direccional con Sombras Suaves de Alta Resolución
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.sunLight.position.set(300, 450, 200);
    this.sunLight.castShadow = true;

    // Configuración de sombras nítidas estilo consola
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1200;

    const shadowDistance = 220;
    this.sunLight.shadow.camera.left = -shadowDistance;
    this.sunLight.shadow.camera.right = shadowDistance;
    this.sunLight.shadow.camera.top = shadowDistance;
    this.sunLight.shadow.camera.bottom = -shadowDistance;
    this.sunLight.shadow.bias = -0.0003;

    this.scene.add(this.sunLight);

    // Activar sombras suaves en el renderizador
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  setupFogAndSky() {
    // Niebla de profundidad para dar escala monumental a las montañas
    this.scene.fog = new THREE.FogExp2(0x8faec7, 0.0012);
    this.scene.background = new THREE.Color(0x8faec7);

    // Cúpula Celeste degradada
    const skyGeo = new THREE.SphereGeometry(1400, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x6ca3d4,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
  }

  // Hacer que la luz solar siga al dragón para sombras dinámicas siempre centradas
  update(dragonPos) {
    this.sunLight.position.set(
      dragonPos.x + 180,
      dragonPos.y + 350,
      dragonPos.z + 120
    );
    this.sunLight.target.position.copy(dragonPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
