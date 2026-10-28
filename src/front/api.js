// Base URL of the Flask API, always ending in "/".
// Leave VITE_BACKEND_URL unset to use the same site: in production Flask serves the app itself,
// and in development Vite forwards /api requests to Flask (see vite.config.js).
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "/").replace(/\/*$/, "/")

const TOKEN_KEY = "token"

// Fired when the server rejects our token; Layout listens for it and logs the user out
export const SESSION_EXPIRED_EVENT = "session-expired"

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const saveSession = (token) => localStorage.setItem(TOKEN_KEY, token)

export const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY)
    // Keys used by earlier versions of the app
    localStorage.removeItem("user_id")
    localStorage.removeItem("character_id")
}

// Calls the Flask API, adding the JSON header and the logged-in user's token
export const apiFetch = async (path, options = {}) => {
    const token = getToken()
    const response = await fetch(backendUrl + path.replace(/^\/+/, ""), {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...options.headers
        }
    })
    // A 401 on a request that carried a token means the login expired or is invalid.
    // (Without a token, 401 is just a failed login attempt and is handled by the caller.)
    if (response.status === 401 && token) {
        clearSession()
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return response
}
