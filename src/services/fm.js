import { hardwareCapabilities } from "./hardware.js";

export const FM_MIN = 87.5;
export const FM_MAX = 108.0;
export const FM_STEP = 0.1;

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));
const roundedFrequency = (value) =>
  Math.round(clamp(value, FM_MIN, FM_MAX) * 10) / 10;

export const FM_PROGRAMS = Object.freeze({
  radio24: {
    identity: "Modern pop and electronic variety",
    palette: [220, 277.18, 329.63, 440],
    songs: [
      { title: "Neon River", artist: "Lilla Vektor", duration: 154 },
      { title: "After the Tram", artist: "North Loop", duration: 168 },
    ],
    ids: ["Rádió 24 · city pulse", "Rádió 24 · everywhere with you"],
  },
  kossuth: {
    identity: "Calm orchestral and public-radio programming",
    palette: [130.81, 164.81, 196, 261.63],
    songs: [
      { title: "Morning over the Danube", artist: "Buda Chamber Ensemble", duration: 172 },
      { title: "Letters from the Plain", artist: "Eszter Farkas", duration: 161 },
    ],
    ids: ["Kossuth Rádió · the sound of home", "Kossuth Rádió · together in Hungary"],
  },
  petofi: {
    identity: "Contemporary original radio music",
    palette: [174.61, 233.08, 293.66, 349.23],
    songs: [
      { title: "Paper Satellites", artist: "Dóra Nova", duration: 158 },
      { title: "Open Windows", artist: "Balaton Avenue", duration: 166 },
    ],
    ids: ["Petőfi Rádió · new Hungarian sound", "Petőfi Rádió · turn up today"],
  },
  retro: {
    identity: "Original retro synth and older-pop inspired programming",
    palette: [110, 138.59, 164.81, 220],
    songs: [
      { title: "Cassette Summer", artist: "Velvet Arcade", duration: 163 },
      { title: "Midnight Polaroid", artist: "Chrome Hearts Club", duration: 177 },
    ],
    ids: ["Retro Rádió · memories in motion", "Retro Rádió · the good times return"],
  },
});

const transmitter = (id, location, station, frequency, radioText, extra = {}) => ({
  id,
  location,
  station,
  frequency,
  enabled: true,
  strength: 86,
  interference: 4,
  noise: 3,
  stereo: true,
  rds: true,
  rdsName: station,
  radioText,
  modulation: true,
  quality: 94,
  stability: 95,
  fading: 5,
  multipath: 4,
  ...extra,
});

export function createFMTransmitters() {
  return [
    transmitter(
      "radio24",
      "Dunaújváros Martinovics Utca Víztorony",
      "Rádió 24",
      102.9,
      "Modern sound from the Danube · original Antoid broadcast",
      { strength: 90 },
    ),
    transmitter(
      "kossuth",
      "Paks Szérüskert",
      "Kossuth Rádió",
      92.0,
      "News, culture and calm music across Hungary",
      { strength: 78, quality: 96 },
    ),
    transmitter(
      "petofi",
      "Sárszentlőrinc",
      "Petőfi Rádió",
      90.3,
      "Fresh original music · Petőfi daytime programme",
      { strength: 82, stability: 91 },
    ),
    transmitter(
      "retro",
      "Kab Hegy",
      "Retro Rádió",
      100.5,
      "Original retro favourites and synth memories",
      { strength: 88, multipath: 7 },
    ),
  ];
}

export function createFMState() {
  return {
    frequency: 102.9,
    playing: false,
    muted: false,
    volume: 68,
    antenna: "Automatic",
    audioOutput: "Phone Speaker",
    favorites: [],
    scanned: [],
    scanning: false,
    controllerSelected: "radio24",
    transmitters: createFMTransmitters(),
    crash: null,
    broadcastEpoch: Date.now(),
  };
}

export const formatFMFrequency = (frequency) =>
  `${roundedFrequency(frequency).toFixed(1).replace(".", ",")} MHz`;

export function currentFMProgramme(transmitterId, now = Date.now()) {
  const program = FM_PROGRAMS[transmitterId];
  if (!program) return null;
  const first = program.songs[0].duration;
  const second = program.songs[1].duration;
  const idDuration = 9;
  const cycle = first + second + idDuration * 2;
  const position = Math.floor(now / 1000) % cycle;
  if (position < first)
    return { type: "song", index: 0, ...program.songs[0], progress: position / first };
  if (position < first + idDuration)
    return { type: "id", index: 0, title: program.ids[0], artist: "Station identification", progress: (position - first) / idDuration };
  if (position < first + idDuration + second)
    return { type: "song", index: 1, ...program.songs[1], progress: (position - first - idDuration) / second };
  return { type: "id", index: 1, title: program.ids[1], artist: "Station identification", progress: (position - first - idDuration - second) / idDuration };
}

function antennaState(state, caps) {
  const components = state.hardware.components;
  const internalAvailable = caps.fmAntenna;
  const wiredAvailable = caps.headphonesDetected && caps.headphoneAntenna;
  const internalEffectiveness = internalAvailable
    ? clamp((components.fmAntenna.condition || 0) * (components.fmAntenna.efficiency || 1))
    : 0;
  const wiredEffectiveness = wiredAvailable
    ? clamp(
        (components.headphoneJack.condition || 0) *
          (components.headphoneJack.antennaReliability || 1) *
          1.04,
      )
    : 0;
  const selected = state.fm.antenna || "Automatic";
  if (selected === "Internal FM Antenna")
    return {
      selected,
      actual: "Internal FM Antenna",
      available: internalAvailable,
      effectiveness: internalEffectiveness,
      internalAvailable,
      wiredAvailable,
    };
  if (selected === "Wired Headphones")
    return {
      selected,
      actual: "Wired Headphones",
      available: wiredAvailable,
      effectiveness: wiredEffectiveness,
      internalAvailable,
      wiredAvailable,
    };
  const useWired = wiredEffectiveness > internalEffectiveness;
  return {
    selected,
    actual: useWired ? "Wired Headphones" : "Internal FM Antenna",
    available: Math.max(internalEffectiveness, wiredEffectiveness) > 0,
    effectiveness: Math.max(internalEffectiveness, wiredEffectiveness),
    internalAvailable,
    wiredAvailable,
  };
}

export function calculateFMReception(state, tunedFrequency = state.fm.frequency, now = Date.now()) {
  const frequency = roundedFrequency(tunedFrequency);
  const caps = hardwareCapabilities(state);
  const antenna = antennaState(state, caps);
  const tuner = state.hardware.components.fmReceiver;
  const enabled = state.fm.transmitters.filter((item) => item.enabled);
  const exact = enabled.filter(
    (item) => Math.abs(roundedFrequency(item.frequency) - frequency) < 0.0001,
  );
  const collision = exact.length >= 2;
  const candidates = enabled
    .map((item) => {
      const delta = Math.abs(roundedFrequency(item.frequency) - frequency);
      const channelFactor = delta < 0.0001 ? 1 : delta <= 0.1 ? 0.42 : delta <= 0.2 ? 0.13 : 0;
      const fadeWave = (Math.sin(now / 3300 + item.id.length) + 1) / 2;
      const fadingPenalty = (item.fading / 100) * fadeWave * 0.38;
      const raw = clamp(item.strength * channelFactor);
      const carrier =
        raw *
        (item.quality / 100) *
        (item.stability / 100) *
        (1 - fadingPenalty);
      return { item, delta, raw, carrier };
    })
    .filter((candidate) => candidate.raw > 0)
    .sort((a, b) => b.carrier - a.carrier);
  const primary = candidates[0] || null;
  const adjacent = candidates.slice(1).reduce((sum, candidate) => sum + candidate.carrier * 0.28, 0);
  const tunerCondition = caps.fmReceiver ? clamp(tuner.condition) : 0;
  const sensitivity = Number(tuner?.sensitivity || 1);
  const tunerNoise = Number(tuner?.noisePenalty || 0);
  const txInterference = primary?.item.interference || 0;
  const txNoise = primary?.item.noise || 0;
  const multipath = primary?.item.multipath || 0;
  const interference = clamp(
    txInterference + txNoise * 0.65 + multipath * 0.5 + adjacent + tunerNoise,
  );
  const effective =
    primary && caps.fmReceiver && antenna.available
      ? clamp(
          primary.carrier *
            (antenna.effectiveness / 100) *
            (tunerCondition / 100) *
            sensitivity -
            interference * 0.46,
        )
      : 0;
  const detected = primary && primary.delta <= 0.1 && effective >= 10 ? primary.item : null;
  const quality =
    effective >= 78
      ? "Excellent"
      : effective >= 58
        ? "Good"
        : effective >= 38
          ? "Fair"
          : effective >= 20
            ? "Weak"
            : effective >= 7
              ? "Very Weak"
              : "None";
  const stereoThreshold = Number(tuner?.stereoLock || 55);
  const rdsThreshold = Number(tuner?.rdsThreshold || 62);
  const stereo = Boolean(detected?.stereo && effective >= stereoThreshold && interference < 44);
  const rdsLocked = Boolean(detected?.rds && effective >= rdsThreshold && interference < 32);
  const programme = detected ? currentFMProgramme(detected.id, now) : null;
  const audioState = !detected
    ? "Static"
    : !detected.modulation
      ? "Unmodulated carrier · silence"
      : effective >= 58
        ? "Clean programme"
        : effective >= 38
          ? "Programme with light static"
          : effective >= 20
            ? "Noisy programme with dropouts"
            : effective >= 7
              ? "Intermittent programme in heavy static"
              : "Static";
  const wiredOutput = state.fm.audioOutput === "Wired Headphones";
  const outputAvailable = wiredOutput ? caps.headphonesDetected : caps.speaker;
  const outputQuality = outputAvailable
    ? wiredOutput
      ? clamp(100 - caps.headphoneCrackle - (caps.headphoneChannels === 1 ? 12 : 0))
      : clamp(state.hardware.components.speaker?.condition ?? 100)
    : 0;
  return {
    frequency,
    collision,
    collisionCount: exact.length,
    receiverAvailable: caps.fmReceiver,
    antenna,
    transmitter: detected,
    rawRF: primary?.raw || 0,
    interference,
    tunerCondition,
    finalReception: effective,
    quality,
    mode: stereo ? "STEREO" : "MONO",
    rds: rdsLocked ? "LOCKED" : detected?.rds && effective >= 25 ? "SEARCHING" : "UNAVAILABLE",
    rdsLocked,
    programme,
    audioState,
    modulation: Boolean(detected?.modulation),
    outputAvailable,
    outputQuality,
    outputChannels: wiredOutput ? caps.headphoneChannels : caps.speaker ? 2 : 0,
  };
}

export function scanFMEnvironment(state, now = Date.now()) {
  const frequencies = [
    ...new Set(
      state.fm.transmitters
        .filter((item) => item.enabled)
        .map((item) => roundedFrequency(item.frequency)),
    ),
  ];
  return frequencies
    .map((frequency) => calculateFMReception(state, frequency, now))
    .filter((result) => !result.collision && result.transmitter && result.finalReception >= 22)
    .map((result) => ({
      frequency: result.frequency,
      station: result.transmitter.station,
      strength: Math.round(result.finalReception),
    }))
    .sort((a, b) => a.frequency - b.frequency);
}

export function seekFM(state, direction = 1) {
  const current = roundedFrequency(state.fm.frequency);
  const found = scanFMEnvironment(state)
    .map((item) => item.frequency)
    .sort((a, b) => a - b);
  if (!found.length) return roundedFrequency(current + direction * FM_STEP);
  if (direction > 0) return found.find((frequency) => frequency > current + 0.001) ?? found[0];
  return [...found].reverse().find((frequency) => frequency < current - 0.001) ?? found.at(-1);
}
