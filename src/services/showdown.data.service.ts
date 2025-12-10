import AppConstants from "../utils/app.constants";
import { Abilities } from "../vendors/smogon/pokemon-showdown/data/abilities";
import { Items } from "../vendors/smogon/pokemon-showdown/data/items";
import { Learnsets } from "../vendors/smogon/pokemon-showdown/data/learnsets";
import { Moves as ShowdownMoves } from "../vendors/smogon/pokemon-showdown/data/moves";
import { Natures } from "../vendors/smogon/pokemon-showdown/data/natures";
import { Pokedex } from "../vendors/smogon/pokemon-showdown/data/pokedex";
import { TypeChart } from "../vendors/smogon/pokemon-showdown/data/typechart";
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
import { Pokemon, Result } from "../models/pokemon.calculator.model";

// 工具函数
export class ShowdownDataService {
  static getNationalityImgUrl(nationality?: string): string | undefined {
    if (!nationality || nationality === "") {
      return undefined;
    }
    return `${AppConstants.ImageHost}/nat/${nationality.toLowerCase()}.png`;
  }

  static getPokemonImgUrl(
    pokemon?: string,
    isThumbs: boolean = false
  ): string | undefined {
    if (!pokemon || pokemon === "") {
      return undefined;
    }
    const cleanName = pokemon.toLowerCase().replace(/[^a-z0-9-'']/g, "");
    const path = isThumbs ? "thumbs" : "imgs";
    return `${AppConstants.ImageHost}/pokemon/${path}/${cleanName}.png`;
  }

  static getItemImgUrl(item?: string): string | undefined {
    if (!item || item === "") {
      return undefined;
    }
    const cleanName = item.toLowerCase().replace(/[^a-z0-9-'']/g, "");
    return `${AppConstants.ImageHost}/item/${cleanName}.png`;
  }

  static getTeraTypeImgUrl(tera_type?: string): string | undefined {
    if (!tera_type || tera_type === "") {
      return undefined;
    }
    const cleanName = tera_type.toLowerCase().replace(/[^a-z0-9-]/g, "");
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
    const nature_modifier = Natures[nature_str as keyof typeof Natures];
    if (!nature_modifier) {
      return Natures["serious"];
    }
    return nature_modifier;
  }

  /**
   * 通过宝可梦名称获取基础信息
   * @param pokemonName 宝可梦名称
   * @returns 宝可梦基础信息对象，如果未找到则返回undefined
   */
  static getPokemonBaseInfo(pokemonName?: string): SpeciesData | undefined {
    if (!pokemonName || pokemonName === "") {
      return undefined;
    }

    // 清理宝可梦名称，转换为小写并移除空格和特殊字符
    let key = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const pokemonInfo = Pokedex[key as keyof typeof Pokedex] as SpeciesData;
    return pokemonInfo;
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
      const species = ShowdownDataService.getPokemonBaseInfo(
        rootSpecies.baseSpecies
      );
      if (!species) {
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

    const abilityInfo = Abilities[key as keyof typeof Abilities];
    return abilityInfo;
  }

  static getPokemonItemInfo(item?: string): ItemData | undefined {
    if (!item || item === "") {
      return undefined;
    }

    const key = item.toLowerCase().replace(/[^a-z0-9]/g, "");

    const itemInfo = Items[key as keyof typeof Items];
    return itemInfo;
  }

  static getPokemonMoveInfo(move?: string): MoveData | undefined {
    if (!move || move === "") {
      return undefined;
    }

    const key = move.toLowerCase().replace(/[^a-z0-9]/g, "");

    const moveInfo =
      ShowdownDataService.Moves[key as keyof typeof ShowdownMoves];
    return moveInfo;
  }

  static TeraTypes(species?: SpeciesData): TypeDataTable {
    if (!species || !species.types) {
      return TypeChart;
    }
    const speciesLowerTypes = species.types.map((type) => type.toLowerCase());
    const sortedTypeChart = Object.fromEntries(
      Object.entries(TypeChart).sort(([a], [b]) => {
        let indexA = speciesLowerTypes.indexOf(a);
        let indexB = speciesLowerTypes.indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      })
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
      ])
    );

    const sortedAbilities = Object.fromEntries(
      Object.entries(ShowdownDataService.Abilities).sort(([a], [b]) => {
        let indexA = Object.keys(speciesLowerAbilities).indexOf(a);
        let indexB = Object.keys(speciesLowerAbilities).indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      })
    );

    return sortedAbilities;
  }

  static get Abilities(): AbilityDataTable {
    return Object.fromEntries(
      Object.entries(Abilities).filter(([_, value]) => value.num > 0)
    );
  }

  static get Natures(): NatureDataTable {
    return Natures;
  }

  static get Items(): ItemDataTable {
    const filtered = Object.fromEntries(
      Object.entries(Items).filter(([_, value]) => value.num > 0)
    );
    const noItem: ItemData = { num: 0, name: "(No Item)" };
    return { noitem: noItem, ...filtered };
  }

  static get Moves(): MoveDataTable {
    return Object.fromEntries(
      Object.entries(ShowdownMoves).filter(
        ([_, value]) => !value.isZ && !value.isMax && value.num > 0
      )
    );
  }

  static get DisplaySpeciesList(): SpeciesDataTable {
    return Object.fromEntries(
      Object.entries(Pokedex).filter(
        ([_, value]) => value.num > 0
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
    );
  }

  /**
   * 获取技能列表
   * @returns 技能名称数组
   */
  static getPokemonLearnsets(species?: SpeciesData): MoveDataTable | undefined {
    if (species) {
      const gen = species!.gen || AppConstants.Gen;
      const key = species!.name.toLowerCase().replace(/[^a-z0-9]/g, "");

      const learnsets = Learnsets[key as keyof typeof Learnsets]?.learnset;
      const genLearnSets = learnsets
        ? Object.entries(learnsets)
            .filter(
              ([_, value]) =>
                value[0].startsWith(gen.toString()) &&
                (value[0].length === gen.toString().length ||
                  value[0].charCodeAt(gen.toString().length) < 0x30 ||
                  value[0].charCodeAt(gen.toString().length) > 0x39)
            )
            .map(([key, _]) => key)
        : [];
      let proKey = species.prevo;
      while (proKey) {
        proKey = proKey.toLowerCase().replace(/[^a-z0-9]/g, "");
        const pro = Pokedex[proKey as keyof typeof Pokedex] as SpeciesData;
        const proLearnsets =
          Learnsets[proKey as keyof typeof Learnsets]?.learnset;
        if (proLearnsets) {
          const proGenLearnSets = Object.entries(proLearnsets)
            .filter(
              ([_, value]) =>
                value[0].startsWith(gen.toString()) &&
                (value[0].length === gen.toString().length ||
                  value[0].charCodeAt(gen.toString().length) < 0x30 ||
                  value[0].charCodeAt(gen.toString().length) > 0x39)
            )
            .map(([key, _]) => key);
          genLearnSets.push(...proGenLearnSets);
        }
        proKey = pro.prevo;
      }

      return Object.fromEntries(
        Object.entries(ShowdownDataService.Moves).filter(([key, _]) =>
          genLearnSets.includes(key)
        )
      );
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
        let indexA = Object.keys(learnsets).indexOf(a);
        let indexB = Object.keys(learnsets).indexOf(b);
        indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return indexA - indexB;
      })
    );
    return sortedMoves;
  }

  static calculate(
    gen: GenerationNum,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    field?: Field
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
      base.rawDesc
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
