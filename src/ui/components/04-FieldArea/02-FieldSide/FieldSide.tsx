import React from "react";
import { useTranslation } from "react-i18next";
import "./FieldSide.css";
import ToggleButton from "../../../widgets/ToggleButton/ToggleButton";
import SegmentedButtons from "../../../widgets/SegmentedButtons/SegmentedButtons";
import { StatusName } from "../../../../vendors/smogon/damage-calc-dist/data/interface";
import { useFieldSide, SpikesLayers } from "../../../../contexts/FieldContext";
import { usePokemonState } from "../../../../contexts/PokemonStateContext";

interface FieldSideProps {
  isAttacker: boolean;
  className?: string;
}

// 局部类型仅用于墙类选项，避免与Context中的SideEffect产生类型冲突
type WallEffect = "reflect" | "lightScreen" | "auroraVeil";

const FieldSide: React.FC<FieldSideProps> = ({ isAttacker, className }) => {
  const { t } = useTranslation();
  const { sideEffects, toggleSideEffect, wallEffects, setWallEffects, spikesLayers, setSpikesLayers } =
    useFieldSide(isAttacker);
  // 暴击切换来自宝可梦侧的状态上下文
  const {
    criticalHit,
    setCriticalHit,
    status: pokemonStatus,
    setStatus: setPokemonStatus,
  } = usePokemonState(isAttacker);

  const tabBase = isAttacker ? 420000 : 430000;

  const statusOptions: { key: StatusName; label: string }[] = [
    { key: "brn", label: t("field.side.status.burned") },
    { key: "psn", label: t("field.side.status.posioned") },
    { key: "tox", label: t("field.side.status.badlyPosioned") },
    { key: "frz", label: t("field.side.status.frozen") },
    { key: "slp", label: t("field.side.status.asleep") },
    { key: "par", label: t("field.side.status.paralyzed") },
  ];

  const wallsOption = wallEffects as WallEffect[];

  const wallOptions: { key: WallEffect; label: string }[] = [
    { key: "reflect", label: t("field.side.effect.reflect") },
    { key: "lightScreen", label: t("field.side.effect.lightScreen") },
    { key: "auroraVeil", label: t("field.side.effect.auroraVeil") },
  ];

  // 使用上下文提供的toggleSideEffect，无需本地实现

  return (
    <div className={`field-side`}>
      <div className="field-side-title">
        {isAttacker
          ? t("field.side.titleAttacker")
          : t("field.side.titleDefender")}
      </div>

      <div className={`field-side-row`}>
        <SegmentedButtons
          options={statusOptions}
          allowNone={true}
          value={pokemonStatus}
          onChange={(key: StatusName | undefined) => setPokemonStatus(key)}
          tabIndexStart={tabBase}
        />
      </div>
      
      <div className={`field-side-row`}>
        <SegmentedButtons
          options={wallOptions}
          value={wallsOption as ReadonlyArray<WallEffect>}
          multiple={true}
          onChange={(keys: ReadonlyArray<WallEffect>) =>
            setWallEffects([...keys])
          }
          tabIndexStart={tabBase + 10}
        />
        <ToggleButton
          label={t("field.side.effect.friendGuard")}
          className="field-side-friendGuard-toggleButton"
          active={sideEffects.has("friendGuard")}
          onClick={() => toggleSideEffect("friendGuard")}
          tabIndex={tabBase + 13}
        />
      </div>

      <div className={`field-side-row`}>
        <ToggleButton
          label={t("field.side.effect.criticalHit")}
          active={criticalHit}
          onClick={() => setCriticalHit(!criticalHit)}
          tabIndex={tabBase + 20}
        />
      </div>

      <div className={`field-side-row`}>
        <ToggleButton
          label={t("field.side.effect.helpingHand")}
          active={sideEffects.has("helpingHand")}
          onClick={() => toggleSideEffect("helpingHand")}
          tabIndex={tabBase + 30}
        />
        <ToggleButton
          label={t("field.side.effect.steelySpirit")}
          active={sideEffects.has("steelySpirit")}
          onClick={() => toggleSideEffect("steelySpirit")}
          tabIndex={tabBase + 31}
        />
        <ToggleButton
          label={t("field.side.effect.battery")}
          active={sideEffects.has("battery")}
          onClick={() => toggleSideEffect("battery")}
          tabIndex={tabBase + 32}
        />
        <ToggleButton
          label={t("field.side.effect.powerSpot")}
          active={sideEffects.has("powerSpot")}
          onClick={() => toggleSideEffect("powerSpot")}
          tabIndex={tabBase + 33}
        />
      </div>
      <div className={`field-side-secondary-area`}>
        <div className={`field-side-row-secondary`}>
          <ToggleButton
            label={t("field.side.effect.stealthRock")}
            active={sideEffects.has("stealthRock")}
            onClick={() => toggleSideEffect("stealthRock")}
            tabIndex={tabBase + 40}
          />
          <span className="field-side-spikes-label">
            {t("field.side.effect.spikes")}
          </span>
          <SegmentedButtons
            options={[
              { key: 1 as SpikesLayers, label: "1" },
              { key: 2 as SpikesLayers, label: "2" },
              { key: 3 as SpikesLayers, label: "3" },
            ]}
            className="field-side-spikes-toggleButton"
            allowNone={true}
            value={spikesLayers}
            onChange={(key: SpikesLayers | undefined) => setSpikesLayers(key)}
            tabIndexStart={tabBase + 41}
          />
        </div>
        <div className={`field-side-row-secondary`}>
          <ToggleButton
            label={t("field.side.effect.leechSeed")}
            active={sideEffects.has("leechSeed")}
            onClick={() => toggleSideEffect("leechSeed")}
            tabIndex={tabBase + 50}
          />
          <ToggleButton
            label={t("field.side.effect.saltCure")}
            active={sideEffects.has("saltCure")}
            onClick={() => toggleSideEffect("saltCure")}
            tabIndex={tabBase + 51}
          />
        </div>
        <div className={`field-side-row-secondary`}>
          <ToggleButton
            label={t("field.side.effect.powerTrick")}
            active={sideEffects.has("powerTrick")}
            onClick={() => toggleSideEffect("powerTrick")}
            tabIndex={tabBase + 60}
          />
          <ToggleButton
            label={t("field.side.effect.foresight")}
            active={sideEffects.has("foresight")}
            onClick={() => toggleSideEffect("foresight")}
            tabIndex={tabBase + 61}
          />
        </div>
        <div className={`field-side-row-secondary`}>
          <ToggleButton
            label={t("field.side.effect.flowerGift")}
            active={sideEffects.has("flowerGift")}
            onClick={() => toggleSideEffect("flowerGift")}
            tabIndex={tabBase + 70}
          />
          <ToggleButton
            label={t("field.side.effect.tailwind")}
            active={sideEffects.has("tailwind")}
            onClick={() => toggleSideEffect("tailwind")}
            tabIndex={tabBase + 71}
          />
          <ToggleButton
            label={t("field.side.effect.switchingOut")}
            active={sideEffects.has("switchingOut")}
            onClick={() => toggleSideEffect("switchingOut")}
            tabIndex={tabBase + 72}
          />
        </div>
      </div>
    </div>
  );
};
export default FieldSide;
