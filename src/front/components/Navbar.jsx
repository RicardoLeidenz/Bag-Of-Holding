import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { clearSession } from "../api.js";

export const Navbar = () => {
	const { store, dispatch } = useGlobalReducer();
	const navigate = useNavigate();
	const location = useLocation();
	const token = store.token;
	const currentCharacterId = store.characterInfo.id;
	// Small screens show a ☰ button; the menu opens below the bar
	const [menuOpen, setMenuOpen] = useState(false);

	// Close the menu after navigating to another page
	useEffect(() => {
		setMenuOpen(false);
	}, [location.pathname]);

	const logOut = () => {
		clearSession();
		dispatch({ type: "log_out" });
		navigate("/");
	}
	return (
		<nav className="navbar navbar-expand-lg header-secondary px-3">
			<Link to={token ? "/characterselection" : "/"} className="navbar-brand mb-0 accent">
				<img src="/logo.svg" alt="" className="navbar-logo" />
				BAG OF HOLDING
			</Link>
			{
				token
					? <>
						<button
							type="button"
							className="navbar-toggler-custom d-lg-none"
							aria-controls="main-menu"
							aria-expanded={menuOpen}
							aria-label={menuOpen ? "Close menu" : "Open menu"}
							onClick={() => setMenuOpen(!menuOpen)}
						>
							{menuOpen ? "✕" : "☰"}
						</button>
						<div id="main-menu" className={"collapse navbar-collapse" + (menuOpen ? " show" : "")}>
							<div className="navbar-nav ms-auto">
								<Link to="/characterselection" className="btn navbar-button">Character Selection</Link>
								<Link to="/charactercreator" className="btn navbar-button">Character Creator</Link>
								{
									currentCharacterId
										? <Link to={"/character/" + currentCharacterId} className="btn navbar-button">Character Site</Link>
										: ""
								}
								<Link to="/spells" className="btn navbar-button">Spells</Link>
								<button className="btn navbar-button" onClick={logOut}>Log Out</button>
							</div>
						</div>
					</>
					: ""
			}
		</nav>
	);
};
