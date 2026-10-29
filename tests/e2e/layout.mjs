// Responsive layout: no sideways scrolling, mobile menu, phone-friendly spell details
import { createCharacter } from "./lib.mjs";

const WIDTHS = { phone: 375, tablet: 768, desktop: 1280 };

export async function run(b, { token }) {
    const { check, goto, waitFor, evaluate, send, sleep } = b;
    const character = await createCharacter(token, "Layout");
    const setWidth = (width, mobile) => send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 1, mobile });
    // How far the rightmost element sticks out past the screen (0 = no sideways scrolling), and which element it is
    const overflow = async () => JSON.parse(await evaluate(`(() => {
        const widest = [...document.querySelectorAll("body *")].reduce((a, e) => e.getBoundingClientRect().right > a.getBoundingClientRect().right ? e : a, document.body);
        const extra = Math.round(widest.getBoundingClientRect().right - document.documentElement.clientWidth);
        return JSON.stringify({ extra, element: widest.tagName.toLowerCase() + (widest.className ? "." + String(widest.className).trim().split(/\\s+/).join(".") : "") + ' "' + (widest.innerText || "").trim().slice(0, 30).replace(/\\s+/g, " ") + '"', viewport: document.documentElement.clientWidth });
    })()`));
    const pages = [
        ["login", "/", "input[name=email]", false],
        ["character selection", "/characterselection", ".character-list", true],
        ["character creator", "/charactercreator", ".selector-tabs", true],
        ["character sheet", "/character/" + character.id, "#name", true],
        ["spells", "/spells", ".spell-option", true],
    ];

    for (const [device, width] of Object.entries(WIDTHS)) {
        await setWidth(width, device === "phone");
        for (const [name, path, ready, loggedIn] of pages) {
            await evaluate(loggedIn ? `localStorage.setItem("token", ${JSON.stringify(token)})` : "localStorage.clear()");
            await goto(path);
            await waitFor(`!!document.querySelector("${ready}")`);
            await sleep(300);
            const { extra, element, viewport } = await overflow();
            check(`${device}: ${name} fits the screen`, extra <= 0, `${extra}px too wide (${element}, viewport ${viewport}px)`);
            // Text that sticks out of its own box (e.g. a long word in a narrow heading)
            const clipped = await evaluate(`[...document.querySelectorAll("h1, h2, h3, h4, h5, button, label, a, th")]
                .filter(e => e.offsetParent !== null && e.scrollWidth > e.clientWidth + 1)
                .map(e => e.tagName.toLowerCase() + ": " + e.innerText.trim().slice(0, 30))`);
            check(`${device}: ${name} has no overflowing text`, clipped.length === 0, JSON.stringify(clipped));
        }
    }

    // Phone: navbar collapses into a menu button
    await setWidth(375, true);
    await evaluate(`localStorage.setItem("token", ${JSON.stringify(token)})`);
    await goto("/characterselection");
    await waitFor(`!!document.querySelector(".navbar-toggler-custom")`);
    const menuVisible = () => evaluate(`getComputedStyle(document.querySelector("#main-menu")).display !== "none"`);
    check("phone menu: hidden until opened", !(await menuVisible()));
    await evaluate(`document.querySelector(".navbar-toggler-custom").click(), true`);
    check("phone menu: opens", await waitFor(`getComputedStyle(document.querySelector("#main-menu")).display !== "none"`));
    check("phone menu: button reports expanded", (await evaluate(`document.querySelector(".navbar-toggler-custom").getAttribute("aria-expanded")`)) === "true");
    await evaluate(`[...document.querySelectorAll("#main-menu a")].find(a => a.innerText.trim() === "Spells").click(), true`);
    check("phone menu: link navigates", await waitFor(`location.pathname === "/spells"`));
    check("phone menu: closes after navigating", await waitFor(`getComputedStyle(document.querySelector("#main-menu")).display === "none"`));

    // Phone: choosing a spell brings its details into view
    await waitFor(`!!document.querySelector(".spell-option")`);
    await evaluate(`window.scrollTo(0, 0); document.querySelector(".spell-option").click(), true`);
    check("phone spells: details scrolled into view", await waitFor(`(() => { const r = document.querySelector(".spell-info-panel").getBoundingClientRect(); return r.top >= -5 && r.top < window.innerHeight / 2 && document.querySelector(".spell-name h2").innerText !== "Select a spell"; })()`, 6000), await evaluate(`Math.round(document.querySelector(".spell-info-panel").getBoundingClientRect().top)`));

    // Desktop: full menu shown, no menu button
    await setWidth(1280, false);
    await goto("/characterselection");
    await waitFor(`!!document.querySelector("#main-menu")`);
    check("desktop: menu links visible", await menuVisible());
    check("desktop: menu button hidden", (await evaluate(`getComputedStyle(document.querySelector(".navbar-toggler-custom")).display`)) === "none");

    // Touch targets: proficiency toggles at least 24x24px (WCAG 2.2 minimum)
    await setWidth(375, true);
    await goto("/character/" + character.id);
    await waitFor(`!!document.querySelector(".proficiency-toggle")`);
    const smallest = await evaluate(`Math.min(...[...document.querySelectorAll(".proficiency-toggle")].map(e => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)))`);
    check("phone: proficiency toggles are at least 24px", smallest >= 24, `${smallest}px`);

    await send("Emulation.clearDeviceMetricsOverride");
}
