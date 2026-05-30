import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { db } from "../firebase";
import { getDansalTimeStatus } from "../utils/dansalStatus";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function RecenterMap({ center, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

export default function DansalMap({ lang = "si" }) {
  const [dansals, setDansals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "dansals"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.hidden !== true && d.lat && d.lng);

      setDansals(data);
    });

    return () => unsub();
  }, []);

  const filteredDansals = useMemo(() => {
    if (statusFilter === "all") return dansals;

    return dansals.filter((d) => {
      const status = getDansalTimeStatus(d.date, d.openTime, d.closeTime);
      return status.type === statusFilter;
    });
  }, [dansals, statusFilter]);

  const showMyLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === "si" ? "GPS support නැහැ" : "GPS not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        alert(lang === "si" ? "GPS permission දෙන්න" : "Please allow GPS");
      }
    );
  };

  return (
    <div className="page active">
      <div className="add-form">
        <Link className="detail-back" to="/">
          ← {lang === "si" ? "ආපසු" : "Back"}
        </Link>

        <div className="form-section-title">
          🗺️ {lang === "si" ? "දන්සල් සිතියම" : "Dansal Map"}
        </div>

        <p className="form-section-desc">
          {lang === "si"
            ? "GPS location ඇති දන්සල් සිතියමෙන් බලන්න."
            : "View dansals with GPS locations on the map."}
        </p>

        <div className="map-actions">
          <button className="gps-btn" type="button" onClick={showMyLocation}>
            📍 {lang === "si" ? "මගේ ස්ථානය පෙන්වන්න" : "Show My Location"}
          </button>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">
              {lang === "si" ? "සියලු දන්සල්" : "All Dansals"}
            </option>
            <option value="now">
              {lang === "si" ? "දැන් විවෘතයි" : "Open Now"}
            </option>
            <option value="soon">
              {lang === "si" ? "ඉක්මනින්" : "Coming Soon"}
            </option>
            <option value="ended">
              {lang === "si" ? "අවසන්" : "Ended"}
            </option>
          </select>
        </div>

        <p className="small-note">
          {lang === "si"
            ? `සිතියමේ පෙන්වන්නේ GPS location ඇති දන්සල් ${filteredDansals.length}ක් පමණි.`
            : `Showing ${filteredDansals.length} dansals with GPS location.`}
        </p>
      </div>

      <div className="map-wrap">
        <MapContainer
          center={[7.8731, 80.7718]}
          zoom={8}
          scrollWheelZoom={true}
          className="leaflet-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <>
              <RecenterMap center={userLocation} zoom={13} />
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  {lang === "si" ? "ඔබගේ ස්ථානය" : "Your Location"}
                </Popup>
              </Marker>
            </>
          )}

          {filteredDansals.map((d) => {
            const status = getDansalTimeStatus(
              d.date,
              d.openTime,
              d.closeTime
            );

            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`;

            return (
              <Marker
                key={d.id}
                position={[Number(d.lat), Number(d.lng)]}
                icon={markerIcon}
              >
                <Popup>
                  <strong>🍛 {d.name}</strong>
                  <br />
                  {d.foodType}
                  <br />
                  📍 {d.location}{" "}
                  {d.customLocation ? `- ${d.customLocation}` : ""}
                  <br />
                  🕒 {status.label}
                  <br />
                  <a href={`/dansal/${d.id}`}>
                    {lang === "si" ? "විස්තර බලන්න" : "View Details"}
                  </a>
                  <br />
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                    🗺️ {lang === "si" ? "Google Maps යන්න" : "Navigate"}
                  </a>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}