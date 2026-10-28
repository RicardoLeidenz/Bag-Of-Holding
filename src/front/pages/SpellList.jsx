import { useEffect, useRef, useState } from "react";
import { SpellsBlock } from "../components/spellSite/SpellsBlock.jsx";
import { SpellBasicInfo } from "../components/spellSite/SpellBasicInfo.jsx";
import { SpellBonusInfo } from "../components/spellSite/SpellBonusInfo.jsx";
import "../../styles/spellList.css";

export const SpellList = () => {
    const [spellSelected, setSpellSelected] = useState({})
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const infoBox = useRef(null)
    const deselect = () => {
        setSpellSelected({});
    }
    // On phones and tablets the details are below the list, so bring them into view.
    // Runs after the details render, so the page is already tall enough to scroll to them.
    useEffect(() => {
        if (spellSelected.name && window.matchMedia("(max-width: 991.98px)").matches) {
            infoBox.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [spellSelected.name])

    return (
        <div className="container-fluid text-center text-white my-3">
            <div className="row g-3 px-sm-2">
                {/* ALL SPELL LEVELS: as many per row as fit the screen */}
                <div className="col-12 col-lg-9">
                    <div className="spell-levels">
                        {
                            levels.map(
                                lvl => (
                                    <SpellsBlock key={lvl} lvl={lvl} setSpellSelected={setSpellSelected} />
                                )
                            )
                        }
                    </div>
                </div>
                {/* SPELL INFORMATION BOX */}
                <div className="col-12 col-lg-3">
                    <div className="info-box spell-info-panel" ref={infoBox}>
                        {/* NAME OF THE SPELL */}
                        <div className="spell-name">
                            <h2>
                                {
                                    spellSelected.name
                                        ? spellSelected.name
                                        : "Select a spell"
                                }
                            </h2>
                        </div>
                        {/* SPELL BASIC INFORMATION */}
                        <SpellBasicInfo spell={spellSelected} />
                        {/* SPELL DESCRIPTION */}
                        {
                            spellSelected.desc
                                ? <SpellBonusInfo info={spellSelected.desc} type="Description" />
                                : ""
                        }
                        {/* SPELL HIGHER LEVEL CONDITIONS IF ANY */}
                        {
                            spellSelected.higher_level
                                ? <SpellBonusInfo info={spellSelected.higher_level} type="Higher Level" />
                                : ""
                        }
                        {/* IF SHOWING A SPELL SHOWS A BUTTON TO "CLOSE" SPELL WHICH SIMPLY RESETS spellSelected to {} */}
                        {
                            spellSelected.name
                                ? <button className="close-button m-3" onClick={deselect}>Close</button>
                                : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}; 