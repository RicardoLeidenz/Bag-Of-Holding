// Shows the subclasses of the chosen class (loaded by CharacterCreator)
export const SubclassSelector = ({ subclasses, characterClass, setCharacterSubClass }) => {
    return (
        <div>
            <label className="input-selector mt-3">SELECT A SUBCLASS</label>
            <div className="grid-selector-input mt-3">
                {
                    !characterClass
                        ? <p className="text-white">Choose a class first</p>
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
