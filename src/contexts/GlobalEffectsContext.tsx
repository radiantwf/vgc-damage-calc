import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePokemonState } from "./PokemonStateContext";
import { useField } from "./FieldContext";
import {
  Terrain,
  Weather,
} from "../vendors/smogon/damage-calc-dist/data/interface";
import { AbilityData } from "../vendors/smogon/pokemon-showdown/sim/dex-abilities";

interface GlobalEffectsContextType {}

const GlobalEffectsContext = createContext<
  GlobalEffectsContextType | undefined
>(undefined);

export const GlobalEffectsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 使用新的Pokemon状态管理
  const {
    ability: abilityAttacker,
    intimidateActived: intimidateActivedAttacker,
    item: itemAttacker,
    setIntimidatedBoosts: setIntimidatedBoostsAttacker,
    boostedStat: boostedStatAttacker,
    setBoostedStat: setBoostedStatAttacker,
  } = usePokemonState(true);
  const {
    ability: abilityDefender,
    intimidateActived: intimidateActivedDefender,
    item: itemDefender,
    setIntimidatedBoosts: setIntimidatedBoostsDefender,
    boostedStat: boostedStatDefender,
    setBoostedStat: setBoostedStatDefender,
  } = usePokemonState(false);
  const { weather, setWeather, terrain, setTerrain } = useField();

  const prevAbilityAttacker = usePrevious(abilityAttacker);
  const prevAbilityDefender = usePrevious(abilityDefender);
  const prevItemAttacker = usePrevious(itemAttacker);
  const prevItemDefender = usePrevious(itemDefender);
  const prevWeather = usePrevious(weather);
  const prevTerrain = usePrevious(terrain);
  const handleWeatherChange = useCallback(
    (isAttacker: boolean) => {
      const preWeather = weather;
      let _weather = preWeather;

      const switchOutWeather = getAbilityWeather(
        isAttacker ? prevAbilityAttacker : prevAbilityDefender
      );

      if (switchOutWeather && switchOutWeather === _weather) {
        _weather = getAbilityWeather(
          isAttacker ? abilityDefender : abilityAttacker
        );
      }

      const switchInWeather = getAbilityWeather(
        isAttacker ? abilityAttacker : abilityDefender
      );
      if (isAbnormalWeather(switchInWeather)) {
        _weather = switchInWeather;
      } else if (switchInWeather && !isAbnormalWeather(_weather)) {
        _weather = switchInWeather;
      }
      if (_weather !== preWeather) {
        setWeather(_weather);
      }
    },
    [
      weather,
      prevAbilityAttacker,
      abilityAttacker,
      prevAbilityDefender,
      abilityDefender,
    ]
  );

  const handleTerrainChange = useCallback(
    (isAttacker: boolean) => {
      const preTerrain = terrain;
      let _terrain = preTerrain;
      const switchOutTerrain = getAbilityTerrain(
        isAttacker ? prevAbilityAttacker : prevAbilityDefender
      );

      if (switchOutTerrain && switchOutTerrain === _terrain) {
        _terrain = getAbilityTerrain(
          isAttacker ? abilityDefender : abilityAttacker
        );
      }

      const switchInTerrain = getAbilityTerrain(
        isAttacker ? abilityAttacker : abilityDefender
      );
      if (switchInTerrain) {
        _terrain = switchInTerrain;
      }
      if (_terrain !== preTerrain) {
        setTerrain(_terrain);
      }
    },
    [
      terrain,
      prevAbilityAttacker,
      abilityAttacker,
      prevAbilityDefender,
      abilityDefender,
    ]
  );

  const handleIntimidateChange = useCallback(
    (isAttacker: boolean) => {
      const opponentBoosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      const handleOpponentsetIntimidatedBoosts = isAttacker
        ? setIntimidatedBoostsDefender
        : setIntimidatedBoostsAttacker;
      const swithInAbility = isAttacker
        ? abilityAttacker?.name
        : abilityDefender?.name;
      const switchInIntimidateActived = isAttacker
        ? intimidateActivedAttacker
        : intimidateActivedDefender;
      const opponentAbility = isAttacker
        ? abilityDefender?.name
        : abilityAttacker?.name;
      const opponentItem = isAttacker ? itemDefender?.name : itemAttacker?.name;
      if (!switchInIntimidateActived || swithInAbility !== "Intimidate") {
      } else {
        if (
          opponentAbility !== "Clear Body" &&
          opponentAbility !== "Hyper Cutter" &&
          opponentAbility !== "White Smoke" &&
          opponentAbility !== "Full Metal Body" &&
          opponentAbility !== "Inner Focus" &&
          opponentAbility !== "Oblivious" &&
          opponentAbility !== "Scrappy" &&
          opponentAbility !== "Own Tempo"
        ) {
          if (opponentAbility === "Guard Dog") {
            opponentBoosts.atk = 1;
          } else if (opponentItem !== "Clear Amulet") {
            if (opponentAbility === "Contrary") {
              opponentBoosts.atk = 1;
            } else if (opponentAbility === "Defiant") {
              opponentBoosts.atk = 1;
            } else if (opponentAbility === "Competitive") {
              opponentBoosts.atk = -1;
              opponentBoosts.spa = 2;
            } else {
              opponentBoosts.atk = -1;
            }
          }
        }

        if (opponentAbility === "Rattled") {
          opponentBoosts.spe += 1;
        }
        if (opponentItem === "Adrenaline Orb") {
          opponentBoosts.spe += 1;
        }
      }
      handleOpponentsetIntimidatedBoosts(opponentBoosts);
      return;
    },
    [
      abilityAttacker,
      abilityDefender,
      intimidateActivedAttacker,
      intimidateActivedDefender,
      itemAttacker,
      itemDefender,
      setIntimidatedBoostsAttacker,
      setIntimidatedBoostsDefender,
    ]
  );

  useEffect(() => {
    handleIntimidateChange(true);
  }, [
    abilityAttacker,
    intimidateActivedAttacker,
    abilityDefender,
    itemDefender,
  ]);

  useEffect(() => {
    handleIntimidateChange(false);
  }, [
    abilityDefender,
    intimidateActivedDefender,
    abilityAttacker,
    itemAttacker,
  ]);

  useEffect(() => {
    handleWeatherChange(true);
    handleTerrainChange(true);
    if (abilityAttacker?.name === "Protosynthesis") {
      if (
        weather === "Sun" ||
        weather === "Harsh Sunshine" ||
        itemAttacker?.name === "Booster Energy"
      ) {
        setBoostedStatAttacker("auto");
      }
    }
    if (
      abilityAttacker?.name === "Quark Drive" ||
      itemAttacker?.name === "Booster Energy"
    ) {
      if (terrain === "Electric") {
        setBoostedStatAttacker("auto");
      }
    }
  }, [abilityAttacker]);

  useEffect(() => {
    handleWeatherChange(false);
    handleTerrainChange(false);
    if (abilityDefender?.name === "Protosynthesis") {
      if (
        weather === "Sun" ||
        weather === "Harsh Sunshine" ||
        itemDefender?.name === "Booster Energy"
      ) {
        setBoostedStatDefender("auto");
      }
    }
    if (abilityDefender?.name === "Quark Drive") {
      if (terrain === "Electric" || itemDefender?.name === "Booster Energy") {
        setBoostedStatDefender("auto");
      }
    }
  }, [abilityDefender]);

  useEffect(() => {
    if (
      (prevWeather === "Sun" || prevWeather === "Harsh Sunshine") &&
      weather !== "Sun" &&
      weather !== "Harsh Sunshine"
    ) {
      if (
        itemAttacker?.name !== "Booster Energy" &&
        abilityAttacker?.name === "Protosynthesis"
      ) {
        setBoostedStatAttacker("inactive");
      }

      if (
        itemDefender?.name !== "Booster Energy" &&
        abilityDefender?.name === "Protosynthesis"
      ) {
        setBoostedStatDefender("inactive");
      }
    } else if (
      (weather === "Sun" || weather === "Harsh Sunshine") &&
      prevWeather !== "Sun" &&
      prevWeather !== "Harsh Sunshine"
    ) {
      if (
        abilityAttacker?.name === "Protosynthesis" &&
        boostedStatAttacker === "inactive" &&
        itemAttacker?.name !== "Booster Energy"
      )
        setBoostedStatAttacker("auto");
      if (
        abilityDefender?.name === "Protosynthesis" &&
        boostedStatDefender === "inactive" &&
        itemDefender?.name !== "Booster Energy"
      )
        setBoostedStatDefender("auto");
    }
  }, [weather]);

  useEffect(() => {
    if (prevTerrain === "Electric") {
      if (
        itemAttacker?.name !== "Booster Energy" &&
        abilityAttacker?.name === "Quark Drive"
      ) {
        setBoostedStatAttacker("inactive");
      }

      if (
        itemDefender?.name !== "Booster Energy" &&
        abilityDefender?.name === "Quark Drive"
      ) {
        setBoostedStatDefender("inactive");
      }
    } else if (terrain === "Electric") {
      if (
        abilityAttacker?.name === "Quark Drive" &&
        boostedStatAttacker === "inactive" &&
        itemAttacker?.name !== "Booster Energy"
      )
        setBoostedStatAttacker("auto");
      if (
        abilityDefender?.name === "Quark Drive" &&
        boostedStatDefender === "inactive" &&
        itemDefender?.name !== "Booster Energy"
      )
        setBoostedStatDefender("auto");
    }
  }, [terrain]);

  useEffect(() => {
    if (
      abilityAttacker?.name === "Protosynthesis" ||
      abilityAttacker?.name === "Quark Drive"
    )
      if (itemAttacker?.name === "Booster Energy") {
        if (
          (weather === "Sun" || weather === "Harsh Sunshine") &&
          abilityAttacker?.name === "Protosynthesis"
        ) {
          // do nothing
        } else if (
          terrain === "Electric" &&
          abilityAttacker?.name === "Quark Drive"
        ) {
          // do nothing
        } else if (boostedStatAttacker === "inactive")
          setBoostedStatAttacker("auto");
      } else {
        if (prevItemAttacker?.name === "Booster Energy") {
          if (
            (weather === "Sun" || weather === "Harsh Sunshine") &&
            abilityAttacker?.name === "Protosynthesis"
          ) {
            // do nothing
          } else if (
            terrain === "Electric" &&
            abilityAttacker?.name === "Quark Drive"
          ) {
            // do nothing
          } else {
            setBoostedStatAttacker("inactive");
          }
        }
      }
  }, [itemAttacker]);

  useEffect(() => {
    if (
      abilityDefender?.name === "Protosynthesis" ||
      abilityDefender?.name === "Quark Drive"
    )
      if (itemDefender?.name === "Booster Energy") {
        if (
          (weather === "Sun" || weather === "Harsh Sunshine") &&
          abilityDefender?.name === "Protosynthesis"
        ) {
          // do nothing
        } else if (
          terrain === "Electric" &&
          abilityDefender?.name === "Quark Drive"
        ) {
          // do nothing
        } else if (boostedStatDefender === "inactive")
          setBoostedStatDefender("auto");
      } else {
        if (prevItemDefender?.name === "Booster Energy") {
          if (
            (weather === "Sun" || weather === "Harsh Sunshine") &&
            abilityDefender?.name === "Protosynthesis"
          ) {
            // do nothing
          } else if (
            terrain === "Electric" &&
            abilityDefender?.name === "Quark Drive"
          ) {
            // do nothing
          } else {
            setBoostedStatDefender("inactive");
          }
        }
      }
  }, [itemDefender]);

  const value: GlobalEffectsContextType = {};
  return (
    <GlobalEffectsContext.Provider value={value}>
      {children}
    </GlobalEffectsContext.Provider>
  );
};

export const useGlobalEffects = (): GlobalEffectsContextType => {
  const context = useContext(GlobalEffectsContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalEffects must be used within a GlobalEffectsProvider"
    );
  }
  return context;
};

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

function getAbilityWeather(
  ability: AbilityData | undefined
): Weather | undefined {
  if (!ability) return undefined;
  const abilityName = ability.name || "";
  switch (abilityName) {
    case "Sand Stream":
      return "Sand";
    case "Drizzle":
      return "Rain";
    case "Drought":
      return "Sun";
    case "Orichalcum Pulse":
      return "Sun";
    case "Snow Warning":
      return "Snow";
    case "Desolate Land":
      return "Harsh Sunshine";
    case "Primordial Sea":
      return "Heavy Rain";
    case "Delta Stream":
      return "Strong Winds";
    default:
      return undefined;
  }
}

function isAbnormalWeather(weather: Weather | undefined): boolean {
  if (!weather) return false;
  return (
    weather === "Harsh Sunshine" ||
    weather === "Heavy Rain" ||
    weather === "Strong Winds"
  );
}

function getAbilityTerrain(
  ability: AbilityData | undefined
): Terrain | undefined {
  if (!ability) return undefined;
  const abilityName = ability.name || "";
  switch (abilityName) {
    case "Electric Surge":
      return "Electric";
    case "Hadron Engine":
      return "Electric";
    case "Grassy Surge":
      return "Grassy";
    case "Psychic Surge":
      return "Psychic";
    case "Misty Surge":
      return "Misty";
    default:
      return undefined;
  }
}
