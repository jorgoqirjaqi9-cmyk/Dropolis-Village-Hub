/**
 * Generates rich template-based Greek content (350-500 words) for each village.
 * Does NOT require Gemini quota — uses structured templates with real village data.
 *
 * Run: pnpm --filter @workspace/scripts run generate:village-content
 * Pass --force to overwrite villages that already have richContent.
 */

import { db } from "@workspace/db";
import { villagesTable } from "@workspace/db";
import { isNull, eq } from "drizzle-orm";

const FORCE = process.argv.includes("--force");

interface VillageRow {
  id: number;
  nameEl: string;
  name: string;
  description: string;
  municipalUnit: string | null;
  population: number | null;
  elevation: number | null;
  richContent: string | null;
}

// Elevation-based terrain descriptions
function terrainDesc(elevation: number | null): string {
  if (!elevation) return "χαρακτηριστικό τοπίο της Δρόπολης";
  if (elevation < 200) return "γόνιμη πεδιάδα του ποταμού Δρίνου";
  if (elevation < 400) return "απαλοί λόφοι της κοιλάδας";
  if (elevation < 700) return "ημιορεινό τοπίο με πλούσια βλάστηση";
  if (elevation < 1000) return "ορεινό πλάτωμα με θέα στην κοιλάδα";
  return "υψηλό ορεινό τοπίο με μεγαλειώδη θέα";
}

// Population-based community size descriptions
function communityDesc(population: number | null): { size: string; life: string } {
  if (!population) return {
    size: "χωριό",
    life: "η κοινότητα διατηρεί ζωντανά τα ήθη και έθιμα της περιοχής",
  };
  if (population < 50) return {
    size: "μικρό χωριό",
    life: "παρά τον μικρό αριθμό κατοίκων, η κοινότητα διατηρεί με υπερηφάνεια τις παραδόσεις της",
  };
  if (population < 150) return {
    size: "χωριό",
    life: "η κοινότητα διατηρεί ζωντανή την παράδοση και τους δεσμούς της με τα γειτονικά χωριά",
  };
  if (population < 400) return {
    size: "κωμόπολη",
    life: "η δραστήρια κοινότητα αποτελεί σημαντικό κόμβο της περιοχής",
  };
  return {
    size: "σημαντική κωμόπολη",
    life: "αποτελεί ένα από τα πιο δραστήρια κέντρα της Δρόπολης",
  };
}

// Municipal unit context
function municipalContext(unit: string | null): string {
  if (!unit) return "ανήκει διοικητικά στο Δήμο Δρόπολης";
  return `ανήκει στη Δημοτική Ενότητα ${unit}, στον ευρύτερο Δήμο Δρόπολης`;
}

// Varied paragraph openers to avoid repetition across villages
const HISTORY_OPENERS = [
  "Η ιστορία του χωριού χάνεται στα βάθη των αιώνων.",
  "Οι ρίζες της κοινότητας εκτείνονται σε πολλούς αιώνες πίσω.",
  "Το χωριό αναφέρεται σε ιστορικές πηγές ήδη από τους βυζαντινούς χρόνους.",
  "Κατά τη βυζαντινή και οθωμανική περίοδο, το χωριό αποτελούσε σημαντικό οικισμό της περιοχής.",
  "Η περιοχή κατοικήθηκε συνεχώς από αρχαιοτάτων χρόνων.",
  "Σε παλαιά έγγραφα και χαρτογραφήσεις, ο οικισμός εμφανίζεται ως σταθερό σημείο της Δρόπολης.",
];

const MINORITY_SNIPPETS = [
  "Ιστορικά, ο ελληνορθόδοξος πληθυσμός της Δρόπολης υπήρξε ένας από τους πιο συνεκτικούς θύλακες ελληνισμού στη Βόρεια Ήπειρο.",
  "Η ελληνική μειονότητα της Δρόπολης, μία από τις παλαιότερες στη Βόρεια Ήπειρο, διατήρησε ανά τους αιώνες τη γλώσσα, την ορθόδοξη πίστη και τα έθιμά της.",
  "Η Δρόπολη υπήρξε ιστορικά καρδιά του βορειοηπειρωτικού ελληνισμού, και τα χωριά της αποτελούν ζωντανές μαρτυρίες αυτής της πολιτιστικής συνέχειας.",
  "Στα χρόνια της οθωμανικής κυριαρχίας, η Δρόπολη ανέπτυξε ισχυρές τοπικές παραδόσεις που συνδύαζαν ελληνορθόδοξη ταυτότητα με τα ιδιαίτερα ήθη της περιοχής.",
];

const CHURCH_SNIPPETS = [
  "Στο χωριό δεσπόζει η παλαιά εκκλησία, σύμβολο της ορθόδοξης παράδοσης που διαπερνά τους αιώνες.",
  "Η τοπική ορθόδοξη εκκλησία, που γιορτάζει κάθε χρόνο τον πολιούχο της, αποτελεί το πνευματικό κέντρο της κοινότητας.",
  "Κεντρικό σημείο της κοινωνικής ζωής παραμένει η εκκλησία του χωριού, όπου συγκεντρώνεται η κοινότητα στις μεγάλες γιορτές.",
  "Η ορθόδοξη εκκλησία του χωριού, με την αξιόλογη εικονοστάση της, υπήρξε κέντρο πνευματικής ζωής για τους κατοίκους ανά τους αιώνες.",
];

const DIASPORA_SNIPPETS = [
  "Μεγάλος αριθμός απογόνων του χωριού ζει σήμερα στην Ελλάδα, στη Γερμανία και σε άλλες χώρες, διατηρώντας όμως ζωντανό τον δεσμό τους με την πατρίδα.",
  "Η ομογένεια της κοινότητας, διάσπαρτη σε Ελλάδα και Ευρώπη, επιστρέφει κάθε καλοκαίρι για να γιορτάσει τοπικά πανηγύρια και να ανανεώσει τις οικογενειακές ρίζες.",
  "Πολλοί κάτοικοι μετανάστευσαν στη διάρκεια του 20ού αιώνα, κυρίως προς Ελλάδα και Δυτική Ευρώπη, χωρίς όμως να χάσουν την αίσθηση της τοπικής ταυτότητάς τους.",
  "Παρά τα μεταναστευτικά κύματα που μείωσαν τον πληθυσμό, η κοινότητα της ομογένειας παραμένει ζωντανή μέσα από συλλόγους και πολιτιστικές πρωτοβουλίες.",
];

const LANDSCAPE_SNIPPETS = [
  "Η φύση της περιοχής είναι πλούσια: βελανιδιές, πλατάνια και ελαιώνες σχηματίζουν ένα τοπίο που δεν έχει αλλάξει ουσιαστικά εδώ και αιώνες.",
  "Η γη γύρω από το χωριό είναι εύφορη, με ελαιόδεντρα, αμπέλια και σιτηρά που αποτελούν πηγή ζωής για τους κατοίκους.",
  "Τα γύρω βουνά και τα καταπράσινα δάση δίνουν στο χωριό μια ιδιαίτερη ομορφιά, ενώ τα διαυγή ρυάκια της περιοχής τροφοδοτούν τους κήπους.",
  "Η περιοχή διαθέτει αξιόλογες φυσικές ομορφιές: απόκρημνα βράχια, δάση πεύκων και καλυβόδενδρα που δημιουργούν ένα ανεπανάληπτο τοπίο.",
];

const DROPOULE_CONTEXT = [
  "Η Δρόπολη, η ιστορική αυτή κοιλάδα στη νότια Αλβανία, αποτελεί ένα από τα πιο συμπαγή ελληνόφωνα τοπία της Βαλκανικής.",
  "Η ευρύτερη περιοχή της Δρόπολης βρίσκεται στη νοτιοδυτική Αλβανία, κοντά στα σύνορα με την Ελλάδα, και αποτελεί καρδιά του βορειοηπειρωτικού ελληνισμού.",
  "Η Δρόπολη, με τα 41 χωριά της, αποτελεί γεωγραφικά και πολιτιστικά ένα ενιαίο σύνολο στην κοιλάδα του ποταμού Δρίνου, κοντά στην ιστορική πόλη του Αργυροκάστρου.",
  "Στο νοτιοδυτικό τμήμα της Αλβανίας, η Δρόπολη αποτελεί μία από τις πιο ιστορικά σημαντικές περιοχές της Βόρειας Ηπείρου.",
];

function pickRound<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function generateRichContent(village: VillageRow, index: number): string {
  const { nameEl, name, population, elevation, municipalUnit } = village;
  const terrain = terrainDesc(elevation);
  const community = communityDesc(population);
  const admin = municipalContext(municipalUnit);
  const popStr = population ? `${population.toLocaleString("el-GR")} κατοίκους` : null;
  const elevStr = elevation ? `${elevation} μέτρα` : null;

  const historyOpener = pickRound(HISTORY_OPENERS, index);
  const minoritySnippet = pickRound(MINORITY_SNIPPETS, index + 1);
  const churchSnippet = pickRound(CHURCH_SNIPPETS, index + 2);
  const diasporaSnippet = pickRound(DIASPORA_SNIPPETS, index + 3);
  const landscapeSnippet = pickRound(LANDSCAPE_SNIPPETS, index + 4);
  const dropouleContext = pickRound(DROPOULE_CONTEXT, index + 5);

  const paragraphs: string[] = [];

  // Paragraph 1: Introduction & geography
  let intro = `Το ${nameEl} (αλβανικά: ${name}) είναι ${community.size} της Δρόπολης στη Βόρεια Ήπειρο, Αλβανία.`;
  intro += ` Βρίσκεται σε ${terrain}`;
  if (elevStr) intro += `, σε υψόμετρο ${elevStr}`;
  intro += `. ${dropouleContext}`;
  paragraphs.push(intro);

  // Paragraph 2: Administrative & population
  let adminPara = `Διοικητικά, το ${nameEl} ${admin}.`;
  if (popStr) {
    adminPara += ` Σύμφωνα με τα διαθέσιμα δημογραφικά στοιχεία, η κοινότητα αριθμεί περίπου ${popStr}.`;
  } else {
    adminPara += " Όπως και τα περισσότερα χωριά της Δρόπολης, έχει γνωρίσει δημογραφικές αλλαγές στα τελευταία δεκαετίες.";
  }
  adminPara += ` Παρ' όλα αυτά, ${community.life}.`;
  paragraphs.push(adminPara);

  // Paragraph 3: History
  let historyPara = `${historyOpener} ${minoritySnippet}`;
  historyPara += ` Στο ${nameEl}, όπως και στα γειτονικά χωριά της Δρόπολης, η ελληνική γλώσσα, η ορθόδοξη χριστιανική παράδοση και τα τοπικά ήθη αποτελούν ζωντανές μαρτυρίες μιας αδιάκοπης πολιτιστικής κληρονομιάς.`;
  paragraphs.push(historyPara);

  // Paragraph 4: Church & local life
  let churchPara = `${churchSnippet} Κάθε χρόνο, οι κάτοικοι και οι επισκέπτες γιορτάζουν με ιδιαίτερη λαμπρότητα τα τοπικά πανηγύρια, που συνοδεύονται από παραδοσιακή μουσική, χορό και εδέσματα της βορειοηπειρωτικής κουζίνας. Η κοινοτική ζωή του χωριού εκφράζεται μέσα από αυτές τις παραδόσεις που διατηρούνται ζωντανές από γενιά σε γενιά.`;
  paragraphs.push(churchPara);

  // Paragraph 5: Natural landscape
  let landscapePara = `${landscapeSnippet} Η γεωργική παραγωγή — κυρίως ελιές, σιτηρά και λαχανικά — παραδοσιακά στήριζε την τοπική οικονομία, ενώ η κτηνοτροφία εξακολουθεί να αποτελεί σημαντική δραστηριότητα στην ευρύτερη περιοχή.`;
  paragraphs.push(landscapePara);

  // Paragraph 6: Diaspora
  let diasporaPara = `${diasporaSnippet} Η δεσμός αυτός με τα πάτρια εδάφη εκφράζεται μέσα από ετήσιες επισκέψεις, χορηγίες για τοπικές ανάγκες και πολιτιστικές πρωτοβουλίες που ενισχύουν τη ζωτικότητα της κοινότητας.`;
  paragraphs.push(diasporaPara);

  // Paragraph 7: Present & future
  let presentPara = `Σήμερα, το ${nameEl} αποτελεί μέρος μιας ευρύτερης προσπάθειας ανάδειξης και ανάπτυξης της Δρόπολης ως τουριστικού και πολιτιστικού προορισμού. Η φιλοξενία των κατοίκων, το πλούσιο ιστορικό παρελθόν και η ιδιαίτερη ομορφιά της γύρω φύσης αποτελούν στοιχεία που το καθιστούν αξιοσημείωτο προορισμό για όσους θέλουν να γνωρίσουν την αυθεντική ζωή της βορειοηπειρωτικής υπαίθρου. Το ${nameEl} είναι, με λίγα λόγια, ένα ζωντανό κομμάτι της κληρονομιάς που η Δρόπολη προσφέρει στον κόσμο.`;
  paragraphs.push(presentPara);

  return paragraphs.join("\n\n");
}

async function main() {
  let villages: VillageRow[];

  if (FORCE) {
    villages = await db.select().from(villagesTable).orderBy(villagesTable.nameEl);
  } else {
    villages = await db.select().from(villagesTable)
      .where(isNull(villagesTable.richContent))
      .orderBy(villagesTable.nameEl);
  }

  console.log(`📍 Found ${villages.length} villages to process${FORCE ? " (--force mode)" : " (empty richContent only)"}`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < villages.length; i++) {
    const village = villages[i];
    process.stdout.write(`  → ${village.nameEl}... `);
    try {
      const content = generateRichContent(village, i);
      await db.update(villagesTable)
        .set({ richContent: content })
        .where(eq(villagesTable.id, village.id));
      console.log(`✅ ${content.length} chars`);
      ok++;
    } catch (err) {
      console.log(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n✅ Done: ${ok} generated, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
