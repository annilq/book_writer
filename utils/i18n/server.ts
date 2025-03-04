import i18next from 'i18next';
import en from './app_en.json';
import zh from './app_zh.json';

const i18n = i18next.createInstance();

i18n.init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export function getI18n(language?: string) {
  if (language) {
    i18n.changeLanguage(language);
  }
  return i18n;
}

export default i18n; 