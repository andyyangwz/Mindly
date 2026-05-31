import "./LandingPage.css";
import FloatingOrbs from "./components/FloatingOrbs";
import ThemeToggle from "./components/ThemeToggle";
import LanguageToggle from "./components/LanguageToggle";
import HeroSection from "./sections/HeroSection";
import PhilosophySection from "./sections/PhilosophySection";
import WhySection from "./sections/WhySection";
import FeaturesSection from "./sections/FeaturesSection";
import TransformationSection from "./sections/TransformationSection";
import CalendarShowcase from "./sections/CalendarShowcase";
import JournalShowcase from "./sections/JournalShowcase";
import PricingSection from "./sections/PricingSection";
import FinalCTASection from "./sections/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <FloatingOrbs count={5} />
      <LanguageToggle />
      <ThemeToggle />
      <HeroSection />
      <PhilosophySection />
      <WhySection />
      <FeaturesSection />
      <TransformationSection />
      <CalendarShowcase />
      <JournalShowcase />
      <PricingSection />
      <FinalCTASection />
    </div>
  );
}
