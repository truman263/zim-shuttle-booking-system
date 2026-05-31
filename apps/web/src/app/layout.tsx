import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LadyBird Shuttle Services | Harare Airport Transfers & Zimbabwe Shuttle Booking",
  description:
    "Book Harare airport transfers, private shuttle hire, corporate transport and long-distance shuttle services across Zimbabwe with LadyBird Shuttle Services.",
  icons: {
    icon: "/brand/ladybird-favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
