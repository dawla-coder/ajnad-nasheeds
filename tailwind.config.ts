import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1A2A',
        foreground: '#F2D46F',
        primary: { DEFAULT: '#EAC14A', foreground: '#0B1A2A' },
        secondary: { DEFAULT: '#18324E', foreground: '#F2D46F' },
        accent: { DEFAULT: '#11263C', foreground: '#F2D46F' },
        border: '#18324E',
        input: '#18324E',
        ring: '#EAC14A',
        navy: {
          900: '#0B1A2A',
          800: '#11263C',
          700: '#18324E',
        },
        gold: {
          400: '#F2D46F',
          500: '#EAC14A',
        },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)'],
      },
      boxShadow: {
        soft: '0 6px 30px rgba(0,0,0,0.25)'
      }
    },
  },
  plugins: [],
}
export default config
