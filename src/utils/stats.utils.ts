import { StatID } from "../vendors/smogon/damage-calc-dist/data/interface";
import { NatureData } from "../vendors/smogon/pokemon-showdown/sim/dex-data";

export interface ComputeStatParams {
  base: number;
  iv: number;
  ev: number;
  level: number;
  statId: StatID;
  nature?: NatureData;
  effect?: number;
  useChampionsSpreadFormula?: boolean;
}

/**
 * 统一的能力值计算函数
 * - HP: floor(((base * 2 + iv + floor(ev / 4)) * level) / 100 + level + 10)
 * - 其他: floor(((base * 2 + iv + floor(ev / 4)) * level) / 100 + 5)
 *   - 性格修正：plus => *1.1, minus => *0.9（均取floor）
 *   - 属性增减修正(Boost)：>0: (2 + boost) / 2, <=0: 2 / (2 - boost)，再取floor
 */
export function computeStat(params: ComputeStatParams): number {
  const { base, iv, ev, level, statId, nature, effect, useChampionsSpreadFormula } =
    params;

  if (useChampionsSpreadFormula) {
    const normalizedEv = Math.max(0, Math.min(32, Math.floor(ev)));
    if (statId === "hp") {
      return base + normalizedEv + 75;
    }
    let multiplier = 1;
    if (nature) {
      if (nature.plus === statId) {
        multiplier = 1.1;
      } else if (nature.minus === statId) {
        multiplier = 0.9;
      }
    } else if (effect) {
      multiplier = effect;
    }
    return Math.floor((base + normalizedEv + 20) * multiplier);
  }

  if (statId === "hp") {
    return Math.floor(
      ((base * 2 + iv + Math.floor(ev / 4)) * level) / 100 + level + 10
    );
  }

  let stat = Math.floor(
    ((base * 2 + iv + Math.floor(ev / 4)) * level) / 100 + 5
  );

  // 性格修正
  if (nature) {
    if (nature.plus === statId) {
      stat = Math.floor(stat * 1.1);
    } else if (nature.minus === statId) {
      stat = Math.floor(stat * 0.9);
    }
  } else if (effect) {
    stat = Math.floor(stat * effect);
  }
  return stat;
}
