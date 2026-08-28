import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CORE_APPS,
  CARRIERS,
  STORE_APPS,
  useOS,
  useSystemBack,
} from "../state/OSContext.jsx";
import { voiceBearer } from "../services/core.js";
import { sound } from "../services/audio.js";
import { ANTOID_SYSTEM } from "../config/version.js";
import { hardwareCapabilities } from "../services/hardware.js";
import { batteryModel, formatRuntime } from "../services/battery.js";
import {
  Avatar,
  Button,
  FormField,
  Header,
  Segmented,
  SignalBars,
  Slider,
  Toggle,
} from "../components/UI.jsx";
import { SIMManagerPanel } from "../components/SystemUI.jsx";

const categories = [
  ["Account", "Antoid ID, name and customization", "◉"],
  ["Connectivity", "Wi-Fi, SIM, mobile, Bluetooth and hotspot", "⌁"],
  ["Notifications", "Previews, app alerts and history", "◌"],
  ["Sound", "Volumes, tones, silent and DND", "♫"],
  ["Display", "Brightness, theme, wallpaper and text", "☀"],
  ["Home Screen", "Layout, icons, folders and widgets", "▦"],
  ["Lock Screen", "PIN, previews and shortcuts", "▣"],
  ["Security", "PIN, SIM PIN, permissions and emergency", "◇"],
  ["Privacy", "Location, camera, microphone and clipboard", "◎"],
  ["Battery", "Charging, Saver, drain and screen time", "ϟ"],
  ["Storage", "Apps, photos, downloads, cleaner and trash", "◫"],
  ["Apps", "Installed apps, permissions and local data", "A"],
  ["Digital Wellbeing", "Screen time, focus and app timers", "◷"],
  ["Accessibility", "Text, contrast, motion, color and keyboard", "♿"],
  ["General", "Language, backup, update, reset and About", "⚙"],
];
const palette = [
  "#3ce5aa",
  "#45a7ff",
  "#8f6bff",
  "#ff5f8f",
  "#ffad42",
  "#e4e84c",
];

function WiFiSettings() {
  const { state, set, dispatch } = useOS();
  const [selected, setSelected] = useState(null),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [status, setStatus] = useState("");
  useSystemBack(() => {
    setSelected(null);
    return true;
  }, !!selected);
  const networks = [
    ["TP-Link B440", 4],
    ...[...state.wifi.names].map((n, i) => [n, 3 - i]),
  ];
  const connect = () => {
    if (selected !== "TP-Link B440" || password !== "1112") {
      setStatus(
        selected === "TP-Link B440"
          ? "Incorrect password"
          : "Couldn't connect — incorrect password",
      );
      sound("error");
      dispatch({
        type: "NOTIFY",
        title: "Wi-Fi error",
        body: `Couldn’t connect to ${selected}`,
      });
      return;
    }
    setStatus("Authenticating…");
    setTimeout(() => setStatus("Obtaining IP address…"), 500);
    setTimeout(() => {
      dispatch({ type: "WIFI_CONNECTED" });
      setStatus("Connected");
      sound("success");
    }, 1100);
  };
  return (
    <div>
      <Toggle
        label="Wi-Fi"
        description={state.wifi.connected || "Three networks available"}
        checked={state.radio.wifi}
        onChange={(v) => {
          set("radio.wifi", v);
          if (!v) dispatch({ type: "WIFI_DISCONNECT" });
        }}
      />
      <div className="wifi-list">
        {networks.map(([name, bars]) => (
          <button
            key={name}
            disabled={!state.radio.wifi}
            onClick={() => {
              setSelected(name);
              setStatus("");
              setPassword("");
            }}
          >
            <span>⌁</span>
            <div>
              <b>{name}</b>
              <small>
                {state.wifi.connected === name
                  ? "Connected · 192.168.1.24"
                  : `${bars === 4 ? "Strong" : bars === 3 ? "Medium" : "Weak"} · Secured`}
              </small>
            </div>
            <i>{"▮".repeat(bars)}</i>
          </button>
        ))}
      </div>
      {selected && (
        <div
          className={`wifi-dialog ${status.includes("incorrect") ? "shake-once" : ""}`}
        >
          <h3>{selected}</h3>
          <FormField
            label="Password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Toggle label="Show password" checked={show} onChange={setShow} />
          {status && (
            <p className={status.includes("incorrect") ? "error" : ""}>
              {status}
            </p>
          )}
          <div className="action-grid">
            <Button onClick={() => setSelected(null)}>Cancel</Button>
            <Button tone="primary" onClick={connect}>
              Connect
            </Button>
          </div>
        </div>
      )}
      {state.wifi.connected && (
        <div className="info-card">
          <b>TP-Link B440</b>
          <span>IP address 192.168.1.24</span>
          <span>Security WPA2 · Strong signal</span>
          <div>
            <Button onClick={() => dispatch({ type: "WIFI_DISCONNECT" })}>
              Disconnect
            </Button>
            <Button onClick={() => dispatch({ type: "WIFI_FORGET" })}>
              Forget
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Connectivity() {
  const { state, set, dispatch, net } = useOS();
  const [sub, setSub] = useState("Overview");
  useSystemBack(() => {
    setSub("Overview");
    return true;
  }, sub !== "Overview");
  return (
    <>
      <Segmented
        value={sub}
        onChange={setSub}
        items={["Overview", "Wi-Fi", "SIM Manager", "Bluetooth", "Hotspot"]}
        label="Connectivity page"
      />
      {sub === "Overview" && (
        <div className="settings-stack">
          <div className="hero-setting">
            <span className={net.isOnline ? "online" : ""}>●</span>
            <div>
              <h3>{net.onlineVia}</h3>
              <p>
                {net.isOnline
                  ? `${net.quality} · ${net.bandwidth.toFixed(1)} Mbps · ${net.latency} ms`
                  : "No internet connection"}
              </p>
            </div>
          </div>
          <Toggle
            label="Airplane Mode"
            description="Turns cellular and Wi-Fi off; Wi-Fi may be restored manually."
            checked={state.radio.airplane}
            onChange={() => dispatch({ type: "AIRPLANE" })}
          />
          <Toggle
            label="Mobile data"
            description={`Default: ${state.sim[state.defaults.data].label}`}
            checked={state.radio.mobileData}
            onChange={(v) => set("radio.mobileData", v)}
          />
          <Button onClick={() => setSub("Wi-Fi")}>Open Wi-Fi</Button>
          <Button onClick={() => setSub("SIM Manager")}>
            Physical SIM, eSIM & voice
          </Button>
          <div className="diagnostics">
            <h3>Network diagnostics</h3>
            <dl>
              <dt>Status</dt>
              <dd>{net.isOnline ? "Online" : "Offline"}</dd>
              <dt>Route</dt>
              <dd>{net.onlineVia}</dd>
              <dt>Latency</dt>
              <dd>{net.latency || "—"} ms</dd>
              <dt>Bandwidth</dt>
              <dd>{net.bandwidth.toFixed(2)} Mbps</dd>
              <dt>Reliability</dt>
              <dd>{net.reliability}%</dd>
              <dt>Voice</dt>
              <dd>{voiceBearer(state).label}</dd>
            </dl>
            <Button
              onClick={() =>
                dispatch({
                  type: "TOAST",
                  message: net.isOnline
                    ? "Diagnostics passed"
                    : "No active data route",
                })
              }
            >
              Run diagnostic
            </Button>
            <Button
              onClick={() =>
                dispatch({
                  type: "MODAL",
                  modal: {
                    title: "Reset network settings?",
                    body: "This forgets Wi-Fi, Bluetooth pairing and resets radio toggles. SIM numbers stay permanent.",
                    actions: [
                      { label: "Cancel" },
                      {
                        label: "Reset",
                        onClick: () => {
                          set("wifi.connected", null);
                          set("wifi.saved", false);
                          set("bluetooth.paired", []);
                          set("radio.mobileData", true);
                        },
                      },
                    ],
                  },
                })
              }
            >
              Network reset
            </Button>
          </div>
        </div>
      )}
      {sub === "Wi-Fi" && <WiFiSettings />}
      {sub === "SIM Manager" && <SIMManagerPanel />}
      {sub === "Bluetooth" && <Bluetooth />}
      {sub === "Hotspot" && <Hotspot />}
    </>
  );
}
function Bluetooth() {
  const { state, set, dispatch } = useOS();
  const devices = ["Antoid Buds", "Desk Speaker", "Pulse Watch"];
  const scan = () => {
    set("bluetooth.scanning", true);
    setTimeout(() => set("bluetooth.scanning", false), 1200);
  };
  return (
    <div>
      <Toggle
        label="Bluetooth"
        description="Local pairing simulation"
        checked={state.radio.bluetooth}
        onChange={(v) => set("radio.bluetooth", v)}
      />
      <Button onClick={scan} disabled={!state.radio.bluetooth}>
        {state.bluetooth.scanning ? "Scanning…" : "Scan for devices"}
      </Button>
      <div className="list-cards">
        {devices.map((d) => (
          <button
            disabled={!state.radio.bluetooth}
            key={d}
            onClick={() => {
              const paired = state.bluetooth.paired.includes(d);
              set(
                "bluetooth.paired",
                paired
                  ? state.bluetooth.paired.filter((x) => x !== d)
                  : [...state.bluetooth.paired, d],
              );
              dispatch({
                type: "TOAST",
                message: `${d} ${paired ? "unpaired" : "paired"}`,
              });
            }}
          >
            <b>{d}</b>
            <span>
              {state.bluetooth.paired.includes(d)
                ? "Connected · tap to unpair"
                : "Available · tap to pair"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
function Hotspot() {
  const { state, set } = useOS();
  const eligible =
    state.radio.mobileData &&
    !state.radio.airplane &&
    state.sim[state.defaults.data].installed &&
    state.sim[state.defaults.data].bars > 0;
  return (
    <div>
      <Toggle
        label="Antoid Hotspot"
        description={
          eligible
            ? "Share the active mobile data route"
            : "Local Wi-Fi available · internet unavailable"
        }
        checked={state.radio.hotspot}
        onChange={(v) => set("radio.hotspot", v)}
      />
      <FormField
        label="Network name"
        value={state.hotspot.ssid}
        onChange={(e) => set("hotspot.ssid", e.target.value)}
      />
      <FormField
        label="Password"
        value={state.hotspot.password}
        onChange={(e) => set("hotspot.password", e.target.value)}
      />
      <label className="select-row">
        <span>Security</span>
        <select
          value={state.hotspot.security || "WPA2/WPA3"}
          onChange={(e) => set("hotspot.security", e.target.value)}
        >
          <option>WPA2/WPA3</option>
          <option>WPA2</option>
        </select>
      </label>
      {state.radio.hotspot && (
        <div className="setting-row">
          <span>
            <strong>Connected local devices</strong>
            <small>
              {state.lab.utv.wifi.connected === state.hotspot.ssid
                ? "Antoid UTV 1"
                : "No clients"}
            </small>
          </span>
          <b>{state.lab.utv.wifi.connected === state.hotspot.ssid ? 1 : 0}</b>
        </div>
      )}
      <p>Hotspot increases battery consumption while active.</p>
    </div>
  );
}

function Account() {
  const { state, set, dispatch } = useOS();
  return (
    <div className="settings-stack">
      <div className="account-card">
        <Avatar
          name={`${state.setup.firstName || "Antoid"} ${state.setup.lastName || "User"}`}
          color={state.theme.accent}
        />
        <div>
          <h3>
            {state.setup.firstName || "Antoid"} {state.setup.lastName || "User"}
          </h3>
          <p>{state.setup.username || "user"}@antoid.id</p>
        </div>
      </div>
      <FormField
        label="First name"
        value={state.setup.firstName}
        onChange={(e) => set("setup.firstName", e.target.value)}
      />
      <FormField
        label="Last name"
        value={state.setup.lastName}
        onChange={(e) => set("setup.lastName", e.target.value)}
      />
      <FormField
        label="Username"
        value={state.setup.username}
        onChange={(e) =>
          set(
            "setup.username",
            e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
          )
        }
      />
      <h3>Account customization</h3>
      <div className="accent-row">
        {palette.map((c) => (
          <button
            key={c}
            style={{ background: c }}
            className={state.theme.accent === c ? "active" : ""}
            onClick={() => set("theme.accent", c)}
            aria-label={`Use ${c} accent`}
          />
        ))}
      </div>
      <Button
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: "Antoid ID changes saved locally",
          })
        }
      >
        Save Antoid ID
      </Button>
    </div>
  );
}
function NotificationSettings() {
  const { state, set, dispatch } = useOS();
  const all = [
    ...CORE_APPS,
    ...STORE_APPS.filter((a) => state.installed.includes(a.id)),
  ];
  return (
    <div>
      <Toggle
        label="Notifications"
        checked={state.permissions.notifications}
        onChange={(v) => set("permissions.notifications", v)}
      />
      <Toggle
        label="Lock screen previews"
        checked={state.setup.notifications}
        onChange={(v) => set("setup.notifications", v)}
      />
      <h3>Per-app notifications</h3>
      {all.map((a) => (
        <Toggle
          key={a.id}
          label={a.name}
          checked={state.permissions[`notify-${a.id}`] !== false}
          onChange={(v) => set(`permissions.notify-${a.id}`, v)}
        />
      ))}
      <h3>Notification history</h3>
      <p>
        {state.notificationHistory.length} archived ·{" "}
        {state.notifications.length} active
      </p>
      <Button onClick={() => dispatch({ type: "CLEAR_NOTICES" })}>
        Archive active notifications
      </Button>
    </div>
  );
}
function SoundSettings() {
  const { state, set } = useOS();
  const caps = hardwareCapabilities(state);
  const mediaRoute =
    state.audioAccessories.mediaOutput === "Wired Headphones"
      ? caps.headphonesDetected
        ? "Wired Headphones"
        : "Unavailable"
      : state.audioAccessories.mediaOutput === "Phone Speaker"
        ? caps.speaker
          ? "Phone Speaker"
          : "Unavailable"
        : caps.headphonesDetected
          ? "Wired Headphones"
          : caps.speaker
            ? "Phone Speaker"
            : "Unavailable";
  return (
    <div>
      <Toggle
        label="Master sound"
        checked={state.sound.enabled}
        onChange={(v) => set("sound.enabled", v)}
      />
      <Slider
        label="Media"
        value={state.sound.media}
        onChange={(v) => set("sound.media", v)}
      />
      <label className="select-row">
        Media output · {mediaRoute}
        <select
          value={state.audioAccessories.mediaOutput}
          onChange={(event) =>
            set("audioAccessories.mediaOutput", event.target.value)
          }
        >
          <option>Automatic</option>
          <option>Phone Speaker</option>
          <option>Wired Headphones</option>
        </select>
      </label>
      {mediaRoute === "Unavailable" && (
        <p className="settings-warning">
          Selected media output hardware is unavailable.
        </p>
      )}
      <Slider
        label="Ringtone"
        value={state.sound.ringtone}
        onChange={(v) => set("sound.ringtone", v)}
      />
      <Slider
        label="Notifications"
        value={state.sound.notification}
        onChange={(v) => set("sound.notification", v)}
      />
      <Slider
        label="Alarm"
        value={state.sound.alarm}
        onChange={(v) => set("sound.alarm", v)}
      />
      <Toggle
        label="Silent mode"
        checked={state.radio.silent}
        onChange={(v) => set("radio.silent", v)}
      />
      <Toggle
        label="Do Not Disturb"
        checked={state.radio.dnd}
        onChange={(v) => set("radio.dnd", v)}
      />
      <Toggle
        label="Vibration-style feedback"
        checked={state.sound.vibration}
        onChange={(v) => set("sound.vibration", v)}
      />
      <label className="select-row">
        Ringtone
        <select
          value={state.sound.ringtoneName}
          onChange={(e) => {
            set("sound.ringtoneName", e.target.value);
            sound("call");
          }}
        >
          <option>Orbit</option>
          <option>Glass Meadow</option>
          <option>Soft Pulse</option>
        </select>
      </label>
      <label className="select-row">
        Notification tone
        <select
          value={state.sound.notificationName}
          onChange={(e) => {
            set("sound.notificationName", e.target.value);
            sound("notify");
          }}
        >
          <option>Dewdrop</option>
          <option>Teal Pop</option>
          <option>Quiet Chime</option>
        </select>
      </label>
    </div>
  );
}
function DisplaySettings() {
  const { state, set } = useOS();
  const caps = hardwareCapabilities(state);
  return (
    <div>
      <Slider
        label="Brightness"
        value={state.screen.brightness}
        onChange={(v) => set("screen.brightness", v)}
      />
      <label className="select-row">
        Theme
        <select
          value={state.theme.mode}
          onChange={(e) => set("theme.mode", e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Automatic</option>
        </select>
      </label>
      <h3>Wallpaper</h3>
      <Segmented
        value={state.theme.wallpaper}
        onChange={(v) => set("theme.wallpaper", v)}
        items={["aurora", "violet", "ocean", "sunset"]}
        label="Wallpaper"
      />
      <h3>Accent color</h3>
      <div className="accent-row">
        {palette.map((c) => (
          <button
            key={c}
            style={{ background: c }}
            className={state.theme.accent === c ? "active" : ""}
            onClick={() => set("theme.accent", c)}
          />
        ))}
      </div>
      <Toggle
        label="Auto-rotate"
        checked={state.radio.autoRotate}
        onChange={(v) => set("radio.autoRotate", v)}
      />
      <Toggle
        label={`HDR content · ${caps.displaySpecs.hdr ? "supported" : "display unsupported"}`}
        checked={!!state.screen.hdr && !!caps.displaySpecs.hdr}
        onChange={(v) => caps.displaySpecs.hdr && set("screen.hdr", v)}
      />
      <Toggle
        label={`Automatic brightness · ${caps.sensors.ambient ? "sensor ready" : "sensor unavailable"}`}
        checked={!!state.screen.autoBrightness && caps.sensors.ambient}
        onChange={(v) =>
          caps.sensors.ambient && set("screen.autoBrightness", v)
        }
      />
      <div className="display-hardware-card">
        <b>{caps.displaySpecs.serviceName || caps.displaySpecs.name}</b>
        <span>
          {caps.displaySpecs.technology} · {caps.displaySpecs.resolution} ·{" "}
          {caps.displaySpecs.refreshHz} Hz
        </span>
        <span>
          {caps.displaySpecs.peakNits} nits · PWM {caps.displaySpecs.pwmHz} Hz ·{" "}
          {caps.displaySpecs.touchLatency} ms touch
        </span>
      </div>
      <Toggle
        label="Reduced motion"
        checked={state.accessibility.reducedMotion}
        onChange={(v) => set("accessibility.reducedMotion", v)}
      />
      <Toggle
        label="Larger text"
        checked={state.accessibility.largeText}
        onChange={(v) => set("accessibility.largeText", v)}
      />
    </div>
  );
}
function HomeSettings() {
  const { state, set, dispatch } = useOS();
  return (
    <div>
      <Segmented
        value={state.screen.grid || "4×5"}
        onChange={(v) => set("screen.grid", v)}
        items={["4×5", "4×6", "5×6"]}
        label="Home grid"
      />
      <Toggle
        label="App drawer swipe"
        checked={state.screen.drawerSwipe !== false}
        onChange={(v) => set("screen.drawerSwipe", v)}
      />
      <Toggle
        label="Notification badges"
        checked={state.screen.badges !== false}
        onChange={(v) => set("screen.badges", v)}
      />
      <Toggle
        label="Widget suggestions"
        checked={state.screen.widgetSuggestions !== false}
        onChange={(v) => set("screen.widgetSuggestions", v)}
      />
      <Button
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: "Long-press icons on Home to rearrange them",
          })
        }
      >
        Arrange icons
      </Button>
      <Button
        onClick={() => {
          set("screen.folders", [
            ...(state.screen.folders || []),
            { id: Date.now(), name: "Favorites", apps: ["phone", "messages"] },
          ]);
          dispatch({
            type: "TOAST",
            message: "Favorites folder added to launcher data",
          });
        }}
      >
        Add Favorites folder
      </Button>
      <p>
        Widgets available: clock/weather, calendar, battery, music, favorite
        contacts, notes, connectivity and screen time.
      </p>
    </div>
  );
}
function Security({ privacy = false }) {
  const { state, set, dispatch } = useOS();
  return (
    <div>
      <FormField
        label="Device PIN"
        type="password"
        maxLength="4"
        value={state.setup.pin}
        onChange={(e) =>
          set("setup.pin", e.target.value.replace(/\D/g, "").slice(0, 4))
        }
      />
      <Toggle
        label="Location permission"
        checked={state.permissions.location}
        onChange={(v) => set("permissions.location", v)}
      />
      <Toggle
        label="Camera permission"
        checked={state.permissions.camera}
        onChange={(v) => set("permissions.camera", v)}
      />
      <Toggle
        label="Microphone permission"
        checked={state.permissions.microphone}
        onChange={(v) => set("permissions.microphone", v)}
      />
      <Toggle
        label="Clipboard history"
        checked={state.permissions.clipboard !== false}
        onChange={(v) => set("permissions.clipboard", v)}
      />
      <FormField
        label="Emergency information"
        value={state.system.emergency}
        onChange={(e) => set("system.emergency", e.target.value)}
      />
      <h3>App permissions</h3>
      {["Camera", "Microphone", "Location", "Notifications"].map((p) => (
        <Button
          key={p}
          onClick={() =>
            dispatch({ type: "TOAST", message: `${p} permissions reviewed` })
          }
        >
          {p} access
        </Button>
      ))}
      {privacy && (
        <>
          <h3>Clipboard</h3>
          <p>{state.clipboard.length} saved snippets</p>
          <Button onClick={() => set("clipboard", [])}>Clear clipboard</Button>
        </>
      )}
    </div>
  );
}
function BatterySettings() {
  const { state, set } = useOS();
  const heavy = ["youtube", "facebook", "instagram"].includes(state.screen.app);
  const model = batteryModel(state, {
    demanding: heavy,
    loadMultiplier: heavy
      ? 1.5
      : state.fm.playing || state.radio.flashlight
        ? 1.2
        : 1,
  });
  return (
    <div>
      <div className="battery-hero">
        <b>{Math.floor(state.battery.level)}%</b>
        <span>
          {state.battery.charging
            ? state.battery.chargeLimitedReason || "Charging · stops at 100%"
            : `${formatRuntime(model.estimatedRuntimeMinutes)} estimated`}
        </span>
      </div>
      <div className="battery-intel">
        <b>{state.battery.health}% health</b>
        <span>
          {model.effectiveCapacityMah.toFixed(0)} /{" "}
          {model.designCapacityMah.toFixed(0)} mAh effective ·{" "}
          {state.battery.cycles} cycles +{" "}
          {Math.round(state.battery.cycleProgress * 100)}% ·{" "}
          {(Number(state.battery.temperature) || 0).toFixed(1)} °C
        </span>
      </div>
      <div className={`battery-thermal thermal-${model.thermal.severity}`}>
        <b>{model.thermal.state}</b>
        <span>
          Performance {model.thermal.performanceLimit}% · temperature capacity{" "}
          {Math.round(model.temperatureFactor * 100)}%
        </span>
        {model.thermal.chargingPaused && (
          <small>Charging is paused until the battery cools.</small>
        )}
      </div>
      <Toggle
        label="Battery Saver"
        description={
          state.battery.saverAuto
            ? "Automatically enabled at 15%"
            : "Reduces background work, radio activity and visual effects."
        }
        checked={state.battery.saver}
        onChange={(v) => set("battery.saver", v)}
      />
      <Toggle
        label="Extreme Battery Saver"
        description={
          state.battery.extremeSaverAuto
            ? "Automatically enabled at 5%"
            : "Restricts Antoid to the essential apps selected below."
        }
        checked={state.battery.extremeSaver}
        onChange={(v) => set("battery.extremeSaver", v)}
      />
      <div className="extreme-apps">
        <h3>Apps allowed in Extreme Saver</h3>
        <p>Phone and Settings remain available for safety and recovery.</p>
        {CORE_APPS.map((app) => {
          const required = ["phone", "settings"].includes(app.id);
          const allowed = state.battery.extremeAllowedApps.includes(app.id);
          return (
            <label key={app.id}>
              <span>
                <i style={{ background: app.color }}>{app.icon}</i>
                {app.name}
              </span>
              <input
                type="checkbox"
                checked={allowed}
                disabled={required}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [
                        ...new Set([
                          ...state.battery.extremeAllowedApps,
                          app.id,
                        ]),
                      ]
                    : state.battery.extremeAllowedApps.filter(
                        (id) => id !== app.id,
                      );
                  set("battery.extremeAllowedApps", next);
                }}
              />
            </label>
          );
        })}
      </div>
      <Toggle
        label="Adaptive charging"
        description="Delays the final charge to reduce battery aging."
        checked={state.battery.adaptiveCharging}
        onChange={(v) => set("battery.adaptiveCharging", v)}
      />
      <Toggle
        label="Protect battery at 80%"
        checked={state.battery.protect80}
        onChange={(v) => set("battery.protect80", v)}
      />
      <Button onClick={() => set("battery.chargeTo100", true)}>
        Charge to 100% once
      </Button>
      <h3>Battery level history</h3>
      <svg
        className="battery-chart"
        viewBox="0 0 300 80"
        aria-label="Battery level history"
      >
        <path d="M0 70H300M0 40H300M0 10H300" />
        <polyline
          points={(state.battery.history.length
            ? state.battery.history
            : [{ level: state.battery.level }]
          )
            .slice(-40)
            .map(
              (item, index, all) =>
                `${(index / Math.max(1, all.length - 1)) * 300},${75 - item.level * 0.65}`,
            )
            .join(" ")}
        />
      </svg>
      <h3>Usage by app</h3>
      <div className="usage-bars">
        {Object.entries(state.battery.usage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([n, v]) => (
            <span key={n}>
              <b>{n}</b>
              <i style={{ width: `${v}%` }} />
              <small>{Math.round(v)} min</small>
            </span>
          ))}
      </div>
      <p>
        Accounting timestamp:{" "}
        {new Date(state.battery.last).toLocaleString("en-US")}
        <br />
        Charging cable: {state.battery.charging ? "Connected" : "Disconnected"}
        <br />
        Screen time:{" "}
        {Object.values(state.wellbeing.screenTime).reduce(
          (a, b) => a + b,
          0,
        )}{" "}
        minutes
      </p>
    </div>
  );
}
function Storage() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const used =
    state.system.storageUsed +
    state.installed.length * 0.08 +
    state.photos.length * 0.02;
  return (
    <div>
      {!caps.storage && (
        <div className="offline-strip">
          Internal storage hardware is unavailable. File and app writes cannot
          complete.
        </div>
      )}
      <div className="storage-meter">
        <b>{used.toFixed(1)} GB</b>
        <span>
          used of {caps.storageClaimedGb} GB claimed · {caps.storageActualGb} GB
          actual
        </span>
        <i>
          <em
            style={{
              width: `${Math.min(100, (used / Math.max(1, caps.storageActualGb)) * 100)}%`,
            }}
          />
        </i>
      </div>
      {state.hardware.components.storage.counterfeit && (
        <p className="electrical-fault">
          ⚠ Capacity verification failed: the module label claims{" "}
          {caps.storageClaimedGb} GB, but only {caps.storageActualGb} GB is
          addressable.
        </p>
      )}
      <dl>
        <dt>Module</dt>
        <dd>
          {state.hardware.components.storage.serviceName ||
            state.hardware.components.storage.name}
        </dd>
        <dt>Interface</dt>
        <dd>{state.hardware.components.storage.type}</dd>
        <dt>Read / write</dt>
        <dd>
          {caps.storageReadMbps} / {caps.storageWriteMbps} MB/s
        </dd>
      </dl>
      <dl>
        <dt>Applications</dt>
        <dd>{(3.2 + state.installed.length * 0.08).toFixed(2)} GB</dd>
        <dt>Photos</dt>
        <dd>{state.photos.length * 20} MB</dd>
        <dt>Downloads</dt>
        <dd>
          {Object.values(state.downloads).filter((d) => d.progress > 0).length *
            48}{" "}
          MB
        </dd>
        <dt>Trash</dt>
        <dd>{state.photos.filter((p) => p.trash).length} items</dd>
      </dl>
      <Button
        onClick={() => {
          set(
            "photos",
            state.photos.filter((p) => !p.trash),
          );
          set(
            "files",
            state.files.filter((f) => !f.trash),
          );
          dispatch({
            type: "TOAST",
            message: "Storage cleaned: trash permanently removed",
          });
        }}
      >
        Run Storage Cleaner
      </Button>
    </div>
  );
}
function AppsSettings() {
  const { state, set, dispatch } = useOS();
  const list = [
    ...CORE_APPS,
    ...STORE_APPS.filter((a) => state.installed.includes(a.id)),
  ];
  return (
    <div className="list-cards">
      {list.map((a) => (
        <button
          key={a.id}
          onClick={() =>
            state.installed.includes(a.id)
              ? dispatch({
                  type: "MODAL",
                  modal: {
                    title: a.name,
                    body: "Manage permissions, notifications, storage and local data.",
                    actions: [
                      {
                        label: "Clear local data",
                        onClick: () =>
                          dispatch({
                            type: "TOAST",
                            message: `${a.name} local data cleared`,
                          }),
                      },
                      {
                        label: "Uninstall",
                        onClick: () =>
                          set(
                            "installed",
                            state.installed.filter((x) => x !== a.id),
                          ),
                      },
                      { label: "Close" },
                    ],
                  },
                })
              : dispatch({
                  type: "TOAST",
                  message: `${a.name} is a protected Antoid system app`,
                })
          }
        >
          <span className="mini-app" style={{ background: a.color }}>
            {a.icon}
          </span>
          <b>{a.name}</b>
          <small>
            {state.installed.includes(a.id)
              ? "Downloaded · notifications & permissions"
              : "System app · permissions"}
          </small>
        </button>
      ))}
    </div>
  );
}
function Wellbeing() {
  const { state, set } = useOS();
  return (
    <div>
      <div className="screen-time-ring">
        <b>1h 42m</b>
        <span>Today’s screen time</span>
      </div>
      <Toggle
        label="Focus mode"
        description="Pauses social badges and notification sounds."
        checked={state.wellbeing.focus}
        onChange={(v) => set("wellbeing.focus", v)}
      />
      <FormField
        label="Daily social-app timer (minutes)"
        type="number"
        min="5"
        value={state.wellbeing.socialTimer || 60}
        onChange={(e) => set("wellbeing.socialTimer", +e.target.value)}
      />
      <Toggle
        label="DND schedule 22:00–07:00"
        checked={state.wellbeing.dndSchedule || false}
        onChange={(v) => set("wellbeing.dndSchedule", v)}
      />
    </div>
  );
}
function Accessibility() {
  const { state, set } = useOS();
  return (
    <div>
      <Toggle
        label="Larger text"
        checked={state.accessibility.largeText}
        onChange={(v) => set("accessibility.largeText", v)}
      />
      <Toggle
        label="High contrast"
        checked={state.accessibility.highContrast}
        onChange={(v) => set("accessibility.highContrast", v)}
      />
      <Toggle
        label="Reduced motion"
        description="Also respects your browser preference."
        checked={state.accessibility.reducedMotion}
        onChange={(v) => set("accessibility.reducedMotion", v)}
      />
      <label className="select-row">
        Color adjustment
        <select
          value={state.accessibility.color}
          onChange={(e) => set("accessibility.color", e.target.value)}
        >
          <option value="normal">Standard</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="mono">Monochrome</option>
        </select>
      </label>
      <Toggle
        label="Keyboard navigation"
        checked={state.accessibility.keyboard}
        onChange={(v) => set("accessibility.keyboard", v)}
      />
      <p>
        All SIM and eSIM drag actions have click alternatives, dialogs announce
        themselves, and controls use large touch targets.
      </p>
    </div>
  );
}
function General() {
  const { state, set, dispatch, net } = useOS();
  const caps = hardwareCapabilities(state);
  const file = useRef();
  const backup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "antoid-1-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    set("system.lastBackup", Date.now());
  };
  const restore = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        dispatch({ type: "RESTORE", state: JSON.parse(r.result) });
        dispatch({ type: "TOAST", message: "Antoid 1 backup restored" });
      } catch {
        dispatch({ type: "TOAST", message: "This backup file is invalid" });
      }
    };
    r.readAsText(f);
  };
  const update = () => {
    if (!net.isOnline) {
      dispatch({
        type: "TOAST",
        message: "Connect to the internet to check for updates",
      });
      return;
    }
    set(
      "system.updateStatus",
      `${ANTOID_SYSTEM.osName} ${ANTOID_SYSTEM.version} is up to date`,
    );
    set("system.updateProgress", 0);
  };
  return (
    <div>
      <h3>Service</h3>
      <p>
        Maintenance Mode exposes hardware diagnostics while hiding personal data
        and downloaded apps.
      </p>
      <Button
        onClick={() =>
          dispatch({
            type: "MODAL",
            modal: {
              title: "Restart in Maintenance Mode?",
              body: "Personal calls, messages, photos, accounts and apps will remain stored but hidden from the service workspace.",
              actions: [
                { label: "Cancel" },
                {
                  label: "Restart",
                  onClick: () =>
                    dispatch({ type: "MAINTENANCE_MODE", enabled: true }),
                },
              ],
            },
          })
        }
      >
        Enter Maintenance Mode
      </Button>
      <label className="select-row">
        Language
        <select
          value={state.setup.language}
          onChange={(e) => set("setup.language", e.target.value)}
        >
          <option>English</option>
        </select>
      </label>
      <Button
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: `Automatic date & time: ${new Date().toLocaleString("en-US")}`,
          })
        }
      >
        Date & Time · Automatic
      </Button>
      <h3>Backup & restore</h3>
      <Button onClick={backup}>Export JSON backup</Button>
      <Button onClick={() => file.current.click()}>Restore JSON backup</Button>
      <input
        ref={file}
        hidden
        type="file"
        accept="application/json"
        onChange={restore}
      />
      <small>
        {state.system.lastBackup
          ? `Last backup ${new Date(state.system.lastBackup).toLocaleString("en-US")}`
          : "No backup created"}
      </small>
      <h3>System Update</h3>
      <div className="update-card">
        <div className="antoid-mark small">
          <i />
          <i />
          <i />
        </div>
        <b>
          {ANTOID_SYSTEM.deviceModel} · {ANTOID_SYSTEM.versionLabel}
        </b>
        <span>{state.system.updateStatus}</span>
        {state.system.updateProgress > 0 && (
          <progress value={state.system.updateProgress} max="100" />
        )}
        <Button onClick={update}>Check for update</Button>
      </div>
      <h3>About Phone</h3>
      <dl className="about">
        <dt>OS</dt>
        <dd>
          {ANTOID_SYSTEM.osName} {ANTOID_SYSTEM.versionLabel}
        </dd>
        <dt>Device</dt>
        <dd>{state.setup.deviceName}</dd>
        <dt>Antoid ID</dt>
        <dd>{state.setup.username || "user"}@antoid.id</dd>
        <dt>Physical SIM</dt>
        <dd>
          {state.sim.physical.installed
            ? `${CARRIERS[state.sim.physical.carrier].name} · ${state.numbers.profiles[`physical-${state.sim.physical.carrier}`]}`
            : "No SIM"}
        </dd>
        <dt>eSIM</dt>
        <dd>
          {state.sim.esim.installed
            ? `${CARRIERS[state.sim.esim.carrier].name} · ${state.numbers.profiles[`esim-${state.sim.esim.carrier}`]}`
            : "Not installed"}
        </dd>
        <dt>Voice</dt>
        <dd>{voiceBearer(state).label}</dd>
        <dt>Network</dt>
        <dd>
          {net.onlineVia} · {net.quality}
        </dd>
        <dt>Battery</dt>
        <dd>{Math.floor(state.battery.level)}%</dd>
        <dt>Storage</dt>
        <dd>
          {state.system.storageUsed} GB of {caps.storageActualGb} GB actual
        </dd>
        <dt>Display hardware</dt>
        <dd>
          {caps.displaySpecs.technology} · {caps.displaySpecs.refreshHz} Hz
        </dd>
        <dt>USB hardware</dt>
        <dd>
          {caps.usb
            ? `${caps.usbSpecs.standard} · ${caps.usbSpecs.speedGbps} Gbps`
            : "Unavailable"}
        </dd>
        <dt>Build</dt>
        <dd>
          <button
            className="build-number"
            onClick={() => dispatch({ type: "BUILD_NUMBER_TAP" })}
          >
            {ANTOID_SYSTEM.build}
          </button>
        </dd>
      </dl>
      <Button
        onClick={() =>
          dispatch({ type: "POWER", value: { mode: "booting", locked: true } })
        }
      >
        Restart Antoid 1
      </Button>
      <Button
        onClick={() =>
          dispatch({ type: "POWER", value: { mode: "off", locked: true } })
        }
      >
        Power Off
      </Button>
      <Button
        onClick={() =>
          dispatch({
            type: "MODAL",
            modal: {
              icon: "!",
              title: "Erase All Antoid Data?",
              body: "This permanently resets profiles, numbers, apps, messages, photos and settings, then returns to setup.",
              actions: [
                { label: "Cancel" },
                {
                  label: "Erase",
                  onClick: () => dispatch({ type: "FACTORY_RESET" }),
                },
              ],
            },
          })
        }
      >
        Erase All Antoid Data
      </Button>
    </div>
  );
}

function DeveloperOptions() {
  const { state, set, dispatch } = useOS();
  const dev = state.developer;
  const visible = dev.timeline.filter((event) => {
    const slot =
      event.category ||
      event.slot ||
      event.source ||
      (String(event.type).toLowerCase().includes("wifi") ? "wifi" : null);
    return !slot || dev.timelineFilters[slot] !== false;
  });
  const exportTimeline = () => {
    const blob = new Blob([JSON.stringify(visible, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "antoid-system-event-timeline.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <h3>System Event Timeline</h3>
      <p>
        Events are recorded from real state transitions in hardware, power,
        damage, repair, temperature, water, USB, cellular, IMS and Wi-Fi.
      </p>
      <Toggle
        label="Pause timeline"
        checked={dev.timelinePaused}
        onChange={(v) => set("developer.timelinePaused", v)}
      />
      <div className="timeline-filters">
        {[
          ["physical", "SIM 1"],
          ["esim", "SIM 2"],
          ["wifi", "Wi-Fi"],
          ["hardware", "Hardware"],
          ["power", "Power"],
          ["damage", "Damage"],
          ["repair", "Repair"],
          ["temperature", "Temperature"],
          ["water", "Water"],
          ["usb", "USB"],
          ["system", "System"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={dev.timelineFilters[key]}
              onChange={(e) =>
                set(`developer.timelineFilters.${key}`, e.target.checked)
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div className="lab-actions">
        <Button onClick={() => set("developer.timeline", [])}>
          Clear timeline
        </Button>
        <Button onClick={exportTimeline}>Export JSON</Button>
      </div>
      <div className="network-timeline">
        {visible.length ? (
          visible.map((event) => (
            <section key={event.id}>
              <time>{new Date(event.time).toLocaleTimeString("en-US")}</time>
              <b>{event.type}</b>
              <span>{event.message}</span>
            </section>
          ))
        ) : (
          <p>
            No matching events yet. Move the phone, change a radio, or connect
            Wi-Fi.
          </p>
        )}
      </div>
      <Button
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: "Developer Options remain enabled on this device",
          })
        }
      >
        Verify developer mode
      </Button>
    </div>
  );
}

const panels = {
  Account,
  Connectivity,
  Notifications: NotificationSettings,
  Sound: SoundSettings,
  Display: DisplaySettings,
  "Home Screen": HomeSettings,
  "Lock Screen": Security,
  Security,
  Privacy: () => <Security privacy />,
  Battery: BatterySettings,
  Storage,
  Apps: AppsSettings,
  "Digital Wellbeing": Wellbeing,
  Accessibility,
  General,
  "Developer Options": DeveloperOptions,
};
export function SettingsApp() {
  const { state } = useOS();
  const [section, setSection] = useState(null),
    [q, setQ] = useState("");
  useSystemBack(() => {
    setSection(null);
    return true;
  }, !!section);
  const availableCategories = state.developer.unlocked
    ? [
        ...categories,
        ["Developer Options", "Live network timeline and diagnostics", "⌘"],
      ]
    : categories;
  const shown = availableCategories.filter((c) =>
    (c[0] + c[1]).toLowerCase().includes(q.toLowerCase()),
  );
  if (section) {
    const C = panels[section];
    return (
      <div className="settings-page app-scroll">
        <header className="app-header">
          <button className="round-btn" onClick={() => setSection(null)}>
            ‹
          </button>
          <div>
            <h2>{section}</h2>
            <small>Antoid 1 Settings</small>
          </div>
          <span />
        </header>
        <C />
      </div>
    );
  }
  return (
    <div className="settings-home app-scroll">
      <Header
        title="Settings"
        subtitle={`Antoid 1 · ${state.setup.deviceName}`}
      />
      <div className="settings-account" onClick={() => setSection("Account")}>
        <Avatar
          name={`${state.setup.firstName || "Antoid"} ${state.setup.lastName || "User"}`}
          color={state.theme.accent}
        />
        <div>
          <b>
            {state.setup.firstName || "Antoid"} {state.setup.lastName || "User"}
          </b>
          <span>{state.setup.username || "user"}@antoid.id</span>
        </div>
        <i>›</i>
      </div>
      <input
        className="search-input"
        placeholder="Search Settings"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="settings-categories">
        {shown.map(([name, desc, icon]) => (
          <button key={name} onClick={() => setSection(name)}>
            <span>{icon}</span>
            <div>
              <b>{name}</b>
              <small>{desc}</small>
            </div>
            <i>›</i>
          </button>
        ))}
      </div>
    </div>
  );
}
