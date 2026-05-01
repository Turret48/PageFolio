import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F2F5',
        surface: '#FFFFFF',
        cayenne: '#E55812',
        ink: '#1A1210',
        muted: '#B0A8A4',
        border: '#EDE8E6',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '20px',
        featured: '16px',
        shell: '32px',
      },
    },
  },
  plugins: [],
}
export default config
