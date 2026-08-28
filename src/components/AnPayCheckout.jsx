import React, { useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { Button } from "./UI.jsx";
import { connectivity } from "../services/core.js";

export function AnPayCheckout({ amount, item, onApproved, compact = false }) {
  const { state, dispatch } = useOS();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(state.wallet.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const approve = () => {
    if (!connectivity(state).isOnline) {
      setError("Purchase failed: no simulated internet connection.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 4) {
      setError("Enter a valid email and a password of at least 4 characters.");
      return;
    }
    if (state.wallet.balanceHuf < amount) {
      setError("Your AnPay balance is too low for this purchase.");
      return;
    }
    dispatch({ type: "ANPAY_LOGIN", email });
    onApproved();
    setOpen(false);
    setPassword("");
  };
  return (
    <>
      <Button tone="primary" onClick={() => setOpen(true)}>
        {compact ? "AnPay" : `Buy with AnPay · ${amount.toLocaleString()} HUF`}
      </Button>
      {open && (
        <div className="anpay-sheet">
          <button
            className="anpay-scrim"
            aria-label="Close AnPay"
            onClick={() => setOpen(false)}
          />
          <section>
            <header>
              <i>A</i>
              <div>
                <b>AnPay</b>
                <span>Secure Antoid checkout</span>
              </div>
            </header>
            <h2>{amount.toLocaleString()} HUF</h2>
            <p>{item}</p>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="AnPay password"
              />
            </label>
            {error && <strong>{error}</strong>}
            <small>
              Balance after purchase:{" "}
              {(state.wallet.balanceHuf - amount).toLocaleString()} HUF
            </small>
            <div>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button tone="primary" onClick={approve}>
                Pay {amount.toLocaleString()} HUF
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
