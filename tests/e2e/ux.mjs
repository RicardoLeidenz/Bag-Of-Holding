// User feedback: inline messages, toasts, empty/loading states, offline behaviour, keyboard focus
import { api, createCharacter } from "./lib.mjs";

export async function run(b, { token }) {
    const { check, goto, waitFor, evaluate, fill, type, blur, clickText, send, sleep, requests } = b;
    const inlineError = () => evaluate(`document.querySelector(".inline-message.error")?.innerText`);
    const toast = () => evaluate(`document.querySelector(".app-toast")?.innerText.replace("✕", "").trim()`);

    // Sign up: success message, then duplicate email error
    // Log out by clearing the saved token, then reload so the app starts logged out
    await goto("/"); await evaluate("localStorage.clear(); true");
    await goto("/");
    await waitFor(`!!document.querySelector('input[name="email"]')`);
    await clickText("button", "Sign Up");
    const email = `ux-${Date.now()}@test.com`;
    await fill('input[name="email"]', email); await fill('input[name="password"]', "password123");
    await clickText("button", "SUBMIT");
    check("sign up: success message", await waitFor(`document.querySelector(".inline-message.success")?.innerText.startsWith("Account created!")`), await evaluate(`document.querySelector(".inline-message")?.innerText`));
    check("sign up: switches to log in", (await evaluate(`document.querySelector(".login-label").innerText`)) === "LOG IN");
    await clickText("button", "Sign Up");
    await fill('input[name="email"]', email); await fill('input[name="password"]', "password123");
    await clickText("button", "SUBMIT");
    check("sign up: duplicate email error", await waitFor(`document.querySelector(".inline-message.error")?.innerText === "An account with this email already exists"`), await inlineError());

    // A brand-new user sees an empty-state message
    await clickText("button", "Log In");
    await fill('input[name="email"]', email); await fill('input[name="password"]', "password123");
    await clickText("button", "SUBMIT");
    await waitFor(`location.pathname === "/characterselection"`);
    check("character list: empty state", await waitFor(`document.body.innerText.includes("No characters yet")`), (await evaluate("document.body.innerText")).slice(0, 200));
    const newToken = await evaluate("localStorage.getItem('token')");

    // Creator: double-clicking SUBMIT creates only one character
    await goto("/charactercreator");
    await waitFor(`!!document.querySelector("#name")`);
    await type("#name", "Twice");
    await clickText("button", "RACE");
    await waitFor(`[...document.querySelectorAll("button.input-selection")].some(x => x.innerText.trim() === "Elf")`);
    await clickText("button.input-selection", "Elf");
    await clickText("button", "CLASS");
    await waitFor(`[...document.querySelectorAll("button.input-selection")].some(x => x.innerText.trim() === "Wizard")`);
    await clickText("button.input-selection", "Wizard");
    await clickText("button", "SUBCLASS");
    await waitFor(`[...document.querySelectorAll("button.input-selection")].some(x => x.innerText.trim() === "Evocation")`);
    await clickText("button.input-selection", "Evocation");
    requests.length = 0;
    await evaluate(`(() => { const b = [...document.querySelectorAll("button")].find(x => x.innerText.trim() === "SUBMIT"); b.click(); b.click(); return true; })()`);
    await waitFor(`/^\\/character\\/\\d+$/.test(location.pathname)`);
    check("creator: double click sends one request", requests.filter(r => r === "POST /api/character").length === 1, JSON.stringify(requests));
    const list = (await api("GET", "characters", null, newToken)).data.characters || [];
    check("creator: only one character created", list.length === 1, list.length);

    // Offline: friendly messages instead of crashes
    const character = await createCharacter(token, "Offline");
    await evaluate(`localStorage.setItem("token", ${JSON.stringify(token)})`);
    await goto("/character/" + character.id);
    await waitFor(`document.querySelector("#name")?.value === "Offline"`);
    await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await clickText("button", "Save Character");
    check("offline: save shows a readable error", await waitFor(`document.querySelector(".inline-message.error")?.innerText.startsWith("Could not reach the server")`), await inlineError());
    await evaluate(`document.querySelector('button[aria-label^="ATHLETICS:"]').click(), true`);
    check("offline: toggle shows an error toast", await waitFor(`(document.querySelector(".app-toast.error")?.innerText || "").includes("Could not reach the server")`), await toast());
    check("offline: toggle unchanged", (await evaluate(`document.querySelector('button[aria-label^="ATHLETICS:"]').getAttribute("aria-label")`)) === "ATHLETICS: Not proficient");
    await evaluate(`document.querySelector(".app-toast-close").click(), true`);
    check("toast: dismiss button hides it", await waitFor(`!document.querySelector(".app-toast")`));
    await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await clickText("button", "Save Character");
    check("back online: save works", await waitFor(`document.querySelector('[role="status"]')?.innerText === "Saved!"`));

    // Deleting shows a confirmation toast on the character list
    await clickText("button", "Delete character");
    await waitFor(`[...document.querySelectorAll("button")].some(x => x.innerText.trim() === "Yes, delete")`);
    await clickText("button", "Yes, delete");
    check("delete: success toast", await waitFor(`document.querySelector(".app-toast.success")?.innerText.includes("Offline was deleted.")`), await toast());

    // Keyboard focus is visible (gold ring)
    await goto("/");
    await evaluate("localStorage.clear(); document.activeElement?.blur(); true");
    await goto("/");
    await waitFor(`!!document.querySelector('input[name="email"]')`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(200);
    const focusStyle = await evaluate(`(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + " " + s.outlineColor; })()`);
    check("keyboard focus: visible outline", focusStyle === "solid rgb(255, 209, 102)", focusStyle);

    check("no alert() popups anywhere", (await evaluate("window.__alerts.length")) === 0);
}
