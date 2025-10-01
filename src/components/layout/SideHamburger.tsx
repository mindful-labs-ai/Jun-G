'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { AlignJustify } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
    { href: '/project', label: '숏폼 메이커' },
    { href: '/insta', label: '인스타 댓글/캡션' },
    { href: '/image', label: '단일 이미지 메이커' },
    { href: '/video', label: '단일 비디오 메이커' },
    { href: '/gif', label: 'gif 메이커' },
  ];

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5분 - 데이터를 5분간 fresh로 간주
        gcTime: 30 * 60 * 1000, // 30분 - 가비지 컬렉션 시간
        retry: 1, // 재시도 1회로 제한
        refetchOnWindowFocus: true, // 창 포커스 시 재요청 비활성화
        refetchOnMount: true, // 마운트 시 재요청 비활성화 (stale하지 않으면)
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default SideHamburger;
