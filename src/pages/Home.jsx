import { timeAgo } from "../utils/timeAgo";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { text } from "../lang";
import { getDansalTimeStatus } from "../utils/dansalStatus";

function queueLabel(q, lang = "si") {
  const map = {
    si: {
      no: "🟢 පෝලිම නැහැ",
      short: "🟡 කෙටි පෝලිම",
      medium: "🟠 මධ්‍යම",
      long: "🔴 දිග",
    },
    en: {
      no: "🟢 No Queue",
      short: "🟡 Short",
      medium: "🟠 Medium",
      long: "🔴 Long",
    },
  };

  return map[lang]?.[q] || map[lang]?.medium || "🟠 Medium";
}

function queueClass(q) {
  return {
    no: "no",
    short: "short",
    medium: "medium",
    long: "long",
  }[q] || "medium";
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function Home({ lang = "si" }) {
  const t = text[lang] || text.si;

  const [dansals, setDansals] = useState([]);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [foodFilter, setFoodFilter] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "dansals"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setDansals(data);
    });

    return () => unsub();
  }, []);

  const findNearby = () => {
    if (!navigator.geolocation) {
      alert(lang === "si" ? "GPS support නැහැ" : "GPS not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setNearbyOnly(true);
      },
      () => {
        alert(lang === "si" ? "GPS permission දෙන්න" : "Please allow GPS");
      }
    );
  };

  const visibleDansals = dansals.filter((d) => d.hidden !== true);

  const districts = [
    ...new Set(visibleDansals.map((d) => d.location).filter(Boolean)),
  ].sort();

  const foodTypes = [
    ...new Set(visibleDansals.map((d) => d.foodType).filter(Boolean)),
  ].sort();

  const filtered = visibleDansals.filter((d) => {
    const timeStatus = getDansalTimeStatus(d.date, d.openTime, d.closeTime);

    const matchesSearch = `${d.name || ""} ${d.location || ""} ${
      d.customLocation || ""
    } ${d.exactLocation || ""} ${d.foodType || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesQueue = queueFilter === "all" || d.queue === queueFilter;

    const matchesStatus =
      statusFilter === "all" || timeStatus.type === statusFilter;

    const matchesDistrict =
      districtFilter === "all" || d.location === districtFilter;

    const matchesFood = foodFilter === "all" || d.foodType === foodFilter;

    const distance =
      userLocation && d.lat && d.lng
        ? distanceKm(
            userLocation.lat,
            userLocation.lng,
            Number(d.lat),
            Number(d.lng)
          )
        : null;

    const matchesNearby = !nearbyOnly || (distance !== null && distance <= 10);

    return (
      matchesSearch &&
      matchesQueue &&
      matchesStatus &&
      matchesDistrict &&
      matchesFood &&
      matchesNearby
    );
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!userLocation) return 0;

    const da =
      a.lat && a.lng
        ? distanceKm(
            userLocation.lat,
            userLocation.lng,
            Number(a.lat),
            Number(a.lng)
          )
        : 99999;

    const db =
      b.lat && b.lng
        ? distanceKm(
            userLocation.lat,
            userLocation.lng,
            Number(b.lat),
            Number(b.lng)
          )
        : 99999;

    return da - db;
  });

  const openNowDansals = sortedFiltered
    .filter((d) => {
      const status = getDansalTimeStatus(d.date, d.openTime, d.closeTime);
      return status.type === "now";
    })
    .slice(0, 5);

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

        <div className="filter-row filter-row-4">
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
            value={foodFilter}
            onChange={(e) => setFoodFilter(e.target.value)}
          >
            <option value="all">
              {lang === "si" ? "සියලු ආහාර" : "All Food"}
            </option>

            {foodTypes.map((food) => (
              <option key={food} value={food}>
                {food}
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
              {lang === "si" ? "දැන් විවෘතයි" : "Now Open"}
            </option>

            <option value="ended">
              {lang === "si" ? "අවසන්" : "Ended"}
            </option>
          </select>

          <select
            className="filter-select"
            value={queueFilter}
            onChange={(e) => setQueueFilter(e.target.value)}
          >
            <option value="all">
              {lang === "si" ? "සියලු පෝලිම්" : "All Queues"}
            </option>

            <option value="no">
              {lang === "si" ? "පෝලිම නැහැ" : "No Queue"}
            </option>

            <option value="short">
              {lang === "si" ? "කෙටි පෝලිම" : "Short"}
            </option>

            <option value="medium">
              {lang === "si" ? "මධ්‍යම පෝලිම" : "Medium"}
            </option>

            <option value="long">
              {lang === "si" ? "දිග පෝලිම" : "Long"}
            </option>
          </select>
        </div>

        <button className="gps-btn" onClick={findNearby}>
          📍 {lang === "si" ? "මා අසල දන්සල්" : "Nearby Dansals"}
        </button>

        {nearbyOnly && (
          <button
            className="clear-gps-btn"
            onClick={() => {
              setNearbyOnly(false);
              setUserLocation(null);
            }}
          >
            ✕ {lang === "si" ? "Nearby ඉවත් කරන්න" : "Clear Nearby"}
          </button>
        )}

        <div className="home-action-row">
          <Link to="/map" className="home-action-btn">
            🗺️ {lang === "si" ? "සිතියමෙන් බලන්න" : "View Map"}
          </Link>

          <Link to="/route" className="home-action-btn">
            🧭 {lang === "si" ? "මාර්ගය සැලසුම් කරන්න" : "Plan Route"}
          </Link>

          <Link to="/analytics" className="home-action-btn">
            📊 {lang === "si" ? "විශ්ලේෂණ" : "Analytics"}
          </Link>
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
        <span className="section-title">
          {lang === "si" ? "දැන් විවෘත දන්සල්" : "Open Now Dansals"}
        </span>

        <span className="count-badge">
          {lang === "si"
            ? `දැන් විවෘත දන්සල් ${openNowDansals.length}ක්`
            : `${openNowDansals.length} Open Now`}
        </span>
      </div>

      <div className="cards">
        {openNowDansals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🏮</span>
            {lang === "si"
              ? "දැන් විවෘත දන්සලක් හමු නොවීය."
              : "No open dansals found."}
          </div>
        ) : (
          openNowDansals.map((d) => {
            const timeStatus = getDansalTimeStatus(
              d.date,
              d.openTime,
              d.closeTime
            );

            const distance =
              userLocation && d.lat && d.lng
                ? distanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    Number(d.lat),
                    Number(d.lng)
                  )
                : null;

            return (
              <Link key={d.id} to={`/dansal/${d.id}`} className="dansal-card">
                <div className="card-top">
                  <div>
                    <div className="card-name">
                      🍛 {d.name}

                      {d.verified && (
                        <span className="verified-badge">
                          ✅ {lang === "si" ? "තහවුරුයි" : "Verified"}
                        </span>
                      )}
                    </div>

                    <div className="card-loc">📍 {d.location}</div>

                    {d.customLocation && (
                      <div className="card-exact">🏘️ {d.customLocation}</div>
                    )}

                    <div className="card-exact">{d.exactLocation}</div>
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

                <div className="card-tags">
                  <span className="tag tag-food">🍽️ {d.foodType}</span>

                  <span className={`tag tag-queue-${queueClass(d.queue)}`}>
                    {queueLabel(d.queue, lang)}
                  </span>

                  <span className="tag tag-food">
                    👥 {d.queueVotesCount || 0}{" "}
                    {lang === "si" ? "ඡන්ද" : "votes"}
                  </span>

                  {distance !== null && (
                    <span className="tag tag-food">
                      📍 {distance.toFixed(1)} km
                    </span>
                  )}
                </div>

                <div className="card-time">
                  <span>
                    📅{" "}
                    {d.date ||
                      (lang === "si" ? "දිනය නොමැත" : "Date not set")}
                  </span>

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

      <div className="section-header">
        <span className="section-title">
          {lang === "si" ? "සියලු ගැලපෙන දන්සල්" : "All Matching Dansals"}
        </span>

        <span className="count-badge">
          {lang === "si"
            ? `මුළු දන්සල් ${sortedFiltered.length}ක්`
            : `${sortedFiltered.length} Total`}
        </span>
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