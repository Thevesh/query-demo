const escapeAmbiguousTailwindClasses = (content: string) =>
  content
    .replaceAll(
      "data-[state=closed]:slide-out-to-top-[48%]",
      "data-&lsqb;state=closed&rsqb;:slide-out-to-top-&lsqb;48%&rsqb;",
    )
    .replaceAll(
      "data-[state=open]:slide-in-from-top-[48%]",
      "data-&lsqb;state=open&rsqb;:slide-in-from-top-&lsqb;48%&rsqb;",
    );

/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./dashboards/**/*.{js,ts,jsx,tsx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
    ],
    transform: {
      DEFAULT: escapeAmbiguousTailwindClasses,
    },
  },
  theme: {
    extend: {
      colors: {
        "bg-white": "#ffffff",
        "bg-washed": "#f9fafb",
        "bg-washed-active": "#f3f4f6",
        "bg-black-50": "#f9fafb",
        "bg-black-950": "#030712",
        "bg-ogp-blue-50": "#eef4ff",
        "bg-ogp-blue-100": "#dbe8ff",
        "ogp-blue": {
          200: "#b8d0ff",
          600: "#276df1",
          700: "#1d56c4",
        },
        "otl-gray": {
          100: "#f3f4f6",
          200: "#e5e7eb",
        },
        "otl-ogp-blue": {
          200: "#b8d0ff",
        },
        "txt-black": {
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        "txt-ogp-blue": "#276df1",
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(101.65% 92.54% at 50% 0%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        button: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      fontFamily: {
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      fontSize: {
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "body-md": ["1rem", { lineHeight: "1.5rem" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      keyframes: {
        slide: {
          from: { width: "var(--from-width)" },
          to: { width: "var(--to-width)" },
        },
        grow: {
          from: { height: "var(--from-height)" },
          to: { height: "var(--to-height)" },
        },
        shimmer: {
          to: {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        slide: "slide 1.5s ease-out",
      },
    },
  },
  plugins: [],
};
