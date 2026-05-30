import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import AddDansal from "./pages/AddDansal";
import DansalDetails from "./pages/DansalDetails";
import Thorans from "./pages/Thorans";
import AddThoran from "./pages/AddThoran";
import ThoranDetails from "./pages/ThoranDetails";
import DansalMap from "./pages/DansalMap";
import RoutePlanner from "./pages/RoutePlanner";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";

export default function App() {
  const [lang, setLang] = useState("si");

  return (
    <BrowserRouter>
      <div className="app">
        <Stars />

        <nav className="nav">
          <Link to="/" className="nav-brand">
            <div className="nav-title">🏮 Vesak Dansal</div>
            <div className="nav-sub">Live queue updates</div>
          </Link>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="nav-btn" onClick={() => setLang(lang === "si" ? "en" : "si")}>
              {lang === "si" ? "EN" : "සිං"}
            </button>

            <Link to="/add" className="nav-btn">
              {lang === "si" ? "+ දන්සලක්" : "+ Add"}
            </Link>
            <Link to="/thorans" className="nav-btn">
  {lang === "si" ? "තොරණ" : "Thoran"}
</Link>

<Link to="/add-thoran" className="nav-btn">
  + {lang === "si" ? "තොරණ" : "Thoran"}
</Link>

<Link to="/map" className="nav-btn">
  🗺️ {lang === "si" ? "සිතියම" : "Map"}
</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/add" element={<AddDansal lang={lang} />} />
          <Route path="/dansal/:id" element={<DansalDetails lang={lang} />} />
          <Route path="/thorans" element={<Thorans lang={lang} />} />
          <Route path="/add-thoran" element={<AddThoran lang={lang} />} />
          <Route path="/thoran/:id" element={<ThoranDetails lang={lang} />} />
          <Route path="/map" element={<DansalMap lang={lang} />} />
          <Route path="/route" element={<RoutePlanner lang={lang} />} />
          <Route path="/analytics" element={<Analytics lang={lang} />} />
          <Route path="/admin" element={<Admin lang={lang} />} />
        </Routes>

        <div className="lotuses" />
      </div>
    </BrowserRouter>
  );
}
function Stars() {
  return (
    <div className="stars">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}