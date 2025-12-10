import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./PokemonInfoColumn3.css";
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
import {
  getTypeColor,
  getStellarRainbowColor,
  getStellarRainbowColor2,
} from "../../../../../../utils/type.colors";
import { TypeName } from "../../../../../../vendors/smogon/damage-calc-dist/data/interface";
import { ItemData } from "../../../../../../vendors/smogon/pokemon-showdown/sim/dex-items";

const PokemonInfoColumn3: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const tabBase = isAttacker ? 320000 : 330000;
  const { t } = useTranslation();
  const { translateType, translateTypeShort, translateItem } =
    usePokemonTranslation();
  const {
    teratypesUsageList,
    teratypesUsageListUpdated,
    setTeratypesUsageListUpdated,
    itemsUsageList,
    itemsUsageListUpdated,
    setItemsUsageListUpdated,
  } = usePokemonMovesets(isAttacker);
  const { language } = useLanguage();

  // 自定义Item下拉项组件
  // ItemDisplayContentFC组件 - 用于显示选中的道具
  const ItemDisplayContentFC = useMemo(
    () => (props: { item: DropdownItem }) => {
      const item = props?.item;
      const itemKey = (item.value as ItemData).name || item.key;
      const translatedItem = translateItem(itemKey);
      const spriteUrl = ShowdownDataService.getItemImgUrl(itemKey);

      return (
        <div className="pi_col3-item-display-content">
          <img
            src={spriteUrl}
            alt={translatedItem}
            className="pi_col3-item-display-dropdown-avatar"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.visibility = "hidden";
            }}
          />
          <span className="pi_col3-item-display-name">{translatedItem}</span>
        </div>
      );
    },
    [translateItem]
  );

  // TeraTypeDisplayContentFC组件 - 用于显示选中的太晶类型
  const TeraTypeDisplayContentFC = useMemo(
    () => (props: { item: DropdownItem }) => {
      const item = props?.item;
      const typeKey = item.key;
      const translatedType = translateType(typeKey) || typeKey;

      return (
        <div className="pi_col3-teratype-display-content">
          <img
            src={ShowdownDataService.getTeraTypeImgUrl(item.key)}
            className="pi_col3-teratype-display-dropdown-avatar"
            alt=""
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.visibility = "hidden";
            }}
          />
          <span className="pi_col3-teratype-display-content-name">
            {translatedType}
          </span>
        </div>
      );
    },
    [translateType]
  );

  const ItemDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const itemName =
          translateItem((item.value as ItemData).name) || item.key;
        const usagePercentage =
          (itemsUsageList || []).find(
            (usage) => normalizeString(usage.name) === normalizeString(item.key)
          )?.usage || 0;

        return (
          <div className="pi_col3-item-dropdown-item">
            <img
              className="pi_col3-item-dropdown-avatar"
              src={ShowdownDataService.getItemImgUrl(item.key)}
              alt={itemName}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.visibility = "hidden";
              }}
            />
            <span className="pi_col3-item-dropdown-name">{itemName}</span>
            {usagePercentage > 0 && (
              <span className="pi_col3-item-dropdown-usage">
                {usagePercentage.toFixed(3)}%
              </span>
            )}
          </div>
        );
      },
    [translateItem, itemsUsageList]
  );

  // 自定义TeraType下拉项组件
  const TeraTypeDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const typeName = translateType(item.key) || item.key;
        const typeKey = item.value;
        const usagePercentage =
          (teratypesUsageList || []).find(
            (usage) =>
              normalizeString(usage.name) === normalizeString(typeKey as string)
          )?.usage || 0;

        return (
          <div className="pi_col3-teratype-dropdown-item">
            <div className="pi_col3-teratype-dropdown-left">
              <span className="pi_col3-teratype-dropdown-name">{typeName}</span>
              <div className="pi_col3-teratype-dropdown-type-bar">
                <div
                  className="pi_col3-teratype-dropdown-type-color"
                  style={{
                    background:
                      typeKey === "Stellar"
                        ? getStellarRainbowColor()
                        : getTypeColor(typeKey as string),
                  }}
                />
              </div>
            </div>
            <span className="pi_col3-teratype-dropdown-usage">
              {usagePercentage > 0 && `${usagePercentage.toFixed(3)}%`}
            </span>
          </div>
        );
      },
    [translateType, teratypesUsageList]
  );

  // 使用新的Pokemon状态管理
  const { pokemonSpecies, teraType, setTeraType, item, setItem } =
    usePokemonState(isAttacker);

  // 获取太晶属性列表并根据使用率排序
  const teraTypeDropdownItems: DropdownItem[] = useMemo(() => {
    if (!pokemonSpecies) {
      return [];
    }

    const teraTypes = ShowdownDataService.TeraTypes(pokemonSpecies);
    if (!teraTypes) {
      return [];
    }

    if (pokemonSpecies.requiredTeraType) {
      const requiredTeraType = Object.entries(teraTypes).find(
        ([typeKey, _]) =>
          typeKey === normalizeString(pokemonSpecies.requiredTeraType!)
      );
      if (requiredTeraType) {
        const key = requiredTeraType[0];
        const tpyeStr = translateType(key);
        const shortTypeStr = translateTypeShort(key);
        const searchKey = `${key}|${tpyeStr}|${shortTypeStr}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(
                tpyeStr
              )}|${AppPinyin.getSearchKeywords(shortTypeStr)}`
            : ""
        }`;
        return [
          {
            key: key,
            value: key[0].toUpperCase() + key.substring(1),
            searchKey: searchKey,
            displayContentFC: TeraTypeDisplayContentFC,
            dropdownItemFC: TeraTypeDropdownItem,
          },
        ];
      }
    }
    // 只有当teratypesUsageList有内容时才使用使用率排序
    if (teratypesUsageList && teratypesUsageList.length > 0) {
      // 创建使用率映射
      const usageMap = new Map<string, number>();
      teratypesUsageList.forEach((usage) => {
        usageMap.set(normalizeString(usage.name), usage.usage);
      });

      // 根据使用率排序太晶属性列表
      const sortedTeraTypeList = Object.entries(teraTypes).sort((a, b) => {
        const usageA = usageMap.get(normalizeString(a[0])) || 0; // 没有使用率数据的排在后面
        const usageB = usageMap.get(normalizeString(b[0])) || 0;
        return usageB - usageA; // 按使用率降序排列（使用率越高越靠前）
      });

      return sortedTeraTypeList.map(([typeKey, _]) => {
        const key = typeKey;
        const tpyeStr = translateType(typeKey);
        const shortTypeStr = translateTypeShort(typeKey);
        const searchKey = `${key}|${tpyeStr}|${shortTypeStr}|${
          language === "zh"
            ? `${AppPinyin.getSearchKeywords(
                tpyeStr
              )}|${AppPinyin.getSearchKeywords(shortTypeStr)}`
            : ""
        }`;
        return {
          key: key,
          value: key[0].toUpperCase() + key.substring(1),
          searchKey: searchKey,
          displayContentFC: TeraTypeDisplayContentFC,
          dropdownItemFC: TeraTypeDropdownItem,
        };
      });
    }

    // 如果没有使用率数据，返回默认排序的列表
    return Object.entries(teraTypes).map(([typeKey, _]) => {
      const key = typeKey;
      const tpyeStr = translateType(key);
      const shortTypeStr = translateTypeShort(key);
      const searchKey = `${key}|${tpyeStr}|${shortTypeStr}${
        language === "zh"
          ? `|${AppPinyin.getSearchKeywords(
              tpyeStr
            )}|${AppPinyin.getSearchKeywords(shortTypeStr)}`
          : ""
      }`;
      return {
        key: key,
        value: key[0].toUpperCase() + key.substring(1),
        searchKey: searchKey,
        displayContentFC: TeraTypeDisplayContentFC,
        dropdownItemFC: TeraTypeDropdownItem,
      };
    });
  }, [
    pokemonSpecies,
    TeraTypeDropdownItem,
    TeraTypeDisplayContentFC,
    translateType,
    translateTypeShort,
  ]);

  // 当太晶属性下拉列表更新时，自动选择第一个太晶属性
  useEffect(() => {
    if (!teratypesUsageListUpdated) {
      return;
    }
    setTeratypesUsageListUpdated(false);
    if (teraTypeDropdownItems.length > 0) {
      const firstTeraTypeKey = teraTypeDropdownItems[0].value;
      setTeraType(firstTeraTypeKey as TypeName);
    } else {
      setTeraType(undefined);
    }
  }, [teraTypeDropdownItems]);

  // 获取道具列表并根据使用率排序
  const itemDropdownItems: DropdownItem[] = useMemo(() => {
    if (!pokemonSpecies) {
      return [];
    }
    const items = ShowdownDataService.Items;
    if (!items) {
      return [];
    }

    if (pokemonSpecies.requiredItem) {
      const requiredItem = Object.entries(items).find(
        ([itemKey, _]) =>
          itemKey === normalizeString(pokemonSpecies.requiredItem!)
      );
      if (requiredItem) {
        const key = (requiredItem[1] as ItemData).name || requiredItem[0];
        const translatedItem = translateItem(key);
        const searchKey = `${key}|${translatedItem}}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(translatedItem)}`
            : ""
        }`;
        return [
          {
            key: key,
            value: requiredItem[1],
            searchKey: searchKey,
            displayContentFC: ItemDisplayContentFC,
            dropdownItemFC: ItemDropdownItem,
          },
        ];
      }
    }

    // 只有当itemsUsageList有内容时才使用使用率排序
    if (itemsUsageList && itemsUsageList.length > 0) {
      // 创建使用率映射
      const usageMap = new Map<string, number>();
      itemsUsageList.forEach((usage) => {
        usageMap.set(normalizeString(usage.name), usage.usage);
      });

      // 根据使用率排序道具列表
      const sortedItemList = Object.entries(items).sort(([a], [b]) => {
        const usageA = usageMap.get(normalizeString(a)) || 0;
        const usageB = usageMap.get(normalizeString(b)) || 0;
        return usageB - usageA; // 按使用率降序排列（使用率越高越靠前）
      });

      return sortedItemList.map(([itemKey, itemData]) => {
        const displayText = translateItem(
          (itemData as ItemData).name || itemKey
        );
        const searchKey = `${itemKey}|${displayText}${
          language === "zh"
            ? `|${AppPinyin.getSearchKeywords(displayText)}`
            : ""
        }`;
        return {
          key: itemKey,
          value: itemData,
          searchKey: searchKey,
          displayContentFC: ItemDisplayContentFC,
          dropdownItemFC: ItemDropdownItem,
        };
      });
    }

    // 如果没有使用率数据，返回默认排序的列表
    return Object.entries(items).map(([itemKey, itemData]) => {
      const displayText = translateItem((itemData as ItemData).name || itemKey);
      const searchKey = `${itemKey}|${displayText}${
        language === "zh" ? `|${AppPinyin.getSearchKeywords(displayText)}` : ""
      }`;
      return {
        key: itemKey,
        value: itemData,
        searchKey: searchKey,
        displayContentFC: ItemDisplayContentFC,
        dropdownItemFC: ItemDropdownItem,
      };
    });
  }, [pokemonSpecies, ItemDropdownItem, ItemDisplayContentFC]);

  // 当道具下拉列表更新时，自动选择第一个道具
  useEffect(() => {
    if (
      itemDropdownItems.length > 0 &&
      itemDropdownItems.findIndex((i) => i.value === item) === -1
    ) {
      const value = itemDropdownItems[0].value;
      setItem(value);
    }
    if (!itemsUsageListUpdated) {
      return;
    }
    setItemsUsageListUpdated(false);
    if (itemDropdownItems.length > 0) {
      const value = itemDropdownItems[0].value;
      setItem(value);
    } else {
      setItem(undefined);
    }
  }, [itemDropdownItems]);

  return (
    <div>
      <div className="pi_col3-column">
        <div className="pi_col3-pokemon-teratype-area">
          <div className="pi_col3-pokemon-teratype-label-area">
            <div className="pi_col3-pokemon-teratype-label">
              {t("pokemon.teraType")}
            </div>
          </div>
          <div className="pi_col3-pokemon-teratype-input-area">
            <SearchableDropdown
              items={teraTypeDropdownItems}
              value={teraType}
              onChange={(value) => {
                setTeraType(value as TypeName);
              }}
              placeholder={t("pokemon.selectTeraType")}
              className="pi_col3-pokemon-teratype"
              dropdownClassName="pi_col3-teratype-dropdown"
              isTextEditable={true}
              showDropdownButton={false}
              tabIndex={tabBase + 5}
            />
          </div>
        </div>
        <div className="pi_col3-pokemon-item-area">
          <div className="pi_col3-pokemon-item-label-area">
            <div className="pi_col3-pokemon-item-label">
              {t("pokemon.item")}
            </div>
          </div>
          <div className="pi_col3-pokemon-item-input-area">
            <SearchableDropdown
              items={itemDropdownItems}
              value={item}
              onChange={(value) => {
                setItem(value);
              }}
              placeholder={t("pokemon.selectItem")}
              className="pi_col3-pokemon-item"
              dropdownClassName="pi_col3-item-dropdown"
              isTextEditable={true}
              showDropdownButton={false}
              tabIndex={tabBase + 6}
            />
          </div>
          <div className="pi_col3-pokemon-item-input-area"></div>
        </div>
      </div>
    </div>
  );
};

export default PokemonInfoColumn3;
