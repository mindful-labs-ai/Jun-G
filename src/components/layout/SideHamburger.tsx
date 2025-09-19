'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { AlignJustify } from 'lucide-react';

export const SideHamburger = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const links = [
    { href: '/', label: '숏폼 메이커' },
    { href: '/insta', label: '인스타 댓글/캡션' },
    { href: '/gemini', label: '단일 이미지 메이커' },
    { href: '/video', label: '단일 비디오 메이커' },
    { href: '/gif', label: 'gif 메이커' },
  ];

  return (
    <div className='relative bg-white/40 min-h-screen'>
      <button
        type='button'
        aria-label='사이드바 열기'
        aria-expanded={open}
        aria-controls='app-sidebar'
        onClick={() => setOpen(true)}
        className={[
          'fixed left-5 top-5 z-50',
          'inline-flex items-center justify-center',
          'h-10 w-10 rounded-md',
          'bg-accent/50 shadow-lg',
          'border border-border',
          'hover:bg-card/90 hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          'transition',
        ].join(' ')}
      >
        <AlignJustify />
      </button>

      <Sidebar
        id='app-sidebar'
        open={open}
        onClose={() => setOpen(false)}
        links={links}
      />

      <>{children}</>
    </div>
  );
};

export default SideHamburger;
