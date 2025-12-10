import React, { useMemo, useState } from "react";
import "./PokemonStats.css";
import { useDamageCompute } from "../../../../../contexts/DamageComputeContext";
import { ShowdownDataService } from "../../../../../services/showdown.data.service";
import { useLanguage } from "../../../../../contexts/LanguageContext";
import { NATURES } from "../../../../../vendors/smogon/damage-calc-dist/data/natures";
import { StatID } from "../../../../../vendors/smogon/damage-calc-dist/data/interface";
import { usePokemonState } from "../../../../../contexts/PokemonStateContext";
import { usePokemonTranslation } from "../../../../../contexts/usePokemonTranslation";

interface PokemonStatsProps {
  isAttacker: boolean;
  className?: string;
  tabIndexStart?: number;
}

export const PokemonStats: React.FC<PokemonStatsProps> = ({
  isAttacker,
  className,
  tabIndexStart,
}) => {
  const { t } = useLanguage();
  const { translateAbility } = usePokemonTranslation();
  const { attackerSideResults, defenderSideResults } = useDamageCompute();

  const sourceResult = useMemo(() => {
    const results = isAttacker ? attackerSideResults : defenderSideResults;
    for (const r of results) {
      if (r) return r;
    }
    return undefined;
  }, [attackerSideResults, defenderSideResults, isAttacker]);
  const { teraType, isTera, setIsTera, isDynamaxed, setIsDynamaxed } =
    usePokemonState(isAttacker);

  const abilityName = useMemo(
    () => translateAbility(sourceResult?.attacker.ability || ""),
    [sourceResult?.attacker.ability, translateAbility]
  );
  const statOrder: StatID[] = ["hp", "atk", "def", "spa", "spd", "spe"];

  return (
    <div
      className={`pokemon-stats ${
        isAttacker ? "pokemon-stats--attacker" : "pokemon-stats--defender"
      } ${className || ""}`}
    >
      <div className="pokemon-stats__container">
        <div className="pokemon-stats__rules_container">
          <div className="pokemon-stats__tera_container">
            {teraType && (
              <img
                src={ShowdownDataService.getTeraTypeImgUrl(teraType)}
                alt={t("pokemon.rule.teraBadge")}
                className={`pokemon-stats__tera ${
                  isTera
                    ? "pokemon-stats__tera--active"
                    : "pokemon-stats__tera--inactive"
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = "hidden";
                }}
                onClick={() => {
                  setIsTera(!isTera);
                }}
              />
            )}
          </div>
          <div className="pokemon-stats__dynamax_container">
            <img
              src={ShowdownDataService.getDynamaxImgUrl()}
              alt={t("pokemon.rule.dynamaxBadge")}
              className={`pokemon-stats__dynamax ${
                isDynamaxed
                  ? "pokemon-stats__dynamax--active"
                  : "pokemon-stats__dynamax--inactive"
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
              onClick={() => {
                setIsDynamaxed(!isDynamaxed);
              }}
            />
          </div>
        </div>

        <div className="pokemon-stats__info">
          <div className="pokemon-stats__ability">{abilityName}</div>

          <div className="pokemon-stats__evs">
            <span className="pokemon-stats__evs-label">{t("metas.evs")}</span>
            <span className="pokemon-stats__evs-values">
              {statOrder.map((statId, idx) => {
                const evs = sourceResult?.attacker.evs;
                const natureName = sourceResult?.attacker.nature || "Serious";
                const natureTuple = NATURES[natureName];
                const plus = natureTuple ? natureTuple[0] : undefined;
                const minus = natureTuple ? natureTuple[1] : undefined;
                const val = evs ? evs[statId] ?? 0 : 0;
                const isPlus = statId !== "hp" && plus === statId;
                const isMinus = statId !== "hp" && minus === statId;
                const sign =
                  isPlus && isMinus ? "" : isPlus ? "+" : isMinus ? "-" : "";
                const display = val === 0 && sign ? sign : `${val}${sign}`;
                const cls =
                  isPlus && isMinus
                    ? ""
                    : isPlus
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

          <div className="pokemon-stats__values">
            <span className="pokemon-stats__level">{t("metas.lv50")}</span>
            <span className="pokemon-stats__stats">
              {statOrder.map((statId, idx) => {
                if (!sourceResult?.attacker) {
                  return null;
                }
                const natureName = sourceResult?.attacker.nature || "Serious";
                const natureTuple = NATURES[natureName];
                const plus = natureTuple ? natureTuple[0] : undefined;
                const minus = natureTuple ? natureTuple[1] : undefined;
                const isMinus = statId !== "hp" && minus === statId;
                const isPlus = statId !== "hp" && plus === statId;
                const main = sourceResult?.attacker.rawStats[statId];
                const cls =
                  isPlus && isMinus
                    ? ""
                    : isPlus
                    ? "ps_meta-color-plus"
                    : isMinus
                    ? "ps_meta-color-minus"
                    : "";
                return (
                  <span key={`stats-${statId}`}>
                    <span className={cls}>{main}</span>
                    {idx < statOrder.length - 1 ? "/" : ""}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="pokemon-stats__values">
            <span className="pokemon-stats__level">{t("metas.real")}</span>
            <span className="pokemon-stats__stats">
              {statOrder.map((statId, idx) => {
                if (!sourceResult?.attacker) {
                  return null;
                }
                const natureName = sourceResult?.attacker.nature || "Serious";
                const natureTuple = NATURES[natureName];
                const plus = natureTuple ? natureTuple[0] : undefined;
                const minus = natureTuple ? natureTuple[1] : undefined;
                const isMinus = statId !== "hp" && minus === statId;
                const isPlus = statId !== "hp" && plus === statId;
                let main = sourceResult?.attacker.stats[statId];
                if (
                  statId === "hp" &&
                  sourceResult?.attacker.isDynamaxed === true
                ) {
                  main *= 2;
                }
                const cls =
                  isPlus && isMinus
                    ? ""
                    : isPlus
                    ? "ps_meta-color-plus"
                    : isMinus
                    ? "ps_meta-color-minus"
                    : "";
                return (
                  <span key={`stats-${statId}`}>
                    <span className={cls}>{main}</span>
                    {idx < statOrder.length - 1 ? "/" : ""}
                  </span>
                );
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
