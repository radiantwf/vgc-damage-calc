import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAttackerState, useDefenderState } from "./PokemonStateContext";
import { useField, useFieldSide } from "./FieldContext";
// 使用本地扩展的 Result（包含文本方法）
import { Pokemon } from "../models/pokemon.calculator.model";
import {
  Result,
  computeSideMoveResults,
} from "../models/result.calculator.model";
// ShowdownDataService 已由模型层使用，这里无需直接依赖

// 直接以扩展 Result 作为展示数据来源（数组索引与原始招式索引一致）

interface DamageComputeContextType {
  // 当前是否以攻击方为主进行计算（由“全局唯一招式选择”决定）
  isAttackerSelected: boolean;

  // 选中的招式对应的计算结果对象（集中从 Result 获取展示文本）
  selectedResult?: Result;

  // 全局唯一的招式选择（在攻击者与防御者所有招式中仅能选中一个）
  selectedMoveIndex: number; // 扁平化后的索引
  setSelectedMoveIndex: (index: number) => void;
  selectedMoveSide?: "attacker" | "defender";

  // 根据侧+原始索引获取全局索引（供UI将每侧按钮的key映射为全局index）
  getGlobalIndexForSideOriginal: (
    isAttackerSide: boolean,
    originalIndex: number,
  ) => number | undefined;

  // 每侧 4 个招式的计算结果数组（用于列表与详情展示）
  attackerSideResults: (Result | undefined)[];
  defenderSideResults: (Result | undefined)[];
}

const DamageComputeContext = createContext<
  DamageComputeContextType | undefined
>(undefined);

interface DamageComputeProviderProps {
  children: ReactNode;
}

export const DamageComputeProvider: React.FC<DamageComputeProviderProps> = ({
  children,
}) => {
  const attacker = useAttackerState();
  const defender = useDefenderState();

  const { getField } = useField();
  const attackerSideCtx = useFieldSide(true);
  const defenderSideCtx = useFieldSide(false);

  // 扁平化所有有效招式：攻击者的4个 + 防御者的4个（过滤 undefined）
  type CombinedMove = {
    side: "attacker" | "defender";
    originalIndex: number;
    name: string;
  };
  const allMoves: CombinedMove[] = useMemo(() => {
    const result: CombinedMove[] = [];
    const attackerMoves = [
      attacker.move1,
      attacker.move2,
      attacker.move3,
      attacker.move4,
    ];
    const defenderMoves = [
      defender.move1,
      defender.move2,
      defender.move3,
      defender.move4,
    ];
    attackerMoves.forEach((m, idx) => {
      if (m)
        result.push({ side: "attacker", originalIndex: idx, name: m.name });
    });
    defenderMoves.forEach((m, idx) => {
      if (m)
        result.push({ side: "defender", originalIndex: idx, name: m.name });
    });
    return result;
  }, [
    attacker.move1,
    attacker.move2,
    attacker.move3,
    attacker.move4,
    defender.move1,
    defender.move2,
    defender.move3,
    defender.move4,
  ]);

  // 由计算上下文维护“全局唯一招式选择”索引（指向 allMoves）
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(-1);

  // 当招式列表变化但尚未选中或当前选择失效时，默认选中第一个有效招式
  useEffect(() => {
    if (allMoves.length === 0) {
      if (selectedMoveIndex !== -1) setSelectedMoveIndex(-1);
      return;
    }
    if (selectedMoveIndex < 0 || selectedMoveIndex >= allMoves.length) {
      setSelectedMoveIndex(0);
    }
  }, [allMoves, selectedMoveIndex]);

  // 统一的每侧招式计算，返回扩展 Result 的数组
  const computeSideResults = useCallback(
    (isAttackerSide: boolean): (Result | undefined)[] => {
      const atkPokemon = isAttackerSide
        ? attacker.calcPokemon
        : defender.calcPokemon;
      const defPokemon = isAttackerSide
        ? defender.calcPokemon
        : attacker.calcPokemon;
      const defPokemonSpecies = isAttackerSide
        ? defender.pokemonSpecies
        : attacker.pokemonSpecies;
      const field = getField();
      field.attackerSide = isAttackerSide
        ? attackerSideCtx.getSide()
        : defenderSideCtx.getSide();
      field.defenderSide = isAttackerSide
        ? defenderSideCtx.getSide()
        : attackerSideCtx.getSide();
      let rets = computeSideMoveResults(
        atkPokemon as Pokemon | undefined,
        defPokemon as Pokemon | undefined,
        (idx) =>
          isAttackerSide ? attacker.getMove(idx) : defender.getMove(idx),
        field,
      );
      if (rets && defPokemonSpecies?.value.name === "Aegislash") {
        for (const ret of rets) {
          if (ret) {
            ret.overrideDefenderPokemonName = "Aegislash";
          }
        }
      }
      return rets;
    },
    [
      attacker.calcPokemon,
      defender.calcPokemon,
      attacker.pokemonSpecies,
      defender.pokemonSpecies,
      attackerSideCtx,
      defenderSideCtx,
      getField,
      attacker.getMove,
      defender.getMove,
    ],
  );

  const attackerSideResults = useMemo(
    () => computeSideResults(true),
    [computeSideResults],
  );
  const defenderSideResults = useMemo(
    () => computeSideResults(false),
    [computeSideResults],
  );

  const isAttackerSelected = useMemo(() => {
    const selected =
      selectedMoveIndex >= 0 ? allMoves[selectedMoveIndex] : undefined;
    return selected ? selected.side === "attacker" : true;
  }, [allMoves, selectedMoveIndex]);

  const selectedResult = useMemo(() => {
    const selected =
      selectedMoveIndex >= 0 ? allMoves[selectedMoveIndex] : undefined;
    if (!selected) return undefined;
    const results =
      selected.side === "attacker" ? attackerSideResults : defenderSideResults;
    const result = results[selected.originalIndex];
    return result;
  }, [allMoves, selectedMoveIndex, attackerSideResults, defenderSideResults]);

  const lastLoggedIndexRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (selectedResult === undefined) return;
    const idx = selectedMoveIndex;
    if (lastLoggedIndexRef.current !== idx) {
      try {
        console.log("result", selectedResult);
        console.log("moveDesc", selectedResult.moveDesc());
        console.log("fullDesc", selectedResult.fullDesc());
      } catch (error) {}
      lastLoggedIndexRef.current = idx;
    }
  }, [selectedResult, selectedMoveIndex]);

  const getGlobalIndexForSideOriginal = useCallback(
    (isAttackerSide: boolean, originalIndex: number): number | undefined => {
      const side: "attacker" | "defender" = isAttackerSide
        ? "attacker"
        : "defender";
      const foundIdx = allMoves.findIndex(
        (m) => m.side === side && m.originalIndex === originalIndex,
      );
      return foundIdx >= 0 ? foundIdx : undefined;
    },
    [allMoves],
  );

  const value: DamageComputeContextType = {
    isAttackerSelected,
    selectedResult,
    selectedMoveIndex,
    setSelectedMoveIndex,
    getGlobalIndexForSideOriginal,
    attackerSideResults,
    defenderSideResults,
  };

  return (
    <DamageComputeContext.Provider value={value}>
      {children}
    </DamageComputeContext.Provider>
  );
};

export const useDamageCompute = (): DamageComputeContextType => {
  const context = useContext(DamageComputeContext);
  if (!context) {
    throw new Error(
      "useDamageCompute must be used within a DamageComputeProvider",
    );
  }
  return context;
};
