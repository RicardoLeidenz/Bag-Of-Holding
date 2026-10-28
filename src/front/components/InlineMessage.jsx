// A message shown next to a form: kind is "error", "success" or "info". Renders nothing when empty.
export const InlineMessage = ({ kind = "error", text }) => {
    if (!text) return null;
    return (
        <p className={"inline-message " + kind} role={kind === "error" ? "alert" : "status"}>
            {text}
        </p>
    );
};
