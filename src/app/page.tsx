import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Vettly — Voice interviews, scored with evidence",
  description:
    "Iris reads every résumé, talks with every applicant in real time, and hands your team a scored report backed by evidence.",
};

export default function HomePage() {
  return <LandingPage />;
}
