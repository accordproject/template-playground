/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Writes a `.br` and a `.gz` sibling for every JS and CSS file in dist/assets.
//
// CloudFront only compresses objects up to 10 MB on the fly, and several of our
// vendor chunks are larger than that, so they were served raw. Uploading
// pre-compressed copies with a Content-Encoding header removes the size limit;
// the viewer-request function in deploy/cloudfront/compressed-assets.js picks
// the right copy from the viewer's Accept-Encoding header.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants } from "node:zlib";

const brotli = promisify(brotliCompress);
const gz = promisify(gzip);

const dir = process.argv[2] ?? "dist/assets";
const files = (await readdir(dir)).filter((f) => /\.(js|css)$/.test(f));

let raw = 0;
let br = 0;
await Promise.all(
  files.map(async (file) => {
    const path = join(dir, file);
    const source = await readFile(path);
    const [brBody, gzBody] = await Promise.all([
      brotli(source, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
          [constants.BROTLI_PARAM_SIZE_HINT]: source.length,
        },
      }),
      gz(source, { level: 9 }),
    ]);
    await writeFile(`${path}.br`, brBody);
    await writeFile(`${path}.gz`, gzBody);
    raw += source.length;
    br += brBody.length;
  }),
);

const mb = (n) => (n / 1e6).toFixed(2);
console.log(`precompressed ${files.length} files: ${mb(raw)} MB raw -> ${mb(br)} MB brotli`);
