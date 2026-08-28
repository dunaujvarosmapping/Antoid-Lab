import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { connectivity } from "../services/core.js";
import {
  ANTENNAS,
  MUX_IDS,
  TOWER_PLAN,
  discoverFrequency,
  effectiveService,
  playbackStatus,
  programFor,
  receptionForMux,
} from "../services/dvb.js";
import { startServiceAudio } from "../services/tvAudio.js";
import { dvdReadOutcome, dvdReadScore } from "../services/lab.js";
import { Button, Slider, Toggle } from "./UI.jsx";
import { sound } from "../services/audio.js";
import { UTVController } from "./UTVController.jsx";

const deviceTabs = ["utv", "decoder", "dvd"];
const pageLabels = {
  home: "Home",
  live: "Live TV",
  inputs: "Inputs",
  network: "Network",
  settings: "Settings",
  guide: "Guide",
  tuner: "Channel Tuner",
  diagnostics: "Channel Diagnostics",
  channels: "Channel List",
};
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const utvInternet = (state) => {
  if (state.lab.router.blocked.includes("utv") || !state.lab.router.dhcp)
    return false;
  if (state.lab.cables.ethernetToUtv && state.lab.router.wan) return true;
  if (
    state.lab.utv.wifi.connected === state.lab.router.ssid &&
    state.lab.utv.wifi.remembered?.[state.lab.router.ssid] ===
      state.lab.router.password &&
    state.lab.router.wifiEnabled &&
    (state.lab.router.bands["5 GHz"] || state.lab.router.bands["2.4 GHz"]) &&
    state.lab.router.wan
  )
    return true;
  return (
    state.lab.utv.wifi.connected === (state.hotspot.ssid || "Antoid 1") &&
    state.radio.hotspot &&
    state.power.mode === "on" &&
    connectivity(state).isOnline
  );
};

export function LabWelcome() {
  const { set } = useOS();
  return (
    <main className="lab-welcome">
      <div className="lab-orbit">
        <i />
        <i />
        <i />
        <span>A</span>
      </div>
      <p className="eyebrow">ANTOID LAB · v5.0.0 PUBLIC BETA</p>
      <h1>Welcome to the Antoid Lab!</h1>
      <p>Select Device to test:</p>
      <div className="lab-device-cards">
        <button onClick={() => set("lab.activeDevice", "phone")}>
          <b>Antoid 1</b>
          <span>Complete interactive smartphone laboratory</span>
          <em>Open phone →</em>
        </button>
        <button onClick={() => set("lab.activeDevice", "utv")}>
          <b>Antoid UTV 1</b>
          <span>Smart TV, DVB-T2, Decoder and DVD environment</span>
          <em>Open TV Lab →</em>
        </button>
        <button onClick={() => set("lab.activeDevice", "supcer")}>
          <b>Antoid SUPCer</b>
          <span>Physical PC, ANRouter and Antoid OS 7 environment</span>
          <em>Open PC Lab →</em>
        </button>
      </div>
      <button
        className="lab-changelog-link"
        onClick={() => set("lab.changelogOpen", true)}
      >
        Update Changelog
      </button>
      <Changelog />
    </main>
  );
}

function Changelog() {
  const { state, set } = useOS();
  if (!state.lab.changelogOpen) return null;
  return (
    <div className="lab-modal">
      <section>
        <button
          aria-label="Close changelog"
          onClick={() => set("lab.changelogOpen", false)}
        >
          ×
        </button>
        <p className="eyebrow">UPDATE CHANGELOG</p>
        <h2>v5.0.0 Public Beta</h2>
        <h3>SUPCer, Antoid OS 7 &amp; Shared Network Update</h3>
        <div className="changelog-grid">
          <article>
            <b>NEW FEATURES</b>
            <p>
              Antoid SUPCer with physical components and cables, POST and BIOS,
              Antoid OS 7 desktop, persistent files, apps, games, package
              installer, and the shared ANRouter network.
            </p>
          </article>
          <article>
            <b>IMPROVEMENTS</b>
            <p>
              Expanded persistent Lab state, hardware-aware startup and display
              routing, real window management, router administration, parts
              inventory, diagnostics and public-beta migrations.
            </p>
          </article>
          <article>
            <b>BUG FIXES</b>
            <p>
              Legacy state now migrates safely into the 5.0 data model while
              preserving the existing phone, UTV, Decoder, DVD and RF systems.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function AntennaSelection() {
  const { set } = useOS();
  return (
    <main className="antenna-select">
      <button
        className="lab-back"
        onClick={() => set("lab.activeDevice", "welcome")}
      >
        ← Antoid Lab
      </button>
      <p className="eyebrow">BEFORE UNBOXING</p>
      <h1>Select the antenna for this Lab</h1>
      <p>
        Gain and directional tolerance feed the real reception model. No antenna
        can overcome impossible alignment.
      </p>
      <div className="antenna-cards">
        {Object.entries(ANTENNAS).map(([id, antenna], index) => (
          <button key={id} onClick={() => set("lab.antenna.selected", id)}>
            <i className={`antenna-art antenna-${id}`} />
            <small>
              {index === 0
                ? "BEST"
                : index === 1
                  ? "SECOND BEST"
                  : index === 2
                    ? "MID"
                    : "WORST"}
            </small>
            <b>{antenna.name}</b>
            <span>
              {antenna.label} reception · directional tolerance{" "}
              {Math.round(antenna.tolerance * 100)}%
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

function UTVUnboxing() {
  const { state, set } = useOS();
  const stages = [
    [
      "Break the shipping seal",
      "Release the two locking tabs on the UTV crate.",
    ],
    [
      "Open both carton flaps",
      "The accessory layer is now visible under the lid.",
    ],
    [
      "Remove the protective foam",
      "Lift the fitted top cushion away from the wrapped panel.",
    ],
    [
      "Unwrap Antoid UTV 1",
      "Peel back the screen sleeve without touching the panel.",
    ],
    [
      "Lift the television onto its stand",
      "The panel and metal feet move onto the media bench.",
    ],
    [
      "Open the remote compartment",
      "Remove the UTV remote, batteries and quick-start card.",
    ],
    [
      "Unpack Decoder Box",
      "Place its remote and all three provider cards beside it.",
    ],
    [
      "Unpack Antoid DVD Player",
      "Place its remote and three physical discs on the bench.",
    ],
    ["Unpack the selected antenna", ANTENNAS[state.lab.antenna.selected].name],
    [
      "Sort cables and documentation",
      "Coax, HDMI, SCART, AV, Ethernet and power leads stay disconnected.",
    ],
    [
      "Complete the physical layout",
      "Every device is placed. Connect cables before first power.",
    ],
  ];
  const stage = Math.min(state.lab.unboxing.stage, stages.length - 1);
  const advance = () => {
    if (stage === stages.length - 1) {
      set("lab.unboxing", { complete: true, stage: stages.length });
      set("lab.antenna.unpacked", true);
    } else set("lab.unboxing.stage", stage + 1);
  };
  return (
    <main className={`utv-unboxing unbox-stage-${stage}`}>
      <div className="utv-unbox-workspace">
        <button
          className="utv-box"
          onClick={advance}
          aria-label={stages[stage][0]}
        >
          <i className="box-flap flap-left" />
          <i className="box-flap flap-right" />
          <span className="shipping-seal">ANTOИD SECURITY SEAL</span>
          <b>ANTOИD</b>
          <em>UTV 1 · COMPLETE HOME ENTERTAINMENT LAB</em>
          <i className="box-foam" />
          <i className="wrapped-tv">
            <span>DISPLAY PROTECTIVE SLEEVE</span>
          </i>
        </button>
        <div className="unboxed-hardware" aria-label="Unboxed equipment">
          <i className="unbox-tv">
            <span>ANTOИD</span>
          </i>
          <i className="unbox-utv-remote" />
          <i className="unbox-decoder">
            <span>DECODER</span>
          </i>
          <i className="unbox-dvd">
            <span>DVD</span>
          </i>
          <i className="unbox-antenna">
            <span>{ANTENNAS[state.lab.antenna.selected].name}</span>
          </i>
          <i className="unbox-cables" />
          <i className="unbox-docs">
            <span>QUICK START</span>
          </i>
        </div>
      </div>
      <section>
        <button
          className="lab-back"
          onClick={() => set("lab.activeDevice", "welcome")}
        >
          ← Antoid Lab
        </button>
        <p className="eyebrow">
          PHYSICAL UNBOXING · {stage + 1}/{stages.length}
        </p>
        <h1>{stages[stage][0]}</h1>
        <p>{stages[stage][1]}</p>
        <div className="unbox-progress">
          <i style={{ width: `${((stage + 1) / stages.length) * 100}%` }} />
        </div>
        <div className="unbox-inventory">
          {stages.map(([name], index) => (
            <span
              className={
                index < stage ? "unpacked" : index === stage ? "active" : ""
              }
              key={name}
            >
              {index < stage ? "✓" : String(index + 1).padStart(2, "0")} {name}
            </span>
          ))}
        </div>
        <Button tone="primary" onClick={advance} className="unbox-action">
          {stage === stages.length - 1
            ? "Place equipment on the media bench"
            : stages[stage][0]}
        </Button>
        <small>Click the crate or use the highlighted physical action.</small>
      </section>
    </main>
  );
}

function UTVSetup() {
  const { state, set, dispatch } = useOS();
  const step = state.lab.utv.setupStep;
  const screens = [
    <>
      <p className="eyebrow">ANTOИD UTV</p>
      <h1>Welcome to Antoid UTV</h1>
      <p>Use the remote-style controls to complete first-time setup.</p>
    </>,
    <>
      <h2>Language &amp; region</h2>
      <label>
        Language
        <select
          value={state.lab.utv.language}
          onChange={(event) => set("lab.utv.language", event.target.value)}
        >
          <option>English</option>
          <option>Magyar</option>
        </select>
      </label>
      <label>
        Country/region
        <select
          value={state.lab.utv.country}
          onChange={(event) => set("lab.utv.country", event.target.value)}
        >
          <option>Hungary</option>
        </select>
      </label>
    </>,
    <>
      <h2>Usage mode</h2>
      <div className="setup-choices">
        {["Home Mode", "Store or Demo Mode"].map((mode) => (
          <button
            className={state.lab.utv.mode === mode ? "active" : ""}
            onClick={() => set("lab.utv.mode", mode)}
            key={mode}
          >
            {mode}
          </button>
        ))}
      </div>
    </>,
    <>
      <h2>Network setup</h2>
      <p>
        Connect now or continue offline. Networks remain available in Settings.
      </p>
      <WifiPanel compact />
    </>,
    <>
      <h2>Picture mode</h2>
      <div className="setup-choices">
        {["Standard", "Cinema", "Sports", "Vivid", "Game", "Custom"].map(
          (mode) => (
            <button
              className={state.lab.utv.pictureMode === mode ? "active" : ""}
              onClick={() => set("lab.utv.pictureMode", mode)}
              key={mode}
            >
              {mode}
            </button>
          ),
        )}
      </div>
    </>,
    <>
      <h2>Live TV setup</h2>
      <p>
        The tuner scans even without an antenna; only a usable RF lock discovers
        services.
      </p>
      <Button
        disabled={state.lab.utv.scan.status === "scanning"}
        onClick={() => dispatch({ type: "LAB_AUTO_SCAN", device: "utv" })}
      >
        {state.lab.utv.scan.status === "scanning"
          ? "Searching frequencies…"
          : "Run Automatic Search"}
      </Button>
      <div className="scan-progress">
        <i style={{ width: `${state.lab.utv.scan.progress}%` }} />
      </div>
      <p>{state.lab.utv.scan.message}</p>
      <small>
        {state.lab.utv.scan.tv} TV · {state.lab.utv.scan.radio} radio
      </small>
    </>,
    <>
      <h1>Setup complete</h1>
      <p>
        Your UTV software is ready. Physical cables and source devices keep
        their independent states.
      </p>
    </>,
  ];
  return (
    <div className="utv-setup-screen">
      <div className="setup-card">
        {screens[Math.min(step, screens.length - 1)]}
        <footer>
          {step > 0 && (
            <Button onClick={() => set("lab.utv.setupStep", step - 1)}>
              Back
            </Button>
          )}
          <Button
            tone="primary"
            disabled={step === 5 && state.lab.utv.scan.status === "scanning"}
            onClick={() =>
              step >= screens.length - 1
                ? set("lab.utv.setupComplete", true)
                : set("lab.utv.setupStep", step + 1)
            }
          >
            {step >= screens.length - 1 ? "Enter Antoid UTV" : "Continue"}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function UTVControllerPanel() {
  return (
    <aside
      className="utv-controller-panel"
      aria-label="Antoid UTV 1 Controller Lab"
    >
      <header>
        <span>LIVE</span>
        <div>
          <b>Controller Lab</b>
          <small>Antoid UTV 1 · authoritative device controls</small>
        </div>
      </header>
      <UTVController />
    </aside>
  );
}

function UTVSetupBench({ firstPower = false }) {
  const { state, set } = useOS();
  return (
    <main className="utv-lab">
      <header className="lab-topbar">
        <button onClick={() => set("lab.activeDevice", "welcome")}>
          ← Antoid Lab
        </button>
        <div>
          <b>ANTO ID LAB</b>
          <span>Antoid UTV 1 setup workspace · v5.0.0 Public Beta</span>
        </div>
        <span className="utv-setup-progress">
          {firstPower
            ? "FIRST POWER"
            : `SETUP ${Math.min(7, state.lab.utv.setupStep + 1)}/7`}
        </span>
      </header>
      <div className="utv-workspace">
        <section className="utv-workbench">
          <div className="utv-stage utv-setup-stage">
            <div className="utv-set front">
              <div className="utv-bezel">
                {firstPower ? (
                  <div className="utv-off utv-first-power-screen">
                    <b>ANTOИD</b>
                    <span>UTV 1</span>
                    {state.lab.utv.power === "booting" ? (
                      <>
                        <i className="boot-spinner" />
                        <small>Starting Antoid UTV…</small>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          set("lab.utv.bootUntil", Date.now() + 1200);
                          set("lab.utv.power", "booting");
                        }}
                      >
                        Power on
                      </button>
                    )}
                  </div>
                ) : (
                  <UTVSetup />
                )}
              </div>
              <div className="utv-stand" />
            </div>
            <UTVRemote setupMode={!firstPower} />
          </div>
          <CableBay />
        </section>
        <UTVControllerPanel />
      </div>
    </main>
  );
}

function WifiPanel({ compact = false }) {
  const { state, set, dispatch } = useOS();
  const [passwords, setPasswords] = useState({});
  const phoneNetwork = connectivity(state);
  const hotspotVisible = state.radio.hotspot && state.power.mode === "on";
  const networks = [
    ...(state.lab.router.wifiEnabled &&
    !state.lab.router.hidden &&
    (state.lab.router.bands["5 GHz"] || state.lab.router.bands["2.4 GHz"])
      ? [
          {
            ssid: state.lab.router.ssid,
            password: state.lab.router.password,
            internet: state.lab.router.wan,
          },
        ]
      : []),
    ...(hotspotVisible
      ? [
          {
            ssid: state.hotspot.ssid || "Antoid 1",
            password: state.hotspot.password,
            internet: phoneNetwork.isOnline,
          },
        ]
      : []),
  ];
  const connected = state.lab.utv.wifi.connected;
  const connect = (network) => {
    if ((passwords[network.ssid] || "") !== network.password)
      return set(
        "lab.utv.wifi.error",
        `Incorrect password for ${network.ssid}.`,
      );
    set("lab.utv.wifi", {
      ...state.lab.utv.wifi,
      connected: network.ssid,
      remembered: {
        ...state.lab.utv.wifi.remembered,
        [network.ssid]: network.password,
      },
      error: null,
    });
    dispatch({ type: "TOAST", message: `${network.ssid} connected` });
  };
  const connectedInternet =
    (connected === state.lab.router.ssid &&
      state.lab.utv.wifi.remembered?.[state.lab.router.ssid] ===
        state.lab.router.password &&
      state.lab.router.wifiEnabled &&
      (state.lab.router.bands["5 GHz"] || state.lab.router.bands["2.4 GHz"]) &&
      state.lab.router.wan &&
      state.lab.router.dhcp &&
      !state.lab.router.blocked.includes("utv")) ||
    (connected === (state.hotspot.ssid || "Antoid 1") &&
      hotspotVisible &&
      phoneNetwork.isOnline);
  return (
    <div className={`utv-wifi ${compact ? "compact" : ""}`}>
      <Toggle
        label="Wi-Fi"
        checked={state.lab.utv.wifi.enabled}
        onChange={(value) => set("lab.utv.wifi.enabled", value)}
      />
      {state.lab.utv.wifi.enabled &&
        networks.map((network) => (
          <article key={network.ssid}>
            <div>
              <b>{network.ssid}</b>
              <span>
                {connected === network.ssid
                  ? connectedInternet
                    ? "Connected · Internet available"
                    : "Connected · Internet unavailable"
                  : "Secured network"}
              </span>
            </div>
            {connected === network.ssid ? (
              <Button onClick={() => set("lab.utv.wifi.connected", null)}>
                Disconnect
              </Button>
            ) : (
              <>
                <input
                  aria-label={`${network.ssid} password`}
                  type="password"
                  value={passwords[network.ssid] || ""}
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      [network.ssid]: event.target.value,
                    })
                  }
                  placeholder="Password"
                />
                <Button onClick={() => connect(network)}>Connect</Button>
              </>
            )}
          </article>
        ))}
      {state.lab.utv.wifi.error && (
        <p className="utv-error">{state.lab.utv.wifi.error}</p>
      )}
      {!compact && connected === (state.hotspot.ssid || "Antoid 1") && (
        <p>
          Local hotspot association and upstream internet are evaluated
          separately.
        </p>
      )}
    </div>
  );
}

function ChannelPicture({
  channel,
  status,
  small = false,
  subtitles = false,
  displayFormat = "Auto",
}) {
  const liveService = status.service || channel;
  const programme = programFor(liveService);
  const reception = status.reception;
  const quality = reception?.quality || 0;
  const impairment = reception?.impairment || Math.max(0, 100 - quality);
  if (["empty", "no-signal", "coded", "parental"].includes(status.kind))
    return (
      <div className={`channel-failure ${status.kind}`}>
        <b>{status.title}</b>
        <span>{status.detail}</span>
        {reception && (
          <small>
            {Math.round(reception.strength)}% strength ·{" "}
            {Math.round(reception.quality)}% quality
          </small>
        )}
      </div>
    );
  const degradation =
    impairment >= 80
      ? "signal-critical"
      : impairment >= 58
        ? "signal-severe"
        : impairment >= 36
          ? "signal-moderate"
          : "signal-clean";
  const resolutionClass = `format-${String(liveService.resolution || "576p").toLowerCase()}`;
  const aspectClass =
    liveService.aspectRatio === "4:3" && displayFormat === "Auto"
      ? "aspect-4-3"
      : liveService.aspectRatio === "4:3" && displayFormat === "Zoom"
        ? "aspect-zoom"
        : "aspect-16-9";
  if (liveService.type === "radio")
    return (
      <div
        className={`radio-service-screen ${degradation}`}
        style={{ "--station-hue": `${liveService.visualSeed || 170}` }}
      >
        <div className="radio-station-mark">
          {liveService.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="radio-now-playing">
          <small>DVB-T2 RADIO · MUX {liveService.mux}</small>
          <h2>{liveService.name}</h2>
          <strong>{programme.current.title}</strong>
          <span>{programme.current.description}</span>
          <div className="radio-levels" aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => (
              <i
                key={index}
                style={{
                  "--bar": index,
                  "--radio-height": `${12 + (index % 7) * 6}px`,
                }}
              />
            ))}
          </div>
          <em>Audio service · {Math.round(quality)}% RF quality</em>
        </div>
        <div className="digital-corruption" aria-hidden="true" />
      </div>
    );
  return (
    <div
      className={`channel-picture genre-${programme.current.category.toLowerCase()} ${resolutionClass} ${aspectClass} ${degradation} ${status.kind}`}
      style={{
        "--service-hue": `${liveService.visualSeed ?? (channel.id.length * 37) % 360}`,
        "--breakup": `${impairment}%`,
        "--breakup-opacity": Math.min(
          0.94,
          Math.max(0, (impairment - 22) / 78),
        ),
        "--signal-jitter": `${Math.round((reception?.multipath || 0) / 7)}px`,
      }}
    >
      <div
        className={`programme-visual visual-${programme.current.category.toLowerCase()}`}
      >
        <i className="visual-backdrop" />
        <i className="visual-subject subject-one" />
        <i className="visual-subject subject-two" />
        <i className="visual-accent" />
        <span>{programme.current.title}</span>
      </div>
      {status.kind === "video-fault" ? (
        <div className="video-fault-card">VIDEO FEED FAILURE</div>
      ) : (
        <>
          {liveService.screenBug !== false && (
            <span className="screen-bug">{liveService.name}</span>
          )}
          <div className="macroblocks" />
          {subtitles && !small && (
            <div className="broadcast-subtitles">
              {programme.current.description}
            </div>
          )}
          <div className="digital-corruption" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="digital-freeze" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

function LiveTV({
  device = "utv",
  small = false,
  silent = false,
  masterVolume = null,
}) {
  const { state } = useOS();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [tuningActive, setTuningActive] = useState(false);
  const tuner = state.lab[device];
  const channel =
    tuner.storedChannels.find((item) => item.id === tuner.currentChannelId) ||
    tuner.storedChannels.find((item) => !item.hidden);
  const status = playbackStatus(state, channel, device);
  const service = status.service || effectiveService(state, channel);
  const programme = programFor(service);
  const audioRef = useRef(null);
  const nativeVolume =
    device === "utv"
      ? (state.lab.utv.volume / 300) * (state.lab.utv.speakerHealth / 100)
      : state.lab.decoder.muted
        ? 0
        : state.lab.decoder.volume / 300;
  const audible =
    !silent &&
    (masterVolume == null || masterVolume > 0) &&
    !tuningActive &&
    ["playing", "video-fault"].includes(status.kind) &&
    status.audio &&
    (masterVolume != null ||
      (device === "decoder" &&
        !state.lab.decoder.muted &&
        state.lab.decoder.volume > 0) ||
      (state.lab.utv.speakers &&
        state.lab.utv.speakerHealth > 5 &&
        !state.lab.utv.muted &&
        state.lab.utv.volume > 0));
  useEffect(() => {
    const remaining = Math.max(0, (tuner.tuningUntil || 0) - Date.now());
    setTuningActive(remaining > 0);
    if (!remaining) return;
    const timer = setTimeout(() => setTuningActive(false), remaining);
    return () => clearTimeout(timer);
  }, [tuner.tuningUntil]);
  useEffect(() => {
    audioRef.current?.stop?.();
    audioRef.current = audible
      ? startServiceAudio(
          {
            ...(status.service || channel),
            soundMode:
              device === "utv"
                ? state.lab.utv.soundMode
                : status.service?.audioMode,
          },
          masterVolume ?? nativeVolume,
        )
      : null;
    return () => audioRef.current?.stop?.();
  }, [
    channel?.id,
    audible,
    device,
    masterVolume,
    status.service?.audioMode,
    state.lab.utv.soundMode,
  ]);
  useEffect(() => {
    audioRef.current?.setVolume?.(masterVolume ?? nativeVolume);
  }, [
    state.lab.utv.volume,
    state.lab.utv.speakerHealth,
    state.lab.decoder.volume,
    state.lab.decoder.muted,
    masterVolume,
  ]);
  useEffect(() => {
    if (small || !channel) return;
    setBannerVisible(true);
    const timer = setTimeout(() => setBannerVisible(false), 3600);
    return () => clearTimeout(timer);
  }, [channel?.id, tuner.infoRequest, small]);
  useEffect(() => {
    if (!audible || !audioRef.current?.setVolume) return;
    const reliability = status.audioReliability ?? 100;
    if (reliability >= 88) return;
    let phase = 0;
    const normalVolume = masterVolume ?? nativeVolume;
    const timer = setInterval(() => {
      phase += 1;
      const dropout = (phase * 37 + Math.round(status.impairment || 0)) % 100;
      audioRef.current?.setVolume?.(
        dropout > reliability
          ? 0
          : normalVolume * Math.max(0.35, reliability / 100),
      );
    }, 260);
    return () => clearInterval(timer);
  }, [
    audible,
    device,
    state.lab.utv.volume,
    state.lab.utv.speakerHealth,
    state.lab.decoder.volume,
    state.lab.decoder.muted,
    masterVolume,
    status.audioReliability,
    status.impairment,
  ]);
  return (
    <div className="live-tv">
      {tuningActive ? (
        <div className="channel-failure tuning-transition">
          <i />
          <b>TUNING</b>
          <span>Acquiring service…</span>
        </div>
      ) : (
        <ChannelPicture
          channel={channel}
          status={status}
          small={small}
          subtitles={
            ((device === "utv" && state.lab.utv.subtitles) ||
              (device === "decoder" && state.lab.decoder.subtitles)) &&
            status.service?.subtitles !== false
          }
          displayFormat={
            device === "utv" || masterVolume != null
              ? state.lab.utv.screenFormat
              : "Auto"
          }
        />
      )}
      {!tuningActive && channel && programme && !small && bannerVisible && (
        <div className="live-channel-strip temporary" role="status">
          <b>{channel.channelNumber}</b>
          <span>
            <strong>{channel.name}</strong>
            <small>Now: {programme.current.title}</small>
            <small>Next: {programme.next.title}</small>
            <i style={{ width: `${programme.progress}%` }} />
          </span>
          <em>
            {channel.mux ? `MUX ${channel.mux}` : ""}
            {status.service?.resolution
              ? ` · ${status.service.resolution}`
              : ""}
            {status.service?.aspectRatio
              ? ` · ${status.service.aspectRatio}`
              : ""}
            {` · ${device === "utv" ? state.lab.utv.audioLanguage : state.lab.decoder.audioLanguage}`}
            {(device === "utv" && state.lab.utv.subtitles) ||
            (device === "decoder" && state.lab.decoder.subtitles)
              ? status.service?.subtitles === false
                ? ""
                : " · SUB"
              : ""}
          </em>
        </div>
      )}
    </div>
  );
}

function InputView() {
  const { state } = useOS();
  const input = state.lab.utv.input;
  if (input === "Live TV") return <LiveTV />;
  if (input === "HDMI 1") {
    const port = state.lab.utv.hdmi[1];
    const okay =
      state.lab.cables.dvdHdmiToUtv1 &&
      state.lab.cables.dvdPower &&
      state.lab.dvd.power === "on" &&
      state.lab.dvd.hdmiEnabled &&
      port.enabled &&
      !port.detectionFault &&
      !state.lab.dvd.outputFault;
    return okay ? (
      port.videoFault ? (
        <div className="channel-failure">
          <b>HDMI 1 VIDEO FAULT</b>
          <span>Source and cable remain active.</span>
        </div>
      ) : (
        <DVDOutput
          masterVolume={
            port.audioFault || state.lab.utv.muted
              ? 0
              : state.lab.utv.volume / 300
          }
        />
      )
    ) : (
      <div className="channel-failure no-signal">
        <b>Nincs jel</b>
        <span>No Signal · HDMI 1</span>
      </div>
    );
  }
  if (input === "HDMI 2") {
    const port = state.lab.utv.hdmi[2];
    const okay =
      state.lab.cables.decoderHdmiToUtv2 &&
      state.lab.cables.decoderPower &&
      state.lab.decoder.power === "on" &&
      state.lab.decoder.hdmiEnabled &&
      port.enabled &&
      !port.detectionFault &&
      !state.lab.decoder.outputFault;
    return okay ? (
      port.videoFault ? (
        <div className="channel-failure">
          <b>HDMI 2 VIDEO FAULT</b>
          <span>Decoder remains operational.</span>
        </div>
      ) : (
        <DecoderOutput
          masterVolume={
            port.audioFault || state.lab.utv.muted
              ? 0
              : state.lab.utv.volume / 300
          }
        />
      )
    ) : (
      <div className="channel-failure no-signal">
        <b>Nincs jel</b>
        <span>No Signal · HDMI 2</span>
      </div>
    );
  }
  if (input === "SCART") {
    const decoderActive =
      state.lab.cables.decoderScartToUtv &&
      state.lab.cables.decoderPower &&
      state.lab.decoder.power === "on" &&
      state.lab.decoder.scartEnabled;
    const dvdActive =
      state.lab.cables.dvdScartToUtv &&
      state.lab.cables.dvdPower &&
      state.lab.dvd.power === "on" &&
      state.lab.dvd.scartEnabled;
    if (decoderActive)
      return (
        <DecoderOutput
          masterVolume={state.lab.utv.muted ? 0 : state.lab.utv.volume / 300}
        />
      );
    if (dvdActive)
      return (
        <DVDOutput
          masterVolume={state.lab.utv.muted ? 0 : state.lab.utv.volume / 300}
        />
      );
  }
  if (
    input === "AV" &&
    state.lab.cables.dvdCompositeToUtv &&
    state.lab.cables.dvdAudioToUtv &&
    state.lab.cables.dvdPower &&
    state.lab.dvd.power === "on" &&
    state.lab.dvd.compositeEnabled
  )
    return (
      <DVDOutput
        masterVolume={state.lab.utv.muted ? 0 : state.lab.utv.volume / 300}
      />
    );
  return (
    <div className="channel-failure no-signal">
      <b>Nincs jel</b>
      <span>No Signal · {input}</span>
    </div>
  );
}

function PIPSource({ source }) {
  const { state } = useOS();
  if (source === "Live TV") return <LiveTV small silent />;
  if (source === "HDMI 1")
    return state.lab.cables.dvdHdmiToUtv1 &&
      state.lab.cables.dvdPower &&
      state.lab.dvd.power === "on" ? (
      <DVDOutput silent />
    ) : (
      <div className="channel-failure">
        <span>HDMI 1 · No Signal</span>
      </div>
    );
  return state.lab.cables.decoderHdmiToUtv2 &&
    state.lab.cables.decoderPower &&
    state.lab.decoder.power === "on" ? (
    <LiveTV device="decoder" small silent />
  ) : (
    <div className="channel-failure">
      <span>HDMI 2 · No Signal</span>
    </div>
  );
}

function ChannelTuner({ device = "utv" }) {
  const { state, set, dispatch } = useOS();
  const tuner = state.lab[device];
  const live = discoverFrequency(state, tuner.manualFrequency, device);
  return (
    <div className="tv-menu tuner-menu">
      <h2>Channel Tuner</h2>
      <div className="tuner-actions">
        <Button
          disabled={tuner.scan.status === "scanning"}
          onClick={() => dispatch({ type: "LAB_AUTO_SCAN", device })}
        >
          {tuner.scan.status === "scanning"
            ? "Search in progress…"
            : "Automatic Channel Search"}
        </Button>
        <label>
          Manual frequency{" "}
          <input
            type="number"
            value={tuner.manualFrequency}
            onChange={(event) =>
              set(`lab.${device}.manualFrequency`, Number(event.target.value))
            }
          />
          <span>kHz</span>
        </label>
        <Button
          disabled={tuner.scan.status === "scanning"}
          onClick={() =>
            dispatch({
              type: "LAB_MANUAL_SCAN",
              device,
              frequency: tuner.manualFrequency,
            })
          }
        >
          Search exact frequency
        </Button>
      </div>
      <div className="live-rf">
        <b>{tuner.manualFrequency} kHz</b>
        <span>Strength {Math.round(live.reception?.strength || 0)}%</span>
        <span>Quality {Math.round(live.reception?.quality || 0)}%</span>
        <span>{live.reception?.state || "No Signal"}</span>
      </div>
      <div className="scan-progress">
        <i style={{ width: `${tuner.scan.progress}%` }} />
      </div>
      <p>{tuner.scan.message || "Ready to search."}</p>
      <p>
        TV services found: {tuner.scan.tv} · Radio services found:{" "}
        {tuner.scan.radio}
      </p>
    </div>
  );
}

function ChannelList({ device = "utv" }) {
  const { state, set, dispatch } = useOS();
  const channels = [...state.lab[device].storedChannels].sort(
    (a, b) => a.channelNumber - b.channelNumber || a.name.localeCompare(b.name),
  );
  const update = (id, patch) =>
    set(
      `lab.${device}.storedChannels`,
      channels.map((channel) =>
        channel.id === id ? { ...channel, ...patch } : channel,
      ),
    );
  const assignNumber = (id, requested) => {
    const value = Math.max(
      1,
      Math.min(999, Math.round(Number(requested) || 1)),
    );
    const selected = channels.find((channel) => channel.id === id);
    const conflict = channels.find(
      (channel) => channel.id !== id && channel.channelNumber === value,
    );
    set(
      `lab.${device}.storedChannels`,
      channels
        .map((channel) =>
          channel.id === id
            ? { ...channel, channelNumber: value, customNumber: true }
            : channel.id === conflict?.id
              ? {
                  ...channel,
                  channelNumber: selected.channelNumber,
                  customNumber: true,
                }
              : channel,
        )
        .sort((a, b) => a.channelNumber - b.channelNumber),
    );
  };
  const move = (index, direction) => {
    const other = channels[index + direction];
    const selected = channels[index];
    if (!other) return;
    set(
      `lab.${device}.storedChannels`,
      channels
        .map((channel) =>
          channel.id === selected.id
            ? {
                ...channel,
                channelNumber: other.channelNumber,
                customNumber: true,
              }
            : channel.id === other.id
              ? {
                  ...channel,
                  channelNumber: selected.channelNumber,
                  customNumber: true,
                }
              : channel,
        )
        .sort((a, b) => a.channelNumber - b.channelNumber),
    );
  };
  return (
    <div className="tv-menu channel-list">
      <h2>{device === "utv" ? "UTV" : "Decoder"} Channel List</h2>
      {channels.length ? (
        channels.map((channel, index) => {
          const liveService = effectiveService(state, channel);
          return (
            <article
              key={channel.id}
              className={channel.hidden ? "hidden-channel" : ""}
            >
              <button
                onClick={() => {
                  dispatch({
                    type: "LAB_TUNE_CHANNEL",
                    device,
                    id: channel.id,
                  });
                  if (device === "utv") {
                    set("lab.utv.input", "Live TV");
                    set("lab.utv.page", "live");
                  } else set("lab.decoder.page", "live");
                }}
              >
                <b>{channel.channelNumber}</b>
                <span>
                  {channel.name}
                  <small>
                    MUX {channel.mux} · {channel.tunedFrequency} kHz ·{" "}
                    {liveService.free ? "FREE" : "CODED"} ·{" "}
                    {liveService.resolution}
                  </small>
                </span>
              </button>
              <input
                aria-label={`${channel.name} channel number`}
                type="number"
                value={channel.channelNumber}
                min="1"
                max="999"
                onChange={(event) =>
                  assignNumber(channel.id, event.target.value)
                }
              />
              <button
                aria-label={`Move ${channel.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move ${channel.name} down`}
                disabled={index === channels.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                aria-label={`Favorite ${channel.name}`}
                onClick={() =>
                  update(channel.id, { favorite: !channel.favorite })
                }
              >
                {channel.favorite ? "★" : "☆"}
              </button>
              <button
                aria-label={`Hide ${channel.name}`}
                onClick={() => update(channel.id, { hidden: !channel.hidden })}
              >
                {channel.hidden ? "Show" : "Hide"}
              </button>
              <button
                aria-label={`Delete ${channel.name}`}
                onClick={() =>
                  set(
                    `lab.${device}.storedChannels`,
                    channels.filter((item) => item.id !== channel.id),
                  )
                }
              >
                Delete
              </button>
            </article>
          );
        })
      ) : (
        <p>No stored channels. Run a tuner search.</p>
      )}
    </div>
  );
}

function Guide({ device = "utv" }) {
  const { state, set, dispatch } = useOS();
  const channels = [...state.lab[device].storedChannels]
    .filter((channel) => !channel.hidden)
    .sort((a, b) => a.channelNumber - b.channelNumber);
  const guideStart = Math.floor(Date.now() / 1800000) * 1800000;
  const guideTimes = [0, 1, 2, 3].map((offset) =>
    new Date(guideStart + offset * 1800000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  return (
    <div className="tv-menu epg">
      <header>
        <div>
          <h2>Electronic Programme Guide</h2>
          <span>{nowTime()} · Full broadcast schedule</span>
        </div>
      </header>
      <div className="epg-timeline" aria-hidden="true">
        <b>CHANNEL</b>
        {guideTimes.map((time) => (
          <span key={time}>{time}</span>
        ))}
        <i
          style={{
            left: `${24 + ((Date.now() - guideStart) / 7200000) * 76}%`,
          }}
        />
      </div>
      {channels.map((channel) => {
        const override = state.lab.broadcast.serviceOverrides[channel.id] || {};
        const programme = programFor({ ...channel, ...override });
        return (
          <article key={channel.id}>
            <button
              onClick={() => {
                dispatch({ type: "LAB_TUNE_CHANNEL", device, id: channel.id });
                if (device === "utv") set("lab.utv.page", "live");
                else set("lab.decoder.page", "live");
              }}
            >
              <b>{channel.channelNumber}</b>
              <span>{channel.name}</span>
            </button>
            {override.epg === false ? (
              <div className="epg-unavailable">
                <strong>EPG unavailable</strong>
                <small>EPG Feed Failure</small>
              </div>
            ) : (
              programme.schedule.slice(1, 5).map((show, index) => (
                <div className="epg-programme" key={show.id}>
                  <small>{show.category}</small>
                  <strong>{show.title}</strong>
                  {index === 0 && (
                    <i style={{ width: `${programme.progress}%` }} />
                  )}
                  {device === "utv" && index === 1 && (
                    <button
                      onClick={() =>
                        set("lab.utv.reminders", [
                          ...state.lab.utv.reminders.filter(
                            (id) => id !== show.id,
                          ),
                          show.id,
                        ])
                      }
                    >
                      Remind
                    </button>
                  )}
                </div>
              ))
            )}
          </article>
        );
      })}
      {!channels.length && <p>No EPG rows until services are scanned.</p>}
    </div>
  );
}

function Diagnostics({ device = "utv" }) {
  const { state } = useOS();
  const tuner = state.lab[device];
  const channel = tuner.storedChannels.find(
    (item) => item.id === tuner.currentChannelId,
  );
  const status = playbackStatus(state, channel, device);
  const service = status.service || effectiveService(state, channel);
  const rf = status.reception;
  return (
    <div className="tv-menu diagnostics">
      <h2>Channel Diagnostics</h2>
      {channel && rf ? (
        <>
          <section>
            <h3>SIGNAL</h3>
            <dl>
              <dt>Strength</dt>
              <dd>{Math.round(rf.strength)}%</dd>
              <dt>Quality</dt>
              <dd>{Math.round(rf.quality)}%</dd>
              <dt>Stability</dt>
              <dd>
                {Math.round(rf.stability || 0)}% · {rf.state}
              </dd>
              <dt>Noise</dt>
              <dd>{Math.round(rf.noise || 0)}%</dd>
              <dt>Interference</dt>
              <dd>{Math.round(rf.interference || 0)}%</dd>
              <dt>Multipath / fading</dt>
              <dd>
                {Math.round(rf.multipath || 0)}% / {Math.round(rf.fading || 0)}%
              </dd>
            </dl>
          </section>
          <section>
            <h3>TUNING</h3>
            <dl>
              <dt>Frequency</dt>
              <dd>{channel.tunedFrequency} kHz</dd>
              <dt>RF channel</dt>
              <dd>{Math.round((channel.tunedFrequency - 306000) / 8000)}</dd>
              <dt>Multiplex</dt>
              <dd>MUX {channel.mux}</dd>
              <dt>Standard</dt>
              <dd>DVB-T2</dd>
            </dl>
          </section>
          <section>
            <h3>SERVICE</h3>
            <dl>
              <dt>Provider</dt>
              <dd>
                {service.free
                  ? "DTT Hungary"
                  : service.provider || service.providers?.join(", ")}
              </dd>
              <dt>Service type</dt>
              <dd>{service.type}</dd>
              <dt>Video</dt>
              <dd>
                {service.resolution}
                {service.aspectRatio ? ` · ${service.aspectRatio}` : ""}
              </dd>
              <dt>Encryption</dt>
              <dd>{service.free ? "Free" : "Coded"}</dd>
              <dt>Audio</dt>
              <dd>
                {service.audio === false
                  ? "Off"
                  : service.audioMode || "Stereo"}
              </dd>
              <dt>Subtitles</dt>
              <dd>
                {service.subtitles === false ? "Unavailable" : "Available"}
              </dd>
            </dl>
          </section>
          <section>
            <h3>RECEPTION</h3>
            <dl>
              <dt>Receiving tower</dt>
              <dd>{TOWER_PLAN[rf.towerId].name}</dd>
              <dt>Installed antenna</dt>
              <dd>{rf.antenna}</dd>
              <dt>Alignment</dt>
              <dd>{Math.round(rf.alignment)}%</dd>
              <dt>State</dt>
              <dd>{status.title}</dd>
            </dl>
          </section>
        </>
      ) : (
        <p>Select a stored terrestrial service to inspect its RF path.</p>
      )}
    </div>
  );
}

function UTVSettings() {
  const { state, set, dispatch } = useOS();
  const [section, setSection] = useState("Channel");
  return (
    <div className="tv-menu settings-menu">
      <aside>
        {["Picture", "Sound", "Channel", "Network", "System"].map((name) => (
          <button
            className={section === name ? "active" : ""}
            onClick={() => setSection(name)}
            key={name}
          >
            {name}
          </button>
        ))}
      </aside>
      <section>
        <h2>{section}</h2>
        {section === "Picture" && (
          <>
            <label>
              Picture mode
              <select
                value={state.lab.utv.pictureMode}
                onChange={(event) =>
                  set("lab.utv.pictureMode", event.target.value)
                }
              >
                {[
                  "Standard",
                  "Cinema",
                  "Sports",
                  "Vivid",
                  "Game",
                  "Custom",
                ].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              Screen format
              <select
                value={state.lab.utv.screenFormat}
                onChange={(event) =>
                  set("lab.utv.screenFormat", event.target.value)
                }
              >
                <option>Auto</option>
                <option>Wide</option>
                <option>Zoom</option>
              </select>
            </label>
            {state.lab.utv.pictureMode === "Custom" && (
              <>
                <Slider
                  label="Brightness"
                  value={state.lab.utv.picture.brightness}
                  onChange={(value) => set("lab.utv.picture.brightness", value)}
                />
                <Slider
                  label="Contrast"
                  value={state.lab.utv.picture.contrast}
                  onChange={(value) => set("lab.utv.picture.contrast", value)}
                />
                <Slider
                  label="Color"
                  value={state.lab.utv.picture.color}
                  onChange={(value) => set("lab.utv.picture.color", value)}
                />
                <Slider
                  label="Backlight"
                  value={state.lab.utv.picture.backlight}
                  onChange={(value) => set("lab.utv.picture.backlight", value)}
                />
              </>
            )}
          </>
        )}
        {section === "Sound" && (
          <>
            <Toggle
              label="TV speakers"
              checked={state.lab.utv.speakers}
              onChange={(value) => set("lab.utv.speakers", value)}
            />
            <label>
              Sound mode
              <select
                value={state.lab.utv.soundMode}
                onChange={(event) =>
                  set("lab.utv.soundMode", event.target.value)
                }
              >
                <option>Standard</option>
                <option>Cinema</option>
                <option>Music</option>
                <option>Voice</option>
              </select>
            </label>
          </>
        )}
        {section === "Channel" && (
          <div className="settings-tiles">
            <button onClick={() => set("lab.utv.page", "tuner")}>
              Channel Tuner<span>Automatic and manual search</span>
            </button>
            <button onClick={() => set("lab.utv.page", "guide")}>
              EPG<span>Now, next and reminders</span>
            </button>
            <button onClick={() => set("lab.utv.page", "diagnostics")}>
              Channel Diagnostics<span>RF, tuner and service path</span>
            </button>
          </div>
        )}
        {section === "Network" && <WifiPanel />}
        {section === "System" && (
          <>
            <label>
              Sleep timer
              <select
                value={state.lab.utv.sleepMinutes}
                onChange={(event) => {
                  const minutes = Number(event.target.value);
                  set("lab.utv.sleepMinutes", minutes);
                  set("lab.utv.sleepStartedAt", minutes ? Date.now() : null);
                }}
              >
                <option value="0">Off</option>
                {[15, 30, 60, 90, 120].map((value) => (
                  <option value={value} key={value}>
                    {value} min
                  </option>
                ))}
              </select>
            </label>
            <Toggle
              label="Picture-in-Picture"
              checked={state.lab.utv.pip.enabled}
              onChange={(value) => set("lab.utv.pip.enabled", value)}
            />
            {state.lab.utv.pip.enabled && (
              <>
                <label>
                  PIP source
                  <select
                    value={state.lab.utv.pip.source}
                    onChange={(event) =>
                      set("lab.utv.pip.source", event.target.value)
                    }
                  >
                    {["Live TV", "HDMI 1", "HDMI 2"]
                      .filter((source) => source !== state.lab.utv.input)
                      .map((source) => (
                        <option key={source}>{source}</option>
                      ))}
                  </select>
                </label>
                <label>
                  PIP position
                  <select
                    value={state.lab.utv.pip.position}
                    onChange={(event) =>
                      set("lab.utv.pip.position", event.target.value)
                    }
                  >
                    <option value="top-left">Top left</option>
                    <option value="top-right">Top right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                  </select>
                </label>
                <Button
                  onClick={() => {
                    const previousMain = state.lab.utv.input;
                    set("lab.utv.input", state.lab.utv.pip.source);
                    set("lab.utv.pip.source", previousMain);
                    set("lab.utv.page", "live");
                  }}
                >
                  Swap main and PIP
                </Button>
              </>
            )}
            <Button onClick={() => dispatch({ type: "UTV_FACTORY_RESET" })}>
              UTV Software Factory Reset
            </Button>
            <p>
              This resets software/setup/channels only. It does not repack
              physical devices.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function UTVHome() {
  const { state, set } = useOS();
  const online = utvInternet(state);
  return (
    <div className="utv-home">
      <header>
        <div>
          <b>ANTOИD</b>
          <span>UTV HOME</span>
        </div>
        <time>{nowTime()}</time>
      </header>
      <h1>Good evening</h1>
      <div
        className="utv-hero"
        onClick={() => {
          set("lab.utv.input", "Live TV");
          set("lab.utv.page", "live");
        }}
      >
        <LiveTV small />
        <span>Continue watching Live TV</span>
      </div>
      <div className="utv-home-row">
        {[
          ["Live TV", "live", "▣"],
          ["Guide", "guide", "▤"],
          ["Inputs", "inputs", "⇥"],
          ["Apps", "apps", "◆"],
          ["Channel List", "channels", "≡"],
          ["Network", "network", "⌁"],
          ["Settings", "settings", "⚙"],
        ].map(([name, page, icon]) => (
          <button key={name} onClick={() => set("lab.utv.page", page)}>
            <i>{icon}</i>
            <b>{name}</b>
          </button>
        ))}
      </div>
      <div className="smart-status">
        <b>Smart services</b>
        <span>
          {online ? "Online and ready" : "Connect a network to use Smart apps"}
        </span>
      </div>
    </div>
  );
}

function UTVApps() {
  const { state, set } = useOS();
  const online = utvInternet(state);
  const apps = [
    ["Antoid Cinema", "Original trailers and programme previews", "cinema"],
    ["Weather Map", "Live Lab weather and reception outlook", "weather"],
    ["Media Gallery", "Animated Antoid visual channels", "gallery"],
  ];
  if (state.lab.utv.smartApp)
    return (
      <div className="tv-menu smart-app-screen">
        <Button onClick={() => set("lab.utv.smartApp", null)}>← Apps</Button>
        <h2>{apps.find((app) => app[2] === state.lab.utv.smartApp)?.[0]}</h2>
        {online ? (
          <div className={`smart-app-content ${state.lab.utv.smartApp}`}>
            <i />
            <i />
            <i />
            <b>Connected Smart experience</b>
            <span>
              {state.lab.broadcast.weather} ·{" "}
              {state.lab.broadcast.weatherSeverity}% severity
            </span>
          </div>
        ) : (
          <div className="channel-failure">
            <b>Internet Unavailable</b>
            <span>The UTV remains usable for Live TV and local inputs.</span>
          </div>
        )}
      </div>
    );
  return (
    <div className="tv-menu smart-apps">
      <h2>Apps</h2>
      <p>
        {online ? "Internet available" : "Offline · connect Wi-Fi or Ethernet"}
      </p>
      {apps.map(([name, description, id]) => (
        <button onClick={() => set("lab.utv.smartApp", id)} key={id}>
          <i>{name[0]}</i>
          <b>{name}</b>
          <span>{description}</span>
        </button>
      ))}
    </div>
  );
}

function Inputs() {
  const { state, set } = useOS();
  const inputs = [
    [
      "Live TV",
      state.lab.cables.antennaToUtv
        ? "DVB-T2 antenna connected"
        : "Antenna disconnected",
    ],
    [
      "HDMI 1",
      state.lab.cables.dvdHdmiToUtv1 &&
      state.lab.cables.dvdPower &&
      state.lab.dvd.power === "on"
        ? "Antoid DVD Player"
        : "No Signal",
    ],
    [
      "HDMI 2",
      state.lab.cables.decoderHdmiToUtv2 &&
      state.lab.cables.decoderPower &&
      state.lab.decoder.power === "on"
        ? "Antoid Decoder Box"
        : "No Signal",
    ],
    [
      "SCART",
      state.lab.cables.decoderScartToUtv
        ? "Antoid Decoder Box"
        : state.lab.cables.dvdScartToUtv
          ? "Antoid DVD Player"
          : "No Signal",
    ],
    [
      "AV",
      state.lab.cables.dvdCompositeToUtv && state.lab.cables.dvdAudioToUtv
        ? "Antoid DVD Player"
        : "No Signal",
    ],
  ];
  return (
    <div className="tv-menu input-menu">
      <h2>Inputs</h2>
      {inputs.map(([input, status]) => (
        <button
          key={input}
          onClick={() => {
            set("lab.utv.input", input);
            set("lab.utv.page", "live");
          }}
        >
          <b>{input}</b>
          <span>{status}</span>
        </button>
      ))}
    </div>
  );
}

function VolumeOverlay() {
  const { state } = useOS();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!state.lab.utv.volumeRequest) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(timer);
  }, [state.lab.utv.volumeRequest]);
  if (!visible) return null;
  return (
    <div className="utv-volume-overlay" role="status">
      <b>{state.lab.utv.muted ? "MUTED" : "VOLUME"}</b>
      <i>
        <span
          style={{
            width: `${state.lab.utv.muted ? 0 : state.lab.utv.volume}%`,
          }}
        />
      </i>
      <strong>{state.lab.utv.muted ? "×" : state.lab.utv.volume}</strong>
    </div>
  );
}

function TVScreen() {
  const { state } = useOS();
  const page = state.lab.utv.page;
  const style = {
    filter: `brightness(${(state.lab.utv.pictureMode === "Vivid" ? 1.16 : state.lab.utv.pictureMode === "Cinema" ? 0.88 : state.lab.utv.picture.brightness / 50) * (state.lab.utv.picture.backlight / 70) * Math.max(0.08, state.lab.utv.panelHealth / 100)}) contrast(${state.lab.utv.pictureMode === "Vivid" ? 1.17 : state.lab.utv.picture.contrast / 50}) saturate(${state.lab.utv.pictureMode === "Cinema" ? 0.82 : state.lab.utv.picture.color / 50})`,
    "--refresh-instability": `${Math.max(0, 100 - state.lab.utv.refreshStability)}%`,
    "--refresh-opacity":
      Math.max(0, 100 - state.lab.utv.refreshStability) / 140,
  };
  if (!state.lab.cables.utvPower)
    return (
      <div className="utv-off">
        <i>○</i>
        <span>Power cable disconnected</span>
      </div>
    );
  if (state.lab.utv.power !== "on")
    return (
      <div className="utv-off">
        {state.lab.utv.power === "booting" ? (
          <>
            <b className="utv-boot-logo">ANTOИD</b>
            <i className="boot-spinner" />
            <span>Starting UTV 1</span>
          </>
        ) : (
          <>
            <i>●</i>
            <span>{state.lab.utv.power === "standby" ? "Standby" : "Off"}</span>
          </>
        )}
      </div>
    );
  if (!state.lab.utv.panelEnabled || !state.lab.utv.backlightEnabled)
    return (
      <div className="utv-off">
        <span>
          {!state.lab.utv.panelEnabled
            ? "Panel disabled by Controller Lab"
            : "Backlight disabled"}
        </span>
      </div>
    );
  if (state.lab.utv.panelHealth <= 2)
    return (
      <div className="utv-off">
        <span>Panel hardware failure</span>
      </div>
    );
  return (
    <div
      className={`utv-screen-content ${state.lab.utv.refreshStability < 70 ? "refresh-unstable" : ""}`}
      style={style}
    >
      {page === "home" && <UTVHome />}
      {page === "live" && <InputView />}
      {page === "inputs" && <Inputs />}
      {page === "network" && (
        <div className="tv-menu">
          <h2>Network</h2>
          <WifiPanel />
        </div>
      )}
      {page === "apps" && <UTVApps />}
      {page === "settings" && <UTVSettings />}
      {page === "guide" && <Guide />}
      {page === "tuner" && <ChannelTuner />}
      {page === "diagnostics" && <Diagnostics />}
      {page === "channels" && <ChannelList />}
      <VolumeOverlay />
      {page === "live" &&
        state.lab.utv.pip.enabled &&
        state.lab.utv.pip.source !== state.lab.utv.input && (
          <div className={`pip-window ${state.lab.utv.pip.position}`}>
            <PIPSource source={state.lab.utv.pip.source} />
            <b>{state.lab.utv.pip.source}</b>
          </div>
        )}
    </div>
  );
}

function UTVRemote({ setupMode = false }) {
  const { state, set, dispatch } = useOS();
  const [digits, setDigits] = useState("");
  const timer = useRef();
  const screenFocusIndex = useRef(-1);
  useEffect(() => () => clearTimeout(timer.current), []);
  const channels = state.lab.utv.storedChannels
    .filter(
      (channel) =>
        !channel.hidden && (!state.lab.utv.favoritesOnly || channel.favorite),
    )
    .sort((a, b) => a.channelNumber - b.channelNumber);
  const currentIndex = Math.max(
    0,
    channels.findIndex(
      (channel) => channel.id === state.lab.utv.currentChannelId,
    ),
  );
  const currentServiceStatus = playbackStatus(
    state,
    channels[currentIndex],
    "utv",
  );
  const setupStep = Math.min(
    6,
    Math.max(0, Number(state.lab.utv.setupStep) || 0),
  );
  const setupBack = () => set("lab.utv.setupStep", Math.max(0, setupStep - 1));
  const setupNext = () => {
    if (setupStep >= 6) set("lab.utv.setupComplete", true);
    else set("lab.utv.setupStep", setupStep + 1);
  };
  const setupChoice = (direction) => {
    if (setupStep === 1)
      set(
        "lab.utv.language",
        state.lab.utv.language === "English" ? "Magyar" : "English",
      );
    if (setupStep === 2)
      set(
        "lab.utv.mode",
        state.lab.utv.mode === "Home Mode" ? "Store or Demo Mode" : "Home Mode",
      );
    if (setupStep === 3) set("lab.utv.wifi.enabled", direction > 0);
    if (setupStep === 4) {
      const modes = ["Standard", "Cinema", "Sports", "Vivid", "Game", "Custom"];
      const index = Math.max(0, modes.indexOf(state.lab.utv.pictureMode));
      set(
        "lab.utv.pictureMode",
        modes[(index + direction + modes.length) % modes.length],
      );
    }
  };
  const screenControls = () =>
    Array.from(
      document.querySelectorAll(
        ".utv-screen-content button:not(:disabled), .utv-screen-content select:not(:disabled), .utv-screen-content input:not(:disabled)",
      ),
    ).filter((element) => element.offsetParent !== null);
  const moveScreenFocus = (direction) => {
    const controls = screenControls();
    if (!controls.length) return;
    const current = Math.min(screenFocusIndex.current, controls.length - 1);
    const next =
      current < 0
        ? 0
        : (current + direction + controls.length) % controls.length;
    controls.forEach((element) => element.classList.remove("remote-focused"));
    screenFocusIndex.current = next;
    controls[next].classList.add("remote-focused");
    controls[next].focus();
    controls[next].scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  const activateScreenFocus = () => {
    const controls = screenControls();
    const target = controls[screenFocusIndex.current];
    if (target) target.click();
    else moveScreenFocus(1);
  };
  const inLiveTv = state.lab.utv.page === "live";
  const togglePower = () => {
    if (!state.lab.cables.utvPower) {
      dispatch({ type: "TOAST", message: "UTV power cable is disconnected" });
      return;
    }
    if (state.lab.utv.power === "on") set("lab.utv.power", "standby");
    else {
      set("lab.utv.bootUntil", Date.now() + 900);
      set("lab.utv.power", "booting");
    }
  };
  const changeVolume = (nextVolume, muted = state.lab.utv.muted) => {
    set("lab.utv.volume", Math.max(0, Math.min(100, nextVolume)));
    set("lab.utv.muted", muted);
    set("lab.utv.volumeRequest", state.lab.utv.volumeRequest + 1);
  };
  const tuneIndex = (index) => {
    const channel = channels[(index + channels.length) % channels.length];
    if (channel) {
      dispatch({ type: "LAB_TUNE_CHANNEL", device: "utv", id: channel.id });
      set("lab.utv.input", "Live TV");
      set("lab.utv.page", "live");
    }
  };
  const digit = (value) => {
    const next = `${digits}${value}`.slice(-3);
    setDigits(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const channel = channels.find(
        (item) => item.channelNumber === Number(next),
      );
      if (channel) tuneIndex(channels.indexOf(channel));
      setDigits("");
    }, 900);
  };
  const playback = (command) => {
    if (state.lab.utv.input !== "HDMI 1" || state.lab.dvd.power !== "on")
      return command === "previous"
        ? tuneIndex(currentIndex - 1)
        : command === "next"
          ? tuneIndex(currentIndex + 1)
          : dispatch({
              type: "TOAST",
              message: `${command}: operation not available for this source`,
            });
    const dvd = state.lab.dvd;
    if (command === "previous")
      set("lab.dvd.chapter", Math.max(1, dvd.chapter - 1));
    if (command === "next")
      set(
        "lab.dvd.chapter",
        Math.min(dvd.disc?.chapters || 1, dvd.chapter + 1),
      );
    if (command === "rewind")
      set("lab.dvd.position", Math.max(0, dvd.position - 30));
    if (command === "forward") set("lab.dvd.position", dvd.position + 30);
    if (command === "play") set("lab.dvd.playing", !dvd.playing);
  };
  const key = (label, onClick, className = "") => (
    <button
      key={`${label}:${className}`}
      className={className}
      onClick={() => {
        sound("tap", 0.035);
        onClick?.();
      }}
    >
      {label}
    </button>
  );
  return (
    <aside className="remote utv-remote">
      <b>ANTOИD UTV</b>
      <div className="remote-top">
        {key("⏻", togglePower, "power")}
        {key("⌂", () =>
          setupMode ? set("lab.utv.setupStep", 0) : set("lab.utv.page", "home"),
        )}
        {key("⚙", () =>
          setupMode
            ? set("lab.utv.setupStep", 1)
            : set("lab.utv.page", "settings"),
        )}
        {key("⇥", () =>
          setupMode
            ? set("lab.utv.setupStep", 4)
            : set("lab.utv.page", "inputs"),
        )}
      </div>
      <div className="remote-shortcuts">
        {key("GUIDE", () => set("lab.utv.page", "guide"))}
        {key("INFO", () =>
          inLiveTv
            ? set("lab.utv.infoRequest", state.lab.utv.infoRequest + 1)
            : set("lab.utv.page", "diagnostics"),
        )}
        {key("MENU", () => set("lab.utv.page", "settings"))}
        {key("BACK", () =>
          setupMode ? setupBack() : set("lab.utv.page", "home"),
        )}
        {key("EXIT", () =>
          setupMode ? set("lab.utv.setupStep", 0) : set("lab.utv.page", "live"),
        )}
      </div>
      <div className="dpad">
        {key("▲", () =>
          setupMode
            ? setupChoice(-1)
            : inLiveTv
              ? tuneIndex(currentIndex - 1)
              : moveScreenFocus(-1),
        )}
        {key("◀", () =>
          setupMode
            ? setupBack()
            : inLiveTv
              ? changeVolume(state.lab.utv.volume - 1, false)
              : moveScreenFocus(-1),
        )}
        {key(
          "OK",
          () =>
            setupMode
              ? setupNext()
              : inLiveTv
                ? set("lab.utv.page", "channels")
                : activateScreenFocus(),
          "ok",
        )}
        {key("▶", () =>
          setupMode
            ? setupNext()
            : inLiveTv
              ? changeVolume(state.lab.utv.volume + 1, false)
              : moveScreenFocus(1),
        )}
        {key("▼", () =>
          setupMode
            ? setupChoice(1)
            : inLiveTv
              ? tuneIndex(currentIndex + 1)
              : moveScreenFocus(1),
        )}
      </div>
      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) =>
          key(value, () => digit(value)),
        )}
        {key("SUB", () => {
          if (currentServiceStatus.service?.subtitles === false)
            return dispatch({
              type: "TOAST",
              message: "Subtitles are unavailable on this service",
            });
          set("lab.utv.subtitles", !state.lab.utv.subtitles);
          set("lab.utv.infoRequest", state.lab.utv.infoRequest + 1);
        })}
        {key(0, () => digit(0))}
        {key("AUDIO", () => {
          set(
            "lab.utv.audioLanguage",
            state.lab.utv.audioLanguage === "Primary" ? "Alternate" : "Primary",
          );
          set("lab.utv.infoRequest", state.lab.utv.infoRequest + 1);
        })}
      </div>
      {digits && <output>{digits}</output>}
      <div className="remote-rockers">
        {key("VOL +", () => changeVolume(state.lab.utv.volume + 5, false))}
        {key("CH +", () => tuneIndex(currentIndex + 1))}
        {key("MUTE", () =>
          changeVolume(state.lab.utv.volume, !state.lab.utv.muted),
        )}
        {key("FAV", () =>
          set("lab.utv.favoritesOnly", !state.lab.utv.favoritesOnly),
        )}
        {key("VOL −", () => changeVolume(state.lab.utv.volume - 5, false))}
        {key("CH −", () => tuneIndex(currentIndex - 1))}
      </div>
      <div className="remote-colors">
        {key(
          "●",
          () => set("lab.utv.favoritesOnly", !state.lab.utv.favoritesOnly),
          "red",
        )}
        {key("●", () => set("lab.utv.page", "channels"), "green")}
        {key(
          "●",
          () =>
            set(
              "lab.utv.pictureMode",
              state.lab.utv.pictureMode === "Vivid" ? "Standard" : "Vivid",
            ),
          "yellow",
        )}
        {key("●", () => set("lab.utv.page", "diagnostics"), "blue")}
      </div>
      <div className="remote-playback">
        {key("⏮", () => playback("previous"))}
        {key("⏪", () => playback("rewind"))}
        {key("▶/Ⅱ", () => playback("play"))}
        {key("■", () => {
          set("lab.dvd.playing", false);
          set("lab.dvd.state", state.lab.dvd.disc ? "STOP" : "NO DISC");
        })}
        {key("⏩", () => playback("forward"))}
        {key("⏭", () => playback("next"))}
      </div>
    </aside>
  );
}

function CableBay() {
  const { state, set } = useOS();
  const connections = [
    ["antennaToUtv", "ANTENNA", "UTV ANT IN", "coax"],
    ["antennaToDecoder", "ANTENNA", "DECODER ANT IN", "coax"],
    ["dvdHdmiToUtv1", "DVD HDMI OUT", "UTV HDMI 1", "hdmi"],
    ["decoderHdmiToUtv2", "DECODER HDMI OUT", "UTV HDMI 2", "hdmi"],
    ["decoderScartToUtv", "DECODER SCART OUT", "UTV SCART", "scart"],
    ["dvdScartToUtv", "DVD SCART OUT", "UTV SCART", "scart"],
    ["dvdCompositeToUtv", "DVD VIDEO OUT", "UTV AV VIDEO", "composite"],
    ["dvdAudioToUtv", "DVD AUDIO OUT", "UTV AV AUDIO", "audio"],
    ["ethernetToUtv", "ROUTER LAN", "UTV LAN", "ethernet"],
    ["utvPower", "MAINS", "UTV POWER", "power"],
    ["decoderPower", "MAINS", "DECODER POWER", "power"],
    ["dvdPower", "MAINS", "DVD POWER", "power"],
  ];
  const [dragging, setDragging] = useState(null);
  const dragCompleted = useRef(false);
  const updateConnection = (id, connected) => {
    if (connected && id === "decoderScartToUtv")
      set("lab.cables.dvdScartToUtv", false);
    if (connected && id === "dvdScartToUtv")
      set("lab.cables.decoderScartToUtv", false);
    set(`lab.cables.${id}`, connected);
  };
  const startDrag = (event, id) => {
    dragCompleted.current = false;
    setDragging(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/antoid-cable", id);
  };
  const finishDrag = (id) => {
    if (!dragCompleted.current && state.lab.cables[id])
      updateConnection(id, false);
    setDragging(null);
  };
  return (
    <div className="cable-bay" aria-label="Physical cable patch bay">
      <header>
        <b>PHYSICAL CABLE BENCH</b>
        <span>
          Drag each loose plug into its matching socket. Click a plug for
          accessible connect/disconnect.
        </span>
      </header>
      <div className="cable-rack">
        {connections.map(([id, source, destination, type]) => {
          const connected = Boolean(state.lab.cables[id]);
          return (
            <article
              className={`physical-cable cable-${type} ${connected ? "connected" : "disconnected"} ${dragging === id ? "dragging" : ""}`}
              key={id}
            >
              <div className="cable-source-port">
                <i />
                {source}
              </div>
              <div className="cable-wire">
                <i />
              </div>
              <button
                className="cable-plug"
                draggable
                aria-label={`${connected ? "Unplug" : "Plug in"} ${source} to ${destination}`}
                aria-pressed={connected}
                onDragStart={(event) => startDrag(event, id)}
                onDragEnd={() => finishDrag(id)}
                onClick={() => {
                  updateConnection(id, !connected);
                  setDragging(null);
                }}
              >
                <i />
                <span>{type.toUpperCase()}</span>
              </button>
              <button
                type="button"
                className="cable-socket"
                aria-label={`Socket ${destination}`}
                onClick={() => {
                  if (!connected) updateConnection(id, true);
                  setDragging(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.dataTransfer.getData("text/antoid-cable") !== id)
                    return;
                  dragCompleted.current = true;
                  updateConnection(id, true);
                  setDragging(null);
                }}
              >
                <i />
                <span>{destination}</span>
                <strong>{connected ? "CONNECTED" : "OPEN PORT"}</strong>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DecoderSystemMenu() {
  const { state, set, dispatch } = useOS();
  const decoder = state.lab.decoder;
  const firmware = decoder.firmware;
  const uptime = Math.max(
    0,
    Math.floor((Date.now() - decoder.bootedAt) / 1000),
  );
  const busy = [
    "checking",
    "downloading",
    "verifying",
    "installing",
    "restarting",
  ].includes(firmware.status);
  return (
    <div className="tv-menu decoder-system">
      <header>
        <button onClick={() => set("lab.decoder.page", "home")}>← Menu</button>
        <h2>Decoder System</h2>
      </header>
      <section className="decoder-system-grid">
        <article>
          <h3>System Information</h3>
          <dl>
            <dt>Model</dt>
            <dd>Antoid ADB-1</dd>
            <dt>Serial</dt>
            <dd>ADB1-HU-40-082823</dd>
            <dt>Hardware revision</dt>
            <dd>ADB1-R3.2</dd>
            <dt>Firmware</dt>
            <dd>{firmware.version}</dd>
            <dt>Software build</dt>
            <dd>{firmware.build}</dd>
            <dt>Build date</dt>
            <dd>{firmware.buildDate}</dd>
            <dt>Bootloader</dt>
            <dd>{firmware.bootloader}</dd>
            <dt>Tuner firmware</dt>
            <dd>{firmware.tunerVersion}</dd>
            <dt>Conditional access</dt>
            <dd>{firmware.caVersion}</dd>
            <dt>Uptime</dt>
            <dd>
              {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m{" "}
              {uptime % 60}s
            </dd>
            <dt>Last boot reason</dt>
            <dd>{decoder.lastBootReason}</dd>
          </dl>
        </article>
        <article>
          <h3>Outputs &amp; resources</h3>
          <dl>
            <dt>HDMI output</dt>
            <dd>{decoder.hdmiEnabled ? "Enabled · 1080p" : "Disabled"}</dd>
            <dt>SCART output</dt>
            <dd>{decoder.scartEnabled ? "Enabled · PAL" : "Disabled"}</dd>
            <dt>Network</dt>
            <dd>
              {state.lab.cables.ethernetToUtv ? "Lab LAN available" : "Offline"}
            </dd>
            <dt>Storage</dt>
            <dd>1.4 GB / 4 GB available</dd>
            <dt>Memory</dt>
            <dd>312 MB / 512 MB free</dd>
            <dt>Update status</dt>
            <dd>{firmware.message}</dd>
            <dt>Inserted access card</dt>
            <dd>{decoder.card || "No card"}</dd>
          </dl>
          <Toggle
            label="HDMI output"
            checked={decoder.hdmiEnabled}
            onChange={(value) => set("lab.decoder.hdmiEnabled", value)}
          />
          <Toggle
            label="SCART output"
            checked={decoder.scartEnabled}
            onChange={(value) => set("lab.decoder.scartEnabled", value)}
          />
          <Toggle
            label="Subtitles"
            checked={decoder.subtitles}
            onChange={(value) => set("lab.decoder.subtitles", value)}
          />
          <label>
            Audio language
            <select
              value={decoder.audioLanguage}
              onChange={(event) =>
                set("lab.decoder.audioLanguage", event.target.value)
              }
            >
              <option>Primary</option>
              <option>Alternate</option>
            </select>
          </label>
          <label>
            Parental PIN
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={decoder.parentalPin}
              onChange={(event) =>
                set(
                  "lab.decoder.parentalPin",
                  event.target.value.replace(/\D/g, "").slice(0, 4),
                )
              }
            />
          </label>
          <Button
            tone="primary"
            disabled={busy}
            onClick={() => dispatch({ type: "DECODER_UPDATE_START" })}
          >
            Check for software updates
          </Button>
          <Button onClick={() => set("lab.decoder.page", "recovery")}>
            Open Recovery tools
          </Button>
          <Button
            onClick={() =>
              dispatch({ type: "DECODER_RECOVERY", mode: "factory" })
            }
          >
            Decoder Factory Reset
          </Button>
        </article>
      </section>
    </div>
  );
}

function DecoderFirmwareScreen() {
  const { state, dispatch } = useOS();
  const firmware = state.lab.decoder.firmware;
  const title =
    firmware.status === "checking"
      ? "Checking for updates…"
      : firmware.status === "complete"
        ? "Update complete"
        : firmware.status === "failed"
          ? "Update failed"
          : `${firmware.status[0].toUpperCase()}${firmware.status.slice(1)}`;
  return (
    <div className="decoder-update-screen">
      <b>ANTOИD DECODER</b>
      <h2>{title}</h2>
      <p>{firmware.message}</p>
      <div className="decoder-update-progress">
        <i style={{ width: `${firmware.progress}%` }} />
      </div>
      <strong>{firmware.progress}%</strong>
      {firmware.status === "failed" && (
        <Button
          onClick={() => dispatch({ type: "DECODER_RECOVERY", mode: "retry" })}
        >
          Retry Update
        </Button>
      )}
    </div>
  );
}

function DecoderRecovery() {
  const { state, dispatch } = useOS();
  return (
    <div className="decoder-recovery">
      <small>SAFE BOOT ENVIRONMENT</small>
      <h2>Antoid Decoder Recovery</h2>
      <p>{state.lab.decoder.firmware.message}</p>
      <div>
        <Button
          tone="primary"
          onClick={() => dispatch({ type: "DECODER_RECOVERY", mode: "retry" })}
        >
          Retry Update
        </Button>
        <Button
          onClick={() =>
            dispatch({ type: "DECODER_RECOVERY", mode: "restore" })
          }
        >
          Restore Firmware 4.0.3
        </Button>
        <Button
          onClick={() =>
            dispatch({ type: "DECODER_RECOVERY", mode: "restart" })
          }
        >
          Restart Decoder
        </Button>
        <Button
          onClick={() =>
            dispatch({ type: "DECODER_RECOVERY", mode: "factory" })
          }
        >
          Factory Reset Decoder
        </Button>
      </div>
    </div>
  );
}

function DecoderHome() {
  const { set } = useOS();
  const entries = [
    ["live", "Live TV"],
    ["channels", "Channels & order"],
    ["guide", "Programme Guide"],
    ["tuner", "Channel Search"],
    ["system", "System & Firmware"],
  ];
  return (
    <div className="tv-menu decoder-home">
      <p className="eyebrow">ANTOИD DECODER BOX</p>
      <h2>Main Menu</h2>
      <div>
        {entries.map(([page, label]) => (
          <button key={page} onClick={() => set("lab.decoder.page", page)}>
            {label}
            <span>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DecoderOutput({
  pinEntry = "",
  setPinEntry = null,
  masterVolume = null,
}) {
  const { state, set, dispatch } = useOS();
  const decoder = state.lab.decoder;
  const channel = decoder.storedChannels.find(
    (item) => item.id === decoder.currentChannelId,
  );
  const status = playbackStatus(state, channel, "decoder");
  if (!state.lab.cables.decoderPower || decoder.power !== "on")
    return (
      <div className="channel-failure">
        <b>
          {state.lab.cables.decoderPower ? "Decoder powered off" : "No power"}
        </b>
      </div>
    );
  if (decoder.page === "update") return <DecoderFirmwareScreen />;
  if (decoder.page === "recovery") return <DecoderRecovery />;
  if (decoder.page === "system") return <DecoderSystemMenu />;
  if (decoder.page === "home") return <DecoderHome />;
  if (decoder.page === "tuner") return <ChannelTuner device="decoder" />;
  if (decoder.page === "guide") return <Guide device="decoder" />;
  if (decoder.page === "channels") return <ChannelList device="decoder" />;
  return (
    <>
      <LiveTV device="decoder" masterVolume={masterVolume} />
      {status.kind === "parental" && (
        <div className="parental-pin">
          <b>Parental Control</b>
          <span>Enter four-digit PIN</span>
          {setPinEntry ? (
            <>
              <input
                aria-label="Parental PIN"
                type="password"
                inputMode="numeric"
                maxLength="4"
                value={pinEntry}
                onChange={(event) =>
                  setPinEntry(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
              />
              <Button
                onClick={() =>
                  pinEntry === decoder.parentalPin
                    ? set("lab.decoder.parentalUnlocked", true)
                    : dispatch({
                        type: "TOAST",
                        message: "Incorrect parental PIN",
                      })
                }
              >
                Unlock
              </Button>
            </>
          ) : (
            <small>Use the Decoder Box View to enter the PIN.</small>
          )}
        </div>
      )}
    </>
  );
}

function DecoderDevice() {
  const { state, set, dispatch } = useOS();
  const [pinEntry, setPinEntry] = useState("");
  const digitTimer = useRef();
  const decoderFocusIndex = useRef(-1);
  useEffect(() => () => clearTimeout(digitTimer.current), []);
  const decoder = state.lab.decoder;
  const decoderPowered =
    state.lab.cables.decoderPower && decoder.power === "on";
  const updateBusy = [
    "checking",
    "downloading",
    "verifying",
    "installing",
    "restarting",
  ].includes(decoder.firmware.status);
  const remoteDisabled = !decoderPowered || updateBusy;
  const remoteChannels = decoder.storedChannels
    .filter((item) => !item.hidden && (!decoder.favoritesOnly || item.favorite))
    .sort((a, b) => a.channelNumber - b.channelNumber);
  const tuneOffset = (offset) => {
    if (!remoteChannels.length)
      return dispatch({ type: "TOAST", message: "No channels stored" });
    const index = Math.max(
      0,
      remoteChannels.findIndex((item) => item.id === decoder.currentChannelId),
    );
    const target =
      remoteChannels[
        (index + offset + remoteChannels.length) % remoteChannels.length
      ];
    dispatch({ type: "LAB_TUNE_CHANNEL", device: "decoder", id: target.id });
    set("lab.decoder.page", "live");
  };
  const unavailable = (label) =>
    dispatch({
      type: "TOAST",
      message: `${label}: operation not available`,
    });
  const decoderScreenControls = () =>
    Array.from(
      document.querySelectorAll(
        ".decoder-ui button:not(:disabled), .decoder-ui select:not(:disabled), .decoder-ui input:not(:disabled)",
      ),
    ).filter((element) => element.offsetParent !== null);
  const moveDecoderFocus = (direction) => {
    const controls = decoderScreenControls();
    if (!controls.length) return unavailable("Navigation");
    const current = Math.min(decoderFocusIndex.current, controls.length - 1);
    const next =
      current < 0
        ? 0
        : (current + direction + controls.length) % controls.length;
    controls.forEach((element) => element.classList.remove("remote-focused"));
    decoderFocusIndex.current = next;
    controls[next].classList.add("remote-focused");
    controls[next].focus();
    controls[next].scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  const activateDecoderFocus = () => {
    const target = decoderScreenControls()[decoderFocusIndex.current];
    if (target) target.click();
    else moveDecoderFocus(1);
  };
  const toggleDecoderPower = () => {
    if (!state.lab.cables.decoderPower) {
      dispatch({
        type: "TOAST",
        message: "Decoder power cable is disconnected",
      });
      return;
    }
    set("lab.decoder.power", decoder.power === "on" ? "off" : "on");
  };
  const insertCard = (provider) => {
    if (!decoder.cardReaderEnabled) return;
    set("lab.decoder.card", provider);
    set("lab.decoder.parentalUnlocked", false);
  };
  const channel = decoder.storedChannels.find(
    (item) => item.id === decoder.currentChannelId,
  );
  const status = playbackStatus(state, channel, "decoder");
  const enterDigit = (digit) => {
    const next = `${decoder.numericEntry || ""}${digit}`.slice(-3);
    set("lab.decoder.numericEntry", next);
    clearTimeout(digitTimer.current);
    digitTimer.current = setTimeout(() => {
      const target = decoder.storedChannels.find(
        (item) => item.channelNumber === Number(next),
      );
      if (target)
        dispatch({
          type: "LAB_TUNE_CHANNEL",
          device: "decoder",
          id: target.id,
        });
      set("lab.decoder.numericEntry", "");
    }, 900);
  };
  return (
    <div className="device-focus decoder-focus">
      <section className="decoder-case">
        <div className="decoder-display">
          {!decoderPowered
            ? "OFF"
            : decoder.page === "recovery"
              ? "RECOVERY"
              : updateBusy
                ? decoder.firmware.status.slice(0, 7).toUpperCase()
                : status.kind === "coded"
                  ? "CODED"
                  : status.kind === "parental"
                    ? "PIN"
                    : status.kind === "no-signal"
                      ? "NO SIG"
                      : channel?.name?.slice(0, 8).toUpperCase() || "MENU"}
        </div>
        <b>ANTOИD DECODER</b>
        <i className={decoderPowered ? "on" : ""} />
        <button onClick={toggleDecoderPower}>⏻</button>
        <div
          className={`card-slot ${decoder.card ? "occupied" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const provider = event.dataTransfer.getData("text/antoid-card");
            if (["Telekom", "One", "Yettel"].includes(provider))
              insertCard(provider);
          }}
        >
          <span>{decoder.card ? `${decoder.card} CAM` : "CI+ CARD SLOT"}</span>
          {decoder.card && (
            <button
              aria-label={`Eject ${decoder.card} card`}
              onClick={() => insertCard(null)}
            >
              EJECT
            </button>
          )}
        </div>
      </section>
      <div className="decoder-ui">
        <DecoderOutput pinEntry={pinEntry} setPinEntry={setPinEntry} />
      </div>
      <aside className="provider-cards">
        <h3>Provider cards</h3>
        {["Telekom", "One", "Yettel"].map((provider) => (
          <button
            className={decoder.card === provider ? "inserted" : ""}
            disabled={!decoder.cardReaderEnabled}
            draggable={decoder.card !== provider}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/antoid-card", provider);
            }}
            onClick={() => {
              insertCard(decoder.card === provider ? null : provider);
            }}
            key={provider}
          >
            <i />
            {provider}
            <span>{decoder.card === provider ? "Eject" : "Insert"}</span>
          </button>
        ))}
      </aside>
      <aside className="remote decoder-remote full-decoder-remote">
        <b>DECODER</b>
        <button onClick={toggleDecoderPower}>POWER</button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "home")}
        >
          HOME
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "system")}
        >
          MENU
        </button>
        <button disabled={remoteDisabled} onClick={() => unavailable("SOURCE")}>
          SOURCE
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "guide")}
        >
          GUIDE
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            decoder.page === "live"
              ? set("lab.decoder.infoRequest", decoder.infoRequest + 1)
              : unavailable("INFO")
          }
        >
          INFO
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "home")}
        >
          BACK
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "live")}
        >
          EXIT
        </button>
        <div className="decoder-dpad">
          <button
            disabled={remoteDisabled}
            onClick={() =>
              decoder.page === "live" ? tuneOffset(-1) : moveDecoderFocus(-1)
            }
          >
            ▲
          </button>
          <button
            disabled={remoteDisabled}
            onClick={() =>
              decoder.page === "live"
                ? set("lab.decoder.volume", Math.max(0, decoder.volume - 1))
                : moveDecoderFocus(-1)
            }
          >
            ◀
          </button>
          <button
            disabled={remoteDisabled}
            onClick={() =>
              decoder.page === "live"
                ? set("lab.decoder.page", "channels")
                : activateDecoderFocus()
            }
          >
            OK
          </button>
          <button
            disabled={remoteDisabled}
            onClick={() =>
              decoder.page === "live"
                ? set("lab.decoder.volume", Math.min(100, decoder.volume + 1))
                : moveDecoderFocus(1)
            }
          >
            ▶
          </button>
          <button
            disabled={remoteDisabled}
            onClick={() =>
              decoder.page === "live" ? tuneOffset(1) : moveDecoderFocus(1)
            }
          >
            ▼
          </button>
        </div>
        <div className="number-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
            <button
              disabled={remoteDisabled}
              onClick={() => enterDigit(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </div>
        {decoder.numericEntry && <output>{decoder.numericEntry}</output>}
        <button disabled={remoteDisabled} onClick={() => tuneOffset(1)}>
          CH +
        </button>
        <button disabled={remoteDisabled} onClick={() => tuneOffset(-1)}>
          CH −
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            set("lab.decoder.volume", Math.min(100, decoder.volume + 5))
          }
        >
          VOL +
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            set("lab.decoder.volume", Math.max(0, decoder.volume - 5))
          }
        >
          VOL −
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.muted", !decoder.muted)}
        >
          MUTE
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            set("lab.decoder.favoritesOnly", !decoder.favoritesOnly)
          }
        >
          FAV
        </button>
        <button
          className="red"
          disabled={remoteDisabled}
          onClick={() =>
            set("lab.decoder.favoritesOnly", !decoder.favoritesOnly)
          }
        >
          ●
        </button>
        <button
          className="green"
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "channels")}
        >
          ●
        </button>
        <button
          className="yellow"
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "tuner")}
        >
          ●
        </button>
        <button
          className="blue"
          disabled={remoteDisabled}
          onClick={() => set("lab.decoder.page", "system")}
        >
          ●
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            status.service?.subtitles === false
              ? unavailable("SUBTITLE")
              : set("lab.decoder.subtitles", !decoder.subtitles)
          }
        >
          SUBTITLE
        </button>
        <button
          disabled={remoteDisabled}
          onClick={() =>
            set(
              "lab.decoder.audioLanguage",
              decoder.audioLanguage === "Primary" ? "Alternate" : "Primary",
            )
          }
        >
          AUDIO
        </button>
        {["⏮", "⏪", "▶/Ⅱ", "■", "⏩", "⏭"].map((label) => (
          <button
            disabled={remoteDisabled}
            key={label}
            onClick={() => unavailable(label)}
          >
            {label}
          </button>
        ))}
      </aside>
    </div>
  );
}

function DVDOutput({ silent = false, masterVolume = null }) {
  const { state, set } = useOS();
  const dvd = state.lab.dvd;
  const audioRef = useRef(null);
  useEffect(() => {
    audioRef.current?.stop?.();
    audioRef.current =
      !silent && dvd.disc && dvd.playing && dvd.audioEnabled
        ? startServiceAudio(
            { id: `dvd:${dvd.disc.id}:chapter:${dvd.chapter}` },
            masterVolume == null ? 0.18 : masterVolume,
          )
        : null;
    return () => audioRef.current?.stop?.();
  }, [
    dvd.disc?.id,
    dvd.chapter,
    dvd.playing,
    dvd.audioEnabled,
    silent,
    masterVolume,
  ]);
  if (dvd.state === "SETUP")
    return (
      <div className="dvd-setup-screen">
        <header>ANTOИD DVD SETUP</header>
        <section>
          <h3>VIDEO</h3>
          <label>
            TV system
            <select
              value={dvd.settings.system}
              onChange={(event) =>
                set("lab.dvd.settings.system", event.target.value)
              }
            >
              <option>PAL</option>
              <option>NTSC</option>
            </select>
          </label>
          <label>
            Aspect ratio
            <select
              value={dvd.settings.aspect}
              onChange={(event) =>
                set("lab.dvd.settings.aspect", event.target.value)
              }
            >
              <option>16:9</option>
              <option>4:3 Letterbox</option>
              <option>4:3 Pan Scan</option>
            </select>
          </label>
          <label>
            HDMI resolution
            <select
              value={dvd.settings.resolution}
              onChange={(event) =>
                set("lab.dvd.settings.resolution", event.target.value)
              }
            >
              <option>576p</option>
              <option>720p</option>
              <option>1080p</option>
            </select>
          </label>
        </section>
        <section>
          <h3>AUDIO / LANGUAGE / SYSTEM</h3>
          <p>HDMI Audio: {dvd.hdmiEnabled ? "On" : "Off"}</p>
          <p>Downmix: Stereo</p>
          <p>Menu: {dvd.settings.menuLanguage}</p>
          <p>Firmware: DVD-4.0.0 · Region {dvd.region}</p>
          <Button
            onClick={() => set("lab.dvd.state", dvd.disc ? "DVD" : "NO DISC")}
          >
            Exit Setup
          </Button>
        </section>
      </div>
    );
  if (dvd.tray === "open")
    return (
      <div className="dvd-output dvd-transport">
        <b>OPEN</b>
        <span>
          {dvd.disc ? `${dvd.disc.title} resting in tray` : "Empty disc tray"}
        </span>
      </div>
    );
  if (
    dvd.tray === "closing" ||
    ["CLOSING", "READING", "READ RETRY"].includes(dvd.state)
  )
    return (
      <div className="dvd-output dvd-transport reading">
        <i />
        <b>{dvd.state}</b>
        <span>
          {dvd.state === "CLOSING"
            ? "Closing disc tray…"
            : "Reading optical media…"}
        </span>
      </div>
    );
  if (dvd.state === "DISC ERROR")
    return (
      <div className="dvd-output disc-error">
        <b>DISC ERROR</b>
        <span>The laser could not recover a stable data track.</span>
      </div>
    );
  if (!dvd.disc)
    return (
      <div className="dvd-output empty-disc">
        <b>NO DISC</b>
      </div>
    );
  if (dvd.disc.region !== dvd.region)
    return (
      <div className="dvd-output region-error">
        <b>REGION ERROR</b>
        <span>
          This disc cannot be played because its region code is incompatible
          with this player.
        </span>
      </div>
    );
  const readScore =
    dvd.disc.condition * 0.5 +
    dvd.laserHealth * 0.28 +
    dvd.trackingStability * 0.12 +
    dvd.focusStability * 0.1;
  if (readScore < 48)
    return (
      <div className="dvd-output disc-error">
        <b>DISC ERROR</b>
        <span>Optical tracking could not recover the chapter.</span>
      </div>
    );
  if (["DVD MENU", "TITLE MENU"].includes(dvd.state))
    return (
      <div className={`dvd-title-menu dvd-${dvd.disc.theme}`}>
        <small>{dvd.state}</small>
        <h2>{dvd.disc.title}</h2>
        <p>Select chapter</p>
        <div>
          {Array.from({ length: dvd.disc.chapters }, (_, index) => (
            <button
              key={index}
              onClick={() => {
                set("lab.dvd.chapter", index + 1);
                set("lab.dvd.state", "PLAY");
                set("lab.dvd.playing", true);
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <div
      className={`dvd-output dvd-${dvd.disc.theme} ${dvd.playing ? "playing" : "paused"}`}
    >
      <div className="dvd-scene">
        <i />
        <i />
        <i />
      </div>
      <span>{dvd.disc.title}</span>
      <b>CHAPTER {String(dvd.chapter).padStart(2, "0")}</b>
      <small>{dvd.playing ? "PLAY" : "PAUSE"}</small>
      <em>
        {dvd.subtitles !== "Off" ? `${dvd.subtitles} subtitles` : ""}{" "}
        {dvd.state === "PLAYBACK INFO"
          ? `· ${dvd.audioTrack} · ${dvd.position}s`
          : ""}
      </em>
    </div>
  );
}

function DVDDevice() {
  const { state, set, dispatch } = useOS();
  const dvd = state.lab.dvd;
  const dvdPowered = state.lab.cables.dvdPower && dvd.power === "on";
  const dvdReady =
    dvdPowered &&
    dvd.disc &&
    dvd.tray === "closed" &&
    ![
      "CLOSING",
      "READING",
      "READ RETRY",
      "DISC ERROR",
      "REGION ERROR",
    ].includes(dvd.state);
  const insert = (disc) => {
    if (dvd.tray !== "open") return;
    if (dvd.disc?.id === disc.id) {
      set("lab.dvd.disc", null);
      set("lab.dvd.state", "OPEN");
      return;
    }
    set("lab.dvd.disc", disc);
    set("lab.dvd.playing", false);
    set("lab.dvd.state", "DISC IN TRAY");
  };
  const command = (name) => {
    if (name === "power") {
      if (!state.lab.cables.dvdPower)
        return dispatch({
          type: "TOAST",
          message: "DVD power cable is disconnected",
        });
      return set("lab.dvd.power", dvd.power === "on" ? "off" : "on");
    }
    if (name === "tray") {
      if (!dvdPowered) return;
      if (dvd.trayJammed) return set("lab.dvd.state", "TRAY JAM");
      if (dvd.tray === "open") {
        set("lab.dvd.tray", "closing");
        set("lab.dvd.playing", false);
        set("lab.dvd.state", "CLOSING");
        set("lab.dvd.readStartedAt", Date.now());
        return set("lab.dvd.readToken", (dvd.readToken || 0) + 1);
      }
      set("lab.dvd.tray", "open");
      set("lab.dvd.playing", false);
      set("lab.dvd.readStartedAt", 0);
      return set("lab.dvd.state", "OPEN");
    }
    if (!dvdPowered) return;
    if (name === "setup") return set("lab.dvd.state", "SETUP");
    if (name === "return")
      return set("lab.dvd.state", dvd.disc ? "DVD" : "NO DISC");
    if (
      !dvd.disc ||
      dvd.tray !== "closed" ||
      ["CLOSING", "READING", "READ RETRY", "DISC ERROR"].includes(dvd.state)
    )
      return;
    if (name === "menu") return set("lab.dvd.state", "DVD MENU");
    if (name === "title") return set("lab.dvd.state", "TITLE MENU");
    if (name === "rewind")
      return set("lab.dvd.position", Math.max(0, dvd.position - 30));
    if (name === "forward") return set("lab.dvd.position", dvd.position + 30);
    if (name === "display")
      return set(
        "lab.dvd.state",
        dvd.state === "PLAYBACK INFO" ? "PLAY" : "PLAYBACK INFO",
      );
    if (name === "angle")
      return dispatch({
        type: "TOAST",
        message: "Operation not available on this disc",
      });
    if (name === "play") {
      set("lab.dvd.playing", true);
      set("lab.dvd.state", "PLAY");
    }
    if (name === "pause") {
      set("lab.dvd.playing", false);
      set("lab.dvd.state", "PAUSE");
    }
    if (name === "stop") {
      set("lab.dvd.playing", false);
      set("lab.dvd.chapter", 1);
      set("lab.dvd.state", "STOP");
    }
    if (name === "next")
      set("lab.dvd.chapter", Math.min(dvd.disc.chapters, dvd.chapter + 1));
    if (name === "previous")
      set("lab.dvd.chapter", Math.max(1, dvd.chapter - 1));
  };
  return (
    <div className="device-focus dvd-focus">
      <div className="dvd-preview">
        {dvdPowered ? (
          <DVDOutput />
        ) : (
          <div className="channel-failure">
            <b>{state.lab.cables.dvdPower ? "DVD powered off" : "No power"}</b>
          </div>
        )}
      </div>
      <section className="dvd-case">
        <b>ANTOИD DVD</b>
        <div className="dvd-front-display">
          {dvdPowered ? dvd.state : "OFF"}
        </div>
        <div className={`disc-tray ${dvd.tray}`}>
          <span>{dvd.disc?.title || "EMPTY TRAY"}</span>
        </div>
        {[
          ["⏻", "power"],
          ["⏏", "tray"],
          ["▶", "play"],
          ["Ⅱ", "pause"],
          ["■", "stop"],
          ["|◀", "previous"],
          ["▶|", "next"],
        ].map(([label, name]) => (
          <button
            disabled={
              name !== "power" && (name === "tray" ? !dvdPowered : !dvdReady)
            }
            onClick={() => command(name)}
            key={name}
          >
            {label}
          </button>
        ))}
      </section>
      <aside className="physical-discs">
        <h3>Physical DVD cases</h3>
        {dvd.availableDiscs.map((disc) => (
          <button
            className={dvd.disc?.id === disc.id ? "inserted" : ""}
            disabled={dvd.tray !== "open"}
            onClick={() => insert(disc)}
            key={disc.id}
          >
            <i style={{ "--disc-hue": `${disc.id.length * 73}` }} />
            <b>{disc.title}</b>
            <span>
              {dvd.disc?.id === disc.id
                ? "Lift disc from tray"
                : `Region ${disc.region} · ${disc.condition}% condition`}
            </span>
          </button>
        ))}
      </aside>
      <aside className="remote dvd-remote">
        <b>DVD</b>
        {[
          ["POWER", "power"],
          ["OPEN/CLOSE", "tray"],
          ["MENU", "menu"],
          ["TITLE", "title"],
          ["RETURN", "return"],
          ["PLAY/PAUSE", dvd.playing ? "pause" : "play"],
          ["STOP", "stop"],
          ["PREVIOUS", "previous"],
          ["NEXT", "next"],
          ["REWIND", "rewind"],
          ["FAST FORWARD", "forward"],
          ["ANGLE", "angle"],
          ["DISPLAY", "display"],
          ["SETUP", "setup"],
        ].map(([label, name]) => (
          <button
            disabled={
              name !== "power" &&
              (name === "tray" || name === "setup" || name === "return"
                ? !dvdPowered
                : !dvdReady)
            }
            onClick={() => command(name)}
            key={label}
          >
            {label}
          </button>
        ))}
        <div className="number-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
            <button
              disabled={!dvdReady}
              onClick={() =>
                dvd.disc &&
                number > 0 &&
                number <= dvd.disc.chapters &&
                set("lab.dvd.chapter", number)
              }
              key={number}
            >
              {number}
            </button>
          ))}
        </div>
        <button
          disabled={!dvdReady}
          onClick={() =>
            set(
              "lab.dvd.subtitles",
              dvd.subtitles === "Off" ? "English" : "Off",
            )
          }
        >
          SUBTITLE
        </button>
        <button
          disabled={!dvdReady}
          onClick={() =>
            set(
              "lab.dvd.audioTrack",
              dvd.audioTrack === "English 2.0"
                ? "Hungarian 2.0"
                : "English 2.0",
            )
          }
        >
          AUDIO
        </button>
      </aside>
    </div>
  );
}

function UTVBench() {
  const { state, set, dispatch } = useOS();
  const view = state.lab.deviceView || "utv";
  useEffect(() => {
    if (
      !state.lab.utv.sleepMinutes ||
      state.lab.utv.power !== "on" ||
      !state.lab.utv.sleepStartedAt
    )
      return;
    const remaining =
      state.lab.utv.sleepMinutes * 60000 -
      (Date.now() - state.lab.utv.sleepStartedAt);
    if (remaining <= 0) {
      set("lab.utv.power", "standby");
      return;
    }
    const warningDelay = Math.max(0, remaining - 60000);
    const warning = setTimeout(
      () =>
        dispatch({
          type: "TOAST",
          message: "UTV will enter standby in one minute",
        }),
      warningDelay,
    );
    const sleep = setTimeout(() => set("lab.utv.power", "standby"), remaining);
    return () => {
      clearTimeout(warning);
      clearTimeout(sleep);
    };
  }, [
    state.lab.utv.sleepMinutes,
    state.lab.utv.sleepStartedAt,
    state.lab.utv.power,
  ]);
  useEffect(() => {
    if (!state.lab.utv.reminders.length) return;
    const check = () => {
      for (const channel of state.lab.utv.storedChannels) {
        const programme = programFor(channel);
        if (!state.lab.utv.reminders.includes(programme.current.id)) continue;
        set(
          "lab.utv.reminders",
          state.lab.utv.reminders.filter((id) => id !== programme.current.id),
        );
        dispatch({
          type: "MODAL",
          modal: {
            icon: "▤",
            title: "Starting now",
            body: `${programme.current.title}\n${channel.name}`,
            actions: [
              { label: "Dismiss" },
              {
                label: "Watch",
                onClick: () => {
                  dispatch({
                    type: "LAB_TUNE_CHANNEL",
                    device: "utv",
                    id: channel.id,
                  });
                  set("lab.utv.input", "Live TV");
                  set("lab.utv.page", "live");
                },
              },
            ],
          },
        });
        break;
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [state.lab.utv.reminders, state.lab.utv.storedChannels]);
  return (
    <main className="utv-lab">
      <header className="lab-topbar">
        <button onClick={() => set("lab.activeDevice", "welcome")}>
          ← Antoid Lab
        </button>
        <div>
          <b>ANTO ID LAB</b>
          <span>Shared physical world · v5.0.0 Public Beta</span>
        </div>
        <button onClick={() => dispatch({ type: "LAB_REPACK" })}>
          Reset / repack Lab
        </button>
      </header>
      <div className="utv-workspace">
        <section className="utv-workbench">
          <nav className="device-view-tabs">
            {deviceTabs.map((id) => (
              <button
                className={view === id ? "active" : ""}
                onClick={() => set("lab.deviceView", id)}
                key={id}
              >
                {id === "utv"
                  ? "UTV View"
                  : id === "decoder"
                    ? "Decoder Box View"
                    : "DVD Player View"}
              </button>
            ))}
          </nav>
          {view === "utv" && (
            <div className="utv-stage">
              <div className="utv-set front">
                <div className="utv-bezel">
                  <TVScreen />
                </div>
                <div className="utv-stand" />
              </div>
              <UTVRemote />
            </div>
          )}
          {view === "decoder" && <DecoderDevice />}
          {view === "dvd" && <DVDDevice />}
          <CableBay />
        </section>
        <UTVControllerPanel />
      </div>
    </main>
  );
}

export function AntoidUTVScene() {
  const { state, set, dispatch } = useOS();
  useEffect(() => {
    const active = ["utv", "decoder"].filter(
      (device) => state.lab[device].scan.status === "scanning",
    );
    if (!active.length) return;
    const timer = setTimeout(
      () =>
        active.forEach((device) => dispatch({ type: "LAB_SCAN_TICK", device })),
      165,
    );
    return () => clearTimeout(timer);
  }, [
    state.lab.utv.scan.status,
    state.lab.utv.scan.index,
    state.lab.decoder.scan.status,
    state.lab.decoder.scan.index,
  ]);
  useEffect(() => {
    if (state.lab.utv.power !== "booting") return;
    const remaining = Math.max(
      0,
      (state.lab.utv.bootUntil || Date.now()) - Date.now(),
    );
    const timer = setTimeout(() => set("lab.utv.power", "on"), remaining);
    return () => clearTimeout(timer);
  }, [state.lab.utv.power, state.lab.utv.bootUntil]);
  useEffect(() => {
    const dvd = state.lab.dvd;
    if (!dvd.readStartedAt || dvd.tray !== "closing") return;
    const readScore = dvdReadScore(dvd);
    const close = setTimeout(() => {
      set("lab.dvd.tray", "closed");
      set("lab.dvd.state", dvd.disc ? "READING" : "NO DISC");
    }, 260);
    const retry =
      dvd.disc && readScore < 58
        ? setTimeout(() => set("lab.dvd.state", "READ RETRY"), 850)
        : null;
    const finish = setTimeout(
      () => {
        set("lab.dvd.readStartedAt", 0);
        set("lab.dvd.playing", false);
        set("lab.dvd.state", dvdReadOutcome(dvd));
      },
      readScore < 58 ? 1550 : 1100,
    );
    return () => {
      clearTimeout(close);
      if (retry) clearTimeout(retry);
      clearTimeout(finish);
    };
  }, [state.lab.dvd.readToken]);
  useEffect(() => {
    if (
      ![
        "checking",
        "downloading",
        "verifying",
        "installing",
        "restarting",
      ].includes(state.lab.decoder.firmware.status)
    )
      return;
    const timer = setTimeout(
      () => dispatch({ type: "DECODER_UPDATE_TICK" }),
      state.lab.decoder.firmware.status === "restarting" ? 850 : 360,
    );
    return () => clearTimeout(timer);
  }, [
    state.lab.decoder.firmware.status,
    state.lab.decoder.firmware.progress,
    state.lab.decoder.firmware.fault,
  ]);
  if (!state.lab.antenna.selected) return <AntennaSelection />;
  if (!state.lab.unboxing.complete) return <UTVUnboxing />;
  if (
    ["off", "booting"].includes(state.lab.utv.power) &&
    !state.lab.utv.setupComplete
  )
    return <UTVSetupBench firstPower />;
  if (!state.lab.utv.setupComplete) return <UTVSetupBench />;
  return <UTVBench />;
}
