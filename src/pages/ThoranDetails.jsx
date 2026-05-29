import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Link, useParams } from "react-router-dom";
import { db, getCurrentUserId } from "../firebase";
import { getDansalTimeStatus } from "../utils/dansalStatus";

const CLOUDINARY_CLOUD_NAME = "dv0b0ygkn";
const CLOUDINARY_UPLOAD_PRESET = "vesak_dansal_unsigned";
const PHOTO_LIMIT = 25;

export default function ThoranDetails({ lang = "si" }) {
  const { id } = useParams();

  const [thoran, setThoran] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubThoran = onSnapshot(doc(db, "thorans", id), (snap) => {
      if (snap.exists()) setThoran({ id: snap.id, ...snap.data() });
    });

    const commentsQuery = query(
      collection(db, "thorans", id, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubComments = onSnapshot(commentsQuery, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const photosQuery = query(
      collection(db, "thorans", id, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubPhotos = onSnapshot(photosQuery, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubThoran();
      unsubComments();
      unsubPhotos();
    };
  }, [id]);

  const shareThoran = async () => {
    if (!thoran) return;

    const shareData = {
      title: thoran.name,
      text: `${thoran.name} - ${thoran.location}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const reportWrongInfo = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const reason = prompt(
      lang === "si"
        ? "වැරදි තොරතුර කෙටියෙන් ලියන්න:"
        : "Briefly explain what is wrong:"
    );

    if (!reason?.trim()) return;

    await setDoc(doc(db, "thorans", id, "reports", userId), {
      reason: reason.trim(),
      createdAt: serverTimestamp(),
    });

    const snap = await getDocs(collection(db, "thorans", id, "reports"));
    const count = snap.size;

    await updateDoc(doc(db, "thorans", id), {
      reportCount: count,
      hidden: count >= 10,
      updatedAt: serverTimestamp(),
    });

    alert(`Report received. Reports: ${count}/10`);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    await addDoc(collection(db, "thorans", id, "comments"), {
      message: comment.trim(),
      user: "anonymous",
      createdAt: serverTimestamp(),
    });

    setComment("");
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= PHOTO_LIMIT) {
      alert(`Maximum ${PHOTO_LIMIT} photos allowed.`);
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      data.append("folder", "vesak-thoran-memories");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: data }
      );

      const uploaded = await res.json();

      if (!uploaded.secure_url) throw new Error("Upload failed");

      await addDoc(collection(db, "thorans", id, "photos"), {
        url: uploaded.secure_url,
        publicId: uploaded.public_id || "",
        createdAt: serverTimestamp(),
      });

      if (photos.length >= 0 && comments.length >= 0) {
        await updateDoc(doc(db, "thorans", id), {
          verified: true,
          verifiedType: "community",
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Photo upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!thoran) return <div className="empty-state">Loading...</div>;

  const timeStatus = getDansalTimeStatus(
    thoran.date,
    thoran.startTime,
    thoran.endTime
  );

  return (
    <div className="page active page-detail">
      <div className="detail-hero">
        <Link className="detail-back" to="/thorans">
          ← {lang === "si" ? "සියලු තොරණ" : "All Thorans"}
        </Link>

        <div className="detail-name">
          🏮 {thoran.name}
          {thoran.verified && (
            <span className="verified-badge">
              ✅ {lang === "si" ? "තහවුරුයි" : "Verified"}
            </span>
          )}
        </div>

        <div className="detail-meta">
          <div className="detail-meta-row">
            📍 {thoran.location} — {thoran.customLocation} —{" "}
            {thoran.exactLocation}
          </div>

          <div className="detail-meta-row">
            🕒 {thoran.startTime} {thoran.endTime ? `– ${thoran.endTime}` : ""} |
            📅 {thoran.date}
          </div>

          <div className="detail-meta-row">
            ⏳ {timeStatus.label}{" "}
            {timeStatus.countdown ? `(${timeStatus.countdown})` : ""}
          </div>

          {thoran.description && (
            <div className="detail-meta-row">📝 {thoran.description}</div>
          )}

          {thoran.mapLink && (
            <div className="detail-meta-row" style={{ marginTop: 6 }}>
              <a className="map-link-btn" href={thoran.mapLink} target="_blank">
                📍 {lang === "si" ? "Map එක බලන්න" : "Open Map"}
              </a>
            </div>
          )}

          <button className="share-btn" onClick={shareThoran}>
            📤 {lang === "si" ? "තොරණ බෙදාගන්න" : "Share Thoran"}
          </button>

          <button className="report-btn" onClick={reportWrongInfo}>
            ⚠️{" "}
            {lang === "si"
              ? "වැරදි තොරතුරක් Report කරන්න"
              : "Report Wrong Info"}
          </button>

          <p className="small-note">Reports: {thoran.reportCount || 0}/10</p>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">
          {lang === "si" ? "තොරණ මතකයන්" : "Thoran Memories"}
        </div>

        <p className="small-note">
          Photos {photos.length}/{PHOTO_LIMIT}
        </p>

        <input
          className="form-input"
          type="file"
          accept="image/*"
          disabled={uploading || photos.length >= PHOTO_LIMIT}
          onChange={uploadPhoto}
        />

        {uploading && <p className="small-note">Uploading...</p>}

        <div className="photo-grid">
          {photos.map((p) => (
            <img key={p.id} src={p.url} alt="Thoran memory" />
          ))}
        </div>
      </div>

      <div className="detail-section" style={{ marginTop: 20 }}>
        <div className="detail-section-title">
          {lang === "si" ? "සජීවී යාවත්කාලීන" : "Live Updates"}
        </div>

        <form className="comment-form" onSubmit={addComment}>
          <input
            className="comment-input"
            placeholder={
              lang === "si"
                ? "සජීවී යාවත්කාලීනයක් එක් කරන්න..."
                : "Add live update or comment..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button className="comment-send">
            {lang === "si" ? "යවන්න" : "Send"}
          </button>
        </form>

        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              {c.message}
              <div className="comment-time">anonymous</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}