// Login, logout, protected pages, and character URLs
export async function run(b, { email, password }) {
    const { check, goto, waitFor, evaluate, fill, clickText, path, text, send, sleep } = b;
    await goto("/"); await evaluate("localStorage.clear()");

    // Logged-out users are sent to the login page
    await goto("/characterselection");
    check("logged out: /characterselection redirects to /", await waitFor(`location.pathname === "/"`), await path());
    check("logged out: login form shown", await waitFor(`!!document.querySelector('input[name="email"]')`));
    await goto("/character/1");
    check("logged out: /character/1 redirects to /", await waitFor(`location.pathname === "/"`), await path());

    // Wrong password shows the server's message and stays logged out
    await fill('input[name="email"]', email); await fill('input[name="password"]', "wrong-password");
    await clickText("button", "SUBMIT");
    check("wrong password: error shown", await waitFor(`window.__alerts.length > 0`), "no alert");
    const alertText = await evaluate("window.__alerts[0]");
    check("wrong password: message is from server", alertText === "Invalid email or password", alertText);
    check("wrong password: no token saved", (await evaluate("localStorage.getItem('token')")) === null);

    // Log in
    await fill('input[name="password"]', password);
    await clickText("button", "SUBMIT");
    check("login: goes to /characterselection", await waitFor(`location.pathname === "/characterselection"`), await path());
    check("login: token saved", !!(await evaluate("localStorage.getItem('token')")));
    check("login: character list loads", await waitFor(`document.body.innerText.includes("Aria")`), (await text()).slice(0, 200));
    check("navbar: Log Out visible", await waitFor(`[...document.querySelectorAll("button")].some(b => b.innerText.trim() === "Log Out")`));

    // Logged-in users skip the login form
    await goto("/");
    check("logged in: / redirects to /characterselection", await waitFor(`location.pathname === "/characterselection"`), await path());

    // Open a character, then refresh the page
    await waitFor(`document.body.innerText.includes("Aria")`);
    await clickText("button", "Aria");
    check("select: URL is /character/<id>", await waitFor(`/^\\/character\\/\\d+$/.test(location.pathname)`), await path());
    const sheetPath = await path();
    check("sheet: shows character name", await waitFor(`document.querySelector("#name")?.value === "Aria"`), (await text()).slice(0, 200));
    await send("Page.reload"); await sleep(800);
    check("refresh: still on same sheet", (await path()) === sheetPath, await path());
    check("refresh: character reloaded from API", await waitFor(`document.querySelector("#name")?.value === "Aria"`), (await text()).slice(0, 200));
    check("navbar: Character Site links to sheet", await waitFor(`[...document.querySelectorAll("a")].some(a => a.getAttribute("href") === "${sheetPath}")`));

    // Unknown character and unknown page
    await goto("/character/999999");
    check("unknown character: not-found message", await waitFor(`document.body.innerText.includes("CHARACTER NOT FOUND")`), (await text()).slice(0, 200));
    await goto("/this-page-does-not-exist");
    check("unknown route: 404 page with navbar", await waitFor(`document.body.innerText.includes("PAGE NOT FOUND") && document.body.innerText.includes("BAG OF HOLDING")`), (await text()).slice(0, 200));

    // An invalid token logs the user out automatically
    await evaluate("localStorage.setItem('token', 'not-a-valid-token')");
    await goto("/characterselection");
    check("bad token: sent back to /", await waitFor(`location.pathname === "/"`), await path());
    check("bad token: token cleared", await waitFor(`localStorage.getItem('token') === null`));

    // Log in again, then log out with the navbar button
    await fill('input[name="email"]', email); await fill('input[name="password"]', password);
    await clickText("button", "SUBMIT");
    await waitFor(`[...document.querySelectorAll("button")].some(b => b.innerText.trim() === "Log Out")`);
    await clickText("button", "Log Out");
    check("logout: back to /", await waitFor(`location.pathname === "/"`), await path());
    check("logout: token cleared", (await evaluate("localStorage.getItem('token')")) === null);
    check("logout: navbar links hidden", !(await evaluate(`[...document.querySelectorAll("button")].some(b => b.innerText.trim() === "Log Out")`)));
    await goto("/characterselection");
    check("logout: protected page redirects again", await waitFor(`location.pathname === "/"`), await path());
}
