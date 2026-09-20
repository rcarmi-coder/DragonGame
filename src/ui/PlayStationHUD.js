// ==========================================================
// DRAGON FURY - GESTOR DE HUD PLAYSTATION MINIMALISTA
// ==========================================================
// Controla las barras curvas de salud, estamina, rueda de 4 elementos,
// medidor del orbe de superpoder y banners cinemáticos en tiempo real.

export class PlayStationHUD {
  constructor() {
    this.container = document.getElementById('playstation-hud');
    this.healthFill = document.getElementById('hud-health-fill');
    this.healthText = document.getElementById('hud-health-text');
    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.staminaText = document.getElementById('hud-stamina-text');
    this.scoreVal = document.getElementById('hud-score');
    this.evoFill = document.getElementById('hud-evolution-fill');
    this.nextEvoHint = document.getElementById('hud-next-evo-pts');
    this.dragonName = document.getElementById('hud-dragon-name');
    this.dragonStage = document.getElementById('hud-dragon-stage');

    // Rueda de elementos
    this.slots = {
      fire: document.getElementById('slot-fire'),
      ice: document.getElementById('slot-ice'),
      water: document.getElementById('slot-water'),
      plants: document.getElementById('slot-plants')
    };

    // Orbe de Superpoder
    this.ultimateOrb = document.getElementById('ultimate-orb');
    this.ultimateFill = document.getElementById('ultimate-fill');

    // Jefe
    this.bossContainer = document.getElementById('boss-health-bar');
    this.bossFill = document.getElementById('boss-health-fill');

    // Banner Cinemático
    this.banner = document.getElementById('cinematic-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSubtitle = document.getElementById('banner-subtitle');
    this.bannerTimeout = null;

    // Brújula
    this.compass = document.getElementById('hud-compass');
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  setDragonInfo(name, stageStr) {
    if (this.dragonName) this.dragonName.textContent = name.toUpperCase();
    if (this.dragonStage) this.dragonStage.textContent = `ETAPA: ${stageStr.toUpperCase()}`;
  }

  updateHealth(current, max) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.healthFill.style.width = `${pct}%`;
    this.healthText.textContent = `${Math.round(pct)}%`;
  }

  updateStamina(current, max) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.staminaFill.style.width = `${pct}%`;
  }

  updateScoreAndEvolution(points, stage) {
    this.scoreVal.textContent = points;

    let targetPts = 500;
    let prevPts = 0;
    if (stage === 2) {
      prevPts = 500;
      targetPts = 1500;
    } else if (stage >= 3) {
      prevPts = 1500;
      targetPts = 1500;
    }

    if (stage >= 3) {
      this.evoFill.style.width = '100%';
      this.nextEvoHint.textContent = 'MÁXIMA EVOLUCIÓN ANCESTRAL';
    } else {
      const progress = Math.min(100, ((points - prevPts) / (targetPts - prevPts)) * 100);
      this.evoFill.style.width = `${Math.max(0, progress)}%`;
      this.nextEvoHint.textContent = `Próxima Metamorfosis: ${targetPts} pts`;
    }
  }

  setActiveElement(element) {
    Object.keys(this.slots).forEach((key) => {
      if (this.slots[key]) {
        if (key === element) {
          this.slots[key].classList.add('active');
        } else {
          this.slots[key].classList.remove('active');
        }
      }
    });
  }

  updateUltimate(chargePct) {
    this.ultimateFill.style.height = `${chargePct}%`;
    if (chargePct >= 100) {
      this.ultimateOrb.classList.add('ready');
    } else {
      this.ultimateOrb.classList.remove('ready');
    }
  }

  updateCompass(yawRadians) {
    const deg = Math.round((yawRadians * 180) / Math.PI) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const idx = Math.round(((deg + 360) % 360) / 45) % 8;
    this.compass.textContent = directions[idx];
  }

  showBossHealth(current, max) {
    this.bossContainer.classList.remove('hidden');
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.bossFill.style.width = `${pct}%`;
  }

  hideBossHealth() {
    this.bossContainer.classList.add('hidden');
  }

  showCinematicBanner(title, subtitle, durationMs = 4500) {
    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTitle.textContent = title;
    this.bannerSubtitle.textContent = subtitle;
    this.banner.classList.remove('hidden');

    this.bannerTimeout = setTimeout(() => {
      this.banner.classList.add('hidden');
    }, durationMs);
  }
}
