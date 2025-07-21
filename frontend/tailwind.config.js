/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This scans all your components/pages for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        // Pastel blue color palette
        'pastel': {
          50: '#f0f8ff',   // Very light pastel blue
          100: '#e0f2fe',  // Light pastel blue
          200: '#bae6fd',  // Soft pastel blue
          300: '#7dd3fc',  // Medium pastel blue
          400: '#38bdf8',  // Pastel blue
          500: '#0ea5e9',  // Primary pastel blue
          600: '#0284c7',  // Darker pastel blue
          700: '#0369a1',  // Deep pastel blue
          800: '#075985',  // Very deep pastel blue
          900: '#0c4a6e',  // Darkest pastel blue
        },
        // White variations
        'pure': {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fdfdfd',
          300: '#fcfcfc',
          400: '#fafafa',
          500: '#f8f8f8',
          600: '#f5f5f5',
          700: '#f0f0f0',
          800: '#e8e8e8',
          900: '#e0e0e0',
        }
      },
      backgroundColor: {
        'primary': '#f0f8ff',      // Very light pastel blue background
        'secondary': '#e0f2fe',    // Light pastel blue background
        'accent': '#bae6fd',       // Soft pastel blue accent
        'surface': '#ffffff',      // Pure white surface
        'card': '#fefefe',         // Slightly off-white card
      },
      textColor: {
        'primary': '#0c4a6e',      // Dark pastel blue text
        'secondary': '#075985',    // Medium dark pastel blue text
        'accent': '#0ea5e9',       // Bright pastel blue accent text
        'muted': '#64748b',        // Muted text color
      },
      borderColor: {
        'primary': '#bae6fd',      // Soft pastel blue border
        'secondary': '#7dd3fc',    // Medium pastel blue border
        'accent': '#0ea5e9',       // Bright pastel blue accent border
      }
    },
  },
  plugins: [],
};
