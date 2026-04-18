import { useEffect, useState, useCallback } from "react";

export interface AppSettings {
  notifEmailCritical: boolean;
  notifPushOutbreak: boolean;
  notifDailyDigest: boolean;
  notifScreeningOverdue: boolean;
  apearDarkMap: boolean;
  apearCompactRows: boolean;
  apearShowRiskPct: boolean;
  intEhr: boolean;
  intLis: boolean;
  intPharmacy: boolean;
  intEnvMonitoring: boolean;
  privacyTwoFactor: boolean;
  privacyAutoLock: boolean;
  privacyAuditLogging: boolean;
  regionDateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  regionTimezone: string;
  regionLanguage: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifEmailCritical: true,
  notifPushOutbreak: true,
  notifDailyDigest: false,
  notifScreeningOverdue: true,
  apearDarkMap: true,
  apearCompactRows: false,
  apearShowRiskPct: true,
  intEhr: true,
  intLis: true,
  intPharmacy: false,
  intEnvMonitoring: false,
  privacyTwoFactor: true,
  privacyAutoLock: true,
  privacyAuditLogging: true,
  regionDateFormat: "DD/MM/YYYY",
  regionTimezone: "GMT",
  regionLanguage: "English (UK)",
};

const STORAGE_KEY = "metamed.settings.v1";

function load(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getSettings(): AppSettings {
  return load();
}

function save(settings: AppSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("metamed:settings-changed"));
  } catch {
    /* ignore */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => load());

  useEffect(() => {
    const onChange = () => setSettings(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(load());
    };
    window.addEventListener("metamed:settings-changed", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("metamed:settings-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    save(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset };
}
