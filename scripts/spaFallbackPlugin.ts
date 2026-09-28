import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { spaFallbackIndexPaths } from "../src/utils/spaRoutes";

/**
 * Copy `dist/index.html` to each known SPA route so S3 website hosting
 * serves `/learn/...` with HTTP 200. `public/_redirects` is left unchanged
 * so Netlify deploy previews keep working.
 */
export function spaFallbackCopies(): Plugin {
  let outDir = "dist";

  return {
    name: "spa-fallback-copies",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) {
        throw new Error(`SPA fallback: missing ${indexPath}`);
      }

      const html = fs.readFileSync(indexPath, "utf8");
      for (const relative of spaFallbackIndexPaths()) {
        const dest = path.join(outDir, relative);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, html);
      }
    },
  };
}
