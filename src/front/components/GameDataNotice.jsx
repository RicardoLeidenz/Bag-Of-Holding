import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { InlineMessage } from "./InlineMessage.jsx";

// Explains why races/classes/spells are missing while they load from dnd5eapi.co, or if that failed
export const GameDataNotice = () => {
    const { store } = useGlobalReducer();
    if (store.gameDataStatus === "loading") {
        return <InlineMessage kind="info" text="Loading D&D rules data..." />;
    }
    if (store.gameDataStatus === "error") {
        return (
            <div className="text-center">
                <InlineMessage kind="error" text="Could not load races, classes and spells from dnd5eapi.co. Check your connection." />
                <button className="input-selector mt-2" onClick={() => window.location.reload()}>RELOAD</button>
            </div>
        );
    }
    return null;
};
