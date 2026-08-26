import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, I18nManager } from "react-native";
import { en } from "../locales/en";
import { fr } from "../locales/fr";
import { es } from "../locales/es";
import { ar } from "../locales/ar";
import { de } from "../locales/de";
import { getAccessTokenAsync } from "../services/session";
import { updateUserSettings, fetchUserSettings } from "../services/userApi";

type Language = "en" | "fr" | "es" | "ar" | "de";
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  t: (path: string) => string;
  changeLanguage: (lang: Language) => Promise<void>;
  translations: Translations;
  isRTL: boolean;
}

const translationsMap = { en, fr, es, ar, de };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  const isRTL = language === "ar";

  useEffect(() => {
    const loadLanguage = async () => {
      // 1. Load from local storage for fast initial render
      const savedLang = await AsyncStorage.getItem("@fuseremit/language");
      if (savedLang && translationsMap[savedLang as Language]) {
        setLanguage(savedLang as Language);
      }

      // 2. Load from backend if logged in
      const token = await getAccessTokenAsync();
      if (token) {
        try {
          const settings = await fetchUserSettings(token);
          const backendLang = settings.preferences.language as Language;
          if (backendLang && translationsMap[backendLang]) {
            setLanguage(backendLang);
            await AsyncStorage.setItem("@fuseremit/language", backendLang);
          }
        } catch (error) {
          console.log("Failed to fetch language from backend", error);
        }
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem("@fuseremit/language", lang);

    // Update I18nManager for next reload consistency
    const shouldBeRTL = lang === "ar";
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }

    const token = await getAccessTokenAsync();
    if (token) {
      try {
        await updateUserSettings(token, {
          preferences: {
            language: lang,
            pushNotifications: true, 
            emailNotifications: true,
          } as any
        });
      } catch (error) {
        console.log("Failed to update language on backend", error);
      }
    }
  };

  const t = (path: string) => {
    const keys = path.split(".");
    let result: any = translationsMap[language];
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; 
      }
    }
    return result as string;
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, translations: translationsMap[language], isRTL }}>
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
        {children}
      </View>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
