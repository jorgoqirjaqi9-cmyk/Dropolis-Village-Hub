import React, { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Link } from "wouter";
import {
  useListChatMessages,
  useSendChatMessage,
  getListChatMessagesQueryKey,
  useGetChatPresence,
  usePingChatPresence,
  useDeleteChatMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, MessageSquare, X, Bot, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BOT_USERNAME = "Δρόπολη Bot";

export default function Chat() {
  const [username, setUsername] = useState(() => localStorage.getItem("dropolis_username") || "");
  const [isJoined, setIsJoined] = useState(!!username);
  const [message, setMessage] = useState("");

  // Scroll container ref — we scroll this directly (no scrollIntoView)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const prevLengthRef = useRef(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useListChatMessages(
    { limit: 100 },
    { query: { refetchInterval: 5000, queryKey: getListChatMessagesQueryKey({ limit: 100 }) } }
  );

  const { data: presenceData } = useGetChatPresence({
    query: { refetchInterval: 30_000, enabled: isJoined, queryKey: ["getChatPresence"] },
  });

  const pingPresence = usePingChatPresence();

  useEffect(() => {
    if (!isJoined || !username) return;
    const ping = () => pingPresence.mutate({ data: { username } });
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, username]);

  const sendMessage = useSendChatMessage();
  const deleteMessage = useDeleteChatMessage();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // First load: jump to bottom without animation
  useEffect(() => {
    if (messages && !initialScrollDone.current) {
      initialScrollDone.current = true;
      prevLengthRef.current = messages.length;
      scrollToBottom("auto");
    }
  }, [messages, scrollToBottom]);

  // Subsequent new messages: smooth scroll to bottom
  useEffect(() => {
    const len = messages?.length ?? 0;
    if (initialScrollDone.current && len > prevLengthRef.current) {
      scrollToBottom("smooth");
    }
    prevLengthRef.current = len;
  }, [messages?.length, scrollToBottom]);

  // Reset scroll state when joining chat
  useEffect(() => {
    if (isJoined) {
      initialScrollDone.current = false;
    }
  }, [isJoined]);

  const handleDelete = (id: number) => {
    deleteMessage.mutate(
      { id, params: { username } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() }),
        onError: () => toast({ title: "Σφάλμα", description: "Δεν ήταν δυνατή η διαγραφή.", variant: "destructive" }),
      }
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("dropolis_username", username.trim());
    setIsJoined(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !username) return;
    sendMessage.mutate(
      { data: { username: username.trim(), message: message.trim() } },
      {
        onSuccess: () => {
          setMessage("");
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
        },
        onError: () => toast({ title: "Σφάλμα", description: "Δεν ήταν δυνατή η αποστολή.", variant: "destructive" }),
      }
    );
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  const getColorForName = (name: string) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const onlineCount = presenceData?.online ?? null;

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <SEO
          title="Κοινότητα — Ζωντανή Συζήτηση"
          description="Συνδεθείτε ζωντανά με την κοινότητα της Δρόπολης."
          noindex={true}
        />
        <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Αρχική
        </Link>

        <div className="w-full max-w-md p-8 bg-card border border-border rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Ζωντανή Συζήτηση</h1>
          <p className="text-muted-foreground mb-4">Επιλέξτε ένα όνομα για να συμμετάσχετε στη συζήτηση.</p>
          <p className="text-xs text-muted-foreground/70 mb-6 flex items-center justify-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-primary/60" />
            Ο <strong className="text-primary/80 mx-1">Δρόπολη Bot</strong> απαντάει σε ερωτήσεις
          </p>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder="Το όνομά σας..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-lg py-6 bg-background"
              autoFocus
            />
            <Button type="submit" className="w-full py-6 text-lg font-bold" disabled={!username.trim()}>
              Είσοδος στο Chat
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Chat screen ────────────────────────────────────────────────────────────
  // API returns messages newest-first; reverse to get chronological order (oldest → newest).
  const ordered = messages ? [...messages].reverse() : [];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEO title="Ζωντανή Συζήτηση" description="Ζωντανή συζήτηση κοινότητας Δρόπολης." noindex={true} />

      {/* ── Header ── */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors mr-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <MessageSquare className="w-5 h-5 text-secondary" />
          <div>
            <h2 className="font-bold text-base leading-tight font-serif">Ζωντανή Συζήτηση</h2>
            <span className="text-xs text-primary-foreground/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
              {onlineCount !== null && (
                <span className="bg-green-400/20 text-green-300 font-semibold px-1.5 py-0.5 rounded-full text-[10px]">
                  {onlineCount}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">{username}</span>
          <Button
            variant="ghost" size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-white text-xs h-7 px-2"
            onClick={() => setIsJoined(false)}
          >
            Αλλαγή
          </Button>
        </div>
      </header>

      {/* ── Bot hint bar ── */}
      <div className="bg-primary/5 border-b border-border/40 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>Ο <strong className="text-primary">Δρόπολη Bot</strong> απαντάει σε όλα τα μηνύματα!</span>
      </div>

      {/* ── Messages scroll area ──
          The outer div is the scroll container.
          The inner div uses min-h-full + justify-end so that when there are
          few messages they stay anchored to the bottom (like WhatsApp). ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="flex flex-col justify-end min-h-full px-4 py-4 gap-3">

          {isLoading && ordered.length === 0 && (
            <div className="text-center text-muted-foreground italic py-10">Φόρτωση μηνυμάτων...</div>
          )}

          {!isLoading && ordered.length === 0 && (
            <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 py-10">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>Δεν υπάρχουν μηνύματα. Κάντε την αρχή!</p>
            </div>
          )}

          {ordered.map((msg, i) => {
            const isMe = msg.username === username;
            const isBot = msg.isBot || msg.username === BOT_USERNAME;
            const showHeader = i === 0 || ordered[i - 1]?.username !== msg.username;

            // ── Bot message ──
            if (isBot) {
              return (
                <div key={msg.id} className="flex justify-start gap-2.5">
                  <div className="w-8 h-8 mt-1 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="max-w-[75%] flex flex-col items-start">
                    {showHeader && (
                      <span className="text-xs font-semibold text-primary/80 mb-1 ml-1 flex items-center gap-1">
                        {BOT_USERNAME}
                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Bot</span>
                      </span>
                    )}
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-primary/8 border border-primary/15 text-foreground shadow-sm">
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 mt-1 ml-1">
                      {format(new Date(msg.createdAt), "HH:mm", { locale: el })}
                    </span>
                  </div>
                </div>
              );
            }

            // ── Human message ──
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2.5`}>
                {!isMe && (
                  <div className="w-8 shrink-0 mt-1">
                    {showHeader && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.avatar || undefined} />
                        <AvatarFallback className={`${getColorForName(msg.username)} text-white text-xs font-bold`}>
                          {getInitials(msg.username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && showHeader && (
                    <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">{msg.username}</span>
                  )}
                  <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border text-foreground rounded-tl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    {isMe && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={deleteMessage.isPending}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors mb-1 shrink-0"
                        title="Διαγραφή"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 mt-1 mx-1">
                    {format(new Date(msg.createdAt), "HH:mm", { locale: el })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 p-3 bg-card border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Γράψτε μήνυμα ή ερώτηση…"
            className="flex-grow bg-background"
            disabled={sendMessage.isPending}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessage.isPending}
            className="shrink-0 px-5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
