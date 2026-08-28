import React, { useRef, useState } from "react";
import { CARRIERS, useOS } from "../state/OSContext.jsx";
import { sound } from "../services/audio.js";
import {
  DATA_PLAN_MB,
  OPERATION_CONDITIONS,
  lineQuality,
  voiceBearer,
} from "../services/core.js";
import { Button, Segmented, SignalBars } from "./UI.jsx";
import {
  AssistantPanel,
  AdvancedFlashlight,
  BootScreen,
  HomeScreen,
  LockScreen,
  NavigationBar,
  NotificationsPanel,
  PowerMenu,
  QuickSettings,
  Recents,
  SetupAssistant,
  StatusBar,
  VolumeOverlay,
} from "./SystemUI.jsx";
import { AppRouter } from "../apps/AppRouter.jsx";
import { ControllerLab } from "./ControllerLab.jsx";
import {
  COMPONENT_LAYOUT,
  hardwareCapabilities,
} from "../services/hardware.js";
import { LaptopScene } from "./LaptopScene.jsx";

function CarrierCard({ id }) {
  const { state, dispatch } = useOS();
  const c = CARRIERS[id];
  const selected = state.tray.selected === id;
  if (state.tray.card === id)
    return (
      <div
        className="sim-card desk-sim parked"
        style={{ "--carrier": c.color }}
        aria-label={`${c.name} physical SIM is inside the phone tray`}
      >
        <span className="sim-chip" />
        <b>{c.name.replace(" HU", "")}</b>
        <small>Inside phone tray</small>
      </div>
    );
  const drop = (target) => {
    if (target === "tray") {
      if (!state.tray.open)
        return dispatch({ type: "TOAST", message: "Open the SIM tray first" });
      if (state.tray.card)
        return dispatch({
          type: "TOAST",
          message: "The physical slot already contains a SIM",
        });
      dispatch({ type: "SEAT_SIM", carrier: id });
      sound("success");
    } else if (target === "qr") {
      if (state.qr.carrier && state.qr.carrier !== id) {
        dispatch({
          type: "MODAL",
          modal: {
            icon: "e",
            title: "Replace eSIM profile?",
            body: `Replace ${CARRIERS[state.qr.carrier].name} with ${c.name} provisioning data?`,
            actions: [
              { label: "Cancel" },
              {
                label: "Replace",
                onClick: () => dispatch({ type: "PROGRAM_QR", carrier: id }),
              },
            ],
          },
        });
      } else {
        dispatch({ type: "PROGRAM_QR", carrier: id });
        sound("success");
      }
    }
  };
  return (
    <button
      className={`sim-card desk-sim ${selected ? "selected" : ""}`}
      style={{ "--carrier": c.color }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("type", "sim");
        e.dataTransfer.setData("carrier", id);
      }}
      onClick={() => dispatch({ type: "SELECT_SIM_CARD", carrier: id })}
      onDoubleClick={() => drop(state.tray.open ? "tray" : "qr")}
      aria-pressed={selected}
      aria-label={`${c.name} physical SIM; select for insertion or programming`}
    >
      <span className="sim-chip" />
      <b>{c.name.replace(" HU", "")}</b>
      <small>{selected ? "Selected — tap tray or QR" : "Physical SIM"}</small>
    </button>
  );
}

function EsimCard() {
  const { state, set, dispatch } = useOS();
  const c = state.qr.carrier && CARRIERS[state.qr.carrier];
  const program = (carrierId) => {
    const id = typeof carrierId === "string" ? carrierId : state.tray.selected;
    if (!id) {
      set("qr.selected", !state.qr.selected);
      return;
    }
    if (state.qr.carrier && state.qr.carrier !== id)
      dispatch({
        type: "MODAL",
        modal: {
          icon: "e",
          title: "Replace eSIM profile?",
          body: `Replace ${CARRIERS[state.qr.carrier].name} with ${CARRIERS[id].name} provisioning data?`,
          actions: [
            { label: "Cancel" },
            {
              label: "Replace",
              onClick: () => dispatch({ type: "PROGRAM_QR", carrier: id }),
            },
          ],
        },
      });
    else dispatch({ type: "PROGRAM_QR", carrier: id });
  };
  return (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData("type", "qr")}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.getData("type") === "sim")
          program(e.dataTransfer.getData("carrier"));
      }}
      onClick={program}
      className={`esim-card ${state.qr.selected ? "selected" : ""}`}
      aria-label={`eSIM QR ${c ? c.name : "empty profile"}`}
    >
      <div className="qr-pattern">
        {Array.from({ length: 36 }, (_, i) => (
          <i
            className={(i * (c ? c.prefix : 3) + i * i) % 5 > 1 ? "dark" : ""}
            key={i}
          />
        ))}
      </div>
      <div>
        <b>eSIM QR</b>
        <span>{c ? `${c.name} Profile` : "Empty Profile"}</span>
        <small>
          {c ? "Ready to install" : "Select a carrier SIM, then tap here"}
        </small>
      </div>
    </button>
  );
}

function NetworkPanel() {
  const { state, set } = useOS();
  const installed = ["physical", "esim"].filter((k) => state.sim[k].installed);
  const slot = installed.includes(state.networkLab.selectedSlot)
    ? state.networkLab.selectedSlot
    : installed[0] || "physical";
  const line = state.sim[slot];
  const quality = lineQuality(state, slot);
  const voice = voiceBearer(state, slot);
  const lab = state.networkLab;
  const modules = [
    "Radio",
    "Signal Shield",
    "Network Load",
    "Carrier Operations",
    "Cell Handover",
    "Data Plan",
  ];
  const carrier = lab.operationCarrier;
  const operationNetwork = lab.operationNetwork;
  const operationValue =
    lab.operations[carrier]?.[operationNetwork] || "Normal";
  const plan = lab.plans[slot];
  const allowance = DATA_PLAN_MB[plan.name];
  const remaining = Number.isFinite(allowance)
    ? Math.max(0, allowance - plan.usedMB)
    : Infinity;
  const usagePercent = Number.isFinite(allowance)
    ? Math.min(100, (plan.usedMB / allowance) * 100)
    : 0;
  const loadLabel = (value) =>
    value <= 20
      ? "Light"
      : value <= 50
        ? "Normal"
        : value <= 75
          ? "Busy"
          : value <= 90
            ? "Congested"
            : "Overloaded";
  const restoreOperations = () =>
    set(
      "networkLab.operations",
      Object.fromEntries(
        Object.keys(CARRIERS).map((id) => [
          id,
          Object.fromEntries(
            ["All", "5G", "4G", "3G", "EDGE"].map((network) => [
              network,
              "Normal",
            ]),
          ),
        ]),
      ),
    );
  return (
    <aside className="network-panel desk-panel">
      <header>
        <span>LIVE</span>
        <div>
          <b>Controller Lab</b>
          <small>Combined radio & carrier simulator</small>
        </div>
      </header>
      <div
        className="lab-modules"
        role="tablist"
        aria-label="Controller Lab module"
      >
        {modules.map((module) => (
          <button
            role="tab"
            aria-selected={lab.module === module}
            className={lab.module === module ? "active" : ""}
            onClick={() => set("networkLab.module", module)}
            key={module}
          >
            {module}
          </button>
        ))}
      </div>
      <label>
        Control line
        <select
          value={slot}
          disabled={!installed.length}
          onChange={(e) => set("networkLab.selectedSlot", e.target.value)}
        >
          {installed.length ? (
            installed.map((k) => (
              <option key={k} value={k}>
                {state.sim[k].label} · {CARRIERS[state.sim[k].carrier].name}
              </option>
            ))
          ) : (
            <option>No installed line</option>
          )}
        </select>
      </label>
      <div className="lab-summary">
        <b>{quality.networkType}</b>
        <span>{quality.bars}/4</span>
        <span>Load {quality.load}%</span>
        <span>{quality.condition}</span>
        <span>
          {remaining === Infinity ? "Unlimited" : `${remaining.toFixed(0)} MB`}
        </span>
      </div>

      {lab.module === "Radio" && (
        <div className="lab-module-panel">
          <Segmented
            label="Network type"
            value={line.network}
            onChange={(v) => set(`sim.${slot}.network`, v)}
            items={["5G", "4G", "3G", "EDGE"]}
          />
          <div className="signal-control">
            <button
              onClick={() =>
                set(`sim.${slot}.bars`, Math.max(0, line.bars - 1))
              }
            >
              −<span>Signal Down</span>
            </button>
            <div>
              <SignalBars bars={quality.bars} />
              <b>{quality.bars} / 4</b>
              <small>Base {line.bars}/4 · effective reception</small>
            </div>
            <button
              onClick={() =>
                set(`sim.${slot}.bars`, Math.min(4, line.bars + 1))
              }
            >
              +<span>Signal Up</span>
            </button>
          </div>
          <div className="network-stats">
            <span>
              <b>{quality.networkType}</b>Active radio
            </span>
            <span>
              <b>{voice.ok ? voice.shortLabel : "Unavailable"}</b>Voice route
            </span>
          </div>
        </div>
      )}

      {lab.module === "Signal Shield" && (
        <div className="lab-module-panel shield-module">
          <div
            className="signal-shield"
            style={{ "--shield": `${lab.shield}%` }}
          >
            <i>Α</i>
            <span>INTERFERENCE SHIELD</span>
          </div>
          <label className="lab-slider">
            Interference <b>{lab.shield}%</b>
            <input
              aria-label="Signal Shield interference"
              type="range"
              min="0"
              max="100"
              value={lab.shield}
              onChange={(e) => set("networkLab.shield", +e.target.value)}
            />
          </label>
          <p>
            Base {quality.baseBars}/4 → effective {quality.bars}/4. Congestion
            is unchanged.
          </p>
        </div>
      )}

      {lab.module === "Network Load" && (
        <div className="lab-module-panel">
          <label>
            Carrier
            <select
              value={lab.loadCarrier}
              onChange={(e) => set("networkLab.loadCarrier", e.target.value)}
            >
              {Object.entries(CARRIERS).map(([id, item]) => (
                <option value={id} key={id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-slider">
            Load{" "}
            <b>
              {lab.load[lab.loadCarrier]}% ·{" "}
              {loadLabel(lab.load[lab.loadCarrier])}
            </b>
            <input
              aria-label="Carrier network load"
              type="range"
              min="0"
              max="100"
              value={lab.load[lab.loadCarrier]}
              onChange={(e) =>
                set(`networkLab.load.${lab.loadCarrier}`, +e.target.value)
              }
            />
          </label>
          <p>
            Load affects speed, delay, jitter and loss without changing signal
            bars.
          </p>
        </div>
      )}

      {lab.module === "Carrier Operations" && (
        <div className="lab-module-panel carrier-operations">
          <label>
            Carrier
            <select
              value={carrier}
              onChange={(e) =>
                set("networkLab.operationCarrier", e.target.value)
              }
            >
              {Object.entries(CARRIERS).map(([id, item]) => (
                <option value={id} key={id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Network
            <select
              value={operationNetwork}
              onChange={(e) =>
                set("networkLab.operationNetwork", e.target.value)
              }
            >
              <option>All</option>
              <option>5G</option>
              <option>4G</option>
              <option>3G</option>
              <option value="EDGE">2G / EDGE</option>
            </select>
          </label>
          <label>
            Condition
            <select
              value={operationValue}
              onChange={(e) =>
                set(
                  `networkLab.operations.${carrier}.${operationNetwork}`,
                  e.target.value,
                )
              }
            >
              {OPERATION_CONDITIONS.map((condition) => (
                <option key={condition}>{condition}</option>
              ))}
            </select>
          </label>
          <div className="lab-actions">
            <Button
              onClick={() =>
                set(
                  `networkLab.operations.${carrier}.${operationNetwork}`,
                  "Normal",
                )
              }
            >
              Reset selected
            </Button>
            <Button onClick={restoreOperations}>Restore all networks</Button>
          </div>
          <p>
            Data and voice outages remain independent and allow lower-generation
            fallback.
          </p>
        </div>
      )}

      {lab.module === "Cell Handover" && (
        <div className="lab-module-panel handover-module">
          <div className="tower-route">
            {["A", "B", "C"].map((tower, index) => (
              <span
                className={quality.tower.id === tower ? "active" : ""}
                key={tower}
              >
                <i>⌁</i>
                <b>Tower {tower}</b>
                <small>{["5G", "4G", "3G"][index]}</small>
              </span>
            ))}
          </div>
          <label className="lab-slider">
            Phone position <b>{lab.handover.position}%</b>
            <input
              aria-label="Phone position between towers"
              type="range"
              min="0"
              max="100"
              value={lab.handover.position}
              onChange={(e) =>
                set("networkLab.handover.position", +e.target.value)
              }
            />
          </label>
          <p>
            {quality.handover
              ? "Handover in progress · temporary quality variation"
              : `Serving Tower ${quality.tower.id} · ${quality.tower.network}`}
          </p>
        </div>
      )}

      {lab.module === "Data Plan" && (
        <div className="lab-module-panel data-plan-module">
          <label>
            Plan
            <select
              value={plan.name}
              onChange={(e) =>
                set(`networkLab.plans.${slot}.name`, e.target.value)
              }
            >
              {Object.keys(DATA_PLAN_MB).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="plan-meter">
            <i style={{ width: `${usagePercent}%` }} />
          </div>
          <dl>
            <dt>Used</dt>
            <dd>{plan.usedMB.toFixed(1)} MB</dd>
            <dt>Remaining</dt>
            <dd>
              {remaining === Infinity
                ? "Unlimited"
                : `${remaining.toFixed(1)} MB`}
            </dd>
            <dt>Cycle</dt>
            <dd>{plan.cycleStart}</dd>
          </dl>
          <div className="lab-actions">
            <Button onClick={() => set(`networkLab.plans.${slot}.usedMB`, 0)}>
              Reset usage
            </Button>
            <Button
              onClick={() => {
                set(`networkLab.plans.${slot}.usedMB`, 0);
                set(
                  `networkLab.plans.${slot}.cycleStart`,
                  new Date().toISOString().slice(0, 10),
                );
              }}
            >
              New billing cycle
            </Button>
          </div>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={lab.autoSwitchData}
              onChange={(e) =>
                set("networkLab.autoSwitchData", e.target.checked)
              }
            />
            Automatically switch mobile data
          </label>
          {quality.plan.exhausted && (
            <strong className="data-limit">Mobile data limit reached</strong>
          )}
        </div>
      )}
    </aside>
  );
}

function Charger() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  if (!state.hardware.unboxing.chargerUnlocked) return null;
  return (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData("type", "charger")}
      onClick={() => {
        if (!caps.wiredPowerPath) {
          dispatch({
            type: "TOAST",
            message: "The USB-C daughterboard or interconnect is unavailable",
          });
          return;
        }
        set("battery.charging", !state.battery.charging);
        dispatch({
          type: "NOTIFY",
          title: state.battery.charging
            ? "External power disconnected"
            : caps.battery
              ? "Charging"
              : "External power connected",
          body: state.battery.charging
            ? caps.battery
              ? "Using battery power"
              : "Immediate power loss"
            : caps.battery
              ? `${Math.floor(state.battery.level)}% · Full in about ${Math.ceil((100 - state.battery.level) / 3)} min`
              : "Battery not installed · Antoid is running directly from USB-C",
        });
        sound("charge");
      }}
      className={`charger ${state.battery.charging ? "connected" : ""}`}
      aria-label={`${state.battery.charging ? "Disconnect" : "Connect"} charging cable`}
    >
      <div className="plug">▥</div>
      <div className="cable" />
      <span>
        {state.battery.charging
          ? caps.battery
            ? "Charging"
            : "External power"
          : "USB-C power cable"}
      </span>
    </button>
  );
}

function WiredHeadphones() {
  const { state, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const connected = state.audioAccessories.wiredHeadphonesConnected;
  return (
    <button
      className={`wired-headphones ${connected ? "connected" : ""} ${connected && !caps.headphonesDetected ? "undetected" : ""}`}
      onClick={() =>
        dispatch({ type: "SET_HEADPHONES", connected: !connected })
      }
      aria-label={`${connected ? "Disconnect" : "Connect"} wired headphones`}
      title="Physical 3.5 mm wired headphones · can be used independently as FM antenna and audio output"
    >
      <i className="headphone-band" />
      <i className="headphone-cup left" />
      <i className="headphone-cup right" />
      <i className="headphone-wire" />
      <i className="headphone-plug" />
      <span>
        {connected
          ? caps.headphonesDetected
            ? "Wired headphones connected"
            : "Inserted · jack cannot detect"
          : "3.5 mm wired headphones"}
      </span>
    </button>
  );
}

function Hardware() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const hold = useRef(),
    longPressed = useRef(false),
    powerTime = useRef(0),
    volumeTime = useRef(0),
    chord = useRef(false),
    lastShot = useRef(0);
  const capturePhone = () =>
    new Promise((resolve) => {
      const node = document.querySelector(".phone-screen");
      if (!node) return resolve(null);
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const rasterizeVisibleDom = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const context = canvas.getContext("2d");
        context.scale(2, 2);
        const rootRect = node.getBoundingClientRect();
        context.fillStyle = getComputedStyle(node).backgroundColor || "#10161c";
        context.fillRect(0, 0, width, height);
        const paint = (element) => {
          if (!(element instanceof Element)) return;
          const style = getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          )
            return;
          const rect = element.getBoundingClientRect();
          const x = rect.left - rootRect.left,
            y = rect.top - rootRect.top;
          if (
            rect.width &&
            rect.height &&
            x < width &&
            y < height &&
            x + rect.width > 0 &&
            y + rect.height > 0
          ) {
            if (
              style.backgroundColor &&
              style.backgroundColor !== "rgba(0, 0, 0, 0)"
            ) {
              context.fillStyle = style.backgroundColor;
              context.fillRect(x, y, rect.width, rect.height);
            }
            if (element instanceof HTMLImageElement && element.complete) {
              try {
                context.drawImage(element, x, y, rect.width, rect.height);
              } catch {
                /* continue with DOM text */
              }
            }
            for (const child of element.childNodes) {
              if (
                child.nodeType !== Node.TEXT_NODE ||
                !child.textContent.trim()
              )
                continue;
              const range = document.createRange();
              range.selectNodeContents(child);
              const textRect = range.getBoundingClientRect();
              context.save();
              context.beginPath();
              context.rect(0, 0, width, height);
              context.clip();
              context.fillStyle = style.color;
              context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              context.textBaseline = "top";
              context.fillText(
                child.textContent.trim(),
                textRect.left - rootRect.left,
                textRect.top - rootRect.top,
                Math.max(1, textRect.width),
              );
              context.restore();
            }
          }
          [...element.children].forEach(paint);
        };
        paint(node);
        return { data: canvas.toDataURL("image/png"), width, height };
      };
      const clone = node.cloneNode(true);
      const inlineStyles = (source, target) => {
        const computed = getComputedStyle(source);
        target.setAttribute(
          "style",
          [...computed]
            .map(
              (property) =>
                `${property}:${computed.getPropertyValue(property)};`,
            )
            .join(""),
        );
        [...source.children].forEach((child, index) =>
          inlineStyles(child, target.children[index]),
        );
      };
      inlineStyles(node, clone);
      clone
        .querySelectorAll(".screenshot-preview,.screenshot-flash")
        .forEach((item) => item.remove());
      const markup = new XMLSerializer().serializeToString(clone);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${markup}</div></foreignObject></svg>`;
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width * 2;
          canvas.height = height * 2;
          const context = canvas.getContext("2d");
          context.scale(2, 2);
          context.drawImage(image, 0, 0, width, height);
          URL.revokeObjectURL(image.src);
          resolve({ data: canvas.toDataURL("image/png"), width, height });
        } catch {
          URL.revokeObjectURL(image.src);
          resolve(rasterizeVisibleDom());
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(image.src);
        resolve(rasterizeVisibleDom());
      };
      image.src = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      );
    });
  const screenshot = async () => {
    if (Date.now() - lastShot.current < 900) return;
    lastShot.current = Date.now();
    sound("screenshot");
    set("screen.screenshotFlash", true);
    setTimeout(() => set("screen.screenshotFlash", false), 160);
    const captured = await capturePhone();
    const now = Date.now();
    const colors = ["#152f36", state.theme.accent, "#8067da"];
    dispatch({
      type: "ADD_PHOTO",
      photo: {
        id: `shot-${now}`,
        title: `Screenshot ${new Date().toLocaleTimeString("en-US")}`,
        filename: `Screenshot_${new Date().toISOString().replaceAll(":", "-")}.png`,
        kind: "screenshot",
        data: captured?.data,
        created: now,
        resolution: captured
          ? `${captured.width * 2} × ${captured.height * 2}`
          : "Phone display",
        source: "Power + Volume Down",
        size: captured?.data
          ? `${Math.round(captured.data.length * 0.00075)} KB`
          : "Generated locally",
        colors,
        favorite: false,
        trash: false,
        rotation: 0,
        brightness: 100,
        contrast: 100,
      },
    });
    set("screen.screenshotPreview", {
      id: `shot-${now}`,
      data: captured?.data,
      time: now,
    });
    dispatch({ type: "TOAST", message: "Screenshot saved to Gallery" });
  };
  const maybeShot = () => {
    if (Math.abs(powerTime.current - volumeTime.current) < 650) {
      chord.current = true;
      screenshot();
      return true;
    }
    return false;
  };
  const powerDown = () => {
    if (!caps.buttons) {
      dispatch({
        type: "TOAST",
        message: "Side-button flex cable is unavailable",
      });
      return;
    }
    powerTime.current = Date.now();
    longPressed.current = false;
    hold.current = setTimeout(() => {
      if (state.power.mode !== "off") {
        longPressed.current = true;
        if (state.power.mode === "sleep") dispatch({ type: "WAKE" });
        set("screen.overlay", "power");
      }
    }, 700);
    maybeShot();
  };
  const powerUp = () => {
    if (!caps.buttons) return;
    clearTimeout(hold.current);
    if (
      !longPressed.current &&
      !chord.current &&
      Date.now() - powerTime.current < 650
    ) {
      if (state.power.mode === "off") dispatch({ type: "BOOT" });
      else if (state.power.mode === "sleep") dispatch({ type: "WAKE" });
      else if (state.power.mode === "on") {
        dispatch({ type: "SLEEP" });
        if (state.sound.enabled) sound("lock");
      }
    }
    chord.current = false;
    if (!longPressed.current && state.power.mode !== "on") sound("tap");
  };
  const volDown = () => {
    if (!caps.buttons) return;
    volumeTime.current = Date.now();
    if (!maybeShot()) dispatch({ type: "VOLUME_ADJUST", delta: -5 });
  };
  return (
    <>
      <button
        className={`hardware-btn power ${caps.buttons ? "" : "broken"}`}
        onPointerDown={powerDown}
        onPointerUp={powerUp}
        aria-label="Power button"
        title="Tap: wake or lock. Hold: power menu."
      />
      <button
        className={`hardware-btn volume-up ${caps.buttons ? "" : "broken"}`}
        onClick={() =>
          caps.buttons && dispatch({ type: "VOLUME_ADJUST", delta: 5 })
        }
        aria-label="Volume up"
      />
      <button
        className={`hardware-btn volume-down ${caps.buttons ? "" : "broken"}`}
        onPointerDown={volDown}
        aria-label="Volume down"
      />
      <div
        className="charge-port"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (e.dataTransfer.getData("type") === "charger") {
            if (caps.wiredPowerPath) {
              set("battery.charging", true);
              sound("charge");
            } else
              dispatch({
                type: "TOAST",
                message: "The charging path is physically incomplete",
              });
          }
        }}
      />
      <button
        className={`headphone-port ${state.audioAccessories.wiredHeadphonesConnected ? "inserted" : ""}`}
        onClick={() =>
          dispatch({
            type: "SET_HEADPHONES",
            connected: !state.audioAccessories.wiredHeadphonesConnected,
          })
        }
        aria-label={`${state.audioAccessories.wiredHeadphonesConnected ? "Remove" : "Insert"} 3.5 mm headphone plug`}
        title="3.5 mm headphone jack"
      />
      <div className="speaker-holes">••••••</div>
    </>
  );
}

function PhysicalTray() {
  const { state, dispatch } = useOS();
  const trayPart = state.hardware.components.simTray;
  if (!trayPart?.installed)
    return (
      <div
        className="physical-tray-slot-empty"
        aria-label="SIM tray removed; empty tray slot"
        title="SIM tray removed · reinstall it from Inventory"
      />
    );
  const click = () => {
    if (state.tray.open && !state.tray.card && state.tray.selected)
      dispatch({ type: "SEAT_SIM", carrier: state.tray.selected });
    else if (state.tray.open && state.tray.card)
      dispatch({ type: "CLOSE_TRAY" });
    else dispatch({ type: "TOGGLE_TRAY" });
    sound("eject");
  };
  return (
    <div
      role="button"
      tabIndex="0"
      className={`physical-tray ${state.tray.open ? "open" : ""} ${state.tray.card ? "filled" : ""}`}
      onClick={click}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.getData("type") === "sim") {
          dispatch({
            type: "SEAT_SIM",
            carrier: e.dataTransfer.getData("carrier"),
          });
          sound("success");
        }
      }}
      aria-label={`SIM tray ${state.tray.open ? "open" : "closed"} ${state.tray.card ? "with SIM" : "empty"}`}
    >
      <span className="tray-hole" />
      {state.tray.card && (
        <span
          className="tray-chip"
          style={{ background: CARRIERS[state.tray.card].color }}
        >
          {CARRIERS[state.tray.card].name[0]}
        </span>
      )}
      {state.tray.open && state.tray.card && (
        <button
          className="tray-remove"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "REMOVE_SIM" });
            sound("eject");
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

function PhoneScreen() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const touchStart = useRef(null);
  const touchReady =
    caps.digitizer && caps.powerAvailable && state.power.mode === "on";
  const pointerDown = (event) => {
    if (!touchReady || state.power.locked) return;
    const target = event.target;
    const zone = target.closest?.(".status-system-trigger")
      ? "quick"
      : target.closest?.(".status-bar")
        ? "notifications"
        : target.closest?.(".nav-bar")
          ? "navigation"
          : null;
    // App content uses the browser's normal DOM input path. Only the two
    // deliberate OS gesture zones are observed here, without pointer capture,
    // preventDefault, pointer forwarding or a transparent proxy layer.
    if (!zone) {
      touchStart.current = null;
      return;
    }
    touchStart.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      zone,
    };
  };
  const pointerUp = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !touchReady || state.power.locked) return;
    const dy = event.clientY - start.y;
    if ((start.zone === "quick" || start.zone === "notifications") && dy > 48)
      set("screen.overlay", start.zone);
    else if (start.zone === "navigation" && dy < -48) {
      if (Date.now() - start.time > 550) dispatch({ type: "RECENTS" });
      else dispatch({ type: "HOME" });
    }
  };
  if (!caps.display)
    return (
      <div className="phone-screen display-missing">
        <i />
        <span>
          {state.hardware.components.display.installed
            ? "Display has no signal"
            : "Display assembly removed"}
        </span>
      </div>
    );
  let body;
  if (state.power.mode === "off" || state.power.mode === "sleep")
    body = (
      <div className="screen-off">
        {state.battery.charging && caps.battery && (
          <div className="off-charge">
            <b>{Math.floor(state.battery.level)}%</b>
            <span>Charging Antoid 1</span>
          </div>
        )}
      </div>
    );
  else if (state.power.mode === "booting") body = <BootScreen />;
  else if (state.maintenance.active) body = <AppRouter />;
  else if (!state.setup.done) body = <SetupAssistant />;
  else if (state.power.locked && state.screen.secureApp === "camera")
    body = (
      <>
        <StatusBar />
        <AppRouter />
        <NavigationBar />
      </>
    );
  else if (state.power.locked)
    body = (
      <>
        <LockScreen />
        {state.screen.overlay === "power" && <PowerMenu />}
      </>
    );
  else
    body = (
      <>
        <StatusBar />
        {state.screen.app ? <AppRouter /> : <HomeScreen />}
        <NavigationBar />
        {state.screen.overlay === "notifications" && <NotificationsPanel />}
        {state.screen.overlay === "quick" && <QuickSettings />}
        {state.screen.overlay === "flashlight" && <AdvancedFlashlight />}
        {state.screen.overlay === "assistant" && <AssistantPanel />}
        {state.screen.overlay === "recents" && <Recents />}
        {state.screen.overlay === "power" && <PowerMenu />}
      </>
    );
  return (
    <div
      className={`phone-screen ${touchReady ? "touch-enabled" : "touch-disabled"} display-${String(
        caps.displaySpecs.technology || "unknown",
      )
        .toLowerCase()
        .replaceAll(
          " ",
          "-",
        )} tier-${String(caps.displaySpecs.tier || "standard").toLowerCase()}`}
      style={{
        filter: `brightness(${Math.max(20, state.screen.brightness)}%)`,
        "--display-refresh": caps.displaySpecs.refreshHz || 60,
        "--display-nits": caps.displaySpecs.peakNits || 400,
        "--touch-latency": `${caps.displaySpecs.touchLatency || 20}ms`,
      }}
      onPointerDownCapture={pointerDown}
      onPointerUpCapture={pointerUp}
      onPointerCancelCapture={() => {
        touchStart.current = null;
      }}
    >
      {body}
      {state.hardware.components.display.cracked > 0 && (
        <div
          className="phone-display-damage"
          style={{
            opacity: Math.min(
              0.88,
              state.hardware.components.display.cracked / 100,
            ),
          }}
        />
      )}
      {!caps.digitizer && (
        <div className="digitizer-missing">
          <span>Touch digitizer unavailable</span>
        </div>
      )}
      {state.screen.screenshotFlash && <div className="screenshot-flash" />}
      {state.screen.screenshotPreview && (
        <button
          className="screenshot-preview"
          onClick={() => dispatch({ type: "OPEN_APP", id: "gallery" })}
        >
          {state.screen.screenshotPreview.data ? (
            <img
              src={state.screen.screenshotPreview.data}
              alt="Screenshot preview"
            />
          ) : (
            <span>Screenshot</span>
          )}
        </button>
      )}
      {state.power.mode === "on" && <VolumeOverlay />}
    </div>
  );
}

const internalLabels = {
  mainboard: "LOGIC BOARD",
  battery: "4800 mAh",
  storage: "UFS",
  modem: "5G",
  chargingCoil: "QI / NFC",
  thermalSystem: "VAPOUR",
  usbBoard: "USB-C",
  speaker: "SPEAKER",
  haptics: "HAPTIC",
  simReader: "SIM ×2",
  fmReceiver: "FM TUNER",
  fmAntenna: "FM ANT",
  headphoneJack: "3.5 MM",
};

function PhoneBack() {
  const { state, dispatch } = useOS();
  const { components, selected, exploded, water } = state.hardware;
  const cover = components.backCover;
  const visibleParts = Object.entries(COMPONENT_LAYOUT).filter(
    ([id, pos]) =>
      !["frame", "seals", "backCover"].includes(id) && pos.face !== "front",
  );
  const frameInstalled = components.frame.installed;
  return (
    <div className="phone-back-physical" style={{ "--explode": exploded }}>
      <div
        className={`internal-chassis ${components.frame.deformed ? "deformed" : ""} ${frameInstalled ? "" : "frame-removed"}`}
      >
        <span className="chassis-mark">ANTOИD 1 · SERVICE CHASSIS</span>
        {frameInstalled && (
          <button
            className={`physical-frame ${selected === "frame" ? "selected" : ""}`}
            onClick={() => dispatch({ type: "HARDWARE_SELECT", id: "frame" })}
            title={`${components.frame.name} · ${components.frame.material}`}
          />
        )}
        {visibleParts.map(([id, pos]) => {
          const component = components[id];
          if (!component) return null;
          return (
            <React.Fragment key={id}>
              {frameInstalled && (
                <div
                  className={`part-cavity cavity-${id}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.w}%`,
                    height: `${pos.h}%`,
                  }}
                />
              )}
              {component.installed && (
                <button
                  className={`physical-part part-${id} ${selected === id ? "selected" : ""} ${component.destroyed ? "destroyed" : ""} ${component.wet ? "wet" : ""} ${component.electricalFault ? "electrical-faulted" : ""}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.w}%`,
                    height: `${pos.h}%`,
                    "--lift": `${(component.layer * exploded) / 32}px`,
                    "--health": component.condition,
                  }}
                  onClick={() => dispatch({ type: "HARDWARE_SELECT", id })}
                  title={`${component.name} · ${component.condition.toFixed(0)}%`}
                >
                  <i />
                  <span>
                    {internalLabels[id] ||
                      component.name.replace(/Antoid |Genuine /g, "")}
                  </span>
                  {component.connected && <em>CONNECTED</em>}
                </button>
              )}
            </React.Fragment>
          );
        })}
        {components.seals.installed && (
          <button
            className={`physical-seal ${selected === "seals" ? "selected" : ""}`}
            onClick={() => dispatch({ type: "HARDWARE_SELECT", id: "seals" })}
            title="IP68 adhesive seals"
          />
        )}
        <div className="internal-water" style={{ height: `${water.ingress}%` }}>
          <i />
          <i />
          <i />
          <span>INTERNAL WATER {Math.round(water.ingress)}%</span>
        </div>
        {state.hardware.electricalEffect &&
          COMPONENT_LAYOUT[state.hardware.electricalEffect.id] && (
            <div
              key={state.hardware.electricalEffect.time}
              className={`water-electrical-effect ${state.hardware.electricalEffect.severity}`}
              style={{
                left: `${COMPONENT_LAYOUT[state.hardware.electricalEffect.id].x + COMPONENT_LAYOUT[state.hardware.electricalEffect.id].w / 2}%`,
                top: `${COMPONENT_LAYOUT[state.hardware.electricalEffect.id].y + COMPONENT_LAYOUT[state.hardware.electricalEffect.id].h / 2}%`,
              }}
            >
              <i>⚡</i>
              <span>{state.hardware.electricalEffect.label}</span>
            </div>
          )}
      </div>
      {cover.installed && (
        <button
          className={`physical-back-cover ${selected === "backCover" ? "selected" : ""} ${cover.cracked ? "cracked" : ""}`}
          style={{
            transform: `translateZ(${18 + exploded * 0.9}px) translateY(${-exploded * 0.22}px)`,
            opacity: Math.max(0.2, 1 - exploded / 115),
          }}
          onClick={() => dispatch({ type: "HARDWARE_SELECT", id: "backCover" })}
          title={`${cover.name} · select to inspect or remove`}
        >
          <span className="rear-camera-holes">
            <i />
            <i />
            <i />
            <b />
          </span>
          <strong>ANTOИD</strong>
          <small>{cover.material}</small>
          {cover.cracked > 0 && <em className="back-crack" />}
        </button>
      )}
      <div className="external-water" style={{ height: `${water.level}%` }}>
        <i />
        <i />
        <i />
        <span>WATER {Math.round(water.level)}%</span>
      </div>
    </div>
  );
}

function PhoneUnboxing() {
  const { state, dispatch } = useOS();
  const stage = state.hardware.unboxing.stage;
  const steps = [
    [
      "Factory sleeve",
      "Pull the paper seal to reveal the premium Antoid 1 box.",
      "Remove sleeve",
    ],
    [
      "Presentation box",
      "Lift the rigid lid. The serial-matched phone is nested below.",
      "Lift lid",
    ],
    [
      "Antoid 1",
      "Remove the protective film and lift the phone from its moulded tray.",
      "Lift phone",
    ],
    [
      "Accessory compartment",
      "Open the lower compartment containing the 45 W charger and USB-C cable.",
      "Unpack charger",
    ],
    [
      "Ready for first boot",
      "The complete Antoid 1 and charger are now on the hardware laboratory desk.",
      "Place on desk",
    ],
  ];
  const current = steps[Math.min(stage, steps.length - 1)];
  return (
    <div className={`phone-unboxing stage-${stage}`}>
      <div className="unbox-stage">
        <div className="premium-box">
          <i className="box-lid">ANTOИD</i>
          <div className="box-phone">
            <span>1</span>
          </div>
          <div className="box-accessories">45 W · USB-C</div>
        </div>
        <div className="unbox-copy">
          <small>FIRST-EVER DEVICE EXPERIENCE</small>
          <h1>{current[0]}</h1>
          <p>{current[1]}</p>
          <Button onClick={() => dispatch({ type: "PHONE_UNBOX" })}>
            {current[2]}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DeskScene() {
  const { state, set } = useOS();
  const caps = hardwareCapabilities(state);
  if (!state.hardware.unboxing.complete) return <PhoneUnboxing />;
  if (state.deskView === "laptop") return <LaptopScene />;
  return (
    <div
      className={`desk ${state.radio.flashlight && caps.flashlight ? `flashlight-on flashlight-${String(state.radio.flashlightMode || "Continuous").toLowerCase()}` : ""} frame-${String(state.hardware.components.frame.material).toLowerCase().replaceAll(" ", "-")} back-${String(state.hardware.components.backCover.material).toLowerCase().replaceAll(" ", "-")}`}
      style={{
        "--flashlight-power": `${
          Math.min(
            Number(state.radio.flashlightBrightness) || 80,
            state.battery.extremeSaver ? 18 : state.battery.saver ? 45 : 100,
          ) / 100
        }`,
      }}
    >
      <div className="desk-glow one" />
      <div className="desk-glow two" />
      <div className="desk-title">
        <div className="antoid-mark small">
          <i />
          <i />
          <i />
        </div>
        <div>
          <b>Antoid 1</b>
          <span>Interactive device laboratory</span>
        </div>
      </div>
      <button
        className="return-to-lab"
        onClick={() => set("lab.activeDevice", "welcome")}
      >
        ← Antoid Lab
      </button>
      <button
        className="open-laptop"
        onClick={() => set("deskView", "laptop")}
        aria-label="Open Antoid notebook"
      >
        <i>▰</i>
        <span>
          <b>Antoid Notebook</b>
          <small>Open hardware workspace</small>
        </span>
      </button>
      <div className="sim-rack">
        <CarrierCard id="yettel" />
        <CarrierCard id="telekom" />
        <CarrierCard id="one" />
      </div>
      <EsimCard />
      <ControllerLab />
      <Charger />
      <WiredHeadphones />
      <div className="phone-shadow" />
      <section
        key={state.hardware.drop.impactId || "phone"}
        className={`phone ${caps.digitizer && caps.powerAvailable && state.power.mode === "on" ? "main-touch-ready" : "main-touch-blocked"} ${state.screen.rotation ? "landscape" : ""} ${state.hardware.view === "back" ? "back-active" : "front-active"} ${state.hardware.drop.impactId ? "drop-impact" : ""} ${state.hardware.components.frame.deformed ? "frame-deformed" : ""} ${state.hardware.components.frame.installed ? "" : "frame-missing"}`}
        aria-label="Antoid 1 smartphone"
      >
        <Hardware />
        <PhysicalTray />
        {state.hardware.view === "front" ? (
          <div className="phone-face phone-front-face">
            {state.hardware.components.frame.installed ? (
              <div className="metal-rim">
                {state.hardware.components.display.installed ? (
                  <div className="glass physical-display-assembly">
                    <div
                      className={`camera-island ${caps.cameras.front ? "" : "camera-missing"}`}
                    >
                      {caps.cameras.front && <i />}
                      <span />
                    </div>
                    <PhoneScreen />
                    <div className="glass-shine" />
                  </div>
                ) : (
                  <div className="front-display-cavity">
                    <i />
                    <b>DISPLAY ASSEMBLY REMOVED</b>
                    <span>Display flex contacts exposed</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="stripped-front-stack">
                {state.hardware.components.display.installed ? (
                  <div className="loose-display-assembly">
                    <PhoneScreen />
                  </div>
                ) : (
                  <div className="front-display-cavity">
                    <b>FRAME & DISPLAY REMOVED</b>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="phone-face phone-back-face">
            <PhoneBack />
          </div>
        )}
      </section>
      {state.hardware.motion && (
        <div
          key={state.hardware.motion.time}
          className={`hardware-part-flight ${state.hardware.motion.kind} flight-${state.hardware.motion.id}`}
          aria-hidden="true"
        >
          <b>{state.hardware.motion.part?.name}</b>
          <span>
            {state.hardware.motion.kind === "remove"
              ? "Removed to inventory"
              : "Installed in chassis"}
          </span>
        </div>
      )}
    </div>
  );
}
