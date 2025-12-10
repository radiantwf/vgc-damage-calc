// 宝可梦属性颜色映射
export const TYPE_COLORS: Record<string, string> = {
  // 基础属性
  normal: "#A0A19F",
  fire: "#BC4D34",
  water: "#627FE6",
  electric: "#E4C447",
  grass: "#6C9C41",
  ice: "#95D2FA",
  fighting: "#DA8E35",
  poison: "#824EC3",
  ground: "#7D572C",
  flying: "#9DB7EA",
  psychic: "#C75E79",
  bug: "#949F3C",
  rock: "#ACA986",
  ghost: "#64466D",
  dragon: "#6262D8",
  dark: "#4B4240",
  steel: "#7F9EB5",
  fairy: "#D081E7",
};
/**
 * 获取属性对应的颜色
 * @param type 属性名称
 * @returns 颜色值
 */
export const getTypeColor = (type: string): string => {
  const normalizedType = type.toLowerCase().trim();
  return TYPE_COLORS[normalizedType] || "#A0A19F"; // 默认颜色
};

/**
 * 获取Stellar太晶属性的彩虹色（所有属性颜色混合）
 * @returns 彩虹色渐变字符串
 */
export const getStellarRainbowColor = (): string => {
  const colors = Object.values(TYPE_COLORS);
  return `linear-gradient(90deg, ${colors.join(", ")})`;
};

/**
 * 获取属性对应的文本颜色（用于确保对比度）
 * @param type 属性名称
 * @returns 文本颜色
 */
export const getTypeTextColor = (type: string): string => {
  const normalizedType = type.toLowerCase().trim();
  // 深色背景使用白色文字，浅色背景使用黑色文字
  const darkTypes = ["fighting", "poison", "ghost", "dragon", "dark", "steel"];
  return darkTypes.includes(normalizedType) ? "#CECECE" : "#222222";
};

/**
 * 获取Stellar太晶属性的彩虹色（所有属性颜色混合）
 * @returns 彩虹色渐变字符串
 */
export const getStellarRainbowColor2 = (): string => {
  const colors = Object.values(TYPE_COLORS);
  return `linear-gradient(180deg, ${colors.join(", ")})`;
};
