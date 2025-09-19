import type { Metadata } from 'next';
import './globals.css';
import SideHamburger from '@/components/layout/SideHamburger';

export const metadata: Metadata = {
  title: 'JUN-G',
  description: 'Generate AI creation in one platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko-KR' className='tc-new-price'>
      <body className={`antialiased`}>
        <SideHamburger>{children}</SideHamburger>
      </body>
    </html>
  );
}
