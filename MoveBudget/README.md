# 🏠 MoveBudget

Aplikasi web untuk mengelola biaya pindah rumah dan pembelian perabot. Dibangun dengan Next.js dan Vercel Postgres (Neon).

## ✨ Fitur

- **Dashboard** — Ringkasan total budget, spent, remaining + charts interaktif
- **Kategori** — Kelola kategori budget dengan progress bar & overbudget alert
- **Items** — Table view & Kanban board + filter kategori, priority, status
- **Best Deal** — Indikator otomatis jika harga final lebih murah dari estimasi
- **Responsif** — Tampilan optimal di desktop dan mobile
- **Database** — Vercel Postgres (Neon) untuk data persisten

## 🚀 Cara Deploy ke Vercel

1. Push repository ini ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Buat database:
   - Vercel Dashboard → Storage → Create Database → **Postgres (Neon)**
   - Connect ke project Anda
4. Deploy — environment variable `DATABASE_URL` akan otomatis diisi
5. Buka URL production, data demo akan otomatis di-seed

## 🛠️ Development Lokal

```bash
# Install dependencies
npm install

# Set DATABASE_URL di .env.local
# (copy dari Vercel dashboard > Storage > Connection Details)

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📚 Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [@neondatabase/serverless](https://neon.tech/) — Postgres database
- [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/) — Charts
- Vanilla CSS — Dark theme design system

## 📄 License

MIT
