import { pinyin } from "pinyin-pro";

/**
 * 拼音工具类
 * 提供获取中文字符串拼音首字母的方法，用于搜索和排序
 */
export class AppPinyin {
  /**
   * 获取字符串的拼音首字母
   *
   * @param text 输入的中文或其他语言文本
   * @param caseSensitive 是否区分大小写，默认为false，返回小写字母
   * @returns 拼音首字母字符串
   */
  private static _getFirstLetters(
    text: string,
    separator: string = "",
    caseSensitive: boolean = false
  ): string {
    if (!text) return "";

    // 将文本转换为拼音，获取首字母
    // 获取完整拼音
    const pinyinArray = pinyin(text, {
      toneType: "none", // 获取完整拼音
      type: "array",
    });

    // 提取每个拼音的首字母
    const firstLetters = pinyinArray
      .map((syllable) => (syllable.length > 0 ? syllable.charAt(0) : ""))
      .join(separator);

    return caseSensitive ? firstLetters : firstLetters.toLowerCase();
  }

  /**
   * 获取完整拼音
   *
   * @param text 输入的中文或其他语言文本
   * @param separator 拼音之间的分隔符，默认为空字符串
   * @param caseSensitive 是否区分大小写，默认为false，返回小写字母
   * @returns 完整拼音字符串
   */
  private static _getFullPinyin(
    text: string,
    separator: string = "",
    caseSensitive: boolean = false
  ): string {
    if (!text) return "";

    const pinyinResult = pinyin(text, {
      toneType: "none",
      separator: separator,
    });

    return caseSensitive ? pinyinResult : pinyinResult.toLowerCase();
  }

  /**
   * 判断字符串是否包含中文
   * @param text 输入文本
   * @returns 是否包含中文字符
   */
  private static _containsChinese(text: string): boolean {
    // 中文字符的Unicode范围
    const chineseReg = /[\u4e00-\u9fa5]/;
    return chineseReg.test(text);
  }

  /**
   * 获取适合搜索的关键词
   * 返回原始文本、拼音首字母和完整拼音的组合，以提高搜索匹配率
   *
   * @param text 输入的文本
   * @returns 对中文文本，返回 "原文 + 拼音首字母 + 完整拼音"；对非中文文本，仅返回原文
   */
  static getSearchKeywords(text: string): string {
    if (!text) return "";

    if (this._containsChinese(text)) {
      // 多音字处理
      let processedText = text
        .replace(/长毛/g, "常毛")
        .replace(/藏玛/g, "脏玛")
        .replace(/双弹/g, "双蛋")
        .replace(/真气弹/g, "真气蛋")
        .replace(/Ｄ/g, "D")
        .replace(/・/g, "");

      const firstLetters = this._getFirstLetters(processedText);
      const fullPinyin = this._getFullPinyin(processedText);

      // 合并为搜索关键字
      return `${firstLetters}|${fullPinyin}`;
    }

    return text;
  }
}
