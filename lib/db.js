import { neon } from '@neondatabase/serverless';

function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please connect a Neon/Vercel Postgres database.');
  }
  return neon(process.env.DATABASE_URL);
}

// ============================================
// SCHEMA MIGRATION
// ============================================
export async function ensureTables() {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      budget_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      estimated_price NUMERIC(15,2) DEFAULT 0,
      final_price NUMERIC(15,2) DEFAULT 0,
      priority VARCHAR(20) DEFAULT 'Medium',
      status VARCHAR(20) DEFAULT 'Planned',
      purchase_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      detail TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Seed default settings if not exist
  await sql`
    INSERT INTO app_settings (key, value)
    VALUES
      ('project_name', 'MoveBudget'),
      ('currency', 'IDR'),
      ('currency_symbol', 'Rp'),
      ('budget_warning_threshold', '80')
    ON CONFLICT (key) DO NOTHING
  `;
}

// ============================================
// CATEGORIES
// ============================================
export async function getCategories() {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      c.id,
      c.name,
      c.budget_limit,
      COALESCE(SUM(i.final_price), 0) AS total_spent
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id, c.name, c.budget_limit
    ORDER BY c.id
  `;
  return rows.map(r => ({
    ...r,
    budget_limit: Number(r.budget_limit),
    total_spent: Number(r.total_spent),
    remaining_budget: Number(r.budget_limit) - Number(r.total_spent),
  }));
}

export async function createCategory(name, budgetLimit) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO categories (name, budget_limit)
    VALUES (${name}, ${budgetLimit})
    RETURNING *
  `;
  return rows[0];
}

export async function updateCategory(id, name, budgetLimit) {
  const sql = getSQL();
  const rows = await sql`
    UPDATE categories SET name = ${name}, budget_limit = ${budgetLimit}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteCategory(id) {
  const sql = getSQL();
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// ============================================
// ITEMS
// ============================================
export async function getItems(filters = {}) {
  const sql = getSQL();
  const { category_id, priority, status } = filters;

  // Build query - we handle filters in JS since neon tagged template
  // doesn't easily support optional WHERE clauses
  let rows = await sql`
    SELECT
      i.*,
      c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    ORDER BY i.id DESC
  `;

  // Apply filters
  if (category_id) rows = rows.filter(r => r.category_id === Number(category_id));
  if (priority) rows = rows.filter(r => r.priority === priority);
  if (status) rows = rows.filter(r => r.status === status);

  return rows.map(r => ({
    ...r,
    estimated_price: Number(r.estimated_price),
    final_price: Number(r.final_price),
    purchase_date: r.purchase_date ? new Date(r.purchase_date).toISOString().split('T')[0] : null,
  }));
}

export async function createItem(data) {
  const sql = getSQL();
  const { name, category_id, estimated_price, final_price, priority, status, purchase_date, notes } = data;
  const rows = await sql`
    INSERT INTO items (name, category_id, estimated_price, final_price, priority, status, purchase_date, notes)
    VALUES (${name}, ${category_id}, ${estimated_price || 0}, ${final_price || 0}, ${priority || 'Medium'}, ${status || 'Planned'}, ${purchase_date || null}, ${notes || ''})
    RETURNING *
  `;
  return rows[0];
}

export async function updateItem(id, data) {
  const sql = getSQL();
  const { name, category_id, estimated_price, final_price, priority, status, purchase_date, notes } = data;
  const rows = await sql`
    UPDATE items SET
      name = ${name},
      category_id = ${category_id},
      estimated_price = ${estimated_price || 0},
      final_price = ${final_price || 0},
      priority = ${priority || 'Medium'},
      status = ${status || 'Planned'},
      purchase_date = ${purchase_date || null},
      notes = ${notes || ''}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteItem(id) {
  const sql = getSQL();
  await sql`DELETE FROM items WHERE id = ${id}`;
}

// ============================================
// SEED
// ============================================
export async function seedData() {
  const sql = getSQL();

  // Check if already seeded
  const existing = await sql`SELECT COUNT(*) as count FROM categories`;
  if (Number(existing[0].count) > 0) return false;

  // Insert categories
  const cats = await sql`
    INSERT INTO categories (name, budget_limit) VALUES
      ('Furniture', 15000000),
      ('Elektronik', 12000000),
      ('Dapur', 5000000),
      ('Dekorasi', 3000000),
      ('Jasa Pindahan', 4000000)
    RETURNING id, name
  `;

  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c.id; });

  // Insert items
  await sql`
    INSERT INTO items (name, category_id, estimated_price, final_price, priority, status, purchase_date, notes) VALUES
      ('Sofa L-Shape', ${catMap['Furniture']}, 8500000, 7900000, 'High', 'Purchased', '2026-02-28', 'Warna abu-abu modern'),
      ('Meja Makan Set', ${catMap['Furniture']}, 4500000, 4200000, 'High', 'Delivered', '2026-02-25', '6 kursi, kayu jati'),
      ('Rak Buku', ${catMap['Furniture']}, 2000000, 0, 'Medium', 'Planned', NULL, ''),
      ('Smart TV 55"', ${catMap['Elektronik']}, 7000000, 6500000, 'High', 'Done', '2026-02-20', 'Samsung QLED'),
      ('Mesin Cuci', ${catMap['Elektronik']}, 4500000, 4800000, 'High', 'Purchased', '2026-02-27', 'Front loading 8kg'),
      ('AC 1 PK', ${catMap['Elektronik']}, 4000000, 0, 'Medium', 'Planned', NULL, 'Kamar tidur utama'),
      ('Set Panci & Wajan', ${catMap['Dapur']}, 1200000, 950000, 'Medium', 'Done', '2026-02-18', 'Stainless steel'),
      ('Rice Cooker', ${catMap['Dapur']}, 800000, 750000, 'High', 'Purchased', '2026-02-26', 'Digital, 1.8L'),
      ('Microwave', ${catMap['Dapur']}, 1500000, 0, 'Low', 'Planned', NULL, ''),
      ('Tirai Blackout', ${catMap['Dekorasi']}, 1800000, 1600000, 'Medium', 'Delivered', '2026-02-22', '3 set kamar'),
      ('Lampu Hias', ${catMap['Dekorasi']}, 500000, 0, 'Low', 'Planned', NULL, ''),
      ('Jasa Pindahan', ${catMap['Jasa Pindahan']}, 3500000, 3200000, 'High', 'Done', '2026-02-15', 'Termasuk packing'),
      ('Deep Cleaning', ${catMap['Jasa Pindahan']}, 800000, 0, 'Medium', 'Planned', NULL, 'Rumah baru')
  `;

  return true;
}

// ============================================
// ADMIN — STATS
// ============================================
export async function getAdminStats() {
  const sql = getSQL();
  const catCount = await sql`SELECT COUNT(*) as count FROM categories`;
  const itemCount = await sql`SELECT COUNT(*) as count FROM items`;
  const budgetAgg = await sql`
    SELECT
      COALESCE(SUM(budget_limit), 0) AS total_budget,
      COALESCE(SUM(sub.total_spent), 0) AS total_spent
    FROM categories c
    LEFT JOIN (
      SELECT category_id, SUM(final_price) AS total_spent
      FROM items
      GROUP BY category_id
    ) sub ON sub.category_id = c.id
  `;
  const statusCounts = await sql`
    SELECT status, COUNT(*) as count FROM items GROUP BY status
  `;
  const statusMap = {};
  statusCounts.forEach(r => { statusMap[r.status] = Number(r.count); });

  return {
    total_categories: Number(catCount[0].count),
    total_items: Number(itemCount[0].count),
    total_budget: Number(budgetAgg[0].total_budget),
    total_spent: Number(budgetAgg[0].total_spent),
    status_breakdown: statusMap,
  };
}

// ============================================
// ADMIN — CATEGORY SUMMARY
// ============================================
export async function getCategorySummary() {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      c.id,
      c.name,
      c.budget_limit,
      COALESCE(SUM(i.final_price), 0) AS total_spent,
      COUNT(i.id) AS item_count
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id, c.name, c.budget_limit
    ORDER BY c.name
  `;
  return rows.map(r => ({
    ...r,
    budget_limit: Number(r.budget_limit),
    total_spent: Number(r.total_spent),
    item_count: Number(r.item_count),
    remaining: Number(r.budget_limit) - Number(r.total_spent),
    percentage: Number(r.budget_limit) > 0
      ? Math.round((Number(r.total_spent) / Number(r.budget_limit)) * 100)
      : 0,
  }));
}

// ============================================
// ADMIN — RESET / CLEAR / EXPORT
// ============================================
export async function resetAndSeed() {
  const sql = getSQL();
  await sql`DELETE FROM items`;
  await sql`DELETE FROM categories`;
  // Reset sequences
  await sql`ALTER SEQUENCE items_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`;
  // Re-seed
  await seedData();
  return true;
}

export async function clearAllData() {
  const sql = getSQL();
  await sql`DELETE FROM items`;
  await sql`DELETE FROM categories`;
  await sql`ALTER SEQUENCE items_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`;
  return true;
}

export async function exportAllData() {
  const sql = getSQL();
  const categories = await sql`SELECT * FROM categories ORDER BY id`;
  const items = await sql`SELECT * FROM items ORDER BY id`;
  return {
    exported_at: new Date().toISOString(),
    categories: categories.map(c => ({ ...c, budget_limit: Number(c.budget_limit) })),
    items: items.map(i => ({
      ...i,
      estimated_price: Number(i.estimated_price),
      final_price: Number(i.final_price),
    })),
  };
}

// ============================================
// ADMIN — IMPORT DATA
// ============================================
export async function importData(data) {
  const sql = getSQL();

  // Clear existing
  await sql`DELETE FROM items`;
  await sql`DELETE FROM categories`;
  await sql`ALTER SEQUENCE items_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`;

  let catCount = 0;
  let itemCount = 0;

  if (data.categories && data.categories.length > 0) {
    for (const cat of data.categories) {
      const inserted = await sql`
        INSERT INTO categories (name, budget_limit)
        VALUES (${cat.name}, ${cat.budget_limit || 0})
        RETURNING id
      `;
      const newCatId = inserted[0].id;
      catCount++;

      // Insert items for this category
      if (data.items) {
        const catItems = data.items.filter(i => i.category_id === cat.id || i.category_name === cat.name);
        for (const item of catItems) {
          await sql`
            INSERT INTO items (name, category_id, estimated_price, final_price, priority, status, purchase_date, notes)
            VALUES (${item.name}, ${newCatId}, ${item.estimated_price || 0}, ${item.final_price || 0}, ${item.priority || 'Medium'}, ${item.status || 'Planned'}, ${item.purchase_date || null}, ${item.notes || ''})
          `;
          itemCount++;
        }
      }
    }
  }

  return { categories_imported: catCount, items_imported: itemCount };
}

// ============================================
// ADMIN — BULK OPERATIONS
// ============================================
export async function bulkUpdateStatus(itemIds, newStatus) {
  const sql = getSQL();
  if (!itemIds || itemIds.length === 0) return 0;
  const result = await sql`
    UPDATE items SET status = ${newStatus}
    WHERE id = ANY(${itemIds}::int[])
  `;
  return itemIds.length;
}

export async function bulkDeleteByCategory(categoryId) {
  const sql = getSQL();
  const result = await sql`
    DELETE FROM items WHERE category_id = ${categoryId}
  `;
  return true;
}

// ============================================
// ADMIN — SETTINGS
// ============================================
export async function getSettings() {
  const sql = getSQL();
  const rows = await sql`SELECT key, value FROM app_settings ORDER BY key`;
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

export async function updateSettings(settingsObj) {
  const sql = getSQL();
  for (const [key, value] of Object.entries(settingsObj)) {
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `;
  }
  return true;
}

// ============================================
// ADMIN — ACTIVITY LOG
// ============================================
export async function addActivityLog(action, detail = '') {
  const sql = getSQL();
  await sql`
    INSERT INTO activity_log (action, detail)
    VALUES (${action}, ${detail})
  `;
}

export async function getActivityLog(limit = 20) {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM activity_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function clearActivityLog() {
  const sql = getSQL();
  await sql`DELETE FROM activity_log`;
  await sql`ALTER SEQUENCE activity_log_id_seq RESTART WITH 1`;
}
