"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import jsonify, Blueprint
from api.models import db, User, Character, Stat, Skill, Consumable
from api.utils import (APIException, limiter, get_json_body,
                       require_string, require_int, require_bool, require_email)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


###### HELPERS ######

def get_current_user():
    # The token's identity is the user id as a string (set in handle_log_in)
    return db.session.get(User, int(get_jwt_identity()))


def get_owned_character(character_id):
    # Returns the character only if it belongs to the logged-in user, otherwise None.
    # Other users' characters are reported as "not found" so their existence isn't revealed.
    return db.session.query(Character).filter_by(
        id=character_id, user_id=int(get_jwt_identity())).first()


# Editable character fields and their allowed ranges (strings: max length matches the model)
CHARACTER_INT_FIELDS = {
    "level": (1, 20),
    "hp": (0, 9999),
    "ac": (0, 99),
    "speed": (0, 999),
    "initiative": (-99, 99),
    "proficiency": (0, 20),
}


###### LOG IN ENDPOINT ######

@api.route('/log_in', methods=['POST'])
@limiter.limit("5 per minute")
def handle_log_in():
    body = get_json_body()
    email = require_email(body)
    password = require_string(body, "password", max_length=128)
    user = User.query.filter_by(email=email).first()
    # Same message for unknown email and wrong password, so attackers can't probe which emails exist
    if not user or not check_password_hash(user.password, password):
        return {"error": "Invalid email or password"}, 401

    token = create_access_token(identity=str(user.id))

    response_body = {
        "message": "Welcome back, adventurer!",
        "user": user.serialize(),
        "token": token
    }

    return jsonify(response_body), 200


###### SIGN UP ENDPOINT ######

@api.route('/sign_up', methods=['POST'])
@limiter.limit("10 per hour")
def handle_sign_up():
    body = get_json_body()
    email = require_email(body)
    password = require_string(body, "password", min_length=8, max_length=128)
    if User.query.filter_by(email=email).first():
        return {"error": "An account with this email already exists"}, 409
    new_user = User(
        email=email,
        password=generate_password_hash(password)
    )
    db.session.add(new_user)
    db.session.commit()
    return {"message": "New user successfully created!", "user": new_user.serialize()}, 201


###### USER ENDPOINTS ######

@api.route('/me', methods=['GET'])
@jwt_required()
def handle_me():
    user = get_current_user()
    if not user:
        return {"error": "Login required"}, 401
    return {"user": user.serialize()}, 200


@api.route('/characters', methods=['GET'])
@jwt_required()
def handle_characters():
    user = get_current_user()
    if not user:
        return {"error": "Login required"}, 401
    response_body = {
        "characters": [character.serialize() for character in user.characters]
    }
    return jsonify(response_body), 200


###### CHARACTER ENDPOINTS ######

@api.route('/character/<int:character_id>', methods=['GET'])
@jwt_required()
def get_character(character_id):
    character = get_owned_character(character_id)
    if character:
        return {"character": character.serialize()}, 200
    else:
        return {"error": "Character not found"}, 404


@api.route('/character', methods=['POST'])
@jwt_required()
def add_character():
    characterInfo = get_json_body()
    new_character = Character(
        user_id=int(get_jwt_identity()),
        name=require_string(characterInfo, "name", max_length=25),
        race=require_string(characterInfo, "race", max_length=15),
        characterClass=require_string(characterInfo, "characterClass", max_length=20),
        subClass=require_string(characterInfo, "subClass", max_length=20),
    )
    db.session.add(new_character)
    db.session.commit()

    #  INITIALIZE CHARACTER STATS
    allStats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
    for i in range(len(allStats)):
        new_stat = Stat(
            name=allStats[i],
            character_id=new_character.id
        )
        db.session.add(new_stat)

    #  INITIALIZE CHARACTER SKILLS
    allSkills = [
        {"name": "ATHLETICS", "ability": "STR"},
        {"name": "ACROBATICS", "ability": "DEX"},
        {"name": "SLEIGHT OF HAND", "ability": "DEX"},
        {"name": "STEALTH", "ability": "DEX"},
        {"name": "ARCANA", "ability": "INT"},
        {"name": "HISTORY", "ability": "INT"},
        {"name": "INVESTIGATION", "ability": "INT"},
        {"name": "NATURE", "ability": "INT"},
        {"name": "RELIGION", "ability": "INT"},
        {"name": "ANIMAL HANDLING", "ability": "WIS"},
        {"name": "INSIGHT", "ability": "WIS"},
        {"name": "MEDICINE", "ability": "WIS"},
        {"name": "PERCEPTION", "ability": "WIS"},
        {"name": "SURVIVAL", "ability": "WIS"},
        {"name": "DECEPTION", "ability": "CHA"},
        {"name": "INTIMIDATION", "ability": "CHA"},
        {"name": "PERFORMANCE", "ability": "CHA"},
        {"name": "PERSUASION", "ability": "CHA"}
    ]

    for skill in allSkills:
        new_skill = Skill(
            name=skill["name"],
            ability=skill["ability"],
            character_id=new_character.id
        )
        db.session.add(new_skill)

    db.session.commit()
    return {"character": new_character.serialize()}, 201


@api.route('/character', methods=['PUT'])
@jwt_required()
def update_character():
    characterInfo = get_json_body()
    character = get_owned_character(require_int(characterInfo, "id", 1, 2**31 - 1))
    if not character:
        return {"error": "Character not found"}, 404

    # Validate every field before changing anything, so a bad value can't cause a partial update
    updates = {}
    for field, (minimum, maximum) in CHARACTER_INT_FIELDS.items():
        value = require_int(characterInfo, field, minimum, maximum, required=False)
        if value is not None:
            updates[field] = value
    hit_dice = require_string(characterInfo, "hitDice", max_length=5, min_length=0, required=False)
    if hit_dice is not None:
        updates["hitDice"] = hit_dice
    name = require_string(characterInfo, "name", max_length=25, required=False)
    if name is not None:
        updates["name"] = name

    for field, value in updates.items():
        setattr(character, field, value)
    db.session.commit()
    return {"Character updated": character.serialize()}, 200


@api.route('/character', methods=['DELETE'])
@jwt_required()
def delete_character():
    characterInfo = get_json_body()
    character = get_owned_character(require_int(characterInfo, "id", 1, 2**31 - 1))
    if not character:
        return {"error": "Character not found"}, 404
    db.session.delete(character)
    db.session.commit()
    return {"Character deleted": character.serialize()}, 200


###### STAT ENDPOINTS ######


@api.route('/stat', methods=['PUT'])
@jwt_required()
def update_stat():
    # Updates the score ("value"), the saving throw proficiency ("proficient"), or both
    statInfo = get_json_body()
    stat_id = require_int(statInfo, "id", 1, 2**31 - 1)
    value = require_int(statInfo, "value", 1, 30, required=False)
    proficient = require_bool(statInfo, "proficient", required=False)
    if value is None and proficient is None:
        raise APIException("'value' or 'proficient' is required")
    updated_stat = db.session.get(Stat, stat_id)
    if not updated_stat or not get_owned_character(updated_stat.character_id):
        return {"error": "Stat not found"}, 404
    if value is not None:
        updated_stat.value = value
    if proficient is not None:
        updated_stat.proficient = proficient
    db.session.commit()
    return {"Stat Changed": updated_stat.serialize()}, 200


###### SKILL ENDPOINTS ######

@api.route('/skill', methods=['PUT'])
@jwt_required()
def update_skill():
    skillInfo = get_json_body()
    skill_id = require_int(skillInfo, "id", 1, 2**31 - 1)
    proficient = require_bool(skillInfo, "proficient", required=False)
    expert = require_bool(skillInfo, "expert", required=False)
    if proficient is None and expert is None:
        raise APIException("'proficient' or 'expert' is required")
    skill = db.session.get(Skill, skill_id)
    if not skill or not get_owned_character(skill.character_id):
        return {"error": "Skill not found"}, 404

    if proficient is not None:
        skill.proficient = proficient
    if expert is not None:
        skill.expert = expert
    # 5e rule: expertise requires proficiency
    if expert:
        skill.proficient = True
    if proficient is False:
        skill.expert = False
    db.session.commit()
    return {"Skill Changed": skill.serialize()}, 200


###### CONSUMABLES ENDPOINTS ######

@api.route('/consumable', methods=['POST'])
@jwt_required()
def add_consumable():
    consumableInfo = get_json_body()
    character_id = require_int(consumableInfo, "character_id", 1, 2**31 - 1)
    name = require_string(consumableInfo, "name", max_length=25)
    if not get_owned_character(character_id):
        return {"error": "Character not found"}, 404
    new_consumable = Consumable(character_id=character_id, name=name)
    db.session.add(new_consumable)
    db.session.commit()
    return {"Consumable Created": new_consumable.serialize()}, 201


@api.route('/consumable', methods=['PUT'])
@jwt_required()
def update_consumable():
    consumableInfo = get_json_body()
    consumable_id = require_int(consumableInfo, "id", 1, 2**31 - 1)
    amount = require_int(consumableInfo, "amount", 0, 9999)
    updated_consumable = db.session.get(Consumable, consumable_id)
    if not updated_consumable or not get_owned_character(updated_consumable.character_id):
        return {"error": "Consumable not found"}, 404
    updated_consumable.amount = amount
    db.session.commit()
    return {"Consumable Changed": updated_consumable.serialize()}, 200


@api.route('/consumable', methods=['DELETE'])
@jwt_required()
def delete_consumable():
    consumableInfo = get_json_body()
    consumable_to_delete = db.session.get(
        Consumable, require_int(consumableInfo, "id", 1, 2**31 - 1))
    if not consumable_to_delete or not get_owned_character(consumable_to_delete.character_id):
        return {"error": "Consumable not found"}, 404
    db.session.delete(consumable_to_delete)
    db.session.commit()
    return {"Consumable Deleted": consumable_to_delete.serialize()}, 200
