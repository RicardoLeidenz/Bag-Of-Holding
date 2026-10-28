// Character management: rename, proficiency toggles, delete
import { api, createCharacter } from "./lib.mjs";

export async function run(b, { token }) {
    const { check, goto, waitFor, evaluate, type, fill, blur, clickText, sleep } = b;
    const character = await createCharacter(token, "Mgmt");
    const dex = character.stats.find(s => s.name === "DEX");
    // DEX 18 (+4), proficiency +3
    await api("PUT", "stat", { id: dex.id, value: 18 }, token);
    await api("PUT", "character", { id: character.id, proficiency: 3 }, token);
    const load = async () => (await api("GET", "character/" + character.id, null, token)).data.character;

    await goto("/"); await evaluate(`localStorage.setItem("token", ${JSON.stringify(token)})`);
    await goto("/character/" + character.id);
    await waitFor(`document.querySelector("#name")?.value === "Mgmt"`);

    // Rename, saved with Save Character
    await type("#name", "Renamed"); await blur();
    await clickText("button", "Save Character");
    await waitFor(`document.querySelector('[role="status"]')?.innerText === "Saved!"`);
    check("rename: saved", (await load()).name === "Renamed", (await load()).name);
    // An empty name goes back to the previous one
    await evaluate(`document.querySelector("#name").focus(), true`);
    await fill("#name", ""); await blur(); await sleep(200);
    check("rename: empty name reverts", (await evaluate(`document.querySelector("#name").value`)) === "Renamed", await evaluate(`document.querySelector("#name").value`));

    // Skill proficiency cycles none -> proficient -> expertise -> none
    const toggle = `document.querySelector('button[aria-label^="ACROBATICS:"]')`;
    const label = () => evaluate(`${toggle}.getAttribute("aria-label")`);
    const modifier = () => evaluate(`(() => { const td = [...document.querySelectorAll("td")]; const i = td.findIndex(t => t.innerText.includes("ACROBATICS (")); return i === -1 ? "skill not found" : td[i + 1]?.innerText.trim(); })()`);
    const acrobatics = async () => (await load()).skills.find(s => s.name === "ACROBATICS");
    check("skill: starts not proficient, +4", (await label()) === "ACROBATICS: Not proficient" && (await modifier()) === "4", `${await label()} ${await modifier()}`);
    await evaluate(`${toggle}.click(), true`);
    check("skill: proficient shows +7", await waitFor(`${toggle}.getAttribute("aria-label") === "ACROBATICS: Proficient"`) && (await modifier()) === "7", `${await label()} ${await modifier()}`);
    check("skill: proficiency saved", (await acrobatics()).proficient === true);
    await evaluate(`${toggle}.click(), true`);
    check("skill: expertise shows +10", await waitFor(`${toggle}.getAttribute("aria-label") === "ACROBATICS: Expertise"`) && (await modifier()) === "10", `${await label()} ${await modifier()}`);
    check("skill: expertise saved", (await acrobatics()).expert === true);
    await evaluate(`${toggle}.click(), true`);
    check("skill: back to none, +4", await waitFor(`${toggle}.getAttribute("aria-label") === "ACROBATICS: Not proficient"`) && (await modifier()) === "4", `${await label()} ${await modifier()}`);
    const cleared = await acrobatics();
    check("skill: cleared in database", cleared.proficient === false && cleared.expert === false, JSON.stringify(cleared));
    check("passive perception unaffected (no Perception proficiency)", (await evaluate(`[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PASSIVE PER")).innerText.replace("PASSIVE PER", "").trim()`)) === "10");

    // Saving throw proficiency: DEX save 4 -> 7 (4 + proficiency 3, not "43")
    const saveToggle = `document.querySelector('button[aria-label^="DEX saving throw"]')`;
    const dexSave = () => evaluate(`[...[...document.querySelectorAll(".stat-block-box")].find(x => x.querySelector("h4")?.innerText === "DEX").querySelectorAll(".text-center")].find(d => d.innerText.includes("SAV")).querySelector("h4").innerText`);
    check("save: DEX starts at 4", (await dexSave()) === "4", await dexSave());
    await evaluate(`${saveToggle}.click(), true`);
    check("save: proficient DEX save is 7", await waitFor(`${saveToggle}.getAttribute("aria-label").endsWith(": proficient")`) && (await dexSave()) === "7", await dexSave());
    check("save: proficiency saved", (await load()).stats.find(s => s.name === "DEX").proficient === true);

    // Delete: Cancel keeps the character
    await clickText("button", "Delete character");
    check("delete: asks for confirmation", await waitFor(`document.body.innerText.includes("Really delete Renamed?")`));
    await clickText("button", "Cancel");
    check("delete: cancel keeps character", (await api("GET", "character/" + character.id, null, token)).status === 200);
    check("delete: confirmation hidden after cancel", !(await evaluate(`document.body.innerText.includes("Really delete")`)));

    // Delete for real
    await clickText("button", "Delete character");
    await waitFor(`[...document.querySelectorAll("button")].some(x => x.innerText.trim() === "Yes, delete")`);
    await clickText("button", "Yes, delete");
    check("delete: goes to character selection", await waitFor(`location.pathname === "/characterselection"`), await evaluate("location.pathname"));
    check("delete: removed from database", (await api("GET", "character/" + character.id, null, token)).status === 404);
    await sleep(500);
    check("delete: not in character list", !(await evaluate(`document.body.innerText.includes("Renamed")`)));
    check("delete: navbar has no link to it", !(await evaluate(`[...document.querySelectorAll("a")].some(a => a.getAttribute("href") === "/character/${character.id}")`)));
}
