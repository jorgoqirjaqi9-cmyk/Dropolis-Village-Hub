import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useListChatMessages, useSendChatMessage, getListChatMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [username, setUsername] = useState(() => localStorage.getItem("dropolis_username") || "");
  const [isJoined, setIsJoined] = useState(!!username);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for messages every 5 seconds
  const { data: messages, isLoading } = useListChatMessages(
    { limit: 100 },
    { query: { refetchInterval: 5000, queryKey: getListChatMessagesQueryKey({ limit: 100 }) } }
  );

  const sendMessage = useSendChatMessage();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        onError: () => {
          toast({
            title: "Σφάλμα",
            description: "Δεν ήταν δυνατή η αποστολή του μηνύματος. Δοκιμάστε ξανά.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  const getColorForName = (name: string) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!isJoined) {
    return (
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto mt-10 p-8 glass-card rounded-2xl shadow-xl text-center">
        <SEO
          title="Κοινότητα — Ζωντανή Συζήτηση"
          description="Συνδεθείτε ζωντανά με την κοινότητα της Δρόπολης. Chat για Έλληνες της Βόρειας Ηπείρου."
          noindex={true}
        />
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Κοινότητα</h1>
        <p className="text-muted-foreground mb-8">Επιλέξτε ένα όνομα για να συμμετάσχετε στη ζωντανή συζήτηση με άλλους συμπατριώτες.</p>
        
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

  return (
    <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-card rounded-2xl shadow-xl overflow-hidden">
      <SEO title="Ζωντανή Συζήτηση" description="Ζωντανή συζήτηση κοινότητας Δρόπολης." noindex={true} />
      
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-secondary" />
          <div>
            <h1 className="font-bold text-lg leading-tight font-serif">Ζωντανή Συζήτηση</h1>
            <span className="text-xs text-primary-foreground/70 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{username}</span>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-white text-xs h-8" onClick={() => setIsJoined(false)}>
            Αλλαγή Ονόματος
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 bg-background/50">
        {isLoading && !messages ? (
          <div className="text-center text-muted-foreground italic py-10">Φόρτωση μηνυμάτων...</div>
        ) : messages && messages.length > 0 ? (
          messages.slice().reverse().map((msg, i) => {
            const isMe = msg.username === username;
            const showHeader = i === 0 || messages[messages.length - i]?.username !== msg.username;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3`}>
                {!isMe && showHeader && (
                  <Avatar className="w-8 h-8 mt-1 shrink-0">
                    <AvatarImage src={msg.avatar || undefined} />
                    <AvatarFallback className={`${getColorForName(msg.username)} text-white text-xs font-bold`}>
                      {getInitials(msg.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && !showHeader && <div className="w-8 shrink-0"></div>}
                
                <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && showHeader && (
                    <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">{msg.username}</span>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-card border border-card-border text-foreground rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 mx-1">
                    {format(new Date(msg.createdAt), "HH:mm", { locale: el })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 opacity-50">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>Δεν υπάρχουν μηνύματα ακόμα. Κάντε την αρχή!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-card-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Γράψτε ένα μήνυμα..."
            className="flex-grow bg-background border-input"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessage.isPending}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            Αποστολή
          </Button>
        </form>
      </div>
    </div>
    </div>
  );
}
