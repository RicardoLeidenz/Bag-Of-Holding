import useGlobalReducer from "../../hooks/useGlobalReducer";
import { GameDataNotice } from "../GameDataNotice.jsx";

export const ClassSelector = ({ onSelectClass }) => {
    const { store } = useGlobalReducer()
    return (
        <div>
            <h2 className="input-selector mt-3 fs-6">SELECT A CLASS</h2>
            <GameDataNotice />
            <div className="grid-selector-input mt-3">
                {
                    store.classes
                        ? store.classes.map((characterClass, index) => {
                            return (
                                <div key={index}>
                                    <button className="input-selection" onClick={() => onSelectClass(characterClass)}>{characterClass.name}</button>
                                </div>
                            )
                        })
                        : ""
                }
            </div>
        </div>
    );
};