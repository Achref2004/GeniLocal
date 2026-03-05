/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // La palette "Héritage & Sérénité"
        parchemin: {
          DEFAULT: '#f4f1ea', // Couleur principale des pages (confort visuel)
          clair: '#eae4d3',   // Couleur des champs de saisie (inputs)
        },
        sauge: {
          DEFAULT: '#8a9a8f', // Couleur pour les accents et icônes
          fonce: '#708678',   // Couleur pour les titres et boutons principaux
        },
        laiton: '#cdaa6a',    // Couleur pour les dorures et détails précieux
        charbon: '#3a3f3b',   // Couleur du texte principal (plus doux que le noir)
        pierre: '#5e6660',    // Couleur du texte secondaire
      },
      fontFamily: {
        // Pour l'aspect "Livre ancien"
        serif: ['Georgia', 'serif'],
        // Pour l'aspect moderne et lisible
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}