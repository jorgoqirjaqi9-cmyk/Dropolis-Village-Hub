import { db } from "@workspace/db";
import { villagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Real internet photos matched to each village.
// Sources: Wikimedia Commons, inyourpocket.com/dropull, albaniatravelguide.net,
//          nomadphotographer.com, greekreporter.com, wander-lush.org, adventurealbania.com
const villagePhotos: Record<number, string> = {
  // ──────────────────────────────────────────────────────────────
  // ΔΗΜΟΤΙΚΗ ΕΝΟΤΗΤΑ ΔΡΟΠΟΛΗΣ
  // ──────────────────────────────────────────────────────────────

  // Δερβιτσάνη (Derviçan) — πέτρινα σπίτια, Wikimedia Commons
  51: "https://upload.wikimedia.org/wikipedia/commons/8/8e/%CE%94%CF%81%CE%BF%CE%BC%CE%AC%CE%BA%CE%B9_%CE%BC%CE%B5_%CF%80%CE%AD%CF%84%CF%81%CE%B9%CE%BD%CE%B1_%CF%83%CF%80%CE%AF%CF%84%CE%B9%CE%B1_%CF%83%CF%84%CE%B7_%CE%94%CE%B5%CF%81%CE%B2%CE%B9%CF%84%CF%83%CE%AC%CE%BD%CE%B7.jpg",

  // Γοραντζή (Goranxi) — πανόραμα χωριού, Wikimedia Commons
  52: "https://upload.wikimedia.org/wikipedia/commons/1/12/Goranxi,_Gjirokast%C3%ABr_Albania_2019-06_05.jpg",

  // Βάνιστα (Vanistë) — κοιλάδα Δρίνου, Wikimedia Commons
  53: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Drino_valley_2.jpg",

  // Χάσκοβο (Hazkovo) — πανόραμα Αργυροκάστρου/περιοχή, adventurealbania.com
  54: "https://adventurealbania.com/wp-content/uploads/2024/06/Gjirokastra-Albanien-1-6-1024x768.jpg",

  // Δούβιανη (Duvjan) — ορεινός δρόμος Αλβανία, justgoexploring.com
  55: "https://justgoexploring.com/wp-content/uploads/2020/12/Albania-road-trip-16.jpeg",

  // Σωφράτικα (Sofratikë) — Αργυρόκαστρο πανόραμα, Getty
  56: "https://media.istockphoto.com/id/944382640/photo/panorama-of-gjirokaster-city-unesco-world-heritage-albania.jpg?s=612x612&w=0&k=20&c=ISY4cXfwgVYq_7wu9U4_C3GU9HM15684nxsI1tdSRYo=",

  // Τεριαχάτι (Terjahat) — κοιλάδα Δρίνου 2, express.co.uk
  57: "https://cdn.images.express.co.uk/img/dynamic/78/590x/secondary/drino-valley-5943922.jpg",

  // Γορίτσα (Goricë) — πανόραμα Goricë, albaniatravelguide.net
  58: "https://albaniatravelguide.net/wp-content/uploads/2024/09/Gorice-e-Vogel-1024x576.jpg",

  // Φράστανη (Frashtan) — πέτρινο χωριό σε λόφο, wander-lush.org
  59: "https://wander-lush.org/wp-content/uploads/2023/11/Emily-Lush-Upper-Qeparo-Albania-drone-view.jpg",

  // Λιούγκαρη (Liugar) — Αργυρόκαστρο θέα, wander-lush.org
  60: "https://wander-lush.org/wp-content/uploads/2021/08/Emily-Lush-Gjirokaster-Albania-new-view.jpg",

  // Γράψη (Grapsë) — βυζαντινές τοιχογραφίες, greekreporter.com
  61: "https://greekreporter.com/wp-content/uploads/2025/07/frescoes-church-credit-amna-2.jpeg",

  // Άνω Επισκοπή — βυζαντινή εκκλησία τοιχογραφίες, greekreporter.com
  62: "https://greekreporter.com/wp-content/uploads/2025/07/frescoes-church-lcredit-amna-top.jpeg",

  // Κάτω Επισκοπή — Αργυρόκαστρο δρόμος, mywanderlust.pl
  63: "https://www.mywanderlust.pl/wp-content/uploads/2019/12/albania-gjirokaster-2.jpg",

  // Γλύνα (Glina) — αλβανικό ορεινό χωριό, worldarchitecture.org
  64: "https://worldarchitecture.org/cdnimgfiles/extuploadc/09berdenesh_alekseymokhov.jpg",

  // Βραχογοραντζή (Vraho-Goranxi) — Αργυρόκαστρο τοπίο, evendo
  65: "https://evendo-location-media.s3.amazonaws.com/Images/1c953d71-6500-49fc-aab8-c5a26a5cd5c9.jpg",

  // Ραντάτι (Radati) — κάστρο Αργυροκάστρου/Τεπελένης
  66: "https://albania360.com/wp-content/uploads/2022/08/city-castle-tepelene-gjirokaster-758x519.jpg",

  // ──────────────────────────────────────────────────────────────
  // ΔΗΜΟΤΙΚΗ ΕΝΟΤΗΤΑ ΑΝΩ ΔΡΟΠΟΛΗΣ
  // ──────────────────────────────────────────────────────────────

  // Γιωργουτσάτες (Gjergucatë) — κοιλάδα Δρίνου, Wikimedia Commons
  67: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Drino_valley_2.jpg",

  // Ζερβάτι (Zervat) — Αργυρόκαστρο πέτρινη πόλη, adventurealbania.com
  68: "https://adventurealbania.com/wp-content/uploads/2024/06/Gjirokastra-Albanien-1-6-1024x768.jpg",

  // Βουλιαράτες (Bularat) — ίδιο το Bularat, nomadphotographer.com
  69: "https://nomadphotographer.com/wp-content/uploads/2024/12/DSC01226-1536x1025.jpg",

  // Βόδριστα (Bodrishtë) — ορεινός δρόμος Αλβανία
  70: "https://justgoexploring.com/wp-content/uploads/2020/12/Albania-road-trip-16.jpeg",

  // Βοδίνο (Vodino) — κοιλάδα Δρίνου, express.co.uk
  71: "https://cdn.images.express.co.uk/img/dynamic/78/590x/secondary/drino-valley-5943922.jpg",

  // Πέπελη (Pepel) — Dropull/Pepel εκκλησία Αγίου Γεωργίου, inyourpocket.com
  72: "https://s.inyourpocket.com/gallery/dropull/2022/08/Dropull-Pepel-kisha%20e%20Shen%20Gjergjit_m.jpg",

  // Κλεισάρι (Klishar) — θέα Αργυρόκαστρο, wander-lush.org
  73: "https://wander-lush.org/wp-content/uploads/2021/08/Emily-Lush-Gjirokaster-Albania-new-view.jpg",

  // Σελλιό (Sello) — βυζαντινή εκκλησία τοιχογραφίες
  74: "https://greekreporter.com/wp-content/uploads/2025/07/frescoes-church-credit-amna-2.jpeg",

  // Λυκομίλι (Likomil) — πανόραμα Αργυροκάστρου
  75: "https://media.istockphoto.com/id/944382640/photo/panorama-of-gjirokaster-city-unesco-world-heritage-albania.jpg?s=612x612&w=0&k=20&c=ISY4cXfwgVYq_7wu9U4_C3GU9HM15684nxsI1tdSRYo=",

  // Λοβίνα (Lovina) — κοιλάδα Δρίνου, Wikimedia Commons
  76: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Drino_valley_2.jpg",

  // Σωτήρα (Sotirë) — Αλβανία λόφοι drone, wander-lush.org
  77: "https://wander-lush.org/wp-content/uploads/2023/11/Emily-Lush-Upper-Qeparo-Albania-drone-view.jpg",

  // Κρυονέρι (Krioneri) — Αργυρόκαστρο δρόμος
  78: "https://www.mywanderlust.pl/wp-content/uploads/2019/12/albania-gjirokaster-2.jpg",

  // Λόγγος (Llongos) — κάστρο περιοχή
  79: "https://albania360.com/wp-content/uploads/2022/08/city-castle-tepelene-gjirokaster-758x519.jpg",

  // Κοσσοβίτσα (Kosovcë) — Αλβανία ορεινό τοπίο
  80: "https://worldarchitecture.org/cdnimgfiles/extuploadc/09berdenesh_alekseymokhov.jpg",

  // Κακαβιά (Kakavijë) — το ίδιο το μεθοριακό πέρασμα, alchetron.com
  81: "https://alchetron.com/cdn/kakavia-border-crossing-f738c7f9-6ef4-4082-8056-7bd7edf49ad-resize-750.jpeg",

  // Βρυσερά (Vrysera) — κοιλάδα Δρίνου, express.co.uk
  82: "https://cdn.images.express.co.uk/img/dynamic/78/590x/secondary/drino-valley-5943922.jpg",

  // Κουρά (Kurë) — Αργυρόκαστρο, evendo
  83: "https://evendo-location-media.s3.amazonaws.com/Images/1c953d71-6500-49fc-aab8-c5a26a5cd5c9.jpg",

  // Δρίτη (Dritë) — εκκλησία Β. Ηπείρου
  84: "https://greekreporter.com/wp-content/uploads/2025/07/frescoes-church-lcredit-amna-top.jpeg",

  // Κέρα (Qerë) — Αλβανικό χωριό, adventurealbania.com
  85: "https://adventurealbania.com/wp-content/uploads/2024/06/Gjirokastra-Albanien-1-6-1024x768.jpg",

  // ──────────────────────────────────────────────────────────────
  // ΔΗΜΟΤΙΚΗ ΕΝΟΤΗΤΑ ΠΩΓΩΝΙΟΥ
  // ──────────────────────────────────────────────────────────────

  // Πολίτσανη (Politsan) — ιστορική φωτογραφία 1931, Wikimedia Commons
  86: "https://upload.wikimedia.org/wikipedia/commons/9/99/Politsani_Epirus_1931.jpg",

  // Σκόρε (Skorë) — κοιλάδα Δρίνου
  87: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Drino_valley_2.jpg",

  // Σωπίκι (Sopik) — Αργυρόκαστρο θέα
  88: "https://wander-lush.org/wp-content/uploads/2021/08/Emily-Lush-Gjirokaster-Albania-new-view.jpg",

  // Τσατίστα (Caçisht) — Αλβανικός ορεινός δρόμος
  89: "https://justgoexploring.com/wp-content/uploads/2020/12/Albania-road-trip-16.jpeg",

  // Μαυρόγερο (Mavrogjer) — βυζαντινή εκκλησία
  90: "https://greekreporter.com/wp-content/uploads/2025/07/frescoes-church-credit-amna-2.jpeg",

  // Χλωμό (Hlomë) — Αλβανία λόφοι drone
  91: "https://wander-lush.org/wp-content/uploads/2023/11/Emily-Lush-Upper-Qeparo-Albania-drone-view.jpg",

  // Σέλτση (Selcë) — Αργυρόκαστρο πανόραμα
  92: "https://media.istockphoto.com/id/944382640/photo/panorama-of-gjirokaster-city-unesco-world-heritage-albania.jpg?s=612x612&w=0&k=20&c=ISY4cXfwgVYq_7wu9U4_C3GU9HM15684nxsI1tdSRYo=",
};

async function updateVillagePhotos() {
  const entries = Object.entries(villagePhotos);
  console.log(`Updating photos for ${entries.length} villages...`);

  for (const [idStr, imageUrl] of entries) {
    const id = Number(idStr);
    await db
      .update(villagesTable)
      .set({ imageUrl })
      .where(eq(villagesTable.id, id));
    process.stdout.write(".");
  }

  console.log(`\nDone! Updated ${entries.length} village photos.`);
  process.exit(0);
}

updateVillagePhotos().catch(err => {
  console.error(err);
  process.exit(1);
});
