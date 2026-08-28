import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CORE_APPS, CARRIERS, STORE_APPS, useOS } from "../state/OSContext.jsx";
import {
  NETWORK_MODES,
  RADIO_CHOICES,
  connectivity,
  emergencyNetwork,
  lineQuality,
  voiceBearer,
} from "../services/core.js";
import { sound } from "../services/audio.js";
import { hardwareCapabilities } from "../services/hardware.js";
import {
  Avatar,
  Button,
  FormField,
  Header,
  Icon,
  Segmented,
  SignalBars,
  Slider,
  Toggle,
} from "./UI.jsx";

const wallpapers = {
  aurora: "Aurora Glass",
  violet: "Violet Dusk",
  ocean: "Quiet Ocean",
  sunset: "Budapest Sunset",
};
export function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="antoid-mark">
        <i />
        <i />
        <i />
      </div>
      <h1>Antoid 1</h1>
      <p>Made for your world</p>
    </div>
  );
}

export function SetupAssistant() {
  const { state, set, dispatch } = useOS();
  const [wifiPassword, setWifiPassword] = useState("");
  const s = state.setup,
    step = s.step;
  const next = () => set("setup.step", Math.min(11, step + 1)),
    back = () => set("setup.step", Math.max(0, step - 1));
  const title = [
    "Welcome to Antoid 1",
    "Choose language",
    "Make it yours",
    "Choose a wallpaper",
    "Create your Antoid ID",
    "Connect your lines",
    "Connect to Wi-Fi",
    "Name your phone",
    "Secure Antoid 1",
    "Notifications",
    "Review your choices",
    "Ready to explore",
  ][step];
  const finish = () => {
    set("setup.done", true);
    set("theme.mode", s.appearance);
    set("theme.wallpaper", s.wallpaper);
    dispatch({ type: "POWER", value: { locked: false, mode: "on" } });
    dispatch({
      type: "NOTIFY",
      title: "Setup complete",
      body: "Antoid 1 is ready for you.",
    });
    sound("success");
  };
  return (
    <div className="setup app-scroll">
      <div className="setup-progress">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <div className="setup-brand">
        <span>A</span> Antoid 1
      </div>
      <h1>{title}</h1>
      {step === 0 && (
        <>
          <div className="hero-orbit">
            <div className="antoid-mark">
              <i />
              <i />
              <i />
            </div>
          </div>
          <p>
            A private, playful phone OS built entirely inside your browser.
            Hardware, connectivity, apps and memories move together.
          </p>
        </>
      )}
      {step === 1 && (
        <div className="choice-list">
          {["English"].map((x) => (
            <button
              className={s.language === x ? "selected" : ""}
              onClick={() => set("setup.language", x)}
              key={x}
            >
              {x}
              <span>✓</span>
            </button>
          ))}
        </div>
      )}
      {step === 2 && (
        <>
          <Segmented
            value={s.appearance}
            onChange={(v) => {
              set("setup.appearance", v);
              set("theme.mode", v);
            }}
            items={[
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
              { label: "Automatic", value: "auto" },
            ]}
            label="Appearance"
          />
          <div className="theme-preview">
            <span />
            <span />
            <span />
          </div>
        </>
      )}
      {step === 3 && (
        <div className="wallpaper-grid">
          {Object.entries(wallpapers).map(([id, name]) => (
            <button
              key={id}
              className={`wallpaper ${id} ${s.wallpaper === id ? "selected" : ""}`}
              onClick={() => set("setup.wallpaper", id)}
            >
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="form-stack">
          <FormField
            label="First name"
            value={s.firstName}
            onChange={(e) => set("setup.firstName", e.target.value)}
          />
          <FormField
            label="Last name"
            value={s.lastName}
            onChange={(e) => set("setup.lastName", e.target.value)}
          />
          <FormField
            label="Username"
            value={s.username}
            onChange={(e) =>
              set(
                "setup.username",
                e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
              )
            }
          />
          <p className="account-preview">
            {s.username || "username"}@antoid.id
          </p>
        </div>
      )}
      {step === 5 && (
        <div className="setup-card">
          <h3>SIM 1 + eSIM</h3>
          <p>
            Use the real tray and carrier cards beside the phone. Program the
            blank QR by dropping a carrier SIM onto it, then install it later in
            SIM Manager.
          </p>
          <p className="live-value">
            Physical:{" "}
            {state.sim.physical.installed
              ? CARRIERS[state.sim.physical.carrier].name
              : "No SIM"}
            <br />
            eSIM:{" "}
            {state.sim.esim.installed
              ? CARRIERS[state.sim.esim.carrier].name
              : "Not installed"}
          </p>
        </div>
      )}
      {step === 6 && (
        <div className="setup-card">
          <h3>{state.wifi.connected || "No Wi-Fi connected"}</h3>
          <p>
            {state.lab.router.ssid} · {state.lab.router.security} · shared
            ANRouter. Enter its password, or use Continue to skip Wi-Fi.
          </p>
          {!state.wifi.connected && (
            <FormField
              label={`${state.lab.router.ssid} password`}
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          )}
          {state.wifi.stage && <p className="live-value">{state.wifi.stage}</p>}
          <Button
            onClick={() => {
              if (state.wifi.connected)
                return dispatch({ type: "WIFI_DISCONNECT" });
              if (wifiPassword !== state.lab.router.password) {
                set("wifi.stage", "Incorrect password");
                sound("error");
                return;
              }
              set("wifi.stage", "Authenticating…");
              setTimeout(() => set("wifi.stage", "Obtaining IP address…"), 450);
              setTimeout(() => {
                dispatch({
                  type: "WIFI_CONNECTED",
                  ssid: state.lab.router.ssid,
                  password: wifiPassword,
                });
                sound("success");
              }, 950);
            }}
          >
            {state.wifi.connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      )}
      {step === 7 && (
        <FormField
          label="Device name"
          value={s.deviceName}
          onChange={(e) => set("setup.deviceName", e.target.value)}
        />
      )}
      {step === 8 && (
        <>
          <FormField
            label="4-digit PIN (optional)"
            inputMode="numeric"
            maxLength="4"
            value={s.pin}
            onChange={(e) =>
              set("setup.pin", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
          <p>Leave empty for swipe-only unlock.</p>
        </>
      )}
      {step === 9 && (
        <Toggle
          label="Allow notification previews"
          description="Show useful local updates on the lock screen."
          checked={s.notifications}
          onChange={(v) => set("setup.notifications", v)}
        />
      )}
      {step === 10 && (
        <div className="review">
          <button onClick={() => set("setup.step", 1)}>
            Language <b>{s.language}</b>
          </button>
          <button onClick={() => set("setup.step", 2)}>
            Appearance <b>{s.appearance}</b>
          </button>
          <button onClick={() => set("setup.step", 3)}>
            Wallpaper <b>{wallpapers[s.wallpaper]}</b>
          </button>
          <button onClick={() => set("setup.step", 4)}>
            Antoid ID{" "}
            <b>{s.username ? `${s.username}@antoid.id` : "Not set"}</b>
          </button>
          <button onClick={() => set("setup.step", 7)}>
            Device <b>{s.deviceName}</b>
          </button>
          <button onClick={() => set("setup.step", 8)}>
            PIN <b>{s.pin ? "Configured" : "Skipped"}</b>
          </button>
        </div>
      )}
      {step === 11 && (
        <>
          <div className="hero-orbit success">
            <div className="antoid-mark">
              <i />
              <i />
              <i />
            </div>
          </div>
          <p>
            Your choices are saved locally. Welcome to a phone you can take
            apart, reconnect and make your own.
          </p>
        </>
      )}
      <footer className="setup-actions">
        {step > 0 && <Button onClick={back}>Back</Button>}
        <Button
          tone="primary"
          disabled={step === 4 && !s.username}
          onClick={step === 11 ? finish : next}
        >
          {step === 11 ? "Enter Antoid 1" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}

export function LockScreen() {
  const { state, set, dispatch } = useOS();
  const [pin, setPin] = useState(""),
    [failed, setFailed] = useState(0),
    [lockout, setLockout] = useState(0),
    [emergencyDigits, setEmergencyDigits] = useState(""),
    [emergencyCall, setEmergencyCall] = useState(null);
  const start = useRef(null);
  useEffect(() => {
    if (lockout) {
      const id = setInterval(() => setLockout((x) => Math.max(0, x - 1)), 1000);
      return () => clearInterval(id);
    }
  }, [lockout]);
  const unlock = () => {
    if (!state.setup.pin) {
      dispatch({ type: "POWER", value: { locked: false } });
      sound("success");
    } else set("screen.overlay", "pin");
  };
  const press = (n) => {
    if (lockout) return;
    const value = (pin + n).slice(0, 4);
    setPin(value);
    if (value.length === 4) {
      if (value === state.setup.pin) {
        dispatch({ type: "POWER", value: { locked: false } });
        set("screen.overlay", null);
        setPin("");
        sound("success");
      } else {
        sound("error");
        setPin("");
        setFailed((f) => {
          if (f + 1 >= 3) setLockout(30);
          return f + 1;
        });
      }
    }
  };
  const carriers =
    ["physical", "esim"]
      .filter((k) => state.sim[k].installed)
      .map((k) => CARRIERS[state.sim[k].carrier].name)
      .join(" · ") || "No SIM";
  return (
    <div
      className={`lock-screen wallpaper-${state.theme.wallpaper}`}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerUp={(e) => {
        if (start.current - e.clientY > 50) unlock();
      }}
    >
      <div className="lock-top">
        <span>Antoid 1</span>
        <span>
          {Math.floor(state.battery.level)}%{" "}
          {state.battery.charging ? "⚡" : ""}
        </span>
      </div>
      <time>
        {new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
      <p>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>
      <small>
        {carriers}
        {state.wifi.connected ? " · Wi-Fi" : ""}
      </small>
      <div className="lock-notices">
        {state.setup.notifications &&
          state.notifications.slice(0, 2).map((n) => (
            <button
              key={n.id}
              onClick={() => dispatch({ type: "DISMISS_NOTICE", id: n.id })}
            >
              <b>{n.title}</b>
              <span>{n.body}</span>
            </button>
          ))}
      </div>
      {state.social.spotify.playing && (
        <div className="lock-media">
          <b>Antoid Nights</b>
          <span>Antoid Sound Lab</span>
          <Button onClick={() => set("social.spotify.playing", false)}>
            Pause
          </Button>
        </div>
      )}
      <div className="lock-shortcuts">
        <button
          onClick={() => set("radio.flashlight", !state.radio.flashlight)}
        >
          ⌁<span>Flashlight</span>
        </button>
        <button onClick={() => dispatch({ type: "OPEN_SECURE_CAMERA" })}>
          ◉<span>Camera</span>
        </button>
        <button onClick={() => set("screen.overlay", "emergency")}>
          112<span>Emergency</span>
        </button>
      </div>
      <button className="unlock-handle" onClick={unlock}>
        ⌃ <span>Swipe up to unlock</span>
      </button>
      {state.screen.overlay === "pin" && (
        <div className={`pin-panel ${failed ? "shake-once" : ""}`}>
          <button
            className="pin-close"
            onClick={() => set("screen.overlay", null)}
          >
            ×
          </button>
          <h2>{lockout ? `Try again in ${lockout}s` : "Enter PIN"}</h2>
          <div className="pin-dots">
            {[0, 1, 2, 3].map((i) => (
              <i className={i < pin.length ? "filled" : ""} key={i} />
            ))}
          </div>
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "Emergency", 0, "⌫"].map((n) => (
              <button
                key={n}
                disabled={!!lockout}
                onClick={() =>
                  n === "⌫"
                    ? setPin(pin.slice(0, -1))
                    : n === "Emergency"
                      ? set("screen.overlay", "emergency")
                      : press(String(n))
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      {state.screen.overlay === "emergency" && (
        <div className="pin-panel emergency-panel">
          <button
            className="pin-close"
            onClick={() => {
              set("screen.overlay", "pin");
              setEmergencyCall(null);
            }}
          >
            ×
          </button>
          <h2>{emergencyCall ? "Emergency call" : "Emergency dialer"}</h2>
          {emergencyCall ? (
            <>
              <strong>112</strong>
              <p>{emergencyCall}</p>
              <button className="hangup" onClick={() => setEmergencyCall(null)}>
                ⌕
              </button>
            </>
          ) : (
            <>
              <input
                className="emergency-number"
                value={emergencyDigits}
                readOnly
                placeholder="112"
              />
              <div className="keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "Info", 0, "⌫"].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      n === "⌫"
                        ? setEmergencyDigits(emergencyDigits.slice(0, -1))
                        : n === "Info"
                          ? dispatch({
                              type: "TOAST",
                              message: state.system.emergency,
                            })
                          : setEmergencyDigits(
                              (emergencyDigits + String(n)).slice(0, 3),
                            )
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Button
                tone="primary"
                onClick={() => {
                  if (emergencyDigits !== "112")
                    return dispatch({
                      type: "TOAST",
                      message: "Only 112 is available while locked",
                    });
                  const route = emergencyNetwork(state);
                  if (!route.reachable)
                    return dispatch({ type: "TOAST", message: route.reason });
                  sound("call");
                  setEmergencyCall(
                    `Connected on Tower ${route.tower.id} · available without a SIM`,
                  );
                }}
              >
                Call 112
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatusLine({ state, slot, dual }) {
  const line = state.sim[slot];
  const quality = lineQuality(state, slot);
  const available = quality.registered;
  const bars = available ? quality.bars : 0;
  const bearer = voiceBearer(state, slot);
  const displayedNetwork =
    bearer.shortLabel === "VoWiFi"
      ? "Wi-Fi"
      : bearer.network || quality.networkType;
  const carrier = CARRIERS[line.carrier]?.name || line.label;
  return (
    <span
      className={`status-line ${dual ? "dual" : "single"} ${available ? "" : "unavailable"}`}
      title={`${line.label}: ${carrier}, ${displayedNetwork}, ${bars} of 4 bars${bearer.ok ? `, ${bearer.label}` : ", no service"}`}
    >
      <sup>{slot === "physical" ? "1" : "2"}</sup>
      <SignalBars bars={bars} />
      <b className="status-network">{displayedNetwork}</b>
      {bearer.ok && <em className="status-voice">{bearer.shortLabel}</em>}
    </span>
  );
}

export function StatusBar() {
  const { state, set, net } = useOS();
  const lines = ["physical", "esim"].filter(
    (slot) => state.sim[slot].installed && state.sim[slot].enabled,
  );
  const dual = lines.length > 1;
  const alarmsOn = state.alarms.some((alarm) => alarm.enabled);
  const toggleOverlay = (name) =>
    set("screen.overlay", state.screen.overlay === name ? null : name);
  return (
    <div className="status-bar">
      <button
        className="status-trigger"
        onClick={() => toggleOverlay("notifications")}
        aria-label="Open notifications"
      >
        {new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </button>
      <span className="status-center" aria-hidden="true" />
      <button
        className="status-system-trigger"
        onClick={() => toggleOverlay("quick")}
        aria-label="Toggle Quick Settings"
        aria-expanded={state.screen.overlay === "quick"}
      >
        <span className={`status-connections ${dual ? "dual" : "single"}`}>
          {state.radio.airplane && <span className="airplane-mini">✈</span>}
          {lines.length ? (
            lines.map((slot) => (
              <StatusLine key={slot} state={state} slot={slot} dual={dual} />
            ))
          ) : (
            <span className="no-sim-mini">No SIM</span>
          )}
        </span>
        <span className="status-accessories" aria-hidden="true">
          {state.radio.dnd && <span>☾</span>}
          {state.radio.silent && <span>♩̸</span>}
          {alarmsOn && <span>◷</span>}
          {state.audioAccessories.wiredHeadphonesConnected && <span>♬</span>}
          {state.battery.extremeSaver ? (
            <span>‼</span>
          ) : (
            state.battery.saver && <span>♧</span>
          )}
          {["Hot", "Very Hot", "Critical"].includes(
            state.battery.thermalState,
          ) && <span>♨</span>}
          {state.notifications.length > 0 && <span className="notice-dot" />}
        </span>
        {net.wifiConnected && (
          <span
            className="wifi-status-icon"
            aria-label={`Wi-Fi connected to ${state.wifi.connected}`}
          >
            ⌁
          </span>
        )}
        <b>
          {Math.floor(state.battery.level)}
          {state.battery.charging ? "⚡" : "%"}
        </b>
      </button>
    </div>
  );
}

export function HomeScreen() {
  const { state, dispatch, set } = useOS();
  const apps = [
    ...CORE_APPS,
    ...STORE_APPS.filter((a) => state.installed.includes(a.id)),
  ];
  const [query, setQuery] = useState("");
  const drawer = state.screen.overlay === "drawer";
  const shown = apps.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );
  const open = (id) => {
    sound("tap");
    dispatch({ type: "OPEN_APP", id });
  };
  return (
    <main className={`home wallpaper-${state.theme.wallpaper}`}>
      <div className="home-widgets">
        <button className="hero-widget" onClick={() => open("weather")}>
          <time>
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <span>
            Budapest · {state.weather.temp}° · {state.weather.condition}
          </span>
        </button>
        <div className="small-widgets">
          <button onClick={() => open("calendar")}>
            <b>{new Date().getDate()}</b>
            <span>{state.events[0]?.title || "Free day"}</span>
          </button>
          <button onClick={() => open("settings")}>
            <b>{Math.floor(state.battery.level)}%</b>
            <span>
              {state.battery.charging ? "Charging" : "All-day battery"}
            </span>
          </button>
        </div>
      </div>
      <div className="app-grid">
        {apps
          .slice(state.screen.page * 12, state.screen.page * 12 + 12)
          .map((a) => (
            <Icon
              key={a.id}
              app={a}
              onClick={() => open(a.id)}
              badge={
                a.id === "messages"
                  ? Object.values(state.messages)
                      .flat()
                      .filter((m) => !m.read).length
                  : 0
              }
            />
          ))}
      </div>
      <div className="page-dots">
        {[0, 1].map((p) => (
          <button
            aria-label={`Home page ${p + 1}`}
            key={p}
            onClick={() => set("screen.page", p)}
            className={state.screen.page === p ? "active" : ""}
          />
        ))}
      </div>
      <div className="dock">
        {["phone", "messages", "browser", "camera"].map((id) => {
          const a = CORE_APPS.find((x) => x.id === id);
          return <Icon key={id} app={a} onClick={() => open(id)} />;
        })}
      </div>
      <button
        className="drawer-handle"
        onClick={() => set("screen.overlay", "drawer")}
        aria-label="Open app drawer"
      >
        ⌃
      </button>
      {drawer && (
        <div className="app-drawer">
          <header>
            <h2>All apps</h2>
            <button
              aria-label="Close app drawer"
              onClick={() => set("screen.overlay", null)}
            >
              ×
            </button>
          </header>
          <input
            autoFocus
            placeholder="Search apps and settings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="app-grid">
            {shown.map((a) => (
              <Icon key={a.id} app={a} onClick={() => open(a.id)} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export function NavigationBar() {
  const { dispatch, goBack } = useOS();
  return (
    <nav className="nav-bar">
      <button onClick={goBack} aria-label="Back">
        ‹
      </button>
      <button onClick={() => dispatch({ type: "HOME" })} aria-label="Home">
        ●
      </button>
      <button
        onClick={() => dispatch({ type: "RECENTS" })}
        aria-label="Recents"
      >
        ▢
      </button>
    </nav>
  );
}

function SystemOverlay({ name, label, children }) {
  const { set } = useOS();
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = setTimeout(
      () =>
        set("screen.overlay", (current) => (current === name ? null : current)),
      170,
    );
  }, [name, set]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    panelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(closeTimer.current);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [close]);

  return (
    <div
      className={`system-overlay ${closing ? "closing" : ""}`}
      onPointerDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        ref={panelRef}
        className="system-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex="-1"
      >
        <button
          className="shade-grab"
          onClick={close}
          aria-label={`Close ${label}`}
        />
        {children}
      </section>
    </div>
  );
}

export function NotificationsPanel() {
  const { state, set, dispatch, net } = useOS();
  return (
    <SystemOverlay name="notifications" label="Notification Center">
      <div className="shade app-scroll">
        <header>
          <div>
            <time>
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <button onClick={() => set("screen.overlay", "quick")}>
            Quick Settings
          </button>
        </header>
        <QuickTiles compact />
        <div className="connection-card">
          <b>{net.onlineVia}</b>
          <span>
            {net.isOnline
              ? `${net.quality} · ${net.latency} ms`
              : "Apps with saved local data remain available"}
          </span>
        </div>
        <div className="notice-head">
          <h3>Notifications</h3>
          <button onClick={() => dispatch({ type: "CLEAR_NOTICES" })}>
            Clear all
          </button>
        </div>
        {state.notifications.length ? (
          state.notifications.map((n) => (
            <article className="notification" key={n.id}>
              <span>{n.app?.[0] || "A"}</span>
              <button
                onClick={() => {
                  const id = n.app
                    ?.toLowerCase()
                    .replace("antoid store", "store");
                  if (
                    CORE_APPS.some((a) => a.id === id) ||
                    state.installed.includes(id)
                  )
                    dispatch({ type: "OPEN_APP", id });
                }}
              >
                <b>{n.title}</b>
                <small>{n.body}</small>
              </button>
              <button
                onClick={() => dispatch({ type: "DISMISS_NOTICE", id: n.id })}
              >
                ×
              </button>
            </article>
          ))
        ) : (
          <p className="nothing">You’re all caught up.</p>
        )}
      </div>
    </SystemOverlay>
  );
}

function QuickTile({ name, on, activate, sub, onLongPress }) {
  const timer = useRef();
  const held = useRef(false);
  const begin = () => {
    held.current = false;
    if (onLongPress)
      timer.current = window.setTimeout(() => {
        held.current = true;
        onLongPress();
      }, 650);
  };
  const end = () => window.clearTimeout(timer.current);
  return (
    <button
      className={on ? "on" : ""}
      onPointerDown={begin}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      onClick={() => {
        if (!held.current) activate();
        held.current = false;
      }}
      title={onLongPress ? "Hold for advanced controls" : undefined}
    >
      <b>{name}</b>
      <span>{sub}</span>
    </button>
  );
}

function QuickTiles({ compact = false }) {
  const { state, set, dispatch, resolvedTheme } = useOS();
  const tiles = [
    [
      "Wi-Fi",
      state.radio.wifi,
      () => {
        set("radio.wifi", !state.radio.wifi);
        if (state.radio.wifi) dispatch({ type: "WIFI_DISCONNECT" });
      },
      state.wifi.connected || "Off",
    ],
    [
      "Mobile data",
      state.radio.mobileData,
      () => set("radio.mobileData", !state.radio.mobileData),
      state.sim[state.defaults.data].label,
    ],
    [
      "Airplane",
      state.radio.airplane,
      () => dispatch({ type: "AIRPLANE" }),
      "All radios",
    ],
    [
      "Bluetooth",
      state.radio.bluetooth,
      () => set("radio.bluetooth", !state.radio.bluetooth),
      state.bluetooth.paired.length ? "Paired" : "Local",
    ],
    [
      "Flashlight",
      state.radio.flashlight,
      () => set("radio.flashlight", !state.radio.flashlight),
      `${state.radio.flashlightMode || "Continuous"} · ${state.radio.flashlightBrightness || 80}%`,
      () => set("screen.overlay", "flashlight"),
    ],
    [
      "Auto-rotate",
      state.radio.autoRotate,
      () => set("radio.autoRotate", !state.radio.autoRotate),
      "Screen",
    ],
    [
      "Do Not Disturb",
      state.radio.dnd,
      () => set("radio.dnd", !state.radio.dnd),
      "Silence alerts",
    ],
    [
      "Battery Saver",
      state.battery.saver,
      () => set("battery.saver", !state.battery.saver),
      state.battery.saverAuto ? "Automatic · ≤15%" : "Background",
    ],
    [
      "Extreme Saver",
      state.battery.extremeSaver,
      () => set("battery.extremeSaver", !state.battery.extremeSaver),
      state.battery.extremeSaverAuto ? "Automatic · ≤5%" : "Essential apps",
    ],
    [
      "Dark mode",
      resolvedTheme === "dark",
      () => set("theme.mode", resolvedTheme === "dark" ? "light" : "dark"),
      state.theme.mode === "auto" ? "Automatic" : "Appearance",
    ],
    [
      "Record screen",
      state.screen.recording,
      () => set("screen.recording", !state.screen.recording),
      "Visual mode",
    ],
    [
      "Rotate screen",
      state.screen.rotation,
      () => set("screen.rotation", !state.screen.rotation),
      state.screen.rotation ? "Landscape" : "Portrait",
    ],
  ];
  return (
    <div className={`quick-tiles ${compact ? "compact" : ""}`}>
      {tiles
        .slice(0, compact ? 4 : tiles.length)
        .map(([name, on, activate, sub, onLongPress]) => (
          <QuickTile key={name} {...{ name, on, activate, sub, onLongPress }} />
        ))}
    </div>
  );
}

export function AdvancedFlashlight() {
  const { state, set } = useOS();
  const caps = hardwareCapabilities(state);
  const limit = state.battery.extremeSaver
    ? 18
    : state.battery.saver
      ? 45
      : 100;
  const effective = Math.min(state.radio.flashlightBrightness || 80, limit);
  return (
    <SystemOverlay name="flashlight" label="Advanced Flashlight">
      <div className="shade advanced-flashlight app-scroll">
        <header>
          <div>
            <time>Flashlight</time>
            <span>Physical rear LED control</span>
          </div>
          <button
            onClick={() => set("radio.flashlight", !state.radio.flashlight)}
          >
            {state.radio.flashlight ? "Turn off" : "Turn on"}
          </button>
        </header>
        <div
          className={`flashlight-preview ${state.radio.flashlight && caps.flashlight ? "on" : ""}`}
          style={{ "--level": effective / 100 }}
        >
          <i />
          <b>{effective}% effective output</b>
          <span>
            {caps.flashlight
              ? state.radio.flashlightMode
              : "LED hardware unavailable"}
          </span>
        </div>
        <Slider
          label="Brightness"
          value={state.radio.flashlightBrightness || 80}
          onChange={(value) => set("radio.flashlightBrightness", value)}
        />
        <Segmented
          label="Flashlight pattern"
          value={state.radio.flashlightMode || "Continuous"}
          items={["Continuous", "Pulse", "SOS"]}
          onChange={(value) => set("radio.flashlightMode", value)}
        />
        <div className="flashlight-details">
          <b>Power authority</b>
          <span>
            {caps.flashlight
              ? "Rear LED installed and operational"
              : "Rear LED missing or damaged"}
          </span>
          <b>Energy policy</b>
          <span>
            {state.battery.extremeSaver
              ? "Extreme Saver caps output at 18%"
              : state.battery.saver
                ? "Battery Saver caps output at 45%"
                : "Full output available"}
          </span>
          <b>Thermal load</b>
          <span>
            {effective > 70
              ? "High · sustained use warms the mainboard"
              : effective > 35
                ? "Moderate"
                : "Low"}
          </span>
          <b>Power source</b>
          <span>
            {caps.externalPower
              ? "External USB-C"
              : caps.battery
                ? "Battery"
                : "No available power"}
          </span>
        </div>
      </div>
    </SystemOverlay>
  );
}
export function QuickSettings() {
  const { state, set, dispatch } = useOS();
  return (
    <SystemOverlay name="quick" label="Quick Settings">
      <div className="shade quick app-scroll">
        <header>
          <div>
            <time>
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span>Antoid 1 controls</span>
          </div>
          <button
            onClick={() => dispatch({ type: "OPEN_APP", id: "settings" })}
          >
            ⚙
          </button>
        </header>
        <QuickTiles />
        <Slider
          label="Brightness"
          value={state.screen.brightness}
          onChange={(v) => set("screen.brightness", v)}
        />
        <Slider
          label="Volume"
          value={state.sound.media}
          onChange={(v) => set("sound.media", v)}
        />
        {state.social.spotify.playing && (
          <div className="media-card">
            <span className="album-mini">A</span>
            <div>
              <b>Antoid Nights</b>
              <small>Antoid Sound Lab</small>
            </div>
            <button onClick={() => set("social.spotify.playing", false)}>
              Ⅱ
            </button>
          </div>
        )}
        <Button
          tone="primary"
          onClick={() => set("screen.overlay", "assistant")}
        >
          Search & Antoid Assistant
        </Button>
        <Button onClick={() => set("screen.overlay", "notifications")}>
          View notifications
        </Button>
      </div>
    </SystemOverlay>
  );
}

export function AssistantPanel() {
  const { state, set, dispatch, net } = useOS();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(
    "Ask about battery or connectivity, or type an app name to open it.",
  );
  const apps = [
    ...CORE_APPS,
    ...STORE_APPS.filter((a) => state.installed.includes(a.id)),
  ];
  const results = query
    ? [
        ...apps.map((a) => ({ id: a.id, name: a.name, type: "App" })),
        ...state.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          type: "Contact",
        })),
      ].filter((x) => x.name.toLowerCase().includes(query.toLowerCase()))
    : [];
  const run = () => {
    const q = query.toLowerCase().trim();
    const app = apps.find((a) => q.includes(a.name.toLowerCase()));
    if (app) return dispatch({ type: "OPEN_APP", id: app.id });
    if (q.includes("battery"))
      setAnswer(
        `Battery is ${Math.floor(state.battery.level)}%${state.battery.charging ? " and charging" : ""}.`,
      );
    else if (q.includes("wifi on")) {
      set("radio.wifi", true);
      setAnswer("Wi-Fi is on.");
    } else if (q.includes("wifi off")) {
      set("radio.wifi", false);
      dispatch({ type: "WIFI_DISCONNECT" });
      setAnswer("Wi-Fi is off.");
    } else if (q.includes("airplane")) {
      dispatch({ type: "AIRPLANE" });
      setAnswer("Airplane mode toggled.");
    } else if (q.includes("flashlight")) {
      set("radio.flashlight", !state.radio.flashlight);
      setAnswer(`Flashlight ${state.radio.flashlight ? "off" : "on"}.`);
    } else if (q.includes("dark mode")) {
      set("theme.mode", state.theme.mode === "dark" ? "light" : "dark");
      setAnswer("Theme switched.");
    } else if (q.includes("network") || q.includes("internet"))
      setAnswer(
        `${net.onlineVia}. ${net.quality}, ${net.latency} ms, ${net.bandwidth.toFixed(1)} Mbps.`,
      );
    else
      setAnswer(
        results.length
          ? `${results.length} local result${results.length === 1 ? "" : "s"} found.`
          : "I couldn’t match that command. Try “battery”, “network”, “flashlight”, or an app name.",
      );
  };
  return (
    <div className="assistant-panel app-scroll">
      <Header
        title="Antoid Assistant"
        subtitle="Local commands & global search"
      />
      <div className="assistant-orb">A</div>
      <p>{answer}</p>
      <div className="inline-form">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Search apps, contacts, or give a command"
        />
        <Button tone="primary" onClick={run}>
          Go
        </Button>
      </div>
      <div className="list-cards">
        {results.slice(0, 8).map((r) => (
          <button
            key={`${r.type}-${r.id}`}
            onClick={() =>
              r.type === "App"
                ? dispatch({ type: "OPEN_APP", id: r.id })
                : dispatch({ type: "OPEN_APP", id: "contacts" })
            }
          >
            <b>{r.name}</b>
            <span>{r.type}</span>
          </button>
        ))}
      </div>
      <h3>Try a command</h3>
      <div className="page-links">
        {[
          "Battery status",
          "Network quality",
          "Flashlight",
          "Open Settings",
          "Dark mode",
        ].map((x) => (
          <button key={x} onClick={() => setQuery(x)}>
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Recents() {
  const { state, set, dispatch } = useOS();
  const all = [...CORE_APPS, ...STORE_APPS];
  return (
    <div className="recents">
      <Header
        title="Recent apps"
        action={
          <button onClick={() => set("screen.recents", [])}>Clear all</button>
        }
      />
      <div className="recent-stack">
        {state.screen.recents.length ? (
          state.screen.recents.map((id) => {
            const a = all.find((x) => x.id === id);
            return (
              a && (
                <article key={id}>
                  <button onClick={() => dispatch({ type: "OPEN_APP", id })}>
                    <span style={{ background: a.color }}>{a.icon}</span>
                    <b>{a.name}</b>
                    <small>Tap to return</small>
                  </button>
                  <button
                    aria-label={`Close ${a.name}`}
                    onClick={() =>
                      set(
                        "screen.recents",
                        state.screen.recents.filter((x) => x !== id),
                      )
                    }
                  >
                    ×
                  </button>
                </article>
              )
            );
          })
        ) : (
          <p>No recent apps</p>
        )}
      </div>
    </div>
  );
}

export function PowerMenu() {
  const { state, dispatch, set } = useOS();
  return (
    <div className="power-menu">
      <div className="power-brand">
        <div className="antoid-mark small">
          <i />
          <i />
          <i />
        </div>
        <b>Antoid 1</b>
        <span>Build {state.system.build}</span>
      </div>
      <button
        onClick={() => {
          dispatch({ type: "POWER", value: { mode: "booting", locked: true } });
          sound("boot");
        }}
      >
        <span>↻</span>
        <b>Restart</b>
      </button>
      <button
        onClick={() => {
          dispatch({ type: "POWER", value: { mode: "off", locked: true } });
          sound("tap");
        }}
      >
        <span>⏻</span>
        <b>Power off</b>
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "MODAL",
            modal: {
              title: "Emergency information",
              body: state.system.emergency,
              actions: [{ label: "Medical ID" }, { label: "Close" }],
            },
          })
        }
      >
        <span>✚</span>
        <b>Emergency</b>
      </button>
      <Button onClick={() => set("screen.overlay", null)}>Cancel</Button>
    </div>
  );
}

export function GestureLayer() {
  const { set, dispatch, goBack } = useOS();
  const start = useRef(null);
  useEffect(() => {
    const down = (e) => {
      const screen = e.target.closest?.(".phone-screen");
      if (!screen) return;
      const r = screen.getBoundingClientRect();
      start.current = {
        x: e.clientX,
        y: e.clientY,
        t: Date.now(),
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      };
    };
    const up = (e) => {
      if (!start.current) return;
      const s = start.current,
        dx = e.clientX - s.x,
        dy = e.clientY - s.y,
        dt = Date.now() - s.t,
        localX = s.x - s.left,
        localY = s.y - s.top;
      if (localY < 55 && dy > 55)
        set(
          "screen.overlay",
          localX > s.width * 0.68 ? "quick" : "notifications",
        );
      else if (localY > s.height - 90 && dy < -55) {
        if (dt > 550) dispatch({ type: "RECENTS" });
        else dispatch({ type: "HOME" });
      } else if (localX < 25 && dx > 55) goBack();
      start.current = null;
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
    };
  }, [set, dispatch, goBack]);
  return null;
}

export function VolumeOverlay() {
  const { state } = useOS();
  const caps = hardwareCapabilities(state);
  const volume = state.screen.volumeOverlay;
  if (!volume) return null;
  const label =
    volume.stream === "call"
      ? "Call"
      : volume.stream === "media"
        ? "Media"
        : "Ringtone";
  return (
    <div className="volume-overlay" role="status" aria-live="polite">
      <span>
        {volume.stream === "call" ? "☎" : volume.stream === "media" ? "♫" : "♬"}
      </span>
      <div>
        <b>{label}</b>
        <i>
          <em style={{ width: `${volume.level}%` }} />
        </i>
        <small>
          {volume.level}%{state.radio.silent ? " · Silent mode" : ""}
          {state.radio.dnd ? " · DND" : ""}
          {!state.sound.enabled ? " · Sound disabled" : ""}
          {volume.stream === "media"
            ? ` · ${state.audioAccessories.mediaOutput === "Phone Speaker" ? "Phone Speaker" : state.audioAccessories.mediaOutput === "Wired Headphones" ? (caps.headphonesDetected ? "Wired Headphones" : "Output unavailable") : caps.headphonesDetected ? "Wired Headphones" : "Phone Speaker"}`
            : ""}
        </small>
      </div>
    </div>
  );
}

export function SIMManagerPanel({ scanner = false }) {
  const { state, set, dispatch } = useOS();
  const [scan, setScan] = useState(scanner);
  const install = () => {
    if (!state.qr.carrier) {
      dispatch({
        type: "TOAST",
        message: "Program the blank eSIM QR with a carrier card first",
      });
      return;
    }
    sound("success");
    dispatch({ type: "INSTALL_ESIM", carrier: state.qr.carrier });
    setScan(false);
  };
  const rows = ["physical", "esim"];
  return (
    <div className="app-scroll padded">
      <Header title="SIM Manager" subtitle="One physical slot + one eSIM" />
      <div className="sim-summary">
        {rows.map((key) => {
          const s = state.sim[key];
          const quality = lineQuality(state, key);
          return (
            <section key={key}>
              <div
                className="sim-logo"
                style={{
                  background: s.carrier ? CARRIERS[s.carrier].color : "#61706d",
                }}
              >
                {key === "physical" ? "1" : "e"}
              </div>
              <div>
                <b>
                  {s.label} ·{" "}
                  {s.installed ? CARRIERS[s.carrier].name : "No SIM"}
                </b>
                <span>
                  {s.installed
                    ? state.numbers.profiles[`${key}-${s.carrier}`]
                    : key === "physical"
                      ? "Open the tray to insert a card"
                      : "Add a programmed profile"}
                </span>
                <small>
                  {quality.trayUnavailable ? "SIM tray open" : s.status}
                  {s.installed
                    ? ` · ${quality.networkType} · ${quality.bars}/4 bars`
                    : ""}
                  {s.installed && voiceBearer(state, key).ok
                    ? ` · ${voiceBearer(state, key).shortLabel}`
                    : ""}
                </small>
              </div>
              {s.installed && (
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => set(`sim.${key}.enabled`, e.target.checked)}
                  aria-label={`Enable ${s.label}`}
                />
              )}
            </section>
          );
        })}
      </div>
      <div className="action-grid">
        {state.sim.physical.installed ? (
          <Button
            onClick={() => {
              if (!state.tray.open) dispatch({ type: "TOGGLE_TRAY" });
            }}
          >
            Eject Physical SIM
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: "TOGGLE_TRAY" })}>
            {state.tray.open ? "Close empty tray" : "Open SIM tray"}
          </Button>
        )}
        {state.sim.esim.installed ? (
          <Button onClick={() => dispatch({ type: "REMOVE_ESIM" })}>
            Remove eSIM
          </Button>
        ) : (
          <Button tone="primary" onClick={() => setScan(true)}>
            Add eSIM
          </Button>
        )}
      </div>
      {scan && (
        <div
          className={`esim-scanner ${state.qr.selected ? "ready" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.getData("type") === "qr") install();
          }}
        >
          <div className="scan-line" />
          <b>Scan programmed eSIM QR</b>
          <span>Drag the QR card here, or use the accessible button.</span>
          <Button tone="primary" onClick={install}>
            Use desk QR
          </Button>
          <Button onClick={() => setScan(false)}>Cancel</Button>
        </div>
      )}
      <h3>Defaults</h3>
      <label className="select-row">
        Calls
        <select
          value={state.defaults.calls}
          onChange={(e) => set("defaults.calls", e.target.value)}
        >
          <option value="ask">Ask every time</option>
          {rows
            .filter((k) => state.sim[k].installed)
            .map((k) => (
              <option value={k} key={k}>
                {state.sim[k].label}
              </option>
            ))}
        </select>
      </label>
      <label className="select-row">
        SMS
        <select
          value={state.defaults.sms}
          onChange={(e) => set("defaults.sms", e.target.value)}
        >
          <option value="ask">Ask every time</option>
          {rows
            .filter((k) => state.sim[k].installed)
            .map((k) => (
              <option value={k} key={k}>
                {state.sim[k].label}
              </option>
            ))}
        </select>
      </label>
      <label className="select-row">
        Mobile data
        <select
          value={state.defaults.data}
          onChange={(e) => set("defaults.data", e.target.value)}
        >
          {rows
            .filter((k) => state.sim[k].installed)
            .map((k) => (
              <option value={k} key={k}>
                {state.sim[k].label}
              </option>
            ))}
        </select>
      </label>
      {rows
        .filter((k) => state.sim[k].installed)
        .map((k) => (
          <LineSettings key={k} slot={k} />
        ))}
    </div>
  );
}
function LineSettings({ slot }) {
  const { state, set } = useOS();
  const s = state.sim[slot];
  return (
    <details className="settings-details">
      <summary>{s.label} voice & network</summary>
      <label className="select-row">
        Network mode
        <select
          value={s.networkMode}
          onChange={(e) => set(`sim.${slot}.networkMode`, e.target.value)}
        >
          {NETWORK_MODES.map((mode) => (
            <option key={mode}>{mode}</option>
          ))}
        </select>
      </label>
      <label className="select-row">
        Requested radio
        <select
          value={s.radioSelection}
          onChange={(e) => {
            set(`sim.${slot}.radioSelection`, e.target.value);
            set(`sim.${slot}.network`, e.target.value);
          }}
        >
          {RADIO_CHOICES.map((rat) => (
            <option key={rat}>{rat}</option>
          ))}
        </select>
      </label>
      <Toggle
        label="Enable 5G"
        checked={s.voice.enable5g}
        onChange={(v) => set(`sim.${slot}.voice.enable5g`, v)}
      />
      <Toggle
        label="VoNR"
        checked={s.voice.vonr}
        onChange={(v) => set(`sim.${slot}.voice.vonr`, v)}
      />
      <Toggle
        label="VoLTE"
        checked={s.voice.volte}
        onChange={(v) => set(`sim.${slot}.voice.volte`, v)}
      />
      <Toggle
        label="Wi-Fi Calling"
        checked={s.voice.wifiCalling}
        onChange={(v) => set(`sim.${slot}.voice.wifiCalling`, v)}
      />
      <Toggle
        label="Prefer Wi-Fi Calling"
        checked={s.voice.preferWifi}
        onChange={(v) => set(`sim.${slot}.voice.preferWifi`, v)}
      />
      <Toggle
        label="Allow 3G fallback"
        checked={s.voice.fallback3g}
        onChange={(v) => set(`sim.${slot}.voice.fallback3g`, v)}
      />
      <Toggle
        label="Allow 2G fallback"
        checked={s.voice.fallback2g}
        onChange={(v) => set(`sim.${slot}.voice.fallback2g`, v)}
      />
      <Toggle
        label="Allow 2G"
        checked={s.voice.allow2g}
        onChange={(v) => set(`sim.${slot}.voice.allow2g`, v)}
      />
      <Toggle
        label="Roaming"
        checked={s.roaming}
        onChange={(v) => set(`sim.${slot}.roaming`, v)}
      />
      <Toggle
        label="Automatic network selection"
        checked={s.voice.automatic}
        onChange={(v) => set(`sim.${slot}.voice.automatic`, v)}
      />
      <FormField
        label="SIM PIN"
        type="password"
        maxLength="4"
        value={s.pin}
        onChange={(e) =>
          set(`sim.${slot}.pin`, e.target.value.replace(/\D/g, "").slice(0, 4))
        }
      />
    </details>
  );
}
