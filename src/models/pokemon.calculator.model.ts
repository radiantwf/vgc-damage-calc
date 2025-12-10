import {
  GenerationNum,
  AbilityName,
  ItemName,
  MoveName,
  NatureName,
  TypeName,
  GenderName,
} from "../vendors/smogon/damage-calc-dist/data/interface";
import {
  SPECIES,
  Pokemon as CalculatorPokemon,
  StatsTable,
  StatID,
  Generations,
  Move,
  Result as CalculatorResult,
} from "../vendors/smogon/damage-calc-dist/index";
import { Field } from "../vendors/smogon/damage-calc-dist/field";
import { ShowdownDataService } from "../services/showdown.data.service";
import { t } from "i18next";
import i18n, { Language } from "../i18n/i18n";
import { translationService } from "../services/translation.service";

const statsPasteMap: Record<StatID, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

export class Pokemon extends CalculatorPokemon {
  nameProp?: string | undefined;
  settingTeraType?: TypeName | undefined;
  modifiedBaseStats?: StatsTable | undefined;

  getMove(
    index: number,
    options?: Partial<Omit<Move, "ability" | "item" | "species">> & {
      ability?: string | undefined;
      item?: string | undefined;
      species?: string | undefined;
    }
  ): Move {
    if (this.moves && this.moves[index]) {
      const move = new Move(this.gen, this.moves[index], options);
      return move;
    }
    return new Move(this.gen, "(No Move)", options);
  }

  public exportToPasteText(): string {
    let finalText = "";

    // 宝可梦名称和道具
    finalText = this.name + (this.item ? " @ " + this.item : "") + "\n";

    // 特性
    if (this.ability) {
      finalText += "Ability: " + this.ability + "\n";
    }

    // 等级
    finalText += "Level: " + this.level + "\n";

    // 太晶属性
    if (this.settingTeraType) {
      finalText += "Tera Type: " + this.settingTeraType + "\n";
    }

    // 努力值
    if (this.evs) {
      const evsArray: string[] = [];

      for (const stat in this.evs) {
        const ev = this.evs[stat as StatID] || 0;
        if (ev > 0) {
          evsArray.push(ev + " " + statsPasteMap[stat as StatID]);
        }
      }

      if (evsArray.length > 0) {
        finalText += "EVs: ";
        finalText += evsArray.join(" / ");
        finalText += "\n";
      }
    }

    // 性格
    if (this.nature) {
      finalText += this.nature + " Nature\n";
    }

    // 个体值
    if (this.ivs) {
      const ivsArray: string[] = [];

      for (const stat in this.ivs) {
        const iv = this.ivs[stat as StatID];
        if (iv < 31) {
          ivsArray.push(iv + " " + statsPasteMap[stat as StatID]);
        }
      }

      if (ivsArray.length > 0) {
        finalText += "IVs: ";
        finalText += ivsArray.join(" / ");
        finalText += "\n";
      }
    }

    // 招式
    for (let i = 0; i < Math.min(4, this.moves.length); i++) {
      const moveName = this.moves[i];
      if (moveName && moveName !== "(No Move)") {
        finalText += "- " + moveName + "\n";
      }
    }

    return finalText.trim();
  }

  static importFromPasteText(gen: number, pasteText: string): Pokemon[] {
    const rows = pasteText.split("\n");
    const pokemonList: Pokemon[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = (rows[i] || "").trim();
      if (!row) continue;
      if (row.includes("As One")) continue;

      const parsed = Pokemon.parseNameAndItemFromRow(row);
      const rawName = parsed?.name?.trim();
      if (!rawName) continue;

      const pokemonName = Pokemon.checkExceptions(rawName);
      if (!pokemonName || !SPECIES[gen][pokemonName]) continue;

      const currentPoke = new Pokemon(
        Generations.get(gen as GenerationNum),
        pokemonName,
        {
          level: 50,
        }
      );

      if (parsed?.item) currentPoke.item = parsed.item as ItemName;
      if (parsed?.gender) currentPoke.gender = parsed.gender as GenderName;
      currentPoke.nameProp = row;

      Pokemon.parseStats(currentPoke, rows, i + 1);
      Pokemon.parseMoves(currentPoke, rows, i);
      pokemonList.push(currentPoke);
    }
    return pokemonList;
  }

  /**
   * 检查宝可梦名称异常情况
   */
  private static checkExceptions(pokeName: string): string {
    switch (pokeName) {
      case "Aegislash":
        return "Aegislash-Blade";
      case "Basculin-Blue-Striped":
        return "Basculin";
      case "Gastrodon-East":
        return "Gastrodon";
      case "Mimikyu-Busted-Totem":
        return "Mimikyu-Totem";
      case "Mimikyu-Busted":
        return "Mimikyu";
      case "Pikachu-Belle":
      case "Pikachu-Cosplay":
      case "Pikachu-Libre":
      case "Pikachu-Original":
      case "Pikachu-Partner":
      case "Pikachu-PhD":
      case "Pikachu-Pop-Star":
      case "Pikachu-Rock-Star":
        return "Pikachu";
      case "Vivillon-Fancy":
      case "Vivillon-Pokeball":
        return "Vivillon";
      case "Florges-White":
      case "Florges-Blue":
      case "Florges-Orange":
      case "Florges-Yellow":
        return "Florges";
      case "Shellos-East":
        return "Shellos";
      case "Deerling-Summer":
      case "Deerling-Autumn":
      case "Deerling-Winter":
        return "Deerling";
      default:
        return pokeName;
    }
  }

  private static parseNameAndItemFromRow(
    row: string
  ): { name: string; item?: ItemName; gender?: GenderName } | undefined {
    if (!row) return undefined;

    let itemStr: string | undefined;
    let nameArea = row;
    let gender: GenderName | undefined;

    const itemMatch = row.match(/ @ ([A-Za-z \-_]+)$/);
    if (itemMatch) {
      itemStr = itemMatch[1] as ItemName;
      nameArea = row.substring(0, row.length - itemMatch[0].length);
    }

    if (nameArea.endsWith(" (F)")) {
      gender = "F" as GenderName;
      nameArea = nameArea.substring(0, nameArea.length - 4);
    } else if (nameArea.endsWith(" (M)")) {
      gender = "M" as GenderName;
      nameArea = nameArea.substring(0, nameArea.length - 4);
    }

    const match2 = nameArea.match(/.*\((.*?)\)$/);
    const finalName = (match2 ? match2[1]! : nameArea).trim();
    if (finalName === "") return undefined;

    return { name: finalName, item: itemStr as ItemName, gender };
  }

  /**
   * 解析属性值（努力值、个体值、性格等）
   */
  private static parseStats(
    currentPoke: Pokemon,
    rows: string[],
    offset: number
  ): void {
    currentPoke.nature = "Serious";
    currentPoke.level = 50;

    for (let x = offset; x < offset + 9 && x < rows.length; x++) {
      const currentRow = rows[x] ? rows[x].split(/[/:]/) : [];

      if (currentRow.length === 0) continue;

      switch (currentRow[0].trim()) {
        case "Level":
          currentPoke.level = parseInt(currentRow[1]?.trim() || "50");
          break;
        case "EVs":
          const evs: StatsTable<number> = {
            hp: 0,
            atk: 0,
            def: 0,
            spa: 0,
            spd: 0,
            spe: 0,
          };
          for (let j = 1; j < currentRow.length; j++) {
            const currentEV = currentRow[j].trim().split(" ");
            if (currentEV.length >= 2) {
              try {
                const stat = currentEV[1].toLowerCase() as StatID;
                evs[stat] = parseInt(currentEV[0]);
              } catch (error) {
                console.log(error);
              }
            }
          }
          currentPoke.evs = evs;
          break;
        case "IVs":
          const ivs: StatsTable<number> = {
            hp: 31,
            atk: 31,
            def: 31,
            spa: 31,
            spd: 31,
            spe: 31,
          };
          for (let j = 1; j < currentRow.length; j++) {
            const currentIV = currentRow[j].trim().split(" ");
            if (currentIV.length >= 2) {
              try {
                const stat = currentIV[1].toLowerCase() as StatID;
                ivs[stat] = parseInt(currentIV[0]);
              } catch (error) {
                console.log(error);
              }
            }
            currentPoke.ivs = ivs;
          }
          break;
      }

      // 检查特性
      const abilityRow = rows[x] ? rows[x].trim().split(":") : [];
      if (abilityRow[0] === "Ability") {
        currentPoke.ability = abilityRow[1]?.trim() as AbilityName;
      }

      // 检查太晶属性
      const teraTypeRow = rows[x] ? rows[x].trim().split(":") : [];
      if (teraTypeRow[0] === "Tera Type") {
        const teraType = teraTypeRow[1]?.trim();
        if (teraType) {
          currentPoke.teraType = (teraType[0].toUpperCase() +
            teraType.substring(1)) as TypeName;
          currentPoke.settingTeraType = currentPoke.teraType;
        }
      }

      // 检查性格
      const natureRow = rows[x] ? rows[x].trim().split(" ") : [];
      if (natureRow[1] === "Nature" && natureRow[0] !== "-") {
        currentPoke.nature = natureRow[0] as NatureName;
      }
    }
    switch (currentPoke.species.name) {
      case "Calyrex-Ice":
        currentPoke.ability = "As One (Glastrier)" as AbilityName;
        break;
      case "Calyrex-Shadow":
        currentPoke.ability = "As One (Spectrier)" as AbilityName;
        break;
    }
  }

  /**
   * 解析招式
   */
  private static parseMoves(
    currentPoke: Pokemon,
    rows: string[],
    offset: number
  ): void {
    let movesFound = false;
    const moves: MoveName[] = [];

    for (let x = offset; x < offset + 12 && x < rows.length; x++) {
      if (rows[x]) {
        if (rows[x][0] === "-") {
          movesFound = true;
          const move = rows[x]
            .slice(2)
            .replace(/[\\[\]]/g, "")
            .trim()
            .replace(/\s+/g, " ") as MoveName;
          moves.push(move);
        } else {
          if (movesFound) {
            break;
          }
        }
      }
    }

    currentPoke.moves = moves;
  }
}

export class Result extends CalculatorResult {
  /**
   * 文本：伤害范围与百分比，例如 "min-max (minPct-maxPct%)"
   */
  public getDamageRangeText(): string {
    if (this.damage === 0) {
      return "";
    }
    const damageText = (this.moveDesc() || "")
      .replace("recoil damage", t("damageResult.recoildamage"))
      .replace("struggle damage", t("damageResult.struggledamage"))
      .replace("recovered", t("damageResult.recovered"));
    return damageText;
  }

  public getFullDescText(): string {
    const lang = i18n.language as unknown as Language;
    const rawDesc = this.rawDesc;
    const damageStrings1: string[] = [];
    if (rawDesc.attackBoost != null && rawDesc.attackBoost !== 0) {
      damageStrings1.push(
        rawDesc.attackBoost! > 0
          ? `+${rawDesc.attackBoost}`
          : `${rawDesc.attackBoost}`
      );
    }
    if (rawDesc.attackEVs != null) {
      damageStrings1.push(rawDesc.attackEVs!);
    }
    if (rawDesc.attackerItem != null) {
      const translated = translationService.translateItemSync(
        lang,
        rawDesc.attackerItem!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.attackerAbility != null) {
      const translated = translationService.translateAbilitySync(
        lang,
        rawDesc.attackerAbility!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.isBurned) {
      damageStrings1.push(t("damageResult.burned"));
    }
    if (rawDesc.attackerTera != null) {
      damageStrings1.push(t("damageResult.tera"));
      const translated = translationService.translateTypeSync(
        lang,
        rawDesc.attackerTera!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.isSwordOfRuin) {
      damageStrings1.push(t("damageResult.swordofruin"));
    }
    if (rawDesc.isBeadsOfRuin) {
      damageStrings1.push(t("damageResult.beadsofruin"));
    }
    if (rawDesc.attackerName != null) {
      const translated = translationService.translatePokemonSync(
        lang,
        rawDesc.attackerName!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.isHelpingHand) {
      damageStrings1.push(t("damageResult.helpinghand"));
    }
    if (rawDesc.isFlowerGiftAttacker) {
      damageStrings1.push(t("damageResult.flowergift"));
    }
    if (rawDesc.isSteelySpiritAttacker) {
      damageStrings1.push(t("damageResult.steelyspirit"));
    }
    if (rawDesc.isBattery) {
      damageStrings1.push(t("damageResult.batteryboosted"));
    }
    if (rawDesc.isPowerSpot) {
      damageStrings1.push(t("damageResult.powerspot"));
    }
    if (rawDesc.moveName != null) {
      const translated = translationService.translateMoveSync(
        lang,
        rawDesc.moveName!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.moveBP != null && rawDesc.moveBP !== 0) {
      damageStrings1.push(`(${rawDesc.moveBP}${t("damageResult.bp")})`);
    }
    if (rawDesc.hits != null && rawDesc.hits! > 1) {
      damageStrings1.push(
        t("damageResult.hits").replaceAll("{{hits}}", rawDesc.hits!.toString())
      );
    }
    damageStrings1.push("vs.");
    if (rawDesc.defenseBoost != null && rawDesc.defenseBoost !== 0) {
      damageStrings1.push(
        rawDesc.defenseBoost! > 0
          ? `+${rawDesc.defenseBoost}`
          : `${rawDesc.defenseBoost}`
      );
    }
    const tmpList: string[] = [];
    if (rawDesc.HPEVs != null) {
      tmpList.push(rawDesc.HPEVs!);
    }
    if (rawDesc.defenseEVs != null) {
      tmpList.push(rawDesc.defenseEVs!);
    }
    if (tmpList.length > 0) {
      damageStrings1.push(tmpList.join(" / "));
    }
    if (rawDesc.defenderItem != null) {
      const translated = translationService.translateItemSync(
        lang,
        rawDesc.defenderItem!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.defenderAbility != null) {
      const translated = translationService.translateAbilitySync(
        lang,
        rawDesc.defenderAbility!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.isDefenderDynamaxed) {
      damageStrings1.push(t("damageResult.dynamax"));
    }
    if (rawDesc.defenderTera != null) {
      damageStrings1.push(t("damageResult.tera"));
      const translated = translationService.translateTypeSync(
        lang,
        rawDesc.defenderTera!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.isTabletsOfRuin) {
      damageStrings1.push(t("damageResult.tabletsofruin"));
    }
    if (rawDesc.isVesselOfRuin) {
      damageStrings1.push(t("damageResult.vesselofruin"));
    }
    if (rawDesc.defenderName != null) {
      const translated = translationService.translatePokemonSync(
        lang,
        rawDesc.defenderName!
      );
      damageStrings1.push(translated);
    }
    if (rawDesc.terrain) {
      damageStrings1.push(
        t("damageResult." + rawDesc.terrain!.toLowerCase().replaceAll(" ", ""))
      );
    }
    if (rawDesc.weather) {
      damageStrings1.push(
        t("damageResult." + rawDesc.weather!.toLowerCase().replaceAll(" ", ""))
      );
    }
    if (rawDesc.isFlowerGiftDefender) {
      damageStrings1.push(t("damageResult.flowergift"));
    }
    if (rawDesc.isReflect) {
      damageStrings1.push(t("damageResult.reflect"));
    }
    if (rawDesc.isLightScreen) {
      damageStrings1.push(t("damageResult.lightscreen"));
    }
    if (rawDesc.isFriendGuard) {
      damageStrings1.push(t("damageResult.friendguard"));
    }
    if (rawDesc.isAuroraVeil) {
      damageStrings1.push(t("damageResult.auroraveil"));
    }
    if (rawDesc.isCritical) {
      damageStrings1.push(t("damageResult.criticalhit"));
    }
    if (rawDesc.isWonderRoom) {
      damageStrings1.push(t("damageResult.wonderroom"));
    }
    const damageStrings2: string[] = [];
    if (this.damage != null && this.damage !== 0) {
      const range = this.range();
      damageStrings2.push(
        `${range[0]} - ${range[1]} (${(
          (range[0] /
            (this.defender.stats.hp *
              (this.defender.isDynamaxed === true ? 2 : 1))) *
          100
        ).toFixed(2)}-${(
          (range[1] /
            (this.defender.stats.hp *
              (this.defender.isDynamaxed === true ? 2 : 1))) *
          100
        ).toFixed(2)}%)`
      );
      const kochance = this.kochance();
      try {
        const koText = kochance.text.trim();
        if (kochance && koText !== "") {
          const index = koText.indexOf(" (");
          const parts = [];
          if (index > 0) {
            parts.push(koText.substring(0, index));
            parts.push(koText.substring(index + 2, koText.length - 1));
          } else {
            parts.push(koText);
          }
          const koStr = [];
          const part0 = this._getKoChangeDamageStrByPartText(parts[0]);
          if (part0 !== "") {
            koStr.push(part0);
          }
          if (parts.length > 1) {
            const part1 = this._getKoChangeDamageStrByPartText(parts[1]);
            if (part1 !== "") {
              koStr.push(
                t("damageResult.subtext").replaceAll("{{text}}", part1)
              );
            }
          }
          if (koStr.length > 0) {
            damageStrings2.push(" -- ");
            damageStrings2.push(koStr.join(""));
          }
        }
      } catch (e) {
        console.log(e);
        if (
          kochance &&
          kochance.chance &&
          kochance.chance! > 0 &&
          kochance.n > 0
        ) {
          damageStrings2.push(` -- `);
          if (kochance.chance! === 1) {
            damageStrings2.push(t("damageResult.kochance_guaranteed"));
          } else {
            damageStrings2.push(
              t("damageResult.kochance_chance").replaceAll(
                "{{chance}}",
                `${(kochance.chance! * 100).toFixed(2)}%`
              )
            );
          }
          if (kochance.n === 1) {
            damageStrings2.push(t("damageResult.kochance_ko_1"));
          } else {
            damageStrings2.push(
              t("damageResult.kochance_ko_n").replaceAll(
                "{{n}}",
                kochance.n.toString()
              )
            );
          }
          const after_index = kochance.text.indexOf("after ");
          if (after_index >= 0) {
            const after_text_strings: string[] = [];
            const tmp = kochance.text
              .substring(after_index + 6)
              .replaceAll(" ,", ",")
              .replaceAll("(guaranteed OHKO after", ",")
              .replaceAll(")", "")
              .replaceAll(", and ", "|")
              .replaceAll(",and ", "|")
              .replaceAll(" and ", "|")
              .replaceAll(", ", "|")
              .toLowerCase();
            const list = tmp.split("|");
            for (let i = 0; i < list.length; i++) {
              if (i > 0 && i === list.length - 1) {
                after_text_strings.push(
                  t(`damageResult.chanceaftertextsplitlast`)
                );
              } else if (i > 0) {
                after_text_strings.push(t(`damageResult.chanceaftertextsplit`));
              }
              const text = list[i].trim();
              const tag = `damageResult.${text.replaceAll(" ", "")}`;
              const tran = t(tag);
              after_text_strings.push(tran === tag ? text : tran);
            }
            damageStrings2.push(
              t(`damageResult.chanceaftertext`).replaceAll(
                "{{text}}",
                after_text_strings.join("")
              )
            );
          }
        }
      }
    }

    return damageStrings2.length > 0
      ? damageStrings1.join(" ").concat(": ", damageStrings2.join(""))
      : damageStrings1.join(" ");
  }

  _getKoChangeDamageStrByPartText(text: string): string {
    if (text === "") {
      return "";
    }
    const chanceText = [];
    const parts = text.split(" after ");
    const hitsStr = parts[0].endsWith("HKO")
      ? parts[0].substring(parts[0].lastIndexOf(" ") + 1, parts[0].length - 3)
      : "-1";
    const hits = hitsStr === "O" ? 1 : Number(hitsStr);

    if (parts[0].startsWith("approx. ")) {
      parts[0] = parts[0].substring(8);
      chanceText.push(t("damageResult.approx"));
    } else if (parts[0].startsWith("possible ")) {
      parts[0] = parts[0].substring(9);
      chanceText.push(t("damageResult.possible"));
    }
    const chanceStr = parts[0].startsWith("guaranteed")
      ? "100"
      : parts[0].lastIndexOf("%") > -1
      ? parts[0].substring(0, parts[0].lastIndexOf("%"))
      : "-100";
    const chanceVal = Number(chanceStr.replaceAll("%", ""));
    if (chanceVal === -100) {
    } else if (chanceVal === 100) {
      chanceText.push(t("damageResult.kochance_guaranteed"));
    } else {
      chanceText.push(
        t("damageResult.kochance_chance").replaceAll(
          "{{chance}}",
          `${chanceVal}%`
        )
      );
    }
    if (hits === 1) {
      chanceText.push(t("damageResult.kochance_ko_1"));
    } else {
      chanceText.push(
        t("damageResult.kochance_ko_n").replaceAll("{{n}}", hits.toString())
      );
    }
    const after_index = text.indexOf("after ");
    if (after_index >= 0) {
      const after_text_strings: string[] = [];
      const tmp = text
        .substring(after_index + 6)
        .replaceAll(" ,", ",")
        .replaceAll(", and ", "|")
        .replaceAll(",and ", "|")
        .replaceAll(" and ", "|")
        .replaceAll(", ", "|")
        .toLowerCase();
      const list = tmp.split("|");
      for (let i = 0; i < list.length; i++) {
        if (i > 0 && i === list.length - 1) {
          after_text_strings.push(t(`damageResult.chanceaftertextsplitlast`));
        } else if (i > 0) {
          after_text_strings.push(t(`damageResult.chanceaftertextsplit`));
        }
        const text = list[i].trim();
        const tag = `damageResult.${text.replaceAll(" ", "")}`;
        const tran = t(tag);
        after_text_strings.push(tran === tag ? text : tran);
      }
      chanceText.push(
        t(`damageResult.chanceaftertext`).replaceAll(
          "{{text}}",
          after_text_strings.join("")
        )
      );
    }
    return chanceText.join("");
  }

  /**
   * 文本：KO 概率描述（仅当伤害为非空一维数组时返回文本，避免第三方库断言错误）
   */
  public getKoChanceText(): string {
    const dmg = this.damage as unknown;
    if (
      Array.isArray(dmg) &&
      typeof (dmg as any)[0] === "number" &&
      (dmg as any[]).length > 0
    ) {
      try {
        const { text } = this.kochance();
        return text || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  }

  public hasMultiSegmentDamage(): boolean {
    const dmg = this.damage as unknown;
    return Array.isArray(dmg) && Array.isArray((dmg as unknown[])[0]);
  }

  private _computeSumCounts(lists: number[][]): Map<number, number> {
    let sums = new Map<number, number>();
    sums.set(0, 1);
    for (const list of lists) {
      const next = new Map<number, number>();
      for (const [s, c] of sums) {
        for (const v of list) {
          const key = s + v;
          next.set(key, (next.get(key) || 0) + c);
        }
      }
      sums = next;
      if (sums.size === 0) break;
    }
    return sums;
  }

  _possibleDamageAmounts(): number | number[] {
    if (typeof this.damage === "number") return this.damage;
    const arr = this.damage as number[];
    if (arr.length > 0 && Array.isArray(arr[0])) {
      const lists = arr.map((x) =>
        Array.isArray(x)
          ? (x as number[])
              .filter((v) => typeof v === "number")
              .map((v) => v as number)
          : []
      ) as number[][];
      const sumCounts = this._computeSumCounts(lists);
      const uniqueSums = Array.from(sumCounts.keys()).sort((a, b) => a - b);
      return uniqueSums;
    }
    return arr;
  }
  public getPossibleDamageAmountsText(): string {
    const dmg = this._possibleDamageAmounts();
    if (Array.isArray(dmg)) {
      if (dmg.length > 16) {
        const seen = new Set<number>();
        const values: number[] = [];
        for (const v of dmg) {
          if (typeof v === "number" && !seen.has(v)) {
            seen.add(v);
            values.push(v);
          }
        }
        return values.join(", ");
      }
      return `${dmg.join(", ")}`;
    }
    return `${dmg}`;
  }
  public getOhkoChanceValue(): number {
    try {
      const hp =
        this.defender?.stats?.hp * (this.defender?.isDynamaxed ? 2 : 1);
      if (typeof hp !== "number" || !Number.isFinite(hp) || hp <= 0) {
        return 0;
      }
      const dmg = this.damage as unknown;
      if (Array.isArray(dmg) && Array.isArray((dmg as unknown[])[0])) {
        const lists = (dmg as unknown[]).map((x) =>
          Array.isArray(x)
            ? (x as number[])
                .filter((v) => typeof v === "number")
                .map((v) => v as number)
            : []
        ) as number[][];
        const sumCounts = this._computeSumCounts(lists);
        let success = 0;
        let total = 0;
        for (const [sum, count] of sumCounts) {
          total += count;
          if (sum >= hp) success += count;
        }
        return total > 0 ? success / total : 0;
      }
      const flat = this._possibleDamageAmounts();
      if (
        Array.isArray(flat) &&
        flat.length > 0 &&
        typeof flat[0] === "number"
      ) {
        let success = 0;
        for (const v of flat) {
          if (typeof v === "number" && v >= hp) success++;
        }
        const total = flat.length;
        return total > 0 ? success / total : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

/**
 * 计算指定侧的 4 个招式的伤害结果数组（返回扩展的 Result 或 undefined）
 * 注意：此方法不依赖 React 上下文，需显式传入 Field 与 Side。
 */
export function computeSideMoveResults(
  atkPokemon: Pokemon | undefined,
  defPokemon: Pokemon | undefined,
  getMove: (index: number) => Move | undefined,
  field: Field
): (Result | undefined)[] {
  const results: (Result | undefined)[] = [
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  if (!atkPokemon || !defPokemon) {
    return results;
  }

  for (let idx = 0; idx < 4; idx++) {
    try {
      const move = getMove(idx);
      if (!move) {
        results[idx] = undefined;
        continue;
      }
      const result: Result = ShowdownDataService.calculate(
        move.gen.num,
        atkPokemon,
        defPokemon,
        move,
        field
      );
      results[idx] = result;
    } catch (e) {
      console.warn("Failed to compute side move result for index", idx, e);
      results[idx] = undefined;
    }
  }

  return results;
}
