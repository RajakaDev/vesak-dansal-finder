import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";

const locations = [
  "කොළඹ", "ගම්පහ", "කළුතර", "මහනුවර", "මාතලේ", "නුවර එළිය",
  "ගාල්ල", "මාතර", "හම්බන්තොට", "යාපනය", "කිලිනොච්චි", "මන්නාරම",
  "වවුනියාව", "මුලතිව්", "මඩකලපුව", "අම්පාර", "ත්‍රිකුණාමලය",
  "කුරුණෑගල", "පුත්තලම", "අනුරාධපුර", "පොළොන්නරුව",
  "බදුල්ල", "මොණරාගල", "රත්නපුර", "කෑගල්ල",
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Monaragala", "Ratnapura", "Kegalle",
];

function extractLatLngFromMapLink(url) {
  if (!url) return null;
  const match = url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (!match) return null;
  return { lat: match[1], lng: match[2] };
}

export default function AddThoran({ lang = "si" }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    location: "",
    customLocation: "",
    exactLocation: "",
    mapLink: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    lat: "",
    lng: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMapLinkChange = (e) => {
    const value = e.target.value;
    const coords = extractLatLngFromMapLink(value);

    setForm({
      ...form,
      mapLink: value,
      lat: coords ? coords.lat : form.lat,
      lng: coords ? coords.lng : form.lng,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "thorans"), {
      name: form.name.trim(),
      location: form.location,
      customLocation: form.customLocation.trim(),
      exactLocation: form.exactLocation.trim(),
      mapLink: form.mapLink.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description.trim(),
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      status: "open",
      verified: false,
      hidden: false,
      reportCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    navigate("/thorans");
  };

  return (
    <div className="page active">
      <div className="add-form">
        <Link className="detail-back" to="/thorans">
          ← {lang === "si" ? "ආපසු" : "Back"}
        </Link>

        <div className="form-section-title">
          🏮 {lang === "si" ? "නව තොරණක් එක් කරන්න" : "Add New Thoran"}
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">{lang === "si" ? "තොරණ නම" : "Thoran Name"}</label>
              <input className="form-input" name="name" required value={form.name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">{lang === "si" ? "දිස්ත්‍රික්කය" : "District"}</label>
              <select className="form-select" name="location" required value={form.location} onChange={handleChange}>
                <option value="">{lang === "si" ? "දිස්ත්‍රික්කය තෝරන්න" : "Select district"}</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{lang === "si" ? "ගම / නගරය" : "Town / Village"}</label>
              <input className="form-input" name="customLocation" value={form.customLocation} onChange={handleChange} />
            </div>

            <div className="form-group form-full">
              <label className="form-label">{lang === "si" ? "නිශ්චිත ස්ථානය" : "Exact Location"}</label>
              <input className="form-input" name="exactLocation" required value={form.exactLocation} onChange={handleChange} />
            </div>

            <div className="form-group form-full">
              <label className="form-label">Google Maps Link</label>
              <input
                className="form-input"
                name="mapLink"
                placeholder="https://maps.google.com/..."
                value={form.mapLink}
                onChange={handleMapLinkChange}
              />
              <p className="small-note">
                {lang === "si"
                  ? "Map link එකේ coordinates තිබේ නම් Latitude/Longitude auto පිරේ."
                  : "If the map link has coordinates, Latitude/Longitude fills automatically."}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" name="lat" placeholder="6.9271" value={form.lat} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" name="lng" placeholder="79.8612" value={form.lng} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">{lang === "si" ? "දිනය" : "Date"}</label>
              <input className="form-input" name="date" type="date" required value={form.date} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">{lang === "si" ? "ආරම්භ වේලාව" : "Start Time"}</label>
              <input className="form-input" name="startTime" type="time" required value={form.startTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">{lang === "si" ? "අවසන් වේලාව" : "End Time"}</label>
              <input className="form-input" name="endTime" type="time" value={form.endTime} onChange={handleChange} />
            </div>

            <div className="form-group form-full">
              <label className="form-label">{lang === "si" ? "විස්තර" : "Description"}</label>
              <textarea className="form-input" name="description" rows="4" value={form.description} onChange={handleChange} />
            </div>
          </div>

          <button className="submit-btn">
            {lang === "si" ? "තොරණ එක් කරන්න 🏮" : "Submit Thoran 🏮"}
          </button>
        </form>
      </div>
    </div>
  );
}