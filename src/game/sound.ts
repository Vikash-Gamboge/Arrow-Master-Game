/**
 * Web Audio API Sound Effects & Background Music Synthesizer
 * Zero external audio file dependencies. Fast, tactile, responsive.
 * 100% Original & Royalty-Free.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;         // SFX enabled
  public musicEnabled = true;    // Background Music enabled
  private isMusicPlaying = false;
  private wasPlayingBeforeBackground = false;
  private isAppInBackground = false;

  // Master Gain & Filter Nodes for Background Music
  private musicMasterGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;

  // Scheduler state
  private schedulerTimer: number | null = null;
  private nextBarTime = 0;
  private barIndex = 0;

  // 8-Bar Relaxing & Magical Puzzle Chord Progression (Fmaj9 -> Cmaj7 -> Am9 -> Em7 -> Fmaj9 -> G6/9 -> Am9 -> Dm9)
  private chordProgression = [
    { name: 'Fmaj9', root: 174.61, pad: [174.61, 220.0, 261.63, 329.63, 392.0], chimes: [523.25, 659.25, 783.99, 880.0] },
    { name: 'Cmaj7', root: 130.81, pad: [130.81, 196.0, 246.94, 293.66, 329.63], chimes: [523.25, 587.33, 659.25, 783.99] },
    { name: 'Am9',   root: 110.0,  pad: [110.0,  164.81, 196.0,  246.94, 261.63], chimes: [440.0,  523.25, 659.25, 783.99] },
    { name: 'Em7',   root: 82.41,  pad: [164.81, 196.0,  246.94, 293.66, 329.63], chimes: [392.0,  493.88, 587.33, 659.25] },
    { name: 'Fmaj9', root: 174.61, pad: [174.61, 220.0, 261.63, 329.63, 392.0], chimes: [523.25, 659.25, 783.99, 880.0] },
    { name: 'G6/9',  root: 98.0,   pad: [146.83, 196.0,  246.94, 293.66, 369.99], chimes: [493.88, 587.33, 739.99, 880.0] },
    { name: 'Am9',   root: 110.0,  pad: [110.0,  164.81, 196.0,  246.94, 261.63], chimes: [440.0,  523.25, 659.25, 783.99] },
    { name: 'Dm9',   root: 146.83, pad: [146.83, 220.0, 261.63, 329.63, 349.23], chimes: [440.0,  523.25, 659.25, 698.46] },
  ];

  constructor() {
    // Attach window event listeners for initial user interaction to unlock AudioContext
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        if (this.musicEnabled && !this.isMusicPlaying) {
          this.startMusic();
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Starts ambient background puzzle music cleanly.
   * If music is ALREADY active, seamlessly continues without abrupt restarts or gaps.
   */
  startMusic() {
    if (this.isAppInBackground || !this.musicEnabled) return;
    this.musicEnabled = true;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Ensure master gain and filter nodes for music exist
    if (!this.musicMasterGain) {
      this.musicMasterGain = this.ctx.createGain();
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.musicMasterGain.connect(this.musicFilter);
      this.musicFilter.connect(this.ctx.destination);
    }

    // Smooth gain fade-in to clear, rich 75-80% mobile volume range
    const t = this.ctx.currentTime;
    this.musicMasterGain.gain.cancelScheduledValues(t);
    this.musicMasterGain.gain.setValueAtTime(this.musicMasterGain.gain.value || 0.0001, t);
    this.musicMasterGain.gain.linearRampToValueAtTime(0.24, t + 0.8);

    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.nextBarTime = this.ctx.currentTime + 0.05;

    // Start lookahead scheduler (runs every 150ms)
    if (typeof window !== 'undefined') {
      if (this.schedulerTimer) window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = window.setInterval(() => {
        this.schedulerTick();
      }, 150);
    }
  }

  /**
   * Lookahead scheduler tick: schedules music bars 1.5s in advance using Web Audio clock
   */
  private schedulerTick() {
    if (!this.ctx || !this.musicEnabled || !this.isMusicPlaying) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const BAR_DURATION = 4.2; // 4.2s per bar (~57 BPM)
    const lookahead = 1.5;

    while (this.nextBarTime < this.ctx.currentTime + lookahead) {
      this.scheduleBar(this.nextBarTime, BAR_DURATION);
      this.nextBarTime += BAR_DURATION;
    }
  }

  /**
   * Schedules a bar of soothing, magical ambient puzzle music
   */
  private scheduleBar(startTime: number, duration: number) {
    if (!this.ctx || !this.musicMasterGain) return;

    const chord = this.chordProgression[this.barIndex % this.chordProgression.length];
    this.barIndex++;

    // 1. Soft Warm Ambient Synth Pad
    chord.pad.forEach((freq, idx) => {
      if (!this.ctx || !this.musicMasterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const attack = 1.2;
      const release = 1.0;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.055, startTime + attack);
      gain.gain.setValueAtTime(0.055, startTime + duration - release);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.musicMasterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    // 2. Sub-bass Warmth
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(chord.root, startTime);

    subGain.gain.setValueAtTime(0.0001, startTime);
    subGain.gain.linearRampToValueAtTime(0.065, startTime + 0.8);
    subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    subOsc.connect(subGain);
    subGain.connect(this.musicMasterGain);
    subOsc.start(startTime);
    subOsc.stop(startTime + duration + 0.05);

    // 3. Delicate Kalimba / Bell Chimes
    const chimeOffsets = [0.4, 1.4, 2.6, 3.4];
    chimeOffsets.forEach((offset, idx) => {
      if (!this.ctx || !this.musicMasterGain) return;
      const noteStart = startTime + offset;
      const freq = chord.chimes[idx % chord.chimes.length];

      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, noteStart);

      chimeGain.gain.setValueAtTime(0.0001, noteStart);
      chimeGain.gain.linearRampToValueAtTime(0.045, noteStart + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.7);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.musicMasterGain);

      chimeOsc.start(noteStart);
      chimeOsc.stop(noteStart + 0.75);
    });
  }

  /**
   * Internal helper to halt music scheduler and fade out master gain
   */
  private pauseMusicInternal(fadeSeconds = 0.2) {
    this.isMusicPlaying = false;

    if (typeof window !== 'undefined' && this.schedulerTimer) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.musicMasterGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.musicMasterGain.gain.cancelScheduledValues(t);
        this.musicMasterGain.gain.setValueAtTime(this.musicMasterGain.gain.value || 0.0001, t);
        this.musicMasterGain.gain.linearRampToValueAtTime(0.0001, t + fadeSeconds);
      } catch {}
    }
  }

  /**
   * Smoothly stops background music with a gentle fade out
   */
  stopMusic() {
    this.musicEnabled = false;
    this.wasPlayingBeforeBackground = false;
    this.pauseMusicInternal(0.4);
  }

  /**
   * Handles app entering background or switching away.
   * Immediately silences and halts background music and Web Audio processing.
   */
  handleBackground() {
    if (this.isAppInBackground) return;
    this.isAppInBackground = true;

    if (this.isMusicPlaying && this.musicEnabled) {
      this.wasPlayingBeforeBackground = true;
    }

    this.pauseMusicInternal(0.08);

    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  /**
   * Handles app returning to active foreground.
   * Resumes Web Audio and background music ONLY if it was previously playing
   * and music is currently enabled in settings.
   */
  handleForeground() {
    if (!this.isAppInBackground) return;
    this.isAppInBackground = false;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.wasPlayingBeforeBackground && this.musicEnabled) {
      this.wasPlayingBeforeBackground = false;
      this.startMusic();
    } else {
      this.wasPlayingBeforeBackground = false;
    }
  }

  /**
   * Toggles background music directly from Settings
   */
  setMusicEnabled(enabled: boolean) {
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  /**
   * Arrow click / tap sound
   */
  playTap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Satisfying whoosh / glide sound when an arrow successfully escapes
   */
  playSlide() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.28);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  /**
   * Blocked / Bump collision sound when an arrow hits an obstacle
   */
  playBump() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  /**
   * Hint chime
   */
  playHint() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [659.25, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.14, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.36);
    });
  }

  /**
   * Heart loss sound
   */
  playHeartLost() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  /**
   * Victory fanfare on completing level
   */
  playWin() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteStart = t + idx * 0.1;
      const duration = 0.55;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.2, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteStart);
      osc.stop(noteStart + duration);
    });
  }

  /**
   * Game Over sound
   */
  playGameOver() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteStart = t + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.2, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.36);
    });
  }

  /**
   * Cinematic splash intro fanfare
   */
  playSplashIntro() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [293.66, 440.0, 587.33, 739.99, 880.0];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteStart = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 1.25);
    });
  }

  playDailyClaim() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [659.25, 783.99, 987.77, 1174.66, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteStart = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.15, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.32);
    });
  }
}

export const sound = new SoundManager();
