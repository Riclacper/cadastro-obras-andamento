import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RedirectToObras() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/obras');
  }, []);

  return null;
}
