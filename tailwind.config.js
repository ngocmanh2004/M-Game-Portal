/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tet-red': '#d32f2f',
        'tet-gold': '#ffd700',
        'tet-yellow': '#ffeb3b',
      },
      fontFamily: {
        'festive': ['"Dancing Script"', 'cursive'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'rainbow': 'rainbow 3s linear infinite',
        'golden-glow': 'goldenGlow 2s ease-in-out infinite',
        'diamond-sparkle': 'diamondSparkle 1.5s ease-in-out infinite',
        'silver-shine': 'silverShine 3s linear infinite',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
        rainbow: {
          '0%, 100%': { borderColor: '#ff0000' },
          '14%': { borderColor: '#ff7f00' },
          '28%': { borderColor: '#ffff00' },
          '42%': { borderColor: '#00ff00' },
          '57%': { borderColor: '#0000ff' },
          '71%': { borderColor: '#4b0082' },
          '85%': { borderColor: '#9400d3' },
        },
        goldenGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)',
            borderColor: '#ffd700'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.8)',
            borderColor: '#ffed4e'
          },
        },
        diamondSparkle: {
          '0%, 100%': { 
            boxShadow: '0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5)',
            borderColor: '#00ffff',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 50px rgba(0, 255, 255, 1), 0 0 100px rgba(255, 255, 255, 1), inset 0 0 40px rgba(255, 255, 255, 0.8)',
            borderColor: '#ffffff',
            transform: 'scale(1.05)'
          },
        },
        silverShine: {
          '0%': { 
            backgroundPosition: '-200% center',
            borderColor: '#c0c0c0'
          },
          '100%': { 
            backgroundPosition: '200% center',
            borderColor: '#e0e0e0'
          },
        },
      },
    },
  },
  plugins: [],
}