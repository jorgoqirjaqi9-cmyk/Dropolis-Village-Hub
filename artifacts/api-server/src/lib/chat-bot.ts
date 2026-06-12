import { GoogleGenAI } from "@google/genai";
import { db, chatMessagesTable } from "@workspace/db";
import { logger } from "./logger.js";

const BOT_USERNAME = "Δρόπολη Bot";
const BOT_AVATAR = "__bot__";

const SYSTEM_PROMPT = `Είσαι ο βοηθός του Dropolis (dropolis.net), ένας φιλικός chatbot για την κοινότητα της Δρόπολης (Βόρεια Ήπειρος, Αλβανία).

Γνωρίζεις:
- Το Dropolis είναι το μοναδικό ελληνόφωνο portal για τα 41 χωριά του Δήμου Δρόπολης στη Βόρεια Ήπειρο
- Η περιοχή βρίσκεται στη νότια Αλβανία, κοντά στα Ιωάννινα
- Γνωστά χωριά: Δερβιτσιάνη, Μπουφί, Λευτεροχώρι, Σοφράτικα, Γραδίστα, Παλιάσα, Χόρμοβο, Βρισεράς και άλλα
- Το site έχει ειδήσεις, φωτογραφίες, βίντεο, κατάλογο χωριών και ζωντανή συζήτηση
- Η ελληνική μειονότητα της Βόρειας Ηπείρου έχει πλούσια ιστορία και πολιτισμό

Κανόνες:
- Απάντα ΠΑΝΤΑ στα Ελληνικά, ζεστά και φιλικά
- Κράτα τις απαντήσεις σύντομες (1-3 προτάσεις)
- Αν δεν ξέρεις κάτι, πες το ειλικρινά
- Μην εφεύρεις πληροφορίες για συγκεκριμένα άτομα ή γεγονότα
- Αν σε ρωτάνε για ειδήσεις, παρέπεμψε στο /news
- Αν σε ρωτάνε για χωριά, παρέπεμψε στο /villages`;

function shouldRespond(message: string, username: string): boolean {
  if (username === BOT_USERNAME) return false;

  const lower = message.toLowerCase().trim();

  // Always respond to direct mentions
  if (lower.includes("bot") || lower.includes("δρόπολη bot") || lower.includes("dropolis bot")) return true;

  // Always respond to questions
  if (message.includes("?") || lower.includes("ποιος") || lower.includes("πού") ||
      lower.includes("πως") || lower.includes("πώς") || lower.includes("τι ") ||
      lower.includes("γιατί") || lower.includes("πότε") || lower.includes("πόσο")) return true;

  // Respond to greetings
  if (lower.match(/^(γεια|καλημ|καλησπ|χαίρε|hello|hi |hey|καλωσ)/)) return true;

  // Respond to thanks
  if (lower.includes("ευχαριστ") || lower.includes("μπράβο")) return true;

  return false;
}

export async function maybeRespondToMessage(userMessage: string, username: string): Promise<void> {
  if (!shouldRespond(userMessage, username)) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not set — chat bot disabled");
    return;
  }

  // Small human-like delay
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 1800));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nΜήνυμα χρήστη (${username}): ${userMessage}` }] },
      ],
      config: { maxOutputTokens: 200 },
    });

    const reply = response.text?.trim();
    if (!reply) return;

    await db.insert(chatMessagesTable).values({
      username: BOT_USERNAME,
      message: reply,
      avatar: BOT_AVATAR,
      isBot: true,
    });

    logger.info({ username, userMessage: userMessage.slice(0, 80) }, "Chat bot replied");
  } catch (err) {
    logger.warn({ err }, "Chat bot response failed");
  }
}
