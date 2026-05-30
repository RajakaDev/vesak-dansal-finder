import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Link } from "react-router-dom";
import { db } from "../firebase";

const ADMIN_EMAIL = "udararajaka80@gmail.com";

export default function Admin({ lang = "si" }) {
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [dansals, setDansals] = useState([]);
  const [photosByDansal, setPhotosByDansal] = useState({});

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, [auth]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(collection(db, "dansals"), async (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDansals(data);

      const photoData = {};
      for (const item of data) {
        const photoSnap = await getDocs(
          collection(db, "dansals", item.id, "photos")
        );
        photoData[item.id] = photoSnap.docs.map((p) => ({
          id: p.id,
          ...p.data(),
        }));
      }
      setPhotosByDansal(photoData);
    });

    return () => unsub();
  }, [isAdmin]);

  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const updateDansal = async (id, data) => {
    await updateDoc(doc(db, "dansals", id), data);
  };

  const deleteDansal = async (id) => {
    const ok = confirm("Delete this dansal permanently?");
    if (!ok) return;

    await deleteDoc(doc(db, "dansals", id));
  };

  const deletePhoto = async (dansalId, photoId) => {
    const ok = confirm("Delete this photo from website?");
    if (!ok) return;

    await deleteDoc(doc(db, "dansals", dansalId, "photos", photoId));
  };

  if (!user) {
    return (
      <div className="page active">
        <div className="add-form">
          <Link className="detail-back" to="/">← Back</Link>
          <div className="form-section-title">🔐 Admin Login</div>
          <button className="submit-btn" onClick={login}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page active">
        <div className="add-form">
          <div className="form-section-title">Access Denied</div>
          <p className="form-section-desc">{user.email}</p>
          <button className="close-btn" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="add-form">
        <Link className="detail-back" to="/">← Back</Link>

        <div className="form-section-title">🛠 Admin Dashboard</div>
        <p className="form-section-desc">
          Logged in as {user.email}
        </p>

        <button className="close-btn" onClick={() => signOut(auth)}>
          Logout
        </button>
      </div>

      <div className="admin-list">
        {dansals.map((d) => (
          <div key={d.id} className="admin-card">
            <div className="admin-card-head">
              <div>
                <h3>🍛 {d.name}</h3>
                <p>📍 {d.location} {d.customLocation}</p>
                <p>🍽️ {d.foodType}</p>
                <p>⚠️ Reports: {d.reportCount || 0}</p>
                <p>Status: {d.status || "open"}</p>
                <p>Hidden: {d.hidden ? "Yes" : "No"}</p>
                <p>Verified: {d.verified ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="admin-actions">
              <button
                onClick={() => updateDansal(d.id, { hidden: !d.hidden })}
              >
                {d.hidden ? "Unhide" : "Hide"}
              </button>

              <button
                onClick={() =>
                  updateDansal(d.id, { verified: !d.verified })
                }
              >
                {d.verified ? "Remove Verify" : "Verify"}
              </button>

              <button
                onClick={() =>
                  updateDansal(d.id, {
                    status: d.status === "closed" ? "open" : "closed",
                  })
                }
              >
                {d.status === "closed" ? "Mark Open" : "Mark Closed"}
              </button>

              <button className="danger" onClick={() => deleteDansal(d.id)}>
                Delete
              </button>
            </div>

            <div className="admin-photos">
              {(photosByDansal[d.id] || []).map((p) => (
                <div key={p.id} className="admin-photo-item">
                  <img src={p.url} alt="memory" />
                  <button
                    className="danger"
                    onClick={() => deletePhoto(d.id, p.id)}
                  >
                    Delete Photo
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}