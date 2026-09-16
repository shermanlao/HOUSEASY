import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RentalEasy 租務易',
  description: '租務文件管理系統',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
