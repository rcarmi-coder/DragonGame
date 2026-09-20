// ==========================================================
// DRAGON FURY - ADMINISTRADOR DE ENTRADA Y MANDO PLAYSTATION
// ==========================================================
// Soporta DualShock 4 / DualSense de PlayStation vía Gamepad API
// con vibración háptica y controles simultáneos de Teclado y Ratón.

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    // Estado normalizado de controles
    this.state = {
      // Ejes de vuelo (-1 a 1)
      moveForward: 0,
      moveRight: 0,
      pitch: 0,      // Cabeceo (arriba/abajo)
      yaw: 0,        // Guiñada (izquierda/derecha)
      roll: 0,       // Alabeo (tonel)

      // Acciones analógicas y botones
      accelerate: 0, // Gatillo R2 o Shift
      brake: 0,      // Gatillo L2 o Ctrl
      flap: false,   // Cruz o Barra Espaciadora
      dive: false,   // Botón Círculo + picada

      // Ataques
      attackBreath: false,   // Cuadrado o Click Izquierdo
      attackProjectile: false,// Círculo o Click Derecho
      triggerUltimate: false,// Triángulo o Tecla F

      // Evasivas / Piruetas
      barrelRollLeft: false, // L1 o Tecla Q
      barrelRollRight: false,// R1 o Tecla E

      // Selección de Elemento (1: Fuego, 2: Hielo, 3: Agua, 4: Plantas)
      selectedElement: 'fire',

      // Cámara libre 360°
      cameraDeltaX: 0,
      cameraDeltaY: 0,
      centerCamera: false,

      // Estado del dispositivo
      gamepadConnected: false,
      gamepadId: ''
    };

    // Teclas activas
    this.keys = {};
    this.mouseButtons = {};
    this.pointerLocked = false;

    // Conexión del mando
    this.gamepadIndex = null;

    this.setupKeyboardMouse();
    this.setupGamepadListeners();
  }

  setupKeyboardMouse() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Selección numérica directa de elementos
      if (e.key === '1') this.state.selectedElement = 'fire';
      if (e.key === '2') this.state.selectedElement = 'ice';
      if (e.key === '3') this.state.selectedElement = 'water';
      if (e.key === '4') this.state.selectedElement = 'plants';

      // Superpoder
      if (e.code === 'KeyF' || e.code === 'KeyR') {
        this.state.triggerUltimate = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyF' || e.code === 'KeyR') {
        this.state.triggerUltimate = false;
      }
    });

    // Ratón
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseButtons.left = true;
      if (e.button === 2) this.mouseButtons.right = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons.left = false;
      if (e.button === 2) this.mouseButtons.right = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Movimiento del ratón para cámara orbital 360°
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.state.cameraDeltaX += e.movementX * 0.0025;
        this.state.cameraDeltaY += e.movementY * 0.0025;
      }
    });

    // Click en canvas para bloquear puntero
    this.canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock();
      }
    });
  }

  setupGamepadListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.state.gamepadConnected = true;
      this.state.gamepadId = e.gamepad.id;
      console.log('Mando conectado:', e.gamepad.id);
      this.vibrate(200, 0.4, 0.4);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.state.gamepadConnected = false;
        console.log('Mando desconectado');
      }
    });
  }

  // Vibración háptica en mando PlayStation
  vibrate(durationMs = 200, strongMag = 0.5, weakMag = 0.5) {
    if (this.gamepadIndex === null) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
      gp.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: durationMs,
        weakMagnitude: weakMag,
        strongMagnitude: strongMag
      }).catch(() => {});
    }
  }

  update() {
    // 1. Procesar entrada de Teclado y Ratón como base
    this.processKeyboardMouse();

    // 2. Sobrescribir o combinar con Mando PlayStation si está activo
    this.processGamepad();
  }

  processKeyboardMouse() {
    // Ejes de vuelo
    let forward = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    this.state.moveForward = forward;

    let right = 0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;
    this.state.moveRight = right;

    this.state.flap = !!this.keys['Space'];
    this.state.accelerate = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 1 : 0;
    this.state.brake = this.keys['ControlLeft'] || this.keys['ControlRight'] ? 1 : 0;

    // Piruetas
    this.state.barrelRollLeft = !!this.keys['KeyQ'];
    this.state.barrelRollRight = !!this.keys['KeyE'];

    // Ataques
    this.state.attackBreath = !!this.mouseButtons.left;
    this.state.attackProjectile = !!this.mouseButtons.right;
  }

  processGamepad() {
    if (this.gamepadIndex === null) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // Mapeo estándar PlayStation (DualShock / DualSense)
    // Botones:
    // 0: Cruz (Cross / X) -> Aleteo / Ascender
    // 1: Círculo (Circle / O) -> Proyectil explosivo
    // 2: Cuadrado (Square / []) -> Aliento continuo
    // 3: Triángulo (Triangle / /\) -> Superpoder
    // 4: L1 -> Tonel Izquierda
    // 5: R1 -> Tonel Derecha
    // 6: L2 -> Gatillo Freno
    // 7: R2 -> Gatillo Acelerador
    // 8: Create / Share
    // 9: Options
    // 10: L3 (Stick Izq click)
    // 11: R3 (Stick Der click) -> Centrar cámara
    // 12: D-Pad Arriba -> Fuego
    // 13: D-Pad Abajo -> Plantas
    // 14: D-Pad Izquierda -> Agua
    // 15: D-Pad Derecha -> Hielo

    const b = gp.buttons;

    if (b[0] && b[0].pressed) this.state.flap = true;
    if (b[2] && b[2].pressed) this.state.attackBreath = true;
    if (b[1] && b[1].pressed) this.state.attackProjectile = true;
    if (b[3] && b[3].pressed) this.state.triggerUltimate = true;

    if (b[4] && b[4].pressed) this.state.barrelRollLeft = true;
    if (b[5] && b[5].pressed) this.state.barrelRollRight = true;

    // Gatillos analógicos (0 a 1)
    if (b[7]) this.state.accelerate = Math.max(this.state.accelerate, b[7].value);
    if (b[6]) this.state.brake = Math.max(this.state.brake, b[6].value);

    // D-Pad para cambiar elementos
    if (b[12] && b[12].pressed) this.state.selectedElement = 'fire';
    if (b[15] && b[15].pressed) this.state.selectedElement = 'ice';
    if (b[14] && b[14].pressed) this.state.selectedElement = 'water';
    if (b[13] && b[13].pressed) this.state.selectedElement = 'plants';

    // R3 para centrar cámara
    if (b[11] && b[11].pressed) this.state.centerCamera = true;

    // Sticks analógicos con zona muerta (Deadzone: 0.15)
    const deadzone = 0.15;
    const applyDeadzone = (val) => Math.abs(val) > deadzone ? val : 0;

    // Stick Izquierdo: Vuelo y dirección
    const stickLX = applyDeadzone(gp.axes[0] || 0);
    const stickLY = applyDeadzone(gp.axes[1] || 0);
    if (Math.abs(stickLX) > 0) this.state.moveRight = stickLX;
    if (Math.abs(stickLY) > 0) this.state.moveForward = -stickLY;

    // Stick Derecho: Cámara libre 360°
    const stickRX = applyDeadzone(gp.axes[2] || 0);
    const stickRY = applyDeadzone(gp.axes[3] || 0);
    if (Math.abs(stickRX) > 0) this.state.cameraDeltaX += stickRX * 0.05;
    if (Math.abs(stickRY) > 0) this.state.cameraDeltaY += stickRY * 0.05;
  }

  consumeCameraDeltas() {
    const dx = this.state.cameraDeltaX;
    const dy = this.state.cameraDeltaY;
    this.state.cameraDeltaX = 0;
    this.state.cameraDeltaY = 0;
    return { dx, dy };
  }
}
