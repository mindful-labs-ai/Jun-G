'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { createClient } from '@/lib/supabase/client';
import { Separator } from '../ui/separator';
import { useAuthStore } from '@/lib/shared/useAuthStore';

type SidebarProps = {
  id?: string;
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
};

export const Sidebar = ({ id, open, onClose, links }: SidebarProps) => {
  const pathname = usePathname();
  const supabase = createClient();
  const userEmail = useAuthStore(s => s.userEmail);
  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Drawer */}
      <aside
        id={id}
        aria-hidden={!open}
        className={[
          'fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-card shadow-xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className='flex h-14 items-center justify-between border-b border-border px-4'>
          <span className='text-sm font-semibold'>탐색</span>
          <button
            type='button'
            aria-label='사이드바 닫기'
            onClick={onClose}
            className='rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring'
          >
            <span className='sr-only'>Close</span>
            {/* X 아이콘 대용 */}
            <div className='relative h-4 w-4'>
              <span className='absolute left-1/2 top-1/2 block h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current' />
              <span className='absolute left-1/2 top-1/2 block h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current' />
            </div>
          </button>
        </div>

        <nav className='p-2 h-full'>
          <div className='p-2 flex flex-col justify-center'>
            {!!userEmail ? (
              <>
                <p className='text-lg'>안녕하세요!</p>
                <p className='text-sm'>
                  <strong>{userEmail}</strong>님
                </p>
                <Button
                  className='mt-6'
                  onClick={() => supabase.auth.signOut()}
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${location.origin}/auth/callback` },
                  });
                }}
              >
                로그인하기
              </Button>
            )}
          </div>
          <Separator className='my-2' />
          <div>
            {links.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
