import { Proposal, Place } from "@/types";
import { formatCost } from "@/lib/format";

export interface ExportProposalOptions {
  proposal: Proposal;
  place?: Place | null;
  labels: {
    title: string;
    place: string;
    municipality: string;
    category: string;
    author: string;
    cost: string;
    status: string;
    votes: string;
    supporters: string;
    comments: string;
    problem: string;
    idea: string;
    createdAt: string;
    beforeImage: string;
    visionImage: string;
    stadslyftHeader: string;
    stadslyftUrl: string;
    authorContact: string;
    authorEmail: string;
    authorLocation: string;
    authorProfile: string;
    collaborators: string;
    officialResponse: string;
    officialNoteDate: string;
  };
}

/**
 * Clean string for safe CSV / TSV export
 */
function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates an Excel-compatible XML Spreadsheet file (.xls / XML format)
 * which opens natively in Microsoft Excel, Apple Numbers, Google Sheets, and LibreOffice Calc
 * with nice styles, column widths, colors, and formatting.
 */
export function exportProposalToExcel({ proposal, place, labels }: ExportProposalOptions): void {
  const problemParts = proposal.description
    ? proposal.description.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    : [];
  const problemText = problemParts.length > 1 ? problemParts[0] : "";
  const ideaText = problemParts.length > 1 ? problemParts.slice(1).join("\n\n") : (proposal.description || "");

  const safeFilename = `${proposal.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\-_]/g, "_")}_Stadslyft.xls`;
  const authorEmail = proposal.author?.authEmail || proposal.author?.providerEmail || "";
  const authorLocation = [proposal.author?.neighborhood, proposal.author?.city].filter(Boolean).join(", ");
  const collaboratorsList = (proposal.collaborators || []).map(c => c.name).join(", ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${proposal.title}</Title>
  <Author>${proposal.author?.name || "Stadslyft"}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1e293b"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#432874" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#7056d8" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="OfficialHeader">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#0369a1" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="FieldLabel">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
   </Borders>
  </Style>
  <Style ss:ID="FieldValue">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0f172a"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
   </Borders>
  </Style>
  <Style ss:ID="TextBlock">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1e293b"/>
   <Interior ss:Color="#f8fafc" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
   </Borders>
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="OfficialBlock">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0c4a6e"/>
   <Interior ss:Color="#f0f9ff" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#bae6fd"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#bae6fd"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#bae6fd"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#bae6fd"/>
   </Borders>
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Förslagsdetaljer">
  <Table ss:ExpandedColumnCount="4" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="380"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Column ss:AutoFitWidth="0" ss:Width="150"/>

   <!-- Header -->
   <Row ss:Height="40">
    <Cell ss:MergeAcross="3" ss:StyleID="HeaderStyle"><Data ss:Type="String"> ${labels.stadslyftHeader} – ${proposal.title}</Data></Cell>
   </Row>

   <!-- Metadata section -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> Översikt &amp; Information</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.title}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.title}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.place}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${place?.name || proposal.municipality}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.municipality}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.municipality}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.category}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.category}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.createdAt}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.createdAt}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.status}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.status || "idea"}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.cost}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${formatCost(proposal.cost)}</Data></Cell>
   </Row>

   <!-- Proposer & Contact details -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> ${labels.authorContact}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.author}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.author?.name || "Anonym"}</Data></Cell>
   </Row>
   ${authorEmail ? `
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.authorEmail}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${authorEmail}</Data></Cell>
   </Row>` : ""}
   ${authorLocation ? `
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.authorLocation}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${authorLocation}</Data></Cell>
   </Row>` : ""}
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.authorProfile}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${labels.stadslyftUrl}/profile?user=${proposal.author?.id}</Data></Cell>
   </Row>
   ${collaboratorsList ? `
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.collaborators}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${collaboratorsList}</Data></Cell>
   </Row>` : ""}

   <!-- Stats -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> Engagemang &amp; Statistik</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.votes}</Data></Cell>
    <Cell ss:StyleID="FieldValue"><Data ss:Type="Number">${proposal.votes}</Data></Cell>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.supporters}</Data></Cell>
    <Cell ss:StyleID="FieldValue"><Data ss:Type="Number">${proposal.supporters}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.comments}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="Number">${proposal.comments}</Data></Cell>
   </Row>

   <!-- Official Response / Municipality Note -->
   ${proposal.statusNote ? `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="OfficialHeader"><Data ss:Type="String"> ${labels.officialResponse}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.status}</Data></Cell>
    <Cell ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.status || "idea"}</Data></Cell>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">${labels.officialNoteDate}</Data></Cell>
    <Cell ss:StyleID="FieldValue"><Data ss:Type="String">${proposal.statusUpdatedAt || proposal.createdAt}</Data></Cell>
   </Row>
   <Row ss:Height="60">
    <Cell ss:MergeAcross="3" ss:StyleID="OfficialBlock"><Data ss:Type="String">${proposal.statusNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
   </Row>` : ""}

   <!-- Problem description -->
   ${problemText ? `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> ${labels.problem}</Data></Cell>
   </Row>
   <Row ss:Height="60">
    <Cell ss:MergeAcross="3" ss:StyleID="TextBlock"><Data ss:Type="String">${problemText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
   </Row>` : ""}

   <!-- Vision & Idea -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> ${labels.idea}</Data></Cell>
   </Row>
   <Row ss:Height="80">
    <Cell ss:MergeAcross="3" ss:StyleID="TextBlock"><Data ss:Type="String">${ideaText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
   </Row>

   <!-- Link -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String"> Länk till förslaget</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="FieldLabel"><Data ss:Type="String">URL</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="FieldValue"><Data ss:Type="String">${labels.stadslyftUrl}/proposal/${proposal.id}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a CSV export file.
 */
export function exportProposalToCsv({ proposal, place, labels }: ExportProposalOptions): void {
  const safeFilename = `${proposal.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\-_]/g, "_")}_Stadslyft.csv`;
  const authorEmail = proposal.author?.authEmail || proposal.author?.providerEmail || "";
  const authorLocation = [proposal.author?.neighborhood, proposal.author?.city].filter(Boolean).join(", ");
  const collaboratorsList = (proposal.collaborators || []).map(c => c.name).join(", ");

  const rows: (string | number)[][] = [
    [labels.title, proposal.title],
    [labels.place, place?.name || proposal.municipality],
    [labels.municipality, proposal.municipality],
    [labels.category, proposal.category],
    [labels.author, proposal.author?.name || "Anonym"],
  ];

  if (authorEmail) {
    rows.push([labels.authorEmail, authorEmail]);
  }
  if (authorLocation) {
    rows.push([labels.authorLocation, authorLocation]);
  }
  rows.push([labels.authorProfile, `${labels.stadslyftUrl}/profile?user=${proposal.author?.id}`]);

  if (collaboratorsList) {
    rows.push([labels.collaborators, collaboratorsList]);
  }

  rows.push(
    [labels.createdAt, proposal.createdAt],
    [labels.status, proposal.status || "idea"],
    [labels.cost, formatCost(proposal.cost)],
    [labels.votes, proposal.votes],
    [labels.supporters, proposal.supporters],
    [labels.comments, proposal.comments],
  );

  if (proposal.statusNote) {
    rows.push([labels.officialResponse, proposal.statusNote]);
    if (proposal.statusUpdatedAt) {
      rows.push([labels.officialNoteDate, proposal.statusUpdatedAt]);
    }
  }

  rows.push(
    [labels.problem, proposal.description],
    ["URL", `${labels.stadslyftUrl}/proposal/${proposal.id}`],
  );

  const csvContent = "\uFEFF" + rows.map(r => r.map(escapeCsv).join(";")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an elegant print-ready document formatted for A4 PDF export
 * via the browser's native window.print / Save to PDF.
 */
export function exportProposalToPdfPrint({ proposal, place, labels }: ExportProposalOptions): void {
  const problemParts = proposal.description
    ? proposal.description.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    : [];
  const problemText = problemParts.length > 1 ? problemParts[0] : "";
  const ideaText = problemParts.length > 1 ? problemParts.slice(1).join("\n\n") : (proposal.description || "");

  const beforeImg = proposal.imagesBefore?.[0] || proposal.imageBefore;
  const afterImg = proposal.imagesAfter?.[0] || proposal.imageAfter;
  const authorEmail = proposal.author?.authEmail || proposal.author?.providerEmail || "";
  const authorLocation = [proposal.author?.neighborhood, proposal.author?.city].filter(Boolean).join(", ");
  const collaboratorsList = (proposal.collaborators || []).map(c => c.name).join(", ");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>${proposal.title} – Stadslyft</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      background: #ffffff;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #7056d8;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #7056d8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .meta-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }
    .subtitle strong {
      color: #334155;
    }
    .images-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }
    .img-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      background: #f8fafc;
    }
    .img-box-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 5px 10px;
      background: #f1f5f9;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .img-box.vision .img-box-label {
      background: #e0e7ff;
      color: #4338ca;
    }
    .img-box img {
      width: 100%;
      height: 190px;
      object-fit: cover;
      display: block;
    }
    .stats-card {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      margin-bottom: 16px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-val {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-lbl {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .contact-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #581c87;
    }
    .contact-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      color: #7e22ce;
    }
    .contact-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .contact-grid span strong {
      color: #3b0764;
    }
    .section {
      margin-bottom: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .section.problem {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .section.idea {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .section.official {
      background: #f0f9ff;
      border-color: #bae6fd;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section.problem .section-title { color: #b45309; }
    .section.idea .section-title { color: #15803d; }
    .section.official .section-title { color: #0369a1; }
    .section-date {
      font-size: 10px;
      font-weight: normal;
      color: #0284c7;
      text-transform: none;
    }
    .section-content {
      font-size: 12.5px;
      color: #334155;
      white-space: pre-line;
      line-height: 1.55;
    }
    .section.official .section-content {
      color: #0c4a6e;
      font-weight: 500;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">🏙️ Stadslyft</div>
    <div class="meta-badge">${proposal.category} · ${proposal.municipality}</div>
  </div>

  <h1 class="title">${proposal.title}</h1>
  <div class="subtitle">
    <span>Plats: <strong>${place?.name || proposal.municipality}</strong></span>
    <span>Status: <strong>${proposal.status || "Idé skapad"}</strong></span>
    <span>Datum: <strong>${proposal.createdAt}</strong></span>
    <span>Kostnad: <strong>${formatCost(proposal.cost)}</strong></span>
  </div>

  <div class="images-grid">
    <div class="img-box">
      <div class="img-box-label">${labels.beforeImage}</div>
      <img src="${beforeImg}" alt="Före" />
    </div>
    <div class="img-box vision">
      <div class="img-box-label">${labels.visionImage}</div>
      <img src="${afterImg}" alt="Vision" />
    </div>
  </div>

  <div class="stats-card">
    <div class="stat-item">
      <div class="stat-val">${proposal.votes}</div>
      <div class="stat-lbl">${labels.votes}</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${proposal.supporters}</div>
      <div class="stat-lbl">${labels.supporters}</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${proposal.comments}</div>
      <div class="stat-lbl">${labels.comments}</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${formatCost(proposal.cost)}</div>
      <div class="stat-lbl">${labels.cost}</div>
    </div>
  </div>

  <!-- Proposer Contact Info -->
  <div class="contact-box">
    <div class="contact-title">${labels.authorContact}</div>
    <div class="contact-grid">
      <span>Förslagsställare: <strong>${proposal.author?.name || "Anonym"}</strong></span>
      ${authorEmail ? `<span>${labels.authorEmail}: <strong>${authorEmail}</strong></span>` : ""}
      ${authorLocation ? `<span>${labels.authorLocation}: <strong>${authorLocation}</strong></span>` : ""}
      ${collaboratorsList ? `<span>${labels.collaborators}: <strong>${collaboratorsList}</strong></span>` : ""}
      <span>Profil: <strong>${labels.stadslyftUrl}/profile?user=${proposal.author?.id}</strong></span>
    </div>
  </div>

  <!-- Official Municipality Comment / Note -->
  ${proposal.statusNote ? `
  <div class="section official">
    <div class="section-title">
      <span>🏛️ ${labels.officialResponse}</span>
      ${proposal.statusUpdatedAt ? `<span class="section-date">${labels.officialNoteDate}: ${proposal.statusUpdatedAt}</span>` : ""}
    </div>
    <div class="section-content">${proposal.statusNote}</div>
  </div>` : ""}

  ${problemText ? `
  <div class="section problem">
    <div class="section-title">${labels.problem}</div>
    <div class="section-content">${problemText}</div>
  </div>` : ""}

  <div class="section idea">
    <div class="section-title">${labels.idea}</div>
    <div class="section-content">${ideaText}</div>
  </div>

  <div class="footer">
    <span>Genererad från Stadslyft (${labels.stadslyftUrl}/proposal/${proposal.id})</span>
    <span>${new Date().toLocaleDateString("sv-SE")}</span>
  </div>

  <script>
    window.addEventListener("load", () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
