// Shows the subclasses of the chosen class (loaded by CharacterCreator)
export const SubclassSelector = ({ subclasses, status, characterClass, setCharacterSubClass }) => {
    return (
        <div>
            <h2 className="input-selector mt-3 fs-6">SELECT A SUBCLASS</h2>
            <div className="grid-selector-input mt-3">
                {
                    !characterClass
                        ? <p className="text-white">Choose a class first</p>
                        : status === "loading"
                        ? <p className="text-white">Loading subclasses...</p>
                        : status === "error"
                        ? <p className="text-white">Could not load subclasses from the D&amp;D rules site. Pick the class again to retry.</p>
                        : subclasses.map((subClass) => {
                            return (
                                <div key={subClass.index}>
                                    <button className="input-selection" onClick={() => setCharacterSubClass(subClass.name)}>{subClass.name}</button>
                                </div>
                            )
                        })
                }
            </div>
        </div>
    );
};
