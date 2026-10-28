import { Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import InputForm from "../components/signUpLogIn/SignUpLogInInterface.jsx";

export const Home = () => {

	const { store } = useGlobalReducer()

	// Logged-in users skip the login form
	if (store.token) return <Navigate to="/characterselection" replace />

	return (
		<div className="home-container">
			<InputForm />
		</div>
	);
}; 