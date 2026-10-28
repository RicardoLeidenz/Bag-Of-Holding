import { useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { parseWholeNumber } from "../../rules.js";

// Number input for one character field (level, hp...). Updates the sheet as the user types,
// so "Save Character" always sends what's on screen; an invalid entry reverts on blur.
// min/max match the backend's validation ranges.
export const CharacterNumberInput = ({ field, value, min, max, id, className }) => {
    const { dispatch } = useGlobalReducer();
    const [text, setText] = useState(String(value ?? ""));
    // Value when the user clicked into the field, restored if they leave it invalid
    const [startValue, setStartValue] = useState(value);
    const isValid = (number) => number !== null && number >= min && number <= max;

    const handleChange = (newText) => {
        setText(newText);
        const number = parseWholeNumber(newText);
        if (isValid(number)) {
            dispatch({ type: "update_character_fields", payload: { [field]: number } });
        }
    };

    return (
        <input
            id={id}
            type="number"
            min={min}
            max={max}
            className={className}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setStartValue(value)}
            onBlur={() => {
                if (!isValid(parseWholeNumber(text))) {
                    setText(String(startValue));
                    dispatch({ type: "update_character_fields", payload: { [field]: startValue } });
                }
            }}
            value={text}
        />
    );
};
