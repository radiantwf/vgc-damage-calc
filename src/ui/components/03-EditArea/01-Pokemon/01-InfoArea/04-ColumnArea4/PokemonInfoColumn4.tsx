import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./PokemonInfoColumn4.css";
import EditAreaProps from "../../../Props/EditAreaProps";
import { usePokemonTranslation } from "../../../../../../contexts/usePokemonTranslation";
import SearchableDropdown, {
  DropdownItem,
} from "../../../../../widgets/SearchableDropdown/SearchableDropdown";
import { ShowdownDataService } from "../../../../../../services/showdown.data.service";
import { usePokemonMovesets } from "../../../../../../contexts/PokemonMovesetsContext";
import { usePokemonState } from "../../../../../../contexts/PokemonStateContext";
import { AppPinyin, normalizeString } from "../../../../../../utils";
import { useLanguage } from "../../../../../../contexts/LanguageContext";
import { getTypeColor } from "../../../../../../utils/type.colors";
import { MoveData } from "../../../../../../vendors/smogon/damage-calc-dist/data/moves";
import NumberInput from "../../../../../widgets/NumberInput/NumberInput";

const PokemonInfoColumn4: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const tabBase = isAttacker ? 320000 : 330000;
  const { t } = useTranslation();
  const { translateMove, translateType, translateTypeShort } =
    usePokemonTranslation();
  const { movesUsageList, movesUsageListUpdated, setMovesUsageListUpdated } =
    usePokemonMovesets(isAttacker);
  const { language } = useLanguage();

  // 使用新的Pokemon状态管理
  const {
    pokemonSpecies,
    move1,
    setMove1,
    move2,
    setMove2,
    move3,
    setMove3,
    move4,
    setMove4,
    // 命中次数（多段攻击）从 Context 获取并更新
    move1Hits,
    setMove1Hits,
    move2Hits,
    setMove2Hits,
    move3Hits,
    setMove3Hits,
    move4Hits,
    setMove4Hits,

    move1BP,
    setMove1BP,
    move2BP,
    setMove2BP,
    move3BP,
    setMove3BP,
    move4BP,
    setMove4BP,
  } = usePokemonState(isAttacker);

  const [editingPower1, setEditingPower1] = React.useState(false);
  const [editingPower2, setEditingPower2] = React.useState(false);
  const [editingPower3, setEditingPower3] = React.useState(false);
  const [editingPower4, setEditingPower4] = React.useState(false);

  // 命中次数由全局 Context 管理（移除本地 state）

  // 计算多段攻击的min/max值和是否显示控件的函数
  const getMultiHitConfig = (move: unknown) => {
    if (!move) {
      return { shouldShow: false, min: 1, max: 1 };
    }

    const multihit = (move as { multihit?: number | [number, number] })
      .multihit;
    const multiaccuracy = (move as { multiaccuracy?: boolean }).multiaccuracy;

    // 如果没有multihit属性，不显示控件
    if (!multihit) {
      return { shouldShow: false, min: 1, max: 1 };
    }

    // 如果multihit是数字
    if (typeof multihit === "number") {
      if (multiaccuracy === true) {
        return { shouldShow: true, min: 1, max: multihit };
      } else {
        return { shouldShow: true, min: multihit, max: multihit };
      }
    }

    // 如果multihit是数组[min, max]
    if (Array.isArray(multihit) && multihit.length === 2) {
      return { shouldShow: true, min: multihit[0], max: multihit[1] };
    }

    return { shouldShow: false, min: 1, max: 1 };
  };

  // 获取各个招式的多段攻击配置
  const move1Config = getMultiHitConfig(move1);
  const move2Config = getMultiHitConfig(move2);
  const move3Config = getMultiHitConfig(move3);
  const move4Config = getMultiHitConfig(move4);

  // 当招式改变时，重置击中次数为 undefined（不覆盖第三方库默认逻辑）
  React.useEffect(() => {
    if (move1Config.shouldShow) {
      setMove1Hits(move1Config.max);
    } else {
      setMove1Hits(undefined);
    }
    setMove1BP(undefined);
  }, [move1]);

  React.useEffect(() => {
    if (move2Config.shouldShow) {
      setMove2Hits(move2Config.max);
    } else {
      setMove2Hits(undefined);
    }
    setMove2BP(undefined);
  }, [move2]);

  React.useEffect(() => {
    if (move3Config.shouldShow) {
      setMove3Hits(move3Config.max);
    } else {
      setMove3Hits(undefined);
    }
    setMove3BP(undefined);
  }, [move3]);

  React.useEffect(() => {}, [move3BP]);

  React.useEffect(() => {
    if (move4Config.shouldShow) {
      setMove4Hits(move4Config.max);
    } else {
      setMove4Hits(undefined);
    }
    setMove4BP(undefined);
  }, [move4]);

  // MoveDisplayContentFC组件 - 用于显示选中的招式
  const MoveDisplayContentFC = useMemo(
    () => (props: { item: DropdownItem }) => {
      const item = props?.item;
      const moveKey = (item.value as MoveData).name || item.key;
      const moveType = item.value ? (item.value as MoveData).type : "Normal";
      const translatedMove = translateMove(moveKey) || moveKey;

      return (
        <div className="pi_col4-move-display-content">
          <div
            className="pi_col4-move-display-content-type-color"
            style={{
              background: getTypeColor(moveType as string),
            }}
          ></div>
          <span className="pi_col4-move-display-content-name">
            {translatedMove}
          </span>
        </div>
      );
    },
    [translateMove]
  );

  // 自定义Move下拉项组件
  const MoveDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const moveName = translateMove(
          (item.value as MoveData).name || item.key
        );
        const usagePercentage =
          (movesUsageList || []).find(
            (usage) => normalizeString(usage.name) === normalizeString(item.key)
          )?.usage || 0;
        const moveType = item.value ? (item.value as MoveData).type : "Normal";
        const isAvailable =
          (item as unknown as { isAvailable?: boolean }).isAvailable !== false;

        return (
          <div className="pi_col4-move-dropdown-item">
            <div className="pi_col4-move-dropdown-left">
              <span
                className={`pi_col4-move-dropdown-name ${
                  !isAvailable ? "pi_col4-move-unavailable" : ""
                }`}
              >
                {moveName}
              </span>
              <div className="pi_col4-move-dropdown-type-bar">
                <div
                  className="pi_col4-move-dropdown-type-color"
                  style={{
                    backgroundColor: getTypeColor(moveType),
                    opacity: !isAvailable ? 0.5 : 1,
                  }}
                />
              </div>
            </div>
            <span
              className={`pi_col4-move-dropdown-usage ${
                !isAvailable ? "pi_col4-move-unavailable" : ""
              }`}
            >
              {usagePercentage > 0 ? usagePercentage.toFixed(3) + "%" : ""}
            </span>
          </div>
        );
      },
    [movesUsageList, translateMove]
  );

  // 获取技能列表并根据使用率排序
  const moveDropdownItems: DropdownItem[] = useMemo(() => {
    const moves = ShowdownDataService.Moves;
    if (!moves) {
      return [];
    }
    const learnsets = ShowdownDataService.getPokemonLearnsets(pokemonSpecies?.value);
    const sortedMoves =
      (learnsets
        ? Object.fromEntries(
            Object.entries(moves).sort(([a], [b]) => {
              let indexA = Object.keys(learnsets!).indexOf(a);
              let indexB = Object.keys(learnsets!).indexOf(b);
              indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
              indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
              if (a === "struggle") {
                indexA = Number.MAX_SAFE_INTEGER - 1;
              }
              if (b === "struggle") {
                indexB = Number.MAX_SAFE_INTEGER - 1;
              }
              return indexA - indexB;
            })
          )
        : undefined) || moves;
    // 只有当movesUsageList有内容时才使用使用率排序
    if (movesUsageList && movesUsageList.length > 0) {
      // 创建使用率映射
      const usageMap = new Map<string, number>();
      movesUsageList.forEach((usage) => {
        usageMap.set(normalizeString(usage.name), usage.usage);
      });

      // 根据使用率排序技能列表
      const sortedMoveList = Object.entries(sortedMoves).sort(([a], [b]) => {
        const usageA = usageMap.get(normalizeString(a)) || 0;
        const usageB = usageMap.get(normalizeString(b)) || 0;
        return usageB - usageA; // 按使用率降序排列（使用率越高越靠前）
      });

      return sortedMoveList.map(([moveKey, moveData]) => {
        const translatedMove = translateMove(
          (moveData as MoveData).name || moveKey
        );
        const moveType = (moveData as MoveData).type.toLowerCase();
        const translatedType = translateType(moveType);
        const translatedTypeShort = translateTypeShort(moveType);
        const searchKey = `${moveKey}|${translatedMove}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(
                translatedMove
              )}|${AppPinyin.getSearchKeywords(translatedTypeShort)}`
            : ""
        }|${moveType}|${translatedType}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(translatedType)}`
            : ""
        }`;

        const isAvailable =
          (learnsets ? Object.values(learnsets).includes(moveData) : true) ||
          (moveData as MoveData).name === "Struggle";
        return {
          key: moveKey,
          value: moveData,
          searchKey: searchKey,
          displayContentFC: MoveDisplayContentFC,
          dropdownItemFC: MoveDropdownItem,
          isAvailable: isAvailable,
        };
      });
    }

    return Object.entries(sortedMoves).map(([moveKey, moveData]) => {
      const translatedMove = translateMove(
        (moveData as MoveData).name || moveKey
      );
      const moveType = (moveData as MoveData).type.toLowerCase();
      const translatedType = translateType(moveType);
      const searchKey = `${moveKey}|${translatedMove}|${
        language === "zh"
          ? `${AppPinyin.getSearchKeywords(translatedMove)}`
          : ""
      }|${moveType}|${translatedType}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(translatedType)}`
          : ""
      }`;
      const isAvailable =
        (learnsets ? Object.values(learnsets).includes(moveData) : true) ||
        (moveData as MoveData).name === "Struggle";
      return {
        key: moveKey,
        value: moveData,
        searchKey: searchKey,
        displayContentFC: MoveDisplayContentFC,
        dropdownItemFC: MoveDropdownItem,
        isAvailable: isAvailable,
      };
    });
  }, [pokemonSpecies, MoveDisplayContentFC, MoveDropdownItem]);

  // 当招式下拉列表更新时，自动选择前四个招式
  useEffect(() => {
    if (!movesUsageListUpdated) {
      return;
    }
    setMovesUsageListUpdated(false);
    if (moveDropdownItems.length > 0) {
      const mv1 = moveDropdownItems[0]?.value || undefined;
      setMove1(mv1);
      setMove1Hits(undefined);
      setMove1BP(undefined);

      const mv2 =
        (moveDropdownItems.length > 0 && moveDropdownItems[1]?.value) ||
        undefined;
      setMove2(mv2);
      setMove2Hits(undefined);
      setMove2BP(undefined);

      const mv3 =
        (moveDropdownItems.length > 0 && moveDropdownItems[2]?.value) ||
        undefined;
      setMove3(mv3);
      setMove3Hits(undefined);
      setMove3BP(undefined);

      const mv4 =
        (moveDropdownItems.length > 0 && moveDropdownItems[3]?.value) ||
        undefined;
      setMove4(mv4);
      setMove4Hits(undefined);
      setMove4BP(undefined);
    }
  }, [moveDropdownItems]);

  return (
    <div>
      <div className="pi_col4-column">
        <div className="pi_col4-pokemon-label-area">
          <div className="pi_col4-pokemon-move-label">{t("pokemon.move")}</div>
          <div className="pi_col4-pokemon-power-label">
            {t("pokemon.movePower")}
          </div>
          <div className="pi_col4-pokemon-hits-label">
            {(move1Config.shouldShow ||
              move2Config.shouldShow ||
              move3Config.shouldShow ||
              move4Config.shouldShow) &&
              t("pokemon.moveHits")}
          </div>
        </div>
        <div className="pi_col4-pokemon-move-list-area">
          <div className="pi_col4-pokemon-move-row-area">
            <div className="pi_col4-pokemon-move-input-area">
              <SearchableDropdown
                items={moveDropdownItems}
                value={move1}
                onChange={(value) => {
                  setMove1(value);
                  // 默认不设置击中次数（保持 undefined）
                  setMove1Hits(undefined);
                  setMove1BP(undefined);
                }}
                placeholder={t("pokemon.selectMove")}
                className="pi_col4-pokemon-move"
                dropdownClassName="pi_col4-move-dropdown"
                isTextEditable={true}
                showDropdownButton={false}
                tabIndex={tabBase + 7}
              />
            </div>
            <div
              className="pi_col4-pokemon-power"
              style={
                editingPower1
                  ? { width: 100 }
                  : move1BP && move1BP !== move1?.basePower
                  ? { color: "var(--accent-warning)" }
                  : undefined
              }
              onDoubleClick={() => {
                if (move1BP || move1?.basePower) {
                  setEditingPower1(true);
                }
              }}
            >
              {editingPower1 ? (
                <NumberInput
                  autoFocus={true}
                  value={
                    (move1BP ??
                      (typeof move1?.basePower === "number"
                        ? move1.basePower
                        : null)) as number | null
                  }
                  step={1}
                  min={0}
                  onChange={(value) => {
                    setMove1BP(value ?? undefined);
                  }}
                  onBlur={() => {
                    setEditingPower1(false);
                  }}
                />
              ) : move1BP ? (
                move1BP.toString()
              ) : move1?.basePower ? (
                move1.basePower.toString()
              ) : (
                ""
              )}
            </div>
            <div className="pi_col4-pokemon-hits">
              {move1Config.shouldShow && (
                <NumberInput
                  value={move1Hits}
                  step={1}
                  min={move1Config.min}
                  max={move1Config.max}
                  onChange={(value) => {
                    // 当输入为空时，使用 undefined 表示不覆盖默认命中次数
                    setMove1Hits(value ?? undefined);
                  }}
                  tabIndex={tabBase + 8}
                />
              )}
            </div>
          </div>
          <div className="pi_col4-pokemon-move-row-area">
            <div className="pi_col4-pokemon-move-input-area">
              <SearchableDropdown
                items={moveDropdownItems}
                value={move2}
                onChange={(value) => {
                  setMove2(value);
                  setMove2Hits(undefined);
                  setMove2BP(undefined);
                }}
                placeholder={t("pokemon.selectMove")}
                className="pi_col4-pokemon-move"
                dropdownClassName="pi_col4-move-dropdown"
                isTextEditable={true}
                showDropdownButton={false}
                tabIndex={tabBase + 9}
              />
            </div>
            <div
              className="pi_col4-pokemon-power"
              style={
                editingPower2
                  ? { width: 100 }
                  : move2BP && move2BP !== move2?.basePower
                  ? { color: "var(--accent-warning)" }
                  : undefined
              }
              onDoubleClick={() => {
                if (move2BP || move2?.basePower) {
                  setEditingPower2(true);
                }
              }}
            >
              {editingPower2 ? (
                <NumberInput
                  autoFocus={true}
                  value={
                    (move2BP ??
                      (typeof move2?.basePower === "number"
                        ? move2.basePower
                        : null)) as number | null
                  }
                  step={1}
                  min={0}
                  onChange={(value) => {
                    setMove2BP(value ?? undefined);
                  }}
                  onBlur={() => {
                    setEditingPower2(false);
                  }}
                />
              ) : move2BP ? (
                move2BP.toString()
              ) : move2?.basePower ? (
                move2.basePower.toString()
              ) : (
                ""
              )}
            </div>
            <div className="pi_col4-pokemon-hits">
              {move2Config.shouldShow && (
                <NumberInput
                  value={move2Hits}
                  step={1}
                  min={move2Config.min}
                  max={move2Config.max}
                  onChange={(value) => {
                    setMove2Hits(value ?? undefined);
                  }}
                  tabIndex={tabBase + 10}
                />
              )}
            </div>
          </div>
          <div className="pi_col4-pokemon-move-row-area">
            <div className="pi_col4-pokemon-move-input-area">
              <SearchableDropdown
                items={moveDropdownItems}
                value={move3}
                onChange={(value) => {
                  setMove3(value);
                  setMove3Hits(undefined);
                  setMove3BP(undefined);
                }}
                placeholder={t("pokemon.selectMove")}
                className="pi_col4-pokemon-move"
                dropdownClassName="pi_col4-move-dropdown"
                isTextEditable={true}
                showDropdownButton={false}
                tabIndex={tabBase + 11}
              />
            </div>
            <div
              className="pi_col4-pokemon-power"
              style={
                editingPower3
                  ? { width: 100 }
                  : move3BP && move3BP !== move3?.basePower
                  ? { color: "var(--accent-warning)" }
                  : undefined
              }
              onDoubleClick={() => {
                if (move3BP || move3?.basePower) {
                  setEditingPower3(true);
                }
              }}
            >
              {editingPower3 ? (
                <NumberInput
                  autoFocus={true}
                  value={
                    (move3BP ??
                      (typeof move3?.basePower === "number"
                        ? move3.basePower
                        : null)) as number | null
                  }
                  step={1}
                  min={0}
                  onChange={(value) => {
                    setMove3BP(value ?? undefined);
                  }}
                  onBlur={() => {
                    setEditingPower3(false);
                  }}
                />
              ) : move3BP ? (
                move3BP.toString()
              ) : move3?.basePower ? (
                move3.basePower.toString()
              ) : (
                ""
              )}
            </div>
            <div className="pi_col4-pokemon-hits">
              {move3Config.shouldShow && (
                <NumberInput
                  value={move3Hits}
                  step={1}
                  min={move3Config.min}
                  max={move3Config.max}
                  onChange={(value) => {
                    setMove3Hits(value ?? undefined);
                  }}
                  tabIndex={tabBase + 12}
                />
              )}
            </div>
          </div>
          <div className="pi_col4-pokemon-move-row-area">
            <div className="pi_col4-pokemon-move-input-area">
              <SearchableDropdown
                items={moveDropdownItems}
                value={move4}
                onChange={(value) => {
                  setMove4(value);
                  setMove4Hits(undefined);
                  setMove4BP(undefined);
                }}
                placeholder={t("pokemon.selectMove")}
                className="pi_col4-pokemon-move"
                dropdownClassName="pi_col4-move-dropdown"
                isTextEditable={true}
                showDropdownButton={false}
                tabIndex={tabBase + 13}
              />
            </div>
            <div
              className="pi_col4-pokemon-power"
              style={
                editingPower4
                  ? { width: 100 }
                  : move4BP && move4BP !== move4?.basePower
                  ? { color: "var(--accent-warning)" }
                  : undefined
              }
              onDoubleClick={() => {
                if (move4BP || move4?.basePower) {
                  setEditingPower4(true);
                }
              }}
            >
              {editingPower4 ? (
                <NumberInput
                  autoFocus={true}
                  value={
                    (move4BP ??
                      (typeof move4?.basePower === "number"
                        ? move4.basePower
                        : null)) as number | null
                  }
                  step={1}
                  min={0}
                  onChange={(value) => {
                    setMove4BP(value ?? undefined);
                  }}
                  onBlur={() => {
                    setEditingPower4(false);
                  }}
                />
              ) : move4BP ? (
                move4BP.toString()
              ) : move4?.basePower ? (
                move4.basePower.toString()
              ) : (
                ""
              )}
            </div>
            <div className="pi_col4-pokemon-hits">
              {move4Config.shouldShow && (
                <NumberInput
                  value={move4Hits}
                  step={1}
                  min={move4Config.min}
                  max={move4Config.max}
                  onChange={(value) => {
                    setMove4Hits(value ?? undefined);
                  }}
                  tabIndex={tabBase + 14}
                />
              )}
            </div>
          </div>
          <div className="pi_col4-pokemon-move-row-area"></div>
        </div>
      </div>
    </div>
  );
};

export default PokemonInfoColumn4;
