import React from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import "@fontsource/dancing-script"; // font-handwriting
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Component {...pageProps} />
      <CookieBanner />
      <Analytics />
    </div>
  );
}

export default appWithTranslation(MyApp);
