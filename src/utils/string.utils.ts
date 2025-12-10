/**
 * 字符串工具函数
 */

/**
 * 标准化字符串：转换为小写并去除所有特殊符号
 * 用于与showdown.stats.service.ts返回的数据进行匹配
 * @param str 要标准化的字符串
 * @returns 标准化后的字符串
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}
