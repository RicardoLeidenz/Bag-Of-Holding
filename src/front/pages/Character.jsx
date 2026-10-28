import React, { useEffect, useState } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { CharacterInfoBlock } from "../components/characterSite/CharacterInfoBlock.jsx";
import { CharacterStatsBlock } from "../components/characterSite/CharacterStatsBlock.jsx";
import { SkillsTable } from "../components/characterSite/SkillsTable.jsx";
import { ConsumablesTable } from "../components/characterSite/ConsumablesTable.jsx";
import { DiceBar } from "../components/characterSite/DiceBar.jsx";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api.js";
import "../../styles/characterSite.css";
export const Character = () => {
    const { store, dispatch } = useGlobalReducer()
    // The character id comes from the URL (/character/:id), so a page refresh can reload it
    const { id } = useParams();
    const [status, setStatus] = useState("loading") // loading | ready | not_found | error

    let characterInfo = store.characterInfo

    const saveCharacter = async (e) => {
        const response = await apiFetch("api/character", {
            method: "PUT",
            body: JSON.stringify(characterInfo),
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
    };

    // Load the character from the API whenever the id in the URL changes
    useEffect(() => {
        const loadCharacter = async () => {
            setStatus("loading");
            try {
                const response = await apiFetch("api/character/" + id);
                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: "select_character", payload: data.character });
                    setStatus("ready");
                } else {
                    setStatus(response.status === 404 ? "not_found" : "error");
                }
            } catch (error) {
                setStatus("error");
            }
        };
        loadCharacter();
    }, [id])

    if (status === "not_found" || status === "error") {
        return (
            <div className="info-box m-5 p-4 text-center text-white">
                <h2>{status === "not_found" ? "CHARACTER NOT FOUND" : "COULD NOT LOAD CHARACTER"}</h2>
                <Link to="/characterselection" className="input-selector">BACK TO CHARACTERS</Link>
            </div>
        );
    }

    // Wait until the character in the store is the one in the URL
    if (status !== "ready" || String(characterInfo.id) !== id) {
        return <div className="text-white text-center m-5"><h3>Loading...</h3></div>;
    }

    return (
        // key: remount the sheet when switching characters, so each block starts from fresh data
        <div className="text-white my-5 row" key={characterInfo.id}>
            {/* BLOCK CONTAINING ALL CHARACTER DETAILS */}
            <div className="col-3 info-box rounded m-4">
                <CharacterInfoBlock
                    name={characterInfo.name}
                    race={characterInfo.race}
                    level={characterInfo.level}
                    characterClass={characterInfo.characterClass}
                    subClass={characterInfo.subClass}
                    hp={characterInfo.hp}
                    ac={characterInfo.ac}
                    hitDice={characterInfo.hitDice}
                />
            </div>
            <div className="col-6">
                {/* BLOCK CONTAINING ALL CHARACTER STATS */}
                <div className="row info-box rounded py-3 mb-4">
                    <CharacterStatsBlock
                        stats={characterInfo.stats}
                        speed={characterInfo.speed}
                        initiative={characterInfo.initiative}
                        proficiency={characterInfo.proficiency}
                        user_id={characterInfo.user_id}
                        id={characterInfo.id}
                    />
                </div>
                <div className="d-flex">
                    {/* BLOCK CONTAINING ALL CHARACTER SKILLS */}
                    <div className="info-box rounded me-4">
                        <h3>SKILLS</h3>
                        <SkillsTable skillList={characterInfo.skills} stats={characterInfo.stats} proficiency={characterInfo.proficiency}></SkillsTable>
                    </div>
                    {/* BLOCK CONTAINING ALL CONSUMABLES */}
                    <div className="col-5 info-box rounded">
                        <ConsumablesTable consumables={characterInfo.consumables} character_id={characterInfo.id}></ConsumablesTable>
                    </div>
                </div>
            </div>
            {/* BLOCK CONTAINING ALL DICE */}
            <div className="col-2">
                <div className="info-box rounded m-4 p-1">
                    <DiceBar />
                </div>
                <div className="info-box rounded m-4 p-1">
                    <button className="character-info-box" onClick={saveCharacter}>Save Character</button>
                </div>
            </div>
        </div>
    );
};
