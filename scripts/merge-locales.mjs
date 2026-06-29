#!/usr/bin/env node
/**
 * Merges per-domain locale JSON files into a single translations.json per language.
 * Run after adding/modifying any locale file: npm run locales:merge
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const LANGS = ['es', 'en'];
// Keys that stay nested (not spread at root level)
const NESTED = new Set(['portal', 'twoFactor', 'formats']);

for (const lang of LANGS) {
  const dir = join(ROOT, 'resources/js/locales', lang);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'translations.json')
    .sort();

  const merged = {};
  for (const file of files) {
    const name = basename(file, '.json');
    const raw = readFileSync(join(dir, file), 'utf-8').replace(/^﻿/, '');
    const obj = JSON.parse(raw);
    if (NESTED.has(name)) {
      merged[name] = obj;
    } else {
      Object.assign(merged, obj);
    }
  }

  const out = join(dir, 'translations.json');
  writeFileSync(out, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`${lang}: ${files.length} files -> translations.json`);
}
