import Navbar from "@/components/Landing/Navbar";
import Footer from "@/components/Landing/Footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landingLayout">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
