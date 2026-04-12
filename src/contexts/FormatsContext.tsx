import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ShowdownFormats } from "../models/showndown.model";
import { ShowdownDataService } from "../services/showdown.data.service";
import { showdownStatsService } from "../services/showdown.stats.service";

const defaultGen = 9;

export interface FormatsState {
  showdownFormats: ShowdownFormats | undefined;
  currentGen: number;
  currentGame: string | undefined;
  currentReg: string | undefined;
  currentMonthTag: string | undefined;
  currentRule: string | undefined;
  currentCutline: string | undefined;
  loading: boolean;
  error: string | undefined;
}

export interface FormatsActions {
  setCurrentGame: (game: string | undefined) => void;
  setCurrentReg: (reg: string | undefined) => void;
  setCurrentMonthTag: (monthTag: string | undefined) => void;
  setCurrentRule: (rule: string | undefined) => void;
  setCurrentCutline: (cutline: string | undefined) => void;
  refreshData: () => Promise<void>;
}

export interface UseFormatsDataReturn extends FormatsState, FormatsActions {
  gameList: string[];
  regList: string[];
  monthTagList: string[];
  ruleList: string[];
  cutlineList: string[];
}

const getGameList = (formats?: ShowdownFormats): string[] => {
  if (!formats) {
    return [];
  }
  return Array.from(new Set(formats.games));
};

const getRegListByGame = (
  formats?: ShowdownFormats,
  game?: string
): string[] => {
  if (!formats || !game) {
    return [];
  }
  return formats.gameRegs.get(game) || [];
};

const getGameByReg = (
  formats?: ShowdownFormats,
  reg?: string
): string | undefined => {
  if (!formats || !reg) {
    return undefined;
  }

  for (const [game, regs] of formats.gameRegs) {
    if (regs.includes(reg)) {
      return game;
    }
  }

  return undefined;
};

const getGenByGame = (
  formats?: ShowdownFormats,
  game?: string
): number => {
  return formats?.getGen(game) || defaultGen;
};

const useFormatsData = (): UseFormatsDataReturn => {
  const [state, setState] = useState<FormatsState>({
    showdownFormats: undefined,
    currentGen: defaultGen,
    currentGame: undefined,
    currentReg: undefined,
    currentMonthTag: undefined,
    currentRule: undefined,
    currentCutline: undefined,
    loading: false,
    error: undefined,
  });

  const gameList = getGameList(state.showdownFormats);
  const regList = getRegListByGame(state.showdownFormats, state.currentGame);
  const monthTagList =
    state.showdownFormats?.getYyyyMMList(state.currentReg || undefined) || [];
  const ruleList =
    state.showdownFormats?.getRuleList(state.currentReg || undefined) || [];
  const cutlineList = state.showdownFormats?.cutlineList || [];

  const setCurrentReg = useCallback(
    (reg: string | undefined) => {
      if (reg === state.currentReg) return;
      if (!state.showdownFormats) return;
      if (reg && !state.showdownFormats.regs.includes(reg)) return;

      setState((prev) => {
        const currentGame = reg
          ? getGameByReg(prev.showdownFormats, reg)
          : prev.currentGame;
        const currentGen = getGenByGame(prev.showdownFormats, currentGame);
        ShowdownDataService.setCurrentGameEnv(currentGame, currentGen);
        const newState = {
          ...prev,
          currentGame,
          currentReg: reg,
          currentGen,
        };
        const newMonthTagList =
          prev.showdownFormats?.getYyyyMMList(reg || undefined) || [];
        if (
          !(
            prev.currentMonthTag &&
            newMonthTagList.includes(prev.currentMonthTag)
          )
        ) {
          newState.currentMonthTag =
            newMonthTagList.length > 0 ? newMonthTagList[0] : undefined;
        }

        const newRuleList =
          prev.showdownFormats?.getRuleList(reg || undefined) || [];
        if (!newRuleList.includes(prev.currentRule || "")) {
          newState.currentRule =
            newRuleList.length > 0 ? newRuleList[0] : undefined;
        }

        const newCutlineList = prev.showdownFormats?.cutlineList || [];
        if (!newCutlineList.includes(prev.currentCutline || "")) {
          newState.currentCutline =
            newCutlineList.length > 0 ? newCutlineList[0] : undefined;
        }
        return newState;
      });
    },
    [state.currentReg, state.showdownFormats]
  );

  const setCurrentGame = useCallback(
    (game: string | undefined) => {
      if (game === state.currentGame) return;
      if (!state.showdownFormats) return;
      if (game && !getGameList(state.showdownFormats).includes(game)) return;

      const nextReg = getRegListByGame(state.showdownFormats, game)[0];
      ShowdownDataService.setCurrentGameEnv(
        game,
        getGenByGame(state.showdownFormats, game),
      );

      setState((prev) => ({
        ...prev,
        currentGame: game,
      }));
      setCurrentReg(nextReg);
    },
    [setCurrentReg, state.currentGame, state.showdownFormats]
  );

  const setCurrentMonthTag = useCallback(
    (monthTag: string | undefined) => {
      if (monthTag === state.currentMonthTag) return;
      if (!state.showdownFormats) return;

      const availableMonthTags =
        state.showdownFormats.getYyyyMMList(state.currentReg || undefined) ||
        [];
      if (monthTag && !availableMonthTags.includes(monthTag)) return;

      setState((prev) => ({ ...prev, currentMonthTag: monthTag }));
    },
    [state.currentMonthTag, state.currentReg, state.showdownFormats]
  );

  const setCurrentRule = useCallback(
    (rule: string | undefined) => {
      if (rule === state.currentRule) return;
      if (!state.showdownFormats) return;

      const availableRules =
        state.showdownFormats.getRuleList(state.currentReg || undefined) || [];
      if (rule && !availableRules.includes(rule)) return;

      setState((prev) => ({ ...prev, currentRule: rule }));
    },
    [state.currentRule, state.currentReg, state.showdownFormats]
  );

  const setCurrentCutline = useCallback(
    (cutline: string | undefined) => {
      if (cutline === state.currentCutline) return;
      if (!state.showdownFormats) return;

      const availableCutlines = state.showdownFormats.cutlineList || [];
      if (cutline && !availableCutlines.includes(cutline)) return;

      setState((prev) => ({ ...prev, currentCutline: cutline }));
    },
    [state.currentCutline, state.showdownFormats]
  );

  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const formats = await showdownStatsService.getFormats();
      setState((prev) => {
        const newState = {
          ...prev,
          showdownFormats: formats || undefined,
          loading: false,
          error: undefined,
        };

        if (formats) {
          const availableGames = getGameList(formats);
          const currentGame =
            prev.currentGame && availableGames.includes(prev.currentGame)
              ? prev.currentGame
              : getGameByReg(formats, prev.currentReg) || availableGames[0];
          const availableRegs = getRegListByGame(formats, currentGame);
          const currentReg =
            prev.currentReg && availableRegs.includes(prev.currentReg)
              ? prev.currentReg
              : availableRegs[0];
          const currentGen = getGenByGame(formats, currentGame);
          ShowdownDataService.setCurrentGameEnv(currentGame, currentGen);
          const monthTags = formats.getYyyyMMList(currentReg);
          const rules = formats.getRuleList(currentReg);
          const cutlines = formats.cutlineList;

          newState.currentGame = currentGame;
          newState.currentReg = currentReg;
          newState.currentGen = currentGen;
          newState.currentMonthTag =
            prev.currentMonthTag && monthTags?.includes(prev.currentMonthTag)
              ? prev.currentMonthTag
              : monthTags?.[0];
          newState.currentRule =
            prev.currentRule && rules?.includes(prev.currentRule)
              ? prev.currentRule
              : rules?.[0];
          newState.currentCutline =
            prev.currentCutline && cutlines.includes(prev.currentCutline)
              ? prev.currentCutline
              : cutlines[0];
        }

        return newState;
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "加载数据失败",
      }));
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    ...state,
    gameList,
    regList,
    monthTagList,
    ruleList,
    cutlineList,
    setCurrentGame,
    setCurrentReg,
    setCurrentMonthTag,
    setCurrentRule,
    setCurrentCutline,
    refreshData,
  };
};

interface FormatsContextType extends UseFormatsDataReturn {}
const FormatsContext = createContext<FormatsContextType | undefined>(undefined);

export const FormatsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const value = useFormatsData();
  return (
    <FormatsContext.Provider value={value}>{children}</FormatsContext.Provider>
  );
};

export const useFormats = (): FormatsContextType => {
  const context = useContext(FormatsContext);
  if (context === undefined) {
    throw new Error("useFormats must be used within a FormatsProvider");
  }
  return context;
};
