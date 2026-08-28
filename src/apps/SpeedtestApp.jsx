import React, { useEffect, useRef, useState } from "react";
import { Header, SignalBars } from "../components/UI.jsx";
import { CARRIERS, useOS } from "../state/OSContext.jsx";
import { speedtestProfile } from "../services/core.js";

const stages = [
  ["Finding connection", 650],
  ["Ping", 850],
  ["Jitter", 800],
  ["Download", 2100],
  ["Upload", 1500],
  ["Packet loss", 800],
];
const totalDuration = stages.reduce((sum, [, duration]) => sum + duration, 0);

const metric = (value, digits = 1) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export function SpeedtestApp() {
  const { state, dispatch } = useOS();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState("Ready");
  const [progress, setProgress] = useState(0);
  const [live, setLive] = useState(() => speedtestProfile(state));
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    let finished = false;
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const profile = speedtestProfile(
        stateRef.current,
        Math.sin(elapsed / 170) * 0.82,
      );
      let cursor = 0;
      const current = stages.find(([, duration]) => {
        cursor += duration;
        return elapsed < cursor;
      });
      setLive(profile);
      setProgress(Math.min(100, (elapsed / totalDuration) * 100));
      setStage(current?.[0] || "Result");
      if (elapsed >= totalDuration && !finished) {
        finished = true;
        clearInterval(timer);
        const final = speedtestProfile(stateRef.current, 0);
        const saved = {
          id: `speed-${Date.now()}`,
          time: Date.now(),
          route: final.onlineVia,
          carrier: final.carrierName,
          network: final.networkType,
          bars: final.signalBars,
          ping: final.ping,
          jitter: final.jitter,
          packetLoss: final.packetLoss,
          download: final.download,
          upload: final.upload,
          condition: final.condition,
        };
        setLive(final);
        setResult(saved);
        setRunning(false);
        setStage(final.isOnline ? "Result" : "Offline");
        setProgress(100);
        dispatch({ type: "RECORD_SPEEDTEST", result: saved, dataMB: 35 });
      }
    }, 90);
    return () => clearInterval(timer);
  }, [running, dispatch]);

  const start = () => {
    setResult(null);
    setLive(speedtestProfile(state));
    setStage("Finding connection");
    setProgress(0);
    setRunning(true);
  };
  const gaugeValue = running
    ? stage === "Upload"
      ? live.upload
      : live.download
    : result?.download || live.download || 0;
  const gaugeAngle = Math.min(240, Math.log10(gaugeValue + 1) * 95);
  const activeLine =
    live.route === "cellular" ? state.sim[live.activeDataSIM] : null;

  return (
    <div className="speedtest-app app-fill">
      <Header title="Speedtest" subtitle="Local Antoid network diagnostics" />
      <div className="speedtest-body app-scroll">
        <section className="speed-route">
          <span className={live.isOnline ? "online" : "offline"}>●</span>
          <div>
            <b>{live.onlineVia}</b>
            <small>
              {live.route === "wifi"
                ? `${state.lab.router.ssid} · Wi-Fi priority route`
                : activeLine
                  ? `${CARRIERS[activeLine.carrier]?.name} · ${live.networkType}`
                  : "No eligible internet route"}
            </small>
          </div>
          {live.route === "cellular" && <SignalBars bars={live.signalBars} />}
        </section>

        <section
          className="speed-gauge"
          style={{ "--angle": `${gaugeAngle}deg` }}
        >
          <div className="gauge-ring">
            <i />
            <div>
              <strong>{metric(gaugeValue)}</strong>
              <span>Mbps</span>
            </div>
          </div>
          <b>{stage}</b>
          <progress value={progress} max="100" />
        </section>

        <div className="speed-metrics">
          <span>
            <small>Ping</small>
            <b>{metric(live.ping, 0)} ms</b>
          </span>
          <span>
            <small>Jitter</small>
            <b>{metric(live.jitter, 0)} ms</b>
          </span>
          <span>
            <small>Loss</small>
            <b>{metric(live.packetLoss)}%</b>
          </span>
          <span>
            <small>Download</small>
            <b>{metric(live.download)} Mbps</b>
          </span>
          <span>
            <small>Upload</small>
            <b>{metric(live.upload)} Mbps</b>
          </span>
          <span>
            <small>Quality</small>
            <b>{live.quality}</b>
          </span>
        </div>

        <button className="speed-start" onClick={start} disabled={running}>
          {running ? stage : result ? "Test again" : "Start test"}
        </button>

        <section className="speed-context">
          <h3>Simulation context</h3>
          <span>
            Route <b>{live.onlineVia}</b>
          </span>
          <span>
            Radio <b>{live.networkType}</b>
          </span>
          <span>
            Signal <b>{live.signalBars}/4</b>
          </span>
          <span>
            Load <b>{live.congestion || 0}%</b>
          </span>
          <span>
            Operations <b>{live.condition || "Normal"}</b>
          </span>
          <span>
            Tower{" "}
            <b>
              {live.tower ? `Tower ${live.tower.id}` : "Wi-Fi access point"}
            </b>
          </span>
        </section>

        {!!state.speedtest.history.length && (
          <section className="speed-history">
            <h3>History</h3>
            {state.speedtest.history.map((item) => (
              <article key={item.id}>
                <div>
                  <b>{item.route}</b>
                  <small>{new Date(item.time).toLocaleString("en-US")}</small>
                </div>
                <span>↓ {metric(item.download)}</span>
                <span>↑ {metric(item.upload)}</span>
                <span>{item.ping || 0} ms</span>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
