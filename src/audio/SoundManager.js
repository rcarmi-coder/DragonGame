// ==========================================================
// DRAGON FURY - SISTEMA DE AUDIO CINEMATOGRÁFICO PROCEDURAL
// ==========================================================
// Diseñado con Web Audio API para reproducir rugidos profundos
// de bestia ancestral de cine, alientos elementales, aleteos y música.

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;

    // Iniciar bucle ambiental de viento de montaña
    this.startWindAmbience();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Rugido profundo de bestia ancestral de cine
  playAncestralRoar() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 1. Capa Sub-Bass (Vibración de pecho cinematográfica)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
    subOsc.frequency.linearRampToValueAtTime(20, now + 2.4);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(220, now);
    subFilter.frequency.exponentialRampToValueAtTime(80, now + 2.0);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.7, now + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // 2. Capa Garganta / Resonancia gutural distorsionada
    const throatOsc = this.ctx.createOscillator();
    const throatGain = this.ctx.createGain();
    throatOsc.type = 'triangle';
    throatOsc.frequency.setValueAtTime(180, now);
    throatOsc.frequency.exponentialRampToValueAtTime(55, now + 1.4);

    // Distorsión suave para agresividad
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(50);

    throatGain.gain.setValueAtTime(0.01, now);
    throatGain.gain.linearRampToValueAtTime(0.5, now + 0.2);
    throatGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    throatOsc.connect(distortion);
    distortion.connect(throatGain);
    throatGain.connect(this.masterGain);
    throatOsc.start(now);
    throatOsc.stop(now + 2.3);

    // 3. Capa de aliento y turbulencia de aire (Noise Buffer)
    this.playNoiseRoarTail(now, 2.5);
  }

  playNoiseRoarTail(startTime, duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, startTime);
    filter.frequency.linearRampToValueAtTime(200, startTime + duration);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(startTime);
  }

  // Sonido de aleteo potente con desplazamiento de aire
  playWingFlap() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // Aliento continuo de Fuego
  playFireBreath(duration = 0.5) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(300, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // Aliento de Hielo / Escarcha
  playIceBlast(duration = 0.5) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Aliento de Agua / Torrente
  playWaterTorrent(duration = 0.5) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.sin(i * 0.05) * (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // Aliento de Plantas / Zarzas
  playNatureStrike() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Sonido de explosión por impacto o proyectil
  playExplosion() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  // Sonido ÉPICO de Metamorfosis / Crecimiento del Dragón (Estallido de Luz)
  playEvolutionFanfare() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Arpegio ascendente brillante + impacto triunfal
    const chord = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.01, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + 2.6);
    });

    // Sub-golpe sísmico del estallido
    setTimeout(() => {
      this.playAncestralRoar();
    }, 400);
  }

  // Generador de curva de distorsión
  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Viento ambiental continuo
  startWindAmbience() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.06;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(0);
  }
}
