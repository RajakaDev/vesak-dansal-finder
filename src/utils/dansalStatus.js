export function getDansalTimeStatus(date, openTime, closeTime) {
  if (!date || !openTime) return { label: "Unknown", type: "unknown", countdown: "" };

  const now = new Date();
  const start = new Date(`${date}T${openTime}`);
  const end = closeTime ? new Date(`${date}T${closeTime}`) : null;

  if (now < start) {
    return {
      label: "Coming Soon",
      type: "soon",
      countdown: getCountdown(now, start),
    };
  }

  if (end && now > end) {
    return {
      label: "Ended",
      type: "ended",
      countdown: "",
    };
  }

  return {
    label: "Now Open",
    type: "now",
    countdown: end ? getCountdown(now, end) : "",
  };
}

function getCountdown(now, target) {
  const diff = target - now;
  if (diff <= 0) return "";

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) return `${hours}h ${remMins}m`;
  return `${remMins}m`;
}