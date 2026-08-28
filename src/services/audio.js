let ctx;
const patterns = {
  tap: [[520, 0.035]],
  lock: [
    [420, 0.035],
    [240, 0.055],
  ],
  boot: [
    [330, 0.12],
    [494, 0.14],
    [660, 0.22],
  ],
  notify: [
    [740, 0.08],
    [990, 0.1],
  ],
  success: [
    [440, 0.08],
    [660, 0.1],
    [880, 0.13],
  ],
  error: [
    [180, 0.11],
    [130, 0.14],
  ],
  eject: [
    [170, 0.05],
    [250, 0.04],
  ],
  shutter: [
    [900, 0.025],
    [120, 0.06],
  ],
  call: [
    [440, 0.12],
    [550, 0.12],
  ],
  screenshot: [
    [800, 0.03],
    [1200, 0.06],
  ],
  charge: [
    [330, 0.05],
    [700, 0.1],
  ],
};
export function sound(name = "tap", volume = 0.1) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const seq = patterns[name] || patterns.tap;
    let start = ctx.currentTime;
    seq.forEach(([freq, dur]) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = name === "error" ? "sawtooth" : "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(volume, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(start);
      o.stop(start + dur);
      start += dur * 0.8;
    });
    return true;
  } catch {
    return false;
  }
}

export function startAntoidNights(volume = 0.35) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    const start = ctx.currentTime + 0.05,
      bpm = 98,
      beat = 60 / bpm;
    const melody = [
      64, 67, 71, 74, 71, 67, 62, 66, 69, 74, 69, 66, 60, 64, 67, 72, 67, 64,
    ];
    const bass = [40, 40, 43, 43, 38, 38, 36, 36];
    for (let bar = 0; bar < 24; bar++) {
      for (let b = 0; b < 4; b++) {
        const t = start + (bar * 4 + b) * beat;
        const kick = ctx.createOscillator(),
          kg = ctx.createGain();
        kick.frequency.setValueAtTime(120, t);
        kick.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        kg.gain.setValueAtTime(0.32, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        kick.connect(kg).connect(gain);
        kick.start(t);
        kick.stop(t + 0.19);
        if (b % 2 === 1) {
          const sn = ctx.createOscillator(),
            sg = ctx.createGain();
          sn.type = "triangle";
          sn.frequency.value = 180;
          sg.gain.setValueAtTime(0.1, t);
          sg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          sn.connect(sg).connect(gain);
          sn.start(t);
          sn.stop(t + 0.09);
        }
      }
      const bt = start + bar * 4 * beat,
        bo = ctx.createOscillator(),
        bg = ctx.createGain();
      bo.type = "square";
      bo.frequency.value =
        440 * Math.pow(2, (bass[bar % bass.length] - 69) / 12);
      bg.gain.value = 0.07;
      bo.connect(bg).connect(gain);
      bo.start(bt);
      bo.stop(bt + 3.8 * beat);
      if (bar >= 2 && bar < 22)
        for (let k = 0; k < 4; k++) {
          const t = bt + k * beat,
            mo = ctx.createOscillator(),
            mg = ctx.createGain();
          mo.type = "triangle";
          mo.frequency.value =
            440 *
            Math.pow(2, (melody[(bar * 4 + k) % melody.length] - 69) / 12);
          mg.gain.setValueAtTime(0.08, t);
          mg.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.8);
          mo.connect(mg).connect(gain);
          mo.start(t);
          mo.stop(t + beat * 0.85);
        }
    }
    return {
      stop: () => {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      },
      setVolume: (next) => {
        gain.gain.setTargetAtTime(
          Math.max(0.001, Math.min(1, next)),
          ctx.currentTime,
          0.035,
        );
      },
      duration: 60,
    };
  } catch {
    return null;
  }
}
