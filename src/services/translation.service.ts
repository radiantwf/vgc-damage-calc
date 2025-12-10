import { Language } from "../i18n/i18n";

// 语言常量定义，避免生产构建时字符串比较问题
const LANGUAGE_ZH: Language = 'zh';

interface TranslationData {
  pokemon: { [key: string]: string };
  item: { [key: string]: string };
  ability: { [key: string]: string };
  move: { [key: string]: string };
  nature: { [key: string]: string };
  type: { [key: string]: string };
}

class TranslationService {
  private cache: Map<string, TranslationData> = new Map();
  private loadingPromises: Map<string, Promise<TranslationData>> = new Map();

  /**
   * 将语言代码映射到文件夹名称
   */
  private getLangCode(language: Language): string {
    return language;
  }

  /**
   * 获取指定语言的翻译数据，如果未缓存则加载
   */
  async getTranslations(language: Language): Promise<TranslationData> {
    const langCode = this.getLangCode(language);
    
    // 如果已经缓存，直接返回
    if (this.cache.has(langCode)) {
      return this.cache.get(langCode)!;
    }

    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(langCode)) {
      return this.loadingPromises.get(langCode)!;
    }

    // 开始加载
    const loadingPromise = this.loadTranslationData(langCode);
    this.loadingPromises.set(langCode, loadingPromise);

    try {
      const data = await loadingPromise;
      this.cache.set(langCode, data);
      this.loadingPromises.delete(langCode);
      return data;
    } catch (error) {
      this.loadingPromises.delete(langCode);
      throw error;
    }
  }

  /**
   * 预加载指定语言的翻译数据
   */
  async preloadTranslations(language: Language): Promise<void> {
    try {
      await this.getTranslations(language);
    } catch (error) {
      console.warn(`Failed to preload translations for ${language}:`, error);
    }
  }

  /**
   * 清除指定语言的缓存
   */
  clearCache(language?: Language): void {
    if (language) {
      const langCode = this.getLangCode(language);
      this.cache.delete(langCode);
      this.loadingPromises.delete(langCode);
    } else {
      this.cache.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * 检查指定语言是否已缓存
   */
  isCached(language: Language): boolean {
    const langCode = this.getLangCode(language);
    return this.cache.has(langCode);
  }

  /**
   * 加载翻译数据
   */
  private async loadTranslationData(langCode: string): Promise<TranslationData> {
    const loadTranslationFile = async (filename: string): Promise<{ [key: string]: string }> => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL || ''}/locales/${langCode}/pokemon/${filename}.${langCode}.json`);
        if (!response.ok) {
          console.warn(`Failed to load ${filename} translations for ${langCode}:`, response.status);
          return {};
        }
        const data = await response.json();
        return data || {};
      } catch (error) {
        console.warn(`Error loading ${filename} translations for ${langCode}:`, error);
        return {};
      }
    };

    // 并行加载所有翻译文件
    const [pokemon, item, ability, move, nature, type] = await Promise.all([
      loadTranslationFile('pokemon'),
      loadTranslationFile('item'),
      loadTranslationFile('ability'),
      loadTranslationFile('move'),
      loadTranslationFile('nature'),
      loadTranslationFile('type')
    ]);

    return {
      pokemon,
      item,
      ability,
      move,
      nature,
      type
    };
  }

  translatePokemonSync(language: Language, pokemonName: string): string {
    if (!pokemonName) return pokemonName;
    const langCode = this.getLangCode(language);
    const data = this.cache.get(langCode);
    const key = pokemonName.toLowerCase().replace(/[^a-z0-9♀♂-]/g, "");
    const dict = data?.pokemon;
    return (dict && dict[key]) ? dict[key] : pokemonName;
  }
  translateAbilitySync(language: Language, abilityName: string): string {
    if (!abilityName) return abilityName;
    const langCode = this.getLangCode(language);
    const data = this.cache.get(langCode);
    const key = abilityName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dict = data?.ability;
    return (dict && dict[key]) ? dict[key] : abilityName;
  }

  translateItemSync(language: Language, itemName: string): string {
    if (!itemName) return itemName;
    const langCode = this.getLangCode(language);
    const data = this.cache.get(langCode);
    const key = itemName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dict = data?.item;
    return (dict && dict[key]) ? dict[key] : itemName;
  }

  translateTypeSync(language: Language, typeName: string): string {
    if (!typeName) return typeName;
    const langCode = this.getLangCode(language);
    const data = this.cache.get(langCode);
    const key = typeName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dict = data?.type;
    return (dict && dict[key]) ? dict[key] : typeName;
  }
  
  translateMoveSync(language: Language, moveName: string): string {
    if (!moveName) return moveName;
    const langCode = this.getLangCode(language);
    const data = this.cache.get(langCode);
    const key = moveName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dict = data?.move;
    return (dict && dict[key]) ? dict[key] : moveName;
  }
}

// 导出单例实例
export const translationService = new TranslationService();
export type { TranslationData };
