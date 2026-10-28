// Character sheet calculations and saving, and the character creator
import { api, createCharacter } from "./lib.mjs";

export async function run(b, { token }) {
    const { check, goto, waitFor, evaluate, type, blur, clickText, sleep, requests } = b;
    const character = await createCharacter(token, "Testy");
    const statId = name => character.stats.find(s => s.name === name).id;
    // DEX 16 (+3), WIS 14 (+2), proficiency +2; no skill proficiencies
    await api("PUT", "stat", { id: statId("DEX"), value: 16 }, token);
    await api("PUT", "stat", { id: statId("WIS"), value: 14 }, token);
    await api("PUT", "character", { id: character.id, proficiency: 2, hp: 17, hitDice: "1d6" }, token);
    const load = async () => (await api("GET", "character/" + character.id, null, token)).data.character;

    const openSheet = async () => {
        await goto("/character/" + character.id);
        await waitFor(`document.querySelector("#name")?.innerText === "Testy"`);
    };
    await goto("/"); await evaluate(`localStorage.setItem("token", ${JSON.stringify(token)})`);
    await openSheet();

    const skill = name => evaluate(`(() => { const td = [...document.querySelectorAll("td")]; const i = td.findIndex(t => t.innerText.trim().startsWith("${name} (")); return td[i + 1]?.innerText.trim(); })()`);
    const statBox = name => `[...document.querySelectorAll(".stat-block-box")].find(x => x.querySelector("h4")?.innerText === "${name}")`;
    const statCell = (name, label) => evaluate(`[...${statBox(name)}.querySelectorAll(".text-center")].find(d => d.innerText.includes("${label}")).querySelector("h4").innerText`);
    const tagStatInput = name => evaluate(`${statBox(name)}.querySelector("input").setAttribute("data-test", "${name}"), true`);

    // Calculations
    check("skills: ACROBATICS (DEX) = 3", (await skill("ACROBATICS")) === "3", await skill("ACROBATICS"));
    check("skills: STEALTH (DEX) = 3", (await skill("STEALTH")) === "3", await skill("STEALTH"));
    check("skills: PERCEPTION (WIS) = 2", (await skill("PERCEPTION")) === "2", await skill("PERCEPTION"));
    check("hit dice: field shows '1d6'", (await evaluate(`document.querySelector("#hitDice").value`)) === "1d6", await evaluate(`document.querySelector("#hitDice").value`));
    const passive = await evaluate(`[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PASSIVE PER"))?.innerText.replace("PASSIVE PER", "").trim()`);
    check("passive perception = 12", passive === "12", passive);

    // Ability score: recalculates while typing, saves once on blur
    await tagStatInput("DEX");
    requests.length = 0;
    await type('[data-test="DEX"]', "18"); await sleep(300);
    check("stat: skills recalculate while typing", (await skill("ACROBATICS")) === "4", await skill("ACROBATICS"));
    check("stat: no save requests while typing", !requests.includes("PUT /api/stat"), JSON.stringify(requests));
    await blur(); await sleep(600);
    check("stat: exactly one save after leaving field", requests.filter(r => r === "PUT /api/stat").length === 1, JSON.stringify(requests));
    check("stat: DEX saved as 18", (await load()).stats.find(s => s.name === "DEX").value === 18);

    // Invalid score reverts to the saved value without saving
    await tagStatInput("STR");
    requests.length = 0;
    await type('[data-test="STR"]', "40"); await blur(); await sleep(500);
    check("invalid: STR 40 reverts to 10", (await evaluate(`document.querySelector('[data-test="STR"]').value`)) === "10", await evaluate(`document.querySelector('[data-test="STR"]').value`));
    check("invalid: STR CHK back to 0", (await statCell("STR", "CHK")) === "0", await statCell("STR", "CHK"));
    check("invalid: no save request sent", !requests.includes("PUT /api/stat"), JSON.stringify(requests));
    await type("#level", "25"); await blur(); await sleep(300);
    check("invalid: level 25 reverts to 1", (await evaluate('document.querySelector("#level").value')) === "1", await evaluate('document.querySelector("#level").value'));

    // Save Character sends what's on screen, even without pressing Enter
    await type("#hp", "25"); await blur();
    const profInput = `[...document.querySelectorAll(".stat-block-box")].find(x => x.innerText.includes("PROFICIENCY")).querySelector("input")`;
    await evaluate(`${profInput}.setAttribute("data-test", "proficiency"), true`);
    await type('[data-test="proficiency"]', "3"); await blur();
    check("proficiency: skill values stay numbers", /^-?\d+$/.test(await skill("ATHLETICS")), await skill("ATHLETICS"));
    await clickText("button", "Save Character");
    check("save: shows 'Saved!'", await waitFor(`document.querySelector('[role="status"]')?.innerText === "Saved!"`), await evaluate(`document.querySelector('[role="status"]')?.innerText`));
    const saved = await load();
    check("save: HP 25 persisted", saved.hp === 25, saved.hp);
    check("save: proficiency 3 persisted", saved.proficiency === 3, saved.proficiency);

    // Consumables: one row per add, and its amount can be edited right away
    requests.length = 0;
    await clickText("button", "Add"); await sleep(500);
    await type("#consumableName", "Potion");
    await evaluate(`[...document.querySelectorAll("#addConsumable button")].find(x => x.innerText.trim() === "Save").click(), true`);
    await sleep(900);
    check("consumable: one POST per add", requests.filter(r => r === "POST /api/consumable").length === 1, JSON.stringify(requests));
    check("consumable: one row saved", (await load()).consumables.length === 1, (await load()).consumables.length);
    await waitFor(`document.querySelector("input.consumableCount") !== null`, 2000);
    await type("input.consumableCount", "3"); await blur(); await sleep(800);
    const consumables = (await load()).consumables;
    check("consumable: new row's amount saved", consumables[0]?.amount === 3, JSON.stringify(consumables));

    // Character creator: subclasses follow the chosen class
    await goto("/charactercreator");
    await waitFor(`[...document.querySelectorAll("button")].some(x => x.innerText.trim() === "CLASS")`);
    await clickText("button", "CLASS");
    await waitFor(`[...document.querySelectorAll("button.input-selection")].some(x => x.innerText.trim() === "Wizard")`);
    await clickText("button.input-selection", "Wizard");
    await clickText("button", "SUBCLASS");
    const subclassNames = `[...document.querySelectorAll("button.input-selection")].map(x => x.innerText.trim()).join()`;
    check("creator: Wizard shows only Evocation", await waitFor(`${subclassNames} === "Evocation"`), await evaluate(subclassNames));
    await clickText("button.input-selection", "Evocation");
    await clickText("button", "Wizard"); // the CLASS tab now shows the chosen class
    await waitFor(`[...document.querySelectorAll("button.input-selection")].some(x => x.innerText.trim() === "Fighter")`);
    await clickText("button.input-selection", "Fighter");
    check("creator: changing class resets subclass", await waitFor(`[...document.querySelectorAll("button.input-selector")].some(x => x.innerText.trim() === "SUBCLASS")`));
    await clickText("button", "SUBCLASS");
    check("creator: Fighter shows only Champion", await waitFor(`${subclassNames} === "Champion"`), await evaluate(subclassNames));
}
