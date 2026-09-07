"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { contentTranslations } from "@/data/content-translations";
import { getStoredUserRecord, updateStoredUserPreferences } from "@/services/user-storage";

export type Language = "sv" | "en";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (swedish: string, english: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const translations: Record<string, string> = {
  "Små idéer.": "Small ideas.", "Stor förändring.": "Big change.", "DIN STAD, DIN VISION": "YOUR CITY, YOUR VISION",
  "Upptäck platser": "Discover places", "Dela en idé": "Share an idea", "platser i fokus": "places in focus",
  "visioner delade": "visions shared", "röster från staden": "votes from the city", "Veckans plats": "Place of the week",
  "Idéer som rör sig framåt": "Ideas moving forward", "FRÅN GEMENSKAPEN": "FROM THE COMMUNITY", "Se alla förslag": "See all proposals",
  "TILLSAMMANS ÄR VI STARKARE": "TOGETHER WE ARE STRONGER", "Staden tillhör alla som bor i den.": "The city belongs to everyone who lives in it.",
  "Platser med potential": "Places with potential", "Se vad människor i din stad vill förändra.": "See what people in your city want to change.",
  "Karta": "Map", "Lista": "List", "Mockkarta · Stockholm & Sverige": "Mock map · Stockholm & Sweden",
  "Sök plats eller område...": "Search place or area...", "förslag hittades": "proposals found", "Populärast": "Most popular",
  "Nyast": "Newest", "Mest stöd": "Most support", "Platser att upptäcka": "Places to discover",
  "Dela en vision": "Share a vision", "DIN TUR ATT PÅVERKA": "YOUR TURN TO MAKE A DIFFERENCE",
  "Berätta om platsen du vill se förändrad och hur du tänker.": "Tell us about the place you want to change and how you see it.",
  "Vad heter platsen?": "What is the place called?", "Var ligger den?": "Where is it located?",
  "Vad vill du förbättra?": "What would you improve?", "Din förbättringsidé": "Your improvement idea",
  "Uppskattad kostnad": "Estimated cost", "valfritt": "optional", "Spara lokalt utkast": "Save local draft",
  "Välkommen tillbaka": "Welcome back", "Logga in för att följa dina visioner.": "Log in to follow your visions.",
  "Din e-postadress": "Your email address", "Lösenord": "Password", "Logga in": "Log in",
  "Demo-läge — ingen riktig autentisering ännu": "Demo mode — no real authentication yet",
  "CITYVISION-MEDLEM": "CITYVISION MEMBER", "förslag skapade": "proposals created", "röster fått": "votes received",
  "idéer stöttade": "ideas supported", "kommentarer": "comments", "Mina idéer": "My ideas",
  "Stöttade förslag": "Supported proposals", "Redigera profil": "Edit profile", "Till startsidan": "Back home",
  "FÖRSLAG TILL FÖRBÄTTRING": "IMPROVEMENT PROPOSAL", "stödjer": "supporters", "Tillbaka till utforska": "Back to explore",
  "OM PLATSEN": "ABOUT THE PLACE", "En plats värd att utveckla.": "A place worth developing.",
  "förslag för platsen": "visions for this place", "FÖRSLAG FRÅN GEMENSKAPEN": "PROPOSALS FROM THE COMMUNITY",
  "Tillbaka till": "Back to", "Före": "Before", "Vision": "Vision", "uppskattat": "estimated",
  "Jag stödjer förslaget": "I support this proposal", "Skriv en kommentar...": "Write a comment...",
  "Skicka kommentar": "Send comment", "röster": "votes", "Laddar...": "Loading...",
  "Logga in för att skapa": "Log in to create", "Du behöver vara inloggad för att dela en plats eller förbättringsidé.": "You need to be logged in to share a place or improvement idea.",
  "Till utforska": "Back to explore", "Din vision är sparad!": "Your vision is saved!",
  "Det här är ett lokalt mockutkast. När backend kopplas på kan du publicera det för hela staden.": "This is a local mock draft. Once a backend is connected, you can publish it for the whole city.",
  "UTKAST": "DRAFT", "Redigera": "Edit", "Fortsätt redigera": "Continue editing", "Avbryt": "Cancel", "Bild på platsen": "Image of the place",
  "Ladda upp en bild": "Upload an image", "JPG, PNG eller WEBP upp till 10 MB": "JPG, PNG or WEBP up to 10 MB",
  "Beskriv vad som inte fungerar idag...": "Describe what does not work today...", "Hur skulle platsen kunna bli bättre?": "How could the place be improved?",
  "Till exempel: Betongbron vid centrum": "For example: The concrete bridge downtown", "Sök adress eller område": "Search address or area",
  "Bilden får vara högst 10 MB.": "The image must be no larger than 10 MB.",
  "Välj en bild i JPG-, PNG- eller WEBP-format.": "Choose an image in JPG, PNG or WEBP format.",
  "Visa plats": "View place", "förslag": "proposals", "Du stödjer förslaget": "You support this proposal",
  "Rösta upp": "Upvote", "Rösta ner": "Downvote", "just nu": "just now",
  "Kommentarer": "Comments", "Platsen hittades inte.": "Place not found.", "Förslaget hittades inte.": "Proposal not found.",
  "Lägg till ett förslag": "Add a proposal", "med sedan september 2024": "member since September 2024",
  "Inga förslag ännu.": "No proposals yet.",
  "Du är inloggad": "You are logged in", "Du är utloggad": "You are logged out",
  "Kunde inte hitta din position. Kontrollera webbläsarens platsåtkomst.": "Could not find your location. Check browser location permissions.",
  "Du är här": "You are here", "Visa min position": "Show my location",
  "Magic link skickad": "Magic link sent",
  "Supabase är inte konfigurerat ännu. Lägg till variablerna i .env.local.": "Supabase is not configured yet. Add the variables to .env.local.",
  "Länken är skickad. Kontrollera din inkorg.": "The link has been sent. Check your inbox.",
  "Kunde inte hämta positionen. Kontrollera platsåtkomst.": "Could not get your location. Check location permissions.",
  "Din webbläsare stöder inte platsåtkomst.": "Your browser does not support location access.",
  "Hämtar position...": "Getting location...",
  "Position vald:": "Location selected:",
  "Demoinloggning klar": "Demo sign-in complete",
  "Fortsätt i demo-läge": "Continue in demo mode",
  "Du behöver vara inloggad för att se din profil.": "You need to be signed in to view your profile.",
  "Profilen är uppdaterad": "Profile updated",
  "Namn": "Name", "Profilbild URL": "Profile image URL", "Spara ändringar": "Save changes",
  "Före- och efterbilder": "Before and after images", "Ladda upp före-bild": "Upload before image",
  "Ladda upp efter-bild": "Upload after image", "Platsen idag": "The place today",
  "Din förbättringsvision": "Your improvement vision", "1. Bilder på platsen idag": "1. Images of the place today",
  "Förslagets titel": "Proposal title",
  "Till exempel: Varm belysning och mörkgrön färg": "For example: Warm lighting and dark green colour",
  "2. Bilder på ditt förbättringsförslag": "2. Images of your improvement proposal",
  "Ladda upp före-bilder": "Upload before images", "Ladda upp efter-bilder": "Upload after images",
  "Välj bilder i JPG-, PNG- eller WEBP-format.": "Choose JPG, PNG, or WEBP images.",
  "Varje bild får vara högst 10 MB.": "Each image must be no larger than 10 MB.",
  "Bilderna kunde inte läsas in.": "The images could not be loaded.",
  "Välj en eller flera bilder": "Choose one or more images", "Visa din förbättringsvision": "Show your improvement vision",
  "Ladda upp minst en före-bild och en efter-bild.": "Upload at least one before image and one after image.",
  "Ladda upp före-bilder först": "Upload before images first",
  "Detta steg låses upp efter steg 1": "This step unlocks after step 1",
  "Platsförslag kunde inte hämtas just nu.": "Location suggestions are unavailable right now.",
  "Kategori för förslaget": "Proposal category", "Välj kategori": "Choose a category",
  "Broar": "Bridges", "Torg": "Squares", "Park": "Parks", "Kollektivtrafik": "Public transport",
  "Infrastruktur": "Infrastructure", "Promenad": "Promenade", "Lekplats": "Playground", "Plats": "Public space"
  , "Lämna sidan?": "Leave this page?", "Nej, stanna kvar": "No, stay", "Ja, lämna": "Yes, leave"
  , "Du har osparade ändringar. Vill du lämna sidan?": "You have unsaved changes. Do you want to leave this page?"
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("sv");

  useEffect(() => {
    const savedLanguage = getStoredUserRecord()?.language;
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    updateStoredUserPreferences({ language });
    const translateDom = () => {
      const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const allTranslations = { ...translations, ...contentTranslations };
      const replacements: Record<string, string> = language === "en"
        ? { ...allTranslations, "1. Bilder på platsen idag": "Images of the place today", "2. Bilder på ditt förbättringsförslag": "Images of your improvement proposal" }
        : { ...Object.fromEntries(Object.entries(allTranslations).map(([sv, en]) => [en, sv])), "1. Bilder på platsen idag": "Bilder på platsen idag", "2. Bilder på ditt förbättringsförslag": "Bilder på ditt förbättringsförslag" };
      let node: Node | null;
      while ((node = nodes.nextNode())) {
        const value = node.textContent?.trim();
        if (value && replacements[value]) node.textContent = node.textContent?.replace(value, replacements[value]) || "";
      }
      document.querySelectorAll<HTMLElement>("[placeholder], [aria-label]").forEach(element => {
        for (const attribute of ["placeholder", "aria-label"]) {
          const value = element.getAttribute(attribute);
          if (value && replacements[value]) element.setAttribute(attribute, replacements[value]);
        }
      });
    };
    const observer = new MutationObserver(translateDom);
    observer.observe(document.body, { childList: true, subtree: true });
    translateDom();
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={{ language, toggleLanguage: () => setLanguage(current => current === "sv" ? "en" : "sv"), t: (swedish, english) => language === "sv" ? swedish : english }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage måste användas inuti LanguageProvider");
  return context;
}
