import { Link, NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? " nav-link--active" : ""}`;

export function AppShell() {
  return (
    <div className="shell">
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span className="brand-text">HeartRisk</span>
            <span className="brand-sub">BN demo</span>
          </Link>
          <nav className="nav-links" aria-label="Main">
            <NavLink to="/" className={navClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/assess" className={navClass}>
              Assessment
            </NavLink>
            <NavLink to="/history" className={navClass}>
              History
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          Educational Bayesian network demo — not for clinical use. Inference runs on your configured API;
          history is stored only in this browser (localStorage).
        </p>
      </footer>
    </div>
  );
}
