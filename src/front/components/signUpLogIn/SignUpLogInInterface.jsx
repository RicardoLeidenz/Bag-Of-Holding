import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx"
import { apiCall, saveSession } from "../../api.js"
import { InlineMessage } from "../InlineMessage.jsx"
import "../../../styles/login.css"


export default function InputForm() {
  const { dispatch } = useGlobalReducer();
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  // Result of the last attempt: { kind: "error" | "success", text }
  const [message, setMessage] = useState({ kind: "", text: "" });

  const [formInput, setFormInput] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const handleInput = (e) => {
    setFormInput({ ...formInput, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessage({ kind: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ kind: "", text: "" });

    const endpoint = mode == "login" ? "api/log_in" : "api/sign_up";
    const { ok, data } = await apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(formInput),
    });
    setSubmitting(false);

    if (!ok) {
      setMessage({ kind: "error", text: data.error });
      return;
    }
    if (mode === "login") {
      saveSession(data.token);
      dispatch({ type: "log_in", payload: { token: data.token } });
      navigate("/characterselection");
    } else {
      setMode("login");
      setFormInput({ ...formInput, password: "" });
      setMessage({ kind: "success", text: "Account created! Log in with your new password." });
    }
  };

  return (
    <div className="form-container">
      <h2 className="login-label">
        {mode === "login" ? "LOG IN" : "SIGN UP"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="login-email">Email:</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            onChange={handleInput}
            value={formInput.email}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="login-password">Password:</label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            onChange={handleInput}
            value={formInput.password}
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
        </div>
        {mode === "signup" ? <p className="password-hint">At least 8 characters</p> : ""}

        <InlineMessage kind={message.kind} text={message.text} />

        <button className="submit-button" type="submit" disabled={submitting}>
          {submitting ? "PLEASE WAIT..." : "SUBMIT"}
        </button>
      </form>

      <div className="mode-switch">
        {mode !== "login" && (
          <button onClick={() => switchMode("login")}>Log In</button>
        )}
        {mode !== "signup" && (
          <button onClick={() => switchMode("signup")}>Sign Up</button>
        )}
      </div>
    </div>
  );
}
