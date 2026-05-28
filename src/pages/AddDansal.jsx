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
  "බත් දන්සල", "කොට්ටු", "නූඩ්ල්ස්", "අයිස්ක්‍රීම්", "තේ", "කෝපි",
  "සිසිල් බීම", "සුප්", "පාන්", "කඩල", "මඤ්ඤොක්කා",
  "Rice Dansal", "Kottu", "Noodles", "Ice Cream", "Tea", "Coffee",
];

const locations = [
  "කොළඹ", "ගම්පහ", "කළුතර", "මහනුවර", "ගාල්ල", "මාතර", "කුරුණෑගල",
  "අනුරාධපුර", "රත්නපුර", "බදුල්ල", "යාපනය", "ත්‍රිකුණාමලය",
  "මඩකලපුව", "නුවර එළිය", "හලාවත", "නෙගමෝ", "මීගමුව",
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Galle", "Matara",
  "Kurunegala", "Anuradhapura", "Ratnapura", "Badulla", "Jaffna",
  "Trincomalee", "Batticaloa", "Nuwara Eliya", "Negombo",
  "Nugegoda", "Maharagama", "Dehiwala", "Moratuwa", "Malabe",
  "Battaramulla", "Rajagiriya", "Pettah", "Fort", "Wellawatte",
];

export default function AddDansal({ lang = "si" }) {
  const navigate = useNavigate();
  const t = text[lang] || text.si;

  const [foodTypes, setFoodTypes] = useState(defaultFoodTypes);
  const [newFood, setNewFood] = useState("");

  const [form, setForm] = useState({
    name: "",
    foodType: "",
    location: "",
    exactLocation: "",
    mapLink: "",
    date: "",
    openTime: "",
    closeTime: "",
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

  const submit = async (e) => {
    e.preventDefault();

    if (form.foodType) {
      await setDoc(doc(db, "foodTypes", form.foodType), {
        name: form.foodType,
        createdAt: serverTimestamp(),
      });
    }

    await addDoc(collection(db, "dansals"), {
      ...form,
      queue: "medium",
      status: "open",
      finishVotesCount: 0,
      queueVotesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    navigate("/");
  };

  return (
    <div className="page active">
      <div className="add-form">
        <div style={{ paddingTop: 8 }}>
          <Link className="detail-back" to="/">{t.back}</Link>
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
                placeholder={lang === "si" ? "උදා: නුගේගොඩ බත් දන්සල" : "Example: Nugegoda Rice Dansal"}
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
                <option value="">{lang === "si" ? "ආහාර වර්ගය තෝරන්න" : "Select food type"}</option>
                {foodTypes.map((food) => (
                  <option key={food} value={food}>{food}</option>
                ))}
              </select>

              <div className="food-add-row">
                <input
                  className="food-add-input"
                  placeholder={lang === "si" ? "නව ආහාර වර්ගය" : "New food type"}
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                />
                <button type="button" className="food-add-btn" onClick={addFoodType}>
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
                <option value="">{lang === "si" ? "ප්‍රදේශය තෝරන්න" : "Select location"}</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="form-group form-full">
              <label className="form-label">{t.exact}</label>
              <input
                className="form-input"
                name="exactLocation"
                required
                placeholder={lang === "si" ? "උදා: බස් නැවතුම අසල" : "Example: Near bus stand"}
                value={form.exactLocation}
                onChange={handleChange}
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label">{t.map} <span style={{ color: "var(--vesak-muted)" }}>(Optional)</span></label>
              <input
                className="form-input"
                name="mapLink"
                placeholder="https://maps.google.com/..."
                value={form.mapLink}
                onChange={handleChange}
              />
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
              <label className="form-label">{lang === "si" ? "ආරම්භ වේලාව" : "Start Time"}</label>
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
                <span style={{ color: "var(--vesak-muted)" }}>(Optional)</span>
              </label>
              <input
                className="form-input"
                name="closeTime"
                type="time"
                value={form.closeTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="submit-btn">{t.submit}</button>
        </form>
      </div>
    </div>
  );
}