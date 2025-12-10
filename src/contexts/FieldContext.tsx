import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Field, Side } from "../vendors/smogon/damage-calc-dist/field";
import { Terrain, Weather, GameType } from "../vendors/smogon/damage-calc-dist/data/interface";

// FieldCenter相关类型
type AuraEffect = "auraBreak" | "fairyAura" | "darkAura";
type RuinEffect =
  | "beadsOfRuin"
  | "swordOfRuin"
  | "tabletsOfRuin"
  | "vesselOfRuin";
type SpaceEffect = "gravity" | "magicRoom" | "wonderRoom";

type SideEffect =
  | "reflect"
  | "lightScreen"
  | "auroraVeil"
  | "helpingHand"
  | "steelySpirit"
  | "battery"
  | "powerSpot"
  | "friendGuard"
  | "stealthRock"
  | "steelsurge"
  | "spikes"
  | "vineLash"
  | "wildfire"
  | "cannonade"
  | "volcalith"
  | "protect"
  | "leechSeed"
  | "saltCure"
  | "foresight"
  | "tailwind"
  | "flowerGift"
  | "powerTrick"
  | "switchingOut";

export type SpikesLayers = 1 | 2 | 3;

// Context类型定义
interface FieldContextType {
  // Field Center状态
  gameType: GameType;
  setGameType: (gameType: GameType) => void;

  weather: Weather | undefined;
  setWeather: (weather: Weather | undefined) => void;

  terrain: Terrain | undefined;
  setTerrain: (terrain: Terrain | undefined) => void;

  auraEffects: AuraEffect[];
  setAuraEffects: (effects: AuraEffect[]) => void;

  ruinEffects: RuinEffect[];
  setRuinEffects: (effects: RuinEffect[]) => void;

  spaceEffects: SpaceEffect[];
  setSpaceEffects: (effects: SpaceEffect[]) => void;

  // 获取完整的Field对象
  getField: () => Field;
}

interface FieldSideContextType {
  // 场地效果
  sideEffects: Set<SideEffect>;
  setSideEffects: (effects: Set<SideEffect>) => void;
  toggleSideEffect: (effect: SideEffect) => void;

  // 墙类效果
  wallEffects: SideEffect[];
  setWallEffects: (effects: SideEffect[]) => void;

  // 撒菱层数
  spikesLayers?: SpikesLayers;
  setSpikesLayers: (layers?: SpikesLayers) => void;

  // 获取完整的Side对象
  getSide: () => Side;
}

// Context创建
const FieldContext = createContext<FieldContextType | undefined>(undefined);

const FieldSideAttackerContext = createContext<
  FieldSideContextType | undefined
>(undefined);

const FieldSideDefenderContext = createContext<
  FieldSideContextType | undefined
>(undefined);

// Field Context Provider
interface FieldProviderProps {
  children: ReactNode;
}

export const FieldProvider: React.FC<FieldProviderProps> = ({ children }) => {
  // Field Center状态
  const [gameType, setGameType] = useState<GameType>("Doubles");
  const [weather, setWeather] = useState<Weather | undefined>(undefined);
  const [terrain, setTerrain] = useState<Terrain | undefined>(undefined);
  const [auraEffects, setAuraEffects] = useState<AuraEffect[]>([]);
  const [ruinEffects, setRuinEffects] = useState<RuinEffect[]>([]);
  const [spaceEffects, setSpaceEffects] = useState<SpaceEffect[]>([]);

  const getField = useCallback((): Field => {
    const field = new Field({
      gameType,
      weather,
      terrain,
      isMagicRoom: spaceEffects.includes("magicRoom"),
      isWonderRoom: spaceEffects.includes("wonderRoom"),
      isGravity: spaceEffects.includes("gravity"),
      isAuraBreak: auraEffects.includes("auraBreak"),
      isFairyAura: auraEffects.includes("fairyAura"),
      isDarkAura: auraEffects.includes("darkAura"),
      isBeadsOfRuin: ruinEffects.includes("beadsOfRuin"),
      isSwordOfRuin: ruinEffects.includes("swordOfRuin"),
      isTabletsOfRuin: ruinEffects.includes("tabletsOfRuin"),
      isVesselOfRuin: ruinEffects.includes("vesselOfRuin"),
    });
    return field;
  }, [gameType, weather, terrain, auraEffects, ruinEffects, spaceEffects]);

  const value: FieldContextType = {
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
    getField,
  };

  return (
    <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
  );
};

// Field Side Context逻辑
const useFieldSideLogic = (): FieldSideContextType => {
  const [sideEffects, setSideEffects] = useState<Set<SideEffect>>(new Set());
  const [wallEffects, setWallEffects] = useState<SideEffect[]>([]);
  const [spikesLayers, setSpikesLayers] = useState<SpikesLayers | undefined>(
    undefined
  );

  const toggleSideEffect = useCallback((effect: SideEffect) => {
    setSideEffects((prev) => {
      const newEffects = new Set(prev);
      if (newEffects.has(effect)) {
        newEffects.delete(effect);
      } else {
        newEffects.add(effect);
      }
      return newEffects;
    });
  }, []);

  const getSide = useCallback((): Side => {
    const side = new Side({
      spikes: spikesLayers ?? 0,
      steelsurge: false,
      vinelash: false,
      wildfire: false,
      cannonade: false,
      volcalith: false,
      isSR: sideEffects.has("stealthRock"),
      isReflect: wallEffects.includes("reflect"),
      isLightScreen: wallEffects.includes("lightScreen"),
      isProtected: sideEffects.has("protect"),
      isSeeded: sideEffects.has("leechSeed"),
      isSaltCured: sideEffects.has("saltCure"),
      isForesight: sideEffects.has("foresight"),
      isTailwind: sideEffects.has("tailwind"),
      isHelpingHand: sideEffects.has("helpingHand"),
      isFlowerGift: sideEffects.has("flowerGift"),
      isFriendGuard: sideEffects.has("friendGuard"),
      isAuroraVeil: wallEffects.includes("auroraVeil"),
      isBattery: sideEffects.has("battery"),
      isPowerSpot: sideEffects.has("powerSpot"),
      isSteelySpirit: sideEffects.has("steelySpirit"),
      isSwitching: sideEffects.has("switchingOut") ? "out" : undefined,
    });
    return side;
  }, [sideEffects, wallEffects, spikesLayers]);

  return {
    sideEffects,
    setSideEffects,
    toggleSideEffect,
    wallEffects,
    setWallEffects,
    spikesLayers,
    setSpikesLayers,
    getSide,
  };
};

// Field Side Providers
export const FieldSideAttackerProvider: React.FC<FieldProviderProps> = ({
  children,
}) => {
  const value = useFieldSideLogic();

  return (
    <FieldSideAttackerContext.Provider value={value}>
      {children}
    </FieldSideAttackerContext.Provider>
  );
};

export const FieldSideDefenderProvider: React.FC<FieldProviderProps> = ({
  children,
}) => {
  const value = useFieldSideLogic();

  return (
    <FieldSideDefenderContext.Provider value={value}>
      {children}
    </FieldSideDefenderContext.Provider>
  );
};

// Hooks
export const useField = (): FieldContextType => {
  const context = useContext(FieldContext);
  if (context === undefined) {
    throw new Error("useField must be used within a FieldProvider");
  }
  return context;
};

export const useFieldSideAttacker = (): FieldSideContextType => {
  const context = useContext(FieldSideAttackerContext);
  if (context === undefined) {
    throw new Error(
      "useFieldSideAttacker must be used within a FieldSideAttackerProvider"
    );
  }
  return context;
};

export const useFieldSideDefender = (): FieldSideContextType => {
  const context = useContext(FieldSideDefenderContext);
  if (context === undefined) {
    throw new Error(
      "useFieldSideDefender must be used within a FieldSideDefenderProvider"
    );
  }
  return context;
};

export const useFieldSide = (isAttacker?: boolean): FieldSideContextType => {
  const attackerContext = useContext(FieldSideAttackerContext);
  const defenderContext = useContext(FieldSideDefenderContext);

  if (isAttacker === true) {
    if (attackerContext === undefined) {
      throw new Error(
        "useFieldSide(true) must be used within a FieldSideAttackerProvider"
      );
    }
    return attackerContext;
  } else if (isAttacker === false) {
    if (defenderContext === undefined) {
      throw new Error(
        "useFieldSide(false) must be used within a FieldSideDefenderProvider"
      );
    }
    return defenderContext;
  } else {
    // 如果没有指定，尝试从两个context中找到可用的
    if (attackerContext !== undefined) {
      return attackerContext;
    } else if (defenderContext !== undefined) {
      return defenderContext;
    } else {
      throw new Error("useFieldSide must be used within a FieldSideProvider");
    }
  }
};
