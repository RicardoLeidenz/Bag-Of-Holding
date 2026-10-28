// Helpers for the end-to-end tests: launch headless Chrome, drive it over the
// Chrome DevTools Protocol, and call the API directly to set up test data.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Defaults to the separate test servers (npm run e2e:app + pipenv run e2e-api), so your dev servers keep running
export const APP = (process.env.APP || "http://localhost:3100").replace(/\/+$/, "");
// The API is reached through the app's own address (Vite proxy in development, Flask in production)
export const API = APP + "/api/";
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9222);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ];
    const found = candidates.find(path => path && existsSync(path));
    if (!found) throw new Error("Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.");
    return found;
}

// Starts headless Chrome with a throwaway profile (never touches your own Chrome profile)
export async function launchChrome() {
    const profile = await mkdtemp(join(tmpdir(), "boh-e2e-"));
    const chrome = spawn(findChrome(), [
        "--headless=new", `--user-data-dir=${profile}`, `--remote-debugging-port=${DEBUG_PORT}`,
        "--no-first-run", "--no-default-browser-check", "--no-sandbox", "about:blank",
    ], { stdio: "ignore" });
    for (let i = 0; i < 50; i++) {
        try { await fetch(`http://localhost:${DEBUG_PORT}/json/version`); break; } catch { await sleep(200); }
    }
    return async () => { chrome.kill(); await sleep(300); await rm(profile, { recursive: true, force: true }); };
}

// Connects to the open Chrome tab and returns helpers used by the test suites
export async function connect() {
    const list = await (await fetch(`http://localhost:${DEBUG_PORT}/json/list`)).json();
    const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener("open", r, { once: true }));
    let nextId = 1; const pending = new Map(); const requests = [];
    ws.addEventListener("message", e => {
        const m = JSON.parse(e.data);
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        // Record API requests ("PUT /api/stat") so tests can count them
        if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("/api/"))
            requests.push(m.params.request.method + " " + new URL(m.params.request.url).pathname);
    });
    const send = (method, params = {}) => new Promise(r => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const waitFor = async (expr, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await evaluate(expr)) return true; await sleep(150); } return false; };
    const goto = async (path) => { await send("Page.navigate", { url: APP + path }); await sleep(700); };

    await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
    // Capture alert() messages instead of blocking the page
    await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__alerts = []; window.alert = m => window.__alerts.push(String(m));" });

    // Type like a user: focus, select existing text, insert characters one at a time
    const type = async (selector, text) => {
        await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.select?.(); return true; })()`);
        for (const ch of text) { await send("Input.insertText", { text: ch }); await sleep(60); }
    };
    // Set a React-controlled input's whole value at once
    const fill = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
    const blur = () => evaluate("document.activeElement?.blur(), true");
    const clickText = (selector, label) => evaluate(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(b => b.innerText.trim() === ${JSON.stringify(label)}); if (el) el.click(); return !!el; })()`);
    const path = () => evaluate("location.pathname");
    const text = () => evaluate("document.body.innerText");

    let failures = 0, passes = 0;
    const check = (name, ok, detail = "") => {
        console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
        ok ? passes++ : failures++;
    };
    const results = () => ({ passes, failures });
    const close = () => ws.close();
    return { send, evaluate, sleep, waitFor, goto, type, fill, blur, clickText, path, text, check, results, close, requests };
}

// Direct API calls, used to create test data quickly
export async function api(method, path, body, token) {
    const r = await fetch(API + path, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json().catch(() => null) };
}

export async function createCharacter(token, name) {
    const { status, data } = await api("POST", "character", { name, race: "Elf", characterClass: "Wizard", subClass: "Evocation" }, token);
    if (status !== 201) throw new Error(`Could not create character: ${status} ${JSON.stringify(data)}`);
    return data.character;
}
