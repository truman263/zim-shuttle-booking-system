import { PublicHeader } from "../(public)/components/PublicHeader";
import PublicBookingExperience from "@/components/public-booking/PublicBookingExperience";

export default function BookingPage() {
  return (
    <>
      <PublicHeader />
      <PublicBookingExperience variant="full" />
    </>
  );
}
