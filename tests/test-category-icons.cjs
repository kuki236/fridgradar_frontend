// Smoke test for src/features/inventory/lib/category-icons.ts.
// Asserts the 24 categories each have an icon + bg/fg pair, and that
// every category used by add-item-dialog is covered. Also asserts that
// the inventory components no longer use <img> for product visuals.
// Run: node tests/test-category-icons.cjs

const fs = require('fs');
const path = require('path');

const iconsSrc = fs.readFileSync(
  path.resolve(__dirname, '..', 'src', 'features', 'inventory', 'lib', 'category-icons.ts'),
  'utf8',
);
const dialogSrc = fs.readFileSync(
  path.resolve(__dirname, '..', 'src', 'features', 'inventory', 'components', 'add-item-dialog.tsx'),
  'utf8',
);

const checks = [];

// Public surface.
checks.push(['exports CATEGORY_STYLES', /\bexport const CATEGORY_STYLES\b/.test(iconsSrc)]);
checks.push(['exports FALLBACK_STYLE', /\bexport const FALLBACK_STYLE\b/.test(iconsSrc)]);
checks.push(['exports getCategoryStyle', /\bexport function getCategoryStyle\b/.test(iconsSrc)]);
checks.push(['exports CategoryStyle type', /\bexport interface CategoryStyle\b/.test(iconsSrc)]);

// Fallback uses Lucide.
checks.push(['FALLBACK_STYLE has icon', /FALLBACK_STYLE[^}]+icon:\s*\w+/.test(iconsSrc)]);

// Each of the 24 categories from add-item-dialog has a row in CATEGORY_STYLES.
const CATEGORIES = [
  'Lácteos', 'Carne', 'Aves', 'Pescado', 'Verduras', 'Frutas', 'Granos',
  'Pasta', 'Pan', 'Condimentos', 'Aceites', 'Salsas', 'Especias', 'Hierbas',
  'Bebidas', 'Botanas', 'Congelados', 'Enlatados', 'Panadería',
  'Alternativas Lácteas', 'Comidas Preparadas', 'Bebé', 'Mascotas', 'Otros',
];
for (const cat of CATEGORIES) {
  // Source has "<cat>": { icon: ... — match the literal `"<cat>":` then the icon field.
  const re = new RegExp(`['"]?${cat.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['"]?\\s*:\\s*\\{[^{}]*icon:`);
  checks.push([`CATEGORY_STYLES has "${cat}"`, re.test(iconsSrc)]);
}

// Every CATEGORY_STYLES entry has bg + fg classes (Tailwind full strings).
const entryRe = /^\s*"[^"]+":\s*\{\s*icon:[^}]+bg:\s*"[^"]+",\s*fg:\s*"[^"]+"/gm;
const entries = iconsSrc.match(entryRe) || [];
checks.push(['>= 24 CATEGORY_STYLES entries with icon+bg+fg', entries.length >= 24]);

// No <img> tags anywhere in the inventory components.
const inventoryFiles = [
  'src/features/inventory/components/inventory-item-card.tsx',
  'src/features/inventory/components/fridge-view.tsx',
  'src/features/inventory/components/add-item-dialog.tsx',
  'src/features/inventory/components/edit-item-dialog.tsx',
];
for (const f of inventoryFiles) {
  const text = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
  const hasImg = /<img\b/.test(text);
  checks.push([`no <img> in ${path.basename(f)}`, !hasImg]);
}

// productsApi / image_url imports gone from inventory files.
for (const f of inventoryFiles) {
  const text = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
  checks.push([`${path.basename(f)} no productsApi import`, !/from\s+['"][^'"]*products\.service['"]/.test(text)]);
  checks.push([`${path.basename(f)} no image_url field in local types`,
    !/imageUrl\??:\s*string/.test(text)
  ]);
}

// products.service.ts is gone.
const productsServicePath = path.resolve(
  __dirname, '..', 'src', 'features', 'inventory', 'infrastructure', 'products.service.ts',
);
checks.push(['products.service.ts deleted', !fs.existsSync(productsServicePath)]);

// add-item-dialog uses CategoryIcon and searchLocalProducts.
checks.push(['add-item-dialog imports CategoryIcon', /from\s+['"]@\/features\/inventory\/components\/category-icon['"]/.test(dialogSrc)]);
checks.push(['add-item-dialog imports searchLocalProducts', /from\s+['"]@\/features\/inventory\/lib\/local-products['"]/.test(dialogSrc)]);
checks.push(['add-item-dialog no longer imports productsApi', !/productsApi/.test(dialogSrc)]);

let passed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  ok  ' : '  FAIL').padEnd(7) + name);
  if (ok) passed++;
}
console.log(`\n${passed}/${checks.length} checks passed`);
process.exit(passed === checks.length ? 0 : 1);
