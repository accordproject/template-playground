
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isSensitiveFile,
  scanContent,
  scanFiles,
} from '../check-config-integrity.mjs';

describe('isSensitiveFile', () => {
  it('recognizes JavaScript and TypeScript config files', () => {
    assert.equal(isSensitiveFile('postcss.config.js'), true);
    assert.equal(isSensitiveFile('vite.config.ts'), true);
    assert.equal(isSensitiveFile('playwright.config.ts'), true);
  });

  it('recognizes scripts and GitHub workflows', () => {
    assert.equal(isSensitiveFile('scripts/precompress.mjs'), true);
    assert.equal(isSensitiveFile('.github/workflows/pr-check.yml'), true);
  });

  it('ignores unrelated application files', () => {
    assert.equal(isSensitiveFile('src/components/App.tsx'), false);
    assert.equal(isSensitiveFile('README.md'), false);
  });

  it('recognizes additional build and package configuration files', () => {
    assert.equal(isSensitiveFile('package.json'), true);
    assert.equal(isSensitiveFile('.npmrc'), true);
    assert.equal(isSensitiveFile('vite-plugin-rebuild-worker.ts'), true);
    assert.equal(isSensitiveFile('scripts/build.ts'), true);
    assert.equal(isSensitiveFile('scripts/nested/build.mjs'), true);
    assert.equal(isSensitiveFile('tsconfig.node.json'), true);
  });

  it('supports Windows-style paths', () => {
    assert.equal(isSensitiveFile('scripts\\build.mjs'), true);
    assert.equal(isSensitiveFile('.github\\workflows\\pr-check.yml'), true);
  });

  it('ignores ordinary source and documentation files', () => {
    assert.equal(isSensitiveFile('src\\components\\App.tsx'), false);
    assert.equal(isSensitiveFile('README.md'), false);
  });
});

describe('scanContent', () => {
  it('does not flag ordinary configuration content', () => {
    const content = [
      'module.exports = {',
      '  plugins: {',
      '    tailwindcss: {},',
      '    autoprefixer: {},',
      '  },',
      '};',
    ].join('\n');

    assert.deepEqual(scanContent(content, 'postcss.config.js'), []);
  });

  it('detects unusually long lines', () => {
    const content = `const value = "${'a'.repeat(210)}";`;
    const findings = scanContent(content, 'vite.config.ts');

    assert.ok(findings.some((f) => f.rule === 'long-line'));
    assert.equal(findings[0].line, 1);
  });

  it('detects content after an unusually long whitespace run', () => {
    const content = `const value = ${' '.repeat(45)}'example';`;
    const findings = scanContent(content, 'postcss.config.js');

    assert.ok(findings.some((f) => f.rule === 'suspicious-whitespace'));
  });

  it('detects unexpected control characters', () => {
    const findings = scanContent(
      'const value = "safe";\u0001',
      'vite.config.ts'
    );

    assert.ok(findings.some((f) => f.rule === 'control-character'));
  });

  it('does not flag ordinary indentation', () => {
    const findings = scanContent(
      '    const value = "normal";',
      'vite.config.ts'
    );

    assert.deepEqual(findings, []);
  });

  it('does not flag a long line as suspicious whitespace without a whitespace run', () => {
    const content = `const value = "${'a'.repeat(210)}";`;
    const findings = scanContent(content, 'vite.config.ts');

    assert.equal(
      findings.some((f) => f.rule === 'suspicious-whitespace'),
      false
    );
  });

  it('supports custom detection thresholds', () => {
    const findings = scanContent(
      'const value = "this is a test";',
      'vite.config.ts',
      { maxLineLength: 10, suspiciousWhitespace: 40 }
    );

    assert.ok(findings.some((f) => f.rule === 'long-line'));
  });

  it('reports the correct line number for suspicious content', () => {
    const content = [
      'module.exports = {',
      '  plugins: {},',
      `const value = ${' '.repeat(45)}'example';`,
    ].join('\n');

    const findings = scanContent(content, 'postcss.config.js');
    const finding = findings.find(
      (f) => f.rule === 'suspicious-whitespace'
    );

    assert.equal(finding.line, 3);
  });

  it('detects code hidden after a long whitespace run in a config file', () => {
    const content = [
      'module.exports = {',
      '  plugins: {},',
      `};${' '.repeat(100)}const injected = "synthetic-test";`,
    ].join('\n');

    const findings = scanContent(content, 'postcss.config.js');

    assert.ok(findings.some((f) => f.rule === 'suspicious-whitespace'));
  });

  it('detects content hidden after tabs', () => {
    const content = `};${'\t'.repeat(45)}const injected = "test";`;
    const findings = scanContent(content, 'postcss.config.js');

    assert.ok(findings.some((f) => f.rule === 'suspicious-whitespace'));
  });

  it('detects hidden content on the final line without a newline', () => {
    const content = [
      'module.exports = {};',
      `};${' '.repeat(45)}const injected = "test";`,
    ].join('\n');

    const findings = scanContent(content, 'postcss.config.js');
    const finding = findings.find(
      (f) => f.rule === 'suspicious-whitespace'
    );

    assert.equal(finding.line, 2);
  });
  it('does not flag lines at the maximum length threshold', () => {
  const content = 'a'.repeat(200);
  const findings = scanContent(content, 'vite.config.ts');

  assert.equal(findings.some((f) => f.rule === 'long-line'), false);
});

it('detects lines exceeding the maximum length threshold by one character', () => {
  const content = 'a'.repeat(201);
  const findings = scanContent(content, 'vite.config.ts');

  assert.ok(findings.some((f) => f.rule === 'long-line'));
});

it('does not flag whitespace runs below the suspicious threshold', () => {
  const content = `};${' '.repeat(39)}const value = "safe";`;
  const findings = scanContent(content, 'postcss.config.js');

  assert.equal(
    findings.some((f) => f.rule === 'suspicious-whitespace'),
    false
  );
});
});

describe('scanFiles', () => {
  it('scans sensitive files and ignores unrelated files', () => {
    const files = [
      'postcss.config.js',
      'src/components/App.tsx',
    ];

    const findings = scanFiles(files, (file) => {
      if (file === 'postcss.config.js') {
        return 'module.exports = {};';
      }

      throw new Error('Unrelated file should not be read');
    });

    assert.deepEqual(findings, []);
  });

  it('reports files that cannot be read', () => {
    const findings = scanFiles(
      ['postcss.config.js'],
      () => {
        throw new Error('Permission denied');
      }
    );

    assert.equal(findings.length, 1);
    assert.equal(findings[0].rule, 'file-read-error');
    assert.equal(findings[0].file, 'postcss.config.js');
  });
});
