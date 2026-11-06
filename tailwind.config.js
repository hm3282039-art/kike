/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05040c",
          900: "#0a0817",
          850: "#0f0c20",
          800: "#141029",
          700: "#1c1738",
          600: "#2a2350",
        },
        neon: {
          pink: "#ff2fb9",
          purple: "#a855f7",
          violet: "#7c3aed",
          blue: "#3f7cff",
          cyan: "#22e5ee",
          gold: "#ffd35c",
          lime: "#a3ff12",
          red: "#ff3b6b",
        },
      },
      fontFamily: {
        display: ["Bungee", "Outfit", "system-ui", "sans-serif"],
        sans: ["Outfit", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: ".55" },
          "50%": { opacity: "1" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(30px,-24px,0) scale(1.07)" },
          "66%": { transform: "translate3d(-24px,18px,0) scale(.95)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(.94)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        twinkle: {
          "0%,100%": { opacity: ".4" },
          "50%": { opacity: ".95" },
        },
        flashLabel: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        pulseGlow: "pulseGlow 3.4s ease-in-out infinite",
        drift: "drift 24s ease-in-out infinite",
        popIn: "popIn .45s cubic-bezier(.2,.9,.3,1.2) both",
        slideIn: "slideIn .4s cubic-bezier(.2,.9,.3,1.2) both",
        twinkle: "twinkle 7s ease-in-out infinite",
        flashLabel: "flashLabel 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
