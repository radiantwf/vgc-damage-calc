import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ShowdownFormats } from "../models/showndown.model";
import { showdownStatsService } from "../services/showdown.stats.service";

const defaultGen = 9;

export interface FormatsState {
  showdownFormats: ShowdownFormats | undefined;
  currentGen: number;
  currentReg: string | undefined;
  currentMonthTag: string | undefined;
  currentRule: string | undefined;
  currentCutline: string | undefined;
  loading: boolean;
  error: string | undefined;
}

export interface FormatsActions {
  setCurrentReg: (reg: string | undefined) => void;
  setCurrentMonthTag: (monthTag: string | undefined) => void;
  setCurrentRule: (rule: string | undefined) => void;
  setCurrentCutline: (cutline: string | undefined) => void;
  refreshData: () => Promise<void>;
}

export interface UseFormatsDataReturn extends FormatsState, FormatsActions {
  regList: string[];
  monthTagList: string[];
  ruleList: string[];
  cutlineList: string[];
}

const useFormatsData = (): UseFormatsDataReturn => {
  const [state, setState] = useState<FormatsState>({
    showdownFormats: undefined,
    currentGen: defaultGen,
    currentReg: undefined,
    currentMonthTag: undefined,
    currentRule: undefined,
    currentCutline: undefined,
    loading: false,
    error: undefined,
  });

  const regList = state.showdownFormats?.regs || [];
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
        const newState = { ...prev, currentReg: reg };
        if (reg) {
          newState.currentGen =
            state.showdownFormats?.getGen(reg) || defaultGen;
        }
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

        if (formats && !prev.currentReg) {
          newState.currentReg =
            formats.regs.length > 0 ? formats.regs[0] : undefined;

          if (newState.currentReg) {
            const monthTags = formats.getYyyyMMList(newState.currentReg);
            newState.currentMonthTag =
              monthTags && monthTags.length > 0 ? monthTags[0] : undefined;

            const rules = formats.getRuleList(newState.currentReg);
            newState.currentRule =
              rules && rules.length > 0 ? rules[0] : undefined;

            const cutlines = formats.cutlineList;
            newState.currentCutline =
              cutlines && cutlines.length > 0 ? cutlines[0] : undefined;
          }
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
    regList,
    monthTagList,
    ruleList,
    cutlineList,
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
