import { useRef, useState } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { useNavigate } from "react-router-dom";
import { NameSelector } from "../components/characterCreation/NameSelector.jsx";
import { RaceSelector } from "../components/characterCreation/RaceSelector.jsx";
import { ClassSelector } from "../components/characterCreation/ClassSelector.jsx";
import { SubclassSelector } from "../components/characterCreation/SubclassSelector.jsx";
import { apiCall } from "../api.js";
import { InlineMessage } from "../components/InlineMessage.jsx";
import "../../styles/characterCreator.css";

export const CharacterCreator = () => {
    const { store } = useGlobalReducer()
    const [selectedInput, setSelectedInput] = useState("NAME")
    const [characterName, setCharacterName] = useState("")
    const [characterRace, setCharacterRace] = useState("")
    const [characterClass, setCharacterClass] = useState("")
    const [characterSubClass, setCharacterSubClass] = useState("")
    const [subclasses, setSubclasses] = useState([])
    const [subclassStatus, setSubclassStatus] = useState("idle") // idle | loading | ready | error
    const navigate = useNavigate();
    const [showAlert, setsShowAlert] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    // Blocks a second click immediately (state only updates after the next render)
    const submittingRef = useRef(false)
    const [submitError, setSubmitError] = useState("")


    const saveCharacter = async () => {
        if (characterName && characterRace && characterClass && characterSubClass) {
            // Ignore clicks while saving, so a double click can't create two characters
            if (submittingRef.current) return;
            submittingRef.current = true;
            setSubmitting(true);
            setSubmitError("");
            const { ok, data } = await apiCall("api/character", {
                method: "POST",
                body: JSON.stringify(
                    {
                        "name": characterName,
                        "race": characterRace,
                        "characterClass": characterClass,
                        "subClass": characterSubClass
                    }
                )
            });
            if (!ok) {
                setSubmitError(data.error);
                submittingRef.current = false;
                setSubmitting(false);
                return;
            }
            navigate("/character/" + data.character.id);
        }
        else {
            setsShowAlert(true);
        }
    };

    // Choosing a class loads its subclasses and clears a subclass picked for another class
    const selectClass = async (chosenClass) => {
        setCharacterClass(chosenClass.name);
        setCharacterSubClass("");
        setSubclasses([]);
        setSubclassStatus("loading");
        try {
            const response = await fetch(store.apiURL + "/classes/" + chosenClass.index + "/subclasses");
            if (!response.ok) throw new Error("status " + response.status);
            const data = await response.json();
            setSubclasses(data.results);
            setSubclassStatus("ready");
        } catch (error) {
            setSubclassStatus("error");
        }
    }

    //Toggles between sections for character creation
    const inputSelection = () => {
        switch (selectedInput) {
            //A basic input for NAME
            case "NAME":
                return (
                    <NameSelector setCharacterName={setCharacterName} characterName={characterName} />
                )
            //A Map of all available races
            case "RACE":
                return (
                    <RaceSelector setCharacterRace={setCharacterRace} />
                )
            //A Map of all available classes
            case "CLASS":
                return (
                    <ClassSelector onSelectClass={selectClass} />
                )
            //A Map of all available subclasses
            case "SUBCLASS":
                return (
                    <SubclassSelector subclasses={subclasses} status={subclassStatus} characterClass={characterClass} setCharacterSubClass={setCharacterSubClass} />
                )
            default:
                return ""
        }
    }

    return (
        <div className="text-center mt-5">
            <div className="info-box page-box">
                {
                    showAlert && (!characterName || !characterRace || !characterClass || !characterSubClass)
                        ? <div className="alert alert-danger" role="alert">
                            PLEASE ENTER ALL INFORMATION:<br />
                            <strong>{characterName ? "" : "| NAME |"}{characterRace ? "" : "| RACE |"}{characterClass ? "" : "| CLASS |"}{characterSubClass ? "" : "| SUBCLASS |"}</strong>
                        </div>
                        : ""
                }
                <div className="selector-tabs m-2">
                    {/* Buttons that toggle between character input sections */}
                    <button className="input-selector" onClick={() => setSelectedInput("NAME")}>{characterName ? characterName : "NAME"}</button>
                    <button className="input-selector" onClick={() => setSelectedInput("RACE")}>{characterRace ? characterRace : "RACE"}</button>
                    <button className="input-selector" onClick={() => setSelectedInput("CLASS")}>{characterClass ? characterClass : "CLASS"}</button>
                    <button className="input-selector" onClick={() => setSelectedInput("SUBCLASS")}>{characterSubClass ? characterSubClass : "SUBCLASS"}</button>
                    {/* Submit button automatically sends you to the character site for now */}
                    <button className="input-selector" onClick={saveCharacter} disabled={submitting}>{submitting ? "SAVING..." : "SUBMIT"}</button>
                </div>
                <InlineMessage kind="error" text={submitError} />
                <div className="my-3">
                    {inputSelection()}
                </div>
            </div>
        </div>
    );
}; 