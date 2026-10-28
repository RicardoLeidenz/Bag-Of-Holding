// Runs the end-to-end browser tests.
// Needs Chrome and the test servers: `pipenv run e2e-api` (port 3101, rate limits off)
// and `npm run e2e:app` (port 3100). Set APP=... to test another address.
import { APP, api, connect, launchChrome, createCharacter } from "./lib.mjs";
import * as session from "./session.mjs";
import * as sheet from "./sheet.mjs";
import * as management from "./management.mjs";
import * as layout from "./layout.mjs";
import * as ux from "./ux.mjs";

try {
    await fetch(APP);
} catch {
    console.error(`App not reachable at ${APP}. Start the test servers first: pipenv run e2e-api and npm run e2e:app (see README).`);
    process.exit(1);
}

// One fresh user per run, with a character the session test opens
const email = `e2e-${Date.now()}@test.com`;
const password = "password123";
const signUp = await api("POST", "sign_up", { email, password });
const logIn = await api("POST", "log_in", { email, password });
if (signUp.status !== 201 || logIn.status !== 200) {
    console.error("Could not create the test user:", signUp.status, logIn.status, JSON.stringify(logIn.data));
    console.error("If this is 429, the API has rate limiting on: use pipenv run e2e-api.");
    process.exit(1);
}
const token = logIn.data.token;
await createCharacter(token, "Aria");

const stopChrome = await launchChrome();
const browser = await connect();
let crashed = false;
for (const [name, suite] of [["session", session], ["sheet", sheet], ["management", management], ["layout", layout], ["ux", ux]]) {
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
