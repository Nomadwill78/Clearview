import { useEffect } from 'react';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';

export function useProfile() {
  const { profile, loading, fetchProfile, updateProfile } = useProfileStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user]);

  return { profile, loading, updateProfile };
}
