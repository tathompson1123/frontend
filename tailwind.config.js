/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF3F0',
          100: '#FCE7E1',
          200: '#F9CFC3',
          300: '#F5B7A5',
          400: '#F29F87',
          500: '#E76F51',
          600: '#D64C2F',
          700: '#B03823',
          800: '#8A2B1A',
          900: '#641E11',
        },
        accent: {
          50: '#FEF7ED',
          100: '#FDEFD9',
          200: '#FBE0B3',
          300: '#F9D08D',
          400: '#F7C067',
          500: '#F4A261',
          600: '#E88B3E',
          700: '#D16F20',
          800: '#A75619',
          900: '#7D3F12',
        },
        highlight: {
          50: '#FEF9E8',
          100: '#FDF3D1',
          200: '#FBE8A3',
          300: '#F8DC75',
          400: '#F6D147',
          500: '#E9C46A',
          600: '#D4A83D',
          700: '#B38720',
          800: '#8A6718',
          900: '#614710',
        },
        teal: {
          50: '#E6F7F5',
          100: '#CCEFEB',
          200: '#99DFD7',
          300: '#66CFC3',
          400: '#33BFAF',
          500: '#2A9D8F',
          600: '#227E73',
          700: '#1A5E56',
          800: '#123F3A',
          900: '#0A1F1D',
        }
      }
    },
  },
  plugins: [],
}
