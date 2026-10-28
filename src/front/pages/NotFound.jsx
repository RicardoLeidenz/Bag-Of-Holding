import { Link } from "react-router-dom";

export const NotFound = () => {
    return (
        <div className="info-box m-5 p-4 text-center text-white">
            <h2>PAGE NOT FOUND</h2>
            <p>This page vanished into the Bag of Holding.</p>
            <Link to="/" className="input-selector">BACK TO START</Link>
        </div>
    );
};
