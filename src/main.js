// ==========================================================
// DRAGON FURY - BUCLE PRINCIPAL Y COORDINACIÓN DEL JUEGO
// ==========================================================

import * as THREE from 'three';
import { SoundManager } from './audio/SoundManager.js';
import { InputManager } from './controls/InputManager.js';
import { FlightController } from './controls/FlightController.js';
import { Dragon } from './entities/Dragon.js';
import { DragonEvolution } from './entities/DragonEvolution.js';
import { WorldTerrain } from './world/WorldTerrain.js';
import { SnowDustSystem } from './world/SnowShader.js';
import { BurningPhysics } from './elements/BurningPhysics.js';
import { Forest } from './world/Forest.js';
import { KnightSquad } from './entities/Knight.js';
import { TowerManager } from './entities/Tower.js';
import { BossDragon } from './entities/BossDragon.js';
import { ElementalSystem } from './elements/ElementalSystem.js';
import { SkyAndAtmosphere } from './world/SkyAndAtmosphere.js';
import { PlayStationHUD } from './ui/PlayStationHUD.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.selectedDragonType = 'ignisferus';
    this.isPlaying = false;
    this.playerHealth = 100;
    this.maxHealth = 100;

    this.initRenderer();
    this.setupUIListeners();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 3000);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupUIListeners() {
    const cards = document.querySelectorAll('.dragon-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedDragonType = card.dataset.dragon;
      });
    });

    const startBtn = document.getElementById('btn-start-game');
    startBtn.addEventListener('click', () => {
      this.startGame();
    });

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }

  startGame() {
    // 1. Ocultar pantalla de título y mostrar HUD
    document.getElementById('title-screen').classList.remove('active');
    document.getElementById('title-screen').classList.add('hidden');

    this.hud = new PlayStationHUD();
    this.hud.show();

    // 2. Inicializar subsistemas
    this.audio = new SoundManager();
    this.audio.init();

    this.input = new InputManager(this.canvas);
    this.sky = new SkyAndAtmosphere(this.scene, this.renderer);
    this.terrain = new WorldTerrain(this.scene);
    this.snowDust = new SnowDustSystem(this.scene);
    this.burning = new BurningPhysics(this.scene);
    this.forest = new Forest(this.scene, this.terrain, this.burning);

    // 3. Crear Dragón Jugador
    this.dragon = new Dragon(this.selectedDragonType);
    this.scene.add(this.dragon.group);

    this.hud.setDragonInfo(this.dragon.config.name, 'CRÍA FEROZ');

    this.flight = new FlightController(this.dragon, this.camera, this.input);
    this.evolution = new DragonEvolution(this.dragon, this.scene, this.audio);
    this.elementals = new ElementalSystem(this.scene, this.burning, this.audio);

    // 4. Crear Enemigos y Torres
    this.knights = new KnightSquad(this.scene, this.terrain, this.burning, 45);
    this.towers = new TowerManager(this.scene, this.terrain, this.burning);

    // 5. Crear Jefe Dragón Titán de los 4 Elementos
    this.boss = new BossDragon(this.scene, this.terrain, this.elementals);

    this.isPlaying = true;
    this.clock = new THREE.Clock();

    // Rugido inicial épico de despertar
    this.audio.playAncestralRoar();
    this.dragon.triggerRoar();
    this.input.vibrate(500, 0.8, 0.8);

    this.hud.showCinematicBanner(
      '¡EL DESPERTAR DE LA FURIA!',
      'Destruye torres medievales, derrota caballeros y evoluciona a tu dragón'
    );

    // Iniciar bucle de juego
    this.animate();
  }

  animate() {
    if (!this.isPlaying) return;
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Actualizar entrada
    this.input.update();

    // 2. Obtener altura del terreno bajo el dragón
    const dPos = this.dragon.group.position;
    const terrainH = this.terrain.getHeight(dPos.x, dPos.z);
    const isSnowyArea = this.terrain.isSnowAt(dPos.x, dPos.z);

    // 3. Actualizar física de vuelo y cámara
    const flightInfo = this.flight.update(delta, terrainH);

    // 4. Interacción con Nieve Realista (Nubes de polvo blanco y surcos)
    if (isSnowyArea && flightInfo.isNearSnow) {
      this.snowDust.emitSnowPuff(dPos, this.dragon.currentScale, flightInfo.diveSpeed > 30 ? 10 : 4);
      if (Math.random() < 0.3) {
        this.snowDust.addFurrow(dPos, this.flight.forwardVector, 3.0 * this.dragon.currentScale);
      }
    }

    // Impacto sísmico contra el suelo
    if (flightInfo.hitGround) {
      this.audio.playExplosion();
      this.input.vibrate(600, 1.0, 1.0);
      this.burning.igniteAt(dPos, 15.0 * this.dragon.currentScale);
      this.towers.checkHit(dPos, 20.0 * this.dragon.currentScale, () => {
        this.onTargetDestroyed(120, '¡TORRE APLASTADA EN PICADA!');
      });
      if (isSnowyArea) {
        this.snowDust.emitSnowPuff(dPos, this.dragon.currentScale * 2.5, 25);
      }
    }

    // 5. Animación del Dragón
    this.dragon.update(delta, this.flight.flightState);

    // 6. Alientos y Ataques del Jugador
    this.handlePlayerAttacks(delta);

    // 7. Actualizar Sistemas del Mundo
    this.snowDust.update(delta);
    this.burning.update(delta);
    this.elementals.update(delta, this.terrain);
    this.evolution.update(delta);
    this.sky.update(dPos);

    // 8. Actualizar Enemigos
    this.knights.update(delta, dPos, (knightPos) => {
      this.onTargetDestroyed(35, 'Caballero Derrotado');
    });

    // 9. Actualizar Jefe Final
    this.updateBossLogic(delta, dPos);

    // 10. Actualizar HUD PlayStation
    this.updateHUD();

    // 11. Renderizado de escena
    this.renderer.render(this.scene, this.camera);
  }

  handlePlayerAttacks(delta) {
    const inp = this.input.state;
    const dPos = this.dragon.group.position;
    const fwd = this.flight.forwardVector;
    const dragonScale = this.dragon.currentScale;

    // Origen del aliento en las fauces del dragón
    const mouthPos = dPos.clone().add(fwd.clone().multiplyScalar(4.0 * dragonScale));
    mouthPos.y += 0.8 * dragonScale;

    // Ataque 1: Aliento Continuo (Botón Cuadrado / Click Izquierdo)
    if (inp.attackBreath) {
      this.elementals.emitBreath(mouthPos, fwd, inp.selectedElement, dragonScale);
      this.input.vibrate(60, 0.2, 0.4);

      // Comprobar daño a torres
      this.towers.checkHit(mouthPos.clone().add(fwd.clone().multiplyScalar(15)), 6.0, () => {
        this.onTargetDestroyed(100, '¡Torre Incendiada y Destruida!');
      });

      // Daño al Jefe
      if (this.boss.isActive) {
        const distToBoss = mouthPos.distanceTo(this.boss.group.position);
        if (distToBoss < 45 * dragonScale) {
          const bossDead = this.boss.takeDamage(delta * 220);
          if (bossDead) this.onBossDefeated();
        }
      }
    }

    // Ataque 2: Proyectil Cargado (Botón Círculo / Click Derecho)
    if (inp.attackProjectile && (!this.lastProjectileTime || (performance.now() - this.lastProjectileTime > 500))) {
      this.lastProjectileTime = performance.now();
      this.elementals.fireProjectile(mouthPos, fwd, inp.selectedElement, dragonScale);
      this.input.vibrate(180, 0.6, 0.8);
    }

    // Ataque 3: Superpoder Definitivo (Botón Triángulo / Tecla F)
    if (inp.triggerUltimate) {
      if (this.evolution.stage < 2) {
        this.hud.showCinematicBanner('SUPERPODER BLOQUEADO', 'Acumula 500 puntos para desbloquear la Furia Elemental', 2500);
      } else {
        const triggered = this.elementals.triggerUltimate(dPos, inp.selectedElement);
        if (triggered) {
          this.dragon.triggerRoar();
          this.input.vibrate(1000, 1.0, 1.0);
          this.hud.showCinematicBanner(
            `¡SUPERPODER: ${inp.selectedElement.toUpperCase()} DESATADO!`,
            'Un cataclismo elemental azota el campo de batalla'
          );

          if (this.boss.isActive) {
            const bossDead = this.boss.takeDamage(600);
            if (bossDead) this.onBossDefeated();
          }
        }
      }
    }
  }

  onTargetDestroyed(points, reason) {
    this.evolution.addPoints(points, (stageName, unlockedDesc) => {
      // Callback al evolucionar con estallido de luz
      this.hud.setDragonInfo(this.dragon.config.name, stageName);
      this.hud.showCinematicBanner(`¡METAMORFOSIS: ${stageName}!`, unlockedDesc, 5000);
      this.input.vibrate(1200, 1.0, 1.0);
    });
  }

  updateBossLogic(delta, dPos) {
    const distToPeak = dPos.distanceTo(this.boss.position);

    // Despertar al jefe cuando el jugador se acerca a la gran cumbre o llega a 900 puntos
    if (!this.boss.isActive && (distToPeak < 380 || this.evolution.points >= 900)) {
      this.boss.activate();
      this.hud.showBossHealth(this.boss.health, this.boss.maxHealth);
      this.hud.showCinematicBanner('¡DESPERTÓ EL GRAN TITÁN ELEMENTAL!', 'El dragón colosal de 4 elementos custodia la cumbre', 5000);
      this.audio.playAncestralRoar();
    }

    if (this.boss.isActive) {
      this.boss.update(delta, dPos);
      this.hud.showBossHealth(this.boss.health, this.boss.maxHealth);
    }
  }

  onBossDefeated() {
    this.hud.hideBossHealth();
    this.hud.showCinematicBanner('¡VICTORIA DRACÓNICA!', 'Has derrotado al Gran Titán y te has convertido en el Rey Dragón Supremo', 10000);
    this.audio.playEvolutionFanfare();
    this.input.vibrate(2000, 1.0, 1.0);
  }

  updateHUD() {
    this.hud.updateHealth(this.playerHealth, this.maxHealth);
    this.hud.updateStamina(this.flight.stamina, this.flight.maxStamina);
    this.hud.updateScoreAndEvolution(this.evolution.points, this.evolution.stage);
    this.hud.setActiveElement(this.input.state.selectedElement);
    this.hud.updateUltimate(this.elementals.ultimateCharge);
    this.hud.updateCompass(this.flight.yaw);
  }
}

// Iniciar aplicación al cargar DOM
window.addEventListener('DOMContentLoaded', () => {
  window.dragonFuryApp = new GameApp();
});
