import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { text } from "../lang";
const defaultFoodTypes = [
  "බත් දන්සල",
  "කොට්ටු",
  "නූඩ්ල්ස්",
  "අයිස්ක්‍රීම්",
  "තේ",
  "කෝපි",
  "සිසිල් බීම",
  "සුප්",
  "පාන්",
  "කඩල",
  "මඤ්ඤොක්කා",
  "Rice Dansal",
  "Kottu",
  "Noodles",
  "Ice Cream",
  "Tea",
  "Coffee",
];
const locations = [
  "කොළඹ",
  "ගම්පහ",
  "කළුතර",
  "මහනුවර",
  "මාතලේ",
  "නුවර එළිය",
  "ගාල්ල",
  "මාතර",
  "හම්බන්තොට",
  "යාපනය",
  "කිලිනොච්චි",
  "මන්නාරම",
  "වවුනියාව",
  "මුලතිව්",
  "මඩකලපුව",
  "අම්පාර",
  "ත්‍රිකුණාමලය",
  "කුරුණෑගල",
  "පුත්තලම",
  "අනුරාධපුර",
  "පොළොන්නරුව",
  "බදුල්ල",
  "මොණරාගල",
  "රත්නපුර",
  "කෑගල්ල",
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];
function extractLatLngFromMapLink(url) {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: qMatch[1], lng: qMatch[2] };
  }
  const queryMatch = url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    return { lat: queryMatch[1], lng: queryMatch[2] };
  }
  return null;
}
export default function AddDansal({ lang = "si" }) {
  const navigate = useNavigate();
  const t = text[lang] || text.si;
  const [foodTypes, setFoodTypes] = useState(defaultFoodTypes);
  const [newFood, setNewFood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    foodType: "",
    location: "",
    customLocation: "",
    exactLocation: "",
    mapLink: "",
    date: "",
    openTime: "",
    closeTime: "",
    lat: "",
    lng: "",
  });
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "foodTypes"), (snap) => {
      const cloudFoods = snap.docs.map((d) => d.id);
      setFoodTypes([...new Set([...defaultFoodTypes, ...cloudFoods])]);
    });
    return () => unsub();
  }, []);
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
  const addFoodType = async () => {
    const value = newFood.trim();
    if (!value) return;
    await setDoc(doc(db, "foodTypes", value), {
      name: value,
      createdAt: serverTimestamp(),
    });
    setForm({ ...form, foodType: value });
    setNewFood("");
  };
  const useMyLocation = () => {
    const ok = confirm(
      lang === "si"
        ? "ඔබ දැන් දන්සල තියෙන ස්ථානයේද? ඔබ වෙනත් තැනක සිටින්නේ නම් GPS වැරදි විය හැක. දන්සලේ සිටිනවා නම් පමණක් OK ඔබන්න."
        : "Are you currently at the dansal location? If you are somewhere else, GPS can be wrong. Press OK only if you are at the dansal."
    );
    if (!ok) return;
    if (!navigator.geolocation) {
      alert(lang === "si" ? "GPS support නැහැ" : "GPS not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }));
        alert(lang === "si" ? "GPS ස්ථානය එකතු වුණා" : "GPS location added");
      },
      () => {
        alert(
          lang === "si"
            ? "GPS permission ලබාදෙන්න. Browser settings වලින් Location allow කරන්න."
            : "Please allow GPS permission. Enable Location in browser settings."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };
  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const cleanName = form.name.trim();
    const cleanFood = form.foodType.trim();
    const cleanLocation = form.location.trim();
    const cleanExact = form.exactLocation.trim();
    if (!cleanName || !cleanFood || !cleanLocation || !cleanExact) {
      alert(
        lang === "si"
          ? "අනිවාර්ය තොරතුරු පුරවන්න."
          : "Please fill required fields."
      );
      return;
    }
    setSubmitting(true);
    try {
      await setDoc(doc(db, "foodTypes", cleanFood), {
        name: cleanFood,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "dansals"), {
        name: cleanName,
        foodType: cleanFood,
        location: cleanLocation,
        customLocation: form.customLocation.trim(),
        exactLocation: cleanExact,
        mapLink: form.mapLink.trim(),
        date: form.date,
        openTime: form.openTime,
        closeTime: form.closeTime,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        queue: "medium",
        status: "open",
        verified: false,
        hidden: false,
        reportCount: 0,
        finishVotesCount: 0,
        queueVotesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(
        lang === "si"
          ? "දන්සල save වුණේ නැහැ. නැවත උත්සාහ කරන්න."
          : "Dansal was not saved. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="page active">
      <div className="add-form">
        <div style={{ paddingTop: 8 }}>
          <Link className="detail-back" to="/">
            {t.back}
          </Link>
          <div className="form-section-title">{t.addTitle}</div>
          <p className="form-section-desc">{t.addDesc}</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">{t.name}</label>
              <input
                className="form-input"
                name="name"
                required
                placeholder={
                  lang === "si"
                    ? "උදා: නුගේගොඩ බත් දන්සල"
                    : "Example: Nugegoda Rice Dansal"
                }
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.food}</label>
              <select
                className="form-select"
                name="foodType"
                required
                value={form.foodType}
                onChange={handleChange}
              >
                <option value="">
                  {lang === "si" ? "ආහාර වර්ගය තෝරන්න" : "Select food type"}
                </option>
                {foodTypes.map((food) => (
                  <option key={food} value={food}>
                    {food}
                  </option>
                ))}
              </select>
              <div className="food-add-row">
                <input
                  className="food-add-input"
                  placeholder={
                    lang === "si" ? "නව ආහාර වර්ගය" : "New food type"
                  }
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                />
                <button
                  type="button"
                  className="food-add-btn"
                  onClick={addFoodType}
                >
                  {lang === "si" ? "එක් කරන්න" : "Add"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.area}</label>
              <select
                className="form-select"
                name="location"
                required
                value={form.location}
                onChange={handleChange}
              >
                <option value="">
                  {lang === "si" ? "දිස්ත්‍රික්කය තෝරන්න" : "Select district"}
                </option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group form-full">
              <label className="form-label">
                {lang === "si" ? "ගම / නගරය" : "Town / Village"}
              </label>
              <input
                className="form-input"
                name="customLocation"
                placeholder={
                  lang === "si"
                    ? "උදා: කිරිබත්ගොඩ, බොරැල්ල, වත්තල"
                    : "Example: Kiribathgoda, Borella, Wattala"
                }
                value={form.customLocation}
                onChange={handleChange}
              />
            </div>
            <div className="form-group form-full">
              <label className="form-label">{t.exact}</label>
              <input
                className="form-input"
                name="exactLocation"
                required
                placeholder={
                  lang === "si"
                    ? "උදා: බස් නැවතුම අසල"
                    : "Example: Near bus stand"
                }
                value={form.exactLocation}
                onChange={handleChange}
              />
            </div>
            <div className="form-group form-full">
              <label className="form-label">
                {t.map}{" "}
                <span style={{ color: "var(--vesak-muted)" }}>
                  {lang === "si" ? "(විකල්ප)" : "(Optional)"}
                </span>
              </label>
              <input
                className="form-input"
                name="mapLink"
                placeholder="https://maps.google.com/..."
                value={form.mapLink}
                onChange={handleMapLinkChange}
              />
              <p className="small-note">
                {lang === "si"
                  ? "Google Maps link එකේ coordinates තිබේ නම් latitude/longitude ස්වයංක්‍රීයව පිරේ."
                  : "If the Google Maps link contains coordinates, latitude/longitude will be filled automatically."}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">{t.date}</label>
              <input
                className="form-input"
                name="date"
                type="date"
                required
                value={form.date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang === "si" ? "ආරම්භ වේලාව" : "Start Time"}
              </label>
              <input
                className="form-input"
                name="openTime"
                type="time"
                required
                value={form.openTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang === "si" ? "අවසන් වේලාව" : "End Time"}{" "}
                <span style={{ color: "var(--vesak-muted)" }}>
                  {lang === "si" ? "(විකල්ප)" : "(Optional)"}
                </span>
              </label>
              <input
                className="form-input"
                name="closeTime"
                type="time"
                value={form.closeTime}
                onChange={handleChange}
              />
            </div>
            <div className="gps-warning form-full">
              <strong>
                {lang === "si"
                  ? "GPS පිළිබඳ වැදගත් දැනුම්දීම"
                  : "Important GPS Notice"}
              </strong>
              <p>
                {lang === "si"
                  ? "ඔබ දන්සල තියෙන ස්ථානයේ සිටිනවා නම් පමණක් GPS භාවිතා කරන්න. ඔබ ගෙදරින් හෝ වෙනත් තැනකින් දන්සල එකතු කරනවා නම් Google Maps link එක පමණක් දාන්න."
                  : "Use GPS only if you are physically at the dansal location. If you are adding the dansal from home or somewhere else, use only the Google Maps link."}
              </p>
              <button type="button" className="gps-btn" onClick={useMyLocation}>
                📍{" "}
                {lang === "si"
                  ? "මම දන්සලේ සිටිමි - GPS භාවිතා කරන්න"
                  : "I am at the Dansal - Use GPS"}
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang === "si" ? "Latitude (විකල්ප)" : "Latitude (Optional)"}
              </label>
              <input
                className="form-input"
                name="lat"
                placeholder="6.9271"
                value={form.lat}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang === "si" ? "Longitude (විකල්ප)" : "Longitude (Optional)"}
              </label>
              <input
                className="form-input"
                name="lng"
                placeholder="79.8612"
                value={form.lng}
                onChange={handleChange}
              />
            </div>
          </div>
          <button className="submit-btn" disabled={submitting}>
            {submitting
              ? lang === "si"
                ? "Save වෙමින්..."
                : "Saving..."
              : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
