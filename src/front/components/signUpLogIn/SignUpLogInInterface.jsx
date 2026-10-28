import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx"
import { apiFetch, saveSession } from "../../api.js"
import "../../../styles/login.css"


export default function InputForm() {
  const { store, dispatch } = useGlobalReducer();
  const [mode, setMode] = useState("login");

  const [formInput, setFormInput] = useState({
    email: "",
    password: "",
    new_password: "",
    current_password: ""
  });
  const navigate = useNavigate();
  const handleInput = (e) => {
    setFormInput({ ...formInput, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = mode == "login" ? "api/log_in" : "api/sign_up";
    const response = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(formInput),
    });
    console.log(response);
    const data = await response.json();
    console.log(data);

    if (response.ok) {
      if (mode === "login") {
        saveSession(data.token);
        dispatch({ type: "log_in", payload: { token: data.token } });
        navigate("/characterselection");
      }
      setMode("login");
    } else {
      alert(data.error || "Error");
    }
  };

  return (
    <div className="form-container">
      <h2 className="login-label">
        {mode === "login"
          ? "LOG IN"
          : mode === "signup"
            ? "SIGN UP"
            : "CHANGE PASSWORD"}
      </h2>

      <form onSubmit={handleSubmit}>
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="form-row">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                onChange={handleInput}
                value={formInput.email}
                required
              />
            </div>

            <div className="form-row">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                onChange={handleInput}
                value={formInput.password}
                minLength={mode === "signup" ? 8 : undefined}
                required
              />
            </div>
          </>
        )}

        <button className="submit-button" type="submit">
          SUBMIT
        </button>
      </form>

      <div className="mode-switch">
        {mode !== "login" && (
          <button onClick={() => setMode("login")}>Log In</button>
        )}
        {mode !== "signup" && (
          <button onClick={() => setMode("signup")}>Sign Up</button>
        )}
      </div>
    </div>
  );
}