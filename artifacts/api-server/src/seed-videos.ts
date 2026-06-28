import { db, videosTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger.js";

const VIDEOS: Array<{
  youtubeId: string;
  title: string;
  description?: string;
  villageId?: number;
  villageName?: string;
}> = [
  { youtubeId: "cMIqPqVGC4w", title: "Άνω Δερόπολη — Ένας παράδεισος πολυφωνίας", description: "Η Άνω Δερόπολη παρουσιάζεται ως παράδεισος πολυφωνίας, με χωριά στη βόρεια πλευρά της Μουργκάνας, στην περιοχή της ελληνικής μειονότητας στην Αλβανία." },
  { youtubeId: "ayKSbsZWAv8", title: "Στης Δερόπολης τον κάμπο — Πολυφωνικό Βορείου Ηπείρου", description: "Παραδοσιακό πολυφωνικό τραγούδι για τη Δερόπολη." },
  { youtubeId: "RUrTYtjJPNg", title: "Μες τα χωριά της Δερόπολης τούτο το καλοκαίρι", description: "Τραγούδι για τα χωριά της Δερόπολης." },
  { youtubeId: "7u95GumRzFM", title: "Πολιτ. Σύλλ. Δερόπολης — Χορός «Οι Κλέφτες»", description: "Ο χορός «Κλέφτες» από τον Πολιτιστικό Σύλλογο Δερόπολης." },
  { youtubeId: "276468VDj-E", title: "Χορευτικό Δρόπολης", description: "Χορευτικό συγκρότημα Δρόπολης σε εκδήλωση." },
  { youtubeId: "7yP7FS9Uv64", title: "Δεροπολίτισσα — Ιστορικός χορός και τραγούδι της Δερόπολης", description: "Ο παραδοσιακός χορός και τραγούδι «Δεροπολίτισσα»." },
  { youtubeId: "_B6FiuCcxGY", title: "Χορευτικός και Πολιτιστικός Σύλλογος Δερόπολης — Εκδήλωση 2014", description: "Εκδήλωση 2014 του Χορευτικού και Πολιτιστικού Συλλόγου Δερόπολης." },
  { youtubeId: "j48lIkgRIT4", title: "«Δρόπολη Αγάπη μου Γλυκιά»", description: "Τραγούδι αφιερωμένο στη Δρόπολη." },
  { youtubeId: "Fsb4mHm29lw", title: "Πανηγύρι Σωτήρας (Δρόπολη) 2023", description: "Πανηγύρι Μεταμορφώσεως Σωτήρος στη Σωτήρα Δρόπολης.", villageId: 77, villageName: "Σωτήρα" },
  { youtubeId: "ElPerrSamw4", title: "Σελλειό Δρόπολης — Βορείου Ηπείρου", description: "Βίντεο από το Σελλειό της Δρόπολης.", villageId: 74, villageName: "Σελλιό" },
  { youtubeId: "QtW7baIisSw", title: "Δρόπολη — «Ο τόπος και το τραγούδι του» (Α΄ μέρος)", description: "Ντοκιμαντέρ για τη Δρόπολη, τον τόπο και τα τραγούδια της — Α΄ μέρος." },
  { youtubeId: "hMzBljtjoVU", title: "Deropoli (Dropoli) — Greek Dance, Northern Epirus", description: "Παραδοσιακός χορός Δερόπολης — Βόρειος Ήπειρος." },
  { youtubeId: "OS_IzmNmxCs", title: "Δρόπολη Βορείου Ηπείρου 2", description: "Βίντεο από τη Δρόπολη της Βορείου Ηπείρου." },
  { youtubeId: "KWaUbSdQtZ4", title: "Βουλιαράτες — Δρόπολη", description: "Βίντεο από τους Βουλιαράτες της Δρόπολης.", villageId: 69, villageName: "Βουλιαράτες" },
  { youtubeId: "hmvjbeIXSTc", title: "Δεκαπενταύγουστος 2025 στη Δερβιτσάνη", description: "Εκδηλώσεις 15 Αυγούστου 2025 στη Δερβιτσάνη Δερόπολης.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "xAbF5Z5l2Lw", title: "Δερβιτσάνη Δερόπολης 2020", description: "Βίντεο από τη Δερβιτσάνη Δερόπολης το 2020.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "O9Nb7xWP9sA", title: "Πανηγύρι Δερβιτσάνης — Βόρειος Ήπειρος", description: "Πανηγύρι στη Δερβιτσάνη της Βορείου Ηπείρου.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "4vaScNATz7M", title: "Πάσχα 2024 — Δερβιτσάνη Δερόπολης (Ζωοδόχου Πηγής)", description: "Πασχαλινές εκδηλώσεις 2024 στη Δερβιτσάνη — Ζωοδόχος Πηγή.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "8O7w5XUuvBk", title: "Δερβιτσάνη — 15 Αυγούστου 2022 (Α΄ μέρος)", description: "Εορτασμός Κοιμήσεως Θεοτόκου 2022 στη Δερβιτσάνη.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "wjB7qwTVWzI", title: "Δερβιτσάνη — Εθνική Εορτή Ελλήνων Βορείου Ηπείρου", description: "Πώς γιόρτασαν οι Έλληνες της Βορείου Ηπείρου στη Δερβιτσάνη.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "78PVPdxRP_o", title: "Γλυκερία — «Μέχρι να βρούμε ουρανό» Live Δερβιτσάνη Δρόπολη", description: "Η Γλυκερία τραγουδά live στη Δερβιτσάνη Δρόπολης.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "habXvHB9iAs", title: "Δερβιτσάνη — Δεκαπενταύγουστος 2022 (Έναρξη Πανηγυριού)", description: "Έναρξη πανηγυριού Κοιμήσεως Θεοτόκου 2022 στη Δερβιτσάνη.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "_jp1EyCP89U", title: "Δερβιτσάνη Βορείας Ηπείρου — Ιερές Μονές και Παρεκκλήσια", description: "Τα ιερά παρεκκλήσια και μονές της Δερβιτσάνης Δερόπολης.", villageId: 51, villageName: "Δερβιτσάνη" },
  { youtubeId: "MdQuLXgS_tE", title: "«Όσα λουλούδια έχει η άνοιξη» — Σωτήρα Βορείου Ηπείρου", description: "Τραγούδι από τη Σωτήρα της Βορείου Ηπείρου.", villageId: 77, villageName: "Σωτήρα" },
  { youtubeId: "zoTxAYhssRs", title: "«Κλέφτες» Δρόπολης — Παραδοσιακός χορός", description: "Ο παραδοσιακός χορός «Κλέφτες» της Δρόπολης κάνει τον γύρο του διαδικτύου." },
  { youtubeId: "KckV_ypIHpw", title: "Χωριό Κρά — 9 Μαΐου 2026", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης — Μάιος 2026.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "mkyKb8S6VVg", title: "Χωριό Κρά — 3 Μαΐου 2026", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης — Μάιος 2026.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "Lgie8WR0piY", title: "Χωριό Κρά — 5 Απριλίου 2026", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης — Απρίλιος 2026.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "T-oMMzejQJg", title: "Χωριό Κρά — 1 Απριλίου 2026", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης — Απρίλιος 2026.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "1CLsClQzfpA", title: "Χωριό Κρά — 25 Μαρτίου 2026", description: "Εορτασμός 25ης Μαρτίου στο χωριό Κουρά (Κρά) της Δρόπολης.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "W7cKITC1mIc", title: "Χωριό Κρά — 22 Μαρτίου 2026", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης — Μάρτιος 2026.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "dyMfwy6RML8", title: "Χωριά Δρόπολης — Πέπελη (Εκδρομή με τον Χάρη)", description: "Εκδρομή στην Πέπελη της Δρόπολης με τον Χάρη Γκαζίκα.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "YnvXpQC-zyk", title: "Άνω Επισκοπή Δρόπολη — Κώστας Καλόγερος", description: "Τραγούδι για την Άνω Επισκοπή Δρόπολης από τον Κώστα Καλόγερο.", villageId: 62, villageName: "Άνω Επισκοπή" },
  { youtubeId: "dOek4vwSYTQ", title: "Άνω Επισκοπή Δρόπολη (5) — Κώστας Καλόγερος", description: "Σειρά βίντεο για τα χωριά της Δρόπολης — Άνω Επισκοπή, με τον Κώστα Καλόγερο.", villageId: 62, villageName: "Άνω Επισκοπή" },
  { youtubeId: "XTZ-9Y2p0Z4", title: "Τραγούδι για τη Δρόπολη — Εύη Κούρτη", description: "Τραγούδι για τη Δερόπολη/Δρόπολη από την Εύη Κούρτη." },
  { youtubeId: "3MCT_oJlaGY", title: "Βραχογοραντζή", description: "Βίντεο από το χωριό Βραχογοραντζή της Δρόπολης.", villageId: 65, villageName: "Βραχογοραντζή" },
  { youtubeId: "vnnYicPWtvc", title: "Κοσσοβίτσα Δρόπολης 2017", description: "Βίντεο από την Κοσσοβίτσα της Δρόπολης, 2017.", villageId: 80, villageName: "Κοσσοβίτσα" },
  { youtubeId: "ABDl3HowpAs", title: "Χωριό Κρά", description: "Βίντεο από το χωριό Κουρά (Κρά) της Δρόπολης.", villageId: 83, villageName: "Κουρά" },
  { youtubeId: "b1SIT7Q7uRM", title: "Δερόπολη — 8 Ιουνίου 2020", description: "Εορτή Αγίας Τριάδος στην Ιερά Μονή στο χωριό Πέπελη, Ιούνιος 2020.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "C6gh4UmHYA8", title: "Κοπή Πίτας 2020 — Αδελφότητα Πεπελιωτών (Γ΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2020 της Αδελφότητας Πεπελιωτών — Γ΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "kakhg0RSX84", title: "Κοπή Πίτας 2020 — Αδελφότητα Πεπελιωτών (Β΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2020 της Αδελφότητας Πεπελιωτών — Β΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "02i8NjwQIT0", title: "Κοπή Πίτας 2020 — Αδελφότητα Πεπελιωτών (Α΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2020 της Αδελφότητας Πεπελιωτών — Α΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "bSJk1BKyd_U", title: "Ανταμωμα Δεροπολιτών — Αθήνα 24 Νοεμβρίου 2019", description: "Ετήσιο ανταμωμα Δεροπολιτών στην Αθήνα, Νοέμβριος 2019." },
  { youtubeId: "SIi1Vhqo1Z8", title: "Εκδήλωση Δεροπολιτών — Αθήνα 27 Ιουλίου 2019", description: "Εκδήλωση Δεροπολιτών στην Αθήνα, Ιούλιος 2019." },
  { youtubeId: "TCjShJyCiTE", title: "Άγιος Δημήτριος Πέπελη — 26 Οκτωβρίου 2019", description: "Εορτασμός Αγίου Δημητρίου στην Πέπελη, 26 Οκτωβρίου 2019.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "BOvb6rzMxtc", title: "Πέπελη — Μάρτιος 2019 (Α΄ μέρος)", description: "Βίντεο από την Πέπελη της Δρόπολης, Μάρτιος 2019.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "PT1hvDLXQAM", title: "Πέπελη — Ιανουάριος 2019", description: "Βίντεο από την Πέπελη της Δρόπολης, Ιανουάριος 2019.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "5fzRK9Wq0ko", title: "Κοπή Πίτας 2019 — Αδελφότητα Πεπελιωτών (Θ΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2019 της Αδελφότητας Πεπελιωτών — Θ΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "I4WiOAtlkDM", title: "Κοπή Πίτας 2019 — Αδελφότητα Πεπελιωτών (Η΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2019 της Αδελφότητας Πεπελιωτών — Η΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "lvYOeEThiOo", title: "Κοπή Πίτας 2019 — Αδελφότητα Πεπελιωτών (Ε΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2019 της Αδελφότητας Πεπελιωτών — Ε΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "LISoEHicQeg", title: "Κοπή Πίτας 2019 — Αδελφότητα Πεπελιωτών (Δ΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2019 της Αδελφότητας Πεπελιωτών — Δ΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
  { youtubeId: "sbYECwslMqA", title: "Κοπή Πίτας 2019 — Αδελφότητα Πεπελιωτών (Β΄ μέρος)", description: "Κοπή πρωτοχρονιάτικης πίτας 2019 της Αδελφότητας Πεπελιωτών — Β΄ μέρος.", villageId: 72, villageName: "Πέπελη" },
];

export async function seedVideos() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(videosTable);

    if (count >= VIDEOS.length) {
      logger.info({ count }, "Videos already seeded, skipping");
      return;
    }

    logger.info({ existing: count, total: VIDEOS.length }, "Seeding missing videos...");

    for (const v of VIDEOS) {
      await db
        .insert(videosTable)
        .values({
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          villageId: v.villageId,
          villageName: v.villageName,
        })
        .onConflictDoNothing();
    }

    logger.info("Video seed complete");
  } catch (err) {
    logger.error({ err }, "Video seed failed");
  }
}
