import { timeAgo } from "../utils/timeAgo";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { text } from "../lang";
import { getDansalTimeStatus } from "../utils/dansalStatus";

function queueLabel(q, lang = "si") {
  const map = {
    si: { no: "🟢 පෝලිම නැහැ", short: "🟡 කෙටි පෝලිම", medium: "🟠 මධ්‍යම", long: "🔴 දිග" },
    en: { no: "🟢 No Queue", short: "🟡 Short", medium: "🟠 Medium", long: "🔴 Long" },
  };
  return map[lang]?.[q] || map[lang].medium;
}

function queueClass(q) {
  return { no: "no", short: "short", medium: "medium", long: "long" }[q] || "medium";
}

export default function Home({ lang = "si" }) {
  const t = text[lang] || text.si;

  const [dansals, setDansals] = useState([]);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "dansals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setDansals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = dansals.filter((d) => {
    const timeStatus = getDansalTimeStatus(d.date, d.openTime, d.closeTime);

    const matchesSearch = `${d.name || ""} ${d.location || ""} ${d.exactLocation || ""} ${d.foodType || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesQueue = queueFilter === "all" || d.queue === queueFilter;
    const matchesStatus = statusFilter === "all" || timeStatus.type === statusFilter;

    return matchesSearch && matchesQueue && matchesStatus;
  });

  return (
    <div className="page active">
      <div className="hero">
        <span className="hero-emoji">🪔🏮🌕</span>
        <h1 className="hero-title">{t.title}</h1>
        <p className="hero-desc">{t.desc}</p>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="soon">Coming Soon</option>
            <option value="now">Now Open</option>
            <option value="ended">Ended</option>
          </select>

          <select className="filter-select" value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)}>
            <option value="all">All Queues</option>
            <option value="no">No Queue</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      <div className="notice-box">
  <strong>
    {lang === "si" ? "වැදගත් දැනුම්දීම" : "Important Notice"}
  </strong>
  <p>
    {lang === "si"
      ? "මෙම වෙබ් අඩවියේ දන්සල් තොරතුරු මහජනතාව විසින් එකතු කරන ඒවා වේ. සමහර තොරතුරු වැරදි හෝ යාවත්කාලීන නොවිය හැක. යාමට පෙර ස්ථානය, වේලාව සහ ආහාර තත්ත්වය නැවත පරීක්ෂා කරන්න."
      : "Dansal details on this website are added and updated by the public. Some information may be incorrect or outdated. Please check the location, time, and food availability before visiting."}
  </p>
</div>

      <div className="section-header">
        <span className="section-title">{t.live}</span>
        <span className="count-badge">
          {lang === "si" ? `${filtered.length}${t.found}` : `${filtered.length} ${t.found}`}
        </span>
      </div>

      <div className="cards">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🏮</span>
            {lang === "si" ? "දන්සලක් හමු නොවීය." : "No dansal found."}
          </div>
        ) : (
          filtered.map((d) => {
            const timeStatus = getDansalTimeStatus(d.date, d.openTime, d.closeTime);

            return (
              <Link key={d.id} to={`/dansal/${d.id}`} className="dansal-card">
                <div className="card-top">
                  <div>
                    <div className="card-name">🍛 {d.name}</div>
                    <div className="card-loc">📍 {d.location}</div>
                    <div className="card-exact">{d.exactLocation}</div>
                  </div>

                  <span className={`status-${timeStatus.type}`}>
                    {timeStatus.label}
                  </span>
                </div>

                {timeStatus.countdown && (
                  <div className="countdown-box">
                    ⏳ {timeStatus.type === "soon" ? "Starts in" : "Ends in"} {timeStatus.countdown}
                  </div>
                )}

                <div className="card-tags">
                  <span className="tag tag-food">🍽️ {d.foodType}</span>
                  <span className={`tag tag-queue-${queueClass(d.queue)}`}>
                    {queueLabel(d.queue, lang)}
                  </span>
                  <span className="tag tag-food">
                    👥 {d.queueVotesCount || 0} votes
                  </span>
                </div>

                <div className="card-time">
                  <span>📅 {d.date || "Date not set"}</span>
                  <span>
                    🕒 {d.openTime} {d.closeTime ? `– ${d.closeTime}` : ""}
                  </span>
                </div>
                <div className="last-updated">

  🔄 {timeAgo(d.updatedAt || d.createdAt, lang)}

</div>
              </Link>
            );
          })
        )}
      </div>

      <footer className="creator-footer">
        <strong>Created For People By</strong>
        <br />
        H.D.R.U Anurasiri
        <br />
        Undergraduate Software Engineering Student — SLIIT CITY UNI
        <br />
        Co-founder of Zytrix
      </footer>
    </div>
  );
}