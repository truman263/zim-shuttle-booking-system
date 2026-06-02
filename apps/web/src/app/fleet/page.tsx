import type { Metadata } from "next";
import { FleetPage } from "../(public)/components/FleetPage";
import { PublicFooter } from "../(public)/components/PublicFooter";
import { PublicHeader } from "../(public)/components/PublicHeader";

export const metadata: Metadata = {
  title:
    "LadyBird Shuttle Fleet | Comfortable Shuttle Vehicles for Airport & Private Travel",
  description:
    "Explore the LadyBird Shuttle Services fleet experience for airport transfers, corporate travel, private shuttle hire and group movement across Zimbabwe.",
};

export default function Fleet() {
  return (
    <div
      className="min-h-screen bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />
      <FleetPage />
      <PublicFooter />
    </div>
  );
}
