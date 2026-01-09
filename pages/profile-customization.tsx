import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';
import { ProfileCustomizationPage } from '@/components/vx2/customization/ProfileCustomizationPage';
import { BG_COLORS } from '@/components/vx2/core/constants/colors';

export default function ProfileCustomizationRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ProfileCustomizationPage />;
}
