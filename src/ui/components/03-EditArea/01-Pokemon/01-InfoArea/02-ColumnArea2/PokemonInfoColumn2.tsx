import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./PokemonInfoColumn2.css";
import EditAreaProps from "../../../Props/EditAreaProps";
import SearchableDropdown, {
  DropdownItem,
} from "../../../../../widgets/SearchableDropdown/SearchableDropdown";
import { ShowdownDataService } from "../../../../../../services/showdown.data.service";
import { usePokemonMovesets } from "../../../../../../contexts/PokemonMovesetsContext";
import {
  usePokemonState,
  BoostedStatOption,
} from "../../../../../../contexts/PokemonStateContext";
import { AppPinyin, normalizeString } from "../../../../../../utils";
import {
  getTypeColor,
  getTypeTextColor,
} from "../../../../../../utils/type.colors";
import { useLanguage } from "../../../../../../contexts/LanguageContext";
import { usePokemonTranslation } from "../../../../../../contexts/usePokemonTranslation";
import { AbilityData } from "../../../../../../vendors/smogon/pokemon-showdown/sim/dex-abilities";

const PokemonInfoColumn2: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const tabBase = isAttacker ? 320000 : 330000;
  const { t } = useTranslation();
  const { translateAbility, translateType } = usePokemonTranslation();
  const {
    abilitiesUsageList,
    abilitiesUsageListUpdated,
    setAbilitiesUsageListUpdated,
  } = usePokemonMovesets(isAttacker);
  const { language } = useLanguage();

  // 使用新的Pokemon状态管理
  const {
    pokemonSpecies,
    ability,
    setAbility,
    boostedStat,
    setBoostedStat,
    intimidateActived,
    setIntimidateActived,
  } = usePokemonState(isAttacker);

  // AbilityDropdownItem组件
  const AbilityDropdownItem = useMemo(
    () =>
      ({ item }: { item: DropdownItem }) => {
        const usagePercentage = (abilitiesUsageList || []).find(
          (usage) => normalizeString(usage.name) === normalizeString(item.key)
        )?.usage;
        // 检查特性是否在宝可梦的可用特性列表中
        const abilityTag = normalizeString(item.key);
        let isAvailable = false;
        if (pokemonSpecies) {
          isAvailable =
            abilityTag === normalizeString(pokemonSpecies!.abilities[0]) ||
            abilityTag ===
              normalizeString(pokemonSpecies!.abilities[1] || "") ||
            abilityTag ===
              normalizeString(pokemonSpecies!.abilities["H"] || "");
        }

        return (
          <div
            className={`pi_col2-ability-dropdown-item ${
              !isAvailable ? "pi_col2-ability-unavailable" : ""
            }`}
          >
            <div className="pi_col2-ability-dropdown-name">
              {translateAbility((item.value as AbilityData).name || item.key)}
            </div>
            {usagePercentage !== undefined && (
              <div className="pi_col2-ability-dropdown-usage">
                {usagePercentage.toFixed(3)}%
              </div>
            )}
          </div>
        );
      },
    [pokemonSpecies, abilitiesUsageList, translateAbility]
  );

  // 获取当前宝可梦的属性信息
  const pokemonTypes = useMemo(() => {
    if (!pokemonSpecies) return [];
    return pokemonSpecies.types || [];
  }, [pokemonSpecies, translateType]);

  // 获取特性列表并根据使用率排序
  const abilityDropdownItems: DropdownItem[] = useMemo(() => {
    const abilities = ShowdownDataService.AbilitiesList(pokemonSpecies);
    if (!abilities) {
      return [];
    }

    const abilitiesMap: Record<string, number> = {};
    if (pokemonSpecies) {
      abilitiesMap[normalizeString(pokemonSpecies!.abilities[0])] = 9;
      if (pokemonSpecies!.abilities[1]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities[1])] = 8;
      }
      if (pokemonSpecies!.abilities["H"]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities["H"])] = 2;
      }
      if (pokemonSpecies!.abilities["S"]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities["S"])] = 1;
      }
    }

    const sortedList = Object.entries(abilities).sort(([a], [b]) => {
      const rangeA = abilitiesMap[a] || 0;
      const rangeB = abilitiesMap[b] || 0;
      return rangeB - rangeA; // 按范围降序排列（范围越大越靠前）
    });

    // 只有当abilitiesUsageList有内容时才使用使用率排序
    if (abilitiesUsageList && abilitiesUsageList.length > 0) {
      // 创建使用率映射
      const usageMap = new Map<string, number>();
      abilitiesUsageList.forEach((usage) => {
        usageMap.set(normalizeString(usage.name), usage.usage);
      });

      const tempSortedList = sortedList.sort(([a], [b]) => {
        let usageA = usageMap.get(normalizeString(a)) || 0;
        let usageB = usageMap.get(normalizeString(b)) || 0;
        if (usageA > 0 && !abilitiesMap[a]) {
          usageA = 0.00000000000000001;
        } else if (usageA === 0 && abilitiesMap[a]) {
          usageA = 0.00000000000000002;
        }
        if (usageB > 0 && !abilitiesMap[b]) {
          usageB = 0.00000000000000001;
        } else if (usageB === 0 && abilitiesMap[b]) {
          usageB = 0.00000000000000002;
        }
        return usageB - usageA; // 按使用率降序排列（使用率越高越靠前）
      });

      return tempSortedList.map((ability) => {
        const abilityName = (ability[1] as AbilityData).name || ability[0];
        const translatedAbility = translateAbility(abilityName);
        const searchKey = `${abilityName}|${translatedAbility}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(translatedAbility)}`
            : ""
        }`;
        // 检查特性是否在宝可梦的可用特性列表中
        const isAvailable = pokemonSpecies?.abilities
          ? Object.values(pokemonSpecies.abilities).some(
              (speciesAbility) =>
                typeof speciesAbility === "string" &&
                typeof abilityName === "string" &&
                speciesAbility.toLowerCase() === abilityName.toLowerCase()
            )
          : true;
        return {
          key: abilityName,
          value: ability[1],
          searchKey: searchKey,
          displayContentFC: translatedAbility,
          dropdownItemFC: AbilityDropdownItem,
          isAvailable: isAvailable,
        };
      });
    }
    return sortedList.map((ability) => {
      const abilityName = (ability[1] as AbilityData).name || ability[0];
      const translatedAbility = translateAbility(abilityName);
      const searchKey = `${abilityName}|${translatedAbility}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(translatedAbility)}`
          : ""
      }`;
      // 检查特性是否在宝可梦的可用特性列表中
      const isAvailable = pokemonSpecies?.abilities
        ? Object.values(pokemonSpecies.abilities).some(
            (speciesAbility) =>
              typeof speciesAbility === "string" &&
              typeof abilityName === "string" &&
              speciesAbility.toLowerCase() === abilityName.toLowerCase()
          )
        : true;
      return {
        key: abilityName,
        value: ability[1],
        searchKey: searchKey,
        displayContentFC: translatedAbility,
        dropdownItemFC: AbilityDropdownItem,
        isAvailable: isAvailable,
      };
    });
  }, [pokemonSpecies, AbilityDropdownItem]);

  const options: BoostedStatOption[] = [
    "inactive",
    "auto",
    "atk",
    "def",
    "spa",
    "spd",
    "spe",
  ];

  const BoostedStatDropdownItem = useMemo(
    () =>
      ({ item }: { item: DropdownItem }) => {
        return (
          <div className={`pi_col2-pokemon-boosted-stat-item`}>
            {t(`pokemon.boostedStat.${item.value}`)}
          </div>
        );
      },
    [t]
  );
  // 增强属性选项
  const boostedStatOptions = useMemo(() => {
    return options.map((option) => ({
      key: option,
      value: option,
      searchKey: `${option}|${t(`pokemon.boostedStat.${option}`)}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(
              t(`pokemon.boostedStat.${option}`)
            )}`
          : ""
      }`,
      displayContentFC: t(`pokemon.boostedStat.${option}`),
      dropdownItemFC: BoostedStatDropdownItem,
    }));
  }, [t, language]);

  // 检查是否应该显示增强能量下拉框
  const shouldShowBoostedStat = useMemo(() => {
    return (
      ability?.name === "Protosynthesis" || ability?.name === "Quark Drive"
    );
  }, [ability]);

  // 检查是否应该显示是否激活威吓特性开关
  const shouldShowIntimidateSwitch = useMemo(() => {
    return ability?.name === "Intimidate";
  }, [ability]);

  // 当特性下拉列表更新时，自动选择第一个特性
  useEffect(() => {
    const abilitiesMap: Record<string, number> = {};
    if (pokemonSpecies) {
      abilitiesMap[normalizeString(pokemonSpecies!.abilities[0])] = 9;
      if (pokemonSpecies!.abilities[1]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities[1])] = 8;
      }
      if (pokemonSpecies!.abilities["H"]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities["H"])] = 2;
      }
      if (pokemonSpecies!.abilities["S"]) {
        abilitiesMap[normalizeString(pokemonSpecies!.abilities["S"])] = 1;
      }
    }
    if (!abilitiesMap[normalizeString(ability?.name || "")]) {
      const value = abilityDropdownItems[0].value;
      setAbility(value);
    }
    if (!abilitiesUsageListUpdated) {
      return;
    }
    setAbilitiesUsageListUpdated(false);
    if (abilityDropdownItems.length > 0) {
      const value = abilityDropdownItems[0].value;
      setAbility(value);
    } else {
      setAbility(undefined);
    }
  }, [abilityDropdownItems]);

  return (
    <div>
      <div className="pi_col2-column">
        <div className="pi_col2-pokemon-type-area">
          {pokemonTypes.length > 0 ? (
            pokemonTypes.map((type, index) => (
              <div
                key={index}
                className={`pi_col2-pokemon-type-${
                  pokemonTypes.length === 1
                    ? "full"
                    : `half-${index === 0 ? "l" : "r"}`
                }`}
                style={{
                  backgroundColor: getTypeColor(type),
                  color: getTypeTextColor(type),
                }}
              >
                {translateType(type)}
              </div>
            ))
          ) : (
            <div className="pi_col2-pokemon-type-placeholder">
              {t("pokemon.types")}
            </div>
          )}
        </div>
        <div className="pi_col2-space-row" />
        <div className="pi_col2-pokemon-ability-area">
          <div className="pi_col2-pokemon-ability-label">
            {t("pokemon.ability")}
          </div>
          <SearchableDropdown
            items={abilityDropdownItems}
            value={ability}
            onChange={(value) => {
              setAbility(value);
            }}
            placeholder={t("pokemon.selectAbility")}
            className="pi_col2-pokemon-ability"
            dropdownClassName="pi_col2-ability-dropdown"
            isTextEditable={true}
            showDropdownButton={false}
            tabIndex={tabBase + 3}
          />
          {shouldShowBoostedStat && (
            <SearchableDropdown
              items={boostedStatOptions}
              value={boostedStat}
              onChange={(value) => {
                setBoostedStat(value as BoostedStatOption);
              }}
              placeholder={t("pokemon.boostedStat.placeholder")}
              className="pi_col2-pokemon-boosted-stat"
              dropdownClassName="pi_col2-boosted-stat-dropdown"
              isTextEditable={false}
              showDropdownButton={true}
              tabIndex={tabBase + 4}
            />
          )}
          {shouldShowIntimidateSwitch && (
            <div className="pi_col2-pokemon-intimidate-switch">
              <input
                id={`intimidate-switch-${isAttacker ? "attacker" : "defender"}`}
                tabIndex={tabBase + 5}
                type="checkbox"
                className="pi_col2-switch-input"
                checked={intimidateActived}
                onChange={(e) => {
                  setIntimidateActived(e.target.checked);
                }}
              />
              <label
                htmlFor={`intimidate-switch-${
                  isAttacker ? "attacker" : "defender"
                }`}
                className="pi_col2-switch-label"
              ></label>
            </div>
          )}
          {!shouldShowBoostedStat && !shouldShowIntimidateSwitch && (
            <div className="pi_col2-pokemon-boosted-stat" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PokemonInfoColumn2;
