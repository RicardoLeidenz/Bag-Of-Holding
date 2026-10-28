import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useState } from "react";
import { apiFetch } from "../../api.js";
import { parseWholeNumber } from "../../rules.js";
export const ConsumablesTable = (props) => {
    const { dispatch } = useGlobalReducer();
    const [consumables, setConsumables] = useState(props.consumables || [])
    const [newConsumable, setNewConsumable] = useState("")
    // Amounts being typed, by consumable id; saved when the input loses focus
    const [drafts, setDrafts] = useState({})

    // Keep this table and the store's character in sync
    const setList = (updated) => {
        setConsumables(updated);
        dispatch({
            type: "update_consumables",
            payload: {
                consumables: updated
            },
        });
    }

    const addConsumable = async () => {
        const name = newConsumable.trim();
        if (name === "") return;
        const response = await apiFetch("api/consumable", {
            method: "POST",
            body: JSON.stringify({
                "name": name,
                "character_id": props.character_id
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || "Could not add consumable");
            return;
        }
        // Use the consumable the server created, so it has its real id
        setList([...consumables, data["Consumable Created"]]);
    };

    const saveAmount = async (consumable) => {
        const text = drafts[consumable.id];
        setDrafts(({ [consumable.id]: _, ...rest }) => rest);
        const amount = parseWholeNumber(text ?? "");
        if (amount === null || amount < 0 || amount > 9999 || amount === consumable.amount) return;

        const response = await apiFetch("api/consumable", {
            method: "PUT",
            body: JSON.stringify({
                "id": consumable.id,
                "amount": amount
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || "Could not save amount");
            return;
        }
        setList(consumables.map(c => c.id === consumable.id ? data["Consumable Changed"] : c));
    };

    return (
        <div className="d-flex">
            <table className="m-2">
                <thead>
                    <tr>
                        <th>Consumable</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        // Simply maps through an array of Consumables and lists the name and amount left
                        consumables.map((consumable) => (
                            <tr key={consumable.id}>
                                <td>
                                    <h5 className="float-start">
                                        <strong>{consumable.name}</strong>
                                    </h5>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        className="consumableCount"
                                        value={drafts[consumable.id] ?? consumable.amount}
                                        onChange={(e) => setDrafts({ ...drafts, [consumable.id]: e.target.value })}
                                        onBlur={() => saveAmount(consumable)}
                                    />
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            {/* ADD NEW CONSUMABLE BUTTON */}
            <button
                className="addConsumableButton"
                data-bs-toggle="modal"
                data-bs-target="#addConsumable"
                onClick={() => setNewConsumable("")}
            >
                Add
            </button>
            {/* ADD NEW CONSUMABLE MODAL */}
            <div className="modal fade accent" id="addConsumable" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title" id="exampleModalLabel">ADD CONSUMABLE</h2>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="consumableName">Name your consumable</label>
                            {/* NEW CONSUMABLE NAME INPUT */}
                            <input className="new-consumable-input" type="text" id="consumableName" name="name" maxLength={25} onChange={e => setNewConsumable(e.target.value)} value={newConsumable} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="close-modal-btn" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="addConsumableButton" onClick={addConsumable} data-bs-dismiss="modal">Save</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
};
