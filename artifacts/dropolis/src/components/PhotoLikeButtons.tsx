import { useState, useCallback } from "react";

type VoteType = "like" | "dislike" | null;
const LS_KEY = "dropolis-photo-votes";

function getStoredVote(photoId: number): VoteType {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return (JSON.parse(raw)[photoId] as VoteType) ?? null;
  } catch {
    return null;
  }
}

function storeVote(photoId: number, vote: VoteType) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const map: Record<number, VoteType> = raw ? JSON.parse(raw) : {};
    if (vote === null) delete map[photoId];
    else map[photoId] = vote;
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

interface Props {
  photoId: number;
  initialLikes: number;
  initialDislikes: number;
  compact?: boolean;
}

export function PhotoLikeButtons({ photoId, initialLikes, initialDislikes, compact }: Props) {
  const [userVote, setUserVote] = useState<VoteType>(() => getStoredVote(photoId));
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [busy, setBusy] = useState(false);

  const handleVote = useCallback(async (action: "like" | "dislike") => {
    if (busy) return;
    setBusy(true);

    const prev = userVote;
    const isToggleOff = prev === action;
    const newVote: VoteType = isToggleOff ? null : action;

    // Compute optimistic counts
    let nl = likes;
    let nd = dislikes;
    if (isToggleOff) {
      if (action === "like") nl = Math.max(0, nl - 1);
      else nd = Math.max(0, nd - 1);
    } else {
      if (prev === "like") nl = Math.max(0, nl - 1);
      if (prev === "dislike") nd = Math.max(0, nd - 1);
      if (action === "like") nl++;
      else nd++;
    }

    // Optimistic apply
    setUserVote(newVote);
    storeVote(photoId, newVote);
    setLikes(nl);
    setDislikes(nd);

    try {
      const reqs: Promise<Response>[] = [];
      if (isToggleOff) {
        reqs.push(fetch(`/api/photos/${photoId}/${action}`, { method: "DELETE" }));
      } else {
        if (prev !== null) {
          reqs.push(fetch(`/api/photos/${photoId}/${prev}`, { method: "DELETE" }));
        }
        reqs.push(fetch(`/api/photos/${photoId}/${action}`, { method: "POST" }));
      }
      await Promise.all(reqs);
    } catch {
      // Revert on network error
      setUserVote(prev);
      storeVote(photoId, prev);
      setLikes(likes);
      setDislikes(dislikes);
    } finally {
      setBusy(false);
    }
  }, [busy, userVote, likes, dislikes, photoId]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleVote("like")}
          disabled={busy}
          aria-label="Μου αρέσει"
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all disabled:opacity-60 ${
            userVote === "like"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          }`}
        >
          ❤️ {likes}
        </button>
        <button
          onClick={() => handleVote("dislike")}
          disabled={busy}
          aria-label="Δεν μου αρέσει"
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all disabled:opacity-60 ${
            userVote === "dislike"
              ? "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 font-semibold"
              : "text-muted-foreground hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          👎 {dislikes}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote("like")}
        disabled={busy}
        aria-label="Μου αρέσει"
        className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 ${
          userVote === "like"
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold"
            : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        }`}
      >
        ❤️ <span>{likes}</span>
      </button>
      <button
        onClick={() => handleVote("dislike")}
        disabled={busy}
        aria-label="Δεν μου αρέσει"
        className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 ${
          userVote === "dislike"
            ? "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 font-semibold"
            : "text-muted-foreground hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        👎 <span>{dislikes}</span>
      </button>
    </div>
  );
}
