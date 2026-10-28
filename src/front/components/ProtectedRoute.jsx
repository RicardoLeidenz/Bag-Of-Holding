import { Navigate, Outlet } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

// Wraps routes that need a logged-in user; everyone else is sent to the login page
export const ProtectedRoute = () => {
    const { store } = useGlobalReducer()
    return store.token ? <Outlet /> : <Navigate to="/" replace />
};
