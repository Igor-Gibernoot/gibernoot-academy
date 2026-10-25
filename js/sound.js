// Feedback sounds, synthesized with Web Audio (no audio files).
// The on/off preference is per browser and is not part of the progress code.

const KEY = 'gibernoot.sound', OLD_KEY = 'dg2gr.sound';
let ctx = null;

export function soundOn() {
  try { return (localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY)) !== 'off'; } catch { return true; }
}

export function setSound(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
}

// notes: [frequency Hz, start s, duration s]
function play(notes, { type = 'sine', gain = 0.12 } = {}) {
  if (!soundOn()) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const [f, start, dur] of notes) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      env.gain.setValueAtTime(0, t0 + start);
      env.gain.linearRampToValueAtTime(gain, t0 + start + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(env).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur + 0.02);
    }
  } catch { /* audio unavailable: stay silent */ }
}

export const sounds = {
  correct: () => play([[659.3, 0, 0.16], [987.8, 0.08, 0.32]], { type: 'triangle', gain: 0.14 }),
  wrong: () => play([[196, 0, 0.18], [164.8, 0.1, 0.28]], { type: 'triangle', gain: 0.12 }),
  finish: () => play([[523.3, 0, 0.18], [659.3, 0.1, 0.18], [784, 0.2, 0.18], [1046.5, 0.3, 0.5]], { type: 'triangle', gain: 0.12 }),
};
