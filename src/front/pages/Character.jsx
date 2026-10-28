import React, { useEffect, useState } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { CharacterInfoBlock } from "../components/characterSite/CharacterInfoBlock.jsx";
import { CharacterStatsBlock } from "../components/characterSite/CharacterStatsBlock.jsx";
import { SkillsTable } from "../components/characterSite/SkillsTable.jsx";
import { ConsumablesTable } from "../components/characterSite/ConsumablesTable.jsx";
import { DiceBar } from "../components/characterSite/DiceBar.jsx";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api.js";
import "../../styles/characterSite.css";
export const Character = () => {
    const { store, dispatch } = useGlobalReducer()
    // The character id comes from the URL (/character/:id), so a page refresh can reload it
    const { id } = useParams();
    const [status, setStatus] = useState("loading") // loading | ready | not_found | error
    const [saveMessage, setSaveMessage] = useState("")
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const navigate = useNavigate();

    let characterInfo = store.characterInfo

    const saveCharacter = async (e) => {
        setSaveMessage("Saving...");
        try {
            const response = await apiFetch("api/character", {
                method: "PUT",
                body: JSON.stringify(characterInfo),
            });
            const data = await response.json();
            setSaveMessage(response.ok ? "Saved!" : (data.error || "Could not save"));
        } catch (error) {
            setSaveMessage("Could not reach the server");
        }
    };

    const deleteCharacter = async () => {
        setDeleteError("");
        try {
            const response = await apiFetch("api/character", {
                method: "DELETE",
                body: JSON.stringify({ id: characterInfo.id }),
            });
            if (response.ok) {
                dispatch({ type: "clear_character" });
                navigate("/characterselection");
            } else {
                const data = await response.json();
                setDeleteError(data.error || "Could not delete character");
            }
        } catch (error) {
            setDeleteError("Could not reach the server");
        }
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
                        skills={characterInfo.skills}
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
                    {saveMessage ? <p className="text-center m-1" role="status">{saveMessage}</p> : ""}
                </div>
                {/* DELETE, with an inline confirmation step */}
                <div className="m-4 text-center">
                    {
                        confirmingDelete
                            ? <div role="alert">
                                <p>Really delete {characterInfo.name}? This can't be undone.</p>
                                <button className="delete-character-button confirm" onClick={deleteCharacter}>Yes, delete</button>
                                <button className="cancel-delete-button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                            </div>
                            : <button className="delete-character-button" onClick={() => setConfirmingDelete(true)}>Delete character</button>
                    }
                    {deleteError ? <p role="status">{deleteError}</p> : ""}
                </div>
            </div>
        </div>
    );
};
