import { FM_PROGRAMS, currentFMProgramme } from "./fm.js";

let audioContext;
const note = (semitones, root = 220) => root * Math.pow(2, semitones / 12);
const REST = null;

// Eight independent original procedural compositions. Their meters, melodies,
// bass movement, timbres, tempo and percussion structures are all distinct.
export const FM_COMPOSITIONS = Object.freeze({
  radio24: [
    { id:"neon-river-audio",tempo:124,stepsPerBeat:4,root:220,waveforms:["sawtooth","square","triangle"],lead:[0,REST,7,12,10,REST,7,3,0,3,7,REST,12,10,7,REST],bass:[-12,-12,-5,-5,-9,-9,-2,-2],harmony:[0,7,3,10],drums:"four-floor",filter:[4200,9800] },
    { id:"after-tram-audio",tempo:106,stepsPerBeat:3,root:246.94,waveforms:["square","triangle","sine"],lead:[0,2,REST,5,9,7,REST,2,-3,REST,0,5,7,REST,9,5,2,REST],bass:[-12,-8,-5,-10,-12,-3],harmony:[0,5,9,2,7,-3],drums:"broken-electro",filter:[2800,7200] },
  ],
  kossuth: [
    { id:"danube-morning-audio",tempo:72,stepsPerBeat:2,root:196,waveforms:["sine","triangle","sine"],lead:[0,4,7,11,9,7,4,2,0,-1,2,4,7,4,2,REST],bass:[-12,REST,-5,REST,-8,REST,-3,REST],harmony:[0,4,7,11],drums:"orchestral",filter:[1800,5200] },
    { id:"letters-plain-audio",tempo:84,stepsPerBeat:3,root:174.61,waveforms:["triangle","sine","triangle"],lead:[0,REST,3,5,REST,8,7,5,3,REST,-2,0,REST,3,7,5,REST,0],bass:[-12,-12,REST,-7,-7,REST],harmony:[0,3,7,5,8,3],drums:"soft-march",filter:[1500,4300] },
  ],
  petofi: [
    { id:"paper-satellites-audio",tempo:138,stepsPerBeat:4,root:164.81,waveforms:["triangle","sawtooth","square"],lead:[0,7,5,12,REST,10,7,5,3,7,10,15,12,REST,10,7],bass:[-12,-5,-9,-2,-12,-5,-9,3],harmony:[0,5,10,3],drums:"indie-drive",filter:[3600,8600] },
    { id:"open-windows-audio",tempo:94,stepsPerBeat:4,root:207.65,waveforms:["sine","sawtooth","triangle"],lead:[0,REST,4,7,9,REST,7,4,2,REST,6,9,11,9,6,REST],bass:[-12,-8,-3,-5,-12,-8,-1,-5],harmony:[0,4,9,2],drums:"half-time",filter:[2400,6800] },
  ],
  retro: [
    { id:"cassette-summer-audio",tempo:112,stepsPerBeat:4,root:130.81,waveforms:["sawtooth","sawtooth","square"],lead:[12,10,7,5,3,5,7,10,12,15,12,10,7,5,3,REST],bass:[-12,-12,-5,-5,-2,-2,-9,-9],harmony:[0,3,7,10],drums:"synthwave",filter:[3200,7600] },
    { id:"midnight-polaroid-audio",tempo:119,stepsPerBeat:2,root:146.83,waveforms:["square","sine","sawtooth"],lead:[0,5,8,12,10,8,5,3,-2,3,7,10,8,7,3,0],bass:[-12,-7,-4,-9,-12,-7,-2,-9],harmony:[0,5,8,3,10,7,3,-2],drums:"retro-disco",filter:[2600,9000] },
  ],
});

export function compositionFor(stationId, songIndex = 0) {
  return FM_COMPOSITIONS[stationId]?.[songIndex] || null;
}

export function compositionFrame(stationId, songIndex, now = Date.now()) {
  const composition = compositionFor(stationId, songIndex);
  if (!composition) return null;
  const stepDuration = 60_000 / composition.tempo / composition.stepsPerBeat;
  const absoluteStep = Math.floor(now / stepDuration);
  const step = absoluteStep % composition.lead.length;
  const bassStep = Math.floor(step / Math.max(1, composition.stepsPerBeat / 2)) % composition.bass.length;
  const harmonyStep = Math.floor(step / composition.stepsPerBeat) % composition.harmony.length;
  const accents = {
    "broken-electro": [1,0,.18,0,.72,0,0,.25,0,.8,0,.2],
    "indie-drive": [1,.08,.25,.08,.68,.08,.3,.08],
  };
  const drumAccent = accents[composition.drums]?.at(step % accents[composition.drums].length) ??
    (composition.drums === "orchestral" ? (step % 6 === 0 ? .35 : step % 3 === 0 ? .12 : 0) :
      composition.drums === "soft-march" ? (step % 6 === 0 ? .4 : step % 3 === 0 ? .22 : .03) :
        composition.drums === "half-time" ? (step % 8 === 0 ? .8 : step % 8 === 4 ? .5 : .04) :
          composition.drums === "synthwave" ? (step % 4 === 0 ? .85 : step % 4 === 2 ? .48 : .06) :
            composition.drums === "retro-disco" ? (step % 4 === 0 ? .7 : step % 4 === 2 ? .58 : .12) :
              (step % 4 === 0 ? 1 : step % 2 === 0 ? .35 : .08));
  return {
    id: composition.id,
    step,
    tempo: composition.tempo,
    leadHz: composition.lead[step] == null ? 0 : note(composition.lead[step], composition.root),
    bassHz: composition.bass[bassStep] == null ? 0 : note(composition.bass[bassStep], composition.root / 2),
    harmonyHz: note(composition.harmony[harmonyStep], composition.root),
    drumAccent,
  };
}

const context = () => {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
};

function noiseSource(ctx) {
  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.92 + white * 0.08;
    data[index] = white * .62 + previous * .38;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export function startFMProgram({ stationId, reception = 0, volume = .65, muted = false }) {
  try {
    const ctx = context();
    const master = ctx.createGain();
    const programmeGain = ctx.createGain();
    const staticGain = ctx.createGain();
    const percussionGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const compressor = ctx.createDynamicsCompressor();
    const panner = ctx.createStereoPanner?.();
    master.gain.value = muted ? .0001 : Math.max(.0001, volume);
    filter.type = "lowpass";
    filter.frequency.value = 15000;
    programmeGain.connect(filter).connect(compressor);
    if (panner) compressor.connect(panner).connect(master);
    else compressor.connect(master);
    staticGain.connect(master);
    percussionGain.connect(master);
    master.connect(ctx.destination);
    const staticSource = noiseSource(ctx);
    staticSource.connect(staticGain);
    staticSource.start();
    const percussion = noiseSource(ctx);
    percussion.connect(percussionGain);
    percussion.start();
    const voices = Array.from({ length: 3 }, (_, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain).connect(programmeGain);
      gain.gain.value = .0001;
      oscillator.start();
      return { oscillator, gain, index };
    });
    let currentReception = reception;
    let currentVolume = volume;
    let currentMuted = muted;
    let lastIdentification = "";
    const updateMix = () => {
      const quality = Math.max(0, Math.min(100, currentReception));
      const now = ctx.currentTime;
      programmeGain.gain.setTargetAtTime(Math.max(.0001, quality / 100), now, .08);
      staticGain.gain.setTargetAtTime(.015 + Math.pow(1 - quality / 100, 1.5) * .29, now, .08);
      master.gain.setTargetAtTime(currentMuted ? .0001 : Math.max(.0001, currentVolume), now, .05);
      if (panner) panner.pan.setTargetAtTime(quality >= 55 ? Math.sin(Date.now() / 9000) * .22 : 0, now, .1);
    };
    const evolve = () => {
      const programme = stationId ? currentFMProgramme(stationId) : null;
      const songIndex = programme?.index || 0;
      const composition = compositionFor(stationId, songIndex);
      const frame = compositionFrame(stationId, songIndex);
      const now = ctx.currentTime;
      if (composition && frame) {
        const frequencies = [frame.leadHz, frame.bassHz, frame.harmonyHz];
        voices.forEach(({ oscillator, gain, index }) => {
          oscillator.type = composition.waveforms[index];
          const frequency = frequencies[index];
          if (frequency > 0) oscillator.frequency.setTargetAtTime(frequency, now, .025);
          const baseGain = index === 0 ? .08 : index === 1 ? .052 : .024;
          gain.gain.setTargetAtTime(programme?.type === "id" ? baseGain * .24 : frequency > 0 ? baseGain : .0001, now, .025);
        });
        filter.frequency.setTargetAtTime(composition.filter[0] + (composition.filter[1] - composition.filter[0]) * (Math.max(0, Math.min(100, currentReception)) / 100), now, .08);
        percussionGain.gain.setTargetAtTime(programme?.type === "song" ? frame.drumAccent * .055 : .006, now, .012);
      } else {
        voices.forEach(({ gain }) => gain.gain.setTargetAtTime(.0001, now, .04));
        percussionGain.gain.setTargetAtTime(.0001, now, .04);
      }
      if (programme?.type === "id") {
        const key = `${stationId}-${programme.index}-${Math.floor(Date.now() / 9000)}`;
        if (lastIdentification !== key && "speechSynthesis" in window) {
          lastIdentification = key;
          const utterance = new SpeechSynthesisUtterance(FM_PROGRAMS[stationId].ids[programme.index]);
          utterance.lang = "hu-HU";
          utterance.volume = Math.max(0, Math.min(1, currentVolume * currentReception / 100));
          utterance.rate = programme.index ? 1.04 : .92;
          window.speechSynthesis.speak(utterance);
        }
      }
      updateMix();
    };
    evolve();
    const timer = setInterval(evolve, 120);
    return {
      stationId,
      setReception(value) { currentReception = value; updateMix(); },
      setVolume(value) { currentVolume = value; updateMix(); },
      setMuted(value) { currentMuted = value; updateMix(); },
      stop() {
        clearInterval(timer);
        window.speechSynthesis?.cancel?.();
        master.gain.setTargetAtTime(.0001, ctx.currentTime, .025);
        setTimeout(() => {
          staticSource.stop();
          percussion.stop();
          voices.forEach(({ oscillator }) => oscillator.stop());
          master.disconnect();
        }, 160);
      },
    };
  } catch {
    return null;
  }
}
