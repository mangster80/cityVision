import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om Stadslyft",
  description: "Läs hur Stadslyft hjälper människor att upptäcka, utveckla och stötta idéer för bättre stadsmiljöer."
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
