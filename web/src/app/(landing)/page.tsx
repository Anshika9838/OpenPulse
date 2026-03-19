import Hero from "@/components/Landing/Hero";
import Overview from "@/components/Landing/Overview";
import Achievements from "@/components/Landing/Achievements";
import Features from "@/components/Landing/Features";
import Contact from "@/components/Landing/Contact";

export default function LandingPage() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <Overview />
      <Achievements />
      <Features />
      <Contact />
    </div>
  );
}
