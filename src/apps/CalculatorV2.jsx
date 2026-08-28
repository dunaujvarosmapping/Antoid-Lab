import React, { useRef, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { Button, Header, Segmented } from "../components/UI.jsx";

function evaluate(expression, degrees = false) {
  try {
    let clean = expression
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("−", "-")
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
      .replaceAll("π", `(${Math.PI})`)
      .replaceAll("^", "**");
    if (!/^[0-9+\-*/().,\s_a-zA-Z]+$/.test(clean)) throw new Error();
    const angle = degrees ? `(x)=>Math.sin(x*Math.PI/180)` : "Math.sin";
    const cos = degrees ? `(x)=>Math.cos(x*Math.PI/180)` : "Math.cos";
    const tan = degrees ? `(x)=>Math.tan(x*Math.PI/180)` : "Math.tan";
    clean = clean
      .replace(/\bsin\b/g, angle)
      .replace(/\bcos\b/g, cos)
      .replace(/\btan\b/g, tan)
      .replace(/\bsqrt\b/g, "Math.sqrt")
      .replace(/\blog\b/g, "Math.log10")
      .replace(/\bln\b/g, "Math.log")
      .replace(/\babs\b/g, "Math.abs");
    const value = Function(`"use strict";return (${clean})`)();
    if (!Number.isFinite(value)) throw new Error();
    return String(Math.round(value * 1e10) / 1e10);
  } catch {
    return "Error";
  }
}

const conversionSets = {
  Data: { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 },
  Length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    mi: 1609.344,
  },
  Mass: { mg: 0.000001, g: 0.001, kg: 1, oz: 0.0283495, lb: 0.453592 },
  Time: { sec: 1, min: 60, hour: 3600, day: 86400 },
  Speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704 },
};
function convert(category, value, from, to) {
  if (category === "Temperature") {
    const c =
      from === "C"
        ? value
        : from === "F"
          ? ((value - 32) * 5) / 9
          : value - 273.15;
    return to === "C" ? c : to === "F" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const set = conversionSets[category];
  return (value * set[from]) / set[to];
}

export function CalculatorV2() {
  const { state, set, dispatch } = useOS();
  const calc = state.calculator;
  const [mode, setMode] = useState(calc.mode || "Basic");
  const [degrees, setDegrees] = useState(true);
  const [undo, setUndo] = useState([]),
    [redo, setRedo] = useState([]),
    [recognized, setRecognized] = useState("");
  const drawing = useRef(false);
  const note =
    calc.mathNotes.find((n) => n.id === calc.activeMathNote) ||
    calc.mathNotes[0];
  const updateNote = (changes) =>
    set(
      "calculator.mathNotes",
      calc.mathNotes.map((n) =>
        n.id === note.id ? { ...n, ...changes, updated: Date.now() } : n,
      ),
    );
  const equals = () => {
    const result = evaluate(calc.display, degrees);
    set(
      "calculator.history",
      [`${calc.display} = ${result}`, ...calc.history].slice(0, 50),
    );
    set("calculator.display", result);
  };
  const press = (key) => {
    const d = calc.display;
    if (key === "C") set("calculator.display", "0");
    else if (key === "⌫")
      set("calculator.display", d.length > 1 ? d.slice(0, -1) : "0");
    else if (key === "=") equals();
    else set("calculator.display", d === "0" || d === "Error" ? key : d + key);
  };
  const changeMathText = (body) => {
    if (calc.autoCalculate) {
      body = body
        .split("\n")
        .map((line) => {
          const expression = line.split("=")[0].trim();
          if (!expression || !/[0-9]/.test(expression)) return line;
          const result = evaluate(expression, degrees);
          return result === "Error" ? line : `${expression} = ${result}`;
        })
        .join("\n");
    }
    updateNote({ body });
  };
  const units =
    mode === "Convert"
      ? calc.converter.category === "Temperature"
        ? ["C", "F", "K"]
        : Object.keys(conversionSets[calc.converter.category])
      : [];
  const recognize = () => {
    const strokes = note.strokes || [];
    if (!strokes.length) return setRecognized("No strokes selected");
    let guess = "";
    if (strokes.length === 1) {
      const s = strokes[0],
        first = s[0],
        last = s.at(-1);
      const closed = Math.hypot(first.x - last.x, first.y - last.y) < 12;
      guess = closed ? "0" : Math.abs(first.x - last.x) < 12 ? "1" : "−";
    } else if (strokes.length === 2) guess = "+";
    else guess = String(Math.min(9, strokes.length));
    setRecognized(guess);
  };
  const smooth = () => {
    const strokes = (note.strokes || []).map((s) =>
      s.map((p, i) =>
        i === 0 || i === s.length - 1
          ? p
          : {
              x: (s[i - 1].x + p.x + s[i + 1]?.x || p.x) / 3,
              y: (s[i - 1].y + p.y + s[i + 1]?.y || p.y) / 3,
            },
      ),
    );
    setUndo([...undo, note.strokes]);
    setRedo([]);
    updateNote({ strokes });
  };
  return (
    <div className="calculator calculator-v2 app-fill">
      <Header
        title="Calculator 2.0"
        subtitle="Exact precedence · local math notes"
      />
      <Segmented
        items={[
          "Basic",
          "Scientific",
          "Math Notes",
          "Convert",
          "History",
          "Memory",
        ]}
        value={mode}
        onChange={(v) => {
          setMode(v);
          set("calculator.mode", v);
        }}
        label="Calculator mode"
      />
      {(mode === "Basic" || mode === "Scientific") && (
        <>
          <div className="calc-display">
            <small>{calc.history[0]}</small>
            <b>{calc.display}</b>
          </div>
          {mode === "Scientific" && (
            <>
              <div className="calc-angle">
                <button
                  className={degrees ? "active" : ""}
                  onClick={() => setDegrees(true)}
                >
                  DEG
                </button>
                <button
                  className={!degrees ? "active" : ""}
                  onClick={() => setDegrees(false)}
                >
                  RAD
                </button>
              </div>
              <div className="sci-row">
                {[
                  "sin(",
                  "cos(",
                  "tan(",
                  "sqrt(",
                  "log(",
                  "ln(",
                  "abs(",
                  "π",
                  "^",
                ].map((x) => (
                  <button onClick={() => press(x)} key={x}>
                    {x}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="calc-keys">
            {[
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
            ].map((x) => (
              <button onClick={() => press(x)} key={x}>
                {x}
              </button>
            ))}
          </div>
        </>
      )}
      {mode === "Math Notes" && (
        <div className="math-notes app-scroll">
          <div className="math-note-toolbar">
            <ToggleSmall
              label="Auto-calculate"
              value={calc.autoCalculate}
              change={(v) => set("calculator.autoCalculate", v)}
            />
            <ToggleSmall
              label="Correction"
              value={calc.handwritingCorrection}
              change={(v) => set("calculator.handwritingCorrection", v)}
            />
          </div>
          <textarea
            value={note.body}
            onChange={(e) => changeMathText(e.target.value)}
            placeholder="Type one expression per line, for example 12/3"
          />
          <div
            className="math-canvas"
            onPointerDown={(e) => {
              drawing.current = true;
              setUndo([...undo, note.strokes]);
              setRedo([]);
              const r = e.currentTarget.getBoundingClientRect();
              updateNote({
                strokes: [
                  ...(note.strokes || []),
                  [
                    {
                      x: ((e.clientX - r.left) / r.width) * 100,
                      y: ((e.clientY - r.top) / r.height) * 100,
                    },
                  ],
                ],
              });
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const r = e.currentTarget.getBoundingClientRect(),
                strokes = [...(note.strokes || [])];
              strokes[strokes.length - 1] = [
                ...strokes.at(-1),
                {
                  x: ((e.clientX - r.left) / r.width) * 100,
                  y: ((e.clientY - r.top) / r.height) * 100,
                },
              ];
              updateNote({ strokes });
            }}
            onPointerUp={() => (drawing.current = false)}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {(note.strokes || []).map((s, i) => (
                <polyline
                  key={i}
                  points={s.map((p) => `${p.x},${p.y}`).join(" ")}
                />
              ))}
            </svg>
          </div>
          <div className="lab-actions">
            <Button
              onClick={() => {
                if (!undo.length) return;
                setRedo([note.strokes, ...redo]);
                updateNote({ strokes: undo.at(-1) });
                setUndo(undo.slice(0, -1));
              }}
            >
              Undo
            </Button>
            <Button
              onClick={() => {
                if (!redo.length) return;
                setUndo([...undo, note.strokes]);
                updateNote({ strokes: redo[0] });
                setRedo(redo.slice(1));
              }}
            >
              Redo
            </Button>
            <Button onClick={() => updateNote({ strokes: [] })}>
              Eraser: clear
            </Button>
            <Button onClick={smooth}>Correct strokes</Button>
            <Button onClick={recognize}>Recognize</Button>
          </div>
          {recognized && (
            <p className="recognition">
              Constrained recognition: <b>{recognized}</b>{" "}
              <button
                onClick={() => {
                  changeMathText(`${note.body}\n${recognized}`);
                  setRecognized("");
                }}
              >
                Insert
              </button>
            </p>
          )}
        </div>
      )}
      {mode === "Convert" && (
        <div className="converter">
          <label>
            Category
            <select
              value={calc.converter.category}
              onChange={(e) => {
                const category = e.target.value;
                const next =
                  category === "Temperature"
                    ? ["C", "F"]
                    : Object.keys(conversionSets[category]);
                set("calculator.converter", {
                  ...calc.converter,
                  category,
                  from: next[0],
                  to: next[1],
                });
              }}
            >
              {[...Object.keys(conversionSets), "Temperature"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <input
            type="number"
            value={calc.converter.value}
            onChange={(e) => set("calculator.converter.value", +e.target.value)}
          />
          <div>
            <select
              value={calc.converter.from}
              onChange={(e) => set("calculator.converter.from", e.target.value)}
            >
              {units.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <span>→</span>
            <select
              value={calc.converter.to}
              onChange={(e) => set("calculator.converter.to", e.target.value)}
            >
              {units.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <strong>
            {convert(
              calc.converter.category,
              calc.converter.value,
              calc.converter.from,
              calc.converter.to,
            ).toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
            {calc.converter.to}
          </strong>
        </div>
      )}
      {mode === "History" && (
        <div className="app-scroll calc-list">
          {calc.history.map((x, i) => (
            <button
              key={i}
              onClick={() => set("calculator.display", x.split(" = ").at(-1))}
            >
              {x}
            </button>
          ))}
          <Button onClick={() => set("calculator.history", [])}>
            Clear history
          </Button>
        </div>
      )}
      {mode === "Memory" && (
        <div className="memory-panel">
          <strong>{calc.memory}</strong>
          <div>
            <Button onClick={() => set("calculator.memory", 0)}>MC</Button>
            <Button
              onClick={() => set("calculator.display", String(calc.memory))}
            >
              MR
            </Button>
            <Button
              onClick={() =>
                set(
                  "calculator.memory",
                  calc.memory + (parseFloat(calc.display) || 0),
                )
              }
            >
              M+
            </Button>
            <Button
              onClick={() =>
                set(
                  "calculator.memory",
                  calc.memory - (parseFloat(calc.display) || 0),
                )
              }
            >
              M−
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
function ToggleSmall({ label, value, change }) {
  return (
    <label className="lab-check">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => change(e.target.checked)}
      />
      {label}
    </label>
  );
}
