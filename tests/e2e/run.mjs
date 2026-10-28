// Runs the end-to-end browser tests.
// Needs the app running (default http://localhost:3000, or set APP=...) and Chrome installed.
// Start the API with RATELIMIT_ENABLED=false so repeated runs don't hit the login/sign-up limits.
import { APP, api, connect, launchChrome, createCharacter } from "./lib.mjs";
import * as session from "./session.mjs";
import * as sheet from "./sheet.mjs";

try {
    await fetch(APP);
} catch {
    console.error(`App not reachable at ${APP}. Start the backend and frontend first (see README).`);
    process.exit(1);
}

// One fresh user per run, with a character the session test opens
const email = `e2e-${Date.now()}@test.com`;
const password = "password123";
const signUp = await api("POST", "sign_up", { email, password });
const logIn = await api("POST", "log_in", { email, password });
if (signUp.status !== 201 || logIn.status !== 200) {
    console.error("Could not create the test user:", signUp.status, logIn.status, JSON.stringify(logIn.data));
    console.error("If this is 429, restart the API with RATELIMIT_ENABLED=false.");
    process.exit(1);
}
const token = logIn.data.token;
await createCharacter(token, "Aria");

const stopChrome = await launchChrome();
const browser = await connect();
let crashed = false;
for (const [name, suite] of [["session", session], ["sheet", sheet]]) {
    console.log(`\n${name}`);
    try {
        await suite.run(browser, { email, password, token });
    } catch (error) {
        crashed = true;
        console.error(`  ERROR  ${error.stack}`);
    }
}
browser.close();
await stopChrome();

const { passes, failures } = browser.results();
console.log(`\n${passes} passed, ${failures} failed${crashed ? ", a suite crashed" : ""}`);
process.exit(failures || crashed ? 1 : 0);
