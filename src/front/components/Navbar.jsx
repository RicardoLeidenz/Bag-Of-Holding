import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { clearSession } from "../api.js";

export const Navbar = () => {
	const { store, dispatch } = useGlobalReducer();
	const navigate = useNavigate();
	const token = store.token;
	const currentCharacterId = store.characterInfo.id;

	const logOut = () => {
		clearSession();
		dispatch({ type: "log_out" });
		navigate("/");
	}
	return (
		<nav className="navbar header-secondary">
			<Link to={token ? "/characterselection" : "/"}>
				<span className="navbar-brand mb-0 h1 accent">BAG OF HOLDING</span>
			</Link>

			<div className="ml-auto">
				{
					token
						? <span>
							<Link to="/characterselection">
								<button className="accent btn btn-primary navbar-button">Character Selection</button>
							</Link>
							<Link to="/charactercreator">
								<button className="accent btn btn-primary navbar-button">Character Creator</button>
							</Link>
							{
								currentCharacterId
									? <Link to={"/character/" + currentCharacterId}>
										<button className="accent btn btn-primary navbar-button">Character Site</button>
									</Link>
									: ""
							}
							<Link to="/spells">
								<button className="accent btn btn-primary navbar-button">Spells</button>
							</Link>
							<button
								className="accent btn btn-primary navbar-button"
								onClick={logOut}
							>
								Log Out
							</button>
						</span>
						: ""
				}
			</div>
		</nav>
	);
};
