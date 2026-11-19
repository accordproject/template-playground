
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_THRESHOLDS = {
  maxLineLength: 200,
  suspiciousWhitespace: 40,
};


export function isSensitiveFile(file) {
  const normalized = file.replace(/\\/g, '/');

  return (
    /(^|\/)[^/]+\.config\.(js|cjs|mjs|ts|cts|mts)$/.test(normalized) ||
    /(^|\/)tsconfig[^/]*\.json$/.test(normalized) ||
    /^scripts\/.*\.(js|mjs|cjs|ts|mts|cts)$/.test(normalized) ||
    /^\.github\/workflows\/.*\.ya?ml$/.test(normalized) ||
    /^vite-plugin-.*\.(js|mjs|cjs|ts|mts|cts)$/.test(normalized) ||
    /(^|\/)package\.json$/.test(normalized) ||
    /(^|\/)\.npmrc$/.test(normalized)
  );
}


export function scanContent(content, file, thresholds = DEFAULT_THRESHOLDS) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.length > thresholds.maxLineLength) {
      findings.push({
        file,
        line: lineNumber,
        rule: 'long-line',
        message: `Line exceeds ${thresholds.maxLineLength} characters`,
      });
    }

    if (new RegExp(`[ \\t]{${thresholds.suspiciousWhitespace},}\\S`).test(line)) {
      findings.push({
        file,
        line: lineNumber,
        rule: 'suspicious-whitespace',
        message: 'Non-whitespace content follows an unusually long whitespace run',
      });
    }

    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        rule: 'control-character',
        message: 'Unexpected control character detected',
      });
    }
  });

  return findings;
}
export function scanFiles(files, readFile = readFileSync) {
  return files
    .filter(isSensitiveFile)
    .flatMap((file) => {
      try {
        return scanContent(readFile(file, 'utf8'), file);
      } catch (error) {
        return [{
          file,
          line: 0,
          rule: 'file-read-error',
          message: `Unable to read file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }];
      }
    });
}


export function getTrackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
    .filter(existsSync);
}

// This heuristic check flags suspicious formatting patterns.
// It is not a malware detector or a security boundary.
export function runScan() {
  const findings = scanFiles(getTrackedFiles());

  if (findings.length === 0) {
    console.log('Configuration integrity check passed.');
    return 0;
  }

  console.error(`Found ${findings.length} potential issue(s):`);

  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`
    );
  }

  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runScan();
}
