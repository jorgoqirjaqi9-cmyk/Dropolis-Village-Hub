import { db, chatMessagesTable } from "@workspace/db";
import { logger } from "./logger.js";

const BOT_USERNAME = "\u0394\u03c1\u03cc\u03c0\u03bf\u03bb\u03b7 Bot";
const BOT_AVATAR = "__bot__";

function shouldRespond(username: string): boolean {
  return username.trim().toLocaleLowerCase("el-GR") !== BOT_USERNAME.toLocaleLowerCase("el-GR");
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("el-GR");
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function buildFreeBotReply(userMessage: string, username: string): string {
  const text = normalizeText(userMessage);
  const cleanName = username.trim() || "file";

  if (includesAny(text, ["geia", "hello", "hi", "kalimera", "kalispera", "xaire", "\u03b3\u03b5\u03b9\u03b1", "\u03ba\u03b1\u03bb\u03b7\u03bc\u03b5\u03c1\u03b1", "\u03ba\u03b1\u03bb\u03b7\u03c3\u03c0\u03b5\u03c1\u03b1"])) {
    return "Geia sou " + cleanName + "! Eimai edo gia na voithiso me tin Dropoli, ta choria, tis eidiseis kai ti sizitisi tis koinotitas.";
  }

  if (includesAny(text, ["news", "nea", "eidise", "\u03bd\u03b5\u03b1", "\u03b5\u03b9\u03b4\u03b7\u03c3"])) {
    return "Gia nees eidiseis anoixe ti selida /news. An theleis, grapse kai ti akrivos psaxneis.";
  }

  if (includesAny(text, ["xorio", "chori", "village", "villages", "dropoli", "dervitsani", "droviani", "\u03c7\u03c9\u03c1\u03b9", "\u03b4\u03c1\u03bf\u03c0\u03bf\u03bb"])) {
    return "Gia plirofories gia ta choria koita ti selida /villages. Mporo episis na se voithiso an grapesei onoma choriou.";
  }

  if (includesAny(text, ["photo", "foto", "video", "eikona", "\u03c6\u03c9\u03c4\u03bf", "\u03b2\u03b9\u03bd\u03c4\u03b5\u03bf"])) {
    return "Gia fotografies kai video des tis selides /photos kai /videos. Ekei mazevontai yliko kai anamniseis apo tin koinotita.";
  }

  if (includesAny(text, ["thanks", "thx", "efxaristo", "euxaristo", "\u03b5\u03c5\u03c7\u03b1\u03c1\u03b9\u03c3\u03c4"])) {
    return "Na sai kala! Eimai edo an xreiasteis kati gia ti Dropoli i to site.";
  }

  if (userMessage.trim().endsWith("?")) {
    return "Kali erotisi. Mporo na voithiso me genikes plirofories gia Dropoli, choria, eidiseis, fotografies kai ti leitourgia tou site.";
  }

  return "Se akouo, " + cleanName + ". Mporo na voithiso gia Dropoli, choria, eidiseis, fotografies i genikes erotiseis tis koinotitas.";
}

export async function maybeRespondToMessage(userMessage: string, username: string): Promise<void> {
  if (!shouldRespond(username)) return;

  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 1200));

  try {
    const reply = buildFreeBotReply(userMessage, username);

    await db.insert(chatMessagesTable).values({
      username: BOT_USERNAME,
      message: reply,
      avatar: BOT_AVATAR,
      isBot: true,
    });

    logger.info({ username, userMessage: userMessage.slice(0, 80) }, "Free chat bot replied");
  } catch (err) {
    logger.warn({ err }, "Free chat bot response failed");
  }
}
