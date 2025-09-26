import AuthRequired from '@/components/layout/AuthRequired';

export const AuthRequireLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <AuthRequired>{children}</AuthRequired>;
};

export default AuthRequireLayout;
