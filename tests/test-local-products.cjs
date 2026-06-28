// Smoke test for src/features/inventory/lib/local-products.ts.
// Pure-Node: reads the source as text and asserts structure. No esbuild /
// ts-node needed. Run: node tests/test-local-products.cjs

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.resolve(__dirname, '..', 'src', 'features', 'inventory', 'lib', 'local-products.ts'),
  'utf8',
);

const checks = [];

// 1) Has the expected public symbols.
checks.push(['export const LOCAL_PRODUCTS', /\bexport const LOCAL_PRODUCTS\b/.test(src)]);
checks.push(['export function searchLocalProducts', /\bexport function searchLocalProducts\b/.test(src)]);
checks.push(['export interface LocalProduct', /\bexport interface LocalProduct\b/.test(src)]);

// 2) Counts (parse `{ name: "...", category: "...", unit: "..." }` rows).
const rowRe = /\{\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*unit:\s*"([^"]+)"\s*\}/g;
const rows = [...src.matchAll(rowRe)];
checks.push(['49 product rows', rows.length === 49]);

// 3) All rows have non-empty fields and a recognized unit.
const validUnits = new Set(['kg', 'lt', 'units']);
const allHaveFields = rows.every((m) => m[1] && m[2] && m[3] && validUnits.has(m[3]));
checks.push(['all rows have non-empty name/category/unit', allHaveFields]);

// 4) No duplicate names.
const names = rows.map((m) => m[1]);
const unique = new Set(names);
checks.push(['all names unique', unique.size === names.length]);

// 5) Spot-check expected names.
const expected = ['Leche Entera', 'Huevos de Campo', 'Yogur Griego', 'Pan de Masa Madre', 'Hummus', 'Comida para Perro'];
for (const name of expected) {
  checks.push([`contains "${name}"`, names.includes(name)]);
}

// 6) Categories cover the 24 in add-item-dialog.
const categories = new Set(rows.map((m) => m[2]));
const expectedCats = [
  'Lácteos', 'Carne', 'Aves', 'Pescado', 'Verduras', 'Frutas', 'Granos',
  'Pasta', 'Pan', 'Condimentos', 'Aceites', 'Salsas', 'Especias', 'Hierbas',
  'Bebidas', 'Botanas', 'Congelados', 'Enlatados', 'Panadería',
  'Alternativas Lácteas', 'Comidas Preparadas', 'Bebé', 'Mascotas', 'Otros',
];
const allCatsCovered = expectedCats.every((c) => categories.has(c));
checks.push(['24 categories present in catalog (Spanish)', allCatsCovered]);

// 7) The search function uses case-insensitive substring.
checks.push(['searchLocalProducts is case-insensitive',
  /query\.trim\(\)\.toLowerCase\(\)/.test(src) &&
  /\.toLowerCase\(\)\.includes\(q\)/.test(src)
]);

// 8) Hardcoded limit at 20.
checks.push(['searchLocalProducts has a slice limit', /\.slice\(0,\s*(20|limit)\)/.test(src)]);
checks.push(['default limit is 20', /function searchLocalProducts\([^)]*limit\s*=\s*20\b/.test(src)]);

// 9) Returns [] for empty query.
checks.push(['searchLocalProducts returns [] for empty input', /if \(!q\) return \[\]/.test(src)]);

let passed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  ok  ' : '  FAIL').padEnd(7) + name);
  if (ok) passed++;
}
console.log(`\n${passed}/${checks.length} checks passed`);
process.exit(passed === checks.length ? 0 : 1);
