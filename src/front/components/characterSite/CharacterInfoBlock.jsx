import { useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { CharacterNumberInput } from "./CharacterNumberInput";
export const CharacterInfoBlock = (props) => {
    const { dispatch } = useGlobalReducer();
    const [startName, setStartName] = useState(props.name);
    return (
        //  ALL THIS INFORMATION IS SUPPOSED TO BE SELECTED USING THE DND API WITH ALL CHARACTER OPTIONS
        <div>
            {/* CHARACTER PICTURE */}
            <img src="https://i.pinimg.com/236x/aa/00/72/aa0072133c6bb0e1d968052509292a89.jpg" className="character-picture m-3"></img>

            {/* CHARACTER NAME */}
            <div className="character-info-box m-3">
                <label htmlFor="name">NAME</label>
                <input
                    id="name"
                    type="text"
                    maxLength={25}
                    className="character-info-input"
                    onFocus={() => setStartName(props.name)}
                    onChange={e => dispatch({ type: "update_character_fields", payload: { name: e.target.value } })}
                    // A character needs a name: an empty one goes back to what it was
                    onBlur={() => { if (props.name.trim() === "") dispatch({ type: "update_character_fields", payload: { name: startName } }) }}
                    value={props.name}
                />
            </div>

            {/* CHARACTER RACE */}
            <div className="character-info-box m-3">
                <label htmlFor="race">RACE</label>
                <h5 id="race">{props.race}</h5>
            </div>

            {/* CHARACTER LEVEL */}
            <div className="character-info-box m-3">
                <label htmlFor="level">LEVEL</label>
                <CharacterNumberInput id="level" field="level" value={props.level} min={1} max={20} className="character-info-input no-spinner" />
            </div>

            {/* CHARACTER CLASS */}
            <div className="character-info-box m-3">
                <label htmlFor="cClass">CLASS</label>
                <h5 id="cClass">{props.characterClass}</h5>
            </div>

            {/* CHARACTER SUBCLASS */}
            <div className="character-info-box m-3">
                <label htmlFor="subClass">SUBCLASS</label>
                <h5 id="subClass">{props.subClass}</h5>
            </div>
            {/* CHARACTER HP/AC/HITDICE*/}
            <div className="d-flex">
                <div className="character-info-box mx-3 p-2 w-25">
                    <label htmlFor="hp">HP</label>
                    <CharacterNumberInput id="hp" field="hp" value={props.hp} min={0} max={9999} className="character-info-input no-spinner" />
                </div>
                <div className="character-info-box mx-3 p-2 w-25">
                    <label htmlFor="ac">AC</label>
                    <CharacterNumberInput id="ac" field="ac" value={props.ac} min={0} max={99} className="character-info-input no-spinner" />
                </div>
                <div className="character-info-box mx-3 p-2 w-25">
                    <label htmlFor="hitDice">HIT DICE</label>
                    <input
                        id="hitDice"
                        type="text"
                        className="character-info-input"
                        maxLength={5}
                        onChange={e => dispatch({ type: "update_character_fields", payload: { hitDice: e.target.value } })}
                        value={props.hitDice}
                    />
                </div>
            </div>
        </div>
    )
};