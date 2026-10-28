import { Outlet, useNavigate } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Toast } from "../components/Toast"
import { useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { SESSION_EXPIRED_EVENT } from "../api.js";

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
// It also loads the D&D reference data (races, classes, spells) once for the whole app.

export const Layout = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    // Fetch races, classes and spells from dnd5eapi.co and save them to store.js
    const loadGameData = async () => {
        dispatch({ type: "set_game_data_status", payload: "loading" });
        try {
            const [races, classes, spells] = await Promise.all(
                ["races", "classes", "spells"].map(async (list) => {
                    const response = await fetch(store.apiURL + "/" + list);
                    if (!response.ok) throw new Error(list + ": status " + response.status);
                    return (await response.json()).results;
                })
            );
            dispatch({ type: "set_races", payload: races });
            dispatch({ type: "set_classes", payload: classes });
            dispatch({ type: "set_spells", payload: spells });
            dispatch({ type: "set_game_data_status", payload: "ready" });
        } catch (error) {
            dispatch({ type: "set_game_data_status", payload: "error" });
        }
    }

    // Load the reference data upon mount
    useEffect(() => {
        loadGameData();
    }, [])

    // When the server rejects our login token (expired or invalid), log out and go to the login page
    useEffect(() => {
        const handleExpired = () => {
            dispatch({ type: "log_out" });
            navigate("/");
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    }, [])
    return (
        <ScrollToTop>
            <Navbar />
            <Outlet />
            <Footer />
            <Toast />
        </ScrollToTop>
    )
}