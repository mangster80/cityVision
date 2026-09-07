import { Place, Proposal, User, Comment } from "@/types";

const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const avatar = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=facearea&facepad=3&w=320&h=320&q=85`;
export const users: User[] = [
  { id: "u1", name: "Demouser", avatar: avatar("photo-1494790108377-be9c29b29330"), city: "Stockholm" },
  { id: "u2", name: "Johan Berg", avatar: avatar("photo-1507003211169-0a1dd7228f2d") },
  { id: "u3", name: "Maja Andersson", avatar: avatar("photo-1534528741775-53994a69daeb") },
  { id: "u4", name: "Erik Nilsson", avatar: avatar("photo-1500648767791-00dcc994a43e") },
  { id: "u5", name: "Nora Karlsson", avatar: avatar("photo-1544005313-94ddf0286df2") }
];
const placeRows: [string, string, string, string, string, string, number, number, number][] = [
  ["p1","Betongbron vid centrum","Stockholm","En grå passage med klotter som förtjänar att bli en tydligare del av stadsbilden.","photo-1558941469-9fbd273fb10b","Broar",3,59.33,18.06],
  ["p2","Västra torget","Göteborg","Ett centralt torg med stor potential för mer liv och grönska.","photo-1725711388436-5575343a0f76","Torg",2,57.7089,11.9746],
  ["p3","Åparken","Uppsala","Parkens gångar är mörka och saknar platser att stanna på.","photo-1614638964097-20e7104dea3c","Park",2,59.8586,17.6389],
  ["p4","Busshållplats Solrosen","Malmö","En viktig hållplats som behöver mer trygghet och väderskydd.","photo-1629323089093-750bb2411b5e","Kollektivtrafik",2,55.6050,13.0038],
  ["p5","Tunneln under järnvägen","Örebro","En mörk tunnel som många undviker efter mörkrets inbrott.","photo-1497366811353-6870744d04b2","Infrastruktur",2,59.2753,15.2134],
  ["p6","Hamnpromenaden","Helsingborg","Slitna sittplatser och vindskydd gör promenaden mindre inbjudande.","photo-1614638964097-20e7104dea3c","Promenad",2,56.0465,12.6945],
  ["p7","Biblioteksplatsen","Linköping","En stor hårdgjord yta framför biblioteket.","photo-1497366754035-f200968a6e72","Plats",1,58.4108,15.6214],
  ["p8","Lekparken vid Åsen","Västerås","Lekplatsen kan bli mer inkluderande för barn i alla åldrar.","photo-1503454537195-1dcabb73ffb9","Lekplats",1,59.6099,16.5448],
  ["p9","Kvarnholmens kaj","Nacka","Kajstråket har fin utsikt men saknar sittplatser och tydliga mötesplatser.","photo-1507525428034-b723cf961d3e","Promenad",1,59.3167,18.1333],
  ["p10","Orminge centrum","Nacka","Centrumplatsen kan bli grönare, tryggare och mer trivsam under hela dagen.","photo-1477959858617-67f85cf4f1df","Torg",1,59.3427,18.2548]
];
export const places: Place[] = placeRows.map(([id,name,city,description,image,category,proposalCount,lat,lng]) => ({ id, name, city, municipality: city, description, image: img(image), lat, lng, category, proposalCount }));

const proposalRows: [string, string, string, string, string, string, number, number, number, number, string][] = [
  ["pr1","p1","Varm belysning + mörkgrön färg","Måla om betongen i en djup grön ton och addera varm, energieffektiv belysning.","photo-1558941469-9fbd273fb10b","photo-1519501025264-65ba15a82390",450000,1284,743,18,"2024-09-02"],
  ["pr2","p1","Grön vägg med klätterväxter","En robust spaljé med klätterväxter skulle mjuka upp brons hårda uttryck.","photo-1558941469-9fbd273fb10b","photo-1497250681960-ef046c08a56e",280000,892,516,12,"2024-08-21"],
  ["pr3","p1","Lokal konst i tunneln","Låt unga lokala konstnärer skapa ett roterande galleri i passagen.","photo-1558941469-9fbd273fb10b","photo-1531058020387-3be344556be6",150000,624,401,9,"2024-07-15"],
  ["pr4","p2","Fler träd och regnbäddar","Skapa skugga, bättre dagvattenhantering och en plats att mötas på.","photo-1725711388436-5575343a0f76","photo-1441974231531-c6227db76b6e",680000,1044,812,24,"2024-09-05"],
  ["pr5","p2","Torget som vardagsrum","Mobila bänkar, små scener och bättre kvällsljus gör torget levande hela dagen.","photo-1725711388436-5575343a0f76","photo-1497366754035-f200968a6e72",390000,731,498,14,"2024-08-11"],
  ["pr6","p3","Ljusare promenadstråk","Låg, varm belysning längs gångarna gör parken tryggare utan att störa djurlivet.","photo-1614638964097-20e7104dea3c","photo-1497250681960-ef046c08a56e",320000,967,689,20,"2024-09-01"],
  ["pr7","p3","Picknicköar vid ån","Små träplattformar med sittplatser skapar fler anledningar att stanna.","photo-1614638964097-20e7104dea3c","photo-1500534623283-312aade485b7",210000,544,367,8,"2024-07-30"],
  ["pr8","p4","Trygg hållplats med grönt tak","Väderskydd, realtidsinfo och ett grönt tak i återvunnet material.","photo-1629323089093-750bb2411b5e","photo-1497366811353-6870744d04b2",510000,1156,920,31,"2024-09-04"],
  ["pr9","p4","Konstnärligt väderskydd","Ett färgstarkt skydd designat tillsammans med skolor i området.","photo-1629323089093-750bb2411b5e","photo-1531058020387-3be344556be6",290000,479,322,7,"2024-06-18"],
  ["pr10","p5","Ljusinstallation under jord","Ljuspaneler som reagerar mjukt på rörelse och skapar en tryggare passage.","photo-1497366811353-6870744d04b2","photo-1518005020951-eccb494ad742",740000,1320,1001,28,"2024-09-06"],
  ["pr11","p5","Cykelstråk i färg","Markera cykel- och gångtrafik tydligare och ge tunneln en egen identitet.","photo-1511818966892-d7d671e672a2","photo-1519501025264-65ba15a82390",180000,388,244,6,"2024-05-12"],
  ["pr12","p6","Vindskydd i trä","Naturliga material och fler bänkar gör havet tillgängligt även blåsiga dagar.","photo-1507525428034-b723cf961d3e","photo-1497250681960-ef046c08a56e",430000,811,601,11,"2024-08-02"],
  ["pr13","p6","Kvällsljus längs kajen","Diskret belysning som lyfter vattnet och gör promenaden säkrare.","photo-1507525428034-b723cf961d3e","photo-1518005020951-eccb494ad742",350000,677,455,10,"2024-07-03"],
  ["pr14","p7","Stadsodling framför biblioteket","Odla tillsammans med grannar och skapa en mjukare entré till biblioteket.","photo-1614638964097-20e7104dea3c","photo-1441974231531-c6227db76b6e",160000,604,432,13,"2024-08-25"],
  ["pr15","p8","Lek för alla","En inkluderande lekplats med fler sinnesintryck och tillgängliga redskap.","photo-1773242567388-ddbe1b9cb343","photo-1500534623283-312aade485b7",620000,988,755,19,"2024-08-29"],
  ["pr16","p9","Kajen som vardagsrum","Fler träbänkar, planteringar och mjuk belysning gör kajen till en plats att stanna på.","photo-1507525428034-b723cf961d3e","photo-1497250681960-ef046c08a56e",340000,516,362,8,"2024-09-03"],
  ["pr17","p10","Grönare centrumplats","Skapa fler träd, regnbäddar och flexibla sittplatser för boende och besökare.","photo-1477959858617-67f85cf4f1df","photo-1441974231531-c6227db76b6e",580000,689,477,11,"2024-09-07"]
];
export const proposals: Proposal[] = proposalRows.map(([id,placeId,title,description,imageBefore,imageAfter,cost,votes,supporters,comments,createdAt], index) => ({ id, placeId, municipality: places.find(p => p.id === placeId)?.municipality || "", title, description, imageBefore: img(imageBefore), imageAfter: img(imageAfter), ...(id === "pr1" ? { imagesBefore: [img(imageBefore), img("photo-1511818966892-d7d671e672a2"), img("photo-1497366811353-6870744d04b2"), img("photo-1558618666-fcd25c85cd64")], imagesAfter: [img(imageAfter), img("photo-1518005020951-eccb494ad742"), img("photo-1441974231531-c6227db76b6e"), img("photo-1497366754035-f200968a6e72")] } : id === "pr2" ? { imagesBefore: [img(imageBefore), img("photo-1497366811353-6870744d04b2")], imagesAfter: [img(imageAfter), img("photo-1441974231531-c6227db76b6e")] } : {}), cost, votes, supporters, comments, author: users[index % users.length], collaborators: index < 5 ? [users[(index + 1) % users.length], users[(index + 2) % users.length]] : [users[(index + 1) % users.length]], category: places.find(p => p.id === placeId)?.category || "Plats", createdAt }));

export const comments: Comment[] = [
  { id: "c1", proposalId: "pr1", user: users[1], body: "Det här skulle göra enorm skillnad för hela stråket. Älskar färgpaletten!", createdAt: "2 dagar sedan" },
  { id: "c2", proposalId: "pr1", user: users[0], body: "Håller med! Gärna med växter som gynnar pollinatörer också.", createdAt: "igår" },
  { id: "c3", proposalId: "pr1", user: users[2], body: "Som konstnär ser jag stor potential i att arbeta med lokala färger och material.", createdAt: "för 3 timmar sedan" },
  { id: "c4", proposalId: "pr2", user: users[3], body: "Klätterväxter skulle göra passagen mycket mjukare.", createdAt: "igår" },
  { id: "c5", proposalId: "pr3", user: users[4], body: "Ett roterande galleri hade gett tunneln en helt ny identitet.", createdAt: "för 5 dagar sedan" }
];
