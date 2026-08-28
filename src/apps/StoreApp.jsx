import React, { useState } from "react";
import { STORE_APPS, useOS, useSystemBack } from "../state/OSContext.jsx";
import { sound } from "../services/audio.js";
import { Button, Header, Offline } from "../components/UI.jsx";
import { AnPayCheckout } from "../components/AnPayCheckout.jsx";

export function StoreApp() {
  const { state, dispatch, set, net } = useOS();
  const [detail, setDetail] = useState(null);
  useSystemBack(() => {
    setDetail(null);
    return true;
  }, !!detail);
  const start = (id) => {
    if (!net.isOnline) {
      dispatch({
        type: "TOAST",
        message: "Connect to the internet to download apps",
      });
      return;
    }
    dispatch({ type: "START_DOWNLOAD", id });
    sound("success");
  };
  const action = (id, status) =>
    dispatch({ type: "DOWNLOAD_ACTION", id, status });
  const uninstall = (id) =>
    dispatch({
      type: "MODAL",
      modal: {
        title: `Uninstall ${STORE_APPS.find((a) => a.id === id).name}?`,
        body: "The launcher icon will be removed. Choose whether local app data is kept.",
        actions: [
          { label: "Cancel" },
          {
            label: "Keep data",
            onClick: () =>
              set(
                "installed",
                state.installed.filter((x) => x !== id),
              ),
          },
          {
            label: "Delete data",
            onClick: () => {
              set(
                "installed",
                state.installed.filter((x) => x !== id),
              );
              set(`social.${id}`, {});
            },
          },
        ],
      },
    });
  const app = detail && STORE_APPS.find((a) => a.id === detail);
  return (
    <div className="store app-fill">
      {app ? (
        <>
          <Header
            title={app.name}
            subtitle={`${app.category} · ${app.version}`}
          />
          <div className="store-detail app-scroll">
            <div className="store-hero">
              <span style={{ background: app.color }}>{app.icon}</span>
              <div>
                <h2>{app.name}</h2>
                <p>{app.description}</p>
                <small>{app.size} MB · Local app · No external account</small>
              </div>
            </div>
            <div className="store-shots">
              {[0, 1, 2].map((i) => (
                <div style={{ "--shot": app.color }} key={i}>
                  <i />
                  <b>{["Home", "Explore", "Details"][i]}</b>
                  <span>Locally generated interface</span>
                </div>
              ))}
            </div>
            <h3>Permissions</h3>
            <p>
              {app.id === "youtube"
                ? "Media, notifications"
                : app.id === "facebook" || app.id === "instagram"
                  ? "Photos, contacts, notifications"
                  : app.id === "gmail"
                    ? "Contacts, files, notifications"
                    : app.id === "spotify"
                      ? "Audio, notifications"
                      : "Local storage"}
            </p>
            <h3>Storage usage</h3>
            <p>
              {state.installed.includes(app.id)
                ? `${app.size + 8} MB installed · ${app.size} MB app · 8 MB data`
                : `${app.size} MB download`}
            </p>
            <StoreControls
              app={app}
              start={start}
              action={action}
              uninstall={uninstall}
            />
          </div>
        </>
      ) : (
        <>
          <Header
            title="Antoid Store"
            subtitle={`${STORE_APPS.length} local apps · AnPay ${state.wallet.balanceHuf.toLocaleString()} HUF · ${net.onlineVia}`}
          />
          <div className="store-banner">
            <div className="antoid-mark small">
              <i />
              <i />
              <i />
            </div>
            <div>
              <b>Made for Antoid 1</b>
              <span>Private apps with real local features.</span>
            </div>
          </div>
          {!net.isOnline && (
            <div className="offline-strip">
              Downloads pause offline and resume when your connection returns.
            </div>
          )}
          <div className="store-list app-scroll">
            {STORE_APPS.map((a) => (
              <article key={a.id}>
                <button onClick={() => setDetail(a.id)}>
                  <span className="store-icon" style={{ background: a.color }}>
                    {a.icon}
                  </span>
                  <div>
                    <b>{a.name}</b>
                    <small>
                      {a.category} · {a.size} MB · v{a.version}
                    </small>
                    <p>{a.description}</p>
                  </div>
                </button>
                <StoreControls
                  app={a}
                  start={start}
                  action={action}
                  uninstall={uninstall}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function StoreControls({ app, start, action, uninstall }) {
  const { state, dispatch } = useOS();
  const d = state.downloads[app.id],
    installed = state.installed.includes(app.id);
  if (app.id === "streetlight")
    return state.streetlight.purchased ? (
      <div className="store-actions">
        <Button
          tone="primary"
          onClick={() => dispatch({ type: "OPEN_APP", id: "streetlight" })}
        >
          Open
        </Button>
        {!state.streetlight.dlcPurchased && (
          <AnPayCheckout compact amount={70} item="Street Light Simulator · Aftermarket Section" onApproved={() => dispatch({ type: "PURCHASE_STREETLIGHT", dlc: true })} />
        )}
        <span className="anpay-approved">AnPay purchase owned</span>
      </div>
    ) : (
      <AnPayCheckout amount={app.priceHuf} item="Street Light Simulator" onApproved={() => dispatch({ type: "PURCHASE_STREETLIGHT" })} />
    );
  if (installed)
    return (
      <div className="store-actions">
        <Button
          tone="primary"
          onClick={() => dispatch({ type: "OPEN_APP", id: app.id })}
        >
          Open
        </Button>
        <Button
          onClick={() => {
            action(app.id, "downloading");
            sound("success");
          }}
        >
          Update
        </Button>
        <Button onClick={() => uninstall(app.id)}>Uninstall</Button>
      </div>
    );
  if (!d || d.status === "canceled")
    return (
      <Button tone="primary" onClick={() => start(app.id)}>
        Install
      </Button>
    );
  return (
    <div className="download-control">
      <progress max="100" value={d.progress} />
      <span>
        {d.status === "waiting"
          ? "Waiting for network"
          : d.status === "paused"
            ? "Paused"
            : d.status === "installed"
              ? "Installing…"
              : `${d.progress.toFixed(1)}% · downloading`}
      </span>
      {d.status === "downloading" ? (
        <Button onClick={() => action(app.id, "paused")}>Pause</Button>
      ) : (
        <Button onClick={() => action(app.id, "downloading")}>Resume</Button>
      )}
      <Button onClick={() => action(app.id, "canceled")}>Cancel</Button>
    </div>
  );
}
