import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/i18n';
import '../i18n/i18n'; // 确保 i18next 被初始化

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  t: (key: string) => string;
  ready: boolean;
  // 为了向后兼容，提供 strings 对象
  strings: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n, t, ready } = useTranslation();
  
  // 语言映射函数：将完整语言代码映射到支持的语言
  const mapLanguageCode = (langCode: string): Language => {
    if (!langCode) return DEFAULT_LANGUAGE;
    
    // 直接匹配
    if (SUPPORTED_LANGUAGES.includes(langCode as Language)) {
      return langCode as Language;
    }
    
    // 映射规则
    const langMap: Record<string, Language> = {
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'zh-HK': 'zh',
      'zh-SG': 'zh',
      'en-US': 'en',
      'en-GB': 'en',
      'en-AU': 'en',
      'en-CA': 'en',
      'ja-JP': 'ja',
    };
    
    // 检查是否以 zh 开头
    if (langCode.startsWith('zh')) {
      return 'zh';
    }
    
    // 检查是否以 en 开头
    if (langCode.startsWith('en')) {
      return 'en';
    }

    // 检查是否以 ja 开头
    if (langCode.startsWith('ja')) {
      return 'ja';
    }
    
    return langMap[langCode] || DEFAULT_LANGUAGE;
  };
  
  // 确保返回的语言经过映射处理
  const language = mapLanguageCode(i18n.language) as Language;
  const isLoading = !ready;

  // 初始化时检查localStorage并设置语言
  useEffect(() => {
    // 只在i18n完全准备好后才进行检查
    if (!ready) {
      return;
    }
    
    // 检查两个可能的localStorage键名
    const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng');
    const mappedLang = mapLanguageCode(storedLang || '');
    const currentMappedLang = mapLanguageCode(i18n.language);
    
    // 如果localStorage中有有效的语言设置，但i18n的语言不匹配，则主动设置
    if (currentMappedLang !== mappedLang) {
      i18n.changeLanguage(mappedLang);
    }
  }, [i18n, ready]);
  
  const setLanguage = (lang: Language) => {
    // 保存到localStorage并切换语言（使用与i18n.ts一致的键名）
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
  };
  
  // 为了向后兼容，创建 strings 对象
  const strings = new Proxy({} as Record<string, string>, {
    get: (target, prop: string) => {
      return t(prop);
    }
  });
  
  // 确保语言在支持的语言列表中
  useEffect(() => {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
  }, [language, i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, t, ready, strings }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
