import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Utforska platser och stadsförslag",
  description: "Upptäck platser och lokala idéer som kan göra staden tryggare, grönare och bättre."
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
