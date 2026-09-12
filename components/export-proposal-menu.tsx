"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from "lucide-react";
import { Proposal, Place } from "@/types";
import { useLanguage } from "@/components/language-provider";
import { exportProposalToCsv, exportProposalToExcel, exportProposalToPdfPrint } from "@/lib/export-proposal";

interface ExportProposalMenuProps {
  proposal: Proposal;
  place?: Place | null;
}

export function ExportProposalMenu({ proposal, place }: ExportProposalMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getExportLabels = () => ({
    title: t("proposal.title") || "Titel",
    place: t("proposal.place") || "Plats",
    municipality: t("create.municipality") || "Kommun",
    category: t("create.category") || "Kategori",
    author: t("proposal.author") || "Skapad av",
    cost: t("create.cost") || "Beräknad kostnad",
    status: t("proposal.status-heading") || "Status",
    votes: t("proposalstats.votes") || "Röster",
    supporters: t("proposalstats.supporters") || "Hajps",
    comments: t("proposalstats.comments") || "Kommentarer",
    problem: t("proposal.problem-heading") || "Problem & Bakgrund",
    idea: t("proposal.idea-heading") || "Vision & Förbättringsförslag",
    createdAt: t("proposal.created-at") || "Skapad",
    beforeImage: t("proposal.before") || "Före",
    visionImage: t("proposal.vision") || "Vision",
    stadslyftHeader: "Stadslyft Förslagsunderlag",
    stadslyftUrl: typeof window !== "undefined" ? window.location.origin : "https://stadslyft.se",
    authorContact: t("proposal.export-author-contact") || "Kontaktuppgifter förslagsställare",
    authorEmail: t("proposal.export-author-email") || "E-post",
    authorLocation: t("proposal.export-author-location") || "Område / Ort",
    authorProfile: t("proposal.export-author-profile") || "Profil på Stadslyft",
    collaborators: t("proposal.export-collaborators") || "Medskapare",
    officialResponse: t("proposal.export-official-response") || "Yttrande / kommentar från kommunen eller ansvarig",
    officialNoteDate: t("proposal.export-official-note-date") || "Datum för yttrande",
  });

  const handleExportPdf = () => {
    setIsOpen(false);
    exportProposalToPdfPrint({ proposal, place, labels: getExportLabels() });
  };

  const handleExportExcel = () => {
    setIsOpen(false);
    exportProposalToExcel({ proposal, place, labels: getExportLabels() });
  };

  const handleExportCsv = () => {
    setIsOpen(false);
    exportProposalToCsv({ proposal, place, labels: getExportLabels() });
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#7056d8] hover:text-[#7056d8] active:scale-95 dark:border-white/15 dark:bg-[#201b35] dark:text-slate-200 dark:hover:border-white/30 dark:hover:text-white"
        title={t("proposal.export-button") || "Exportera förslag"}
      >
        <Download size={14} className="text-[#7056d8]" />
        <span>{t("proposal.export-button") || "Exportera"}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#201b35] animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("proposal.export-options") || "Välj format"}
          </p>

          <button
            type="button"
            onClick={handleExportPdf}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink transition hover:bg-mint hover:text-sage dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Printer size={15} className="text-red-500" />
            <div>
              <p>{t("proposal.export-pdf")}</p>
              <p className="text-[10px] font-normal text-slate-400">{t("proposal.export-pdf-subtitle")}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink transition hover:bg-mint hover:text-sage dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <div>
              <p>{t("proposal.export-excel")}</p>
              <p className="text-[10px] font-normal text-slate-400">{t("proposal.export-excel-subtitle")}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink transition hover:bg-mint hover:text-sage dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FileText size={15} className="text-blue-500" />
            <div>
              <p>{t("proposal.export-csv")}</p>
              <p className="text-[10px] font-normal text-slate-400">{t("proposal.export-csv-subtitle")}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
