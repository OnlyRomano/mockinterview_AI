import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "HireReady AI",
  description: "An AI-powered interview preparation platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiased`}>
        <div className="absolute inset-0 -z-10 pointer-events-none" >
          <BackgroundRippleEffect />
        </div>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
