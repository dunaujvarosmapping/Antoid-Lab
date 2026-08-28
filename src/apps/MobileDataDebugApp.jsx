import React, { useEffect, useState } from "react";
import { CARRIERS, useOS } from "../state/OSContext.jsx";
import { connectivity, lineQuality, voiceBearer } from "../services/core.js";
import { Header, Tabs } from "../components/UI.jsx";

const views = ["Overview", "SIMs", "Radio", "IMS", "Handover", "Session"];
const Row = ({ name, value }) => (
  <>
    <dt>{name}</dt>
    <dd>{String(value)}</dd>
  </>
);

export function MobileDataDebugApp() {
  const { state } = useOS();
  const [tab, setTab] = useState("Overview");
  const [samples, setSamples] = useState([]);
  const net = connectivity(state);
  const qualities = {
    physical: lineQuality(state, "physical"),
    esim: lineQuality(state, "esim"),
  };
  useEffect(() => {
    const sample = () =>
      setSamples((old) => [
        ...old.slice(-39),
        {
          t: Date.now(),
          dbm: qualities[net.activeDataSIM]?.dbm || -160,
          latency: net.latency || 0,
          speed: net.bandwidth || 0,
        },
      ]);
    sample();
    const id = setInterval(sample, 1000);
    return () => clearInterval(id);
  }, [
    net.activeDataSIM,
    net.networkType,
    net.latency,
    net.bandwidth,
    state.networkLab.weather.mode,
    state.networkLab.handover.position,
  ]);
  const points = samples
    .map(
      (s, i) =>
        `${(i / Math.max(1, samples.length - 1)) * 300},${90 - Math.max(0, Math.min(80, s.dbm + 140))}`,
    )
    .join(" ");
  const q = qualities[net.activeDataSIM];
  return (
    <div className="app-fill debug-app">
      <Header
        title="Mobile Data Debug"
        subtitle="Live modem diagnostics · Antoid OS 2.0"
      />
      <Tabs items={views} active={tab} onChange={setTab} />
      <div className="app-scroll debug-body">
        <div className={`debug-link ${net.isOnline ? "online" : ""}`}>
          <b>{net.isOnline ? "SESSION ACTIVE" : "NO DATA SESSION"}</b>
          <span>
            {net.onlineVia} · {net.networkType} · {net.signalBars}/4
          </span>
        </div>
        {tab === "Overview" && (
          <>
            <h3>Live radio trace</h3>
            <svg
              className="debug-chart"
              viewBox="0 0 300 100"
              role="img"
              aria-label="Live signal graph"
            >
              <path d="M0 90H300M0 60H300M0 30H300" />
              <polyline points={points} />
            </svg>
            <dl className="debug-grid">
              <Row
                name="Serving cell"
                value={`${q.tower?.id || "—"} · ${q.tower?.name || "None"}`}
              />
              <Row name="RSRP" value={`${q.rsrp} dBm`} />
              <Row name="RSRQ" value={`${q.rsrq} dB`} />
              <Row name="SINR" value={`${q.sinr} dB`} />
              <Row name="Download" value={`${net.bandwidth.toFixed(1)} Mbps`} />
              <Row name="Latency" value={`${net.latency} ms`} />
              <Row name="Packet loss" value={`${net.packetLoss.toFixed(1)}%`} />
              <Row name="Reliability" value={`${net.reliability}%`} />
            </dl>
          </>
        )}
        {tab === "SIMs" &&
          ["physical", "esim"].map((slot) => {
            const line = state.sim[slot],
              x = qualities[slot];
            return (
              <section className="debug-card" key={slot}>
                <h3>
                  {line.label} ·{" "}
                  {line.installed
                    ? CARRIERS[line.carrier].name
                    : "Not installed"}
                </h3>
                <dl className="debug-grid">
                  <Row name="Enabled" value={line.enabled} />
                  <Row name="Registered" value={x.registered} />
                  <Row name="Network mode" value={line.networkMode} />
                  <Row name="Requested RAT" value={line.radioSelection} />
                  <Row
                    name="Data remaining"
                    value={
                      Number.isFinite(x.plan.remainingMB)
                        ? `${x.plan.remainingMB.toFixed(1)} MB`
                        : "Unlimited"
                    }
                  />
                  <Row
                    name="Voice remaining"
                    value={
                      Number.isFinite(x.plan.remainingMinutes)
                        ? `${x.plan.remainingMinutes.toFixed(1)} min`
                        : "Unlimited"
                    }
                  />
                </dl>
              </section>
            );
          })}
        {tab === "Radio" && (
          <>
            <h3>Cell candidates</h3>
            {q.candidates.map((cell) => (
              <section
                className={`debug-card ${cell.id === q.tower.id ? "active" : ""}`}
                key={cell.id}
              >
                <b>
                  {cell.id} · {cell.name}
                </b>
                <span>
                  {cell.rat || "Mode excluded"} · {cell.dbm} dBm · {cell.bars}/4
                  · {cell.condition}
                </span>
              </section>
            ))}
          </>
        )}
        {tab === "IMS" &&
          ["physical", "esim"].map((slot) => {
            const route = voiceBearer(state, slot);
            return (
              <section className="debug-card" key={slot}>
                <h3>{state.sim[slot].label}</h3>
                <dl className="debug-grid">
                  <Row
                    name="IMS registered"
                    value={
                      route.ok &&
                      ["VoNR", "VoLTE", "VoWiFi"].includes(route.shortLabel)
                    }
                  />
                  <Row name="Bearer" value={route.label} />
                  <Row name="VoNR" value={state.sim[slot].voice.vonr} />
                  <Row name="VoLTE" value={state.sim[slot].voice.volte} />
                  <Row
                    name="VoWiFi"
                    value={state.sim[slot].voice.wifiCalling}
                  />
                  <Row
                    name="CS fallback"
                    value={
                      state.sim[slot].voice.fallback3g ||
                      state.sim[slot].voice.fallback2g
                    }
                  />
                </dl>
              </section>
            );
          })}
        {tab === "Handover" && (
          <>
            <dl className="debug-grid">
              <Row
                name="Policy"
                value={state.networkLab.handover.auto ? "Automatic" : "Manual"}
              />
              <Row
                name="Position"
                value={`${state.networkLab.handover.position}%`}
              />
              <Row name="Serving" value={`${q.tower.id} · ${q.tower.name}`} />
              <Row
                name="Transition"
                value={q.handover ? "In progress" : "Stable"}
              />
            </dl>
            <h3>Recent network timeline</h3>
            {state.developer.timeline.slice(0, 12).map((event) => (
              <section className="debug-card" key={event.id}>
                <b>{event.type}</b>
                <span>
                  {event.message} ·{" "}
                  {new Date(event.time).toLocaleTimeString("en-US")}
                </span>
              </section>
            ))}
          </>
        )}
        {tab === "Session" && (
          <dl className="debug-grid">
            <Row name="Route" value={net.route} />
            <Row name="Data SIM" value={net.activeDataSIM} />
            <Row name="Carrier" value={net.carrierName || "Wi-Fi"} />
            <Row name="RAT" value={net.networkType} />
            <Row
              name="Down / up"
              value={`${net.bandwidth.toFixed(1)} / ${net.upload.toFixed(1)} Mbps`}
            />
            <Row
              name="Latency / jitter"
              value={`${net.latency} / ${net.jitter} ms`}
            />
            <Row name="Loss" value={`${net.packetLoss.toFixed(1)}%`} />
            <Row name="Condition" value={net.condition} />
          </dl>
        )}
      </div>
    </div>
  );
}
