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
} from "../vendors/smogon/damage-calc-dist/index";

const statsPasteMap: Record<StatID, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

interface PasteTextOptions {
  useChampionsEVs?: boolean;
}

const CHAMPIONS_EV_TOTAL = 66;

const championsDisplayEvToActualEv = (displayEv: number): number => {
  const normalized = Math.max(0, Math.floor(displayEv));
  if (normalized === 0) {
    return 0;
  }
  return normalized * 8 - 4;
};

const championsActualEvToDisplayEv = (actualEv: number): number => {
  const normalized = Math.max(0, Math.floor(actualEv));
  if (normalized === 0) {
    return 0;
  }
  if (normalized <= 4) {
    return 1;
  }
  return Math.floor((normalized + 4) / 8);
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

  public exportToPasteText(options?: PasteTextOptions): string {
    let finalText = "";
    const useChampionsEVs = options?.useChampionsEVs === true;

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
        const rawEv = this.evs[stat as StatID] || 0;
        const ev = useChampionsEVs
          ? championsActualEvToDisplayEv(rawEv)
          : rawEv;
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

  static importFromPasteText(
    gen: number,
    pasteText: string,
    options?: PasteTextOptions
  ): Pokemon[] {
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

      Pokemon.parseStats(currentPoke, rows, i + 1, options);
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
    offset: number,
    options?: PasteTextOptions
  ): void {
    currentPoke.nature = "Serious";
    currentPoke.level = 50;
    const useChampionsEVs = options?.useChampionsEVs === true;

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
          if (useChampionsEVs) {
            const importedTotal = Object.values(evs).reduce((sum, value) => {
              return sum + value;
            }, 0);
            if (importedTotal <= CHAMPIONS_EV_TOTAL) {
              for (const stat of Object.keys(evs) as StatID[]) {
                evs[stat] = championsDisplayEvToActualEv(evs[stat] || 0);
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
