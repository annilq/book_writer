"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Keeps the document language in sync with the active i18next locale so
 * screen readers use the correct voice (e.g. zh vs en) instead of the
 * hardcoded default in the server-rendered <html lang>.
 */
export function LocaleLang() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language || "en";
  }, [i18n.language]);
  return null;
}
