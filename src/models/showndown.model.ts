import { ShowdownDataService } from "../services/showdown.data.service";

import { StatID, StatsTable } from "../vendors/smogon/damage-calc-dist/index";
import { NatureData } from "../vendors/smogon/pokemon-showdown/sim/dex-data";

export const MovesetType = {
  Item: "Item",
  Move: "Move",
  TeraType: "TeraType",
  Ability: "Ability",
} as const;

export type MovesetTypeType = (typeof MovesetType)[keyof typeof MovesetType];

// Showdown格式数据
export class ShowdownFormats {
  private _regs: string[];
  private _yyyyMMs: Map<string, string[]>;
  private _rules: Map<string, string[]>;
  private _gen: Map<string, string>;
  private _cutlines: string[];

  constructor(data: {
    regs: string[];
    yyyyMMs: Map<string, string[]>;
    rules: Map<string, string[]>;
    gen: Map<string, string>;
    cutlines: string[];
  }) {
    this._regs = data.regs;
    this._yyyyMMs = data.yyyyMMs;
    this._rules = data.rules;
    this._gen = data.gen;
    this._cutlines = data.cutlines;
  }

  static fromJson(json: Record<string, unknown>): ShowdownFormats {
    const regsSet = new Set<string>();
    const yyyyMMs = new Map<string, string[]>();

    const regsData = json.regs as Record<string, string[]>;
    for (const [key, regs] of Object.entries(regsData)) {
      for (const reg of regs) {
        regsSet.add(reg);
        if (!yyyyMMs.has(reg)) {
          yyyyMMs.set(reg, []);
        }
        yyyyMMs.get(reg)!.push(key);
      }
    }

    // 对yyyyMMs的每个列表进行降序排列
    yyyyMMs.forEach((value) => {
      value.sort((a, b) => b.localeCompare(a));
    });

    const rulesData = json.rules as Record<string, string[]>;
    const rules = new Map<string, string[]>();
    for (const [key, value] of Object.entries(rulesData)) {
      const list = [...value];
      list.sort((a, b) => b.localeCompare(a)); // 降序排列
      rules.set(key, list);
    }

    const genData = json.gen as Record<string, string>;
    const gen = new Map<string, string>();
    for (const [key, value] of Object.entries(genData)) {
      gen.set(key, value);
    }

    const cutlines = [...(json.cutlines as string[])];
    cutlines.sort((a, b) => b.localeCompare(a)); // 降序排列

    return new ShowdownFormats({
      regs: Array.from(regsSet),
      yyyyMMs,
      rules,
      gen,
      cutlines,
    });
  }

  get regs(): string[] {
    return this._regs;
  }

  getYyyyMMList(reg?: string): string[] | undefined {
    if (!reg) {
      return undefined;
    }
    return this._yyyyMMs.get(reg);
  }

  getRuleList(reg?: string): string[] | undefined {
    if (!reg) {
      return undefined;
    }
    return this._rules.get(reg);
  }

  getGen(reg?: string): number | undefined {
    if (!reg) {
      return undefined;
    }
    const gen = Number(this._gen.get(reg));
    if (isNaN(gen)) {
      return undefined;
    }

    return gen;
  }

  get cutlineList(): string[] {
    return this._cutlines;
  }
}

// 使用率响应数据
export interface PokemonUsage {
  pokemon: string;
  usage: number;
  rank: number;
}

// 配招使用率响应数据
export interface MovesetsUsage {
  name: string;
  usage: number;
}

// Chaos EVs分布数据
export class ChaosEVsSpread1 {
  readonly evs: StatsTable<number>;
  readonly percentage: number;

  constructor(data: { evs: number[]; percentage: number }) {
    this.evs = {} as StatsTable<number>;
    for (let i = 0; i < data.evs.length; i++) {
      switch (i) {
        case 0:
          this.evs.hp = data.evs[i];
          break;
        case 1:
          this.evs.atk = data.evs[i];
          break;
        case 2:
          this.evs.def = data.evs[i];
          break;
        case 3:
          this.evs.spa = data.evs[i];
          break;
        case 4:
          this.evs.spd = data.evs[i];
          break;
        case 5:
          this.evs.spe = data.evs[i];
          break;
      }
    }
    this.percentage = data.percentage;
  }

  get key(): string {
    return `${this.evs.hp}/${this.evs.atk}/${this.evs.def}/${this.evs.spa}/${this.evs.spd}/${this.evs.spe}`;
  }
}

// Chaos性格分布数据
export class ChaosNatureSpread1 {
  readonly nature: NatureData;
  readonly percentage: number;
  readonly evsSpreads: ChaosEVsSpread1[];

  constructor(data: {
    nature: NatureData;
    percentage: number;
    evsSpreads: ChaosEVsSpread1[];
  }) {
    this.nature = data.nature;
    this.percentage = data.percentage;
    this.evsSpreads = data.evsSpreads;
  }

  static fromJson(json: Record<string, unknown>): ChaosNatureSpread1 {
    const nature = ShowdownDataService.getNatureByString(json.nature as string);
    const percentage = Number(json.percentage);
    const detail = json.detail as Array<Record<string, unknown>>;

    const evsSpreads = detail.map(
      (e) =>
        new ChaosEVsSpread1({
          evs: (e.evs as string).split("/").map((ev) => parseInt(ev) || 0),
          percentage: Number(e.percentage),
        })
    );

    return new ChaosNatureSpread1({
      nature,
      percentage,
      evsSpreads,
    });
  }
}

// Chaos分布数据2
export class ChaosSpread2 {
  readonly stat?: StatID;
  readonly effect: number;
  readonly ev: number;
  readonly percentage: number;

  constructor(data: {
    stat?: StatID;
    effect: number;
    ev: number;
    percentage: number;
  }) {
    this.stat = data.stat;
    this.effect = data.effect;
    this.ev = data.ev;
    this.percentage = data.percentage;
  }

  static fromJson(json: Record<string, unknown>): ChaosSpread2 {
    return new ChaosSpread2({
      stat: (json.stat as string).toLowerCase() as StatID,
      effect: Number(json.effect),
      ev: Number(json.ev),
      percentage: Number(json.percentage),
    });
  }
}

// Meta构建使用率数据
export class MetaBuildsUsage {
  readonly nature: NatureData;
  readonly evs?: StatsTable<number>;
  readonly percentage: number;

  constructor(data: {
    nature: NatureData;
    evs?: StatsTable<number>;
    percentage: number;
  }) {
    this.nature = data.nature;
    this.evs = data.evs;
    this.percentage = data.percentage;
  }

  static getListFromChaos1(
    chaosNatureSpread1: ChaosNatureSpread1[]
  ): MetaBuildsUsage[] {
    if (!chaosNatureSpread1 || chaosNatureSpread1.length === 0) {
      return [];
    }
    const metaBuilds = [] as MetaBuildsUsage[];
    chaosNatureSpread1.forEach((natureItem) => {
      metaBuilds.push(
        new MetaBuildsUsage({
          nature: natureItem.nature,
          percentage: natureItem.percentage,
        })
      );
      natureItem.evsSpreads.forEach((evsItem) => {
        metaBuilds.push(
          new MetaBuildsUsage({
            nature: natureItem.nature,
            evs: evsItem.evs,
            percentage: evsItem.percentage,
          })
        );
      });
    });
    return metaBuilds;
  }
}

export function isEvsEqual(evs1: StatsTable<number>, evs2: StatsTable<number>) {
  return (
    evs1.hp === evs2.hp &&
    evs1.atk === evs2.atk &&
    evs1.def === evs2.def &&
    evs1.spa === evs2.spa &&
    evs1.spd === evs2.spd &&
    evs1.spe === evs2.spe
  );
}
