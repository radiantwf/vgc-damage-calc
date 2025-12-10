import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { ShowdownStatsService } from "../services/showdown.stats.service";
import {
  ChaosNatureSpread1,
  ChaosSpread2,
  MetaBuildsUsage,
  MovesetsUsage,
  MovesetType,
} from "../models/showndown.model";
import { SpeciesData } from "../vendors/smogon/pokemon-showdown/sim/dex-species";
import { useFormats } from "./FormatsContext";
import { usePokemonUsage } from "./PokemonUsageContext";
import { computeStat } from "../utils/stats.utils";

interface PokemonMovesetsContextType {
  disableAutoSelect: boolean;
  setDisableAutoSelect: (disable: boolean) => void;

  itemsUsageList: MovesetsUsage[] | undefined;
  itemsUsageListUpdated: boolean;
  setItemsUsageListUpdated: (updated: boolean) => void;

  movesUsageList: MovesetsUsage[] | undefined;
  movesUsageListUpdated: boolean;
  setMovesUsageListUpdated: (updated: boolean) => void;

  teratypesUsageList: MovesetsUsage[] | undefined;
  teratypesUsageListUpdated: boolean;
  setTeratypesUsageListUpdated: (updated: boolean) => void;

  abilitiesUsageList: MovesetsUsage[] | undefined;
  abilitiesUsageListUpdated: boolean;
  setAbilitiesUsageListUpdated: (updated: boolean) => void;

  chaosSpread1: ChaosNatureSpread1[] | undefined;
  metaBuildsUsageList: MetaBuildsUsage[] | undefined;
  metaBuildsUsageListUpdated: boolean;
  setMetaBuildsUsageListUpdated: (updated: boolean) => void;

  chaosSpread2: Map<StatID, Map<number, number>> | undefined;

  loading: boolean;
  error: string | null;
}

// 创建攻击者和防御者的独立上下文
const AttackerMovesetsContext = createContext<
  PokemonMovesetsContextType | undefined
>(undefined);
const DefenderMovesetsContext = createContext<
  PokemonMovesetsContextType | undefined
>(undefined);

// 通用的Movesets逻辑Hook（与 PokemonStateContext 使用相同的侧标识）
const usePokemonMovesetsLogic = (pokemonId?: string) => {
  const { pokemonUsageList } = usePokemonUsage();
  const [disableAutoSelect, setDisableAutoSelect] = useState(false);

  const [itemsUsageList, setItemsUsageList] = useState<
    MovesetsUsage[] | undefined
  >(undefined);
  const [itemsUsageListUpdated, setItemsUsageListUpdated] = useState(false);

  const [movesUsageList, setMovesUsageList] = useState<
    MovesetsUsage[] | undefined
  >(undefined);
  const [movesUsageListUpdated, setMovesUsageListUpdated] = useState(false);

  const [teratypesUsageList, setTeratypesUsageList] = useState<
    MovesetsUsage[] | undefined
  >(undefined);
  const [teratypesUsageListUpdated, setTeratypesUsageListUpdated] =
    useState(false);

  const [abilitiesUsageList, setAbilitiesUsageList] = useState<
    MovesetsUsage[] | undefined
  >(undefined);
  const [abilitiesUsageListUpdated, setAbilitiesUsageListUpdated] =
    useState(false);

  const [metaBuildsUsageList, setMetaBuildsUsageList] = useState<
    MetaBuildsUsage[] | undefined
  >(undefined);
  const [metaBuildsUsageListUpdated, setMetaBuildsUsageListUpdated] =
    useState(false);

  const [chaosSpread1, setChaosSpread1] = useState<
    ChaosNatureSpread1[] | undefined
  >(undefined);
  const [chaosSpread2Data, setChaosSpread2Data] = useState<
    ChaosSpread2[] | undefined
  >(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastMovesetsParamsRef = useRef<string>("");
  const { currentReg, currentRule, currentMonthTag, currentCutline } =
    useFormats();
  const [rootFormeSpecies, setRootFormeSpecies] = useState<
    SpeciesData | undefined
  >(undefined);
  const [species, setSpecies] = useState<SpeciesData | undefined>(undefined);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{
        side: string;
        species?: SpeciesData;
        root?: SpeciesData;
      }>;
      const detail = e.detail as unknown as {
        side: string;
        species?: SpeciesData;
        root?: SpeciesData;
      };
      if (!detail) return;
      const isAtk =
        pokemonId === "pokemon-attacker" && detail.side === "pokemon-attacker";
      const isDef =
        pokemonId === "pokemon-defender" && detail.side === "pokemon-defender";
      const isAny = pokemonId === undefined;
      if (isAtk || isDef || isAny) {
        setRootFormeSpecies(detail.root);
        setSpecies(detail.species);
      }
    };
    window.addEventListener("pokemonSpeciesChanged", handler as EventListener);
    return () => {
      window.removeEventListener(
        "pokemonSpeciesChanged",
        handler as EventListener
      );
    };
  }, [pokemonId]);

  const setEmptyMovesets = useCallback(() => {
    setItemsUsageList([]);
    setMovesUsageList([]);
    setTeratypesUsageList([]);
    setAbilitiesUsageList([]);
    setMetaBuildsUsageList([]);
    setChaosSpread1([]);
    setChaosSpread2Data([]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const _disableAutoSelect = disableAutoSelect;
    if (_disableAutoSelect) {
      setDisableAutoSelect(false);
    }
    if (!rootFormeSpecies) {
      lastMovesetsParamsRef.current = "";
      setEmptyMovesets();
      return;
    }
    // 生成参数标识符，用于检测是否为重复调用
    const paramsKey = `${currentReg}-${currentRule}-${currentMonthTag}-${currentCutline}-${
      rootFormeSpecies!.name
    }`;

    // 如果参数相同，跳过调用
    if (lastMovesetsParamsRef.current === paramsKey) {
      return;
    }

    lastMovesetsParamsRef.current = paramsKey;
    const run = async () => {
      if (
        !currentReg ||
        !currentRule ||
        !currentMonthTag ||
        !currentCutline ||
        !pokemonUsageList ||
        pokemonUsageList.length === 0
      ) {
        setEmptyMovesets();
        if (!_disableAutoSelect) {
          setItemsUsageListUpdated(true);
          setMovesUsageListUpdated(true);
          setTeratypesUsageListUpdated(true);
          setAbilitiesUsageListUpdated(true);
          setMetaBuildsUsageListUpdated(true);
        }
        return;
      }

      if (
        !pokemonUsageList.find(
          (usage) => usage.pokemon === rootFormeSpecies.name
        )
      ) {
        setEmptyMovesets();
        return;
      }

      const pokemon = rootFormeSpecies.name;

      try {
        const statsService = new ShowdownStatsService();

        // 并行获取所有类型的数据
        const [
          itemsData,
          movesData,
          teratypesData,
          abilitiesData,
          chaosNatureSpread1,
          chaosSpread2,
        ] = await Promise.all([
          statsService.getMovesetsData(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon,
            MovesetType.Item
          ),
          statsService.getMovesetsData(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon,
            MovesetType.Move
          ),
          statsService.getMovesetsData(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon,
            MovesetType.TeraType
          ),
          statsService.getMovesetsData(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon,
            MovesetType.Ability
          ),
          statsService.getChaosSpreads1Data(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon
          ),
          statsService.getChaosSpreads2Data(
            currentReg,
            currentRule,
            currentMonthTag,
            currentCutline,
            pokemon
          ),
        ]);

        // 只有当数据不为null时才更新对应的使用率列表
        if (itemsData !== null) {
          setItemsUsageList(itemsData);
          if (!_disableAutoSelect) setItemsUsageListUpdated(true);
        }
        if (movesData !== null) {
          setMovesUsageList(movesData);
          if (!_disableAutoSelect) setMovesUsageListUpdated(true);
        }
        if (teratypesData !== null) {
          setTeratypesUsageList(teratypesData);
          if (!_disableAutoSelect) setTeratypesUsageListUpdated(true);
        }
        if (abilitiesData !== null) {
          setAbilitiesUsageList(abilitiesData);
          if (!_disableAutoSelect) setAbilitiesUsageListUpdated(true);
        }
        if (chaosNatureSpread1 !== null) {
          setChaosSpread1(chaosNatureSpread1);
          const metaBuilds =
            MetaBuildsUsage.getListFromChaos1(chaosNatureSpread1);
          setMetaBuildsUsageList(metaBuilds);
          if (!_disableAutoSelect) setMetaBuildsUsageListUpdated(true);
        }
        if (chaosSpread2 !== null) {
          setChaosSpread2Data(chaosSpread2);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "errors.movesetsFetchFailed"
        );
        setEmptyMovesets();
        if (!_disableAutoSelect) {
          setItemsUsageListUpdated(true);
          setMovesUsageListUpdated(true);
          setTeratypesUsageListUpdated(true);
          setAbilitiesUsageListUpdated(true);
          setMetaBuildsUsageListUpdated(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    currentReg,
    currentRule,
    currentMonthTag,
    currentCutline,
    rootFormeSpecies,
  ]);

  const chaosSpread2 = useMemo(() => {
    const spreads: Map<StatID, Map<number, number>> = new Map();
    if (!chaosSpread2Data || !species) return spreads;
    const baseStats = species.baseStats;
    chaosSpread2Data.forEach((row) => {
      if (row.stat === null || row.stat === undefined) {
        return;
      }

      let stats = 0;
      let tag = row.stat as StatID;
      if (!tag) {
        return;
      }

      if (!spreads.has(tag)) {
        spreads.set(tag, new Map<number, number>());
      }

      const level = 50;
      stats = computeStat({
        base: baseStats[tag],
        iv: 31,
        ev: row.ev,
        level,
        statId: tag,
        effect: row.effect,
      });

      const statMap = spreads.get(tag)!;
      statMap.set(stats, (statMap.get(stats) || 0) + row.percentage);
    });

    return spreads;
  }, [species, chaosSpread2Data]);

  return {
    disableAutoSelect,
    setDisableAutoSelect,
    itemsUsageList,
    itemsUsageListUpdated,
    setItemsUsageListUpdated,
    movesUsageList,
    movesUsageListUpdated,
    setMovesUsageListUpdated,
    teratypesUsageList,
    teratypesUsageListUpdated,
    setTeratypesUsageListUpdated,
    abilitiesUsageList,
    abilitiesUsageListUpdated,
    setAbilitiesUsageListUpdated,
    chaosSpread1,
    metaBuildsUsageList,
    metaBuildsUsageListUpdated,
    setMetaBuildsUsageListUpdated,
    chaosSpread2,
    loading,
    error,
  };
};

// 攻击者Movesets Provider
export const AttackerMovesetsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const value = usePokemonMovesetsLogic("pokemon-attacker");

  return (
    <AttackerMovesetsContext.Provider value={value}>
      {children}
    </AttackerMovesetsContext.Provider>
  );
};

// 防御者Movesets Provider
export const DefenderMovesetsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const value = usePokemonMovesetsLogic("pokemon-defender");

  return (
    <DefenderMovesetsContext.Provider value={value}>
      {children}
    </DefenderMovesetsContext.Provider>
  );
};

// 攻击者Movesets Hook
export const useAttackerMovesets = (): PokemonMovesetsContextType => {
  const context = useContext(AttackerMovesetsContext);
  if (context === undefined) {
    throw new Error(
      "useAttackerMovesets must be used within an AttackerMovesetsProvider"
    );
  }
  return context;
};

// 防御者Movesets Hook
export const useDefenderMovesets = (): PokemonMovesetsContextType => {
  const context = useContext(DefenderMovesetsContext);
  if (context === undefined) {
    throw new Error(
      "useDefenderMovesets must be used within a DefenderMovesetsProvider"
    );
  }
  return context;
};

// 兼容性Hook - 根据isAttacker参数返回对应的上下文
export const usePokemonMovesets = (
  isAttacker?: boolean
): PokemonMovesetsContextType => {
  const attackerContext = useContext(AttackerMovesetsContext);
  const defenderContext = useContext(DefenderMovesetsContext);

  if (isAttacker === true) {
    if (attackerContext === undefined) {
      throw new Error(
        "useAttackerMovesets must be used within an AttackerMovesetsProvider"
      );
    }
    return attackerContext;
  } else if (isAttacker === false) {
    if (defenderContext === undefined) {
      throw new Error(
        "useDefenderMovesets must be used within a DefenderMovesetsProvider"
      );
    }
    return defenderContext;
  } else {
    // 为了向后兼容，如果没有指定isAttacker，尝试返回任一可用的上下文
    if (attackerContext !== undefined) {
      return attackerContext;
    }
    if (defenderContext !== undefined) {
      return defenderContext;
    }
    throw new Error(
      "usePokemonMovesets must be used within a PokemonMovesetsProvider"
    );
  }
};

// 保持原有的PokemonMovesetsProvider作为兼容性导出
export const PokemonMovesetsProvider = AttackerMovesetsProvider;
