import "./LandingPage.css";
import FloatingOrbs from "./components/FloatingOrbs";
import ThemeToggle from "./components/ThemeToggle";
import HeroSection from "./sections/HeroSection";
import PhilosophySection from "./sections/PhilosophySection";
import FeaturesSection from "./sections/FeaturesSection";
import TransformationSection from "./sections/TransformationSection";
import CalendarShowcase from "./sections/CalendarShowcase";
import JournalShowcase from "./sections/JournalShowcase";
import FinalCTASection from "./sections/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <FloatingOrbs count={5} />
      <ThemeToggle />
      <HeroSection />
      <PhilosophySection />
      <FeaturesSection />
      <TransformationSection />
      <CalendarShowcase />
      <JournalShowcase />
      <FinalCTASection />
    </div>
  );
}
