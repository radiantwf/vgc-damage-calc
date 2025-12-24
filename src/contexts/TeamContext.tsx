import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePokemonState } from "./PokemonStateContext";
import { confirmable, ContextAwareConfirmation } from "react-confirm";
import ConfirmDialog, {
  type ConfirmPayload,
} from "../ui/widgets/ConfirmDialog/ConfirmDialog";
import { ShowdownDataService } from "../services/showdown.data.service";
import { Pokemon } from "../models/pokemon.calculator.model";
import { useFormats } from "./FormatsContext";

type SaveEditResponse = "save" | "discard" | "edit";

interface TeamSlot {
  pasteText: string | undefined;
  imgURL: string | undefined;
}

interface TeamState {
  slots: (TeamSlot | undefined)[];
  selectedIndex: number;
  selectSlot: (index: number) => void;
  addSlot: () => void;
  removeSlot: (index: number) => void;
  exportTeamToClipboard: () => Promise<boolean>;
  importTeamFromClipboard: () => Promise<boolean>;
}

const AttackerTeamContext = createContext<TeamState | undefined>(undefined);
const DefenderTeamContext = createContext<TeamState | undefined>(undefined);

const useTeamLogic = (side: "attacker" | "defender"): TeamState => {
  const {
    calcPokemon,
    importPokemonFromPasteText,
    pokemonSpecies,
    setPokemonName,
  } = usePokemonState(side === "attacker");
  const { currentGen } = useFormats();

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [slots, setSlots] = useState<(TeamSlot | undefined)[]>([undefined]);

  const opQueueRef = useRef<Promise<void>>(Promise.resolve());

  async function runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
    const prev = opQueueRef.current;
    let release: () => void;
    opQueueRef.current = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  const enqueueExclusive = (fn: () => Promise<void> | void): void => {
    void runExclusive(async () => {
      await fn();
    });
  };

  const confirm = ContextAwareConfirmation.createConfirmation(
    confirmable(ConfirmDialog)
  ) as <R>(payload: ConfirmPayload<R>) => Promise<R>;

  const ensureSaveCurrentIfDirty = async (): Promise<
    SaveEditResponse | "none"
  > => {
    const currentText = calcPokemon?.exportToPasteText();
    const savedText = slots[selectedIndex]?.pasteText;
    if (currentText && currentText !== savedText) {
      const action = await confirm<SaveEditResponse>({
        messageKey: "team.confirmSavePaste.message",
        buttons: [
          {
            labelKey: "team.confirmSavePaste.save",
            value: "save",
            tone: "primary",
          },
          {
            labelKey: "team.confirmSavePaste.discard",
            value: "discard",
            tone: "danger",
          },
          {
            labelKey: "team.confirmSavePaste.editAgain",
            value: "edit",
            tone: "default",
          },
        ],
      });
      if (action === "save") {
        setSlots((prev) => {
          const next = [...prev];
          next[selectedIndex] = {
            pasteText: currentText,
            imgURL: ShowdownDataService.getPokemonImgUrl(
              pokemonSpecies?.value?.name
            ),
          };
          return next;
        });
      }
      return action;
    }
    return "none";
  };
  useEffect(() => {
    if (selectedIndex >= slots.length) {
      return;
    }
    const pasteText = slots[selectedIndex]?.pasteText;
    if (pasteText) {
      importPokemonFromPasteText(pasteText);
    } else {
      setPokemonName(undefined);
    }
  }, [selectedIndex, slots]);

  const selectSlot = (index: number) => {
    if (selectedIndex === index) return;
    enqueueExclusive(async () => {
      const prevIndex = selectedIndex;
      const prevSaved = slots[prevIndex]?.pasteText;
      const currentText = calcPokemon?.exportToPasteText();
      if (currentText && currentText !== prevSaved) {
        const decision = await ensureSaveCurrentIfDirty();
        if (decision === "edit") {
          return;
        }
      }
      setSlots((prev) => {
        let targetIndex = Math.max(
          0,
          Math.min(index, Math.max(0, slots.length - 1))
        );
        let next = [...prev];
        const shouldRemovePrev = !next[prevIndex] && !currentText && !prevSaved;

        if (shouldRemovePrev) {
          next.splice(prevIndex, 1);
          if (targetIndex > prevIndex)
            targetIndex = Math.max(0, targetIndex - 1);
        }
        setSelectedIndex(targetIndex);
        return next;
      });
    });
  };

  const addSlot = () => {
    enqueueExclusive(async () => {
      const prevIndex = selectedIndex;
      const prevSaved = slots[prevIndex]?.pasteText;
      const currentText = calcPokemon?.exportToPasteText();
      if (!currentText && !prevSaved) return;
      if (currentText && currentText !== prevSaved) {
        const decision = await ensureSaveCurrentIfDirty();
        if (decision === "edit") {
          return;
        } else if (decision === "discard" && !prevSaved) {
          setSlots((prev) => {
            return [...prev];
          });
          return;
        }
      }
      setSlots((prev) => {
        if (prev.length >= 6) return prev;
        let next = [...prev];
        const shouldRemovePrev = !next[prevIndex] && !currentText && !prevSaved;

        if (shouldRemovePrev && next.length > 0) {
          next.splice(prevIndex, 1);
        }

        next = [...next, undefined];
        const targetIndex = Math.max(0, next.length - 1);
        setSelectedIndex(targetIndex);
        return next;
      });
    });
  };

  const removeSlot = (index: number) => {
    enqueueExclusive(async () => {
      setSlots((prev) => {
        let next: (TeamSlot | undefined)[];
        if (prev.length <= 1) {
          next = [...prev];
          next[0] = undefined;
        } else {
          next = [...prev];
          next.splice(index, 1);
        }
        const targetIndex = Math.max(
          0,
          Math.min(index, Math.max(0, next.length - 1))
        );
        setSelectedIndex(targetIndex);
        return next;
      });
    });
  };

  const exportTeamToClipboard = async (): Promise<boolean> => {
    const prevIndex = selectedIndex;
    const prevSaved = slots[prevIndex]?.pasteText;
    const currentText = calcPokemon?.exportToPasteText();
    let decision: SaveEditResponse | "none" = "none";
    if (currentText && currentText !== prevSaved) {
      decision = await ensureSaveCurrentIfDirty();
      if (decision === "edit") {
        return false;
      }
      if (decision === "discard") {
        await runExclusive(async () => {
          const t = slots[prevIndex]?.pasteText;
          if (t && t.length > 0) {
            importPokemonFromPasteText(t);
          } else {
            setPokemonName(undefined);
          }
        });
      }
    }
    const snapshot = (() => {
      if (decision === "save" && currentText) {
        const img = ShowdownDataService.getPokemonImgUrl(
          pokemonSpecies?.value?.name
        );
        const next = [...slots];
        next[prevIndex] = { pasteText: currentText, imgURL: img };
        return next;
      }
      return slots;
    })();

    return await runExclusive(async () => {
      try {
        const texts: string[] = [];
        for (let i = 0; i < snapshot.length; i++) {
          const t = snapshot[i]?.pasteText?.trim();
          if (t && t.length > 0) {
            texts.push(t);
          }
        }
        const finalText = texts.join("\n\n");
        if (!finalText) return false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(finalText);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });
  };

  const importTeamFromClipboard = async (): Promise<boolean> => {
    const prevIndex = selectedIndex;
    const prevSaved = slots[prevIndex]?.pasteText;
    const currentText = calcPokemon?.exportToPasteText();
    if (currentText && currentText !== prevSaved) {
      const decision = await ensureSaveCurrentIfDirty();
      if (decision === "edit") {
        return false;
      }
    }
    const text =
      navigator.clipboard && navigator.clipboard.readText
        ? await navigator.clipboard.readText()
        : "";
    if (!text) return false;
    return await runExclusive(async () => {
      try {
        const pokemons = Pokemon.importFromPasteText(currentGen, text);
        if (!pokemons || pokemons.length === 0) return false;

        setSlots((prev) => {
          const tmp = [];
          for (let i = 0; i < prev.length; i++) {
            if (!prev[i]) continue;
            tmp[i] = prev[i];
          }
          for (let i = 0; i < pokemons.length && i < 6; i++) {
            if (!pokemons[i]) continue;
            const pokemon = pokemons[i];
            tmp[i] = {
              pasteText: pokemon.exportToPasteText(),
              imgURL: ShowdownDataService.getPokemonImgUrl(
                pokemon.species.name
              ),
            };
            if (tmp.length >= 6) break;
          }
          const next = tmp.slice(-6);
          return next;
        });

        return true;
      } catch {
        return false;
      }
    });
  };

  return {
    slots,
    selectedIndex,
    selectSlot,
    addSlot,
    removeSlot,
    exportTeamToClipboard,
    importTeamFromClipboard,
  };
};

export const AttackerTeamProvider: React.FC<
  React.PropsWithChildren<unknown>
> = ({ children }) => {
  const value = useTeamLogic("attacker");
  return (
    <AttackerTeamContext.Provider value={value}>
      {children}
    </AttackerTeamContext.Provider>
  );
};

export const DefenderTeamProvider: React.FC<
  React.PropsWithChildren<unknown>
> = ({ children }) => {
  const value = useTeamLogic("defender");
  return (
    <DefenderTeamContext.Provider value={value}>
      {children}
    </DefenderTeamContext.Provider>
  );
};

export const useTeamState = (isAttacker?: boolean): TeamState => {
  const attacker = useContext(AttackerTeamContext);
  const defender = useContext(DefenderTeamContext);
  if (isAttacker === true) {
    if (!attacker)
      throw new Error(
        "useTeamState(attacker) must be used within AttackerTeamProvider"
      );
    return attacker;
  }
  if (isAttacker === false) {
    if (!defender)
      throw new Error(
        "useTeamState(defender) must be used within DefenderTeamProvider"
      );
    return defender;
  }
  if (attacker) return attacker;
  if (defender) return defender;
  throw new Error(
    "useTeamState must be used within AttackerTeamProvider or DefenderTeamProvider"
  );
};
