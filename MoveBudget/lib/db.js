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
