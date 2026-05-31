import { HomeBookingPanel } from "./(public)/components/HomeBookingPanel";
import { HomeHero } from "./(public)/components/HomeHero";
import { PublicFooter } from "./(public)/components/PublicFooter";
import { PublicHeader } from "./(public)/components/PublicHeader";

export default function Home() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />
      <HomeHero />
      <HomeBookingPanel />

      <section className="bg-[#030303] px-5 pb-24 pt-16 sm:px-6" />
      <PublicFooter />
    </main>
  );
}
