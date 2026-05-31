import { HomeBookingPanel } from "./(public)/components/HomeBookingPanel";
import { HomeHero } from "./(public)/components/HomeHero";
import { HowBookingWorksSection } from "./(public)/components/HowBookingWorksSection";
import { PublicFooter } from "./(public)/components/PublicFooter";
import { PublicHeader } from "./(public)/components/PublicHeader";
import { ServicePromiseStrip } from "./(public)/components/ServicePromiseStrip";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />
      <main className="overflow-x-hidden">
        <div className="relative bg-[#030303]">
          <HomeHero />
          <HomeBookingPanel />
        </div>
        <HowBookingWorksSection />
        <ServicePromiseStrip />
        <PublicFooter />
      </main>
    </div>
  );
}
