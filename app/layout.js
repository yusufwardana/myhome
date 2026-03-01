import './globals.css';

export const metadata = {
  title: 'MoveBudget — Kelola Biaya Pindah Rumah',
  description: 'Aplikasi pengelolaan biaya pindah rumah dan pembelian perabot. Lacak budget, pengeluaran, dan status item.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
