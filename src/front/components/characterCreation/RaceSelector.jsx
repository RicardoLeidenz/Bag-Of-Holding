import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";
import { GameDataNotice } from "../GameDataNotice.jsx";

export const RaceSelector = ({ setCharacterRace }) => {
    const { store } = useGlobalReducer()
    return (
        <div>
            <h2 className="input-selector mt-3 fs-6">SELECT A RACE</h2>
            <GameDataNotice />
            <div className="grid-selector-input mt-3">
                {
                    store.races
                        ? store.races.map((race, index) => {
                            return (
                                <div key={index} >
                                    <button className="input-selection" onClick={() => setCharacterRace(race.name)}>{race.name}</button>
                                </div>
                            )
                        })
                        : ""
                }
            </div>
        </div>
    );
};