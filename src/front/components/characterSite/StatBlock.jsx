import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useState } from "react";
import { apiCall } from "../../api.js";
import { abilityModifier, savingThrow, parseWholeNumber } from "../../rules.js";
export const StatBlock = (props) => {
    const { dispatch } = useGlobalReducer()
    // Text in the input while typing; the store keeps the last valid score
    const [statText, setStatText] = useState(String(props.value));
    // Last value stored in the database, to skip saving when nothing changed
    const [savedValue, setSavedValue] = useState(props.value);
    const check = abilityModifier(props.value)
    const saving = savingThrow({ value: props.value, proficient: props.proficient }, props.proficiency)

    const isValidScore = (value) => value !== null && value >= 1 && value <= 30

    // Update the sheet as the user types, so CHK/SAV and skills recalculate immediately
    const showOnSheet = (value) => {
        const updatedStats = props.stats.map(stat => stat.name === props.name ? { ...stat, value: value } : stat);
        dispatch({
            type: "update_stats",
            payload: {
                stats: updatedStats
            }
        });
    }

    const handleChange = (text) => {
        setStatText(text);
        const value = parseWholeNumber(text);
        if (isValidScore(value)) showOnSheet(value);
    }

    // Save once, when the user leaves the field
    const handleBlur = () => {
        const value = parseWholeNumber(statText);
        if (!isValidScore(value)) {
            // Invalid or empty: go back to the saved score, on the input and on the sheet
            setStatText(String(savedValue));
            showOnSheet(savedValue);
            return;
        }
        if (value !== savedValue) saveStat(value);
    }

    // Toggle proficiency in this ability's saving throw (saved immediately)
    const toggleSaveProficiency = async () => {
        const { ok, data } = await apiCall("api/stat", {
            method: "PUT",
            body: JSON.stringify({ "id": props.id, "proficient": !props.proficient }),
        });
        if (!ok) {
            dispatch({ type: "show_notice", payload: { kind: "error", text: `Could not update ${props.name} save: ${data.error}` } });
            return;
        }
        const updatedStats = props.stats.map(stat => stat.id === props.id ? { ...stat, proficient: data["Stat Changed"].proficient } : stat);
        dispatch({ type: "update_stats", payload: { stats: updatedStats } });
    }

    const saveStat = async (value) => {
        const { ok, data } = await apiCall("api/stat", {
            method: "PUT",
            body: JSON.stringify({
                "id": props.id,
                "value": value
            }),
        });
        if (ok) {
            setSavedValue(value);
        } else {
            dispatch({ type: "show_notice", payload: { kind: "error", text: `Could not save ${props.name}: ${data.error}` } });
        }
    };

    return (
        <div className="stat-block-box">
            <div className="stat-block-info m-1 p-1 mt-2">
                <h4>{props.name}</h4>
            </div>
            <div className="stat-block-info m-1 p-1">
                <input
                    type="number"
                    min="1"
                    max="30"
                    className="character-info-input no-spinner"
                    onChange={e => handleChange(e.target.value)}
                    onBlur={handleBlur}
                    value={statText}
                />
            </div>
            <div className="d-flex justify-content-center m-1">
                <div className="stat-block-info me-1 text-center">
                    <label>CHK</label>
                    <h4>{check}</h4>
                </div>
                <div className="stat-block-info ms-1 text-center">
                    <button
                        type="button"
                        className="proficiency-toggle d-block mx-auto"
                        onClick={toggleSaveProficiency}
                        title={(props.proficient ? "Proficient" : "Not proficient") + " in " + props.name + " saves (click to change)"}
                        aria-label={`${props.name} saving throw: ${props.proficient ? "proficient" : "not proficient"}`}
                    >
                        {props.proficient ? "●" : "○"}
                    </button>
                    <label>SAV</label>
                    <h4>{saving}</h4>
                </div>
            </div>
        </div>
    );
};
