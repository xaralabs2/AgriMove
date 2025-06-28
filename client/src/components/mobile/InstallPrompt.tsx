import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show prompt after a delay if not already shown
      setTimeout(() => {
        const hasShownPrompt = localStorage.getItem('agrimove-install-prompt-shown');
        if (!hasShownPrompt && !isStandalone) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstallable(false);
      localStorage.setItem('agrimove-app-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('agrimove-app-installed', 'true');
      }
      
      localStorage.setItem('agrimove-install-prompt-shown', 'true');
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('agrimove-install-prompt-shown', 'true');
  };

  // Don't show if already installed or not installable
  if (!showPrompt || !isInstallable || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <Smartphone className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Install AgriMove</h3>
              <p className="text-xs text-gray-600">Add to your home screen for easy access</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
            Works offline with WhatsApp/USSD
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
            Real-time order tracking
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
            AI-powered recommendations
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <Button
            onClick={handleInstall}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="px-4 h-9 text-sm"
            size="sm"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component to show install button in header for iOS users
export function IOSInstallButton() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isStandaloneMode = (window.navigator as any).standalone;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);
  }, []);

  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowInstructions(true)}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        <Download className="h-3 w-3 mr-1" />
        Install
      </Button>

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Install AgriMove</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold text-blue-600">
                  1
                </div>
                <span>Tap the Share button at the bottom of your screen</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold text-blue-600">
                  2
                </div>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold text-blue-600">
                  3
                </div>
                <span>Tap "Add" to install AgriMove</span>
              </div>
            </div>

            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}