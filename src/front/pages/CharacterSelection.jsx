import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { apiCall } from "../api.js";
import { InlineMessage } from "../components/InlineMessage.jsx";
import "../../styles/characterSelection.css";

export const CharacterSelection = () => {
    const [characterList, setCharacterList] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | ready | error
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const getCharacters = async () => {
        setStatus("loading");
        const { ok, data } = await apiCall("api/characters");
        if (ok) {
            setCharacterList(data.characters);
            setStatus("ready");
        } else {
            setError(data.error);
            setStatus("error");
        }
    };
    const chooseCharacter = (character) => {
        navigate("/character/" + character.id);
    }

    useEffect(() => {
        getCharacters();
    }, [])

    return (
        <div className="info-box page-box">
            <div className="text-center">
                <h1 className="input-selector mt-3 fs-5">SELECT A CHARACTER</h1>
            </div>
            {status === "loading" ? <InlineMessage kind="info" text="Loading your characters..." /> : ""}
            {
                status === "error"
                    ? <div className="text-center">
                        <InlineMessage kind="error" text={error} />
                        <button className="input-selector mt-2" onClick={getCharacters}>TRY AGAIN</button>
                    </div>
                    : ""
            }
            {
                status === "ready" && characterList.length === 0
                    ? <InlineMessage kind="info" text="No characters yet. Create your first adventurer!" />
                    : ""
            }
            <div className="character-list my-3">
                {
                    characterList.map((character) => {
                        return (
                            <div key={character.id}>
                                <button className="input-selection" onClick={() => chooseCharacter(character)}>{character.name}</button>
                            </div>
                        )
                    })
                }
                <div>
                    <button className="input-selection" onClick={() => navigate("/charactercreator")}>CREATE NEW</button>
                </div>
            </div>
        </div>
    );
};
