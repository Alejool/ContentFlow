#!/usr/bin/env node
/**
 * Locale parity checker — single source of truth guard.
 *
 * Verifies that every language under resources/js/locales has:
 *   1. the same set of per-domain files,
 *   2. the same set of translation keys,
 *   3. the same key order and object hierarchy.
 *
 * Reference language is the first in LANGS (en). Any other language must match
 * it exactly. Exits non-zero on drift so it can gate CI / pre-commit.
 *
 * Usage: node scripts/check-locales.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const LOCALES = join(ROOT, 'resources/js/locales');
const LANGS = readdirSync(LOCALES).filter((d) => {
  try {
    return readdirSync(join(LOCALES, d)).length >= 0;
  } catch {
    return false;
  }
});
const REF = LANGS.includes('en') ? 'en' : LANGS[0];

function listFiles(lang) {
  return readdirSync(join(LOCALES, lang))
    .filter((f) => f.endsWith('.json') && f !== 'translations.json')
    .sort();
}

/** Ordered list of "a.b.c" leaf paths, preserving file + key declaration order. */
function orderedKeys(lang) {
  const out = [];
  for (const file of listFiles(lang)) {
    const raw = readFileSync(join(LOCALES, lang, file), 'utf-8').replace(/^﻿/, '');
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      out.push(`__PARSE_ERROR__:${file}:${e.message}`);
      continue;
    }
    walk(obj, file + '::', out);
  }
  return out;
}
function walk(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix + k;
    if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, key + '.', out);
    else out.push(key);
  }
}

let problems = 0;
const refFiles = listFiles(REF);
const refKeys = orderedKeys(REF);

console.log(`Reference language: ${REF} (${refKeys.length} keys, ${refFiles.length} files)\n`);

for (const lang of LANGS) {
  if (lang === REF) continue;
  const files = listFiles(lang);
  const keys = orderedKeys(lang);

  const missFiles = refFiles.filter((f) => !files.includes(f));
  const extraFiles = files.filter((f) => !refFiles.includes(f));
  const refSet = new Set(refKeys);
  const set = new Set(keys);
  const missKeys = refKeys.filter((k) => !set.has(k));
  const extraKeys = keys.filter((k) => !refSet.has(k));

  // order mismatch = same key sets but different sequence
  const commonRef = refKeys.filter((k) => set.has(k));
  const commonLang = keys.filter((k) => refSet.has(k));
  const orderOk = commonRef.join('|') === commonLang.join('|');

  const ok = !missFiles.length && !extraFiles.length && !missKeys.length && !extraKeys.length && orderOk;
  console.log(`${ok ? 'OK  ' : 'DIFF'} ${lang}: ${keys.length} keys, ${files.length} files`);
  if (missFiles.length) console.log(`  missing files: ${missFiles.join(', ')}`);
  if (extraFiles.length) console.log(`  extra files:   ${extraFiles.join(', ')}`);
  if (missKeys.length) {
    console.log(`  missing keys (${missKeys.length}):`);
    missKeys.forEach((k) => console.log(`    - ${k}`));
  }
  if (extraKeys.length) {
    console.log(`  extra keys (${extraKeys.length}):`);
    extraKeys.forEach((k) => console.log(`    + ${k}`));
  }
  if (!missKeys.length && !extraKeys.length && !orderOk) {
    console.log('  key ORDER differs from reference (same keys, different sequence)');
  }
  if (!ok) problems++;
  console.log('');
}

if (problems) {
  console.error(`✖ Locale parity check failed for ${problems} language(s).`);
  process.exit(1);
}
console.log('✓ All languages are in parity with the reference.');
