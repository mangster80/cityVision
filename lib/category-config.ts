export interface CategoryConfig {
  key: string;
  color: string;
  bgLight: string;
  translationKey: string;
  iconSvg: string;
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  Park: {
    key: "Park",
    color: "#10b981",
    bgLight: "rgba(16, 185, 129, 0.12)",
    translationKey: "create.park",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 2l4 5.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg>`,
  },
  Torg: {
    key: "Torg",
    color: "#f59e0b",
    bgLight: "rgba(245, 158, 11, 0.12)",
    translationKey: "create.square",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V9"/><path d="M19 21V9"/><path d="M9 21V9"/><path d="M15 21V9"/><path d="M2 9h20L12 3z"/></svg>`,
  },
  Broar: {
    key: "Broar",
    color: "#0284c7",
    bgLight: "rgba(2, 132, 199, 0.12)",
    translationKey: "create.bridges",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M4 19V9"/><path d="M20 19V9"/><path d="M4 12h16"/><path d="M4 19a8 8 0 0 1 16 0"/><path d="M12 11v8"/></svg>`,
  },
  Kollektivtrafik: {
    key: "Kollektivtrafik",
    color: "#f43f5e",
    bgLight: "rgba(244, 63, 94, 0.12)",
    translationKey: "create.public-transport",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/><path d="m6 18-1.5 3"/><path d="m18 18 1.5 3"/><path d="M4 12h16"/></svg>`,
  },
  Infrastruktur: {
    key: "Infrastruktur",
    color: "#6366f1",
    bgLight: "rgba(99, 102, 241, 0.12)",
    translationKey: "create.infrastructure",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  },
  Promenad: {
    key: "Promenad",
    color: "#06b6d4",
    bgLight: "rgba(6, 182, 212, 0.12)",
    translationKey: "create.promenade",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  },
  Lekplats: {
    key: "Lekplats",
    color: "#ec4899",
    bgLight: "rgba(236, 72, 153, 0.12)",
    translationKey: "create.playground",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
  },
  Plats: {
    key: "Plats",
    color: "#7056d8",
    bgLight: "rgba(112, 86, 216, 0.12)",
    translationKey: "create.public-space",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
};

const DEFAULT_CONFIG: CategoryConfig = CATEGORY_CONFIGS.Plats;

export function getCategoryConfig(category?: string | null): CategoryConfig {
  if (!category) return DEFAULT_CONFIG;
  return CATEGORY_CONFIGS[category] ?? DEFAULT_CONFIG;
}
