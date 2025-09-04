/**
 * PostCSS configuration. Tailwind CSS uses PostCSS under the hood. The order
 * of the plugins matters: Tailwind should run before autoprefixer.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
