/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0F1A',
        surface: '#141924',
        'surface-raised': '#1E2535',
        border: '#2A3347',
        'text-primary': '#E8ECF4',
        'text-secondary': '#8A9BB8',
        'text-muted': '#4A5568',
        purple: {
          primary: '#8B5CF6',
          dim: '#6D28D9',
          light: '#A78BFA',
          subtle: '#1E1535',
        },
        red: {
          compliance: '#EF4444',
          subtle: '#2D1515',
        },
        green: {
          compliance: '#34D399',
          subtle: '#0F2820',
        },
        amber: {
          compliance: '#F59E0B',
          subtle: '#2D1E00',
        },
        blue: {
          compliance: '#3B82F6',
          subtle: '#0D1E3D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
