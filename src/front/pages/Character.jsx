import { useEffect, useState } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { CharacterInfoBlock } from "../components/characterSite/CharacterInfoBlock.jsx";
import { CharacterStatsBlock } from "../components/characterSite/CharacterStatsBlock.jsx";
import { SkillsTable } from "../components/characterSite/SkillsTable.jsx";
import { ConsumablesTable } from "../components/characterSite/ConsumablesTable.jsx";
import { DiceBar } from "../components/characterSite/DiceBar.jsx";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiCall } from "../api.js";
import { InlineMessage } from "../components/InlineMessage.jsx";
import "../../styles/characterSite.css";
export const Character = () => {
    const { store, dispatch } = useGlobalReducer()
    // The character id comes from the URL (/character/:id), so a page refresh can reload it
    const { id } = useParams();
    const [status, setStatus] = useState("loading") // loading | ready | not_found | error
    const [saveState, setSaveState] = useState({ kind: "", text: "" })
    const [loadAttempt, setLoadAttempt] = useState(0)
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const navigate = useNavigate();

    let characterInfo = store.characterInfo

    const saveCharacter = async () => {
        setSaveState({ kind: "saving", text: "Saving..." });
        const { ok, data } = await apiCall("api/character", {
            method: "PUT",
            body: JSON.stringify(characterInfo),
        });
        setSaveState(ok ? { kind: "success", text: "Saved!" } : { kind: "error", text: data.error });
    };

    const deleteCharacter = async () => {
        setDeleteError("");
        const { ok, data } = await apiCall("api/character", {
            method: "DELETE",
            body: JSON.stringify({ id: characterInfo.id }),
        });
        if (ok) {
            dispatch({ type: "clear_character" });
            dispatch({ type: "show_notice", payload: { kind: "success", text: `${characterInfo.name} was deleted.` } });
            navigate("/characterselection");
        } else {
            setDeleteError(data.error);
        }
    };

    // Load the character from the API whenever the id in the URL changes
    useEffect(() => {
        const loadCharacter = async () => {
            setStatus("loading");
            const { ok, status: httpStatus, data } = await apiCall("api/character/" + id);
            if (ok) {
                dispatch({ type: "select_character", payload: data.character });
                setStatus("ready");
            } else {
                setStatus(httpStatus === 404 ? "not_found" : "error");
            }
        };
        loadCharacter();
    }, [id, loadAttempt, dispatch])

    if (status === "not_found" || status === "error") {
        return (
            <div className="info-box page-box p-4 text-center text-white">
                <h2>{status === "not_found" ? "CHARACTER NOT FOUND" : "COULD NOT LOAD CHARACTER"}</h2>
                {status === "error" ? <p>Check your connection and try again.</p> : ""}
                {status === "error" ? <button className="input-selector" onClick={() => setLoadAttempt(loadAttempt + 1)}>TRY AGAIN</button> : ""}
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
        // Layout: one column on phones; on large screens info | stats & skills | dice & actions
        <div className="container-fluid text-white my-4" key={characterInfo.id}>
            <div className="row g-3 g-lg-4 px-sm-2">
                {/* BLOCK CONTAINING ALL CHARACTER DETAILS */}
                <div className="col-12 col-lg-3">
                    <div className="info-box rounded h-100">
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
                </div>
                <div className="col-12 col-lg-7">
                    {/* BLOCK CONTAINING ALL CHARACTER STATS */}
                    <div className="info-box rounded py-3 mb-3">
                        <CharacterStatsBlock
                            stats={characterInfo.stats}
                            speed={characterInfo.speed}
                            initiative={characterInfo.initiative}
                            proficiency={characterInfo.proficiency}
                            skills={characterInfo.skills}
                        />
                    </div>
                    <div className="row g-3">
                        {/* BLOCK CONTAINING ALL CHARACTER SKILLS */}
                        <div className="col-12 col-md-7">
                            <div className="info-box rounded h-100">
                                <h3>SKILLS</h3>
                                <SkillsTable skillList={characterInfo.skills} stats={characterInfo.stats} proficiency={characterInfo.proficiency}></SkillsTable>
                            </div>
                        </div>
                        {/* BLOCK CONTAINING ALL CONSUMABLES */}
                        <div className="col-12 col-md-5">
                            <div className="info-box rounded h-100">
                                <ConsumablesTable consumables={characterInfo.consumables} character_id={characterInfo.id}></ConsumablesTable>
                            </div>
                        </div>
                    </div>
                </div>
                {/* BLOCK CONTAINING ALL DICE, SAVE AND DELETE */}
                <div className="col-12 col-lg-2">
                    <div className="info-box rounded p-1 mb-3">
                        <DiceBar />
                    </div>
                    <div className="info-box rounded p-1 mb-3">
                        <button className="character-info-box save-button" onClick={saveCharacter} disabled={saveState.kind === "saving"}>Save Character</button>
                        {
                            saveState.kind === "error"
                                ? <InlineMessage kind="error" text={saveState.text} />
                                : saveState.text ? <p className="text-center m-1" role="status">{saveState.text}</p> : ""
                        }
                    </div>
                    {/* DELETE, with an inline confirmation step */}
                    <div className="mb-3 text-center">
                        {
                            confirmingDelete
                                ? <div role="alert">
                                    <p>Really delete {characterInfo.name}? This can&rsquo;t be undone.</p>
                                    <button className="delete-character-button confirm" onClick={deleteCharacter}>Yes, delete</button>
                                    <button className="cancel-delete-button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                                </div>
                                : <button className="delete-character-button" onClick={() => setConfirmingDelete(true)}>Delete character</button>
                        }
                        <InlineMessage kind="error" text={deleteError} />
                    </div>
                </div>
            </div>
        </div>
    );
};
