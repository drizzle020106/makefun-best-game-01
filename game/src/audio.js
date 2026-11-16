// Synthesised sound: every effect is built with WebAudio oscillators,
// so the game ships no audio files and makes no network request.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  // Browsers only allow audio after a user gesture; call from the first
  // click or keypress, never before.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.startMusic();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short tone: frequency slides from `from` to `to` over `seconds`.
  tone(from, to, seconds, type, gainValue, when = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + seconds);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  shoot() { this.tone(880, 440, 0.08, 'square', 0.05); }
  hit() { this.tone(300, 120, 0.1, 'sawtooth', 0.07); }
  mote() { this.tone(660, 1320, 0.12, 'sine', 0.08); }
  hurt() { this.tone(220, 55, 0.3, 'sawtooth', 0.12); }
  waveClear() {
    this.tone(523, 523, 0.12, 'sine', 0.09);
    this.tone(659, 659, 0.12, 'sine', 0.09, 0.12);
    this.tone(784, 784, 0.2, 'sine', 0.09, 0.24);
  }
  gameOver() {
    this.tone(392, 392, 0.25, 'triangle', 0.1);
    this.tone(311, 311, 0.25, 'triangle', 0.1, 0.25);
    this.tone(233, 116, 0.5, 'triangle', 0.1, 0.5);
  }

  // A slow, quiet arpeggio loop: the reef's own music.
  startMusic() {
    if (this.musicTimer || !this.context) return;
    const scale = [220, 261.63, 329.63, 392, 440, 523.25];
    this.musicTimer = window.setInterval(() => {
      if (this.muted || document.hidden) return;
      const note = scale[this.musicStep % scale.length];
      this.tone(note, note, 0.9, 'sine', 0.025);
      this.musicStep += 1;
    }, 450);
  }
}
