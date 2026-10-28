import { skillModifier } from "../../rules.js";
import { apiCall } from "../../api.js";
import useGlobalReducer from "../../hooks/useGlobalReducer";
export const SkillsTable = (props) => {
    let rows = []
    let skills = props.skillList

    // SEPARATES SKILLS IN PAIRS TO SHOW IN 2 COLUMNS
    for (let i = 0; i < skills.length; i += 2) {
        rows.push(skills.slice(i, i + 2))
    }

    return (
        <table className="w-100">
            <tbody>
                {rows.map((pair, index) => (
                    // IN EACH ROW WE SHOW THE SKILL NAME AND THE ABILITY IT BRANCHES FROM
                    <tr key={index}>
                        {pair.map(skill => (
                            <SkillCells key={skill.id} skill={skill} stats={props.stats} proficiency={props.proficiency} />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
};

// Proficiency marker for each level: none → proficient → expertise → none
const PROFICIENCY_LEVELS = {
    none: { symbol: "○", label: "Not proficient" },
    proficient: { symbol: "●", label: "Proficient" },
    expert: { symbol: "★", label: "Expertise" },
}

// One skill: proficiency toggle, name (ability) and its modifier
const SkillCells = ({ skill, stats, proficiency }) => {
    const { dispatch } = useGlobalReducer();
    const level = skill.expert ? "expert" : skill.proficient ? "proficient" : "none";

    const cycleProficiency = async () => {
        // The server keeps the rule that expertise requires proficiency
        const change = level === "none" ? { proficient: true }
            : level === "proficient" ? { expert: true }
            : { proficient: false };
        const { ok, data } = await apiCall("api/skill", {
            method: "PUT",
            body: JSON.stringify({ id: skill.id, ...change }),
        });
        if (ok) {
            dispatch({ type: "update_skill", payload: data["Skill Changed"] });
        } else {
            dispatch({ type: "show_notice", payload: { kind: "error", text: `Could not update ${skill.name}: ${data.error}` } });
        }
    };

    return (
    <>
        <td>
            <p>
                <button
                    type="button"
                    className="proficiency-toggle"
                    onClick={cycleProficiency}
                    title={PROFICIENCY_LEVELS[level].label + " (click to change)"}
                    aria-label={`${skill.name}: ${PROFICIENCY_LEVELS[level].label}`}
                >
                    {PROFICIENCY_LEVELS[level].symbol}
                </button>
                <strong>{skill.name}</strong>{' '}({skill.ability})
            </p>
        </td>
        <td>
            <p className="float-end mx-2">
                {skillModifier(skill, stats, proficiency)}
            </p>
        </td>
    </>
    );
};
