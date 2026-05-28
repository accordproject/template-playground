#!/usr/bin/env node
/*
 * Compute a canonical content hash for each sample in src/samples/ and
 * embed both the hash and a signed Verifiable Credential back into the
 * sample file as additional named exports.
 *
 * Run with:  node scripts/sign-samples.mjs
 *
 * The signing key (Ed25519, encrypted PKCS#8 PEM) is generated on first
 * run under scripts/.keys/ and reused on subsequent runs so the issuer
 * DID stays stable across regenerations.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import canonicalize from 'canonicalize';
import { loadSigningKey, signCredential, deriveDidKey } from 'vc-signer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(PROJECT_ROOT, 'src', 'samples');
const KEY_DIR = path.join(__dirname, '.keys');
const KEY_PEM_PATH = path.join(KEY_DIR, 'signer.pem');
const KEY_PASS_PATH = path.join(KEY_DIR, 'signer.pass');

const BEGIN_MARK = '// --- BEGIN VC-SIGNED BLOCK (generated) ---';
const END_MARK = '// --- END VC-SIGNED BLOCK (generated) ---';

// Only these samples carry an embedded canonical hash + signed VC.
// The rest are restored to a plain `export { NAME, MODEL, DATA, TEMPLATE };`
// and load with isVerified=false at runtime.
const SAMPLES_TO_SIGN = new Set([
  'helloworld.ts',
  'employmentOffer.ts',
  'nda.ts',
]);

async function ensureKeyMaterial() {
  await fs.mkdir(KEY_DIR, { recursive: true });
  try {
    const pem = await fs.readFile(KEY_PEM_PATH, 'utf8');
    const passphrase = (await fs.readFile(KEY_PASS_PATH, 'utf8')).trim();
    return { pem, passphrase, generated: false };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const passphrase = crypto.randomBytes(24).toString('hex');
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = privateKey.export({
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase,
  });
  await fs.writeFile(KEY_PEM_PATH, pem, { mode: 0o600 });
  await fs.writeFile(KEY_PASS_PATH, passphrase + '\n', { mode: 0o600 });
  return { pem, passphrase, generated: true };
}

function stripGeneratedBlock(src) {
  const beginIdx = src.indexOf(BEGIN_MARK);
  if (beginIdx < 0) return src;
  const endIdx = src.indexOf(END_MARK, beginIdx);
  if (endIdx < 0) throw new Error('malformed generated block (missing end marker)');
  return src.slice(0, beginIdx).replace(/\s+$/, '') + src.slice(endIdx + END_MARK.length);
}

function stripPrimaryExportClause(src) {
  return src.replace(/^[ \t]*export\s*\{[^}]*\}\s*;?[ \t]*\r?\n?/m, '');
}

function extractExistingHash(src) {
  const m = src.match(/const\s+HASH\s*=\s*'([0-9a-f]{64})'/);
  return m ? m[1] : null;
}

function withSyntheticExport(baseSource) {
  return baseSource.replace(/\s+$/, '') +
    '\n\nexport { NAME, MODEL, DATA, TEMPLATE };\n';
}

async function loadSampleExports(filePath, baseSource) {
  const importable = withSyntheticExport(baseSource);
  const b64 = Buffer.from(importable, 'utf8').toString('base64');
  const mod = await import(`data:text/javascript;base64,${b64}`);
  const { NAME, MODEL, TEMPLATE, DATA } = mod;
  if (typeof NAME !== 'string' || typeof MODEL !== 'string' ||
      typeof TEMPLATE !== 'string' || typeof DATA !== 'object' || DATA === null) {
    throw new Error(
      `${path.basename(filePath)} is missing one or more required exports (NAME, MODEL, TEMPLATE, DATA)`,
    );
  }
  return { NAME, MODEL, TEMPLATE, DATA };
}

function canonicalHashOf({ NAME, MODEL, TEMPLATE, DATA }) {
  const jcs = canonicalize({ name: NAME, model: MODEL, template: TEMPLATE, data: DATA });
  return crypto.createHash('sha256').update(jcs).digest('hex');
}

function templateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatGeneratedBlock(hash, vc) {
  const vcLiteral = JSON.stringify(vc, null, 2);
  return [
    BEGIN_MARK,
    `const HASH = '${hash}';`,
    `const VC = ${vcLiteral};`,
    '',
    'export { NAME, MODEL, DATA, TEMPLATE, HASH, VC };',
    END_MARK,
    '',
  ].join('\n');
}

async function cleanSample(filePath) {
  const original = await fs.readFile(filePath, 'utf8');
  const withoutBlock = stripGeneratedBlock(original);
  const baseSource = stripPrimaryExportClause(withoutBlock);
  const next = baseSource.replace(/\s+$/, '') +
    '\n\nexport { NAME, MODEL, DATA, TEMPLATE };\n';
  if (next === original) return { status: 'unchanged' };
  await fs.writeFile(filePath, next);
  return { status: 'cleaned' };
}

async function processSample(filePath, keyInfo) {
  const original = await fs.readFile(filePath, 'utf8');
  const existingHash = extractExistingHash(original);

  const withoutBlock = stripGeneratedBlock(original);
  const baseSource = stripPrimaryExportClause(withoutBlock);

  const exports = await loadSampleExports(filePath, baseSource);
  const hash = canonicalHashOf(exports);

  if (existingHash === hash) {
    return { name: exports.NAME, hash, status: 'unchanged' };
  }

  const vc = await signCredential({
    type: ['VerifiableCredential', 'TemplateAuthorshipCredential'],
    subject: {
      id: `ap-template:${templateSlug(exports.NAME)}`,
      templateHash: hash,
      templateName: exports.NAME,
    },
    signer: { keyInfo },
  });

  const trailer = (baseSource.endsWith('\n') ? '\n' : '\n\n') + formatGeneratedBlock(hash, vc);
  const next = baseSource.replace(/\s+$/, '') + trailer;
  await fs.writeFile(filePath, next);
  return { name: exports.NAME, hash, status: existingHash ? 'updated' : 'signed' };
}

async function main() {
  const { pem, passphrase, generated } = await ensureKeyMaterial();
  if (generated) {
    console.log(`Generated new Ed25519 signing key at ${path.relative(PROJECT_ROOT, KEY_PEM_PATH)}`);
  }

  const keyInfo = await loadSigningKey({ privateKeyPem: { pem, passphrase } });
  const { did } = deriveDidKey(keyInfo.publicJwk);
  console.log(`Signing as ${did}\n`);

  const entries = (await fs.readdir(SAMPLES_DIR))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort()
    .map((f) => path.join(SAMPLES_DIR, f));

  const summary = { signed: 0, updated: 0, cleaned: 0, unchanged: 0 };
  for (const file of entries) {
    const basename = path.basename(file);
    if (SAMPLES_TO_SIGN.has(basename)) {
      const { name, hash, status } = await processSample(file, keyInfo);
      summary[status] += 1;
      console.log(`  [${status.padEnd(9)}] ${basename.padEnd(24)} ${name.padEnd(36)} ${hash.slice(0, 16)}…`);
    } else {
      const { status } = await cleanSample(file);
      summary[status] += 1;
      console.log(`  [${status.padEnd(9)}] ${basename}`);
    }
  }

  console.log(
    `\nDone: ${summary.signed} signed, ${summary.updated} updated, ${summary.cleaned} cleaned, ${summary.unchanged} unchanged.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
