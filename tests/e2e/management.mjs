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

    // A brand-new character (proficiency +2, all scores 10) gets the bonuses applied:
    // proficient skill +2, expertise +4, proficient save +2, Perception proficiency raises Passive Perception
    const fresh = await createCharacter(token, "Fresh");
    check("new character: proficiency is 2", fresh.proficiency === 2, fresh.proficiency);
    await goto("/character/" + fresh.id);
    await waitFor(`document.querySelector("#name")?.value === "Fresh"`);
    const freshProficiency = await evaluate(`[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PROFICIENCY")).querySelector("input").value`);
    check("new character: sheet shows proficiency 2", freshProficiency === "2", freshProficiency);
    const skillValue = name => evaluate(`(() => { const td = [...document.querySelectorAll("td")]; const i = td.findIndex(t => t.innerText.includes("${name} (")); return i === -1 ? "skill not found" : td[i + 1]?.innerText.trim(); })()`);
    const skillToggle = name => `document.querySelector('button[aria-label^="${name}:"]')`;
    const passiveValue = () => evaluate(`[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PASSIVE PER")).innerText.replace("PASSIVE PER", "").trim()`);
    check("bonus: Athletics starts at +0", (await skillValue("ATHLETICS")) === "0", await skillValue("ATHLETICS"));
    await evaluate(`${skillToggle("ATHLETICS")}.click(), true`);
    check("bonus: proficient Athletics is +2", await waitFor(`(() => { const td = [...document.querySelectorAll("td")]; const i = td.findIndex(t => t.innerText.includes("ATHLETICS (")); return td[i + 1]?.innerText.trim() === "2"; })()`), await skillValue("ATHLETICS"));
    await evaluate(`${skillToggle("ATHLETICS")}.click(), true`);
    check("bonus: expertise Athletics is +4", await waitFor(`(() => { const td = [...document.querySelectorAll("td")]; const i = td.findIndex(t => t.innerText.includes("ATHLETICS (")); return td[i + 1]?.innerText.trim() === "4"; })()`), await skillValue("ATHLETICS"));
    check("bonus: Passive Perception starts at 10", (await passiveValue()) === "10", await passiveValue());
    await evaluate(`${skillToggle("PERCEPTION")}.click(), true`);
    check("bonus: proficient Perception gives Passive Perception 12", await waitFor(`[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PASSIVE PER")).innerText.replace("PASSIVE PER", "").trim() === "12"`), await passiveValue());
    const strSave = () => evaluate(`[...[...document.querySelectorAll(".stat-block-box")].find(x => x.querySelector("h4")?.innerText === "STR").querySelectorAll(".text-center")].find(d => d.innerText.includes("SAV")).querySelector("h4").innerText`);
    await evaluate(`document.querySelector('button[aria-label^="STR saving throw"]').click(), true`);
    check("bonus: proficient STR save is +2", await waitFor(`document.querySelector('button[aria-label^="STR saving throw"]').getAttribute("aria-label").endsWith(": proficient")`) && (await strSave()) === "2", await strSave());
    await goto("/character/" + character.id);
    await waitFor(`document.querySelector("#name")?.value === "Renamed"`);

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
