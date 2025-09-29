'use client';

import { useAuthHydration } from '@/lib/shared/useAuthHydration';

const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const ready = useAuthHydration();

  if (!ready) return <div>loading...</div>;

  return <>{children}</>;
};

export default AuthRequired;
