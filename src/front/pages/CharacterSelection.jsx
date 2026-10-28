import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import "../../styles/characterSelection.css";

export const CharacterSelection = () => {
    const [characterList, setCharacterList] = useState([]);
    const navigate = useNavigate();

    const getCharacters = async () => {
        const response = await apiFetch("api/characters");
        if (response.ok) {
            const data = await response.json();
            setCharacterList(data.characters);
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
                <label className="input-selector mt-3">SELECT A CHARACTER</label>
            </div>
            <div className="character-list mt-3">
                {
                    characterList
                        ? characterList.map((character, index) => {
                            return (
                                <div key={index}>
                                    <button className="input-selection" onClick={() => chooseCharacter(character)}>{character.name}</button>
                                </div>
                            )
                        })
                        : ""
                }
                <div>
                    <button className="input-selection" onClick={() => navigate("/charactercreator")}>CREATE NEW</button>
                </div>
            </div>
        </div>
    );
}; 