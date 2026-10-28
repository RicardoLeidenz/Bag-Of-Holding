import { skillModifier } from "../../rules.js";
export const SkillsTable = (props) => {
    let rows = []
    let skills = props.skillList

    // SEPARATES SKILLS IN PAIRS TO SHOW IN 2 COLUMNS
    for (let i = 0; i < skills.length; i += 2) {
        rows.push(skills.slice(i, i + 2))
    }

    return (
        <table className="">
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

// One skill: name (ability) and its modifier
const SkillCells = ({ skill, stats, proficiency }) => (
    <>
        <td>
            <p>
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
