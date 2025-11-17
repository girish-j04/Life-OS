/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Teenage Engineering + Duolingo + Strava inspired palette
        primary: {
          orange: '#FC4C02', // Strava orange
          yellow: '#FFD60A', // Duolingo yellow
          green: '#58CC02',  // Duolingo green
          blue: '#1CB0F6',   // Duolingo blue
          red: '#FF4B4B',    // Duolingo red
          purple: '#CE82FF', // Duolingo purple
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        te: {
          // Teenage Engineering colors
          red: '#FF3333',
          orange: '#FF6B35',
          yellow: '#FFD23F',
          green: '#4ECDC4',
          blue: '#1A535C',
          black: '#0A0A0A',
          white: '#FAFAFA',
          gray: '#E8E8E8',
        },
        // Dark theme colors
        dark: {
          bg: '#0F0F0F',
          surface: '#1A1A1A',
          surface2: '#252525',
          border: '#333333',
          text: '#FAFAFA',
          subtext: '#A3A3A3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        logo: ['Sora', 'Space Grotesk', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
      },
      boxShadow: {
        'te': '4px 4px 0px 0px rgba(0,0,0,0.25)',
        'te-sm': '2px 2px 0px 0px rgba(0,0,0,0.25)',
        'te-lg': '8px 8px 0px 0px rgba(0,0,0,0.25)',
        'duo': '0 4px 0 0 rgba(0,0,0,0.1)',
        'strava': '0 2px 8px rgba(252,76,2,0.15)',
      },
      keyframes: {
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'bounce-slight': 'bounce-slight 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'pop': 'pop 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
