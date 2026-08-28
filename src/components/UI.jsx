import React, { useEffect, useRef } from "react";
import { useOS } from "../state/OSContext.jsx";
import { sound } from "../services/audio.js";

export function Icon({ app, onClick, badge }) {
  return (
    <button
      className="app-icon"
      onClick={onClick}
      aria-label={`Open ${app.name}`}
      title={app.name}
    >
      <span className="icon-glyph" style={{ "--icon": app.color }}>
        {app.icon}
      </span>
      <span>{app.name}</span>
      {badge > 0 && <b className="badge">{badge}</b>}
    </button>
  );
}
export function Button({ children, className = "", tone = "", ...props }) {
  return (
    <button className={`button ${tone} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  return (
    <label className={`setting-row ${disabled ? "disabled" : ""}`}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        aria-label={label}
        type="checkbox"
        disabled={disabled}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i className="switch" />
    </label>
  );
}
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = "",
}) {
  return (
    <label className="slider-row">
      <span>
        {label}
        <b>
          {Math.round(value)}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
export function Segmented({ value, onChange, items, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {items.map((x) => {
        const v = typeof x === "string" ? x : x.value;
        return (
          <button
            key={v}
            className={value === v ? "active" : ""}
            onClick={() => onChange(v)}
          >
            {typeof x === "string" ? x : x.label}
          </button>
        );
      })}
    </div>
  );
}
export function Header({ title, subtitle, action }) {
  const { goBack } = useOS();
  return (
    <header className="app-header">
      <button className="round-btn" onClick={goBack} aria-label="Back">
        ‹
      </button>
      <div>
        <h2>{title}</h2>
        {subtitle && <small>{subtitle}</small>}
      </div>
      {action || <span />}
    </header>
  );
}
export function Empty({ icon = "◇", title, body, action }) {
  return (
    <div className="empty">
      <b>{icon}</b>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function Tabs({ items, active, onChange }) {
  return (
    <nav className="tabs">
      {items.map((x) => (
        <button
          key={x}
          className={active === x ? "active" : ""}
          onClick={() => onChange(x)}
        >
          {x}
        </button>
      ))}
    </nav>
  );
}
export function Modal() {
  const { state, dispatch } = useOS();
  const ref = useRef();
  useEffect(() => {
    ref.current?.focus();
  }, [state.modal]);
  if (!state.modal) return null;
  const m = state.modal;
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) =>
        e.target === e.currentTarget && dispatch({ type: "MODAL", modal: null })
      }
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        tabIndex="-1"
        ref={ref}
      >
        <div className="modal-icon">{m.icon || "A"}</div>
        <h3>{m.title}</h3>
        {m.body && <p>{m.body}</p>}
        {m.content}
        <div className="modal-actions">
          {(m.actions || [{ label: "OK" }]).map((a, i) => (
            <Button
              key={a.label}
              tone={i === m.actions?.length - 1 ? "primary" : ""}
              onClick={() => {
                sound("tap");
                a.onClick?.();
                dispatch({ type: "MODAL", modal: null });
              }}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
export function Toast() {
  const { state, dispatch } = useOS();
  useEffect(() => {
    if (state.toast) {
      const id = setTimeout(() => dispatch({ type: "TOAST" }), 2600);
      return () => clearTimeout(id);
    }
  }, [state.toast]);
  return state.toast ? (
    <div className="toast" role="status">
      {state.toast.message}
    </div>
  ) : null;
}
export function SignalBars({ bars = 0 }) {
  const safeBars = Math.max(0, Math.min(4, Number(bars) || 0));
  return (
    <span className="signal" aria-label={`${safeBars} of 4 signal bars`}>
      {[1, 2, 3, 4].map((n) => (
        <i key={n} className={n <= safeBars ? "on" : ""} />
      ))}
    </span>
  );
}
export function Avatar({ name, color = "#58bfa5", small = false }) {
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{ "--avatar": color }}
    >
      {name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Offline({ onWifi, onMobile, onRetry }) {
  return (
    <div className="offline">
      <span>⌁</span>
      <h3>No internet connection</h3>
      <p>Connect Wi-Fi or restore a cellular data route.</p>
      <div>
        <Button onClick={onWifi}>Wi-Fi Settings</Button>
        <Button onClick={onMobile}>Mobile Network</Button>
        <Button tone="primary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
export function FormField({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
