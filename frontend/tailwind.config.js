/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0E0F11',
          secondary: '#111317',
        },
        neon: {
          blue: '#4AC8FF',
          cyan: '#00AEEF',
          purple: '#7A5CFF',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'neon-blue': '0 0 10px rgba(74, 200, 255, 0.5), 0 0 20px rgba(74, 200, 255, 0.3)',
        'neon-cyan': '0 0 10px rgba(0, 174, 239, 0.5), 0 0 20px rgba(0, 174, 239, 0.3)',
        'neon-purple': '0 0 10px rgba(122, 92, 255, 0.5), 0 0 20px rgba(122, 92, 255, 0.3)',
        'glow': '0 0 20px rgba(74, 200, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

