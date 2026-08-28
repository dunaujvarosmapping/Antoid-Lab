let audioContext;

const hash = (value) =>
  [...String(value)].reduce(
    (total, char) => (Math.imul(total, 31) + char.charCodeAt(0)) >>> 0,
    7,
  );
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export function serviceAudioProfile(service = {}) {
  const name = String(service.name || service.id || "");
  if (/Kossuth/i.test(name))
    return {
      root: 38,
      tempo: 92,
      wave: "triangle",
      scale: [0, 2, 5, 7, 9],
      speech: true,
    };
  if (/Petőfi/i.test(name))
    return { root: 45, tempo: 128, wave: "sawtooth", scale: [0, 2, 4, 7, 9] };
  if (/Bartók/i.test(name))
    return { root: 48, tempo: 68, wave: "sine", scale: [0, 2, 5, 7, 11] };
  if (/Dankó/i.test(name))
    return { root: 43, tempo: 116, wave: "square", scale: [0, 3, 5, 7, 10] };
  return null;
}

export function startServiceAudio(service, volume = 0.2) {
  if (!service || typeof window === "undefined") return null;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume?.();
    const seed = hash(
      `${service.id}:${service.audioMode || service.soundMode || "Stereo"}`,
    );
    const station = serviceAudioProfile(service);
    const output = audioContext.createGain();
    output.gain.value = Math.max(0.001, Math.min(0.48, volume));
    output.connect(audioContext.destination);
    const now = audioContext.currentTime + 0.03;
    const scaleSets = [
      [0, 2, 4, 7, 9],
      [0, 3, 5, 7, 10],
      [0, 2, 5, 7, 11],
      [0, 4, 6, 9, 11],
    ];
    const scale = station?.scale || scaleSets[seed % scaleSets.length];
    const root = station?.root || 42 + (seed % 13);
    const tempo = station?.tempo || 72 + (seed % 67);
    const step = 60 / tempo / 2;
    const nodes = [];
    const connectVoice = (gain, index) => {
      if (
        service.audioMode !== "Mono" &&
        typeof audioContext.createStereoPanner === "function"
      ) {
        const panner = audioContext.createStereoPanner();
        const width = service.audioMode === "Dolby Digital" ? 0.92 : 0.55;
        panner.pan.value = (index % 2 ? 1 : -1) * width;
        gain.connect(panner).connect(output);
        return;
      }
      gain.connect(output);
    };
    for (let index = 0; index < 48; index += 1) {
      const start = now + index * step;
      const note =
        root +
        12 +
        scale[(seed + index * (1 + (seed % 4))) % scale.length] +
        (index % 8 > 5 ? 12 : 0);
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type =
        station?.wave || ["sine", "triangle", "square", "sawtooth"][seed % 4];
      oscillator.frequency.value = hz(note);
      gain.gain.setValueAtTime(
        station?.speech && index % 3 ? 0.045 : 0.095,
        start,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, start + step * 0.72);
      oscillator.connect(gain);
      connectVoice(gain, index);
      oscillator.start(start);
      oscillator.stop(start + step * 0.76);
      nodes.push(oscillator);
      if (index % 4 === 0) {
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        bass.type = seed % 2 ? "triangle" : "sine";
        bass.frequency.value = hz(
          root + scale[(index / 4 + seed) % scale.length],
        );
        bassGain.gain.setValueAtTime(0.08, start);
        bassGain.gain.exponentialRampToValueAtTime(0.001, start + step * 3.4);
        bass.connect(bassGain);
        connectVoice(bassGain, index / 4);
        bass.start(start);
        bass.stop(start + step * 3.5);
        nodes.push(bass);
      }
    }
    return {
      stop() {
        output.gain.cancelScheduledValues(audioContext.currentTime);
        output.gain.setTargetAtTime(0.001, audioContext.currentTime, 0.025);
        setTimeout(
          () =>
            nodes.forEach((node) => {
              try {
                node.stop();
              } catch {}
            }),
          120,
        );
      },
      setVolume(next) {
        output.gain.setTargetAtTime(
          Math.max(0.001, Math.min(0.48, next)),
          audioContext.currentTime,
          0.04,
        );
      },
    };
  } catch {
    return null;
  }
}
