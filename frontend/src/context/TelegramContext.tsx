import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: string; text?: string }>;
  }, callback?: (id?: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
}

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  isTelegramEnvironment: boolean;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isTelegramEnvironment, setIsTelegramEnvironment] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      // Check if running in Telegram WebApp environment
      const tg = (window as any).Telegram?.WebApp;

      if (tg && tg.initData) {
        setIsTelegramEnvironment(true);
        setWebApp(tg);
        setInitData(tg.initData || '');
        setUser(tg.initDataUnsafe?.user || null);

        // Initialize Telegram WebApp - must call ready() for Telegram to show the app
        tg.ready();
        tg.expand();

        // Apply Telegram theme
        if (tg.themeParams) {
          applyTelegramTheme(tg.themeParams);
        }

        // Disable closing confirmation (allow back button to work)
        try {
          tg.disableClosingConfirmation();
        } catch {
          // Some older WebApp versions may not support this
        }
      } else if (tg) {
        // SDK loaded but no initData - opened in browser directly, not via Telegram
        // Still call ready() in case it's needed
        try { tg.ready(); } catch { /* ignore */ }
      }
    } catch (error) {
      console.error('Telegram WebApp initialization error:', error);
    }

    // Always mark as ready so the app renders
    setIsReady(true);
  }, []);

  const value: TelegramContextValue = {
    webApp,
    user,
    initData,
    isTelegramEnvironment,
    isReady,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}

/**
 * Apply Telegram theme colors to CSS variables
 */
function applyTelegramTheme(themeParams: TelegramWebApp['themeParams']) {
  const root = document.documentElement;

  if (themeParams.bg_color) {
    root.style.setProperty('--tg-bg-color', themeParams.bg_color);
  }
  if (themeParams.text_color) {
    root.style.setProperty('--tg-text-color', themeParams.text_color);
  }
  if (themeParams.hint_color) {
    root.style.setProperty('--tg-hint-color', themeParams.hint_color);
  }
  if (themeParams.link_color) {
    root.style.setProperty('--tg-link-color', themeParams.link_color);
  }
  if (themeParams.button_color) {
    root.style.setProperty('--tg-button-color', themeParams.button_color);
  }
  if (themeParams.button_text_color) {
    root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
  }
  if (themeParams.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color);
  }
}
