const backendUrl = import.meta.env.VITE_BACKEND_URL

// Calls the Flask API, adding the JSON header and the logged-in user's token
export const apiFetch = (path, options = {}) => {
    const token = localStorage.getItem("token")
    return fetch(backendUrl + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...options.headers
        }
    })
}
