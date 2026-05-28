export function timeAgo(timestamp, lang = "si") {
  if (!timestamp?.toDate) {
    return lang === "si" ? "තවම යාවත්කාලීන නැත" : "Not updated yet";
  }

  const date = timestamp.toDate();
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return lang === "si" ? "දැන් යාවත්කාලීනයි" : "Updated just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return lang === "si"
      ? `මිනිත්තු ${minutes}කට පෙර`
      : `Updated ${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === "si"
      ? `පැය ${hours}කට පෙර`
      : `Updated ${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return lang === "si"
    ? `දින ${days}කට පෙර`
    : `Updated ${days} days ago`;
}