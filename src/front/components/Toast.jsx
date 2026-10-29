import { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

// Shows store.notice at the bottom of the screen for a few seconds.
// Components show one with: dispatch({ type: "show_notice", payload: { kind: "error", text: "..." } })
export const Toast = () => {
    const { store, dispatch } = useGlobalReducer();
    const notice = store.notice;

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => dispatch({ type: "hide_notice", payload: notice.id }), 6000);
        return () => clearTimeout(timer);
    }, [notice, dispatch]);

    return (
        // The live region is always present so screen readers announce new messages
        <div className="toast-region" aria-live="polite">
            {
                notice
                    ? <div className={"app-toast " + notice.kind} role={notice.kind === "error" ? "alert" : "status"}>
                        <span>{notice.text}</span>
                        <button
                            type="button"
                            className="app-toast-close"
                            aria-label="Dismiss message"
                            onClick={() => dispatch({ type: "hide_notice", payload: notice.id })}
                        >
                            ✕
                        </button>
                    </div>
                    : ""
            }
        </div>
    );
};
