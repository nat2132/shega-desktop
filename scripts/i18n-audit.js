#!/usr/bin/env node
/**
 * i18n Key Audit Script — Phase 6.1
 * Validates that all translation keys exist in all 4 languages (en, am, om, ti).
 * Usage: node scripts/i18n-audit.js [--fix] [--output missing.json]
 */
const fs = require('fs');
const path = require('path');

const TRANSLATIONS_PATH = path.join(__dirname, '../src/renderer/src/i18n/translations.ts');
const LANGUAGES = ['en', 'am', 'om', 'ti'];

function extractKeys(obj, prefix = '') {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const subKey of extractKeys(v, fullKey)) keys.add(subKey);
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

function loadTranslations() {
  const content = fs.readFileSync(TRANSLATIONS_PATH, 'utf-8');
  // Extract the translations object from the TS file
  const match = content.match(/export const translations:\s*Record<string,\s*any>\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    // Fallback: try to find the object after "export const translations ="
    const match2 = content.match(/export const translations\s*=\s*(\{[\s\S]*?\});?\s*$/m);
    if (!match2) throw new Error('Could not parse translations object');
    return eval('(' + match2[1] + ')');
  }
  return eval('(' + match[1] + ')');
}

function audit() {
  const translations = loadTranslations();
  console.log('Loaded translations for languages:', Object.keys(translations).join(', '));

  const baseKeys = extractKeys(translations.en);
  console.log(`\nBase language (en) has ${baseKeys.size} keys`);

  const missing = {};
  let totalMissing = 0;

  for (const lang of LANGUAGES.slice(1)) {
    if (!translations[lang]) {
      console.error(`ERROR: Language "${lang}" not found in translations`);
      continue;
    }
    const langKeys = extractKeys(translations[lang]);
    const langMissing = [...baseKeys].filter(k => !langKeys.has(k));
    if (langMissing.length > 0) {
      missing[lang] = langMissing;
      totalMissing += langMissing.length;
      console.log(`  ${lang}: ${langMissing.length} missing keys`);
    } else {
      console.log(`  ${lang}: ✅ complete`);
    }
  }

  // Also check for extra keys in non-base languages
  for (const lang of LANGUAGES.slice(1)) {
    const langKeys = extractKeys(translations[lang]);
    const extra = [...langKeys].filter(k => !baseKeys.has(k));
    if (extra.length > 0) {
      console.log(`  ${lang}: ${extra.length} extra keys (not in en)`);
    }
  }

  console.log(`\nTotal missing keys across all languages: ${totalMissing}`);

  return { baseKeys, missing, totalMissing };
}

function findUsedKeys() {
  // Scan renderer source for t('key') patterns
  const srcDir = path.join(__dirname, '../src/renderer/src');
  const usedKeys = new Set();
  const keyRegex = /t\(['"`]([^'"`]+)['"`]\)/g;

  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'out', '.git'].includes(entry.name)) scanDir(full);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf-8');
        let match;
        while ((match = keyRegex.exec(content)) !== null) {
          usedKeys.add(match[1]);
        }
      }
    }
  }

  scanDir(srcDir);
  console.log(`\nFound ${usedKeys.size} unique translation keys used in source code`);
  return usedKeys;
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const outputArg = args.find(a => a.startsWith('--output='));
  const outputFile = outputArg ? path.resolve(outputArg.split('=')[1]) : null;

  const { baseKeys, missing, totalMissing } = audit();
  const usedKeys = findUsedKeys();

  // Find keys used in code but missing from translations
  const unusedInTranslations = [...usedKeys].filter(k => !baseKeys.has(k));
  if (unusedInTranslations.length > 0) {
    console.log(`\n⚠️  ${unusedInTranslations.length} keys used in code but MISSING from translations:`);
    for (const k of unusedInTranslations.slice(0, 20)) console.log(`   - ${k}`);
    if (unusedInTranslations.length > 20) console.log(`   ... and ${unusedInTranslations.length - 20} more`);
  }

  // Find keys in translations but never used in code
  const neverUsed = [...baseKeys].filter(k => !usedKeys.has(k));
  console.log(`\n📊 ${neverUsed.length} translation keys defined but never used in code`);

  // Write report before exit
  if (outputFile) {
    console.log(`\nDEBUG: Writing report to ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify({ missing, unusedInTranslations, neverUsed }, null, 2));
    console.log(`Report written to ${outputFile}`);
  } else {
    console.log('\nDEBUG: No outputFile specified');
  }

  // Exit code for CI: fail if any missing keys
  if (totalMissing > 0) {
    console.log('\n❌ AUDIT FAILED: Missing translation keys detected');
    process.exit(1);
  } else {
    console.log('\n✅ AUDIT PASSED: All languages have complete key coverage');
    process.exit(0);
  }
}

main();