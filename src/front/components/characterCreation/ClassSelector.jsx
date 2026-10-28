import useGlobalReducer from "../../hooks/useGlobalReducer";

export const ClassSelector = ({ onSelectClass }) => {
    const { store } = useGlobalReducer()
    return (
        <div>
            <label className="input-selector mt-3" htmlFor="name">SELECT A CLASS</label>
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