/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0E1116',
        panel: '#151A21',
        raised: '#1B2129',
        line: '#262E38',
        ink: '#E6E9ED',
        dim: '#8B95A3',
        brass: { DEFAULT: '#C9A227', soft: '#3A310F' },
        granted: { DEFAULT: '#4E9A6B', soft: '#16281E' },
        denied: { DEFAULT: '#C4453B', soft: '#2E1614' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '4px', md: '4px', lg: '6px' },
    },
  },
  plugins: [],
};
