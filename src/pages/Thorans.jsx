import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { getDansalTimeStatus } from "../utils/dansalStatus";
import { timeAgo } from "../utils/timeAgo";

export default function Thorans({ lang = "si" }) {
  const [thorans, setThorans] = useState([]);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "thorans"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setThorans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const visible = thorans.filter((t) => !t.hidden);

  const districts = [
    ...new Set(visible.map((t) => t.location).filter(Boolean)),
  ].sort();

  const filtered = visible.filter((t) => {
    const timeStatus = getDansalTimeStatus(t.date, t.startTime, t.endTime);

    const matchesSearch = `${t.name || ""} ${t.location || ""} ${
      t.customLocation || ""
    } ${t.exactLocation || ""} ${t.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDistrict =
      districtFilter === "all" || t.location === districtFilter;

    const matchesStatus =
      statusFilter === "all" || timeStatus.type === statusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  return (
    <div className="page active">
      <div className="hero">
        <span className="hero-emoji">🏮✨🌕</span>

        <h1 className="hero-title">
          {lang === "si" ? "වෙසක් තොරණ සොයන්න" : "Find Vesak Thorans"}
        </h1>

        <p className="hero-desc">
          {lang === "si"
            ? "ඔබ අසල තොරණ, ස්ථානය සහ වේලාව සොයන්න."
            : "Find Vesak pandals, locations and live timings near you."}
        </p>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder={
              lang === "si"
                ? "දිස්ත්‍රික්කය, නගරය හෝ තොරණ සොයන්න..."
                : "Search district, town or thoran..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <select
            className="filter-select"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">
              {lang === "si" ? "සියලු දිස්ත්‍රික්ක" : "All Districts"}
            </option>

            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">
              {lang === "si" ? "සියලු තත්ත්ව" : "All Status"}
            </option>
            <option value="soon">
              {lang === "si" ? "ඉක්මනින්" : "Coming Soon"}
            </option>
            <option value="now">
              {lang === "si" ? "දැන් බලන්න" : "Now Showing"}
            </option>
            <option value="ended">
              {lang === "si" ? "අවසන්" : "Ended"}
            </option>
          </select>
        </div>
      </div>
      <div className="home-action-row">
  <Link to="/thoran-route" className="home-action-btn">
    🧭 {lang === "si" ? "තොරණ මාර්ගය සැලසුම් කරන්න" : "Plan Thoran Route"}
  </Link>

  <Link to="/add-thoran" className="home-action-btn">
    + {lang === "si" ? "තොරණක් එක් කරන්න" : "Add Thoran"}
  </Link>
</div>

      <div className="section-header">
        <span className="section-title">
          {lang === "si" ? "සජීවී තොරණ" : "Live Thorans"}
        </span>

        <span className="count-badge">
          {lang === "si"
            ? `තොරණ ${filtered.length}ක්`
            : `${filtered.length} Thorans`}
        </span>
      </div>

      <div className="cards">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🏮</span>
            {lang === "si" ? "තොරණක් හමු නොවීය." : "No thoran found."}
          </div>
        ) : (
          filtered.map((t) => {
            const timeStatus = getDansalTimeStatus(
              t.date,
              t.startTime,
              t.endTime
            );

            return (
              <Link key={t.id} to={`/thoran/${t.id}`} className="dansal-card">
                <div className="card-top">
                  <div>
                    <div className="card-name">
                      🏮 {t.name}
                      {t.verified && (
                        <span className="verified-badge">
                          ✅ {lang === "si" ? "තහවුරුයි" : "Verified"}
                        </span>
                      )}
                    </div>

                    <div className="card-loc">📍 {t.location}</div>

                    {t.customLocation && (
                      <div className="card-exact">🏘️ {t.customLocation}</div>
                    )}

                    <div className="card-exact">{t.exactLocation}</div>
                  </div>

                  <span className={`status-${timeStatus.type}`}>
                    {timeStatus.label}
                  </span>
                </div>

                {timeStatus.countdown && (
                  <div className="countdown-box">
                    ⏳{" "}
                    {timeStatus.type === "soon"
                      ? lang === "si"
                        ? "ආරම්භයට"
                        : "Starts in"
                      : lang === "si"
                      ? "අවසන් වීමට"
                      : "Ends in"}{" "}
                    {timeStatus.countdown}
                  </div>
                )}

                <div className="card-time">
                  <span>📅 {t.date || "Date not set"}</span>
                  <span>
                    🕒 {t.startTime} {t.endTime ? `– ${t.endTime}` : ""}
                  </span>
                </div>

                <div className="last-updated">
                  🔄 {timeAgo(t.updatedAt || t.createdAt, lang)}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}