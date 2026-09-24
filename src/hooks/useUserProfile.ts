import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'flowcore_dario_custom_photo';
const EVENT_NAME = 'flowcore_profile_photo_change';

export function useUserProfile() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Carrega do backend ao montar para sincronização entre navegadores
  useEffect(() => {
    let isMounted = true;
    const fetchPhoto = async () => {
      try {
        const res = await fetch('/api/user/profile-photo');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.photoUrl) {
            setPhotoUrl(data.photoUrl);
            try {
              localStorage.setItem(STORAGE_KEY, data.photoUrl);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Backend pode estar indisponível, usa localStorage
      }
    };

    fetchPhoto();

    const handleCustomEvent = (e: CustomEvent<string | null>) => {
      if (isMounted) {
        setPhotoUrl(e.detail);
      }
    };

    window.addEventListener(EVENT_NAME as any, handleCustomEvent);
    return () => {
      isMounted = false;
      window.removeEventListener(EVENT_NAME as any, handleCustomEvent);
    };
  }, []);

  const updatePhoto = useCallback(async (newPhotoUrl: string) => {
    setIsLoading(true);
    try {
      setPhotoUrl(newPhotoUrl);
      try {
        localStorage.setItem(STORAGE_KEY, newPhotoUrl);
      } catch {
        // ignore
      }

      // Notifica todos os ouvintes no app
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newPhotoUrl }));

      // Sincroniza no backend
      await fetch('/api/user/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: newPhotoUrl }),
      });
    } catch (err) {
      console.error('Erro ao sincronizar foto de perfil:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPhoto = useCallback(async () => {
    setIsLoading(true);
    try {
      setPhotoUrl(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));

      await fetch('/api/user/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: null }),
      });
    } catch (err) {
      console.error('Erro ao remover foto de perfil:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    photoUrl,
    updatePhoto,
    clearPhoto,
    isLoading,
  };
}
