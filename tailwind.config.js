/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Modern gradient utilities
    "bg-gradient-hero",
    "bg-gradient-primary",
    "bg-gradient-energy",
    "bg-gradient-success",
    "text-gradient-primary",
    "text-gradient-energy",
    "shadow-glow-primary",
    "shadow-glow-energy",
    "shadow-modern",
    "shadow-elevated",
  ],
  theme: {
    extend: {
      colors: {
        // Modern, refined brand palette inspired by Apple Fitness+ and Nike Training Club
        primary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Energy/Action color - Nike-inspired vibrant orange
        energy: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // Main energy color
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        // Success/Achievement - Apple-inspired green
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Main success color
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // Warning - Refined amber
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Error - Clean red
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        // Modern neutral palette - Apple-inspired grays
        neutral: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
          1000: "#000000",
        },

        // Semantic design tokens for consistent theming
        background: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9",
          inverse: "#0f172a",
        },
        foreground: {
          DEFAULT: "#0f172a",
          secondary: "#334155",
          tertiary: "#64748b",
          inverse: "#ffffff",
        },
        border: {
          DEFAULT: "#e2e8f0",
          secondary: "#cbd5e1",
          tertiary: "#94a3b8",
          inverse: "#334155",
        },


        // Simplified fitness semantic colors - using main palette for consistency
        fitness: {
          // Cardio = Energy (orange)
          cardio: {
            50: "#fff7ed",
            100: "#ffedd5",
            500: "#f97316", // Maps to energy.500
            600: "#ea580c",
            700: "#c2410c",
          },
          // Strength = Primary (slate)
          strength: {
            50: "#f8fafc",
            100: "#f1f5f9",
            500: "#64748b", // Maps to primary.500
            600: "#475569",
            700: "#334155",
          },
          // Recovery = Success (green)
          recovery: {
            50: "#f0fdf4",
            100: "#dcfce7",
            500: "#22c55e", // Maps to success.500
            600: "#16a34a",
            700: "#15803d",
          },
        },
      },

      // Modern typography stack - Apple/Nike inspired
      fontFamily: {
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        display: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        body: [
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace"
        ],
      },

      // Modern, refined gradients inspired by Apple and Nike
      backgroundImage: {
        // Primary brand gradients - subtle and sophisticated
        "gradient-primary": "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        "gradient-primary-soft": "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",

        // Energy gradient - Nike-inspired vibrant
        "gradient-energy": "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        "gradient-energy-soft": "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",

        // Success gradient - Apple-inspired green
        "gradient-success": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        "gradient-success-soft": "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",

        // Hero gradient - modern and engaging
        "gradient-hero": "linear-gradient(135deg, #f97316 0%, #22c55e 50%, #64748b 100%)",

        // Subtle background gradients
        "gradient-background": "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        "gradient-background-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",

        // Modern glass effect - more subtle
        "gradient-glass": "linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
        "gradient-glass-dark": "linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.4) 100%)",

        // Simplified fitness gradients
        "gradient-cardio": "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        "gradient-strength": "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        "gradient-recovery": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",

        // Utility gradients
        "gradient-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
      },

      // Modern typography scale - Apple/Nike inspired with better readability
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025em" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.03em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.035em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        "7xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.045em" }],
        "8xl": ["6rem", { lineHeight: "1.05", letterSpacing: "-0.05em" }],
        "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.055em" }],

        // Fluid typography for responsive design
        "fluid-xs": ["clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem)", { lineHeight: "1.2" }],
        "fluid-sm": ["clamp(0.875rem, 0.8rem + 0.3vw, 0.95rem)", { lineHeight: "1.3" }],
        "fluid-base": ["clamp(1rem, 0.9rem + 0.4vw, 1.125rem)", { lineHeight: "1.5" }],
        "fluid-lg": ["clamp(1.125rem, 1rem + 0.5vw, 1.25rem)", { lineHeight: "1.6" }],
        "fluid-xl": ["clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)", { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)", { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.875rem, 1.6rem + 1.2vw, 2.25rem)", { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2.25rem, 1.9rem + 1.5vw, 3rem)", { lineHeight: "1.1" }],
        "fluid-5xl": ["clamp(3rem, 2.5rem + 2vw, 3.75rem)", { lineHeight: "1.05" }],
        "fluid-6xl": ["clamp(3.75rem, 3rem + 3vw, 4.5rem)", { lineHeight: "1" }],

        // Display sizes for hero sections
        "display-sm": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-md": ["3.5rem", { lineHeight: "1.15", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-lg": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "800" }],
        "display-xl": ["6rem", { lineHeight: "1.05", letterSpacing: "-0.045em", fontWeight: "800" }],
        "display-2xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "900" }],
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        42: "10.5rem",
        46: "11.5rem",
        50: "12.5rem",
        54: "13.5rem",
        58: "14.5rem",
        62: "15.5rem",
        66: "16.5rem",
        70: "17.5rem",
        74: "18.5rem",
        78: "19.5rem",
        82: "20.5rem",
        86: "21.5rem",
        90: "22.5rem",
        94: "23.5rem",
        98: "24.5rem",
        102: "25.5rem",
        106: "26.5rem",
        110: "27.5rem",
        114: "28.5rem",
        118: "29.5rem",
        122: "30.5rem",
        126: "31.5rem",
        130: "32.5rem",

        // Safe area
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",

        // Semantic spacing
        "section-sm": "3rem",
        "section-md": "4rem",
        "section-lg": "6rem",
        "section-xl": "8rem",
        "section-2xl": "12rem",

        // Component spacing
        "component-xs": "0.5rem",
        "component-sm": "1rem",
        "component-md": "1.5rem",
        "component-lg": "2rem",
        "component-xl": "3rem",

        // Layout spacing
        "layout-xs": "1rem",
        "layout-sm": "1.5rem",
        "layout-md": "2rem",
        "layout-lg": "3rem",
        "layout-xl": "4rem",
        "layout-2xl": "6rem",

        // Fluid spacing
        "fluid-xs": "clamp(0.5rem, 1vw, 1rem)",
        "fluid-sm": "clamp(1rem, 2vw, 1.5rem)",
        "fluid-md": "clamp(1.5rem, 3vw, 2rem)",
        "fluid-lg": "clamp(2rem, 4vw, 3rem)",
        "fluid-xl": "clamp(3rem, 5vw, 4rem)",
        "fluid-2xl": "clamp(4rem, 6vw, 6rem)",
        "fluid-3xl": "clamp(6rem, 8vw, 8rem)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
        "7xl": "3.5rem",
        "8xl": "4rem",
      },

      // Grid templates used by layout helpers
      gridTemplateColumns: {
        "auto-fit-xs": "repeat(auto-fit, minmax(16rem, 1fr))",
        "auto-fit-sm": "repeat(auto-fit, minmax(20rem, 1fr))",
        "auto-fit-md": "repeat(auto-fit, minmax(24rem, 1fr))",
        "auto-fit-lg": "repeat(auto-fit, minmax(28rem, 1fr))",
        "auto-fit-xl": "repeat(auto-fit, minmax(32rem, 1fr))",
        "auto-fill-xs": "repeat(auto-fill, minmax(16rem, 1fr))",
        "auto-fill-sm": "repeat(auto-fill, minmax(20rem, 1fr))",
        "auto-fill-md": "repeat(auto-fill, minmax(24rem, 1fr))",
        "auto-fill-lg": "repeat(auto-fill, minmax(28rem, 1fr))",
        "auto-fill-xl": "repeat(auto-fill, minmax(32rem, 1fr))",
        sidebar: "250px 1fr",
        "sidebar-reverse": "1fr 250px",
        "main-sidebar": "1fr 300px",
        "sidebar-main": "300px 1fr",
        "holy-grail": "200px 1fr 200px",
      },
      gridTemplateRows: {
        "header-main-footer": "auto 1fr auto",
        "main-footer": "1fr auto",
        "header-main": "auto 1fr",
      },

      // Modern shadow system - Apple/Nike inspired with subtle depth
      boxShadow: {
        // Basic shadows - more subtle and refined
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.15)",

        // Modern elevated shadows
        elevated: "0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)",
        "elevated-lg": "0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 4px 16px 0 rgba(0, 0, 0, 0.06)",

        // Subtle glow effects
        "glow-primary": "0 0 20px rgba(100, 116, 139, 0.15)",
        "glow-energy": "0 0 20px rgba(249, 115, 22, 0.2)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.15)",

        // Modern glass effect
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)",

        // Fitness-specific shadows (simplified)
        cardio: "0 4px 16px 0 rgba(249, 115, 22, 0.15)",
        strength: "0 4px 16px 0 rgba(100, 116, 139, 0.15)",
        recovery: "0 4px 16px 0 rgba(34, 197, 94, 0.15)",
      },

      // Animations & keyframes (kept in config to allow class-based usage)
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-left": "slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-right": "slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-out": "scaleOut 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-subtle": "bounceSubtle 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        wiggle: "wiggle 0.5s ease-in-out",
        shake: "shake 0.5s ease-in-out",
        "rubber-band": "rubberBand 0.8s ease-in-out",
        jello: "jello 0.9s ease-in-out",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "spin-fast": "spin 0.5s linear infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-fast": "ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "shimmer-slow": "shimmer 3s linear infinite",
        shine: "shine 1.5s ease-in-out infinite",
        gradient: "gradient 15s ease infinite",
        "gradient-fast": "gradient 8s ease infinite",
        "gradient-slow": "gradient 25s ease infinite",
        "gradient-x": "gradientX 15s ease infinite",
        "gradient-y": "gradientY 15s ease infinite",
        "gradient-xy": "gradientXY 20s ease infinite",
        "type-writer": "typeWriter 3s steps(40, end)",
        "text-focus": "textFocus 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) both",
        "text-blur": "textBlur 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both",
        "zoom-in": "zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-out": "zoomOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "flip-in-x": "flipInX 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "flip-in-y": "flipInY 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "rotate-in": "rotateIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        flash: "flash 2s infinite",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "focus-ring": "focusRing 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "tap-feedback": "tapFeedback 0.1s ease-out",
        "swipe-left": "swipeLeft 0.3s ease-out",
        "swipe-right": "swipeRight 0.3s ease-out",
        "workout-pulse": "workoutPulse 2s ease-in-out infinite",
        "intensity-build": "intensityBuild 3s ease-in-out infinite",
        "rep-count": "repCount 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "achievement-pop": "achievementPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "progress-fill": "progressFill 1s ease-out",
        "energy-wave": "energyWave 4s ease-in-out infinite",
        "motivation-bounce": "motivationBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "workout-complete": "workoutComplete 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "rest-breathe": "restBreathe 4s ease-in-out infinite",
        "timer-tick": "timerTick 1s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideDown: { "0%": { transform: "translateY(-20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideLeft: { "0%": { transform: "translateX(20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideRight: { "0%": { transform: "translateX(-20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.9)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        scaleOut: { "0%": { transform: "scale(1)", opacity: "1" }, "100%": { transform: "scale(0.9)", opacity: "0" } },
        bounceSubtle: {
          "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0,0,0)" },
          "40%, 43%": { transform: "translate3d(0,-8px,0)" },
          "70%": { transform: "translate3d(0,-4px,0)" },
          "90%": { transform: "translate3d(0,-2px,0)" },
        },
        wiggle: {
          "0%, 7%": { transform: "rotateZ(0)" },
          "15%": { transform: "rotateZ(-15deg)" },
          "20%": { transform: "rotateZ(10deg)" },
          "25%": { transform: "rotateZ(-10deg)" },
          "30%": { transform: "rotateZ(6deg)" },
          "35%": { transform: "rotateZ(-4deg)" },
          "40%, 100%": { transform: "rotateZ(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%,30%,50%,70%,90%": { transform: "translateX(-4px)" },
          "20%,40%,60%,80%": { transform: "translateX(4px)" },
        },
        rubberBand: {
          "0%": { transform: "scale3d(1, 1, 1)" },
          "30%": { transform: "scale3d(1.25, 0.75, 1)" },
          "40%": { transform: "scale3d(0.75, 1.25, 1)" },
          "50%": { transform: "scale3d(1.15, 0.85, 1)" },
          "65%": { transform: "scale3d(0.95, 1.05, 1)" },
          "75%": { transform: "scale3d(1.05, 0.95, 1)" },
          "100%": { transform: "scale3d(1, 1, 1)" },
        },
        jello: {
          "0%, 11.1%, 100%": { transform: "translate3d(0, 0, 0)" },
          "22.2%": { transform: "skewX(-12.5deg) skewY(-12.5deg)" },
          "33.3%": { transform: "skewX(6.25deg) skewY(6.25deg)" },
          "44.4%": { transform: "skewX(-3.125deg) skewY(-3.125deg)" },
          "55.5%": { transform: "skewX(1.5625deg) skewY(1.5625deg)" },
          "66.6%": { transform: "skewX(-0.78125deg) skewY(-0.78125deg)" },
          "77.7%": { transform: "skewX(0.390625deg) skewY(0.390625deg)" },
          "88.8%": { transform: "skewX(-0.1953125deg) skewY(-0.1953125deg)" },
        },
        heartbeat: { "0%": { transform: "scale(1)" }, "14%": { transform: "scale(1.1)" }, "28%": { transform: "scale(1)" }, "42%": { transform: "scale(1.1)" }, "70%": { transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        hoverUp: { "0%": { transform: "translateY(0)" }, "100%": { transform: "translateY(-4px)" } },
        hoverDown: { "0%": { transform: "translateY(-4px)" }, "100%": { transform: "translateY(0)" } },
        glow: { "0%": { boxShadow: "0 0 5px currentColor" }, "100%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 5px currentColor" }, "50%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        shine: { "0%": { backgroundPosition: "-200% center" }, "100%": { backgroundPosition: "200% center" } },
        gradient: { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        gradientX: { "0%,100%": { backgroundPosition: "0% 0%" }, "50%": { backgroundPosition: "100% 0%" } },
        gradientY: { "0%,100%": { backgroundPosition: "0% 0%" }, "50%": { backgroundPosition: "0% 100%" } },
        gradientXY: {
          "0%,100%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
        },
        typeWriter: { "0%": { width: "0" }, "100%": { width: "100%" } },
        textFocus: { "0%": { filter: "blur(12px)", opacity: "0" }, "100%": { filter: "blur(0px)", opacity: "1" } },
        textBlur: { "0%": { filter: "blur(0px)", opacity: "1" }, "100%": { filter: "blur(12px)", opacity: "0" } },
        zoomIn: { "0%": { transform: "scale(0.3)", opacity: "0" }, "50%": { opacity: "1" }, "100%": { transform: "scale(1)", opacity: "1" } },
        zoomOut: { "0%": { transform: "scale(1)", opacity: "1" }, "50%": { opacity: "1" }, "100%": { transform: "scale(0.3)", opacity: "0" } },
        flipInX: {
          "0%": { transform: "perspective(400px) rotateX(90deg)", opacity: "0" },
          "40%": { transform: "perspective(400px) rotateX(-20deg)" },
          "60%": { transform: "perspective(400px) rotateX(10deg)", opacity: "1" },
          "80%": { transform: "perspective(400px) rotateX(-5deg)" },
          "100%": { transform: "perspective(400px) rotateX(0deg)", opacity: "1" },
        },
        flipInY: {
          "0%": { transform: "perspective(400px) rotateY(90deg)", opacity: "0" },
          "40%": { transform: "perspective(400px) rotateY(-20deg)" },
          "60%": { transform: "perspective(400px) rotateY(10deg)", opacity: "1" },
          "80%": { transform: "perspective(400px) rotateY(-5deg)" },
          "100%": { transform: "perspective(400px) rotateY(0deg)", opacity: "1" },
        },
        rotateIn: { "0%": { transform: "rotate(-200deg)", opacity: "0" }, "100%": { transform: "rotate(0)", opacity: "1" } },
        flash: { "0%,50%,100%": { opacity: "1" }, "25%,75%": { opacity: "0" } },
        pulseRing: { "0%": { transform: "scale(0.33)", opacity: "1" }, "80%,100%": { transform: "scale(2.33)", opacity: "0" } },
        focusRing: { "0%": { transform: "scale(0.8)", opacity: "0" }, "50%": { transform: "scale(1.1)", opacity: "0.3" }, "100%": { transform: "scale(1)", opacity: "0" } },
        tapFeedback: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(0.95)" }, "100%": { transform: "scale(1)" } },
        swipeLeft: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-100%)" } },
        swipeRight: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(100%)" } },
        workoutPulse: {
          "0%,100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(99,102,241,0.7)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 10px rgba(99,102,241,0)" },
        },
        intensityBuild: {
          "0%": { transform: "scale(1)", filter: "brightness(1) saturate(1)" },
          "50%": { transform: "scale(1.02)", filter: "brightness(1.1) saturate(1.2)" },
          "100%": { transform: "scale(1)", filter: "brightness(1) saturate(1)" },
        },
        repCount: {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.2) rotate(-5deg)" },
          "50%": { transform: "scale(1.3) rotate(0deg)" },
          "75%": { transform: "scale(1.2) rotate(5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        achievementPop: {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0", filter: "blur(4px)" },
          "50%": { transform: "scale(1.2) rotate(-90deg)", opacity: "1", filter: "blur(0px)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1", filter: "blur(0px)" },
        },
        progressFill: { "0%": { width: "0%", opacity: "0.5" }, "100%": { width: "var(--progress-width)", opacity: "1" } },
        energyWave: {
          "0%,100%": { backgroundPosition: "0% 50%", filter: "hue-rotate(0deg)" },
          "25%": { backgroundPosition: "25% 25%", filter: "hue-rotate(90deg)" },
          "50%": { backgroundPosition: "100% 50%", filter: "hue-rotate(180deg)" },
          "75%": { backgroundPosition: "75% 75%", filter: "hue-rotate(270deg)" },
        },
        motivationBounce: {
          "0%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-20px) scale(1.1)" },
          "50%": { transform: "translateY(-30px) scale(1.15)" },
          "70%": { transform: "translateY(-20px) scale(1.1)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        workoutComplete: {
          "0%": { transform: "scale(0.8) rotate(-10deg)", opacity: "0", filter: "blur(4px)" },
          "50%": { transform: "scale(1.1) rotate(5deg)", opacity: "1", filter: "blur(0px)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1", filter: "blur(0px)" },
        },
        restBreathe: { "0%,100%": { transform: "scale(1)", opacity: "0.8" }, "50%": { transform: "scale(1.05)", opacity: "1" } },
        timerTick: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
      },

      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};