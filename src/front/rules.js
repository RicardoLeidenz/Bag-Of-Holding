// D&D 5e rules used by the character sheet

// Ability modifier: 10-11 → +0, 12-13 → +1, 8-9 → -1 ...
export const abilityModifier = (score) => Math.floor((Number(score) - 10) / 2)

// Skill modifier: ability modifier, plus proficiency bonus (double with expertise)
export const skillModifier = (skill, stats, proficiency) => {
    const abilityStat = stats.find(stat => stat.name === skill.ability)
    const base = abilityStat ? abilityModifier(abilityStat.value) : 0
    if (skill.expert) return base + Number(proficiency) * 2
    if (skill.proficient) return base + Number(proficiency)
    return base
}

// Saving throw: ability modifier, plus proficiency bonus if proficient in that save
export const savingThrow = (stat, proficiency) =>
    abilityModifier(stat.value) + (stat.proficient ? Number(proficiency) : 0)

// Passive Perception: 10 + Perception skill modifier
export const passivePerception = (skills, stats, proficiency) => {
    const perception = skills.find(skill => skill.name === "PERCEPTION")
    return 10 + (perception ? skillModifier(perception, stats, proficiency) : 0)
}

// Parses a number typed into an input; returns null while the text isn't a whole number
export const parseWholeNumber = (text) => {
    const trimmed = String(text).trim()
    return /^-?\d+$/.test(trimmed) ? Number(trimmed) : null
}
