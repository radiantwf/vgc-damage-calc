import React from "react";
import { useTranslation } from "react-i18next";
import "./FieldCenter.css";
import SegmentedButtons from "../../../widgets/SegmentedButtons/SegmentedButtons";
import {
  Terrain,
  Weather,
  GameType,
} from "../../../../vendors/smogon/damage-calc-dist/data/interface";
import { useField } from "../../../../contexts/FieldContext";

interface FieldCenterProps {
  className?: string;
}

type RuinEffect =
  | "beadsOfRuin"
  | "swordOfRuin"
  | "tabletsOfRuin"
  | "vesselOfRuin";
type SpaceEffect = "gravity" | "magicRoom" | "wonderRoom";
type AuraEffect = "auraBreak" | "fairyAura" | "darkAura";

const FieldCenter: React.FC<FieldCenterProps> = ({ className }) => {
  const { t } = useTranslation();
  const {
    gameType,
    setGameType,
    weather,
    setWeather,
    terrain,
    setTerrain,
    auraEffects,
    setAuraEffects,
    ruinEffects,
    setRuinEffects,
    spaceEffects,
    setSpaceEffects,
  } = useField();

  const gameTypeOptions: { key: GameType; label: string }[] = [
    { key: "Singles", label: t("field.center.gameType.singles") },
    { key: "Doubles", label: t("field.center.gameType.doubles") },
  ];

  const weatherOptions: { key: Weather; label: string }[] = [
    { key: "Sun", label: t("field.center.weather.sun") },
    { key: "Rain", label: t("field.center.weather.rain") },
    { key: "Sand", label: t("field.center.weather.sand") },
    { key: "Snow", label: t("field.center.weather.snow") },
  ];

  const weather2Options: { key: Weather; label: string }[] = [
    { key: "Harsh Sunshine", label: t("field.center.weather.harshSunshine") },
    { key: "Heavy Rain", label: t("field.center.weather.heavyRain") },
    { key: "Strong Winds", label: t("field.center.weather.strongWinds") },
  ];

  const terrainOptions: { key: Terrain; label: string }[] = [
    { key: "Electric", label: t("field.center.terrain.electric") },
    { key: "Grassy", label: t("field.center.terrain.grassy") },
    { key: "Psychic", label: t("field.center.terrain.psychic") },
    { key: "Misty", label: t("field.center.terrain.misty") },
  ];

  const ruinOptions: { key: RuinEffect; label: string }[] = [
    { key: "swordOfRuin", label: t("field.center.ruin.sword") },
    { key: "beadsOfRuin", label: t("field.center.ruin.beads") },
    { key: "tabletsOfRuin", label: t("field.center.ruin.tablets") },
    { key: "vesselOfRuin", label: t("field.center.ruin.vessel") },
  ];

  const auraOptions: { key: AuraEffect; label: string }[] = [
    { key: "auraBreak", label: t("field.center.aura.auraBreak") },
    { key: "fairyAura", label: t("field.center.aura.fairyAura") },
    { key: "darkAura", label: t("field.center.aura.darkAura") },
  ];

  // 其他场地效果 - 第二行（空间相关）
  const spaceOptions: { key: SpaceEffect; label: string }[] = [
    { key: "gravity", label: t("field.center.gravity") },
    { key: "magicRoom", label: t("field.center.magicRoom") },
    { key: "wonderRoom", label: t("field.center.wonderRoom") },
  ];

  return (
    <div className={`field-center ${className || ""}`.trim()}>
      <div className="field-center-title"></div>

      <div className="field-center-row field-center-gameType">
        <SegmentedButtons
          options={gameTypeOptions}
          value={gameType}
          onChange={(key: GameType) => setGameType(key)}
          tabIndexStart={410000}
        />
      </div>

      <div className="field-center-weather-row">
        {/* 天气选择 */}
        <div className="field-center-row field-center-weather">
          <SegmentedButtons
            options={weatherOptions}
            value={weather}
            allowNone={true}
            onChange={(key: Weather | undefined) => setWeather(key)}
            tabIndexStart={410010}
          />
        </div>

        {/* 天气2选择 */}
        <div className="field-center-row field-center-weather2">
          <SegmentedButtons
            options={weather2Options}
            value={weather}
            allowNone={true}
            onChange={(key: Weather | undefined) => setWeather(key)}
            tabIndexStart={410020}
          />
        </div>
      </div>

      {/* 场地选择 */}
      <div className="field-center-row field-center-terrain">
        <SegmentedButtons
          options={terrainOptions}
          value={terrain}
          allowNone={true}
          onChange={(key: Terrain | undefined) => setTerrain(key)}
          tabIndexStart={410030}
        />
      </div>

      {/* 其他场地效果 */}
      <div className="field-center-row field-center-aura">
        <SegmentedButtons
          multiple={true}
          options={auraOptions}
          value={auraEffects}
          onChange={(keys: ReadonlyArray<AuraEffect>) =>
            setAuraEffects([...keys])
          }
          tabIndexStart={410040}
        />
      </div>
      <div className="field-center-row field-center-ruin">
        <SegmentedButtons
          multiple={true}
          options={ruinOptions}
          value={ruinEffects}
          onChange={(keys: ReadonlyArray<RuinEffect>) =>
            setRuinEffects([...keys])
          }
          tabIndexStart={410050}
        />
      </div>
      <div className="field-center-row field-center-effects">
        <SegmentedButtons
          multiple={true}
          options={spaceOptions}
          value={spaceEffects}
          onChange={(keys: ReadonlyArray<SpaceEffect>) =>
            setSpaceEffects([...keys])
          }
          tabIndexStart={410060}
        />
      </div>
    </div>
  );
};

export default FieldCenter;
