import { useState, useCallback, useEffect } from "react";

type ContentType = "photo" | "youtube_video" | "uploaded_video" | "news";
type VoteType = "like" | "dislike" | null;

const VOTER_KEY_LS = "dropolis-voter-id";
const VOTES_MAP_LS = "dropolis-votes";

function getOrCreateVoterKey(): string {
  try {
    const existing = localStorage.getItem(VOTER_KEY_LS);
    if (existing) return existing;
    const key = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY_LS, key);
    return key;
  } catch {
    return "anon";
  }
}

function getStoredVote(contentType: ContentType, contentId: number): VoteType {
  try {
    const raw = localStorage.getItem(VOTES_MAP_LS);
    if (!raw) return null;
    const map: Record<string, VoteType> = JSON.parse(raw);
    return map[`${contentType}:${contentId}`] ?? null;
  } catch {
    return null;
  }
}

function storeVote(contentType: ContentType, contentId: number, vote: VoteType) {
  try {
    const raw = localStorage.getItem(VOTES_MAP_LS);
    const map: Record<string, VoteType> = raw ? JSON.parse(raw) : {};
    const key = `${contentType}:${contentId}`;
    if (vote === null) delete map[key];
    else map[key] = vote;
    localStorage.setItem(VOTES_MAP_LS, JSON.stringify(map));
  } catch {}
}

interface VoteButtonsProps {
  contentType: ContentType;
  contentId: number;
  likesCount: number;
  dislikesCount: number;
  compact?: boolean;
}

export function VoteButtons({ contentType, contentId, likesCount, dislikesCount, compact }: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<VoteType>(null);
  const [likes, setLikes] = useState(likesCount);
  const [dislikes, setDislikes] = useState(dislikesCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUserVote(getStoredVote(contentType, contentId));
  }, [contentType, contentId]);

  const handleVote = useCallback(async (action: "like" | "dislike") => {
    if (busy) return;
    setBusy(true);

    const prev = userVote;
    const isToggleOff = prev === action;
    const newVote: VoteType = isToggleOff ? null : action;

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

    setUserVote(newVote);
    storeVote(contentType, contentId, newVote);
    setLikes(nl);
    setDislikes(nd);

    try {
      const voterKey = getOrCreateVoterKey();
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId, voteType: action, voterKey }),
      });
      if (res.ok) {
        const data = await res.json() as { likesCount: number; dislikesCount: number };
        setLikes(data.likesCount);
        setDislikes(data.dislikesCount);
      } else {
        throw new Error("vote failed");
      }
    } catch {
      setUserVote(prev);
      storeVote(contentType, contentId, prev);
      setLikes(likesCount);
      setDislikes(dislikesCount);
    } finally {
      setBusy(false);
    }
  }, [busy, userVote, likes, dislikes, contentType, contentId, likesCount, dislikesCount]);

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
