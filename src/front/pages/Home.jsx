import { Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import InputForm from "../components/signUpLogIn/SignUpLogInInterface.jsx";

export const Home = () => {

	const { store } = useGlobalReducer()

	// Logged-in users skip the login form
	if (store.token) return <Navigate to="/characterselection" replace />

	return (
		<div className="home-container">
			<header className="brand-hero">
				<img src="/logo.svg" alt="" />
				<div>
					<h1 className="brand-wordmark">BAG OF HOLDING</h1>
					<p className="brand-tagline">MANAGE · EXPLORE · ADVENTURE</p>
				</div>
			</header>
			<InputForm />
		</div>
	);
}; 