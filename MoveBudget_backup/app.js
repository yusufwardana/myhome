/* ============================================
   MoveBudget — Application Logic
   ============================================ */

// =============================================
// DATA LAYER
// =============================================
const DB_KEYS = { categories: 'mb_categories', items: 'mb_items' };

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// State
let categories = loadData(DB_KEYS.categories);
let items = loadData(DB_KEYS.items);

// Seed demo data if empty
if (categories.length === 0 && items.length === 0) {
  seedDemoData();
}

function seedDemoData() {
  const demoCategories = [
    { id: generateId(), name: 'Furniture', budget_limit: 15000000 },
    { id: generateId(), name: 'Elektronik', budget_limit: 12000000 },
    { id: generateId(), name: 'Dapur', budget_limit: 5000000 },
    { id: generateId(), name: 'Dekorasi', budget_limit: 3000000 },
    { id: generateId(), name: 'Jasa Pindahan', budget_limit: 4000000 },
  ];

  const statuses = ['Planned', 'Purchased', 'Delivered', 'Done'];
  const priorities = ['High', 'Medium', 'Low'];

  const demoItems = [
    { name: 'Sofa L-Shape', category: demoCategories[0].id, estimated_price: 8500000, final_price: 7900000, priority: 'High', status: 'Purchased', purchase_date: '2026-02-28', notes: 'Warna abu-abu modern' },
    { name: 'Meja Makan Set', category: demoCategories[0].id, estimated_price: 4500000, final_price: 4200000, priority: 'High', status: 'Delivered', purchase_date: '2026-02-25', notes: '6 kursi, kayu jati' },
    { name: 'Rak Buku', category: demoCategories[0].id, estimated_price: 2000000, final_price: 0, priority: 'Medium', status: 'Planned', purchase_date: '', notes: '' },
    { name: 'Smart TV 55"', category: demoCategories[1].id, estimated_price: 7000000, final_price: 6500000, priority: 'High', status: 'Done', purchase_date: '2026-02-20', notes: 'Samsung QLED' },
    { name: 'Mesin Cuci', category: demoCategories[1].id, estimated_price: 4500000, final_price: 4800000, priority: 'High', status: 'Purchased', purchase_date: '2026-02-27', notes: 'Front loading 8kg' },
    { name: 'AC 1 PK', category: demoCategories[1].id, estimated_price: 4000000, final_price: 0, priority: 'Medium', status: 'Planned', purchase_date: '', notes: 'Kamar tidur utama' },
    { name: 'Set Panci & Wajan', category: demoCategories[2].id, estimated_price: 1200000, final_price: 950000, priority: 'Medium', status: 'Done', purchase_date: '2026-02-18', notes: 'Stainless steel' },
    { name: 'Rice Cooker', category: demoCategories[2].id, estimated_price: 800000, final_price: 750000, priority: 'High', status: 'Purchased', purchase_date: '2026-02-26', notes: 'Digital, 1.8L' },
    { name: 'Microwave', category: demoCategories[2].id, estimated_price: 1500000, final_price: 0, priority: 'Low', status: 'Planned', purchase_date: '', notes: '' },
    { name: 'Tirai Blackout', category: demoCategories[3].id, estimated_price: 1800000, final_price: 1600000, priority: 'Medium', status: 'Delivered', purchase_date: '2026-02-22', notes: '3 set kamar' },
    { name: 'Lampu Hias', category: demoCategories[3].id, estimated_price: 500000, final_price: 0, priority: 'Low', status: 'Planned', purchase_date: '', notes: '' },
    { name: 'Jasa Pindahan', category: demoCategories[4].id, estimated_price: 3500000, final_price: 3200000, priority: 'High', status: 'Done', purchase_date: '2026-02-15', notes: 'Termasuk packing' },
    { name: 'Deep Cleaning', category: demoCategories[4].id, estimated_price: 800000, final_price: 0, priority: 'Medium', status: 'Planned', purchase_date: '', notes: 'Rumah baru' },
  ];

  categories = demoCategories;
  items = demoItems.map(item => ({ id: generateId(), ...item }));

  saveData(DB_KEYS.categories, categories);
  saveData(DB_KEYS.items, items);
}

// =============================================
// HELPERS
// =============================================
function formatCurrency(num) {
  if (num === null || num === undefined || num === '' || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function getCategoryName(catId) {
  const cat = categories.find(c => c.id === catId);
  return cat ? cat.name : '—';
}

function getCategoryTotalSpent(catId) {
  return items
    .filter(item => item.category === catId)
    .reduce((sum, item) => sum + (Number(item.final_price) || 0), 0);
}

function getCategoryRemainingBudget(cat) {
  const spent = getCategoryTotalSpent(cat.id);
  return cat.budget_limit - spent;
}

function isBestDeal(item) {
  return item.final_price > 0 && item.estimated_price > 0 && item.final_price < item.estimated_price;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================
// NAVIGATION
// =============================================
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');

function navigateTo(page) {
  navItems.forEach(n => n.classList.remove('active'));
  pageSections.forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById(`page-${page}`)?.classList.add('active');
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  // Refresh page data
  if (page === 'dashboard') renderDashboard();
  if (page === 'categories') renderCategories();
  if (page === 'items') renderItems();
}

navItems.forEach(nav => {
  nav.addEventListener('click', () => navigateTo(nav.dataset.page));
});

// Mobile sidebar
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
});

// =============================================
// MODALS
// =============================================
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Category Modal
document.getElementById('addCategoryBtn').addEventListener('click', () => {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryModalTitle').textContent = 'Tambah Kategori';
  openModal('categoryModal');
});

document.getElementById('closeCategoryModal').addEventListener('click', () => closeModal('categoryModal'));
document.getElementById('cancelCategoryBtn').addEventListener('click', () => closeModal('categoryModal'));

document.getElementById('saveCategoryBtn').addEventListener('click', () => {
  const name = document.getElementById('categoryName').value.trim();
  const budget = Number(document.getElementById('categoryBudget').value);
  const id = document.getElementById('categoryId').value;

  if (!name || budget < 0) {
    showToast('Lengkapi semua field dengan benar', 'error');
    return;
  }

  if (id) {
    const idx = categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      categories[idx].name = name;
      categories[idx].budget_limit = budget;
    }
    showToast('Kategori berhasil diperbarui');
  } else {
    categories.push({ id: generateId(), name, budget_limit: budget });
    showToast('Kategori berhasil ditambahkan');
  }

  saveData(DB_KEYS.categories, categories);
  closeModal('categoryModal');
  renderAll();
});

function editCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('categoryId').value = cat.id;
  document.getElementById('categoryName').value = cat.name;
  document.getElementById('categoryBudget').value = cat.budget_limit;
  document.getElementById('categoryModalTitle').textContent = 'Edit Kategori';
  openModal('categoryModal');
}

// Item Modal
document.getElementById('addItemBtn').addEventListener('click', () => {
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('itemModalTitle').textContent = 'Tambah Item';
  populateCategorySelect();
  openModal('itemModal');
});

document.getElementById('closeItemModal').addEventListener('click', () => closeModal('itemModal'));
document.getElementById('cancelItemBtn').addEventListener('click', () => closeModal('itemModal'));

function populateCategorySelect() {
  const select = document.getElementById('itemCategory');
  select.innerHTML = '<option value="">Pilih Kategori</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

document.getElementById('saveItemBtn').addEventListener('click', () => {
  const name = document.getElementById('itemName').value.trim();
  const category = document.getElementById('itemCategory').value;
  const priority = document.getElementById('itemPriority').value;
  const estimated_price = Number(document.getElementById('itemEstPrice').value) || 0;
  const final_price = Number(document.getElementById('itemFinalPrice').value) || 0;
  const status = document.getElementById('itemStatus').value;
  const purchase_date = document.getElementById('itemDate').value;
  const notes = document.getElementById('itemNotes').value;
  const id = document.getElementById('itemId').value;

  if (!name || !category) {
    showToast('Lengkapi nama item dan kategori', 'error');
    return;
  }

  const itemData = { name, category, estimated_price, final_price, priority, status, purchase_date, notes };

  if (id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...itemData };
    }
    showToast('Item berhasil diperbarui');
  } else {
    items.push({ id: generateId(), ...itemData });
    showToast('Item berhasil ditambahkan');
  }

  saveData(DB_KEYS.items, items);
  closeModal('itemModal');
  renderAll();
});

function editItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  populateCategorySelect();
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemPriority').value = item.priority;
  document.getElementById('itemEstPrice').value = item.estimated_price || '';
  document.getElementById('itemFinalPrice').value = item.final_price || '';
  document.getElementById('itemStatus').value = item.status;
  document.getElementById('itemDate').value = item.purchase_date || '';
  document.getElementById('itemNotes').value = item.notes || '';
  document.getElementById('itemModalTitle').textContent = 'Edit Item';
  openModal('itemModal');
}

// Confirm delete
let deleteCallback = null;

function confirmDelete(name, callback) {
  document.getElementById('confirmName').textContent = name;
  deleteCallback = callback;
  openModal('confirmModal');
}

document.getElementById('confirmCancelBtn').addEventListener('click', () => {
  closeModal('confirmModal');
  deleteCallback = null;
});

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (deleteCallback) deleteCallback();
  closeModal('confirmModal');
  deleteCallback = null;
});

function deleteCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  confirmDelete(cat.name, () => {
    // Also delete items in this category
    items = items.filter(i => i.category !== id);
    categories = categories.filter(c => c.id !== id);
    saveData(DB_KEYS.categories, categories);
    saveData(DB_KEYS.items, items);
    showToast('Kategori dan item terkait berhasil dihapus');
    renderAll();
  });
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  confirmDelete(item.name, () => {
    items = items.filter(i => i.id !== id);
    saveData(DB_KEYS.items, items);
    showToast('Item berhasil dihapus');
    renderAll();
  });
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
});

// =============================================
// DASHBOARD RENDERING
// =============================================
let categoryChartInstance = null;
let budgetVsSpentChartInstance = null;

function renderDashboard() {
  const totalBudget = categories.reduce((sum, c) => sum + c.budget_limit, 0);
  const totalSpent = items.reduce((sum, i) => sum + (Number(i.final_price) || 0), 0);
  const remaining = totalBudget - totalSpent;
  const activeItems = items.filter(i => i.status !== 'Done');

  const overbudget = remaining < 0;

  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card budget">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Total Budget</div>
      <div class="stat-value currency">${formatCurrency(totalBudget)}</div>
      <div class="stat-sub">${categories.length} kategori</div>
    </div>
    <div class="stat-card spent">
      <div class="stat-icon">🛒</div>
      <div class="stat-label">Total Spent</div>
      <div class="stat-value currency">${formatCurrency(totalSpent)}</div>
      <div class="stat-sub">${items.filter(i => i.final_price > 0).length} item dibeli</div>
    </div>
    <div class="stat-card remaining ${overbudget ? 'overbudget' : ''}">
      <div class="stat-icon">${overbudget ? '⚠️' : '✅'}</div>
      <div class="stat-label">Remaining Budget</div>
      <div class="stat-value currency">${formatCurrency(remaining)}</div>
      <div class="stat-sub">${overbudget ? 'Over budget!' : 'Dalam budget'}</div>
    </div>
    <div class="stat-card items">
      <div class="stat-icon">📦</div>
      <div class="stat-label">Item Aktif</div>
      <div class="stat-value">${activeItems.length}</div>
      <div class="stat-sub">dari ${items.length} total item</div>
    </div>
  `;

  // Active items table
  document.getElementById('activeItemCount').textContent = `${activeItems.length} item aktif`;
  const tbody = document.getElementById('activeItemsTable');

  if (activeItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🎉</div><p>Semua item sudah selesai!</p></div></td></tr>`;
  } else {
    tbody.innerHTML = activeItems.map(item => `
      <tr>
        <td>
          <strong>${item.name}</strong>
          ${isBestDeal(item) ? '<span class="badge badge-best-deal" style="margin-left:6px">🏷️ Best Deal</span>' : ''}
        </td>
        <td>${getCategoryName(item.category)}</td>
        <td><span class="badge badge-priority-${item.priority.toLowerCase()}">${item.priority}</span></td>
        <td><span class="badge badge-status-${item.status.toLowerCase()}">${item.status}</span></td>
        <td class="text-right currency">${item.final_price ? formatCurrency(item.final_price) : '<span class="text-muted">—</span>'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="editItem('${item.id}')" title="Edit">✏️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Charts
  renderCategoryChart();
  renderBudgetVsSpentChart();
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;

  if (categoryChartInstance) categoryChartInstance.destroy();

  const data = categories.map(cat => ({
    label: cat.name,
    value: getCategoryTotalSpent(cat.id)
  })).filter(d => d.value > 0);

  if (data.length === 0) {
    categoryChartInstance = null;
    ctx.canvas.parentElement.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>Belum ada data pengeluaran</p></div>';
    return;
  }

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#3b82f6', '#14b8a6',
    '#a855f7', '#06b6d4'
  ];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9ca3af',
            padding: 16,
            font: { family: 'Inter', size: 12 },
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: '#1c1f2e',
          titleColor: '#e8eaed',
          bodyColor: '#9ca3af',
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: function(context) {
              return ' ' + formatCurrency(context.raw);
            }
          }
        }
      }
    }
  });
}

function renderBudgetVsSpentChart() {
  const ctx = document.getElementById('budgetVsSpentChart')?.getContext('2d');
  if (!ctx) return;

  if (budgetVsSpentChartInstance) budgetVsSpentChartInstance.destroy();

  if (categories.length === 0) {
    budgetVsSpentChartInstance = null;
    ctx.canvas.parentElement.innerHTML = '<div class="empty-state"><div class="empty-icon">📈</div><p>Belum ada data kategori</p></div>';
    return;
  }

  budgetVsSpentChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories.map(c => c.name),
      datasets: [
        {
          label: 'Budget',
          data: categories.map(c => c.budget_limit),
          backgroundColor: 'rgba(99, 102, 241, 0.3)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        },
        {
          label: 'Spent',
          data: categories.map(c => getCategoryTotalSpent(c.id)),
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#6b7280',
            font: { family: 'Inter', size: 11 },
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
              return value;
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#9ca3af',
            padding: 16,
            font: { family: 'Inter', size: 12 },
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: '#1c1f2e',
          titleColor: '#e8eaed',
          bodyColor: '#9ca3af',
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: function(context) {
              return ' ' + context.dataset.label + ': ' + formatCurrency(context.raw);
            }
          }
        }
      }
    }
  });
}

// =============================================
// CATEGORIES RENDERING
// =============================================
function renderCategories() {
  const tbody = document.getElementById('categoriesTable');

  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📁</div><p>Belum ada kategori. Tambahkan kategori pertama Anda!</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map(cat => {
    const spent = getCategoryTotalSpent(cat.id);
    const remaining = cat.budget_limit - spent;
    const percent = cat.budget_limit > 0 ? Math.min((spent / cat.budget_limit) * 100, 100) : 0;
    const overbudget = remaining < 0;
    const barClass = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : '';

    return `
      <tr class="${overbudget ? 'overbudget' : ''}">
        <td>
          <strong>${cat.name}</strong>
          ${overbudget ? ' <span class="badge badge-overbudget">⚠️ Over Budget</span>' : ''}
        </td>
        <td class="text-right currency">${formatCurrency(cat.budget_limit)}</td>
        <td class="text-right currency">${formatCurrency(spent)}</td>
        <td class="text-right currency ${overbudget ? 'text-danger' : 'text-success'}">${formatCurrency(remaining)}</td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-bar-fill ${barClass}" style="width: ${Math.min(percent, 100)}%"></div>
            </div>
            <div class="progress-bar-label">${percent.toFixed(1)}% used</div>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="editCategory('${cat.id}')" title="Edit">✏️</button>
            <button class="btn-icon" onclick="deleteCategory('${cat.id}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// =============================================
// ITEMS RENDERING
// =============================================
let currentView = 'table';

// View toggle
document.getElementById('viewTableBtn').addEventListener('click', () => switchView('table'));
document.getElementById('viewKanbanBtn').addEventListener('click', () => switchView('kanban'));

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  document.getElementById('itemsTableView').style.display = view === 'table' ? 'block' : 'none';
  document.getElementById('itemsKanbanView').style.display = view === 'kanban' ? 'block' : 'none';
  renderItems();
}

// Filters
document.getElementById('filterCategory').addEventListener('change', renderItems);
document.getElementById('filterPriority').addEventListener('change', renderItems);
document.getElementById('filterStatus').addEventListener('change', renderItems);

function getFilteredItems() {
  const catFilter = document.getElementById('filterCategory').value;
  const priFilter = document.getElementById('filterPriority').value;
  const statusFilter = document.getElementById('filterStatus').value;

  return items.filter(item => {
    if (catFilter && item.category !== catFilter) return false;
    if (priFilter && item.priority !== priFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });
}

function renderItems() {
  populateFilterCategories();

  if (currentView === 'table') {
    renderItemsTable();
  } else {
    renderKanban();
  }
}

function populateFilterCategories() {
  const select = document.getElementById('filterCategory');
  const currentVal = select.value;
  select.innerHTML = '<option value="">Semua</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}" ${currentVal === cat.id ? 'selected' : ''}>${cat.name}</option>`;
  });
}

function renderItemsTable() {
  const tbody = document.getElementById('itemsTable');
  const filtered = getFilteredItems();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📦</div><p>Tidak ada item ditemukan</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const bestDeal = isBestDeal(item);
    const savings = bestDeal ? item.estimated_price - item.final_price : 0;

    return `
      <tr>
        <td>
          <strong>${item.name}</strong>
          ${bestDeal ? '<span class="badge badge-best-deal" style="margin-left:6px">🏷️ Best Deal</span>' : ''}
          ${item.notes ? `<br/><small class="text-muted">${item.notes.substring(0, 50)}${item.notes.length > 50 ? '...' : ''}</small>` : ''}
        </td>
        <td>${getCategoryName(item.category)}</td>
        <td><span class="badge badge-priority-${item.priority.toLowerCase()}">${item.priority}</span></td>
        <td><span class="badge badge-status-${item.status.toLowerCase()}">${item.status}</span></td>
        <td class="text-right currency">${item.estimated_price ? formatCurrency(item.estimated_price) : '<span class="text-muted">—</span>'}</td>
        <td class="text-right currency">
          ${item.final_price ? formatCurrency(item.final_price) : '<span class="text-muted">—</span>'}
          ${bestDeal ? `<br/><small class="text-success">Hemat ${formatCurrency(savings)}</small>` : ''}
        </td>
        <td>${formatDate(item.purchase_date)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="editItem('${item.id}')" title="Edit">✏️</button>
            <button class="btn-icon" onclick="deleteItem('${item.id}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderKanban() {
  const filtered = getFilteredItems();
  const statuses = ['Planned', 'Purchased', 'Delivered', 'Done'];

  statuses.forEach(status => {
    const statusItems = filtered.filter(i => i.status === status);
    const container = document.getElementById(`kanban${status}`);
    const countEl = document.getElementById(`kanbanCount${status}`);

    countEl.textContent = statusItems.length;

    if (statusItems.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:24px 12px"><p class="text-muted" style="font-size:0.8rem">Tidak ada item</p></div>`;
      return;
    }

    container.innerHTML = statusItems.map(item => {
      const bestDeal = isBestDeal(item);
      return `
        <div class="kanban-card" onclick="editItem('${item.id}')">
          <div class="kc-name">${item.name}</div>
          <div class="kc-category">${getCategoryName(item.category)}</div>
          <div class="kc-footer">
            <span class="badge badge-priority-${item.priority.toLowerCase()}">${item.priority}</span>
            <span class="kc-price">${item.final_price ? formatCurrency(item.final_price) : (item.estimated_price ? formatCurrency(item.estimated_price) : '—')}</span>
          </div>
          ${bestDeal ? '<div style="margin-top:8px"><span class="badge badge-best-deal">🏷️ Best Deal</span></div>' : ''}
        </div>
      `;
    }).join('');
  });
}

// =============================================
// RENDER ALL
// =============================================
function renderAll() {
  const activePage = document.querySelector('.page-section.active')?.id?.replace('page-', '');
  if (activePage === 'dashboard') renderDashboard();
  if (activePage === 'categories') renderCategories();
  if (activePage === 'items') renderItems();
}

// =============================================
// INITIAL RENDER
// =============================================
renderDashboard();
