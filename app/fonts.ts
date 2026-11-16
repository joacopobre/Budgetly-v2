import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

/* Budgetly typefaces, exposed as CSS variables and picked up by
   styles/tokens.css (--bl-font-sans, --bl-font-mono). Loaded once, in the
   root layout, for the landing page, the auth pages and the app. */

export const switzerVariable = localFont({
  src: "../public/fonts/Switzer_Complete/Fonts/WEB/fonts/Switzer-Variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-switzer",
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const fontVariables = `${switzerVariable.variable} ${geistMono.variable}`;
