import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { usePokemonMovesets } from "./PokemonMovesetsContext";
import { AbilityData } from "../vendors/smogon/pokemon-showdown/sim/dex-abilities";
import { ItemData } from "../vendors/smogon/pokemon-showdown/sim/dex-items";
import { MoveData } from "../vendors/smogon/pokemon-showdown/sim/dex-moves";
import { SpeciesData } from "../vendors/smogon/pokemon-showdown/sim/dex-species";
import { NatureData } from "../vendors/smogon/pokemon-showdown/sim/dex-data";
import { Pokemon } from "../models/pokemon.calculator.model";
import { ShowdownDataService } from "../services/showdown.data.service";
import {
  StatsTable,
  Generations,
} from "../vendors/smogon/damage-calc-dist/index";
import { Move } from "../vendors/smogon/damage-calc-dist";
import {
  ItemName,
  AbilityName,
  TypeName,
  StatusName,
  SpeciesName,
  GenerationNum,
} from "../vendors/smogon/damage-calc-dist/data/interface";
import { isEvsEqual, MetaBuildsUsage } from "../models/showndown.model";
import { Natures } from "../vendors/smogon/pokemon-showdown/data/natures";
import { computeStat } from "../utils/stats.utils";
import { useFormats } from "./FormatsContext";

// 增强能量选项类型
export type BoostedStatOption =
  | "inactive"
  | "auto"
  | "atk"
  | "def"
  | "spa"
  | "spd"
  | "spe";

interface PokemonStateContextType {
  // 宝可梦实例
  calcPokemon: Pokemon | undefined;

  // 宝可梦基本信息
  pokemonSpecies: { value: SpeciesData } | undefined;
  setPokemonName: (species: unknown) => void;
  setPokemonForme: (forme: unknown) => void;

  rootFormeSpecies: { value: SpeciesData } | undefined;

  // 等级
  level: number;
  setLevel: (level: number) => void;

  // 特性
  ability: AbilityData | undefined;
  setAbility: (value: unknown) => void;

  // 道具
  item: ItemData | undefined;
  setItem: (value: unknown) => void;

  // 太晶属性
  teraType: TypeName | undefined;
  setTeraType: React.Dispatch<React.SetStateAction<TypeName | undefined>>;

  isTera: boolean;
  setIsTera: React.Dispatch<React.SetStateAction<boolean>>;
  isDynamaxed: boolean;
  setIsDynamaxed: React.Dispatch<React.SetStateAction<boolean>>;
  isMega: boolean;
  setIsMega: React.Dispatch<React.SetStateAction<boolean>>;

  // 招式
  move1: MoveData | undefined;
  setMove1: (value: unknown) => void;
  move2: MoveData | undefined;
  setMove2: (value: unknown) => void;
  move3: MoveData | undefined;
  setMove3: (value: unknown) => void;
  move4: MoveData | undefined;
  setMove4: (value: unknown) => void;

  // 招式命中次数（用于多段攻击），默认 undefined 表示不覆盖第三方库的内置命中次数逻辑
  move1Hits: number | undefined;
  setMove1Hits: (hits: number | undefined) => void;
  move2Hits: number | undefined;
  setMove2Hits: (hits: number | undefined) => void;
  move3Hits: number | undefined;
  setMove3Hits: (hits: number | undefined) => void;
  move4Hits: number | undefined;
  setMove4Hits: (hits: number | undefined) => void;

  move1BP: number | undefined;
  setMove1BP: (bp: number | undefined) => void;
  move2BP: number | undefined;
  setMove2BP: (bp: number | undefined) => void;
  move3BP: number | undefined;
  setMove3BP: (bp: number | undefined) => void;
  move4BP: number | undefined;
  setMove4BP: (bp: number | undefined) => void;

  move1z: boolean;
  setMove1z: (z: boolean) => void;
  move2z: boolean;
  setMove2z: (z: boolean) => void;
  move3z: boolean;
  setMove3z: (z: boolean) => void;
  move4z: boolean;
  setMove4z: (z: boolean) => void;

  // 暴击切换（由每侧控制）
  criticalHit: boolean;
  setCriticalHit: (criticalHit: boolean) => void;

  // 状态异常
  status?: StatusName;
  setStatus: (status?: StatusName) => void;

  // 根据当前侧的命中次数和暴击设置，构造 Move
  getMove: (originalIndex: number) => Move | undefined;

  // 构筑
  meta: MetaBuildsUsage | undefined;
  setMeta: (meta: MetaBuildsUsage | undefined) => void;

  // 性格
  nature: NatureData;
  setNature: (value: NatureData) => void;

  // 努力值
  evs: StatsTable;
  setEvs: (evs: StatsTable) => void;

  // 个体值
  ivs: StatsTable;
  setIvs: (ivs: StatsTable) => void;

  modifiedBaseStats: StatsTable;
  setModifiedBaseStats: (modifiedBaseStats: StatsTable) => void;

  // 属性增减（boost）
  boosts: StatsExceptHPTable;
  setBoosts: (boosts: StatsExceptHPTable) => void;

  // 增强能量（古代活性/夸克充能）
  boostedStat: BoostedStatOption;
  setBoostedStat: (option: BoostedStatOption) => void;

  // 威吓是否自动激活
  intimidateActived: boolean;
  setIntimidateActived: (intimidateActived: boolean) => void;

  intimidatedBoosts: StatsExceptHPTable;
  setIntimidatedBoosts: (intimidatedBoosts: StatsExceptHPTable) => void;

  currentHP: number | undefined;
  setCurrentHP: (currentHP: number | undefined) => void;
  maxHP: number;

  // 清空所有状态
  clearPokemonState: () => void;

  exportPokemonToClipboard: () => Promise<boolean>;
  importPokemonFromPasteText: (text: string) => Promise<boolean>;
  importPokemonFromClipboard: () => Promise<boolean>;
}

// 攻击者Context
const AttackerStateContext = createContext<PokemonStateContextType | undefined>(
  undefined
);

// 防御者Context
const DefenderStateContext = createContext<PokemonStateContextType | undefined>(
  undefined
);

// 创建通用的状态逻辑Hook
const usePokemonStateLogic = (pokemonId: string): PokemonStateContextType => {
  const { currentGen } = useFormats();

  // 获取 metaBuildsUsageList 从 PokemonMovesetsContext
  const { metaBuildsUsageList, setDisableAutoSelect } = usePokemonMovesets(
    pokemonId === "pokemon-attacker"
      ? true
      : pokemonId === "pokemon-defender"
      ? false
      : undefined
  );

  // calcPokemon状态
  const [calcPokemon, setCalcPokemon] = useState<Pokemon | undefined>(
    undefined
  );

  // 宝可梦基本信息
  const [pokemonSpecies, setPokemonSpecies] = useState<
    { value: SpeciesData } | undefined
  >(undefined);

  // 根表宝可梦基本信息
  const [rootFormeSpecies, setRootFormeSpecies] = useState<
    { value: SpeciesData } | undefined
  >(undefined);

  // setPokemonName函数：将unknown转换为SpeciesData
  const setPokemonName = useCallback((value: unknown) => {
    const species = value as SpeciesData | undefined;
    setPokemonSpecies(species ? { value: species } : undefined);
    if (!species) {
      setRootFormeSpecies(undefined);
      return;
    }
    const root = ShowdownDataService.getRootSpecies(species);
    setRootFormeSpecies(root ? { value: root } : undefined);
  }, []);

  // setPokemonForme函数：将unknown转换为SpeciesData
  const setPokemonForme = useCallback((value: unknown) => {
    const forme = value as SpeciesData | undefined;
    setPokemonSpecies(forme ? { value: forme } : undefined);
    if (!forme) {
      setRootFormeSpecies(undefined);
      return;
    }
    const root = ShowdownDataService.getRootSpecies(forme);
    if (!root) {
      setRootFormeSpecies(undefined);
      return;
    }
    if (root.name !== rootFormeSpecies?.value.name) {
      setRootFormeSpecies({ value: root });
    }
  }, [rootFormeSpecies]);

  useEffect(() => {
    clearPokemonState();
    const sideTag =
      pokemonId === "pokemon-attacker"
        ? "pokemon-attacker"
        : "pokemon-defender";
    window.dispatchEvent(
      new CustomEvent("pokemonSpeciesChanged", {
        detail: {
          side: sideTag,
          species: pokemonSpecies,
          root: rootFormeSpecies,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent("pokemonRootCleared", {
        detail: {
          side: sideTag,
          root: rootFormeSpecies,
        },
      })
    );
  }, [rootFormeSpecies]);

  // 特性
  const [ability, setAbilityState] = useState<AbilityData | undefined>(
    undefined
  );
  const setAbility = useCallback((value: unknown) => {
    setAbilityState(value as AbilityData | undefined);
    setBoostedStat("inactive" as BoostedStatOption);
  }, []);

  useEffect(() => {
    if (ability?.name === "Intimidate") {
      setIntimidateActived(true);
      return;
    }
  }, [ability]);

  // 道具
  const [item, setItemState] = useState<ItemData | undefined>(undefined);
  const setItem = useCallback((value: unknown) => {
    setItemState(value as ItemData | undefined);
  }, []);

  // 太晶属性
  const [teraType, setTeraType] = useState<TypeName | undefined>(undefined);

  const [isTera, setIsTera] = useState<boolean>(false);
  const [isDynamaxed, setIsDynamaxedState] = useState<boolean>(false);
  const setIsDynamaxed = useCallback((value: unknown) => {
    setIsDynamaxedState(value as boolean);
  }, []);

  const [isMega, setIsMega] = useState<boolean>(false);

  // 招式
  const [move1, setMove1State] = useState<MoveData | undefined>(undefined);
  const setMove1 = useCallback((value: unknown) => {
    setMove1State(value as MoveData | undefined);
  }, []);

  const [move2, setMove2State] = useState<MoveData | undefined>(undefined);
  const setMove2 = useCallback((value: unknown) => {
    setMove2State(value as MoveData | undefined);
  }, []);

  const [move3, setMove3State] = useState<MoveData | undefined>(undefined);
  const setMove3 = useCallback((value: unknown) => {
    setMove3State(value as MoveData | undefined);
  }, []);

  const [move4, setMove4State] = useState<MoveData | undefined>(undefined);
  const setMove4 = useCallback((value: unknown) => {
    setMove4State(value as MoveData | undefined);
  }, []);

  // 招式命中次数（用于多段攻击），默认 undefined 不覆盖第三方库的命中次数
  const [move1Hits, setMove1HitsState] = useState<number | undefined>(
    undefined
  );
  const [move2Hits, setMove2HitsState] = useState<number | undefined>(
    undefined
  );
  const [move3Hits, setMove3HitsState] = useState<number | undefined>(
    undefined
  );
  const [move4Hits, setMove4HitsState] = useState<number | undefined>(
    undefined
  );
  const setMove1Hits = useCallback((hits: number | undefined) => {
    setMove1HitsState(hits);
  }, []);
  const setMove2Hits = useCallback((hits: number | undefined) => {
    setMove2HitsState(hits);
  }, []);
  const setMove3Hits = useCallback((hits: number | undefined) => {
    setMove3HitsState(hits);
  }, []);
  const setMove4Hits = useCallback((hits: number | undefined) => {
    setMove4HitsState(hits);
  }, []);

  const [move1BP, setMove1BP] = useState<number | undefined>(undefined);
  const [move2BP, setMove2BP] = useState<number | undefined>(undefined);
  const [move3BP, setMove3BP] = useState<number | undefined>(undefined);
  const [move4BP, setMove4BP] = useState<number | undefined>(undefined);

  const [move1z, setMove1z] = useState<boolean>(false);
  const [move2z, setMove2z] = useState<boolean>(false);
  const [move3z, setMove3z] = useState<boolean>(false);
  const [move4z, setMove4z] = useState<boolean>(false);

  // 暴击
  const [criticalHit, setCriticalHit] = useState<boolean>(false);

  // 状态异常
  const [status, setStatusState] = useState<StatusName | undefined>(undefined);

  // 等级
  const [level, setLevel] = useState(50);

  // 构筑
  const [meta, setMetaState] = useState<MetaBuildsUsage | undefined>(undefined);
  const setMeta = useCallback((meta: MetaBuildsUsage | undefined) => {
    setMetaState(meta);
    if (meta) {
      setNatureState(meta?.nature || "serious");
      setEvs(
        meta?.evs ||
          ({
            hp: 0,
            atk: 0,
            def: 0,
            spa: 0,
            spd: 0,
            spe: 0,
          } as StatsTable)
      );
      setIvs({
        hp: 31,
        atk: 31,
        def: 31,
        spa: 31,
        spd: 31,
        spe: 31,
      } as StatsTable);
    }
  }, []);

  // 性格
  const [nature, setNatureState] = useState<NatureData>(Natures["serious"]);
  const setNature = useCallback((value: NatureData | undefined) => {
    setNatureState(value || Natures["serious"]);
  }, []);

  // 努力值
  const [evs, setEvs] = useState<StatsTable>({
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  } as StatsTable);

  // 个体值
  const [ivs, setIvs] = useState<StatsTable>({
    hp: 31,
    atk: 31,
    def: 31,
    spa: 31,
    spd: 31,
    spe: 31,
  } as StatsTable);

  const [modifiedBaseStats, setModifiedBaseStats] = useState<StatsTable>({
    hp: -1,
    atk: -1,
    def: -1,
    spa: -1,
    spd: -1,
    spe: -1,
  } as StatsTable);

  useEffect(() => {
    for (const meta of metaBuildsUsageList || []) {
      if (meta.evs && meta.nature === nature) {
        if (isEvsEqual(meta.evs, evs)) {
          setMetaState(meta);
          return;
        }
      }
    }
    setMetaState(undefined);
  }, [nature, evs, metaBuildsUsageList]);

  // 属性增减（boost）
  const [boosts, setBoosts] = useState<StatsExceptHPTable>({
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  } as StatsExceptHPTable);

  // 增强能量（古代活性/夸克充能）
  const [boostedStat, setBoostedStat] = useState<BoostedStatOption>("inactive");

  //  威吓是否自动激活
  const [intimidateActived, setIntimidateActived] = useState<boolean>(true);

  // 被威吓属性增减（boost）
  const [intimidatedBoosts, setIntimidatedBoosts] =
    useState<StatsExceptHPTable>({
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    } as StatsExceptHPTable);

  // 宝可梦基本信息
  const [currentHP, setCurrentHPState] = useState<number | undefined>(
    undefined
  );
  const setCurrentHP = useCallback((value: number | undefined) => {
    if (currentHP && currentHP >= maxHP) {
      setCurrentHP(undefined);
      return;
    }
    setCurrentHPState(value);
  }, []);

  const [maxHP, setMaxHP] = useState<number>(0);

  useEffect(() => {
    if (!pokemonSpecies) {
      setMaxHP(0);
      return;
    }
    if (pokemonSpecies.value.name === "Shedinja") {
      setMaxHP(1);
      return;
    }
    const max =
      computeStat({
        base:
          modifiedBaseStats.hp >= 0
            ? modifiedBaseStats.hp
            : pokemonSpecies.value.baseStats.hp || 0,
        iv: ivs.hp,
        ev: evs.hp,
        level: level,
        statId: "hp",
        nature: nature,
      }) * (isDynamaxed === true ? 2 : 1);
    setMaxHP(max);
  }, [pokemonSpecies, modifiedBaseStats, level, evs, ivs, isDynamaxed]);

  useEffect(() => {
    setCurrentHP(currentHP);
  }, [maxHP]);

  useEffect(() => {
    if (currentHP) {
      if (isDynamaxed === true) {
        setCurrentHP(currentHP * 2);
      } else {
        setCurrentHP(Math.floor(currentHP / 2));
      }
    }
  }, [isDynamaxed]);

  // 创建updateCalcPokemon回调函数
  const updateCalcPokemon = useCallback(() => {
    if (!pokemonSpecies) {
      setCalcPokemon(undefined);
      return;
    }

    try {
      // 创建新的CalcPokemon实例
      const gen = Generations.get(currentGen as GenerationNum);
      const baseStats: StatsTable<number> = {} as StatsTable<number>;
      for (const stat of Object.keys(
        modifiedBaseStats
      ) as (keyof StatsTable)[]) {
        if (modifiedBaseStats[stat] >= 0) {
          baseStats[stat] = modifiedBaseStats[stat];
        } else {
          baseStats[stat] = pokemonSpecies.value.baseStats[stat] || 0;
        }
      }
      const newBoosts = {
        atk: boosts.atk,
        def: boosts.def,
        spa: boosts.spa,
        spd: boosts.spd,
        spe: boosts.spe,
      };
      newBoosts.atk += intimidatedBoosts.atk;
      newBoosts.def += intimidatedBoosts.def;
      newBoosts.spa += intimidatedBoosts.spa;
      newBoosts.spd += intimidatedBoosts.spd;
      newBoosts.spe += intimidatedBoosts.spe;
      for (const stat of Object.keys(
        newBoosts
      ) as (keyof StatsExceptHPTable)[]) {
        if (newBoosts[stat] < -6) {
          newBoosts[stat] = -6;
        }
        if (newBoosts[stat] > 6) {
          newBoosts[stat] = 6;
        }
      }
      const newCalcPokemon = new Pokemon(gen, pokemonSpecies.value.name, {
        level: level,
        ability: ability?.name,
        item: item && item.name !== "(No Item)" ? item?.name : undefined,
        nature: nature?.name,
        teraType: isTera ? teraType : undefined,
        curHP: currentHP,
        evs: evs,
        ivs: ivs,
        isDynamaxed: isDynamaxed,
        status: status || undefined,
        boosts: newBoosts,
        boostedStat:
          boostedStat !== "inactive" &&
          (ability?.name === "Protosynthesis" ||
            ability?.name === "Quark Drive")
            ? boostedStat
            : undefined,
        moves: [move1?.name, move2?.name, move3?.name, move4?.name] as string[],
        overrides: { baseStats: baseStats },
      });
      newCalcPokemon.settingTeraType = teraType;
      setCalcPokemon(newCalcPokemon);
    } catch (error) {
      console.error("Error creating Pokemon:", error);
      setCalcPokemon(undefined);
    }
  }, [
    currentGen,
    pokemonSpecies,
    level,
    ability,
    item,
    nature,
    teraType,
    isTera,
    isDynamaxed,
    evs,
    ivs,
    modifiedBaseStats,
    boosts,
    status,
    boostedStat,
    move1,
    move2,
    move3,
    move4,
    currentHP,
    intimidatedBoosts,
  ]);

  const exportPokemonToClipboard = useCallback(async (): Promise<boolean> => {
    const p = calcPokemon;
    if (!p) return false;
    const text = p.exportToPasteText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [calcPokemon]);

  const importPokemonFromPasteText = useCallback(
    async (text: string) => {
      try {
        if (!text) return false;
        const list = Pokemon.importFromPasteText(currentGen, text);
        const p = list[0];
        if (!p) return false;
        const species = ShowdownDataService.getPokemonBaseInfo(p.species.name);
        if (calcPokemon?.species?.name !== species?.name) {
          setDisableAutoSelect(true);
        }
        const expectedRoot = ShowdownDataService.getRootSpecies(species);
        const sideTag =
          pokemonId === "pokemon-attacker"
            ? "pokemon-attacker"
            : "pokemon-defender";
        const shouldWaitClear =
          (expectedRoot?.name || "") !== (rootFormeSpecies?.value?.name || "");
        let waitClearPromise: Promise<void> | undefined;
        if (shouldWaitClear) {
          waitClearPromise = new Promise<void>((resolve) => {
            const handler = (ev: Event) => {
              const e = ev as CustomEvent<{ side: string; root?: { value: SpeciesData } }>;
              const detail = e.detail as unknown as {
                side: string;
                root?: { value: SpeciesData };
              };
              if (
                detail &&
                detail.side === sideTag &&
                detail.root?.value?.name === expectedRoot?.name
              ) {
                window.removeEventListener(
                  "pokemonRootCleared",
                  handler as EventListener
                );
                resolve();
              }
            };
            window.addEventListener(
              "pokemonRootCleared",
              handler as EventListener
            );
          });
        }
        setPokemonName(species);
        if (waitClearPromise) {
          await waitClearPromise;
        }
        setLevel(50);
        setNatureState(
          ShowdownDataService.getNatureByString(p.nature || "serious")
        );
        if (!p.ability) {
          p.ability = ShowdownDataService.NoAbility.name as AbilityName;
        }
        setAbilityState(ShowdownDataService.getPokemonAbilityInfo(p.ability));
        if (!p.item) {
          p.item = ShowdownDataService.NoItem.name as ItemName;
        }
        setItemState(ShowdownDataService.getPokemonItemInfo(p.item));
        setIsTera(false);
        setTeraType(p.teraType);
        if (p.evs) setEvs(p.evs);
        if (p.ivs) setIvs(p.ivs);
        setMove1State(ShowdownDataService.getPokemonMoveInfo(p.moves?.[0]));
        setMove2State(ShowdownDataService.getPokemonMoveInfo(p.moves?.[1]));
        setMove3State(ShowdownDataService.getPokemonMoveInfo(p.moves?.[2]));
        setMove4State(ShowdownDataService.getPokemonMoveInfo(p.moves?.[3]));
        return true;
      } catch {
        return false;
      }
    },
    [currentGen, calcPokemon]
  );

  const importPokemonFromClipboard = useCallback(async (): Promise<boolean> => {
    try {
      const text =
        navigator.clipboard && navigator.clipboard.readText
          ? await navigator.clipboard.readText()
          : "";
      if (!text) return false;
      return await importPokemonFromPasteText(text);
    } catch {
      return false;
    }
  }, [currentGen, calcPokemon, importPokemonFromPasteText]);

  // 根据当前侧的设置构造 Move（考虑多段命中与暴击）
  const getMove = useCallback(
    (originalIndex: number): Move | undefined => {
      if (!calcPokemon) return undefined;
      const hitsArray = [move1Hits, move2Hits, move3Hits, move4Hits];
      const bpArray = [move1BP, move2BP, move3BP, move4BP];
      const zArray = [move1z, move2z, move3z, move4z];
      const hits = hitsArray[originalIndex];
      const bp = bpArray[originalIndex];
      const z = zArray[originalIndex];
      const m = calcPokemon.getMove(originalIndex);
      if (!m) {
        return undefined;
      }
      if (item && item.name !== "(No Item)") {
        m.item = item?.name as ItemName;
      }
      m.species = calcPokemon.species.name as SpeciesName;
      m.ability = calcPokemon.ability;
      if (hits) {
        m.hits = hits;
      }
      if (bp) {
        m.overrides = { basePower: bp };
        m.bp = bp;
      }
      if (z) {
        m.useZ = true;
      }
      if (teraType === "Stellar") {
        m.isStellarFirstUse = true;
      }
      if (isDynamaxed) {
        m.useMax = true;
      }
      if (criticalHit) {
        m.isCrit = true;
      }
      return m;
    },
    [
      calcPokemon,
      move1Hits,
      move2Hits,
      move3Hits,
      move4Hits,
      move1BP,
      move2BP,
      move3BP,
      move4BP,
      move1z,
      move2z,
      move3z,
      move4z,
      criticalHit,
    ]
  );

  // 监听所有属性变化并更新calcPokemon
  useEffect(() => {
    updateCalcPokemon();
  }, [updateCalcPokemon]);

  // 清空所有状态
  const clearPokemonState = useCallback(() => {
    setAbilityState(undefined);
    setItemState(undefined);
    setTeraType(undefined);
    setIsTera(false);
    setIsDynamaxed(false);
    setIsMega(false);
    setMove1State(undefined);
    setMove2State(undefined);
    setMove3State(undefined);
    setMove4State(undefined);
    setMove1HitsState(undefined);
    setMove2HitsState(undefined);
    setMove3HitsState(undefined);
    setMove4HitsState(undefined);
    setMove1BP(undefined);
    setMove2BP(undefined);
    setMove3BP(undefined);
    setMove4BP(undefined);
    setMove1z(false);
    setMove2z(false);
    setMove3z(false);
    setMove4z(false);
    setCriticalHit(false);
    setStatusState(undefined);
    setLevel(50);
    setMetaState(undefined);
    setNatureState(Natures["serious"]);
    setEvs({
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    } as StatsTable);
    setIvs({
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    } as StatsTable);
    setModifiedBaseStats({
      hp: -1,
      atk: -1,
      def: -1,
      spa: -1,
      spd: -1,
      spe: -1,
    } as StatsTable);
    setBoosts({
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    } as StatsExceptHPTable);
    setCurrentHP(undefined);
    setBoostedStat("inactive" as BoostedStatOption);
    setIntimidateActived(true);
    // setIntimidatedBoosts({
    //   atk: 0,
    //   def: 0,
    //   spa: 0,
    //   spd: 0,
    //   spe: 0,
    // } as StatsExceptHPTable);
  }, []);

  return {
    calcPokemon,
    pokemonSpecies,
    rootFormeSpecies,
    setPokemonName,
    setPokemonForme,
    ability,
    setAbility,
    item,
    setItem,
    teraType,
    setTeraType,
    isTera,
    setIsTera,
    isDynamaxed,
    setIsDynamaxed,
    isMega,
    setIsMega,
    move1,
    setMove1,
    move2,
    setMove2,
    move3,
    setMove3,
    move4,
    setMove4,
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
    move1z,
    setMove1z,
    move2z,
    setMove2z,
    move3z,
    setMove3z,
    move4z,
    setMove4z,
    criticalHit,
    setCriticalHit,
    status,
    setStatus: (value?: StatusName) => setStatusState(value),
    getMove,
    level,
    setLevel,
    meta,
    setMeta,
    nature,
    setNature,
    evs,
    setEvs,
    ivs,
    setIvs,
    modifiedBaseStats,
    setModifiedBaseStats,
    boosts,
    setBoosts,
    boostedStat,
    setBoostedStat,
    intimidateActived,
    setIntimidateActived,
    intimidatedBoosts,
    setIntimidatedBoosts,
    currentHP,
    setCurrentHP,
    maxHP,
    clearPokemonState,
    exportPokemonToClipboard,
    importPokemonFromPasteText,
    importPokemonFromClipboard,
  };
};

interface PokemonStateProviderProps {
  children: ReactNode;
}

// 攻击者状态Provider
export const AttackerStateProvider: React.FC<PokemonStateProviderProps> = ({
  children,
}) => {
  const value = usePokemonStateLogic("pokemon-attacker");

  return (
    <AttackerStateContext.Provider value={value}>
      {children}
    </AttackerStateContext.Provider>
  );
};

// 防御者状态Provider
export const DefenderStateProvider: React.FC<PokemonStateProviderProps> = ({
  children,
}) => {
  const value = usePokemonStateLogic("pokemon-defender");

  return (
    <DefenderStateContext.Provider value={value}>
      {children}
    </DefenderStateContext.Provider>
  );
};

// 攻击者状态Hook
export const useAttackerState = (): PokemonStateContextType => {
  const context = useContext(AttackerStateContext);
  if (context === undefined) {
    throw new Error(
      "useAttackerState must be used within an AttackerStateProvider"
    );
  }
  return context;
};

// 防御者状态Hook
export const useDefenderState = (): PokemonStateContextType => {
  const context = useContext(DefenderStateContext);
  if (context === undefined) {
    throw new Error(
      "useDefenderState must be used within a DefenderStateProvider"
    );
  }
  return context;
};

// 兼容性Hook - 根据isAttacker参数返回对应的状态
export const usePokemonState = (
  isAttacker?: boolean
): PokemonStateContextType => {
  const attackerContext = useContext(AttackerStateContext);
  const defenderContext = useContext(DefenderStateContext);

  if (isAttacker === true) {
    if (attackerContext === undefined) {
      throw new Error(
        "usePokemonState with isAttacker=true must be used within an AttackerStateProvider"
      );
    }
    return attackerContext;
  } else if (isAttacker === false) {
    if (defenderContext === undefined) {
      throw new Error(
        "usePokemonState with isAttacker=false must be used within a DefenderStateProvider"
      );
    }
    return defenderContext;
  } else {
    // 如果没有指定isAttacker，尝试自动检测当前Context
    if (attackerContext !== undefined) {
      return attackerContext;
    } else if (defenderContext !== undefined) {
      return defenderContext;
    } else {
      throw new Error(
        "usePokemonState must be used within an AttackerStateProvider or DefenderStateProvider"
      );
    }
  }
};
