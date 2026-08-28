import React, { useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { sound } from "../services/audio.js";
import {
  Button,
  Empty,
  FormField,
  Header,
  Segmented,
  Slider,
  Tabs,
  Toggle,
} from "../components/UI.jsx";

export function ClockApp() {
  const { state, set, dispatch } = useOS();
  const [tab, setTab] = useState("Clock"),
    [alarm, setAlarm] = useState("08:00"),
    [timer, setTimer] = useState(300);
  const sw = state.stopwatch;
  const startTimer = () => {
    set("timers", [
      ...state.timers,
      {
        id: String(Date.now()),
        label: "Timer",
        remaining: timer,
        running: true,
      },
    ]);
  };
  return (
    <div className="app-fill">
      <Header title="Clock" subtitle="Budapest · Central European Time" />
      <Tabs
        items={["Clock", "Alarm", "Stopwatch", "Timer"]}
        active={tab}
        onChange={setTab}
      />
      <div className="app-scroll clock-body">
        {tab === "Clock" && (
          <div className="world-clock">
            <time>
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </time>
            <h3>Budapest</h3>
            <p>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div>
              <span>
                <b>London</b>
                {new Date(Date.now() - 3600000).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                <b>Tokyo</b>
                {new Date(Date.now() + 7 * 3600000).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
              <span>
                <b>New York</b>
                {new Date(Date.now() - 6 * 3600000).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </div>
          </div>
        )}
        {tab === "Alarm" && (
          <>
            <div className="inline-form">
              <input
                type="time"
                value={alarm}
                onChange={(e) => setAlarm(e.target.value)}
              />
              <Button
                onClick={() =>
                  dispatch({
                    type: "ADD_ALARM",
                    alarm: {
                      id: String(Date.now()),
                      time: alarm,
                      label: "Alarm",
                      enabled: true,
                    },
                  })
                }
              >
                Add alarm
              </Button>
            </div>
            <div className="list-cards">
              {state.alarms.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    set(
                      "alarms",
                      state.alarms.map((x) =>
                        x.id === a.id ? { ...x, enabled: !x.enabled } : x,
                      ),
                    )
                  }
                >
                  <b>{a.time}</b>
                  <span>
                    {a.label} · {a.enabled ? "On" : "Off"}
                  </span>
                  <small>Snooze 10 minutes</small>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "Stopwatch" && (
          <div className="stopwatch">
            <time>
              {new Date(sw.elapsed * 1000).toISOString().slice(11, 22)}
            </time>
            <div>
              <Button
                onClick={() => set("stopwatch.laps", [...sw.laps, sw.elapsed])}
                disabled={!sw.running}
              >
                Lap
              </Button>
              <Button
                tone="primary"
                onClick={() =>
                  set("stopwatch", {
                    ...sw,
                    running: !sw.running,
                    started: Date.now(),
                  })
                }
              >
                {sw.running ? "Pause" : "Start"}
              </Button>
              <Button
                onClick={() =>
                  set("stopwatch", {
                    running: false,
                    started: 0,
                    elapsed: 0,
                    laps: [],
                  })
                }
              >
                Reset
              </Button>
            </div>
            {sw.laps.map((l, i) => (
              <p key={i}>
                Lap {i + 1}
                <b>{l.toFixed(2)}s</b>
              </p>
            ))}
          </div>
        )}
        {tab === "Timer" && (
          <>
            <div className="timer-set">
              <input
                type="number"
                min="1"
                value={timer}
                onChange={(e) => setTimer(+e.target.value)}
              />
              <span>seconds</span>
              <Button tone="primary" onClick={startTimer}>
                Start timer
              </Button>
            </div>
            {state.timers.map((t) => (
              <div className="timer-card" key={t.id}>
                <b>{Math.ceil(t.remaining)}s</b>
                <span>
                  {t.running
                    ? "Running"
                    : t.remaining === 0
                      ? "Complete"
                      : "Paused"}
                </span>
                <button
                  onClick={() =>
                    set(
                      "timers",
                      state.timers.map((x) =>
                        x.id === t.id ? { ...x, running: !x.running } : x,
                      ),
                    )
                  }
                >
                  {t.running ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() =>
                    set(
                      "timers",
                      state.timers.filter((x) => x.id !== t.id),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function calculate(expr) {
  try {
    const clean = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/%/g, "/100");
    if (!/^[0-9+\-*/().\s]+$/.test(clean)) throw 0;
    const value = Function(`"use strict";return (${clean})`)();
    if (!Number.isFinite(value)) throw 0;
    return String(Math.round(value * 1e10) / 1e10);
  } catch {
    return "Error";
  }
}
export function CalculatorApp() {
  const { state, set } = useOS();
  const [scientific, setScientific] = useState(false),
    d = state.calculator.display;
  const press = (k) => {
    if (k === "C") set("calculator.display", "0");
    else if (k === "⌫")
      set("calculator.display", d.length > 1 ? d.slice(0, -1) : "0");
    else if (k === "=") {
      const result = calculate(d);
      set(
        "calculator.history",
        [`${d} = ${result}`, ...state.calculator.history].slice(0, 20),
      );
      set("calculator.display", result);
    } else if (["sin", "cos", "sqrt"].includes(k)) {
      const n = parseFloat(d),
        r =
          k === "sin" ? Math.sin(n) : k === "cos" ? Math.cos(n) : Math.sqrt(n);
      set("calculator.display", Number.isFinite(r) ? String(r) : "Error");
    } else set("calculator.display", d === "0" || d === "Error" ? k : d + k);
  };
  const keys = [
    "C",
    "(",
    ")",
    "÷",
    "7",
    "8",
    "9",
    "×",
    "4",
    "5",
    "6",
    "−",
    "1",
    "2",
    "3",
    "+",
    "%",
    "0",
    ".",
    "=",
    "⌫",
  ];
  return (
    <div className="calculator">
      <Header
        title="Calculator"
        action={<button onClick={() => setScientific(!scientific)}>SCI</button>}
      />
      <div className="calc-display">
        <small>{state.calculator.history[0]}</small>
        <b>{d}</b>
      </div>
      {scientific && (
        <div className="sci-row">
          {["sin", "cos", "sqrt"].map((k) => (
            <button key={k} onClick={() => press(k)}>
              {k}
            </button>
          ))}
        </div>
      )}
      <div className="calc-keys">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k.replace("−", "-"))}>
            {k}
          </button>
        ))}
      </div>
      <details>
        <summary>History</summary>
        {state.calculator.history.map((h, i) => (
          <p key={i}>{h}</p>
        ))}
        <Button onClick={() => set("calculator.history", [])}>
          Clear history
        </Button>
      </details>
    </div>
  );
}

export function NotesApp() {
  const { state, set, dispatch } = useOS();
  const [q, setQ] = useState(""),
    [edit, setEdit] = useState(null);
  const notes = state.notes.filter((n) =>
    (n.title + n.body).toLowerCase().includes(q.toLowerCase()),
  );
  const start = (n) =>
    setEdit(
      n
        ? { ...n }
        : {
            id: String(Date.now()),
            title: "",
            body: "",
            color: "#f2c744",
            pinned: false,
            archived: false,
            trash: false,
            checklist: false,
            label: "Personal",
          },
    );
  const save = () => {
    if (!edit.title.trim() && !edit.body.trim()) {
      dispatch({ type: "TOAST", message: "Write something before saving" });
      return;
    }
    dispatch({ type: "SAVE_NOTE", note: edit });
    setEdit(null);
  };
  return (
    <div className="app-fill">
      <Header
        title="Notes"
        subtitle={`${state.notes.filter((n) => !n.trash).length} local notes`}
      />
      <input
        className="search-input"
        placeholder="Search notes"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="notes-grid app-scroll">
        {notes
          .filter((n) => !n.trash && !n.archived)
          .sort((a, b) => b.pinned - a.pinned)
          .map((n) => (
            <button
              key={n.id}
              style={{ "--note": n.color }}
              onClick={() => start(n)}
            >
              <b>
                {n.checklist ? "☑ " : ""}
                {n.title || "Untitled"} {n.pinned ? "•" : ""}
              </b>
              <p>{n.body}</p>
              <small>{n.label}</small>
            </button>
          ))}
      </div>
      <button className="fab" onClick={() => start()}>
        ＋
      </button>
      {edit && (
        <div className="note-editor">
          <header>
            <button onClick={() => setEdit(null)}>‹</button>
            <button onClick={() => setEdit({ ...edit, pinned: !edit.pinned })}>
              {edit.pinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={save}>Save</button>
          </header>
          <input
            placeholder="Title"
            value={edit.title}
            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
          />
          <textarea
            autoFocus
            placeholder="Start writing…"
            value={edit.body}
            onChange={(e) => setEdit({ ...edit, body: e.target.value })}
          />
          <footer>
            <Toggle
              label="Checklist"
              checked={edit.checklist}
              onChange={(v) => setEdit({ ...edit, checklist: v })}
            />
            <select
              value={edit.label}
              onChange={(e) => setEdit({ ...edit, label: e.target.value })}
            >
              <option>Personal</option>
              <option>Work</option>
              <option>Ideas</option>
            </select>
            <input
              type="color"
              value={edit.color}
              onChange={(e) => setEdit({ ...edit, color: e.target.value })}
            />
            <Button
              onClick={() => {
                set(
                  "notes",
                  state.notes.map((n) =>
                    n.id === edit.id ? { ...n, archived: true } : n,
                  ),
                );
                setEdit(null);
              }}
            >
              Archive
            </Button>
            <Button
              onClick={() => {
                set(
                  "notes",
                  state.notes.map((n) =>
                    n.id === edit.id ? { ...n, trash: true } : n,
                  ),
                );
                setEdit(null);
              }}
            >
              Trash
            </Button>
            <Button
              onClick={() =>
                dispatch({
                  type: "TOAST",
                  message: "Choose an image in Gallery and use Share",
                })
              }
            >
              Attach Gallery image
            </Button>
          </footer>
        </div>
      )}
    </div>
  );
}

const forecast = [
  ["Today", "Clear", 23],
  ["Mon", "Clouds", 21],
  ["Tue", "Rain", 18],
  ["Wed", "Clear", 22],
  ["Thu", "Wind", 20],
  ["Fri", "Clear", 24],
  ["Sat", "Clouds", 23],
];
export function WeatherApp() {
  const { state, set, dispatch, net } = useOS();
  const [loading, setLoading] = useState(false),
    [city, setCity] = useState("");
  const refresh = () => {
    if (!net.isOnline) {
      dispatch({ type: "TOAST", message: "Weather refresh needs internet" });
      return;
    }
    setLoading(true);
    setTimeout(
      () => {
        set("weather.temp", 20 + Math.floor(Math.random() * 6));
        set("weather.updated", Date.now());
        setLoading(false);
        sound("success");
      },
      Math.min(2500, net.latency + 300),
    );
  };
  const temp = (c) =>
    state.weather.unit === "C" ? c : Math.round((c * 9) / 5 + 32);
  return (
    <div className="weather-app app-scroll">
      <Header
        title="Weather"
        subtitle={`Updated ${new Date(state.weather.updated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
      />
      <div className="weather-hero">
        <span className="sun">☀</span>
        <b>{temp(state.weather.temp)}°</b>
        <h2>{state.weather.city}</h2>
        <p>
          {loading
            ? "Refreshing over " + net.onlineVia
            : state.weather.condition + " · Feels pleasant"}
        </p>
      </div>
      <div className="weather-details">
        <span>
          <b>42%</b>Humidity
        </span>
        <span>
          <b>11 km/h</b>Wind
        </span>
        <span>
          <b>05:48</b>Sunrise
        </span>
        <span>
          <b>19:42</b>Sunset
        </span>
      </div>
      <div className="hourly">
        {[0, 3, 6, 9, 12, 15, 18].map((h, i) => (
          <span key={h}>
            <small>{String(h).padStart(2, "0")}:00</small>
            <b>☀</b>
            {temp(18 + i)}°
          </span>
        ))}
      </div>
      <div className="forecast">
        {forecast.map(([d, c, t]) => (
          <span key={d}>
            <b>{d}</b>
            <i>{c === "Rain" ? "☂" : c === "Clouds" ? "☁" : "☀"}</i>
            <small>{c}</small>
            <strong>{temp(t)}°</strong>
          </span>
        ))}
      </div>
      <Segmented
        value={state.weather.unit}
        onChange={(v) => set("weather.unit", v)}
        items={["C", "F"]}
        label="Temperature unit"
      />
      <div className="inline-form">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Add city"
        />
        <Button
          onClick={() => {
            if (city) {
              set("weather.cities", [
                ...new Set([...state.weather.cities, city]),
              ]);
              set("weather.city", city);
              setCity("");
            }
          }}
        >
          Add
        </Button>
      </div>
      <div className="city-chips">
        {state.weather.cities.map((c) => (
          <button onClick={() => set("weather.city", c)} key={c}>
            {c}
          </button>
        ))}
      </div>
      <Button tone="primary" onClick={refresh}>
        Refresh forecast
      </Button>
    </div>
  );
}

export function CalendarApp() {
  const { state, set, dispatch } = useOS();
  const [view, setView] = useState("Month"),
    [adding, setAdding] = useState(false),
    [form, setForm] = useState({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      time: "12:00",
      reminder: true,
      repeat: "none",
    });
  const today = new Date(),
    days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const save = () => {
    if (!form.title.trim()) {
      dispatch({ type: "TOAST", message: "Event title is required" });
      return;
    }
    dispatch({ type: "ADD_EVENT", event: { ...form, id: String(Date.now()) } });
    setAdding(false);
  };
  return (
    <div className="app-fill">
      <Header
        title="Calendar"
        subtitle={today.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      />
      <Segmented
        value={view}
        onChange={setView}
        items={["Month", "Week", "Day", "Agenda"]}
        label="Calendar view"
      />
      <div className="calendar-body app-scroll">
        {view === "Month" && (
          <div className="month-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <b key={i}>{d}</b>
            ))}
            {Array.from({ length: days }, (_, i) => {
              const n = i + 1,
                has = state.events.some(
                  (e) => new Date(e.date).getDate() === n,
                );
              return (
                <button
                  className={n === today.getDate() ? "today" : ""}
                  key={n}
                  aria-label={`Create event on ${today.toLocaleDateString("en-US", { month: "long" })} ${n}`}
                  onClick={() => {
                    const localDate = `${today.getFullYear()}-${String(
                      today.getMonth() + 1,
                    ).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
                    setForm((current) => ({
                      ...current,
                      date: localDate,
                    }));
                    setAdding(true);
                  }}
                >
                  {n}
                  {has && <i />}
                </button>
              );
            })}
          </div>
        )}
        <h3>{view} agenda</h3>
        {state.events.map((e) => (
          <article className="event-card" key={e.id}>
            <i />
            <div>
              <b>{e.title}</b>
              <span>
                {e.date} · {e.time} · {e.repeat}
              </span>
              <small>{e.reminder ? "Reminder on" : "No reminder"}</small>
            </div>
            <button
              onClick={() =>
                set(
                  "events",
                  state.events.filter((x) => x.id !== e.id),
                )
              }
            >
              ×
            </button>
          </article>
        ))}
      </div>
      <button className="fab" onClick={() => setAdding(true)}>
        ＋
      </button>
      {adding && (
        <div className="sheet">
          <h3>New event</h3>
          <FormField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <FormField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <FormField
            label="Time"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <label className="select-row">
            Repeat
            <select
              value={form.repeat}
              onChange={(e) => setForm({ ...form, repeat: e.target.value })}
            >
              <option value="none">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <Toggle
            label="Reminder"
            checked={form.reminder}
            onChange={(v) => setForm({ ...form, reminder: v })}
          />
          <Button tone="primary" onClick={save}>
            Save event
          </Button>
          <Button onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

export function FilesApp() {
  const { state, set, dispatch } = useOS();
  const [category, setCategory] = useState("All"),
    [q, setQ] = useState("");
  const generated = [
    ...state.files,
    ...state.photos
      .filter((p) => !p.trash)
      .map((p) => ({
        id: p.id,
        name: `${p.title}.jpg`,
        type: "Images",
        size: "20 KB",
        trash: false,
      })),
  ];
  const list = generated.filter(
    (f) =>
      (category === "All"
        ? !f.trash
        : category === "Trash"
          ? f.trash
          : !f.trash && f.type === category) &&
      f.name.toLowerCase().includes(q.toLowerCase()),
  );
  const rename = (f) =>
    dispatch({
      type: "MODAL",
      modal: {
        title: "Rename file",
        content: (
          <input
            autoFocus
            defaultValue={f.name}
            onChange={(e) => (f._new = e.target.value)}
          />
        ),
        actions: [
          { label: "Cancel" },
          {
            label: "Rename",
            onClick: () =>
              set(
                "files",
                state.files.map((x) =>
                  x.id === f.id ? { ...x, name: f._new || f.name } : x,
                ),
              ),
          },
        ],
      },
    });
  return (
    <div className="app-fill">
      <Header title="Files" subtitle={`${state.hardware.components.storage.actualCapacityGb ?? state.hardware.components.storage.capacityGb} GB local storage`} />
      <input
        className="search-input"
        placeholder="Search files"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="file-categories">
        {["All", "Images", "Audio", "Document", "Downloads", "Trash"].map(
          (c) => (
            <button
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
              key={c}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <div className="file-list app-scroll">
        {list.map((f) => (
          <article key={f.id}>
            <span>
              {f.type === "Images" ? "▧" : f.type === "Audio" ? "♫" : "▤"}
            </span>
            <button
              onClick={() =>
                dispatch({ type: "TOAST", message: `Opened ${f.name}` })
              }
            >
              <b>{f.name}</b>
              <small>
                {f.type} · {f.size}
              </small>
            </button>
            <button onClick={() => rename(f)}>✎</button>
            <button
              onClick={() =>
                set(
                  "files",
                  state.files.map((x) =>
                    x.id === f.id ? { ...x, trash: !x.trash } : x,
                  ),
                )
              }
            >
              {f.trash ? "↥" : "×"}
            </button>
          </article>
        ))}
      </div>
      <div className="storage-meter compact">
        <b>{(4.8 + state.photos.length * 0.02).toFixed(1)} GB used</b>
        <i>
          <em style={{ width: "12%" }} />
        </i>
      </div>
    </div>
  );
}
