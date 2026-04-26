import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import { visualizer } from "rollup-plugin-visualizer";

// 🔥 THE BULLETPROOF ACCORD COMPATIBILITY PLUGIN
const accordCompatPlugin = () => ({
  name: 'accord-compat-plugin',
  transform(code, id) {
    // Fast path: skip files that don't need fixing
    if (!code.includes('Z_SYNC_FLUSH') && !code.includes('readdir') && !code.includes('readFile') && !code.includes('stat')) return null;

    let patchedCode = code;

    // 1. Fix Axios/Zlib compression constants crash
    patchedCode = patchedCode.replace(/\b([a-zA-Z0-9_$]+)(?:\.default)?\.constants\.Z_SYNC_FLUSH\b/g, '2');
    patchedCode = patchedCode.replace(/\b([a-zA-Z0-9_$]+)(?:\.default)?\.constants\.BROTLI_OPERATION_FLUSH\b/g, '1');
    patchedCode = patchedCode.replace(/\b([a-zA-Z0-9_$]+)(?:\.default)?\.constants\.BROTLI_OPERATION_FINISH\b/g, '2');

    // 2. Inject a safe helper function to avoid SyntaxErrors from parentheses
    const injectMock = `
      if (typeof window !== 'undefined' && !window.__getFs) {
        var dummyStat = {isDirectory:function(){return false},isFile:function(){return false}};
        window.__fsMock = {
          readdirSync: function(){return [];},
          readdir: function(p,o,cb){ var f = cb||o; if(typeof f==='function') f(null,[]); else return Promise.resolve([]); },
          readFileSync: function(){return "";},
          readFile: function(p,o,cb){ var f = cb||o; if(typeof f==='function') f(null,""); else return Promise.resolve(""); },
          existsSync: function(){return false;},
          statSync: function(){return dummyStat;},
          stat: function(p,o,cb){ var f = cb||o; if(typeof f==='function') f(null,dummyStat); else return Promise.resolve(dummyStat); },
          lstatSync: function(){return dummyStat;},
          lstat: function(p,o,cb){ var f = cb||o; if(typeof f==='function') f(null,dummyStat); else return Promise.resolve(dummyStat); },
          promises: { 
            readdir: function(){return Promise.resolve([]);}, 
            readFile: function(){return Promise.resolve("");},
            stat: function(){return Promise.resolve(dummyStat);},
            lstat: function(){return Promise.resolve(dummyStat);}
          }
        };
        window.__getFs = function(f) { return f || window.__fsMock; };
      }
      ; // <-- Safety semicolon for minified code
    `;

    patchedCode = injectMock + patchedCode;

    // 3. Carefully replace fs methods using the helper function
    const methods = ['readdirSync', 'readdir', 'readFileSync', 'readFile', 'existsSync', 'statSync', 'stat', 'lstatSync', 'lstat', 'promises'];
    methods.forEach(method => {
      const regex = new RegExp(`\\b([a-zA-Z0-9_$]+)\\.${method}\\b`, 'g');
      patchedCode = patchedCode.replace(regex, (match, variable) => {
        const ignoreList = ['super', 'this', 'exports', 'module', 'process', 'window', 'global'];
        if (ignoreList.includes(variable)) return match;
        return `window.__getFs(${variable}).${method}`;
      });
    });

    return patchedCode;
  }
});

// ✅ VITE CONFIG (THIS RUNS YOUR APP)
const viteConfig = defineViteConfig({
  plugins: [
    accordCompatPlugin(), // <-- Safe, bulletproof interceptor
    nodePolyfills(),
    react(),
    visualizer({
      emitFile: true,
      filename: "stats.html",
    }),
  ],
  optimizeDeps: {
    include: ["immer"],
    needsInterop: ['@accordproject/template-engine'],
  },
  resolve: {
    alias: {
      'zlib': '/src/zlib-patch.js',
    },
  },
});

// ✅ VITEST CONFIG (TESTING ONLY)
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/utils/testing/setup.ts",
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    server: {
      deps: {
        inline: ["monaco-editor"],
      },
    },
  },
  resolve: {
    alias: {
      "monaco-editor": "monaco-editor/esm/vs/editor/editor.api",
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);