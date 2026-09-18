/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Surface & Background (Dark Theme / Mica) ---
        "background": "#131313",
        "surface": "#131313",
        "surface-dim": "#131313",
        "surface-bright": "#393939",
        "surface-mica": "#1c1c1c",
        "surface-card": "#2c2c2c",
        "surface-variant": "#353535",
        "surface-container-lowest": "#0e0e0e",
        "surface-container-low": "#1b1b1b",
        "surface-container": "#20201f",
        "surface-container-high": "#2a2a2a",
        "surface-container-highest": "#353535",
        "surface-tint": "#4cd7f6",

        // --- On Surface & Text Colors ---
        "on-background": "#e5e2e1",
        "on-surface": "#e5e2e1",
        "on-surface-variant": "#bcc9cd",
        "inverse-surface": "#e5e2e1",
        "inverse-on-surface": "#313030",

        // --- Primary Brand Colors (Modern Electric / Sapphire Blue) ---
        "primary": "#38bdf8",              // Vibrant Sky / Sapphire Active (Luminance balanced)
        "primary-container": "#2563eb",    // Deep Modern Royal Blue
        "primary-fixed": "#60a5fa",        // Light Crisp Blue
        "primary-fixed-dim": "#38bdf8",
        "on-primary": "#0f172a",           // High-contrast deep slate on active blue
        "on-primary-container": "#dbeafe",
        "on-primary-fixed": "#0c4a6e",
        "on-primary-fixed-variant": "#1d4ed8",
        "inverse-primary": "#1d4ed8",

        // --- Secondary Brand Colors (Emerald / Mint) ---
        "secondary": "#4edea3",
        "secondary-container": "#00a572",
        "secondary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary": "#003824",
        "on-secondary-container": "#00311f",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",

        // --- Tertiary Brand Colors (Amber / Orange) ---
        "tertiary": "#ffb873",
        "tertiary-container": "#e89337",
        "tertiary-fixed": "#ffdcbf",
        "tertiary-fixed-dim": "#ffb873",
        "on-tertiary": "#4b2800",
        "on-tertiary-container": "#5b3200",
        "on-tertiary-fixed": "#2d1600",
        "on-tertiary-fixed-variant": "#6a3b00",

        // --- Error & Semantic Status ---
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",

        // --- Borders & Outlines ---
        "border-default": "#3d3d3d",
        "outline": "#869397",
        "outline-variant": "#3d494c",
      },
      spacing: {
        "stack-xs": "4px",
        "stack-sm": "8px",
        "stack-md": "12px",
        "gutter": "16px",
        "pane-padding": "24px",
        "pane-left": "260px",
        "pane-right": "360px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "Courier New", "monospace"],
      },
      fontSize: {
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "400" }],
        "caption": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "400" }],
        "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "code-md": ["13px", { lineHeight: "20px", fontWeight: "450" }],
        "code-sm": ["11px", { lineHeight: "16px", fontWeight: "400" }],
      }
    },
  },
  plugins: [],
}
