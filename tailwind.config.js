/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // asphalt  – near-black page background, the street
        // panel    – card surface, one step up from asphalt
        // cream    – RAL 1015 "Hellelfenbein", the actual body colour of German taxis
        // amber    – the roof-sign lamp; the primary accent, used sparingly
        // amberDim – unlit / inactive state of the roof-sign lamp
        // muted    – secondary text, warm grey-khaki
        // line     – hairline dividers
        // alert    – reserved for cancellation / storno states only
        asphalt: "#181714",
        panel: "#242119",
        cream: "#F1E4C3",
        amber: "#E8A233",
        amberDim: "#5C4A26",
        muted: "#9A9280",
        line: "#3A362C",
        alert: "#C15A3E",
      },
      fontFamily: {
        display: ['"Big Shoulders Condensed"', "sans-serif"],
        body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        signage: "0.14em",
      },
      boxShadow: {
        lamp: "0 0 28px 6px rgba(232,162,51,0.35)",
      },
      fontWeight: {
        600: "600",
        700: "700",
        800: "800",
      },
    },
  },
  plugins: [],
};
