import AppConstants from "../utils/app.constants";
import { Abilities as BaseAbilities } from "../vendors/smogon/pokemon-showdown/data/abilities";
import { Items as BaseItems } from "../vendors/smogon/pokemon-showdown/data/items";
import { Learnsets as BaseLearnsets } from "../vendors/smogon/pokemon-showdown/data/learnsets";
import { Moves as BaseShowdownMoves } from "../vendors/smogon/pokemon-showdown/data/moves";
import { Natures as BaseNatures } from "../vendors/smogon/pokemon-showdown/data/natures";
import { Pokedex as BasePokedex } from "../vendors/smogon/pokemon-showdown/data/pokedex";
import { TypeChart as BaseTypeChart } from "../vendors/smogon/pokemon-showdown/data/typechart";
import { Abilities as Gen9PreDlcAbilities } from "../vendors/smogon/pokemon-showdown/data/mods/gen9predlc/abilities";
import { Items as Gen9PreDlcItems } from "../vendors/smogon/pokemon-showdown/data/mods/gen9predlc/items";
import { Moves as Gen9PreDlcMoves } from "../vendors/smogon/pokemon-showdown/data/mods/gen9predlc/moves";
import { Pokedex as Gen9PreDlcPokedex } from "../vendors/smogon/pokemon-showdown/data/mods/gen9predlc/pokedex";
import { Abilities as Gen9Dlc1Abilities } from "../vendors/smogon/pokemon-showdown/data/mods/gen9dlc1/abilities";
import { Items as Gen9Dlc1Items } from "../vendors/smogon/pokemon-showdown/data/mods/gen9dlc1/items";
import { Moves as Gen9Dlc1Moves } from "../vendors/smogon/pokemon-showdown/data/mods/gen9dlc1/moves";
import { Pokedex as Gen9Dlc1Pokedex } from "../vendors/smogon/pokemon-showdown/data/mods/gen9dlc1/pokedex";
import { TypeChart as Gen9Dlc1TypeChart } from "../vendors/smogon/pokemon-showdown/data/mods/gen9dlc1/typechart";
import { Abilities as ChampionsAbilities } from "../vendors/smogon/pokemon-showdown/data/mods/champions/abilities";
import { Items as ChampionsItems } from "../vendors/smogon/pokemon-showdown/data/mods/champions/items";
import { Learnsets as ChampionsLearnsets } from "../vendors/smogon/pokemon-showdown/data/mods/champions/learnsets";
import { Moves as ChampionsMoves } from "../vendors/smogon/pokemon-showdown/data/mods/champions/moves";
import {
  AbilityData,
  AbilityDataTable,
} from "../vendors/smogon/pokemon-showdown/sim/dex-abilities";
import {
  NatureData,
  NatureDataTable,
  TypeDataTable,
} from "../vendors/smogon/pokemon-showdown/sim/dex-data";
import {
  ItemData,
  ItemDataTable,
} from "../vendors/smogon/pokemon-showdown/sim/dex-items";
import {
  MoveData,
  MoveDataTable,
} from "../vendors/smogon/pokemon-showdown/sim/dex-moves";
import {
  SpeciesData,
  SpeciesDataTable,
} from "../vendors/smogon/pokemon-showdown/sim/dex-species";

import {
  GenerationNum,
  calculate as CalculatorCalculate,
  Move,
  Field,
} from "../vendors/smogon/damage-calc-dist/index";
import type { Damage } from "../vendors/smogon/damage-calc-dist/result";
import { Pokemon } from "../models/pokemon.calculator.model";
import { Result } from "../models/result.calculator.model";

// 工具函数
export class ShowdownDataService {
  static readonly NoItem: ItemData = { num: 0, name: "(No Item)" };
  static readonly NoAbility: AbilityData = { num: 0, name: "(No Ability)" };
  private static currentGame: string | undefined;
  private static currentGen: number | undefined;
  private static rawAbilitiesCache: AbilityDataTable | undefined;
  private static rawItemsCache: ItemDataTable | undefined;
  private static rawLearnsetsCache: typeof BaseLearnsets | undefined;
  private static rawMovesCache: MoveDataTable | undefined;
  private static rawNaturesCache: NatureDataTable | undefined;
  private static rawPokedexCache: SpeciesDataTable | undefined;
  private static rawTypeChartCache: TypeDataTable | undefined;

  static setCurrentGameEnv(game?: string, gen?: number): void {
    ShowdownDataService.currentGame = game;
    ShowdownDataService.currentGen = gen;
    ShowdownDataService.initializeRawDataCaches();
  }

  private static getCurrentGen(): number {
    return ShowdownDataService.currentGen ?? AppConstants.Gen;
  }

  private static normalizeDexId(value?: string): string {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static mergeUnknownRecords(
    base: Record<string, unknown>,
    override: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      const baseValue = merged[key];
      if (
        ShowdownDataService.isRecord(baseValue) &&
        ShowdownDataService.isRecord(value)
      ) {
        merged[key] = ShowdownDataService.mergeUnknownRecords(baseValue, value);
      } else {
        merged[key] = value;
      }
    }
    return merged;
  }

  private static mergeTable<T extends object>(base: T, override: unknown): T {
    return ShowdownDataService.mergeUnknownRecords(
      base as unknown as Record<string, unknown>,
      override as unknown as Record<string, unknown>,
    ) as T;
  }

  private static mergeTables<T extends object>(
    base: T,
    ...overrides: unknown[]
  ): T {
    return overrides.reduce<T>(
      (merged, override) => ShowdownDataService.mergeTable(merged, override),
      base,
    );
  }

  private static initializeRawDataCaches(): void {
    switch (ShowdownDataService.currentGame) {
      case "SV":
        ShowdownDataService.rawAbilitiesCache = ShowdownDataService.mergeTables(
          BaseAbilities,
          Gen9PreDlcAbilities,
          Gen9Dlc1Abilities,
        );
        ShowdownDataService.rawItemsCache = ShowdownDataService.mergeTables(
          BaseItems,
          Gen9PreDlcItems,
          Gen9Dlc1Items,
        );
        ShowdownDataService.rawLearnsetsCache =
          ShowdownDataService.mergeTables(BaseLearnsets);
        ShowdownDataService.rawMovesCache = ShowdownDataService.mergeTables(
          BaseShowdownMoves,
          Gen9PreDlcMoves,
          Gen9Dlc1Moves,
        ) as MoveDataTable;
        ShowdownDataService.rawNaturesCache = BaseNatures;
        ShowdownDataService.rawPokedexCache = ShowdownDataService.mergeTables(
          BasePokedex,
          Gen9PreDlcPokedex,
          Gen9Dlc1Pokedex,
        ) as SpeciesDataTable;
        ShowdownDataService.rawTypeChartCache = ShowdownDataService.mergeTable(
          BaseTypeChart,
          Gen9Dlc1TypeChart,
        ) as TypeDataTable;
        return;
      case "Champions":
        ShowdownDataService.rawAbilitiesCache = ShowdownDataService.mergeTables(
          BaseAbilities,
          ChampionsAbilities,
        );
        ShowdownDataService.rawItemsCache = ShowdownDataService.mergeTables(
          BaseItems,
          ChampionsItems,
        );
        ShowdownDataService.rawLearnsetsCache =
          ShowdownDataService.mergeTables(ChampionsLearnsets);
        ShowdownDataService.rawMovesCache = ShowdownDataService.mergeTables(
          BaseShowdownMoves,
          ChampionsMoves,
        ) as MoveDataTable;
        ShowdownDataService.rawNaturesCache = BaseNatures;
        ShowdownDataService.rawPokedexCache = BasePokedex;
        ShowdownDataService.rawTypeChartCache = BaseTypeChart;
        return;
      default:
        ShowdownDataService.rawAbilitiesCache = BaseAbilities;
        ShowdownDataService.rawItemsCache = BaseItems;
        ShowdownDataService.rawLearnsetsCache = BaseLearnsets;
        ShowdownDataService.rawMovesCache = BaseShowdownMoves;
        ShowdownDataService.rawNaturesCache = BaseNatures;
        ShowdownDataService.rawPokedexCache = BasePokedex;
        ShowdownDataService.rawTypeChartCache = BaseTypeChart;
    }
  }

  private static get RawAbilities(): AbilityDataTable {
    if (!ShowdownDataService.rawAbilitiesCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawAbilitiesCache!;
  }

  private static get RawItems(): ItemDataTable {
    if (!ShowdownDataService.rawItemsCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawItemsCache!;
  }

  private static get RawLearnsets(): typeof BaseLearnsets {
    if (!ShowdownDataService.rawLearnsetsCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawLearnsetsCache!;
  }

  private static get RawMoves(): MoveDataTable {
    if (!ShowdownDataService.rawMovesCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawMovesCache!;
  }

  private static get RawNatures(): NatureDataTable {
    if (!ShowdownDataService.rawNaturesCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawNaturesCache!;
  }

  private static get RawPokedex(): SpeciesDataTable {
    if (!ShowdownDataService.rawPokedexCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawPokedexCache!;
  }

  private static get RawTypeChart(): TypeDataTable {
    if (!ShowdownDataService.rawTypeChartCache) {
      ShowdownDataService.initializeRawDataCaches();
    }
    return ShowdownDataService.rawTypeChartCache!;
  }

  static getNationalityImgUrl(nationality?: string): string | undefined {
    if (!nationality || nationality === "") {
      return undefined;
    }
    return `${AppConstants.ImageHost}/nat/${nationality.toLowerCase()}.png`;
  }

  static getPokemonImgUrl(
    pokemon?: string,
    isThumbs: boolean = false,
  ): string | undefined {
    if (!pokemon || pokemon === "") {
      return undefined;
    }
    const cleanName = pokemon.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const path = isThumbs ? "thumbs" : "imgs";
    return `${AppConstants.ImageHost}/pokemon/${path}/${cleanName}.png`;
  }

  static getItemImgUrl(item?: string): string | undefined {
    if (!item || item === "") {
      return undefined;
    }
    const cleanName = item.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${AppConstants.ImageHost}/item/${cleanName}.png`;
  }

  static getTeraTypeImgUrl(tera_type?: string): string | undefined {
    if (!tera_type || tera_type === "") {
      return undefined;
    }
    const cleanName = tera_type.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${AppConstants.ImageHost}/type/terastal/${cleanName}.png`;
  }

  static getMegaImgUrl(): string {
    return `${AppConstants.ImageHost}/rule/mega.png`;
  }

  static getZMoveImgUrl(): string {
    return `${AppConstants.ImageHost}/rule/z-move.png`;
  }

  static getDynamaxImgUrl(): string {
    return `${AppConstants.ImageHost}/rule/dynamax.png`;
  }

  static getNatureByString(str: string): NatureData {
    const nature_str = str.toLowerCase();
    const natures = ShowdownDataService.RawNatures;
    const nature_modifier = natures[nature_str as keyof typeof natures];
    if (!nature_modifier) {
      return natures["serious"];
    }
    return nature_modifier;
  }

  /**
   * 通过宝可梦名称获取基础信息
   * @param pokemonName 宝可梦名称
   * @returns 宝可梦基础信息对象，如果未找到则返回undefined
   */
  static getPokemonSpecies(pokemonName?: string): SpeciesData | undefined {
    if (!pokemonName || pokemonName === "") {
      return undefined;
    }

    // 清理宝可梦名称，转换为小写并移除空格和特殊字符
    let key = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const pokedex = ShowdownDataService.RawPokedex;
    const pokemonInfo = pokedex[key as keyof typeof pokedex] as SpeciesData;
    return pokemonInfo;
  }

  static getSubSpeciesDataTable(
    species?: SpeciesData,
  ): SpeciesDataTable | undefined {
    if (!species) {
      return undefined;
    }
    const root = ShowdownDataService.getRootSpecies(species);
    if (!root) {
      return undefined;
    }

    let speciesData = Object.fromEntries(
      Object.entries(ShowdownDataService.DisplaySpeciesList).filter(
        ([_, value]) => {
          const rootSpecies = ShowdownDataService.getRootSpecies(value);
          return (
            (root.formeOrder || []).includes(value.name) && rootSpecies === root
          );
        },
      ),
    );

    if (Object.entries(speciesData).length === 0) {
      speciesData[root.name] = root;
    }
    if (root.name === "Meowstic-F") {
      const meosticFMega =
        ShowdownDataService.getPokemonSpecies("Meowstic-F-Mega");
      if (meosticFMega) {
        speciesData[meosticFMega.name] = meosticFMega;
      }
    } else if (root.name === "Floette-Eternal") {
      const floetteMega = ShowdownDataService.getPokemonSpecies("Floette-Mega");
      if (floetteMega) {
        speciesData[floetteMega.name] = floetteMega;
      }
    } else if (root.name === "Floette") {
      delete speciesData["Floette-Eternal"];
      delete speciesData["Floette-Mega"];
    } else if (root.name.startsWith("Ogerpon")) {
      speciesData = {};
      let base = root.name;
      if (root.name.endsWith("-Tera")) {
        base = root.name.slice(0, -5);
      }
      if (base === "Ogerpon" || base === "Ogerpon-Teal") {
        let poke = ShowdownDataService.getPokemonSpecies("Ogerpon");
        if (poke) speciesData[poke.name] = poke;
        poke = ShowdownDataService.getPokemonSpecies("Ogerpon-Teal-Tera");
        if (poke) speciesData[poke.name] = poke;
      } else {
        let poke = ShowdownDataService.getPokemonSpecies(base);
        if (poke) speciesData[poke.name] = poke;
        poke = ShowdownDataService.getPokemonSpecies(`${base}-Tera`);
        if (poke) speciesData[poke.name] = poke;
      }
    }
    console.log(speciesData);

    const temp = Object.entries(speciesData).map(([key, _]) => key);
    temp.forEach((key) => {
      const gmaxSpecies = ShowdownDataService.getPokemonSpecies(key + "-Gmax");
      if (gmaxSpecies) {
        speciesData[gmaxSpecies.name] = gmaxSpecies;
      }
    });

    if (Object.entries(speciesData).length === 1) {
      return undefined;
    }
    return speciesData;
  }

  static getRootSpecies(species?: SpeciesData): SpeciesData | undefined {
    if (!species) {
      return species;
    }
    var rootSpecies = species!;
    while (true) {
      if (ROOT_SPECIES.has(rootSpecies.name)) {
        break;
      }
      if (!rootSpecies.baseSpecies) {
        break;
      }
      let species;
      if (rootSpecies.name === "Floette-Eternal") {
        return rootSpecies;
      } else if (rootSpecies.name === "Floette-Mega") {
        species = ShowdownDataService.getPokemonSpecies("Floette-Eternal");
        return species;
      } else if (
        rootSpecies.name.endsWith("-M-Mega") ||
        rootSpecies.name.endsWith("-Mega-X") ||
        rootSpecies.name.endsWith("-Mega-Y") ||
        rootSpecies.name.endsWith("-Mega-Z")
      ) {
        species = ShowdownDataService.getPokemonSpecies(
          rootSpecies.name.slice(0, -7),
        );
      } else if (rootSpecies.name.endsWith("-Curly-Mega")) {
        species = ShowdownDataService.getPokemonSpecies(
          rootSpecies.name.slice(0, -11),
        );
      } else if (
        rootSpecies.name.endsWith("-Gmax") ||
        rootSpecies.name.endsWith("-Mega")
      ) {
        species = ShowdownDataService.getPokemonSpecies(
          rootSpecies.name.slice(0, -5),
        );
      } else if (rootSpecies.name.startsWith("Ogerpon")) {
        if (rootSpecies.name.endsWith("-Teal-Tera")) {
          species = ShowdownDataService.getPokemonSpecies(
            rootSpecies.name.slice(0, -10),
          );
        } else if (rootSpecies.name.endsWith("-Tera")) {
          species = ShowdownDataService.getPokemonSpecies(
            rootSpecies.name.slice(0, -5),
          );
        }
      } else {
        species = ShowdownDataService.getPokemonSpecies(
          rootSpecies.baseSpecies,
        );
      }
      if (!species) {
        break;
      }
      if (rootSpecies.name === species.name + "-F") {
        break;
      }
      if (
        (REGIONAL_FORMES.has(rootSpecies.forme || "") ||
          SPECIAL_FORMES.has(rootSpecies.forme || "")) &&
        rootSpecies.forme !== species.forme
      ) {
        break;
      }
      rootSpecies = species;
    }
    return rootSpecies;
  }

  static getPokemonAbilityInfo(ability?: string): AbilityData | undefined {
    if (!ability || ability === "") {
      return undefined;
    }

    const key = ability.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (key === "noability") {
      return ShowdownDataService.NoAbility;
    }

    const abilities = ShowdownDataService.RawAbilities;
    const abilityInfo = abilities[key as keyof typeof abilities];
    return abilityInfo;
  }

  static getPokemonItemInfo(item?: string): ItemData | undefined {
    if (!item || item === "") {
      return undefined;
    }

    const key = item.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (key === "noitem") {
      return ShowdownDataService.NoItem;
    }

    const items = ShowdownDataService.RawItems;
    const itemInfo = items[key as keyof typeof items];
    return itemInfo;
  }

  static getPokemonMoveInfo(move?: string): MoveData | undefined {
    if (!move || move === "") {
      return undefined;
    }

    const key = move.toLowerCase().replace(/[^a-z0-9]/g, "");

    const moves = ShowdownDataService.Moves;
    const moveInfo = moves[key as keyof typeof moves];
    return moveInfo;
  }

  static TeraTypes(species?: SpeciesData): TypeDataTable {
    if (!species || !species.types) {
      return ShowdownDataService.RawTypeChart;
    }
    const speciesLowerTypes = species.types.map((type) => type.toLowerCase());
    const sortedTypeChart = Object.fromEntries(
      Object.entries(ShowdownDataService.RawTypeChart).sort(([a], [b]) => {
        let indexA = speciesLowerTypes.indexOf(a);
        let indexB = speciesLowerTypes.indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      }),
    );
    return sortedTypeChart;
  }

  static AbilitiesList(species?: SpeciesData): AbilityDataTable {
    if (!species || !species.abilities) {
      return ShowdownDataService.Abilities;
    }
    const speciesLowerAbilities: string[] = Object.fromEntries(
      Object.entries(species.abilities).map(([key, value]) => [
        value.toLowerCase(),
      ]),
    );

    const sortedAbilities = Object.fromEntries(
      Object.entries(ShowdownDataService.Abilities).sort(([a], [b]) => {
        let indexA = Object.keys(speciesLowerAbilities).indexOf(a);
        let indexB = Object.keys(speciesLowerAbilities).indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      }),
    );

    return sortedAbilities;
  }

  static get Abilities(): AbilityDataTable {
    const filtered = Object.fromEntries(
      Object.entries(ShowdownDataService.RawAbilities).filter(
        ([_, value]) => value.num > 0,
      ),
    );
    const noAbility: AbilityData = ShowdownDataService.NoAbility;
    return { noability: noAbility, ...filtered };
  }

  static get Natures(): NatureDataTable {
    return ShowdownDataService.RawNatures;
  }

  static get Items(): ItemDataTable {
    const filtered = Object.fromEntries(
      Object.entries(ShowdownDataService.RawItems).filter(
        ([_, value]) => value.num > 0,
      ),
    );
    const noItem: ItemData = ShowdownDataService.NoItem;
    return { noitem: noItem, ...filtered };
  }

  static get Moves(): MoveDataTable {
    return Object.fromEntries(
      Object.entries(ShowdownDataService.RawMoves).filter(
        ([_, value]) => !value.isZ && !value.isMax && value.num > 0,
      ),
    );
  }

  static getBaseSpeciesName(species?: SpeciesData): string | undefined {
        var baseSpeciesName =
          species?.baseSpecies;
        if (species?.name === "Floette-Mega") {
          baseSpeciesName = "Floette-Eternal";
        }else if (species?.name === "Floette-Eternal"){
          baseSpeciesName = undefined;
        }
    return baseSpeciesName;
  }

  static get DisplaySpeciesList(): SpeciesDataTable {
    const permittedPokemons = new Set(
      ShowdownDataService.getPermittedPokemons(),
    );
    return Object.fromEntries(
      Object.entries(ShowdownDataService.RawPokedex)
        .filter(
          ([_, value]) => value.num > 0,
          // value.num > 0 &&
          // (!value.forme ||
          //   (!(
          //     value.changesFrom &&
          //     value.changesFrom === "Genesect" &&
          //     value.forme
          //   ) && // 盖洛赛克特
          //     !(
          //       (
          //         value.baseSpecies &&
          //         value.forme &&
          //         (value.baseSpecies === "Burmy" || // 结草儿
          //           value.baseSpecies === "Wormadam" || // 结草贵妇
          //           value.baseSpecies === "Vivillon" || // 彩粉蝶
          //           value.baseSpecies === "Squawkabilly" || // 怒鹦哥
          //           value.baseSpecies === "Pikachu")
          //       ) // 换装皮卡丘、帽子皮卡丘
          //     ) &&
          //     value.forme !== "Starter" && // 去皮、去伊
          //     value.forme !== "Totem" &&
          //     !value.forme.endsWith("-Totem") && // 霸主宝可梦
          //     value.forme !== "Stellar" && // 太乐巴戈斯-星晶形态
          //     value.forme !== "Roaming" && // 索财灵-徒步
          //     value.forme !== "Artisan" && // 斯魔茶-高档货
          //     value.forme !== "Antique" && // 来悲茶、怖思壶-珍品
          //     value.forme !== "Masterpiece" && // 来悲粗茶-杰作
          //     value.forme !== "Four" && // 一家鼠
          //     !value.forme.endsWith("-Segment") && // 土龙节节（三节）
          //     !value.forme.endsWith("-Striped") && // 野蛮鲈鱼（条纹）
          //     !value.forme.endsWith("-Tera"))) // 特殊太晶（厄诡椪）
        )
        .sort(([aKey, aValue], [bKey, bValue]) => {
          const aMatched =
            permittedPokemons.has(aKey) ||
            permittedPokemons.has(
              ShowdownDataService.normalizeDexId(
                ShowdownDataService.getBaseSpeciesName(aValue),
              ),
            );
          const bMatched =
            permittedPokemons.has(bKey) ||
            permittedPokemons.has(
              ShowdownDataService.normalizeDexId(
                ShowdownDataService.getBaseSpeciesName(bValue),
              ),
            );
          if (aMatched === bMatched) {
            return 0;
          }
          return aMatched ? -1 : 1;
        }),
    );
  }

  static getPermittedPokemons(): string[] {
    const currentGen = ShowdownDataService.getCurrentGen();
    const currentGenString = currentGen.toString();
    const permittedPokemons: string[] = [];
    const rawLearnsets = ShowdownDataService.RawLearnsets;
    Object.entries(rawLearnsets).forEach(([key, value]) => {
      if (value?.learnset) {
        const hasCurrentGenLearnset = Object.values(value.learnset).some(
          (learnsetValue) => {
            const firstSource =
              Array.isArray(learnsetValue) &&
              typeof learnsetValue[0] === "string"
                ? learnsetValue[0]
                : undefined;
            return (
              !!firstSource &&
              firstSource.startsWith(currentGenString) &&
              (firstSource.length === currentGenString.length ||
                firstSource.charCodeAt(currentGenString.length) < 0x30 ||
                firstSource.charCodeAt(currentGenString.length) > 0x39)
            );
          },
        );
        if (hasCurrentGenLearnset) {
          permittedPokemons.push(key);
        }
      }
    });
    return permittedPokemons;
  }

  /**
   * 获取技能列表
   * @returns moveid 数组
   */
  static getPokemonLearnsets(species?: SpeciesData): string[] | undefined {
    species = ShowdownDataService.getRootSpecies(species);
    if (species) {
      const gen = this.getCurrentGen();
      let key = species!.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const rawLearnsets = ShowdownDataService.RawLearnsets;
      const learnsets =
        rawLearnsets[key as keyof typeof rawLearnsets]?.learnset;
      const genLearnSets = learnsets
        ? Object.entries(learnsets)
            .filter(
              ([_, value]) =>
                value[0].startsWith(gen.toString()) &&
                (value[0].length === gen.toString().length ||
                  value[0].charCodeAt(gen.toString().length) < 0x30 ||
                  value[0].charCodeAt(gen.toString().length) > 0x39),
            )
            .map(([key, _]) => key)
        : [];
      if (species?.changesFrom) {
        const changesFromKey = species.changesFrom
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const changesFromLearnsets =
          ShowdownDataService.RawLearnsets[
            changesFromKey as keyof typeof ShowdownDataService.RawLearnsets
          ]?.learnset;
        if (changesFromLearnsets) {
          const changesFromGenLearnSets = Object.entries(changesFromLearnsets)
            .filter(
              ([_, value]) =>
                value[0].startsWith(gen.toString()) &&
                (value[0].length === gen.toString().length ||
                  value[0].charCodeAt(gen.toString().length) < 0x30 ||
                  value[0].charCodeAt(gen.toString().length) > 0x39),
            )
            .map(([key, _]) => key);
          genLearnSets.push(...changesFromGenLearnSets);
        }
      }
      let proKey = species.prevo;
      while (proKey) {
        proKey = proKey.toLowerCase().replace(/[^a-z0-9]/g, "");
        const pokedex = ShowdownDataService.RawPokedex;
        const pro = pokedex[proKey as keyof typeof pokedex] as SpeciesData;
        const proLearnsets =
          ShowdownDataService.RawLearnsets[
            proKey as keyof typeof ShowdownDataService.RawLearnsets
          ]?.learnset;
        if (proLearnsets) {
          const proGenLearnSets = Object.entries(proLearnsets)
            .filter(
              ([_, value]) =>
                value[0].startsWith(gen.toString()) &&
                (value[0].length === gen.toString().length ||
                  value[0].charCodeAt(gen.toString().length) < 0x30 ||
                  value[0].charCodeAt(gen.toString().length) > 0x39),
            )
            .map(([key, _]) => key);
          genLearnSets.push(...proGenLearnSets);
        }
        if (pro?.changesFrom) {
          const changesFromKey = pro.changesFrom
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const changesFromLearnsets =
            ShowdownDataService.RawLearnsets[
              changesFromKey as keyof typeof ShowdownDataService.RawLearnsets
            ]?.learnset;
          if (changesFromLearnsets) {
            const changesFromGenLearnSets = Object.entries(changesFromLearnsets)
              .filter(
                ([_, value]) =>
                  value[0].startsWith(gen.toString()) &&
                  (value[0].length === gen.toString().length ||
                    value[0].charCodeAt(gen.toString().length) < 0x30 ||
                    value[0].charCodeAt(gen.toString().length) > 0x39),
              )
              .map(([key, _]) => key);
            genLearnSets.push(...changesFromGenLearnSets);
          }
        }
        proKey = pro.prevo;
      }

      return Array.from(new Set(genLearnSets));
    }
    return undefined;
  }

  static getPokemonMoveList(species?: SpeciesData): MoveDataTable {
    const learnsets = ShowdownDataService.getPokemonLearnsets(species);
    if (!learnsets) {
      return ShowdownDataService.Moves;
    }

    const sortedMoves = Object.fromEntries(
      Object.entries(ShowdownDataService.Moves).sort(([a], [b]) => {
        let indexA = learnsets.indexOf(a);
        let indexB = learnsets.indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      }),
    );
    console.log(sortedMoves);
    return sortedMoves;
  }

  static calculate(
    gen: GenerationNum,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    field?: Field,
  ): Result {
    const base = CalculatorCalculate(gen, attacker, defender, move, field);
    // 将第三方计算结果包装为本地扩展的 Result，以便统一从 Result 内获取展示文本
    return new Result(
      base.gen,
      base.attacker,
      base.defender,
      base.move,
      base.field,
      base.damage as Damage,
      base.rawDesc,
    );
  }
}

const ROOT_SPECIES = new Set([
  "Ogerpon-Cornerstone",
  "Ogerpon-Hearthflame",
  "Ogerpon-Wellspring",
  "Urshifu-Rapid-Strike",
  "Calyrex-Ice",
  "Calyrex-Shadow",
  "Tornadus-Therian",
  "Thundurus-Therian",
  "Landorus-Therian",
  "Enamorus-Therian",
  "Rotom-Heat",
  "Rotom-Wash",
  "Rotom-Frost",
  "Rotom-Fan",
  "Rotom-Mow",
  "Ursaluna-Bloodmoon",
  "Tauros-Paldea-Combat",
  "Tauros-Paldea-Blaze",
  "Tauros-Paldea-Aqua",
  "Zacian-Crowned",
  "Zamazenta-Crowned",
  "Hoopa-Unbound",
  "Shaymin-Sky",
  "Keldeo-Resolute",
  "Necrozma-Dusk-Mane",
  "Necrozma-Dawn-Wings",
]);
const REGIONAL_FORMES = new Set(["Galar", "Alola", "Paldea", "Hisui"]);
const SPECIAL_FORMES = new Set(["Origin", "Therian"]);

export const showdownDataService = new ShowdownDataService();
export default showdownDataService;
