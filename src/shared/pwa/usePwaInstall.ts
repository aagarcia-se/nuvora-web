import { useEffect, useRef, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function knownInstalled() {
  try { return isStandalone() || sessionStorage.getItem('nuvora-installed') === 'true'; }
  catch { return isStandalone(); }
}

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(knownInstalled);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setError(false);
    };
    const onInstalled = () => {
      try { sessionStorage.setItem('nuvora-installed', 'true'); } catch { /* In-memory fallback. */ }
      setInstalled(true);
      setPrompt(null);
    };
    const onDisplayMode = () => setInstalled(knownInstalled());
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', onDisplayMode);
    };
  }, []);

  async function install() {
    if (!prompt || busy.current) return;
    busy.current = true;
    setInstalling(true);
    setError(false);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setError(true);
    } finally {
      // El evento de instalación solo puede usarse una vez.
      setPrompt(null);
      setInstalling(false);
      busy.current = false;
    }
  }

  return { canInstall: !!prompt, installed, installing, error, install };
}
