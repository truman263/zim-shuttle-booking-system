import { HomeBookingPanel } from "./(public)/components/HomeBookingPanel";
import { HomeHero } from "./(public)/components/HomeHero";
import { HowBookingWorksSection } from "./(public)/components/HowBookingWorksSection";
import { FleetComfortSection } from "./(public)/components/FleetComfortSection";
import { FaqSection } from "./(public)/components/FaqSection";
import { PublicFooter } from "./(public)/components/PublicFooter";
import { PublicHeader } from "./(public)/components/PublicHeader";
import { ServicePromiseStrip } from "./(public)/components/ServicePromiseStrip";
import { SmartRoutesSection } from "./(public)/components/SmartRoutesSection";

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
        <FleetComfortSection />
        <SmartRoutesSection />
        <FaqSection />
        <PublicFooter />
      </main>
    </div>
  );
}
