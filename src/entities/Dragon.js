// ==========================================================
// DRAGON FURY - MODELO 3D Y ANIMACIÓN DEL DRAGÓN (PBR)
// ==========================================================
// Construcción procedural jerárquica de alta definición para
// Ignisferus y Zephyron con esqueleto animable, alas de membrana,
// cuernos medievales, cola serpenteante y evolución de escala.

import * as THREE from 'three';

export class Dragon {
  constructor(type = 'ignisferus') {
    this.type = type;
    this.group = new THREE.Group();

    // Estado y estadísticas base
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    this.growthRate = 1.0;
    this.evolutionStage = 1; // 1: Cría, 2: Joven, 3: Anciano Colosal

    // Articulaciones para animación
    this.joints = {
      neck: null,
      head: null,
      jaw: null,
      leftWingBase: null,
      leftWingMid: null,
      rightWingBase: null,
      rightWingMid: null,
      tailSegments: [],
      body: null
    };

    // Variables de ciclo de animación
    this.wingAnimTime = 0;
    this.tailAnimTime = 0;
    this.isFlapping = false;
    this.isGliding = true;
    this.isDiving = false;
    this.isRoaring = false;
    this.roarTime = 0;

    // Colores según tipo de dragón
    this.config = this.getDragonConfig(type);

    this.buildModel();
  }

  getDragonConfig(type) {
    if (type === 'zephyron') {
      return {
        name: 'ZEPHYRON',
        bodyColor: 0x1a243b,     // Azul zafiro oscuro / sombrío
        bellyColor: 0x2e4263,    // Escamas ventrales celestes oscuras
        wingColor: 0x0f1726,     // Membrana oscura sombría
        hornColor: 0xddeeff,     // Cuernos de marfil místico
        glowColor: 0x00d0ff,     // Ojos y resplandor cian
        roughness: 0.35,
        metalness: 0.45,
        wingSpanRatio: 1.35      // Alas más largas y esbeltas
      };
    }
    // Ignisferus (por defecto)
    return {
      name: 'IGNISFERUS',
      bodyColor: 0x8a1505,       // Rojo carmesí volcánico
      bellyColor: 0xcc4411,      // Naranja magma
      wingColor: 0x220505,       // Membrana carbonizada
      hornColor: 0x151515,       // Cuernos de obsidiana negra
      glowColor: 0xff4400,       // Ojos de fuego abrasador
      roughness: 0.5,
      metalness: 0.35,
      wingSpanRatio: 1.05        // Alas robustas de guerra
    };
  }

  buildModel() {
    const cfg = this.config;

    // Materiales PBR
    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.bodyColor,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      flatShading: false
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: cfg.bellyColor,
      roughness: 0.6,
      metalness: 0.2
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: cfg.wingColor,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: cfg.hornColor,
      roughness: 0.2,
      metalness: 0.6
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: cfg.glowColor,
      emissive: cfg.glowColor,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });

    // 1. Cuerpo Principal (Torso Musculoso)
    const torsoGeo = new THREE.ConeGeometry(1.6, 4.2, 8);
    torsoGeo.rotateX(Math.PI / 2);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.group.add(torso);
    this.joints.body = torso;

    // Pecho / Placas ventrales
    const chestGeo = new THREE.BoxGeometry(1.4, 1.2, 2.8);
    const chest = new THREE.Mesh(chestGeo, bellyMat);
    chest.position.set(0, -0.6, 0.2);
    torso.add(chest);

    // 2. Cuello Articulado
    const neckBase = new THREE.Group();
    neckBase.position.set(0, 0.5, 2.0);
    torso.add(neckBase);

    const neckGeo = new THREE.CylinderGeometry(0.7, 1.1, 1.8, 8);
    neckGeo.rotateX(Math.PI / 3);
    const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
    neckMesh.position.set(0, 0.8, 0.6);
    neckMesh.castShadow = true;
    neckBase.add(neckMesh);
    this.joints.neck = neckBase;

    // 3. Cabeza Imponente y Feroz
    const head = new THREE.Group();
    head.position.set(0, 1.6, 1.2);
    neckBase.add(head);
    this.joints.head = head;

    // Bóveda craneal
    const skullGeo = new THREE.BoxGeometry(1.2, 1.0, 1.8);
    const skull = new THREE.Mesh(skullGeo, bodyMat);
    skull.position.set(0, 0.2, 0.4);
    skull.castShadow = true;
    head.add(skull);

    // Hocico / Mandíbula superior con dientes
    const snoutGeo = new THREE.ConeGeometry(0.8, 1.8, 6);
    snoutGeo.rotateX(-Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeo, bodyMat);
    snout.position.set(0, 0.05, 1.8);
    snout.castShadow = true;
    head.add(snout);

    // Mandíbula inferior (móvil para rugir)
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.3, 0.5);
    const jawGeo = new THREE.BoxGeometry(0.9, 0.35, 1.6);
    const jawMesh = new THREE.Mesh(jawGeo, bellyMat);
    jawMesh.position.set(0, -0.1, 0.7);
    jaw.add(jawMesh);
    head.add(jaw);
    this.joints.jaw = jaw;

    // Ojos ardientes
    const eyeGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.55, 0.35, 0.8);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.55, 0.35, 0.8);
    head.add(rightEye);

    // Cuernos Medievales Impresionantes
    this.buildHorns(head, hornMat);

    // 4. Alas de Membrana Articuladas (Izquierda y Derecha)
    this.buildWings(torso, bodyMat, wingMat, cfg.wingSpanRatio);

    // 5. Cola Larga y Articulada (5 segmentos)
    this.buildTail(torso, bodyMat, hornMat);

    // 6. Patas y Garras
    this.buildLegs(torso, bodyMat, hornMat);

    // Inicializar escala
    this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
  }

  buildHorns(head, hornMat) {
    // Cuernos principales hacia atrás
    const hornGeo = new THREE.ConeGeometry(0.25, 2.2, 6);
    hornGeo.rotateX(-Math.PI / 2.6);

    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(0.5, 0.8, -0.2);
    leftHorn.rotation.z = -0.25;
    leftHorn.castShadow = true;
    head.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(-0.5, 0.8, -0.2);
    rightHorn.rotation.z = 0.25;
    rightHorn.castShadow = true;
    head.add(rightHorn);

    // Cuernos secundarios de la sien
    const sideHornGeo = new THREE.ConeGeometry(0.16, 1.2, 5);
    sideHornGeo.rotateX(-Math.PI / 3);

    const leftSideHorn = new THREE.Mesh(sideHornGeo, hornMat);
    leftSideHorn.position.set(0.7, 0.4, 0.2);
    leftSideHorn.rotation.z = -0.5;
    head.add(leftSideHorn);

    const rightSideHorn = new THREE.Mesh(sideHornGeo, hornMat);
    rightSideHorn.position.set(-0.7, 0.4, 0.2);
    rightSideHorn.rotation.z = 0.5;
    head.add(rightSideHorn);
  }

  buildWings(torso, boneMat, wingMat, spanRatio) {
    const createWing = (isLeft) => {
      const side = isLeft ? 1 : -1;
      const wingBase = new THREE.Group();
      wingBase.position.set(side * 1.2, 0.8, 0.6);
      torso.add(wingBase);

      // Brazo superior de ala (Húmero)
      const armGeo = new THREE.CylinderGeometry(0.28, 0.35, 3.2 * spanRatio, 6);
      armGeo.rotateZ(side * Math.PI / 3);
      const arm = new THREE.Mesh(armGeo, boneMat);
      arm.position.set(side * 1.4 * spanRatio, 0.5, 0);
      arm.castShadow = true;
      wingBase.add(arm);

      // Codo del ala y dedos de membrana
      const wingMid = new THREE.Group();
      wingMid.position.set(side * 2.8 * spanRatio, 1.1, 0);
      wingBase.add(wingMid);

      // Membrana del ala poligonal
      const membraneShape = new THREE.Shape();
      membraneShape.moveTo(0, 0);
      membraneShape.lineTo(side * 4.5 * spanRatio, 1.8);
      membraneShape.lineTo(side * 6.5 * spanRatio, -0.8);
      membraneShape.lineTo(side * 4.0 * spanRatio, -3.2);
      membraneShape.lineTo(side * 1.2 * spanRatio, -2.4);
      membraneShape.closePath();

      const membraneGeo = new THREE.ShapeGeometry(membraneShape);
      const membrane = new THREE.Mesh(membraneGeo, wingMat);
      membrane.position.set(0, 0, 0);
      membrane.castShadow = true;
      wingMid.add(membrane);

      return { wingBase, wingMid };
    };

    const left = createWing(true);
    const right = createWing(false);

    this.joints.leftWingBase = left.wingBase;
    this.joints.leftWingMid = left.wingMid;
    this.joints.rightWingBase = right.wingBase;
    this.joints.rightWingMid = right.wingMid;
  }

  buildTail(torso, bodyMat, hornMat) {
    let parent = torso;
    const segmentCount = 6;
    let length = 1.6;
    let radius = 0.7;

    for (let i = 0; i < segmentCount; i++) {
      const segGroup = new THREE.Group();
      if (i === 0) {
        segGroup.position.set(0, 0.1, -1.9);
      } else {
        segGroup.position.set(0, 0, -length);
      }
      parent.add(segGroup);

      const segGeo = new THREE.CylinderGeometry(radius * 0.75, radius, length, 6);
      segGeo.rotateX(-Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, bodyMat);
      segMesh.position.set(0, 0, -length * 0.5);
      segMesh.castShadow = true;
      segGroup.add(segMesh);

      // Púa ósea dorsal en la cola
      const spineGeo = new THREE.ConeGeometry(0.15, 0.8, 4);
      const spine = new THREE.Mesh(spineGeo, hornMat);
      spine.position.set(0, radius * 0.8, -length * 0.5);
      spine.rotation.x = -0.4;
      segGroup.add(spine);

      this.joints.tailSegments.push(segGroup);
      parent = segGroup;
      radius *= 0.78;
      length *= 0.92;
    }

    // Punta de lanza / cuchilla de la cola
    const tipGeo = new THREE.ConeGeometry(0.4, 1.4, 4);
    tipGeo.rotateX(-Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, hornMat);
    tip.position.set(0, 0, -length);
    tip.castShadow = true;
    parent.add(tip);
  }

  buildLegs(torso, bodyMat, hornMat) {
    const createLeg = (x, z) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, -0.8, z);
      torso.add(legGroup);

      const thighGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.4, 6);
      const thigh = new THREE.Mesh(thighGeo, bodyMat);
      thigh.position.set(0, -0.6, 0);
      legGroup.add(thigh);

      // Garras
      const footGeo = new THREE.BoxGeometry(0.6, 0.25, 0.9);
      const foot = new THREE.Mesh(footGeo, hornMat);
      foot.position.set(0, -1.3, 0.2);
      legGroup.add(foot);
    };

    createLeg(1.1, 0.8);   // Delantera izq
    createLeg(-1.1, 0.8);  // Delantera der
    createLeg(1.2, -1.0);  // Trasera izq
    createLeg(-1.2, -1.0); // Trasera der
  }

  // Animación por frame
  update(delta, flightState) {
    // 1. Manejo de Metamorfosis / Crecimiento suave
    if (Math.abs(this.currentScale - this.targetScale) > 0.005) {
      this.currentScale += (this.targetScale - this.currentScale) * delta * 2.5;
      this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }

    // 2. Frecuencia y modo de aleteo
    const speed = flightState.speed || 1.0;
    const isFlapping = flightState.isFlapping;
    const isDiving = flightState.isDiving;

    const flapRate = isFlapping ? 9.0 : (speed > 25 ? 2.5 : 4.0);
    this.wingAnimTime += delta * flapRate;

    // Ángulo de aleteo básico
    let wingAngle = Math.sin(this.wingAnimTime) * 0.65;
    if (isDiving) {
      // Alas recogidas en picada aerodinámica
      wingAngle = 0.85;
    }

    // Aplicar a las articulaciones de las alas
    if (this.joints.leftWingBase && this.joints.rightWingBase) {
      this.joints.leftWingBase.rotation.z = wingAngle;
      this.joints.rightWingBase.rotation.z = -wingAngle;

      // Flexión secundaria de la membrana
      const midAngle = Math.cos(this.wingAnimTime) * 0.35;
      this.joints.leftWingMid.rotation.z = midAngle;
      this.joints.rightWingMid.rotation.z = -midAngle;
    }

    // 3. Serpenteo natural de la cola
    this.tailAnimTime += delta * 4.0;
    this.joints.tailSegments.forEach((seg, idx) => {
      const phase = this.tailAnimTime - idx * 0.45;
      seg.rotation.y = Math.sin(phase) * 0.15;
      seg.rotation.x = Math.cos(phase * 0.8) * 0.08;
    });

    // 4. Inclinación del cuello según cabeceo
    if (this.joints.neck) {
      this.joints.neck.rotation.x = (flightState.pitchAngle || 0) * 0.4;
    }

    // 5. Apertura de mandíbula en rugido o ataque
    if (this.isRoaring) {
      this.roarTime += delta;
      this.joints.jaw.rotation.x = -0.55;
      if (this.roarTime > 1.8) {
        this.isRoaring = false;
        this.roarTime = 0;
      }
    } else if (flightState.isAttacking) {
      this.joints.jaw.rotation.x = -0.45;
    } else {
      this.joints.jaw.rotation.x = -0.05;
    }
  }

  // Activar rugido visual
  triggerRoar() {
    this.isRoaring = true;
    this.roarTime = 0;
  }

  // Subir de etapa evolutiva
  evolveToStage(stage) {
    this.evolutionStage = stage;
    if (stage === 1) this.targetScale = 1.0;  // Cría feroz
    if (stage === 2) this.targetScale = 1.7;  // Dragón joven
    if (stage === 3) this.targetScale = 2.8;  // Anciano colosal
  }
}
