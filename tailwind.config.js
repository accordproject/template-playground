import { scopedPreflightStyles, isolateInsideOfContainer } from 'tailwindcss-scoped-preflight';
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.twp', {
        except: '.no-twp',
      }),
    }),
  ],
}
