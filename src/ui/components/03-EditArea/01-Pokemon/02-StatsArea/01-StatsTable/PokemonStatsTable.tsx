import "./PokemonStatsTable.css";
import EditAreaProps from "../../../Props/EditAreaProps";
import Slider from "../../../../../widgets/Slider/Slider";
import NumberInput from "../../../../../widgets/NumberInput/NumberInput";
import EVInput from "../../../../../widgets/EVInput/EVInput";
import SearchableDropdown, {
  DropdownItem,
} from "../../../../../widgets/SearchableDropdown/SearchableDropdown";
import { usePokemonState } from "../../../../../../contexts/PokemonStateContext";
import { usePokemonMovesets } from "../../../../../../contexts/PokemonMovesetsContext";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { usePokemonTranslation } from "../../../../../../contexts/usePokemonTranslation";
import {
  StatID,
  StatIDExceptHP,
} from "../../../../../../vendors/smogon/damage-calc-dist/data/interface";
import { ShowdownDataService } from "../../../../../../services/showdown.data.service";
import { NatureData } from "../../../../../../vendors/smogon/pokemon-showdown/sim/dex-data";
import { computeStat } from "../../../../../../utils/stats.utils";
import { useTranslation } from "react-i18next";

const PokemonStatsTable: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const { t, i18n } = useTranslation();
  // 获取Pokemon状态
  const {
    pokemonSpecies,
    isDynamaxed,
    level,
    setLevel,
    nature,
    setNature,
    evs,
    setEvs,
    ivs,
    setIvs,
    boosts,
    setBoosts,
    currentHP,
    setCurrentHP,
    maxHP,
    modifiedBaseStats,
    setModifiedBaseStats,
  } = usePokemonState(isAttacker);

  // 获取 movesets 数据
  const { chaosSpread1, chaosSpread2 } = usePokemonMovesets(isAttacker);

  const { translateNature } = usePokemonTranslation();

  // 手动符号覆盖：当用户删除一个符号时，保留另一个符号的显示（不依赖性格）
  const [manualSigns, setManualSigns] = useState<
    Partial<Record<StatIDExceptHP, "+" | "-">>
  >({});
  // 在删除符号后进入“性格符号编辑抑制状态”，隐藏性格派生符号；当用户再次输入符号并完成匹配后退出抑制
  const [suppressNatureSigns, setSuppressNatureSigns] =
    useState<boolean>(false);
  // 防抖：删除符号后会把性格设为 serious，这次性格变化不应自动退出抑制；下一次（用户通过下拉或 meta 改性格）才退出抑制
  const skipExitOnNatureChangeRef = useRef<boolean>(false);
  const arrowEVChangeRef = useRef<Partial<Record<StatID, boolean>>>({});

  // 定义属性顺序
  const statOrder: StatID[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  const tabBase = isAttacker ? 320000 : 330000;
  const statsTabStartIndex = tabBase + 100;
  const natureTabIndex = statsTabStartIndex;
  const baseTabStart = statsTabStartIndex + 10;
  const ivTabStart = statsTabStartIndex + 20;
  const sliderTabStart = statsTabStartIndex + 30;
  const evInputTabStart = statsTabStartIndex + 40;
  const boostTabStart = statsTabStartIndex + 50;
  const statLabels: Record<StatID, string> = useMemo(() => {
    return {
      hp: t("stats.hp"),
      atk: t("stats.atk"),
      def: t("stats.def"),
      spa: t("stats.spa"),
      spd: t("stats.spd"),
      spe: t("stats.spe"),
    };
  }, [i18n.language]);

  // 获取基础属性值
  const baseStats = useMemo(() => {
    if (!pokemonSpecies?.value?.baseStats) {
      return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    }
    return pokemonSpecies.value.baseStats;
  }, [pokemonSpecies]);

  // 计算努力值剩余点数
  const remainingEvs = useMemo(() => {
    const totalEvs = Object.values(evs).reduce((sum, ev) => sum + ev, 0);
    return 508 - totalEvs;
  }, [evs]);

  const totalBaseStatsOriginal = useMemo(() => {
    return Object.values(baseStats).reduce((sum, stat) => sum + stat, 0);
  }, [baseStats]);

  const [editingBase, setEditingBase] = useState<
    Partial<Record<StatID, boolean>>
  >({});

  const actualBaseStats = useMemo(() => {
    return {
      hp: modifiedBaseStats.hp >= 0 ? modifiedBaseStats.hp : baseStats.hp,
      atk: modifiedBaseStats.atk >= 0 ? modifiedBaseStats.atk : baseStats.atk,
      def: modifiedBaseStats.def >= 0 ? modifiedBaseStats.def : baseStats.def,
      spa: modifiedBaseStats.spa >= 0 ? modifiedBaseStats.spa : baseStats.spa,
      spd: modifiedBaseStats.spd >= 0 ? modifiedBaseStats.spd : baseStats.spd,
      spe: modifiedBaseStats.spe >= 0 ? modifiedBaseStats.spe : baseStats.spe,
    } as Record<StatID, number>;
  }, [modifiedBaseStats, baseStats]);

  const totalBaseStatsActual = useMemo(() => {
    return Object.values(actualBaseStats).reduce((sum, stat) => sum + stat, 0);
  }, [actualBaseStats]);

  const [evUsagePercentMap, setEvUsagePercentMap] = useState<
    Record<StatID, number>
  >({
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  });
  const [evLowerPercentMap, setEvLowerPercentMap] = useState<
    Record<StatID, number>
  >({
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  });
  const [evHigherPercentMap, setEvHigherPercentMap] = useState<
    Record<StatID, number>
  >({
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  });

  useEffect(() => {
    const nextUsage: Record<StatID, number> = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };
    const nextLower: Record<StatID, number> = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };
    const nextHigher: Record<StatID, number> = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    statOrder.forEach((statId) => {
      const chaosStatMap = chaosSpread2?.get(statId);
      if (!chaosStatMap) {
        nextUsage[statId] = 0;
        nextLower[statId] = 0;
        nextHigher[statId] = 0;
        return;
      }

      const ev = evs[statId] ?? 0;
      const currentKey = computeStat({
        base: baseStats[statId === "hp" ? "hp" : statId],
        iv: 31,
        ev,
        level: level,
        statId,
        nature: statId !== "hp" ? nature : undefined,
      });
      let usage = chaosStatMap.get(currentKey) || 0;
      if (!usage || usage === 0) {
        const keys = Array.from(chaosStatMap.keys());
        let nearestValue = 0;
        let minDiff = Infinity;
        for (const k of keys) {
          const diff = Math.abs(k - currentKey);
          if (diff < minDiff) {
            minDiff = diff;
            nearestValue = chaosStatMap.get(k) || 0;
          }
        }
        if (minDiff < 1e-6) {
          usage = nearestValue;
        }
      }
      nextUsage[statId] = usage;

      let lower = 0;
      let higher = 0;
      chaosStatMap.forEach((percent, key) => {
        if (key < currentKey) lower += percent;
        else if (key > currentKey) higher += percent;
      });
      nextLower[statId] = lower;
      nextHigher[statId] = higher;
    });

    setEvUsagePercentMap(nextUsage);
    setEvLowerPercentMap(nextLower);
    setEvHigherPercentMap(nextHigher);
  }, [chaosSpread2, evs, nature]);

  const NatureDisplayContentFC = useMemo(
    () => (props: { item: DropdownItem }) => {
      const item = props?.item;
      const natureKey = item.key;
      const text = translateNature(natureKey) || natureKey;
      const usagePercentage =
        (chaosSpread1 || []).find(
          (usage) => usage.nature.name.toLowerCase() === item.key.toLowerCase()
        )?.percentage || 0;
      return (
        <div className="ps_ta-nature-dropdown-item">
          <span className="ps_ta-nature-dropdown-name">{text}</span>
          <span className="ps_ta-nature-dropdown-usage">
            {usagePercentage > 0 && `${(usagePercentage * 100).toFixed(3)}%`}
          </span>
        </div>
      );
    },
    [chaosSpread1, translateNature]
  );

  const NatureDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const text = translateNature(item.key) || item.key;
        const usagePercentage =
          (chaosSpread1 || []).find(
            (usage) =>
              usage.nature.name.toLowerCase() === item.key.toLowerCase()
          )?.percentage || 0;
        return (
          <div className="ps_ta-nature-dropdown-item">
            <span className="ps_ta-nature-dropdown-name">{text}</span>
            <span className="ps_ta-nature-dropdown-usage">
              {usagePercentage > 0 && `${(usagePercentage * 100).toFixed(3)}%`}
            </span>
          </div>
        );
      },
    [chaosSpread1, translateNature]
  );

  // 创建性格下拉选项数据
  const natureDropdownItems = useMemo(() => {
    const natures = ShowdownDataService.Natures;
    if (!natures) {
      return [];
    }

    const items: DropdownItem[] = [];

    if (chaosSpread1 && chaosSpread1.length > 1) {
      // 创建使用率映射
      const usageMap = new Map<NatureData, number>();
      chaosSpread1.forEach((usage) => {
        usageMap.set(usage.nature, usage.percentage);
      });
      const sortedNaturesList = Object.entries(natures).sort((a, b) => {
        const usageA = usageMap.get(a[1]) || 0; // 没有使用率数据的排在后面
        const usageB = usageMap.get(b[1]) || 0;
        return usageB - usageA; // 按使用率降序排列（使用率越高越靠前）
      });
      return sortedNaturesList.map(([natureKey, nature]) => {
        return {
          key: natureKey,
          value: nature,
          displayContentFC: NatureDisplayContentFC,
          dropdownItemFC: NatureDropdownItem,
        };
      });
    }

    Object.entries(natures).forEach(([natureKey, nature]) => {
      items.push({
        key: natureKey,
        value: nature,
        displayContentFC: NatureDisplayContentFC,
        dropdownItemFC: NatureDropdownItem,
      });
    });
    return items;
  }, [NatureDisplayContentFC, NatureDropdownItem]);

  // useEffect(() => {
  //   setNature(natureDropdownItems[0].value);
  // }, [natureDropdownItems]);

  // 计算最终属性值
  const finalStats = useMemo(() => {
    const stats: Record<StatID, number> = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    statOrder.forEach((statId) => {
      const base = actualBaseStats[statId] || 0;
      const iv = ivs[statId] || 0;
      const ev = evs[statId] || 0;
      stats[statId] = computeStat({ base, iv, ev, level, statId, nature });
    });

    return stats;
  }, [actualBaseStats, ivs, evs, level, nature, statOrder]);

  // 处理性格选择事件
  const handleNatureChange = useCallback(
    (selectedValue: unknown) => {
      if (
        selectedValue &&
        typeof selectedValue === "object" &&
        "name" in selectedValue
      ) {
        setNature(selectedValue as typeof nature);
        // 通过下拉/菜单选择性格：结束编辑抑制，清空手动符号覆盖，按选择性格补齐符号
        setSuppressNatureSigns(false);
        setManualSigns({});
      }
    },
    [setNature, setSuppressNatureSigns, setManualSigns]
  );

  // 辅助：根据plus/minus选择性格（尽量保留另一端原值，若冲突则选择稳定默认）
  const resolveNatureByPlusMinus = useCallback(
    (
      nextPlus: StatIDExceptHP | undefined,
      nextMinus: StatIDExceptHP | undefined
    ): NatureData => {
      const natures = ShowdownDataService.Natures;
      // 首选：同时匹配plus/minus的性格
      const exact = Object.values(natures).find(
        (n) =>
          (n.plus as StatIDExceptHP | undefined) === nextPlus &&
          (n.minus as StatIDExceptHP | undefined) === nextMinus
      );
      if (exact) return exact;
      // 若冲突（相等），进行稳定默认处理
      if (nextPlus && nextMinus && nextPlus === nextMinus) {
        // 默认将minus设为"spa"（若plus为spa，则minus设为"def"）
        const fallbackMinus: StatIDExceptHP =
          nextPlus === "spa" ? "def" : "spa";
        const fallbackExact = Object.values(natures).find(
          (n) =>
            (n.plus as StatIDExceptHP | undefined) === nextPlus &&
            (n.minus as StatIDExceptHP | undefined) === fallbackMinus
        );
        if (fallbackExact) return fallbackExact;
      }
      // 次选：仅匹配plus
      if (nextPlus) {
        const plusOnly = Object.values(natures).find(
          (n) => (n.plus as StatIDExceptHP | undefined) === nextPlus
        );
        if (plusOnly) return plusOnly;
      }
      // 次选：仅匹配minus
      if (nextMinus) {
        const minusOnly = Object.values(natures).find(
          (n) => (n.minus as StatIDExceptHP | undefined) === nextMinus
        );
        if (minusOnly) return minusOnly;
      }
      // 兜底：serious
      return natures["serious"];
    },
    []
  );

  // 监听性格变化：当通过下拉或 meta 菜单改变性格时，结束性格编辑抑制并清空手动覆盖，按照选择性格补齐符号
  useEffect(() => {
    if (suppressNatureSigns) {
      if (skipExitOnNatureChangeRef.current) {
        // 本次由“删除符号”触发的性格变化，跳过一次退出抑制
        skipExitOnNatureChangeRef.current = false;
      } else {
        setSuppressNatureSigns(false);
        setManualSigns({});
      }
    }
  }, [nature]);

  return (
    <div className="ps_ta-table">
      <div className="ps_ta-table-title">
        <div className="ps_ta-title-tag"></div>
        <div />
        <div className="ps_ta-title-base">{t("stats.base")}</div>
        <div />
        <div className="ps_ta-title-iv">{t("stats.ivs")}</div>
        <div />
        <div className="ps_ta-title-ev">{t("stats.evs")}</div>
        <div />
        <div className="ps_ta-title-nature">
          <span className="ps_ta-title-nature-label">
            {t("pokemon.nature")}:
          </span>
          <SearchableDropdown
            items={natureDropdownItems}
            value={nature}
            placeholder={t("pokemon.selectNature")}
            onChange={handleNatureChange}
            className="ps_ta-nature"
            dropdownClassName="ps_ta-nature-dropdown"
            tabIndex={natureTabIndex}
          />
        </div>
      </div>
      {statOrder.map((statId, idx) => {
        const ev = evs[statId] ?? 0;
        const isPlus = statId !== "hp" && nature.plus === statId;
        const isMinus = statId !== "hp" && nature.minus === statId;
        const signFromNature =
          statId !== "hp" ? (isPlus ? "+" : isMinus ? "-" : "") : "";
        const manualSign =
          statId !== "hp" ? manualSigns[statId as StatIDExceptHP] ?? "" : "";
        const signForDisplay =
          statId !== "hp"
            ? manualSign || (suppressNatureSigns ? "" : signFromNature)
            : "";
        const evDisplay =
          ev === 0 && signForDisplay
            ? signForDisplay
            : `${ev}${signForDisplay}`;
        const colorClass = isPlus
          ? "ps_ta-color-plus"
          : isMinus
          ? "ps_ta-color-minus"
          : "";
        const baseClass = statId !== "hp" ? colorClass : "";
        const evPercentClass = colorClass;
        const finalStatClass = colorClass;
        const boostValue =
          statId !== "hp" ? boosts[statId as StatIDExceptHP] || 0 : 0;
        const boostClass =
          statId !== "hp"
            ? boostValue > 0
              ? "ps_ta-boost-positive"
              : boostValue < 0
              ? "ps_ta-boost-negative"
              : ""
            : "";

        const evUsagePercent = evUsagePercentMap[statId] ?? 0;
        const evLowerPercent = evLowerPercentMap[statId] ?? 0;
        const evHigherPercent = evHigherPercentMap[statId] ?? 0;

        return (
          <div key={statId} className="ps_ta-row">
            <div className={`ps_ta-row-tag ${colorClass}`}>
              {statLabels[statId]}
            </div>
            {statId === "hp" ? (
              <div
                className="ps_ta-row-base"
                style={
                  editingBase.hp
                    ? { width: 40 }
                    : modifiedBaseStats.hp >= 0 &&
                      modifiedBaseStats.hp !== baseStats.hp
                    ? { color: "var(--accent-warning)" }
                    : undefined
                }
                onDoubleClick={() => {
                  if (pokemonSpecies)
                    setEditingBase((prev) => ({ ...prev, hp: true }));
                }}
              >
                {editingBase.hp ? (
                  <NumberInput
                    autoFocus={true}
                    value={
                      modifiedBaseStats.hp >= 0
                        ? modifiedBaseStats.hp
                        : baseStats.hp
                    }
                    step={1}
                    min={1}
                    max={1000}
                    onChange={(value) => {
                      setModifiedBaseStats({
                        ...modifiedBaseStats,
                        hp: value ?? -1,
                      });
                    }}
                    onBlur={() => {
                      setEditingBase((prev) => ({ ...prev, hp: false }));
                    }}
                    tabIndex={baseTabStart + idx}
                  />
                ) : (
                  actualBaseStats[statId]
                )}
              </div>
            ) : (
              <div />
            )}
            {statId !== "hp" ? (
              <div
                className={`ps_ta-row-base ${baseClass}`}
                style={
                  editingBase[statId]
                    ? { width: 40 }
                    : modifiedBaseStats[statId] >= 0 &&
                      modifiedBaseStats[statId] !== baseStats[statId]
                    ? { color: "var(--accent-warning)" }
                    : undefined
                }
                onDoubleClick={() => {
                  if (pokemonSpecies)
                    setEditingBase((prev) => ({ ...prev, [statId]: true }));
                }}
              >
                {editingBase[statId] ? (
                  <NumberInput
                    autoFocus={true}
                    value={
                      (modifiedBaseStats[statId] ?? -1) >= 0
                        ? (modifiedBaseStats[statId] as number)
                        : actualBaseStats[statId]
                    }
                    step={1}
                    min={1}
                    max={1000}
                    onChange={(value) => {
                      setModifiedBaseStats({
                        ...modifiedBaseStats,
                        [statId]: value ?? -1,
                      });
                    }}
                    onBlur={() => {
                      setEditingBase((prev) => ({ ...prev, [statId]: false }));
                    }}
                    tabIndex={baseTabStart + idx}
                  />
                ) : (
                  actualBaseStats[statId]
                )}
              </div>
            ) : (
              <div />
            )}
            <div className="ps_ta-row-iv">
              <NumberInput
                value={ivs[statId]}
                step={1}
                min={0}
                max={31}
                onChange={(value) => {
                  setIvs({ ...ivs, [statId]: value || 0 });
                }}
                tabIndex={ivTabStart + idx}
              />
            </div>
            <div className="ps_ta-row-ev-slider">
              <Slider
                min={0}
                max={252}
                step={4}
                value={evs[statId]}
                onChange={(value) => {
                  // Slider 仅处理数值变化，不处理 +/- 性格符号编辑
                  const numValue =
                    typeof value === "number" ? value : Number(value) || 0;
                  const clamped = Math.min(Math.max(numValue, 0), 252);
                  setEvs({
                    ...evs,
                    [statId]: clamped,
                  });
                }}
                tabIndex={sliderTabStart + idx}
              />
            </div>
            <div className="ps_ta-row-ev">
              <EVInput
                value={evDisplay}
                min={0}
                max={252}
                step={4}
                allowPlusMinus={statId !== "hp"}
                onIncrement={() => {
                  arrowEVChangeRef.current[statId] = true;
                }}
                onDecrement={() => {
                  arrowEVChangeRef.current[statId] = true;
                }}
                getNextEVForStatChange={(direction, currentEV, ctx) => {
                  const { min, max, step } = ctx;
                  const clamp = (x: number) => Math.min(Math.max(x, min), max);
                  const startEV = clamp(currentEV);
                  const base = baseStats[statId];
                  const iv = ivs[statId] ?? 31;
                  const currentStat = computeStat({
                    base,
                    iv,
                    ev: startEV,
                    level,
                    statId: statId,
                    nature: statId !== "hp" ? nature : undefined,
                  });

                  if (direction === "up") {
                    for (let ev = startEV + step; ev <= max; ev += step) {
                      const nextStat = computeStat({
                        base,
                        iv,
                        ev,
                        level,
                        statId: statId,
                        nature: statId !== "hp" ? nature : undefined,
                      });
                      if (nextStat > currentStat) return ev;
                    }
                    return max;
                  } else {
                    let firstChangeEv: number | undefined = undefined;
                    let targetStat: number | undefined = undefined;
                    for (let ev = startEV - step; ev >= min; ev -= step) {
                      const nextStat = computeStat({
                        base,
                        iv,
                        ev,
                        level,
                        statId: statId,
                        nature: statId !== "hp" ? nature : undefined,
                      });
                      if (nextStat < currentStat) {
                        firstChangeEv = ev;
                        targetStat = nextStat;
                        break;
                      }
                    }
                    if (firstChangeEv === undefined || targetStat === undefined)
                      return min;
                    let bestEv = firstChangeEv;
                    for (let ev = bestEv - step; ev >= min; ev -= step) {
                      const statAtEv = computeStat({
                        base,
                        iv,
                        ev,
                        level,
                        statId: statId,
                        nature: statId !== "hp" ? nature : undefined,
                      });
                      if (statAtEv === targetStat) {
                        bestEv = ev;
                      } else {
                        break;
                      }
                    }
                    return bestEv;
                  }
                }}
                onChange={(written) => {
                  const str = written ?? "";
                  const hasPlus = statId !== "hp" && str.includes("+");
                  const hasMinus = statId !== "hp" && str.includes("-");
                  const numParsed = str.replace(/[+-]/g, "");
                  const parsed =
                    numParsed === "" ? NaN : parseInt(numParsed, 10);
                  const numValue = !isNaN(parsed) ? parsed : 0;
                  const clamped = Math.min(Math.max(numValue, 0), 252);
                  setEvs({
                    ...evs,
                    [statId]: clamped,
                  });
                  const isArrowChange =
                    arrowEVChangeRef.current[statId] === true;
                  if (isArrowChange) {
                    arrowEVChangeRef.current[statId] = false;
                  }
                  if (statId !== "hp") {
                    if (hasPlus || hasMinus) {
                      // 当存在符号输入时，区分抑制状态与非抑制状态的行为
                      if (suppressNatureSigns) {
                        // 抑制状态：只移动/唯一化当前符号，不进行性格重匹配；若两端符号都存在则触发重匹配并退出抑制
                        let nextManual: Partial<
                          Record<StatIDExceptHP, "+" | "-">
                        > = {};
                        if (hasPlus && !hasMinus) {
                          // 保留所有 '-'，清除所有 '+'，将 '+' 移动到当前行
                          for (const [k, v] of Object.entries(manualSigns)) {
                            if (v === "-")
                              nextManual[k as StatIDExceptHP] = "-";
                          }
                          nextManual[statId as StatIDExceptHP] = "+";
                        } else if (hasMinus && !hasPlus) {
                          // 保留所有 '+'，清除所有 '-'，将 '-' 移动到当前行
                          for (const [k, v] of Object.entries(manualSigns)) {
                            if (v === "+")
                              nextManual[k as StatIDExceptHP] = "+";
                          }
                          nextManual[statId as StatIDExceptHP] = "-";
                        }
                        const manualPlusKey = Object.entries(nextManual).find(
                          ([_, v]) => v === "+"
                        )?.[0] as StatIDExceptHP | undefined;
                        const manualMinusKey = Object.entries(nextManual).find(
                          ([_, v]) => v === "-"
                        )?.[0] as StatIDExceptHP | undefined;
                        if (manualPlusKey && manualMinusKey) {
                          // 两端符号都具备：重匹配性格并退出抑制
                          const nextNature = resolveNatureByPlusMinus(
                            manualPlusKey,
                            manualMinusKey
                          );
                          setNature(nextNature);
                          setSuppressNatureSigns(false);
                          setManualSigns({});
                        } else {
                          // 仅有一个符号：保持抑制状态与 serious，自定义符号仅在当前行显示
                          setManualSigns(nextManual);
                          if (
                            nature !== ShowdownDataService.Natures["serious"]
                          ) {
                            skipExitOnNatureChangeRef.current = true;
                            setNature(ShowdownDataService.Natures["serious"]);
                          }
                          setSuppressNatureSigns(true);
                        }
                      } else {
                        const oldPlus = nature.plus as
                          | StatIDExceptHP
                          | undefined;
                        const oldMinus = nature.minus as
                          | StatIDExceptHP
                          | undefined;
                        const isSerious = !oldPlus && !oldMinus;
                        if (isSerious && hasPlus !== hasMinus) {
                          const onlySign = hasPlus ? "+" : "-";
                          const nextManual: Partial<
                            Record<StatIDExceptHP, "+" | "-">
                          > = {
                            [statId as StatIDExceptHP]: onlySign,
                          };
                          setManualSigns(nextManual);
                          if (
                            nature !== ShowdownDataService.Natures["serious"]
                          ) {
                            skipExitOnNatureChangeRef.current = true;
                            setNature(ShowdownDataService.Natures["serious"]);
                          }
                          setSuppressNatureSigns(true);
                          return;
                        }

                        const manualPlusEntry = Object.entries(
                          manualSigns
                        ).find(([_, v]) => v === "+");
                        const manualMinusEntry = Object.entries(
                          manualSigns
                        ).find(([_, v]) => v === "-");
                        const manualPlus = manualPlusEntry
                          ? (manualPlusEntry[0] as StatIDExceptHP)
                          : undefined;
                        const manualMinus = manualMinusEntry
                          ? (manualMinusEntry[0] as StatIDExceptHP)
                          : undefined;

                        let nextPlus = oldPlus;
                        let nextMinus = oldMinus;
                        if (hasPlus) nextPlus = statId as StatIDExceptHP;
                        if (hasMinus) nextMinus = statId as StatIDExceptHP;
                        if (hasPlus && !hasMinus) {
                          nextMinus = manualMinus ?? oldMinus;
                        }
                        if (hasMinus && !hasPlus) {
                          nextPlus = manualPlus ?? oldPlus;
                        }

                        const nextNature = resolveNatureByPlusMinus(
                          nextPlus,
                          nextMinus
                        );
                        setNature(nextNature);
                        setSuppressNatureSigns(false);
                        setManualSigns({});
                      }
                    } else {
                      if (isArrowChange) {
                        return;
                      }
                      const oldPlus = nature.plus as StatIDExceptHP | undefined;
                      const oldMinus = nature.minus as
                        | StatIDExceptHP
                        | undefined;
                      const hadPrevManual =
                        !!manualSigns[statId as StatIDExceptHP];
                      const hadPrevNature =
                        oldPlus === (statId as StatIDExceptHP) ||
                        oldMinus === (statId as StatIDExceptHP);
                      if (!(hadPrevManual || hadPrevNature)) {
                        return;
                      }
                      setManualSigns((prev) => {
                        const copy = { ...prev };
                        delete copy[statId as StatIDExceptHP];
                        if (oldPlus === statId && oldMinus) {
                          if (!copy[oldMinus]) copy[oldMinus] = "-";
                        } else if (oldMinus === statId && oldPlus) {
                          if (!copy[oldPlus]) copy[oldPlus] = "+";
                        }
                        return copy;
                      });
                      setNature(ShowdownDataService.Natures["serious"]);
                      skipExitOnNatureChangeRef.current = true;
                      setSuppressNatureSigns(true);
                    }
                  }
                }}
                tabIndex={evInputTabStart + idx}
              />
            </div>
            <div className="ps_ta-row-stat-less">
              {(evLowerPercent * 100).toFixed(2)}%
            </div>
            <div />
            <div className={`ps_ta-row-stat-percent ${evPercentClass}`}>
              {(evUsagePercent * 100).toFixed(3)}%
            </div>
            <div />
            <div className="ps_ta-row-stat-more">
              {(evHigherPercent * 100).toFixed(2)}%
            </div>
            {statId !== "hp" ? (
              <div className={`ps_ta-row-boost ${boostClass}`}>
                <NumberInput
                  value={boosts[statId as StatIDExceptHP]}
                  step={1}
                  min={-6}
                  max={6}
                  onChange={(value) => {
                    setBoosts({ ...boosts, [statId]: value || 0 });
                  }}
                  tabIndex={boostTabStart + idx}
                />
              </div>
            ) : (
              <div className={`ps_ta-row-boost ${boostClass}`}>
                <NumberInput
                  value={currentHP || maxHP}
                  step={1}
                  min={pokemonSpecies ? 1 : 0}
                  max={maxHP}
                  onChange={(value) => {
                    setCurrentHP(value || undefined);
                  }}
                  tabIndex={boostTabStart + idx}
                />
              </div>
            )}
            <div className={`ps_ta-row-stat ${finalStatClass}`}>
              {finalStats[statId] *
                (statId === "hp" && isDynamaxed === true ? 2 : 1)}
            </div>
          </div>
        );
      })}

      <div className="ps_ta-table_last_row">
        <div
          className="ps_ta-table_last_row-total-base-stats"
          style={
            totalBaseStatsActual !== totalBaseStatsOriginal
              ? { color: "var(--accent-warning)" }
              : undefined
          }
        >
          {totalBaseStatsActual && totalBaseStatsActual > 0
            ? totalBaseStatsActual
            : ""}
        </div>
        <div className="ps_ta-table_last_row-ev-left">
          <div className="ps_ta-table_last_row-ev-left-label">
            {t("stats.evsRemaining")}:
          </div>
          <div
            className={`ps_ta-table_last_row-ev-left-value ${
              remainingEvs < 0
                ? "ps_ta-table_last_row-ev-left-value-negative"
                : ""
            }`}
          >
            {remainingEvs}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonStatsTable;
