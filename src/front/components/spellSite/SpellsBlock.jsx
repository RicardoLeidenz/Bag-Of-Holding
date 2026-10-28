import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";

export const SpellsBlock = (props) => {
    const { store, dispatch } = useGlobalReducer()

    // Gets list of all spells of the level passed as prop
    const getSpellsByLevel = () => {
        return store.spells.filter(spell => spell.level == props.lvl);
    }

    // Fetch Selected Spell Information
    const getSpellInfo = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("status " + response.status);
            // Pass information to SpellList.jsx through UseState
            props.setSpellSelected(await response.json());
        } catch (error) {
            dispatch({ type: "show_notice", payload: { kind: "error", text: "Could not load that spell. Check your connection and try again." } });
        }
    }

    return (
        <div className="info-box spells-box">
            <h2 className="stat-block-info">{props.lvl == 0 ? "CANTRIPS" : "LEVEL " + props.lvl}</h2>
            <div className="spells-options">
                {
                    store.spells
                        ? getSpellsByLevel().map((spell, index) => {
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    className="spell-option"
                                    onClick={() => getSpellInfo(store.apiURL + "/spells/" + spell.index)}
                                >{spell.name}</button>
                            )
                        })
                        : ""
                }
            </div>
        </div>
    )
};