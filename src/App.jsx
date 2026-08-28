import React, { useEffect } from "react";
import { useOS } from "./state/OSContext.jsx";
import { Modal, Toast } from "./components/UI.jsx";
import { DeskScene } from "./components/DeskScene.jsx";
import { AntoidUTVScene, LabWelcome } from "./components/AntoidLab.jsx";
import { SUPCerScene } from "./components/SUPCerScene.jsx";

class UTVErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("Antoid UTV recovered from a render failure", error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="utv-recovery">
        <section>
          <p className="eyebrow">ANTO ID UTV RECOVERY</p>
          <h1>The UTV interface hit a recoverable error.</h1>
          <p>Your saved Lab data has not been erased.</p>
          <div>
            <button onClick={() => this.setState({ error: null })}>
              Retry
            </button>
            <button onClick={this.props.onReturn}>Return to Antoid Lab</button>
          </div>
        </section>
      </main>
    );
  }
}

export default function App() {
  const { state, resolvedTheme, set } = useOS();
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", state.theme.accent);
    document.documentElement.dataset.theme = state.theme.mode;
    document.documentElement.dataset.resolvedTheme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.documentElement.dataset.contrast = state.accessibility.highContrast
      ? "high"
      : "normal";
    document.documentElement.dataset.motion = state.accessibility.reducedMotion
      ? "reduced"
      : "full";
    document.documentElement.dataset.text = state.accessibility.largeText
      ? "large"
      : "normal";
    document.documentElement.dataset.powerMode = state.battery.extremeSaver
      ? "extreme"
      : state.battery.saver
        ? "saver"
        : "normal";
    document.documentElement.dataset.thermal = String(
      state.battery.thermalState || "Normal",
    )
      .toLowerCase()
      .replaceAll(" ", "-");
  }, [
    state.theme,
    state.accessibility,
    state.battery.saver,
    state.battery.extremeSaver,
    state.battery.thermalState,
    resolvedTheme,
  ]);
  return (
    <div className="antoid-app">
      {state.lab.activeDevice === "welcome" && <LabWelcome />}
      {state.lab.activeDevice === "phone" && <DeskScene />}
      {state.lab.activeDevice === "utv" && (
        <UTVErrorBoundary onReturn={() => set("lab.activeDevice", "welcome")}>
          <AntoidUTVScene />
        </UTVErrorBoundary>
      )}
      {state.lab.activeDevice === "supcer" && <SUPCerScene />}
      <Modal />
      <Toast />
    </div>
  );
}
