import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { getDansalTimeStatus } from "../utils/dansalStatus";

export default function Analytics({ lang = "si" }) {
  const [dansals, setDansals] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "dansals"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.hidden !== true);

      setDansals(data);
    });

    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const total = dansals.length;

    const openNow = dansals.filter((d) => {
      const status = getDansalTimeStatus(d.date, d.openTime, d.closeTime);
      return status.type === "now";
    }).length;

    const comingSoon = dansals.filter((d) => {
      const status = getDansalTimeStatus(d.date, d.openTime, d.closeTime);
      return status.type === "soon";
    }).length;

    const ended = dansals.filter((d) => {
      const status = getDansalTimeStatus(d.date, d.openTime, d.closeTime);
      return status.type === "ended";
    }).length;

    const verified = dansals.filter((d) => d.verified).length;
    const withGps = dansals.filter((d) => d.lat && d.lng).length;

    const totalQueueVotes = dansals.reduce(
      (sum, d) => sum + (Number(d.queueVotesCount) || 0),
      0
    );

    const totalFinishVotes = dansals.reduce(
      (sum, d) => sum + (Number(d.finishVotesCount) || 0),
      0
    );

    const districtCounts = {};
    const foodCounts = {};
    const queueCounts = {
      no: 0,
      short: 0,
      medium: 0,
      long: 0,
    };

    dansals.forEach((d) => {
      if (d.location) {
        districtCounts[d.location] = (districtCounts[d.location] || 0) + 1;
      }

      if (d.foodType) {
        foodCounts[d.foodType] = (foodCounts[d.foodType] || 0) + 1;
      }

      if (d.queue && queueCounts[d.queue] !== undefined) {
        queueCounts[d.queue] += 1;
      }
    });

    const topDistricts = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      openNow,
      comingSoon,
      ended,
      verified,
      withGps,
      totalQueueVotes,
      totalFinishVotes,
      queueCounts,
      topDistricts,
      topFoods,
    };
  }, [dansals]);

  return (
    <div className="page active">
      <div className="add-form">
        <Link className="detail-back" to="/">
          ← {lang === "si" ? "ආපසු" : "Back"}
        </Link>

        <div className="form-section-title">
          📊 {lang === "si" ? "දන්සල් විශ්ලේෂණ" : "Dansal Analytics"}
        </div>

        <p className="form-section-desc">
          {lang === "si"
            ? "සජීවී දන්සල් සංඛ්‍යා ලේඛන සහ ප්‍රජා තොරතුරු."
            : "Live dansal statistics and community insights."}
        </p>

        <div className="analytics-grid">
          <div className="analytics-card">
            <span>🏮</span>
            <strong>{stats.total}</strong>
            <p>{lang === "si" ? "මුළු දන්සල්" : "Total Dansals"}</p>
          </div>

          <div className="analytics-card">
            <span>🟢</span>
            <strong>{stats.openNow}</strong>
            <p>{lang === "si" ? "දැන් විවෘත" : "Open Now"}</p>
          </div>

          <div className="analytics-card">
            <span>🔵</span>
            <strong>{stats.comingSoon}</strong>
            <p>{lang === "si" ? "ඉක්මනින්" : "Coming Soon"}</p>
          </div>

          <div className="analytics-card">
            <span>🔴</span>
            <strong>{stats.ended}</strong>
            <p>{lang === "si" ? "අවසන්" : "Ended"}</p>
          </div>

          <div className="analytics-card">
            <span>✅</span>
            <strong>{stats.verified}</strong>
            <p>{lang === "si" ? "තහවුරු කළ" : "Verified"}</p>
          </div>

          <div className="analytics-card">
            <span>📍</span>
            <strong>{stats.withGps}</strong>
            <p>{lang === "si" ? "GPS සහිත" : "With GPS"}</p>
          </div>

          <div className="analytics-card">
            <span>👥</span>
            <strong>{stats.totalQueueVotes}</strong>
            <p>{lang === "si" ? "පෝලිම් ඡන්ද" : "Queue Votes"}</p>
          </div>

          <div className="analytics-card">
            <span>🍽️</span>
            <strong>{stats.totalFinishVotes}</strong>
            <p>{lang === "si" ? "ආහාර අවසන් ඡන්ද" : "Food Finish Votes"}</p>
          </div>
        </div>

        <div className="analytics-section">
          <h3>{lang === "si" ? "ජනප්‍රිය දිස්ත්‍රික්ක" : "Top Districts"}</h3>

          {stats.topDistricts.length === 0 ? (
            <p className="small-note">No data</p>
          ) : (
            stats.topDistricts.map(([district, count]) => (
              <div className="analytics-row" key={district}>
                <span>{district}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-section">
          <h3>{lang === "si" ? "ජනප්‍රිය ආහාර වර්ග" : "Top Food Types"}</h3>

          {stats.topFoods.length === 0 ? (
            <p className="small-note">No data</p>
          ) : (
            stats.topFoods.map(([food, count]) => (
              <div className="analytics-row" key={food}>
                <span>{food}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-section">
          <h3>{lang === "si" ? "පෝලිම් තත්ත්වය" : "Queue Status Summary"}</h3>

          <div className="analytics-row">
            <span>🟢 {lang === "si" ? "පෝලිම නැහැ" : "No Queue"}</span>
            <strong>{stats.queueCounts.no}</strong>
          </div>

          <div className="analytics-row">
            <span>🟡 {lang === "si" ? "කෙටි පෝලිම" : "Short Queue"}</span>
            <strong>{stats.queueCounts.short}</strong>
          </div>

          <div className="analytics-row">
            <span>🟠 {lang === "si" ? "මධ්‍යම" : "Medium"}</span>
            <strong>{stats.queueCounts.medium}</strong>
          </div>

          <div className="analytics-row">
            <span>🔴 {lang === "si" ? "දිග පෝලිම" : "Long Queue"}</span>
            <strong>{stats.queueCounts.long}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}