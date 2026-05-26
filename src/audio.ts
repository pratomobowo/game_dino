// Dino Survival Sound Synthesizer using Web Audio API

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Lazy initialized on first user click to bypass browser block
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.error("AudioContext is not supported on this browser:", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get isInitialized(): boolean {
    return this.ctx !== null;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private createGain(duration: number): { ctx: AudioContext; gain: GainNode } | null {
    if (this.muted) return null;
    this.initCtx();
    if (!this.ctx) return null;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gainNode.connect(this.ctx.destination);
    return { ctx: this.ctx, gain: gainNode };
  }

  playPistol() {
    const sound = this.createGain(0.1);
    if (!sound) return;
    const { ctx, gain } = sound;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playShotgun() {
    const sound = this.createGain(0.3);
    if (!sound) return;
    const { ctx, gain } = sound;

    // White Noise Buffer for crisp blasts
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Low pitch thump oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);

    // Filter to make it muddy and heavy
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(1000, ctx.currentTime);
    lpFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    noise.connect(lpFilter);
    osc.connect(lpFilter);

    gain.gain.setValueAtTime(0.6 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    lpFilter.connect(gain);

    noise.start();
    osc.start();
    noise.stop(ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.25);
  }

  playRifle() {
    const sound = this.createGain(0.15);
    if (!sound) return;
    const { ctx, gain } = sound;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    // Highpass to make it rattle
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(200, ctx.currentTime);

    osc.connect(hpFilter);
    hpFilter.connect(gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playRpgLaunch() {
    const sound = this.createGain(0.3);
    if (!sound) return;
    const { ctx, gain } = sound;

    // Whizzing fire sound
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playExplosion() {
    const sound = this.createGain(0.5);
    if (!sound) return;
    const { ctx, gain } = sound;

    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.4);

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'lowpass';
    bpFilter.frequency.setValueAtTime(250, ctx.currentTime);
    bpFilter.Q.setValueAtTime(8, ctx.currentTime);

    noise.connect(bpFilter);
    osc.connect(bpFilter);

    gain.gain.setValueAtTime(0.8 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    bpFilter.connect(gain);

    noise.start();
    osc.start();
    noise.stop(ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  }

  playPlasma() {
    const sound = this.createGain(0.15);
    if (!sound) return;
    const { ctx, gain } = sound;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);

    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(30, ctx.currentTime);
    vibratoGain.gain.setValueAtTime(300, ctx.currentTime);
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.25 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    
    vibrato.start();
    osc.start();
    vibrato.stop(ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  }

  playFlame() {
    const sound = this.createGain(0.08);
    if (!sound) return;
    const { ctx, gain } = sound;

    // Quick burst of soft noise + low frequency hiss
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    gain.gain.setValueAtTime(0.15 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playDinoRoar(isBoss: boolean = false) {
    const sound = this.createGain(0.4);
    if (!sound) return;
    const { ctx, gain } = sound;

    const duration = isBoss ? 0.8 : 0.45;
    const pitch = isBoss ? 45 : 75;

    // Deep modulating sawtooths for rumbling growls
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(pitch - 15, ctx.currentTime + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(pitch * 1.5, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime((pitch - 10) * 1.5, ctx.currentTime + duration);

    // Vibrato to make it angry growl
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(isBoss ? 16 : 28, ctx.currentTime);
    lfoGain.gain.setValueAtTime(isBoss ? 25 : 45, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBoss ? 400 : 700, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.5 * this.volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6 * this.volume, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    lfo.start();
    osc1.start();
    osc2.start();
    
    lfo.stop(ctx.currentTime + duration);
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  }

  playDinoHurt() {
    const sound = this.createGain(0.2);
    if (!sound) return;
    const { ctx, gain } = sound;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playPlayerHurt() {
    const sound = this.createGain(0.35);
    if (!sound) return;
    const { ctx, gain } = sound;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.5 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  playPickup() {
    const sound = this.createGain(0.25);
    if (!sound) return;
    const { ctx, gain } = sound;

    // Arpeggio sound
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(440, now + 0.05);
    osc.frequency.setValueAtTime(660, now + 0.1);
    osc.frequency.setValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    osc.start();
    osc.stop(now + 0.3);
  }

  playBuy() {
    const sound = this.createGain(0.35);
    if (!sound) return;
    const { ctx, gain } = sound;

    // Cash register cha-ching!
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1500, now + 0.06);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    osc.start();
    osc.stop(now + 0.25);
  }

  playLevelUp() {
    const sound = this.createGain(0.4);
    if (!sound) return;
    const { ctx, gain } = sound;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(261.63, now); // C4
    osc1.frequency.setValueAtTime(329.63, now + 0.1); // E4
    osc1.frequency.setValueAtTime(392.00, now + 0.2); // G4
    osc1.frequency.setValueAtTime(523.25, now + 0.3); // C5
    
    osc2.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc2.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc2.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.setValueAtTime(0.3 * this.volume, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.61);

    osc1.connect(gain);
    osc2.connect(gain);

    osc1.start();
    osc2.start();
    
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  // Play an ambient low drum beat for tension
  playWaveStart() {
    const sound = this.createGain(0.35);
    if (!sound) return;
    const { ctx, gain } = sound;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(0.6 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    osc.start();
    osc.stop(now + 0.45);
  }
}

export const audio = new SoundEngine();
