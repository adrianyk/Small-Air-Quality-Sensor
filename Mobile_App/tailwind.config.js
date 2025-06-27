/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"], // NOTE: Update this to include the paths to all of your component files.
  presets: [require("nativewind/preset")],
  safelist: [
    "text-dark-title",
    "text-dark-text",
    "text-light-title",
    "text-light-text",
    "bg-dark-background",
    "bg-light-background",
    "border-dark-border",
    "border-light-border",
    "#aaa",
    "#666",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#030014',
        secondary: '#151312',
        accent: '#AB8BFF',
        warning: "#cc475a",
        
        dark: {
          text: "#d4d4d4",
          title: "#fff",
          background: "#252231",
          navBackground: "#201e2b",
          iconColor: "#9591a5",
          iconColorFocused: "#fff",
          uiBackground: "#2f2b3d",
          border: "#444444",
        },
        light: {
          text: "#4b495c",
          title: "#201e2b",
          background: "#e0dfe8",
          navBackground: "#e8e7ef",
          iconColor: "#686477",
          iconColorFocused: "#201e2b",
          uiBackground: "#d6d5e1",
          border: "#666666",
        }
      }
    },
  },
  plugins: [],
}