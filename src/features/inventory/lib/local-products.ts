/**
 * Local product catalog (espejo del seed en `fridgeradar_backend/scripts/reset_db.py`).
 *
 * El backend no expone un endpoint público "lista de productos", así que el
 * search del AddItemDialog corre contra este array en cliente. Si el usuario
 * quiere un producto fuera del catálogo, tiene la opción "Add as custom
 * product" que sigue funcionando.
 *
 * Si agregás un producto al `PRODUCTS` del seed, replicá acá para que el
 * search del FE lo encuentre.
 */

export interface LocalProduct {
  name: string;
  category: string;
  unit: string;
}

export const LOCAL_PRODUCTS: LocalProduct[] = [
  { name: "Leche Entera",        category: "Lácteos",            unit: "lt" },
  { name: "Queso Cheddar",       category: "Lácteos",            unit: "kg" },
  { name: "Yogur Griego",         category: "Lácteos",            unit: "kg" },
  { name: "Bistec de Res",        category: "Carne",              unit: "kg" },
  { name: "Carne Molida",         category: "Carne",              unit: "kg" },
  { name: "Pechuga de Pollo",     category: "Aves",               unit: "kg" },
  { name: "Huevos de Campo",      category: "Aves",               unit: "units" },
  { name: "Filete de Salmón",     category: "Pescado",            unit: "kg" },
  { name: "Atún en Lata",         category: "Pescado",            unit: "units" },
  { name: "Espinaca Fresca",      category: "Verduras",           unit: "kg" },
  { name: "Tomates Roma",         category: "Verduras",           unit: "kg" },
  { name: "Plátanos",             category: "Frutas",             unit: "units" },
  { name: "Manzanas Rojas",       category: "Frutas",             unit: "units" },
  { name: "Arroz Blanco",         category: "Granos",             unit: "kg" },
  { name: "Quinoa",               category: "Granos",             unit: "kg" },
  { name: "Espagueti",            category: "Pasta",              unit: "kg" },
  { name: "Penne",                category: "Pasta",              unit: "kg" },
  { name: "Pan Integral",         category: "Pan",                unit: "units" },
  { name: "Pan de Masa Madre",    category: "Pan",                unit: "units" },
  { name: "Ketchup",              category: "Condimentos",        unit: "lt" },
  { name: "Mayonesa",             category: "Condimentos",        unit: "kg" },
  { name: "Aceite de Oliva",      category: "Aceites",            unit: "lt" },
  { name: "Aceite Vegetal",       category: "Aceites",            unit: "lt" },
  { name: "Salsa de Tomate",      category: "Salsas",             unit: "lt" },
  { name: "Salsa de Soja",        category: "Salsas",             unit: "lt" },
  { name: "Pimienta Negra",       category: "Especias",           unit: "kg" },
  { name: "Pimentón",             category: "Especias",           unit: "kg" },
  { name: "Albahaca Fresca",      category: "Hierbas",            unit: "kg" },
  { name: "Cilantro",             category: "Hierbas",            unit: "kg" },
  { name: "Jugo de Naranja",      category: "Bebidas",            unit: "lt" },
  { name: "Agua con Gas",         category: "Bebidas",            unit: "lt" },
  { name: "Papas Fritas",         category: "Botanas",            unit: "kg" },
  { name: "Chocolate Negro",      category: "Botanas",            unit: "kg" },
  { name: "Arvejas Congeladas",   category: "Congelados",         unit: "kg" },
  { name: "Pizza Congelada",      category: "Congelados",         unit: "units" },
  { name: "Frijoles Negros",      category: "Enlatados",          unit: "kg" },
  { name: "Maíz en Lata",         category: "Enlatados",          unit: "kg" },
  { name: "Croissant",            category: "Panadería",          unit: "units" },
  { name: "Bagels",               category: "Panadería",          unit: "units" },
  { name: "Leche de Almendras",   category: "Alternativas Lácteas",unit: "lt" },
  { name: "Bloque de Tofu",       category: "Alternativas Lácteas",unit: "kg" },
  { name: "Hummus",               category: "Comidas Preparadas", unit: "kg" },
  { name: "Sopa Lista",           category: "Comidas Preparadas", unit: "lt" },
  { name: "Fórmula Infantil",     category: "Bebé",               unit: "kg" },
  { name: "Cereal para Bebé",     category: "Bebé",               unit: "kg" },
  { name: "Comida para Perro",    category: "Mascotas",           unit: "kg" },
  { name: "Snacks para Gato",     category: "Mascotas",           unit: "kg" },
  { name: "Sal",                  category: "Otros",              unit: "kg" },
  { name: "Azúcar",               category: "Otros",              unit: "kg" },
];

export function searchLocalProducts(query: string, limit = 20): LocalProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return LOCAL_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, limit);
}
