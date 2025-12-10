import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 语言常量定义
export const SUPPORTED_LANGUAGES = ['zh', 'en', 'ja'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// 导出 Language 类型以便其他模块使用
export { Language as LanguageType };

// 默认语言
export const DEFAULT_LANGUAGE: Language = 'zh';

// 获取系统语言并确定默认语言
const getInitialLanguage = (): Language => {
  // 首先检查localStorage中是否有保存的语言设置
  const storedLang = localStorage.getItem('language');
  if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as Language)) {
    return storedLang as Language;
  }
  
  // 获取系统语言
  const systemLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // 语言映射：将完整语言代码映射到支持的语言
  const langMap: Record<string, Language> = {
    'zh-CN': 'zh',
    'zh-TW': 'zh', 
    'zh-HK': 'zh',
    'zh-SG': 'zh',
    'zh': 'zh',
    'en-US': 'en',
    'en-GB': 'en',
    'en-AU': 'en',
    'en-CA': 'en',
    'en': 'en',
    'ja-JP': 'ja',
    'ja': 'ja',
  };
  
  // 检查系统语言是否为简体中文相关
  if (systemLang.startsWith('zh') || systemLang === 'zh') {
    return 'zh';
  }

  // 检查是否为日语
  if (systemLang.startsWith('ja') || systemLang === 'ja') {
    return 'ja';
  }

  // 其他情况默认使用英语
  return 'en';
};

// 获取初始语言
const initialLanguage = getInitialLanguage();

i18n
  // 加载后端资源
  .use(Backend)
  // 检测用户语言
  .use(LanguageDetector)
  // 传递 i18n 实例给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    // 默认语言（使用预先读取的语言）
    lng: initialLanguage,
    // 回退语言
    fallbackLng: DEFAULT_LANGUAGE,
    // 支持的语言
    supportedLngs: SUPPORTED_LANGUAGES,
    // 调试模式（生产环境下关闭）
    debug: false, // 关闭调试模式
    
    // 语言检测配置
    detection: {
      // 检测顺序：localStorage -> 浏览器语言
      order: ['localStorage', 'navigator'],
      // 缓存到 localStorage
      caches: ['localStorage'],
      // localStorage 键名
      lookupLocalStorage: 'language',
      // 从路径中查找语言的索引
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },
    
    // 后端配置
    backend: {
      // 资源文件路径（支持命名空间）
      loadPath: `${process.env.PUBLIC_URL || ''}/locales/{{lng}}/{{ns}}.{{lng}}.json`,
    },
    
    // 语言映射配置
    load: 'languageOnly', // 只加载语言部分，忽略地区代码
    
    // 语言映射：将完整的语言代码映射到简化版本
    cleanCode: true,
    
    // 插值配置
    interpolation: {
      // React 已经默认转义了，所以不需要 i18next 转义
      escapeValue: false,
    },
    
    // 命名空间配置
    ns: ['app', 'calc/damage_result'],
    defaultNS: 'app',

    // 键分隔符（支持嵌套键）
    keySeparator: '.',

    // 禁用命名空间分隔符
    nsSeparator: false,
  });

const mergeIntoDefault = (lng: Language) => {
  const defaultNS = 'app';
  const order: ReadonlyArray<string> = ['app', 'calc/damage_result'];
  order.forEach(ns => {
    if (i18n.hasResourceBundle(lng, ns)) {
      const bundle = i18n.getResourceBundle(lng, ns) as Record<string, unknown>;
      i18n.addResourceBundle(lng, defaultNS, bundle, true, true);
    }
  });
};

i18n.loadNamespaces(['app', 'calc/damage_result']).then(() => {
  mergeIntoDefault(i18n.language as Language);
});

i18n.on('languageChanged', (lng) => {
  i18n.loadNamespaces(['app', 'calc/damage_result']).then(() => {
    mergeIntoDefault(lng as Language);
  });
});

export default i18n;
