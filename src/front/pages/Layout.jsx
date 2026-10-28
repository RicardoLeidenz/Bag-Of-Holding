import { Outlet, useNavigate } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { SESSION_EXPIRED_EVENT } from "../api.js";

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
//FETCH REQUEST FOR CLASS AND RUN THROUGH A USEEFFECT UPON MOUNT

export const Layout = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    // Fecth all Races and save them to store.js
    const getRaces = (url) => {
        fetch(url)
            .then(
                (allRaces) => {
                    return allRaces.json()
                }
            )
            .then(
                (data) => {
                    dispatch({
                        type: "set_races",
                        payload: data.results
                    });
                }
            )
    }
    // Fecth all Classes and save them to store.js
    const getClasses = (url) => {
        fetch(url)
            .then(
                (allClasses) => {
                    return allClasses.json()
                }
            )
            .then(
                (data) => {
                    dispatch({
                        type: "set_classes",
                        payload: data.results
                    });
                }
            )
    }
    // Fecth all Subclasses and save them to store.js
    const getSubClasses = (url) => {
        fetch(url)
            .then(
                (allSubClasses) => {
                    return allSubClasses.json()
                }
            )
            .then(
                (data) => {
                    dispatch({
                        type: "set_subclasses",
                        payload: data.results
                    });
                }
            )
    }
    // Fecth all Subclasses and save them to store.js
    const getSpells = (url) => {
        fetch(url)
            .then(
                (allSpells) => {
                    return allSpells.json()
                }
            )
            .then(
                (data) => {
                    dispatch({
                        type: "set_spells",
                        payload: data.results
                    });
                }
            )
    }
    // Call all Fetch functions upon mount
    useEffect(() => {
        getRaces(store.apiURL + "/races");
        getClasses(store.apiURL + "/classes");
        getSubClasses(store.apiURL + "/subclasses");
        getSpells(store.apiURL + "/spells");
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
        </ScrollToTop>
    )
}