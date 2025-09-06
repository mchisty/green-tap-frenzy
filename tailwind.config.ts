import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        game: {
          red: "hsl(var(--game-red))",
          blue: "hsl(var(--game-blue))",
          yellow: "hsl(var(--game-yellow))",
          green: "hsl(var(--game-green))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 40px hsl(var(--primary) / 0.6)",
            transform: "scale(1.05)",
          },
        },
        "bounce-in": {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "color-change": {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.1)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "score-glow": {
          "0%, 100%": {
            textShadow: "0 0 10px currentColor, 0 0 20px currentColor",
            transform: "scale(1)",
          },
          "50%": {
            textShadow: "0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor",
            transform: "scale(1.05)",
          },
        },
        "pop-in-3d": {
          "0%": {
            transform: "scale(0) rotate(-180deg) perspective(400px) rotateX(-90deg)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.3) rotate(-90deg) perspective(400px) rotateX(0deg)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(1) rotate(0deg) perspective(400px) rotateX(5deg)",
            opacity: "1",
          },
        },
        "title-float": {
          "0%, 100%": {
            transform: "perspective(800px) rotateX(10deg) rotateY(-5deg) translateY(0px)",
          },
          "50%": {
            transform: "perspective(800px) rotateX(15deg) rotateY(-2deg) translateY(-5px)",
          },
        },
        "game-over-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%": { transform: "translateX(-4px) rotate(-1deg)" },
          "20%": { transform: "translateX(4px) rotate(1deg)" },
          "30%": { transform: "translateX(-4px) rotate(-1deg)" },
          "40%": { transform: "translateX(4px) rotate(1deg)" },
          "50%": { transform: "translateX(-2px) rotate(-0.5deg)" },
          "60%": { transform: "translateX(2px) rotate(0.5deg)" },
        },
        "button-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "color-change": "color-change 0.3s ease-out",
        "score-glow": "score-glow 2s ease-in-out infinite",
        "pop-in": "pop-in 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)",
        "pop-in-3d": "pop-in-3d 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6)",
        "game-over-shake": "game-over-shake 0.6s ease-in-out",
        "button-press": "button-press 0.15s ease-out",
        "title-float": "title-float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
