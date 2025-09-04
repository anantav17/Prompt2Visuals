/**
 * Tailwind CSS configuration.
 *
 * The `content` array lists the files Tailwind should scan for class names.
 * We include everything under `src/` so that Tailwind can tree-shake unused
 * styles from production builds. Feel free to extend the theme or add plugins
 * as your design evolves.
 */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
