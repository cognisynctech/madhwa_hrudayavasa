import { Link } from "react-router";
import "./NotFound.css";

export default function NotFound() {
  return (
    <section className="notfound">
      {/* Giant ghost number */}
      <div className="notfound-bg" aria-hidden="true">404</div>

      <p className="notfound-code"><span>404</span></p>
      <h1 className="notfound-title">The Episode Doesn't Exist</h1>
      <div className="notfound-rule" />
      <p className="notfound-sub">
        This path leads nowhere in our library. Let's get you back to something worth watching.
      </p>

      <Link to="/library" className="notfound-btn">
        {/* Left arrow */}
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 7H2m0 0 4-4M2 7l4 4" />
        </svg>
        Back to Library
      </Link>
    </section>
  );
}
