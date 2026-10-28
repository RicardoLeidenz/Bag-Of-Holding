import { useState, useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import "../../styles/characterSelection.css";

export const CharacterSelection = () => {
    const { store, dispatch } = useGlobalReducer()
    const [characterList, setCharacterList] = useState([]);
    const navigate = useNavigate();

    const checkToken = () => {
        let token = localStorage.getItem("token");
        let user_id = localStorage.getItem("user_id");
        if (token && user_id) {
            getCharacters(user_id);
        }
        else {
            navigate("/");
        }

    }

    const getCharacters = async (user_id) => {
        const response = await apiFetch("api/characters");
        const data = await response.json();
        setCharacterList(data.characters);
    };
    const chooseCharacter = (character) => {
        dispatch({
            type: "select_character",
            payload: character
        });
        console.log(character)
        localStorage.setItem("character_id", character.id)
        navigate("/character");
    }

    useEffect(() => {
        checkToken();
    }, [])

    return (
        <div className="info-box m-5">
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