import localFont from "next/font/local";

export const switzer = localFont({
  src: [
    {
      path: "../public/fonts/Switzer_Complete/Fonts/WEB/fonts/Switzer-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Switzer_Complete/Fonts/WEB/fonts/Switzer-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Switzer_Complete/Fonts/WEB/fonts/Switzer-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],

  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial"],
});

/* ── Redesign typefaces ────────────────────────────────────────────────────────
   Exposed as CSS variables and picked up by styles/tokens.css
   (--bl-font-sans, --bl-font-mono). */

export const switzerVariable = localFont({
  src: "../public/fonts/Switzer_Complete/Fonts/WEB/fonts/Switzer-Variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-switzer",
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});
