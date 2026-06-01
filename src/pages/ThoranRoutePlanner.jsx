import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";

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

export default function ThoranRoutePlanner({ lang = "si" }) {
  const [thorans, setThorans] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "thorans"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t) => t.hidden !== true && t.lat && t.lng);

      setThorans(data);
    });

    return () => unsub();
  }, []);

  const getMyLocation = () => {
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
      },
      () => {
        alert(lang === "si" ? "GPS permission ලබාදෙන්න" : "Please allow GPS permission");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sortedThorans = useMemo(() => {
    if (!userLocation) return thorans;

    return [...thorans].sort((a, b) => {
      const da = distanceKm(userLocation.lat, userLocation.lng, Number(a.lat), Number(a.lng));
      const db = distanceKm(userLocation.lat, userLocation.lng, Number(b.lat), Number(b.lng));
      return da - db;
    });
  }, [thorans, userLocation]);

  const selectedThorans = selectedIds
    .map((id) => thorans.find((t) => t.id === id))
    .filter(Boolean);

  const totalDistance = useMemo(() => {
    if (selectedThorans.length === 0) return 0;

    let total = 0;

    if (userLocation && selectedThorans[0]) {
      total += distanceKm(
        userLocation.lat,
        userLocation.lng,
        Number(selectedThorans[0].lat),
        Number(selectedThorans[0].lng)
      );
    }

    for (let i = 0; i < selectedThorans.length - 1; i++) {
      const a = selectedThorans[i];
      const b = selectedThorans[i + 1];
      total += distanceKm(Number(a.lat), Number(a.lng), Number(b.lat), Number(b.lng));
    }

    return total;
  }, [selectedThorans, userLocation]);

  const travelMinutes = Math.round((totalDistance / 20) * 60);
  const trafficBuffer = Math.round(travelMinutes * 0.3);
  const visitMinutes = selectedThorans.length * 20;
  const totalMinutes = travelMinutes + trafficBuffer + visitMinutes;

  const recommended = sortedThorans[0];

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const optimizeRoute = () => {
    if (selectedThorans.length < 2) return;

    const remaining = [...selectedThorans];
    const optimized = [];
    let current = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : remaining.shift();

    if (!userLocation && current?.id) optimized.push(current);

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remaining.forEach((t, index) => {
        const dist = distanceKm(
          Number(current.lat),
          Number(current.lng),
          Number(t.lat),
          Number(t.lng)
        );

        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = index;
        }
      });

      current = remaining.splice(nearestIndex, 1)[0];
      optimized.push(current);
    }

    setSelectedIds(optimized.map((t) => t.id));
  };

  const openGoogleMapsRoute = () => {
    if (selectedThorans.length === 0) return;

    const points = [];

    if (userLocation) {
      points.push(`${userLocation.lat},${userLocation.lng}`);
    }

    selectedThorans.forEach((t) => {
      points.push(`${t.lat},${t.lng}`);
    });

    window.open(`https://www.google.com/maps/dir/${points.join("/")}`, "_blank");
  };

  return (
    <div className="page active">
      <div className="add-form">
        <Link className="detail-back" to="/thorans">
          ← {lang === "si" ? "ආපසු" : "Back"}
        </Link>

        <div className="form-section-title">
          🧭 {lang === "si" ? "තොරණ මාර්ගය සැලසුම් කරන්න" : "Plan Thoran Route"}
        </div>

        <p className="form-section-desc">
          {lang === "si"
            ? "ඔබගේ GPS ස්ථානයෙන් ආසන්න තොරණ sort කරගෙන route එකක් සාදන්න."
            : "Use GPS, sort nearby thorans, select multiple thorans and create a route."}
        </p>

        <button className="gps-btn" type="button" onClick={getMyLocation}>
          📍 {lang === "si" ? "මගේ ස්ථානය ලබාගන්න" : "Get My Location"}
        </button>

        <div className="route-report">
          <strong>{lang === "si" ? "තොරණ Route වාර්තාව" : "Thoran Route Report"}</strong>

          <p>{lang === "si" ? "තෝරාගත් තොරණ" : "Selected Thorans"}: {selectedThorans.length}</p>
          <p>{lang === "si" ? "මුළු දුර" : "Estimated Distance"}: {totalDistance.toFixed(1)} km</p>
          <p>{lang === "si" ? "ගමන් කාලය" : "Travel Time"}: {travelMinutes} mins</p>
          <p>{lang === "si" ? "Traffic buffer" : "Traffic Buffer"}: {trafficBuffer} mins</p>
          <p>{lang === "si" ? "තොරණ බලන කාලය" : "Viewing Time"}: {visitMinutes} mins</p>

          <p>
            <strong>{lang === "si" ? "මුළු කාලය" : "Total Time"}: {totalMinutes} mins</strong>
          </p>

          {recommended && (
            <p>
              🌕 {lang === "si" ? "ආසන්නතම තොරණ" : "Nearest Recommended"}:{" "}
              <strong>{recommended.name}</strong>
            </p>
          )}

          <div className="route-action-grid">
            <button className="home-action-btn" disabled={selectedThorans.length < 2} onClick={optimizeRoute}>
              ⚡ {lang === "si" ? "කෙටිම route එකට සකසන්න" : "Optimize Route"}
            </button>

            <button className="submit-btn" disabled={selectedThorans.length === 0} onClick={openGoogleMapsRoute}>
              🗺️ {lang === "si" ? "Google Maps Route විවෘත කරන්න" : "Open Google Maps Route"}
            </button>

            {selectedThorans.length > 0 && (
              <button className="clear-gps-btn" type="button" onClick={() => setSelectedIds([])}>
                ✕ {lang === "si" ? "Route ඉවත් කරන්න" : "Clear Route"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="cards">
        {sortedThorans.length === 0 ? (
          <div className="empty-state">
            {lang === "si" ? "GPS ඇති තොරණ තවම නැහැ." : "No GPS thorans yet."}
          </div>
        ) : (
          sortedThorans.map((t) => {
            const distance =
              userLocation && t.lat && t.lng
                ? distanceKm(userLocation.lat, userLocation.lng, Number(t.lat), Number(t.lng))
                : null;

            return (
              <button
                key={t.id}
                className={`route-card ${selectedIds.includes(t.id) ? "selected" : ""}`}
                onClick={() => toggleSelect(t.id)}
                type="button"
              >
                <div>
                  <strong>🏮 {t.name}</strong>
                  <p>📍 {t.location} {t.customLocation ? `- ${t.customLocation}` : ""}</p>
                  <p>📌 {t.exactLocation}</p>
                  {distance !== null && <p>📍 {distance.toFixed(1)} km away</p>}
                </div>

                <span>
                  {selectedIds.includes(t.id)
                    ? lang === "si" ? "තෝරාගෙන ඇත" : "Selected"
                    : lang === "si" ? "තෝරන්න" : "Select"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}