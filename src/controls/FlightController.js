// ==========================================================
// DRAGON FURY - CONTROLADOR DE VUELO AERODINÁMICO Y CÁMARA 360°
// ==========================================================
// Físicas de sustentación, planeo, cabeceo, alabeo, toneles (barrel rolls),
// picada sísmica y cámara orbital libre con seguimiento elástico cinematográfico.

import * as THREE from 'three';

export class FlightController {
  constructor(dragon, camera, inputManager) {
    this.dragon = dragon;
    this.camera = camera;
    this.input = inputManager;

    // Vectores de posición y velocidad
    this.position = new THREE.Vector3(0, 45, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.forwardVector = new THREE.Vector3(0, 0, 1);
    this.upVector = new THREE.Vector3(0, 1, 0);

    // Parámetros de vuelo dinámico
    this.currentSpeed = 18.0;
    this.minSpeed = 6.0;
    this.cruiseSpeed = 22.0;
    this.maxSprintSpeed = 52.0;

    // Ángulos de orientación (radianes)
    this.pitch = 0;   // Inclinación morro arriba/abajo
    this.yaw = 0;     // Rumbo de dirección
    this.roll = 0;    // Inclinación lateral
    this.targetRoll = 0;

    // Piruetas acrobáticas
    this.isBarrelRolling = false;
    this.barrelRollProgress = 0;
    this.barrelRollDirection = 1; // 1: Derecha, -1: Izquierda

    // Picada sísmica
    this.isDiving = false;
    this.diveFactor = 0;

    // Estamina de vuelo
    this.stamina = 100;
    this.maxStamina = 100;

    // Cámara Orbital 360°
    this.cameraOrbitYaw = 0;     // Ángulo horizontal relativo al dragón
    this.cameraOrbitPitch = 0.2; // Ángulo vertical
    this.cameraDistance = 14.0;  // Distancia base al dragón
    this.cameraTargetDistance = 14.0;
    this.cameraCurrentPos = new THREE.Vector3();

    // Estado exportable para animación
    this.flightState = {
      speed: this.currentSpeed,
      isFlapping: false,
      isGliding: true,
      isDiving: false,
      isAttacking: false,
      pitchAngle: 0
    };

    // Inicializar posición del dragón
    this.dragon.group.position.copy(this.position);
  }

  update(delta, terrainHeightAtPos = 0) {
    const inp = this.input.state;

    // 1. Procesar Cámara Orbital 360° (Ratón o Stick Derecho)
    const { dx, dy } = this.input.consumeCameraDeltas();
    this.cameraOrbitYaw -= dx * 1.6;
    this.cameraOrbitPitch = Math.max(-0.6, Math.min(1.2, this.cameraOrbitPitch + dy * 1.6));

    if (inp.centerCamera) {
      this.cameraOrbitYaw *= 0.85;
      this.cameraOrbitPitch = THREE.MathUtils.lerp(this.cameraOrbitPitch, 0.2, 0.15);
    }

    // 2. Control de Pirueta: Tonel (Barrel Roll)
    if (!this.isBarrelRolling) {
      if (inp.barrelRollLeft) {
        this.startBarrelRoll(-1);
      } else if (inp.barrelRollRight) {
        this.startBarrelRoll(1);
      }
    }

    if (this.isBarrelRolling) {
      this.barrelRollProgress += delta * 4.5;
      this.roll = this.barrelRollDirection * this.barrelRollProgress * Math.PI * 2;
      if (this.barrelRollProgress >= 1.0) {
        this.isBarrelRolling = false;
        this.barrelRollProgress = 0;
        this.roll = 0;
      }
    }

    // 3. Control de Cabeceo (Pitch) y Guiñada (Yaw)
    const pitchInput = -inp.moveForward; // W / S o Stick Izq Y
    const yawInput = -inp.moveRight;     // A / D o Stick Izq X

    const turnRate = 1.9;
    this.yaw += yawInput * turnRate * delta;
    this.pitch = THREE.MathUtils.lerp(this.pitch, pitchInput * 0.95, delta * 4.0);

    // Alabeo natural al girar (Bank turn)
    if (!this.isBarrelRolling) {
      this.targetRoll = -yawInput * 0.85;
      this.roll = THREE.MathUtils.lerp(this.roll, this.targetRoll, delta * 5.0);
    }

    // 4. Gestión de Estamina, Aleteo y Aceleración
    let isFlapping = false;
    let targetSpeed = this.cruiseSpeed;

    if (inp.flap && this.stamina > 5) {
      isFlapping = true;
      this.stamina = Math.max(0, this.stamina - delta * 22);
      this.position.y += delta * 18.0; // Ganancia de altitud por aleteo
      targetSpeed += 6.0;
    } else {
      // Regeneración pasiva de estamina al planear
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 14);
    }

    // Acelerador R2 / Shift
    if (inp.accelerate > 0.05) {
      const boost = inp.accelerate;
      targetSpeed = THREE.MathUtils.lerp(this.cruiseSpeed, this.maxSprintSpeed, boost);
      this.stamina = Math.max(0, this.stamina - delta * 12 * boost);
    }

    // Freno L2 / Ctrl
    if (inp.brake > 0.05) {
      targetSpeed = THREE.MathUtils.lerp(this.cruiseSpeed, this.minSpeed, inp.brake);
    }

    // 5. Física de Picada (Dive-Bomb)
    this.isDiving = this.pitch > 0.35 && this.currentSpeed > 24;
    if (this.isDiving) {
      targetSpeed += this.pitch * 28.0; // Gravitación acelera la caída
    }

    // Suavizado de velocidad
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, delta * 3.5);

    // 6. Vector de Avance Tridimensional
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    this.forwardVector.set(
      sinYaw * cosPitch,
      -sinPitch,
      cosYaw * cosPitch
    ).normalize();

    // Desplazamiento
    this.velocity.copy(this.forwardVector).multiplyScalar(this.currentSpeed * delta);
    this.position.add(this.velocity);

    // 7. Colisión y Altitud con el Terreno
    const dragonHeightOffset = 3.0 * this.dragon.currentScale;
    const minAltitude = terrainHeightAtPos + dragonHeightOffset;

    let hitGround = false;
    if (this.position.y <= minAltitude) {
      if (this.isDiving && this.currentSpeed > 35) {
        hitGround = true; // Impacto sísmico contra el suelo
      }
      this.position.y = minAltitude;
      // Empuje hacia arriba al rozar tierra
      if (this.pitch > 0) this.pitch = -0.15;
    }

    // 8. Aplicar Orientación al Modelo del Dragón
    this.dragon.group.position.copy(this.position);

    // Rotación compuesta: Yaw -> Pitch -> Roll
    const euler = new THREE.Euler(this.pitch, this.yaw, this.roll, 'YXZ');
    this.dragon.group.quaternion.setFromEuler(euler);

    // 9. Actualizar Cámara Orbital Dinámica Cinemática
    this.updateCamera(delta);

    // 10. Actualizar Estado para Animaciones
    this.flightState.speed = this.currentSpeed;
    this.flightState.isFlapping = isFlapping;
    this.flightState.isGliding = !isFlapping;
    this.flightState.isDiving = this.isDiving;
    this.flightState.isAttacking = inp.attackBreath || inp.attackProjectile;
    this.flightState.pitchAngle = this.pitch;

    return {
      hitGround,
      diveSpeed: this.currentSpeed,
      isNearSnow: (this.position.y - terrainHeightAtPos) < (dragonHeightOffset + 4.5)
    };
  }

  startBarrelRoll(direction) {
    this.isBarrelRolling = true;
    this.barrelRollProgress = 0;
    this.barrelRollDirection = direction;
    this.input.vibrate(250, 0.4, 0.8);
  }

  updateCamera(delta) {
    // Escalar distancia de cámara con la velocidad y tamaño del dragón
    const sizeScale = this.dragon.currentScale;
    const speedRatio = (this.currentSpeed - this.minSpeed) / (this.maxSprintSpeed - this.minSpeed);
    this.cameraTargetDistance = (13.0 + speedRatio * 9.0) * sizeScale;

    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.cameraTargetDistance, delta * 3.0);

    // Ángulo absoluto de la cámara combinando el rumbo del dragón y la órbita manual
    const totalYaw = this.yaw + this.cameraOrbitYaw + Math.PI;
    const totalPitch = this.cameraOrbitPitch;

    const offsetX = Math.sin(totalYaw) * Math.cos(totalPitch) * this.cameraDistance;
    const offsetY = Math.sin(totalPitch) * this.cameraDistance + 2.5 * sizeScale;
    const offsetZ = Math.cos(totalYaw) * Math.cos(totalPitch) * this.cameraDistance;

    const desiredCamPos = new THREE.Vector3(
      this.position.x + offsetX,
      this.position.y + offsetY,
      this.position.z + offsetZ
    );

    // Suavizado elástico de cámara cinematográfica de PlayStation
    this.camera.position.lerp(desiredCamPos, delta * 7.0);

    // Mirar hacia un punto ligeramente adelantado del dragón
    const lookTarget = this.position.clone().add(
      this.forwardVector.clone().multiplyScalar(6.0 * sizeScale)
    );
    lookTarget.y += 1.2 * sizeScale;
    this.camera.lookAt(lookTarget);
  }
}
