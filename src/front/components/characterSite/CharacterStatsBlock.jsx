import { StatBlock } from "./StatBlock";
import { CharacterNumberInput } from "./CharacterNumberInput";
import { passivePerception } from "../../rules.js";
export const CharacterStatsBlock = (props) => {
    const passivePer = passivePerception(props.skills, props.stats, props.proficiency)
    const sortedStats = [...props.stats].sort((a, b) => a.id - b.id);
    return (
        <div>
            <div className="row m-auto">
                {
                    /* MAP OF A LIST CONTAINING THE INFORMATION ON ALL STATS*/
                    sortedStats.map((stat) => {
                        return (
                            <div className="col-2" key={stat.id}>
                                <StatBlock
                                    name={stat.name}
                                    value={stat.value}
                                    id={stat.id}
                                    proficient={stat.proficient}
                                    proficiency={props.proficiency}
                                    stats={props.stats}
                                />
                            </div>
                        )
                    })
                }
            </div>
            <div className="d-flex mt-3">
                <div className="stat-block-box w-25 m-1">
                    <h4 className="stat-block-info p-1">SPEED</h4>
                    <h4>
                        <CharacterNumberInput field="speed" value={props.speed} min={0} max={999} className="stat-block-info no-spinner" />
                    </h4>
                </div>
                <div className="stat-block-box w-25 m-1">
                    <h4 className="stat-block-info p-1">INITIATIVE</h4>
                    <h4>
                        <CharacterNumberInput field="initiative" value={props.initiative} min={-99} max={99} className="stat-block-info no-spinner" />
                    </h4>
                </div>
                <div className=" stat-block-box w-25 m-1">
                    <h4 className="stat-block-info p-1">PROFICIENCY</h4>
                    <h4>
                        <CharacterNumberInput field="proficiency" value={props.proficiency} min={0} max={20} className="stat-block-info no-spinner" />
                    </h4>
                </div>
                <div className=" stat-block-box w-25 m-1">
                    <h4 className="stat-block-info p-1">PASSIVE PER</h4>
                    <h4 className="stat-block-info p-1">{passivePer}</h4>
                </div>
            </div>
        </div>
    )
};
