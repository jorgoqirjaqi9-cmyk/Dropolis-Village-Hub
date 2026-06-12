import { Buffer } from "node:buffer";
import { db, chatMessagesTable } from "@workspace/db";
import { logger } from "./logger.js";

const BOT_USERNAME = "\u0394\u03c1\u03cc\u03c0\u03bf\u03bb\u03b7 Bot";
const BOT_AVATAR = "__bot__";

const G1 = "zprOsc67z47PgiDOrs+BzrjOtc+Ce25hbWV9ISDOp86xzq/Pgc6/zrzOsc65IM+Azr/PhSDOtc6vz4POsc65IM61zrTPji4gzqHPjs+EzrfPg86tIM68zrUgzrPOuc6xIM+Hz4nPgc65zqwsIM69zq3OsSwgz4bPic+Ezr/Os8+BzrHPhs6vzrXPgiDOriDPjCzPhM65IM+Hz4HOtc65zqzOts61z4POsc65IM6zzrnOsSDPhM63IM6Uz4HPjM+Azr/Ou863Lg==";
const G2 = "zpPOtc65zrEgz4POv8+Fe25hbWV9LiDOmM6xIM68zrnOu86sz4kgzrXOu867zrfOvc65zrrOrCwgzrbOtc+Dz4TOrCDOus6xzrkgzrrOsc64zrHPgc6sLiDOoM61z4IgzrzOv8+FIM+Ezrkgz4jOrM+Hzr3Otc65z4IgzrrOsc65IM64zrEgz4POtSDOss6/zrfOuM6uz4PPiSDPjM+Dzr8gz4DOuc6/IM+MzrzOv8+Bz4bOsSDOvM+Azr/Pgc+OLg==";
const NEWS = "zpPOuc6xIM+EzrEgzr3Orc6xIM+Azq7Os86xzrnOvc61IM+Dz4TOtyDPg861zrvOr860zrEgL25ld3MuIM6Rzr0gzrzOv8+FIM+AzrXOuc+CIM64zq3OvM6xIM6uIM+Hz4nPgc65z4wsIM64zrEgz4POtSDOus6xz4TOtc+FzrjPjc69z4kgz4DOuc6/IM+Dz4nPg8+Ezqwu";
const VILLAGES = "zpcgzrrOsc+BzrTOuc6sIM+Ezr/PhSBEcm9wb2xpcyDOtc6vzr3Osc65IM+EzrEgz4fPic+BzrnOrCDPhM63z4IgzpTPgc+Mz4DOv867zrfPgi4gzpTOtc+CIM+Ezr8gL3ZpbGxhZ2VzIM66zrHOuSDOs8+BzqzPiM61IM68zr/PhSDPgM6/zrnOvyDPh8+Jz4HOuc+MIM+DzrUgzrXOvc60zrnOsc+Gzq3Pgc61zrku";
const MEDIA = "zpPOuc6xIM+Gz4nPhM6/zrPPgc6xz4bOr861z4IgzrrOsc65IM6yzq/Ovc+EzrXOvyDOtM61z4Igz4TOuc+CIM+DzrXOu86vzrTOtc+CIC9waG90b3MgzrrOsc65IC92aWRlb3MuIM6VzrrOtc6vIM63IM68zr3Ors68zrcgzrzOuc67zqzOtc65IM+AzrnOvyDOtM+Fzr3Osc+Ezqwu";
const WHO = "zpXOr868zrHOuSDOvyDPiM63z4bOuc6xzrrPjM+CIM6yzr/Ot864z4zPgiDPhM63z4IgzpTPgc+Mz4DOv867zrfPgi4gzpTOtc69IM6tz4fPiSDOt867zrnOus6vzrEsIM6tz4fPiSDPjM68z4nPgiDOtM65zqzOuM61z4POtyDOvc6xIM66z4HOsc+EzqzPiSDPhM63IM+Dz4XOts6uz4TOt8+DzrcgzrbPic69z4TOsc69zq4gzrrOsc65IM+MzrzOv8+Bz4bOty4=";
const THANKS = "zpzOtSDPh86xz4HOrHtuYW1lfSEgzp3OsSDOtc6vz4POsc65IM66zrHOu86sLiDOjCzPhM65IM+Hz4HOtc65zrHPg8+EzrXOr8+CIM6zzrnOsSDPhM6/IERyb3BvbGlzLCDPgc+Oz4TOsSDOvM61IM61zrvOtc+NzrjOtc+BzrEu";
const QUESTION = "zqnPgc6xzq/OsSDOtc+Bz47PhM63z4POty4gzpjOrc67z4kgzr3OsSDPg86/z4UgzrHPgM6xzr3PhM6sz4kgz4PPic+Dz4TOrCwgz4zPh865IM+Az4HPjM+HzrXOuc+BzrEuIM6gzrXPgiDOvM6/z4UgzrvOr86zzr8gz4DOuc6/IM+Dz4XOs866zrXOus+BzrnOvM6tzr3OsSDPhM65IM64zq3Ou861zrnPgiDOvc6xIM6yz4HOv8+NzrzOtS4=";
const D1 = "zqPOtSDOsc66zr/Pjc+Je25hbWV9LiDOnM+Azr/Pgc+OIM69zrEgzrzOuc67zq7Pg8+JIM6zzrnOsSDOlM+Bz4zPgM6/zrvOtywgz4fPic+BzrnOrCwgzr3Orc6xLCDPhs+Jz4TOv86zz4HOsc+Gzq/Otc+CIM6uIM6zzrnOsSDPhM63IM67zrXOuc+Ezr/Phc+BzrPOr86xIM+EzrfPgiDPg861zrvOr860zrHPgi4=";
const D2 = "zozOvM6/z4HPhs6xIM+Azr/PhSDPhM6/IM68zr/Ouc+BzqzOts61z4POsc65e25hbWV9LiDOk8+BzqzPiM61IM68zr/PhSDPhM65IM64zq3Ou861zrnPgiDOvc6xIM6yz4HOv8+NzrzOtSDOus6xzrkgzrjOsSDPgM+Bzr/Pg8+AzrHOuM6uz4PPiSDOvc6xIM+DzrUgzrLOv863zrjOrs+Dz4ku";

function b64(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

function say(value: string, username: string): string {
  const name = username.trim() ? " " + username.trim() : "";
  return b64(value).replace("{name}", name);
}

function shouldRespond(username: string): boolean {
  return username.trim().toLocaleLowerCase("el-GR") !== BOT_USERNAME.toLocaleLowerCase("el-GR");
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function pick(options: string[], seed: string): string {
  const total = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return options[total % options.length];
}

function buildFreeBotReply(userMessage: string, username: string): string {
  const text = normalizeText(userMessage);
  if (includesAny(text, ["geia", "hello", "hi", "kalimera", "kalispera", "xaire", "\u03b3\u03b5\u03b9\u03b1", "\u03ba\u03b1\u03bb\u03b7\u03bc\u03b5\u03c1\u03b1", "\u03ba\u03b1\u03bb\u03b7\u03c3\u03c0\u03b5\u03c1\u03b1"])) return say(pick([G1, G2], userMessage), username);
  if (includesAny(text, ["news", "nea", "eidise", "\u03bd\u03b5\u03b1", "\u03b5\u03b9\u03b4\u03b7\u03c3"])) return say(NEWS, username);
  if (includesAny(text, ["xorio", "chori", "village", "villages", "dropoli", "dervitsani", "droviani", "\u03c7\u03c9\u03c1\u03b9", "\u03b4\u03c1\u03bf\u03c0\u03bf\u03bb"])) return say(VILLAGES, username);
  if (includesAny(text, ["photo", "foto", "video", "eikona", "\u03c6\u03c9\u03c4\u03bf", "\u03b2\u03b9\u03bd\u03c4\u03b5\u03bf", "\u03b5\u03b9\u03ba\u03bf\u03bd"])) return say(MEDIA, username);
  if (includesAny(text, ["poios", "ti eisai", "bot", "ilikia", "xronon", "\u03c0\u03bf\u03b9\u03bf\u03c2", "\u03b5\u03b9\u03c3\u03b1\u03b9", "\u03b7\u03bb\u03b9\u03ba\u03b9\u03b1", "\u03c7\u03c1\u03bf\u03bd\u03c9\u03bd"])) return say(WHO, username);
  if (includesAny(text, ["thanks", "thx", "efxaristo", "euxaristo", "\u03b5\u03c5\u03c7\u03b1\u03c1\u03b9\u03c3\u03c4"])) return say(THANKS, username);
  if (userMessage.trim().endsWith("?")) return say(QUESTION, username);
  return say(pick([D1, D2], userMessage + username), username);
}

export async function maybeRespondToMessage(userMessage: string, username: string): Promise<void> {
  if (!shouldRespond(username)) return;
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 1200));
  try {
    const reply = buildFreeBotReply(userMessage, username);
    await db.insert(chatMessagesTable).values({ username: BOT_USERNAME, message: reply, avatar: BOT_AVATAR, isBot: true });
    logger.info({ username, userMessage: userMessage.slice(0, 80) }, "Free chat bot replied");
  } catch (err) {
    logger.warn({ err }, "Free chat bot response failed");
  }
}
