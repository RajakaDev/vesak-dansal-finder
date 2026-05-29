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

export default function DansalDetails({ lang = "si" }) {
  const { id } = useParams();

  const [dansal, setDansal] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubDansal = onSnapshot(doc(db, "dansals", id), (snap) => {
      if (snap.exists()) setDansal({ id: snap.id, ...snap.data() });
    });

    const commentsQuery = query(
      collection(db, "dansals", id, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubComments = onSnapshot(commentsQuery, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const photosQuery = query(
      collection(db, "dansals", id, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubPhotos = onSnapshot(photosQuery, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubDansal();
      unsubComments();
      unsubPhotos();
    };
  }, [id]);

  const checkAutoVerify = async () => {
    const photoSnap = await getDocs(collection(db, "dansals", id, "photos"));
    const queueSnap = await getDocs(collection(db, "dansals", id, "queueVotes"));
    const commentSnap = await getDocs(collection(db, "dansals", id, "comments"));

    if (photoSnap.size >= 1 && queueSnap.size >= 1 && commentSnap.size >= 1) {
      await updateDoc(doc(db, "dansals", id), {
        verified: true,
        verifiedType: "community",
        updatedAt: serverTimestamp(),
      });
    }
  };

  const shareDansal = async () => {
    if (!dansal) return;

    const shareData = {
      title: dansal.name,
      text: `${dansal.name} - ${dansal.location}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(lang === "si" ? "Link copied!" : "Link copied!");
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

    await setDoc(doc(db, "dansals", id, "reports", userId), {
      reason: reason.trim(),
      createdAt: serverTimestamp(),
    });

    const snap = await getDocs(collection(db, "dansals", id, "reports"));
    const count = snap.size;

    await updateDoc(doc(db, "dansals", id), {
      reportCount: count,
      hidden: count >= 10,
      updatedAt: serverTimestamp(),
    });

    alert(
      lang === "si"
        ? `Report එක ලැබුණා. දැන් reports: ${count}/10`
        : `Report received. Reports: ${count}/10`
    );
  };

  const updateQueueVote = async (queue) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await setDoc(doc(db, "dansals", id, "queueVotes", userId), {
      queue,
      createdAt: serverTimestamp(),
    });

    await calculateQueueResult();
    await checkAutoVerify();
  };

  const calculateQueueResult = async () => {
    const snap = await getDocs(collection(db, "dansals", id, "queueVotes"));
    const votes = snap.docs.map((d) => d.data().queue);

    const counts = votes.reduce((acc, q) => {
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {});

    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    if (votes.length >= 10 && winner) {
      await updateDoc(doc(db, "dansals", id), {
        queue: winner[0],
        queueVotesCount: votes.length,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, "dansals", id), {
        queueVotesCount: votes.length,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const voteFoodFinished = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await setDoc(doc(db, "dansals", id, "finishVotes", userId), {
      finished: true,
      createdAt: serverTimestamp(),
    });

    const snap = await getDocs(collection(db, "dansals", id, "finishVotes"));
    const count = snap.size;

    await updateDoc(doc(db, "dansals", id), {
      status: count >= 10 ? "closed" : dansal.status || "open",
      finishVotesCount: count,
      updatedAt: serverTimestamp(),
    });
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    await addDoc(collection(db, "dansals", id, "comments"), {
      message: comment.trim(),
      user: "anonymous",
      createdAt: serverTimestamp(),
    });

    setComment("");
    await checkAutoVerify();
  };

  const uploadMemoryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= PHOTO_LIMIT) {
      alert(
        lang === "si"
          ? `ඡායාරූප ${PHOTO_LIMIT}ක් පමණයි.`
          : `Maximum ${PHOTO_LIMIT} photos allowed.`
      );
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      data.append("folder", "vesak-dansal-memories");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const uploaded = await res.json();

      if (!uploaded.secure_url) {
        throw new Error("Upload failed");
      }

      await addDoc(collection(db, "dansals", id, "photos"), {
        url: uploaded.secure_url,
        publicId: uploaded.public_id || "",
        createdAt: serverTimestamp(),
      });

      await checkAutoVerify();
    } catch (err) {
      console.error(err);
      alert(
        lang === "si"
          ? "ඡායාරූපය upload වුණේ නැහැ."
          : "Photo upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!dansal) return <div className="empty-state">Loading...</div>;

  const timeStatus = getDansalTimeStatus(
    dansal.date,
    dansal.openTime,
    dansal.closeTime
  );

  return (
    <div className="page active page-detail">
      <div className="detail-hero">
        <Link className="detail-back" to="/">
          ← {lang === "si" ? "සියලු දන්සල්" : "All Dansals"}
        </Link>

        <div className="detail-name">
          🏮 {dansal.name}
          {dansal.verified && (
            <span className="verified-badge">
              ✅ {lang === "si" ? "තහවුරුයි" : "Verified"}
            </span>
          )}
        </div>

        <div className="detail-meta">
          <div className="detail-meta-row">
            📍 {dansal.location} — {dansal.exactLocation}
          </div>

          <div className="detail-meta-row">🍽️ {dansal.foodType}</div>

          <div className="detail-meta-row">
            🕒 {dansal.openTime}{" "}
            {dansal.closeTime ? `– ${dansal.closeTime}` : ""} | 📅{" "}
            {dansal.date}
          </div>

          <div className="detail-meta-row">
            ⏳ {timeStatus.label}{" "}
            {timeStatus.countdown ? `(${timeStatus.countdown})` : ""}
          </div>

          {dansal.mapLink && (
            <div className="detail-meta-row" style={{ marginTop: 6 }}>
              <a className="map-link-btn" href={dansal.mapLink} target="_blank">
                📍 {lang === "si" ? "Map එක බලන්න" : "Open Map"}
              </a>
            </div>
          )}

          <button className="share-btn" onClick={shareDansal}>
            📤 {lang === "si" ? "දන්සල බෙදාගන්න" : "Share Dansal"}
          </button>

          <button className="report-btn" onClick={reportWrongInfo}>
            ⚠️{" "}
            {lang === "si"
              ? "වැරදි තොරතුරක් Report කරන්න"
              : "Report Wrong Info"}
          </button>

          <p className="small-note">Reports: {dansal.reportCount || 0}/10</p>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">
          {lang === "si" ? "පෝලිම යාවත්කාලීන කරන්න" : "Update Queue Status"}
        </div>

        <p className="small-note">
          {lang === "si"
            ? `පෝලිම වෙනස් වන්නේ අවම ඡන්ද 10කට පසුවයි. දැන් ඡන්ද: ${
                dansal.queueVotesCount || 0
              }`
            : `Queue status updates only after minimum 10 user votes. Current votes: ${
                dansal.queueVotesCount || 0
              }`}
        </p>

        <div className="queue-grid">
          <button className="queue-btn qb-no" onClick={() => updateQueueVote("no")}>
            🟢 {lang === "si" ? "පෝලිම නැහැ" : "No Queue"}
          </button>
          <button className="queue-btn qb-short" onClick={() => updateQueueVote("short")}>
            🟡 {lang === "si" ? "කෙටි" : "Short"}
          </button>
          <button className="queue-btn qb-medium" onClick={() => updateQueueVote("medium")}>
            🟠 {lang === "si" ? "මධ්‍යම" : "Medium"}
          </button>
          <button className="queue-btn qb-long" onClick={() => updateQueueVote("long")}>
            🔴 {lang === "si" ? "දිග" : "Long"}
          </button>
        </div>

        <button className="close-btn" onClick={voteFoodFinished}>
          ✕ {lang === "si" ? "ආහාර අවසන් ඡන්දය" : "Food Finished Vote"} (
          {dansal.finishVotesCount || 0}/10)
        </button>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">
          {lang === "si" ? "දන්සල් මතකයන්" : "Dansal Memories"}
        </div>

        <p className="small-note">
          {lang === "si"
            ? `ඡායාරූප ${photos.length}/${PHOTO_LIMIT}`
            : `Photos ${photos.length}/${PHOTO_LIMIT}`}
        </p>

        <input
          className="form-input"
          type="file"
          accept="image/*"
          disabled={uploading || photos.length >= PHOTO_LIMIT}
          onChange={uploadMemoryPhoto}
        />

        {uploading && (
          <p className="small-note">
            {lang === "si" ? "Upload වෙමින්..." : "Uploading..."}
          </p>
        )}

        <div className="photo-grid">
          {photos.map((p) => (
            <img key={p.id} src={p.url} alt="Dansal memory" />
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