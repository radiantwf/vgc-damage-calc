import React, { useMemo } from "react";
import "./PokemonMoves.css";
import { usePokemonState } from "../../../../../contexts/PokemonStateContext";
import { useDamageCompute } from "../../../../../contexts/DamageComputeContext";
import { useTranslation } from "react-i18next";
import { getTypeColor } from "../../../../../utils/type.colors";
import ToggleButton from "../../../../../ui/widgets/ToggleButton/ToggleButton";
import { ShowdownDataService } from "../../../../../services/showdown.data.service";
import { usePokemonTranslation } from "../../../../../contexts/usePokemonTranslation";
// 伤害计算已由 DamageComputeContext 提供汇总，组件不再直接计算

interface PokemonMovesProps {
  isAttacker: boolean;
  className?: string;
  tabIndexStart?: number;
}

export const PokemonMoves: React.FC<PokemonMovesProps> = ({
  isAttacker,
  className,
  tabIndexStart,
}) => {
  const {
    selectedMoveIndex,
    setSelectedMoveIndex,
    getGlobalIndexForSideOriginal,
    attackerSideResults,
    defenderSideResults,
  } = useDamageCompute();

  const { translateMove } = usePokemonTranslation();
  const { t } = useTranslation();
  // 侧状态不再用于本组件的伤害计算，统一由 DamageComputeContext 处理

  type MoveDisplay = { name: string; type: string; originalIndex: number; hasMove: boolean };
  const moves: MoveDisplay[] = useMemo(() => {
    const results = isAttacker ? attackerSideResults : defenderSideResults;
    return results.map((r, idx) => {
      if (r && r.move) {
        const name = translateMove(r.move.name as unknown as string);
        const type = (r.move.type as unknown as string)?.toLowerCase() || "normal";
        return { name, type, originalIndex: idx, hasMove: true };
      }
      const name = t("pokemon.noMove");
      const type = "???";
      return { name, type, originalIndex: idx, hasMove: false };
    });
  }, [isAttacker, attackerSideResults, defenderSideResults, translateMove, t]);

  // 将当前侧有效招式映射为全局索引的选项
  const sideOptions = useMemo(() => {
    return moves.map((move) => {
      const globalIdx = getGlobalIndexForSideOriginal(
        isAttacker,
        move.originalIndex
      );
      const key =
        globalIdx !== undefined
          ? globalIdx
          : (isAttacker ? -101 : -201) - move.originalIndex;
      return {
        key,
        label: (
          <div className="pokemon-moves__move-container">
            <div
              className="pokemon-moves__type-indicator"
              style={{ backgroundColor: getTypeColor(move.type) }}
            />
            <span className="pokemon-moves__move-name">{move.name}</span>
          </div>
        ),
      } as { key: number; label: React.ReactNode };
    });
  }, [moves, isAttacker, getGlobalIndexForSideOriginal]);

  const sideSelectedValue = useMemo(() => {
    return sideOptions.some((opt) => opt.key === selectedMoveIndex)
      ? selectedMoveIndex
      : undefined;
  }, [sideOptions, selectedMoveIndex]);

  // 将 CSS 颜色字符串解析为 RGB
  const parseCssColorToRgb = (
    color: string
  ): { r: number; g: number; b: number } | undefined => {
    const c = color.trim();
    if (!c) return undefined;
    // #rrggbb 或 #rgb
    if (c.startsWith("#")) {
      const h = c.slice(1);
      if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return { r, g, b };
      }
      if (h.length === 6) {
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return { r, g, b };
      }
      return undefined;
    }
    // rgb(...) 或 rgba(...)
    const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      const r = parseInt(m[1], 10);
      const g = parseInt(m[2], 10);
      const b = parseInt(m[3], 10);
      return { r, g, b };
    }
    return undefined;
  };

  // 颜色混合：在 start 与 end 之间按 t ∈ [0,1] 插值
  const mixRgb = (
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    t: number
  ): string => {
    const r = Math.round(start.r * (1 - t) + end.r * t);
    const g = Math.round(start.g * (1 - t) + end.g * t);
    const b = Math.round(start.b * (1 - t) + end.b * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // 根据 OHKO 概率对颜色进行插值：
  // 先计算 start_color = mix(impossible, end, 0.3)，再在 start_color 与 end 之间按 p ∈ (0,1] 插值
  const colorFromChance = (p: number): string | undefined => {
    if (!Number.isFinite(p) || p <= 0) return undefined; // 非法或 0% 概率使用默认文本颜色
    const baseline = 0.3; // 渐变起点强度 30%
    const clamped = Math.max(0, Math.min(1, p));

    const root = getComputedStyle(document.documentElement);
    const beginStr = root.getPropertyValue("--damage-ko-color-begin").trim();
    const endStr = root.getPropertyValue("--damage-ko-color").trim();
    const begin = parseCssColorToRgb(beginStr);
    const end = parseCssColorToRgb(endStr);

    if (begin && end) {
      const startColorStr = mixRgb(begin, end, baseline);
      const startColor = parseCssColorToRgb(startColorStr)!; // 一定能解析为 rgb()
      return mixRgb(startColor, end, clamped);
    }

    // 兜底：使用红色强度插值（白→红）
    const t = baseline + (1 - baseline) * clamped; // [0.3, 1]
    const g = Math.round(255 * (1 - t));
    const b = Math.round(255 * (1 - t));
    return `rgb(255, ${g}, ${b})`;
  };

  // 计算当前侧每个招式的伤害区间文本和颜色
  const damageEntries = useMemo(() => {
    const results = isAttacker ? attackerSideResults : defenderSideResults;

    return moves.map((m) => {
      const r = results[m.originalIndex];
      if (!r)
        return {
          text: "",
          color: undefined as string | undefined,
          className: undefined as string | undefined,
        };

      const text = r.getDamageRangeText();
      if (!text)
        return {
          text: "",
          color: undefined as string | undefined,
          className: undefined as string | undefined,
        };

      let color: string | undefined;
      let className: string | undefined;
      const koChance = r.getOhkoChanceValue();
      if (koChance === 1) {
        className = "pokemon-moves__damage-text--ko";
      } else if (koChance === 0) {
        className = "pokemon-moves__damage-text--impossible";
      } else {
        color = colorFromChance(r.getOhkoChanceValue());
      }

      return { text, color, className };
    });
  }, [moves, isAttacker, attackerSideResults, defenderSideResults]);

  const {
    move1z,
    setMove1z,
    move2z,
    setMove2z,
    move3z,
    setMove3z,
    move4z,
    setMove4z,
  } = usePokemonState(isAttacker);
  const zFlags = [move1z, move2z, move3z, move4z];
  const setZFns = [setMove1z, setMove2z, setMove3z, setMove4z];

  return (
    <div
      className={`pokemon-moves ${
        isAttacker ? "pokemon-moves--attacker" : "pokemon-moves--defender"
      } ${className || ""}`}
    >
      <div className="pokemon-moves__container">
        {moves.map((move, index) => {
          const globalIdx = getGlobalIndexForSideOriginal(
            isAttacker,
            move.originalIndex
          );
          const key =
            globalIdx !== undefined
              ? globalIdx
              : (isAttacker ? -101 : -201) - move.originalIndex;
          const isActive = sideSelectedValue === key && move.hasMove;

          const isZ = zFlags[move.originalIndex];
          const zCls = `pokemon-moves__z-image ${
            isZ ? "pokemon-moves__z-image--active" : "pokemon-moves__z-image--inactive"
          }`;

          const edgeClass =
            index === 0
              ? "rounded-top"
              : index === moves.length - 1
              ? "rounded-bottom"
              : "";

          const damageEl = (
            <div
              key={`d-${index}`}
              className={`pokemon-moves__damage-text ${
                damageEntries[index]?.className || ""
              }`}
              style={
                damageEntries[index]?.color
                  ? { color: damageEntries[index]?.color }
                  : undefined
              }
            >
              {damageEntries[index]?.text || ""}
            </div>
          );

          const zEl = (
            <div key={`z-${index}`} className="pokemon-moves__z-container">
              <img
                src={ShowdownDataService.getZMoveImgUrl()}
                alt={t("pokemon.rule.zBadge")}
                className={zCls}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = "hidden";
                }}
                onClick={() => {
                  const setter = setZFns[move.originalIndex];
                  setter(!isZ);
                }}
              />
            </div>
          );

          const buttonEl = (
            <ToggleButton
              key={`b-${index}`}
              label={
                <div className="pokemon-moves__move-container">
                  <div
                    className="pokemon-moves__type-indicator"
                    style={{ backgroundColor: getTypeColor(move.type) }}
                  />
                  <span className="pokemon-moves__move-name">{move.name}</span>
                </div>
              }
              active={isActive}
              disabled={key < 0 || !move.hasMove}
              onClick={() => {
                if (key < 0) return;
                setSelectedMoveIndex(key);
              }}
              className={edgeClass}
              tabIndex={typeof tabIndexStart === "number" ? tabIndexStart + index : undefined}
            />
          );

          const cells = isAttacker ? [damageEl, zEl, buttonEl] : [buttonEl, zEl, damageEl];

          return (
            <div key={index} className="pokemon-moves__row">
              {cells}
            </div>
          );
        })}
      </div>
    </div>
  );
};
