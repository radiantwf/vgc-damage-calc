import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./PokemonInfoColumn1.css";
import EditAreaProps from "../../../Props/EditAreaProps";
import { usePokemonTranslation } from "../../../../../../contexts/usePokemonTranslation";
import SearchableDropdown, {
  DropdownItem,
} from "../../../../../widgets/SearchableDropdown/SearchableDropdown";
import showdownDataService, {
  ShowdownDataService,
} from "../../../../../../services/showdown.data.service";
import { usePokemonState } from "../../../../../../contexts/PokemonStateContext";
import { AppPinyin } from "../../../../../../utils/app.pinyin";
import { useLanguage } from "../../../../../../contexts/LanguageContext";
import { getTypeColor } from "../../../../../../utils/type.colors";
import { SpeciesData } from "../../../../../../vendors/smogon/pokemon-showdown/sim/dex-species";
import { usePokemonUsage } from "../../../../../../contexts/PokemonUsageContext";

const PokemonInfoColumn1: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const tabBase = isAttacker ? 320000 : 330000;
  const { t } = useTranslation();
  const { translatePokemon, translateType, translateTypeShort } =
    usePokemonTranslation();
  const {
    pokemonUsageList,
    pokemonUsageListUpdatedAttacker,
    pokemonUsageListUpdatedDefender,
    setPokemonUsageListUpdatedAttacker,
    setPokemonUsageListUpdatedDefender,
  } = usePokemonUsage();
  const { language } = useLanguage();

  // 使用新的Pokemon状态管理
  const { rootFormeSpecies, pokemonSpecies, setPokemonName } =
    usePokemonState(isAttacker);

  // 自定义宝可梦下拉项组件
  const PokemonDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const pokemonName = item.value
          ? (item.value as SpeciesData).name
          : item.key;
        const translatedName = translatePokemon(pokemonName) || "";

        const usageData = pokemonUsageList.find(
          (usage) => usage.pokemon === pokemonName
        );
        const usagePercentage = usageData?.usage || 0;

        const pokemonTypes = item.value
          ? (item.value as SpeciesData).types
          : [];

        return (
          <div className="pi_col1-pokemon-dropdown-item">
            <img
              className="pi_col1-pokemon-dropdown-avatar"
              src={ShowdownDataService.getPokemonImgUrl(pokemonName, true)}
              alt={translatedName}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.visibility = "hidden";
              }}
            />
            <div className="pi_col1-pokemon-dropdown-content">
              <span className="pi_col1-pokemon-dropdown-name">
                {translatedName}
              </span>
              {pokemonTypes.length > 0 && (
                <div className="pi_col1-pokemon-dropdown-types">
                  {pokemonTypes.map((type: string, index: number) => (
                    <div
                      key={index}
                      className="pi_col1-pokemon-dropdown-type"
                      style={{
                        backgroundColor: getTypeColor(type),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <span className="pi_col1-pokemon-dropdown-usage">
              {usagePercentage > 0 && `${usagePercentage.toFixed(3)}%`}
            </span>
          </div>
        );
      },
    [translatePokemon, pokemonUsageList]
  );

  // 获取宝可梦列表并根据使用率排序
  const pokemonDropdownItems: DropdownItem[] = useMemo(() => {
    const speciesData = ShowdownDataService.DisplaySpeciesList;

    // 创建使用率映射
    const usageMap = new Map<string, number>();
    pokemonUsageList.forEach((usage) => {
      usageMap.set(usage.pokemon, usage.rank);
    });

    // 根据使用率排序宝可梦列表
    const sortedPokemonList = [...Object.keys(speciesData)].sort((a, b) => {
      const pokemonA = speciesData[a as keyof typeof speciesData]?.name || a;
      const pokemonB = speciesData[b as keyof typeof speciesData]?.name || b;
      const rankA = usageMap.get(pokemonA) || 9999; // 没有使用率数据的排在后面
      const rankB = usageMap.get(pokemonB) || 9999;
      return rankA - rankB; // 按排名升序排列（排名越小越靠前）
    });

    return sortedPokemonList.map((pokemonKey) => {
      const pokemonData = speciesData[pokemonKey as keyof typeof speciesData];
      const pokemonName = pokemonData?.name || pokemonKey;
      const pokemonTypes = (pokemonData as SpeciesData).types || "";
      const pokemonTypeString = `${pokemonTypes.join(" ")}|${pokemonTypes
        .reverse()
        .join(" ")}`;
      const translatePokemonTypes = pokemonTypes.map((type: string) =>
        translateType(type)
      );
      const translatePokemonTypesShort = pokemonTypes.map((type: string) =>
        translateTypeShort(type)
      );
      const translatePokemonTypesString = `${translatePokemonTypes.join(
        ""
      )}|${translatePokemonTypes
        .reverse()
        .join("")}|${translatePokemonTypesShort.join(
        ""
      )}|${translatePokemonTypesShort.reverse().join("")}`;
      const translatedName = translatePokemon(pokemonName) || "";
      const searchKey = `${pokemonName}|${translatedName}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(translatedName)}`
          : ""
      }|${pokemonTypeString}|${translatePokemonTypesString}|${
        language === "zh"
          ? `${AppPinyin.getSearchKeywords(translatePokemonTypesString)}`
          : ""
      }`;
      return {
        key: pokemonName,
        value: pokemonData,
        searchKey: searchKey,
        displayContentFC: translatedName,
        dropdownItemFC: PokemonDropdownItem,
      };
    });
  }, [PokemonDropdownItem]);

  useEffect(() => {
    if (isAttacker && !pokemonUsageListUpdatedAttacker) {
      return;
    }
    if (!isAttacker && !pokemonUsageListUpdatedDefender) {
      return;
    }
    if (isAttacker && pokemonDropdownItems.length > 0) {
      setPokemonUsageListUpdatedAttacker(true);
      const value = pokemonDropdownItems[0].value;
      setPokemonName(value);
    } else if (!isAttacker && pokemonDropdownItems.length > 1) {
      setPokemonUsageListUpdatedDefender(true);
      setPokemonName(pokemonDropdownItems[1].value);
    } else {
      setPokemonName(undefined);
    }
  }, [pokemonDropdownItems]);

  const pokemonFormeDropdownItems: DropdownItem[] = useMemo(() => {
    if (!rootFormeSpecies) {
      return [];
    }

    const speciesData = Object.fromEntries(
      Object.entries(ShowdownDataService.DisplaySpeciesList).filter(
        ([_, value]) =>
          (rootFormeSpecies.value.formeOrder || []).includes(value.name) &&
          ShowdownDataService.getRootSpecies(
            ShowdownDataService.getPokemonBaseInfo(value.name)
          ) === rootFormeSpecies.value
      )
    );

    if (Object.entries(speciesData).length === 0) {
      speciesData[rootFormeSpecies.value.name] = rootFormeSpecies.value;
    }

    const temp = Object.entries(speciesData).map(([key, _]) => key);
    temp.forEach((key) => {
      const gmaxSpecies = ShowdownDataService.getPokemonBaseInfo(key + "-Gmax");
      if (gmaxSpecies) {
        speciesData[gmaxSpecies.name] = gmaxSpecies;
      }
    });

    if (Object.entries(speciesData).length === 1) {
      return [];
    }

    // 创建使用率映射
    const usageMap = new Map<string, number>();
    pokemonUsageList.forEach((usage) => {
      usageMap.set(usage.pokemon, usage.rank);
    });

    const sortedPokemonList = [...Object.keys(speciesData)].sort((a, b) => {
      const indexA = (rootFormeSpecies.value.formeOrder || []).indexOf(a);
      const indexB = (rootFormeSpecies.value.formeOrder || []).indexOf(b);
      return indexA - indexB; // 按索引升序排列（索引越小越靠前）
    });

    return sortedPokemonList.map((pokemonKey) => {
      const pokemonData = speciesData[pokemonKey as keyof typeof speciesData];
      const pokemonName = pokemonData?.name || pokemonKey;
      const pokemonTypes = (pokemonData as SpeciesData).types || "";
      const pokemonTypeString = `${pokemonTypes.join(" ")}|${pokemonTypes
        .reverse()
        .join(" ")}`;
      const translatePokemonTypes = pokemonTypes.map((type: string) =>
        translateType(type)
      );
      const translatePokemonTypesShort = pokemonTypes.map((type: string) =>
        translateTypeShort(type)
      );
      const translatePokemonTypesString = `${translatePokemonTypes.join(
        ""
      )}|${translatePokemonTypes
        .reverse()
        .join("")}|${translatePokemonTypesShort.join(
        ""
      )}|${translatePokemonTypesShort.reverse().join("")}`;
      const translatedName = translatePokemon(pokemonName) || "";
      const searchKey = `${pokemonName}|${translatedName}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(translatedName)}`
          : ""
      }|${pokemonTypeString}|${translatePokemonTypesString}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(translatePokemonTypesString)}`
          : ""
      }`;
      return {
        key: pokemonName,
        value: pokemonData,
        searchKey: searchKey,
        displayContentFC: translatedName,
        dropdownItemFC: PokemonDropdownItem,
      };
    });
  }, [
    rootFormeSpecies,
    pokemonUsageList,
    translatePokemon,
    translateType,
    translateTypeShort,
  ]);

  return (
    <div className="pi_col1-column">
      <div className="pi_col1-avatar-area">
        <img
          className="pi_col1-avatar"
          alt={translatePokemon(pokemonSpecies?.value.name || "")}
          src={ShowdownDataService.getPokemonImgUrl(
            pokemonSpecies?.value.name,
            false
          )}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.visibility = "hidden";
          }}
        ></img>
      </div>
      <div className="pi_col1-pokemon-name-area">
        <div className="pi_col1-pokemon-name-label">{t("pokemon.name")}</div>
        <SearchableDropdown
          items={pokemonDropdownItems}
          value={ShowdownDataService.getRootSpecies(pokemonSpecies?.value)}
          onChange={(value) => {
            setPokemonName(value);
          }}
          placeholder={t("pokemon.selectPokemon")}
          className="pi_col1-pokemon-name"
          dropdownClassName="pi_col1-pokemon-dropdown"
          isTextEditable={true}
          showDropdownButton={false}
          tabIndex={tabBase + 1}
        />
        {(!pokemonFormeDropdownItems ||
          pokemonFormeDropdownItems.length === 0) && (
          <div className="pi_col1-space-pokemon-forme-area" />
        )}
        {pokemonFormeDropdownItems && pokemonFormeDropdownItems.length > 0 && (
          <SearchableDropdown
            items={pokemonFormeDropdownItems}
            value={pokemonSpecies?.value}
            onChange={(value) => {
              setPokemonName(value);
            }}
            placeholder={t("pokemon.selectPokemonForme")}
            className="pi_col1-pokemon-forme"
            dropdownClassName="pi_col1-pokemon-dropdown"
            isTextEditable={true}
            showDropdownButton={true}
            tabIndex={tabBase + 2}
          />
        )}
      </div>
    </div>
  );
};

export default PokemonInfoColumn1;
