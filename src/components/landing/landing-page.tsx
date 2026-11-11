import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { BothSides } from "./both-sides";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { InterviewStages } from "./interview-stages";
import { MeetIris } from "./meet-iris";
import { Navbar } from "./navbar";
import { QuoteMarquee } from "./quote-marquee";
import { ReportSection } from "./report-section";
import { s } from "./styles";

// Landing-only fonts, scoped to this wrapper so the app's root fonts are untouched.
const serif = Instrument_Serif({
  variable: "--lp-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--lp-mono",
  subsets: ["latin"],
  weight: "500",
});

export function LandingPage() {
  return (
    <div className={`${s.root} ${serif.variable} ${mono.variable}`}>
      <Navbar />
      <main>
        <Hero />
        <QuoteMarquee />
        <InterviewStages />
        <MeetIris />
        <ReportSection />
        <BothSides />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
