import "./PokemonMetaBuilds.css";
import EditAreaProps from "../../../Props/EditAreaProps";
import SearchableDropdown, {
  DropdownItem,
} from "../../../../../widgets/SearchableDropdown/SearchableDropdown";
import { usePokemonState } from "../../../../../../contexts/PokemonStateContext";
import { usePokemonMovesets } from "../../../../../../contexts/PokemonMovesetsContext";
import { useTeamState } from "../../../../../../contexts/TeamContext";
import { useFormats } from "../../../../../../contexts/FormatsContext";
import { useMemo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePokemonTranslation } from "../../../../../../contexts/usePokemonTranslation";
import { MetaBuildsUsage } from "../../../../../../models/showndown.model";
import { computeStat } from "../../../../../../utils/stats.utils";
import { t } from "i18next";
import { FiArrowLeft, FiCopy } from "react-icons/fi";
import { confirmable, ContextAwareConfirmation } from "react-confirm";
import ConfirmDialog, {
  type ConfirmPayload,
} from "../../../../../widgets/ConfirmDialog/ConfirmDialog";

const getMetaEvs = (
  meta: MetaBuildsUsage | undefined,
  isChampionsGame: boolean
): MetaBuildsUsage["evs"] | MetaBuildsUsage["evs2"] =>
  isChampionsGame ? meta?.evs2 ?? meta?.evs : meta?.evs ?? meta?.evs2;

const shouldUseChampionsSpreadFormula = (
  meta: MetaBuildsUsage | undefined,
  isChampionsGame: boolean
): boolean => isChampionsGame && !!meta?.evs2;

const PokemonMetaBuilds: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const tabBase = isAttacker ? 320000 : 330000;
  const { currentGame } = useFormats();
  const isChampionsGame = currentGame === "Champions";
  // 获取Pokemon状态
  const {
    displayPokemon,
    pokemonSpecies,
    meta,
    setMeta,
    nature,
    exportPokemonToClipboard,
    importPokemonFromClipboard,
  } = usePokemonState(isAttacker);
  const { slots, selectedIndex } = useTeamState(isAttacker);

  const [toastText, setToastText] = useState<string | null>(null);
  const confirm = ContextAwareConfirmation.createConfirmation(
    confirmable(ConfirmDialog)
  ) as <R>(payload: ConfirmPayload<R>) => Promise<R>;

  const handleCopy = useCallback(async () => {
    const ok = await exportPokemonToClipboard();
    if (ok) setToastText(t("pokemon.copySuccess"));
  }, [exportPokemonToClipboard]);

  const handleImport = useCallback(async () => {
    const currentText = displayPokemon?.exportToPasteText();
    const savedText = slots[selectedIndex]?.pasteText;
    if (currentText && currentText !== savedText) {
      const shouldDiscard = await confirm<boolean>({
        messageKey: "pokemon.confirmImportDiscard.message",
        buttons: [
          {
            labelKey: "pokemon.confirmImportDiscard.discard",
            value: true,
            tone: "danger",
          },
          {
            labelKey: "pokemon.confirmImportDiscard.cancel",
            value: false,
            tone: "default",
          },
        ],
      });
      if (!shouldDiscard) {
        return;
      }
    }
    const ok = await importPokemonFromClipboard();
    if (ok) setToastText(t("pokemon.importSuccess"));
  }, [confirm, displayPokemon, importPokemonFromClipboard, selectedIndex, slots]);

  useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => {
      setToastText(null);
    }, 1800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toastText]);
  // 获取 movesets 数据
  const {
    metaBuildsUsageList,
    metaBuildsUsageListUpdated,
    setMetaBuildsUsageListUpdated,
  } = usePokemonMovesets(isAttacker);
  const { translateNature } = usePokemonTranslation();

  const MetaBuildDisplayContext: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const meta = item.value as MetaBuildsUsage;
        const metaEvs = getMetaEvs(meta, isChampionsGame);
        if (!meta || !metaEvs) {
          throw new Error("MetaBuildsUsage is undefined or evs is undefined");
        }
        const natureText = translateNature(meta.nature.name);
        const statOrder = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
        return (
          <div className="ps_meta-display">
            <span className="ps_meta-display-nature">{natureText}</span>
            <div className="ps_meta-display-spread-evs-container">
              <span className="ps_meta-display-spread-evs-label">
                {t("metas.evs")}
              </span>
              <span className="ps_meta-display-spread-evs-text">
                {statOrder.map((statId, idx) => {
                  const val = metaEvs[statId] ?? 0;
                  const isPlus = statId !== "hp" && meta.nature.plus === statId;
                  const isMinus =
                    statId !== "hp" && meta.nature.minus === statId;
                  const sign = isPlus ? "+" : isMinus ? "-" : "";
                  const display = val === 0 && sign ? sign : `${val}${sign}`;
                  const cls = isPlus
                    ? "ps_meta-color-plus"
                    : isMinus
                    ? "ps_meta-color-minus"
                    : "";
                  return (
                    <span key={statId}>
                      <span className={cls}>{display}</span>
                      {idx < statOrder.length - 1 ? "/" : ""}
                    </span>
                  );
                })}
              </span>
            </div>
            <span className="ps_meta-display-spread-usage">
              {meta.percentage > 0 && `${(meta.percentage * 100).toFixed(3)}%`}
            </span>
          </div>
        );
      },
    [isChampionsGame, translateNature]
  );

  const MetaBuildsDropdownItem: React.FC<{ item: DropdownItem }> = useMemo(
    () =>
      ({ item }) => {
        const meta = item.value as MetaBuildsUsage;
        const metaEvs = getMetaEvs(meta, isChampionsGame);
        const useChampionsSpreadFormula = shouldUseChampionsSpreadFormula(
          meta,
          isChampionsGame
        );
        if (!meta) {
          throw new Error("MetaBuildsUsage is undefined");
        }
        if (!metaEvs) {
          const natureText = translateNature(meta.nature.name);
          return (
            <div className="ps_meta-dropdown-item-nature">
              <span className="ps_meta-dropdown-nature-text">{natureText}</span>
              <span className="ps_meta-dropdown-nature-usage">
                {meta.percentage > 0 &&
                  `${(meta.percentage * 100).toFixed(3)}%`}
              </span>
            </div>
          );
        }
        const statOrder = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
        const baseStats = pokemonSpecies?.value?.baseStats ?? {
          hp: 0,
          atk: 0,
          def: 0,
          spa: 0,
          spd: 0,
          spe: 0,
        };
        return (
          <div className="ps_meta-dropdown-item-spread">
            <div className="ps_meta-dropdown-spread-container">
              <div className="ps_meta-dropdown-spread-evs-container">
                <span className="ps_meta-dropdown-spread-evs-label">
                  {t("metas.evs")}
                </span>
                <span className="ps_meta-dropdown-spread-evs-text">
                  {statOrder.map((statId, idx) => {
                    const val = metaEvs[statId] ?? 0;
                    const isPlus =
                      statId !== "hp" && meta.nature.plus === statId;
                    const isMinus =
                      statId !== "hp" && meta.nature.minus === statId;
                    const sign = isPlus ? "+" : isMinus ? "-" : "";
                    const display = val === 0 && sign ? sign : `${val}${sign}`;
                    const cls = isPlus
                      ? "ps_meta-color-plus"
                      : isMinus
                      ? "ps_meta-color-minus"
                      : "";
                    return (
                      <span key={`evs-${statId}`}>
                        <span className={cls}>{display}</span>
                        {idx < statOrder.length - 1 ? "/" : ""}
                      </span>
                    );
                  })}
                </span>
              </div>
              <div className="ps_meta-dropdown-spread-stats-container">
                <span className="ps_meta-dropdown-spread-stats-label">
                  {t("metas.lv50")}
                </span>
                <span className="ps_meta-dropdown-spread-stats-text">
                  {statOrder.map((statId, idx) => {
                    const base = baseStats[statId] || 0;
                    const ev = metaEvs[statId] || 0;
                    const main = computeStat({
                      base,
                      iv: 31,
                      ev,
                      level: 50,
                      statId: statId as any,
                      nature: meta.nature,
                      useChampionsSpreadFormula,
                    });
                    const isMinus =
                      statId !== "hp" && meta.nature.minus === statId;
                    const isPlus =
                      statId !== "hp" && meta.nature.plus === statId;
                    const needsParen = isMinus && ev === 0;
                    const zeroIvStat = needsParen
                      ? computeStat({
                          base,
                          iv: 0,
                          ev,
                          level: 50,
                          statId: statId as any,
                          nature: meta.nature,
                          useChampionsSpreadFormula,
                        })
                      : undefined;
                    const cls = isPlus
                      ? "ps_meta-color-plus"
                      : isMinus
                      ? "ps_meta-color-minus"
                      : "";
                    return (
                      <span key={`stats-${statId}`}>
                        <span className={cls}>
                          {main}
                          {needsParen ? `(${zeroIvStat})` : ""}
                        </span>
                        {idx < statOrder.length - 1 ? "/" : ""}
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
            <span className="ps_meta-dropdown-spread-usage">
              {meta.percentage > 0 && `${(meta.percentage * 100).toFixed(3)}%`}
            </span>
          </div>
        );
      },
    [isChampionsGame, pokemonSpecies, translateNature]
  );

  // 创建性格下拉选项数据
  const metaBuildsDropdownItems = useMemo(() => {
    const metas = metaBuildsUsageList;
    if (!metas || metas.length === 0) {
      return [];
    }
    const items: DropdownItem[] = [];
    for (let i = 0; i < metas.length; i++) {
      const meta = metas[i];
      items.push({
        key: i.toString(),
        value: meta,
        displayContentFC: MetaBuildDisplayContext,
        dropdownItemFC: MetaBuildsDropdownItem,
        disabled: !getMetaEvs(meta, isChampionsGame),
      });
    }
    return items;
  }, [
    MetaBuildDisplayContext,
    MetaBuildsDropdownItem,
    isChampionsGame,
    metaBuildsUsageList,
  ]);

  useEffect(() => {
    if (!metaBuildsUsageListUpdated) {
      return;
    }
    setMetaBuildsUsageListUpdated(false);
    if (metaBuildsUsageList && metaBuildsUsageList.length > 1) {
      setMeta(metaBuildsUsageList[1]);
    } else {
      setMeta(undefined);
    }
  }, [
    metaBuildsUsageList,
    metaBuildsUsageListUpdated,
    setMeta,
    setMetaBuildsUsageListUpdated,
  ]);

  // 计算：当存在已选性格，且 meta 未选中时，若 meta 列表存在该性格的标题项，则滚动到该性格处
  const scrollTargetValue = useMemo(() => {
    if (
      !meta &&
      nature &&
      metaBuildsUsageList &&
      metaBuildsUsageList.length > 0
    ) {
      return metaBuildsUsageList.find(
        (m) =>
          !getMetaEvs(m, isChampionsGame) &&
          m.nature?.name?.toLowerCase() === nature.name?.toLowerCase()
      );
    }
    return undefined;
  }, [isChampionsGame, meta, nature, metaBuildsUsageList]);

  const handleMetaChange = useCallback(
    (selectedValue: unknown) => {
      if (
        selectedValue &&
        typeof selectedValue === "object" &&
        "nature" in selectedValue
      ) {
        setMeta(selectedValue as typeof meta);
      }
    },
    [setMeta]
  );

  return (
    <div className="ps_meta-area">
      <span className="ps_meta-label">{t("metas.title")}:</span>
      <SearchableDropdown
        items={metaBuildsDropdownItems}
        value={meta}
        placeholder={t("metas.placeholder")}
        onChange={handleMetaChange}
        isTextEditable={false}
        className="ps_meta-controller"
        dropdownClassName="ps_meta-dropdown"
        scrollTargetValue={scrollTargetValue}
        tabIndex={tabBase + 200}
      />
      <div className="ps_meta-actions-toolbar">
        <button
          type="button"
          className="ps_meta-action-button ps_meta-import"
          title={t("pokemon.importFromClipboard")}
          aria-label={t("pokemon.importFromClipboard")}
          onClick={handleImport}
          tabIndex={tabBase + 202}
        >
          <FiArrowLeft />
        </button>
        <button
          type="button"
          className="ps_meta-action-button ps_meta-copy"
          title={t("pokemon.copyToClipboard")}
          aria-label={t("pokemon.copyToClipboard")}
          onClick={handleCopy}
          tabIndex={tabBase + 201}
        >
          <FiCopy />
        </button>
      </div>
      {toastText &&
        createPortal(
          <div
            className="ps_meta-actions-toast ps_meta-actions-toast--fixed"
            role="status"
            aria-live="polite"
          >
            {toastText}
          </div>,
          document.body
        )}
    </div>
  );
};
export default PokemonMetaBuilds;
