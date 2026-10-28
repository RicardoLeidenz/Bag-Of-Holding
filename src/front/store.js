import { getToken } from "./api.js";

export const initialStore = () => {
  return {
    characterInfo: {},
    races: [],
    classes: [],
    spells: [],
    // Races, classes and spells from dnd5eapi.co: "loading" | "ready" | "error"
    gameDataStatus: "loading",
    user: null,
    inventoryList: [],
    bagItems: [],
    selectedCharacter: null,
    characters: [],
    loading: false,
    error: null,
    // Restore the login saved in the browser, so a page refresh keeps the user logged in
    token: getToken(),
    // Short message shown at the bottom of the screen: { id, kind: "error" | "success", text }
    notice: null,
    apiURL: "https://www.dnd5eapi.co/api/2014",
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_races":
      return {
        ...store,
        races: action.payload,
      };

    case "set_classes":
      return {
        ...store,
        classes: action.payload,
      };

    case "set_spells":
      return {
        ...store,
        spells: action.payload,
      };
    case "set_game_data_status":
      return {
        ...store,
        gameDataStatus: action.payload,
      };

    case "show_notice":
      return {
        ...store,
        notice: { id: Date.now(), kind: action.payload.kind || "error", text: action.payload.text },
      };

    case "hide_notice":
      // Only hide the notice that asked to be hidden (a newer one may have replaced it)
      return store.notice && store.notice.id === action.payload
        ? { ...store, notice: null }
        : store;

    case "log_in":
      return {
        ...store,
        token: action.payload.token,
      };

    case "log_out":
      return {
        ...store,
        token: null,
        characterInfo: {},
      };

    case "select_character":
      return {
        ...store,
        characterInfo: action.payload,
      };

    // Merges edited fields (e.g. { hp: 25 }) into the current character
    case "update_character_fields":
      return {
        ...store,
        characterInfo: {
          ...store.characterInfo,
          ...action.payload,
        },
      };

    case "update_consumables":
      return {
        ...store,
        characterInfo: {
          ...store.characterInfo,
          consumables: action.payload.consumables,
        },
      };

    case "update_skill":
      return {
        ...store,
        characterInfo: {
          ...store.characterInfo,
          skills: store.characterInfo.skills.map((skill) =>
            skill.id === action.payload.id ? action.payload : skill
          ),
        },
      };

    case "clear_character":
      return {
        ...store,
        characterInfo: {},
      };

    case "update_stats":
      return {
        ...store,
        characterInfo: {
          ...store.characterInfo,
          stats: action.payload.stats,
        },
      };

    case "set_inventory":
      return { ...store, inventoryList: action.payload };

    case "set_bag_items":
      return { ...store, bagItems: action.payload };

    case "add_bag_item":
      return { ...store, bagItems: [...store.bagItems, action.payload] };

    case "remove_bag_item":
      return {
        ...store,
        bagItems: store.bagItems.filter((item) => item.id !== action.payload),
      };

    case "update_bag_item":
      return {
        ...store,
        bagItems: store.bagItems.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    default:
      throw Error("unknown action");
  }
}
