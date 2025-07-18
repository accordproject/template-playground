import { scopedPreflightStyles, isolateInsideOfContainer } from 'tailwindcss-scoped-preflight';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.twp', {
        except: '.no-twp',
      }),
    }),
  ],
}
