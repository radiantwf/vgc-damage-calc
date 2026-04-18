import HttpClient from "./http-client";
import AppConstants from "../utils/app.constants";
import {
  ShowdownFormats,
  PokemonUsage,
  MovesetsUsage,
  ChaosNatureSpread1,
  ChaosSpread2,
  MovesetType,
} from "../models/showndown.model";

/**
 * Showdown宝可梦服务类
 * 提供获取Showdown格式、使用率数据等功能
 */
export class ShowdownStatsService {
  private static readonly _apiURL = `${AppConstants.BaseApiURL}/showdown`;
  private httpClient: HttpClient;

  private static hasRequiredSelectionParams(
    format: string,
    rule: string,
    tag: string,
    cutline: string
  ): boolean {
    return [format, rule, tag, cutline].every(
      (value) => value.trim().length > 0
    );
  }

  constructor() {
    this.httpClient = HttpClient.instance;
  }

  /**
   * 获取Showdown格式数据
   * @returns Promise<ShowdownFormats | undefined>
   */
  async getFormats(): Promise<ShowdownFormats | undefined> {
    try {
      const url = `${ShowdownStatsService._apiURL}/formats`;
      const response = await this.httpClient.get<unknown>(url);
      return ShowdownFormats.fromJson(response.data as Record<string, unknown>);
    } catch (error) {
      console.error("获取showdown格式数据时出错:", error);
      throw error;
    }
  }

  /**
   * 获取Showdown使用率数据
   * @param format 格式
   * @param tag 标签
   * @param cutline 分界线
   * @returns Promise<PokemonUsageResponse[]>
   */
  async getShowdownUsage(
    format: string,
    rule: string,
    tag: string,
    cutline: string
  ): Promise<PokemonUsage[]> {
    const usageList: PokemonUsage[] = [];

    if (
      !ShowdownStatsService.hasRequiredSelectionParams(
        format,
        rule,
        tag,
        cutline
      )
    ) {
      return usageList;
    }

    try {
      const url = `${
        ShowdownStatsService._apiURL
      }/${tag}/${format.toLowerCase()}${
        rule.toLowerCase() === "bo3" ? "bo3" : ""
      }/${cutline}/usage`;
      const response = await this.httpClient.get<unknown[]>(url);
      const data = response.data as Array<Record<string, unknown>>;

      data.forEach((row) => {
        usageList.push({
          pokemon: row.pokemon as string,
          usage: Number(row.percentage) * 100,
          rank: Number(row.rank),
        });
      });

      return usageList;
    } catch (error) {
      console.error("获取showdown使用率数据时出错:", error);
      if (error instanceof Error) {
        console.error("错误信息:", error.message);
      }
      return [];
    }
  }

  /**
   * 获取配招数据
   * @param format 格式
   * @param tag 标签
   * @param cutline 分界线
   * @param pokemon 宝可梦名称
   * @param movesetsTag 配招类型
   * @returns Promise<MovesetsUsageResponse[]>
   */
  async getMovesetsData(
    format: string,
    rule: string,
    tag: string,
    cutline: string,
    pokemon: string,
    movesetsTag: keyof typeof MovesetType
  ): Promise<MovesetsUsage[] | null> {
    const spreads: MovesetsUsage[] = [];

    if (
      !ShowdownStatsService.hasRequiredSelectionParams(
        format,
        rule,
        tag,
        cutline
      )
    ) {
      return spreads;
    }

    // 获取宝可梦的完整名称而不是tag
    const { ShowdownDataService } = await import("./showdown.data.service");
    const pokemonData = ShowdownDataService.getPokemonSpecies(pokemon);
    const pokemonName = pokemonData?.name || pokemon;
    const encodedPokemon = encodeURIComponent(pokemonName);

    try {
      let movesetsTagString = "";
      switch (movesetsTag) {
        case MovesetType.Item:
          movesetsTagString = "items";
          break;
        case MovesetType.Move:
          movesetsTagString = "moves";
          break;
        case MovesetType.TeraType:
          movesetsTagString = "teratypes";
          break;
        case MovesetType.Ability:
          movesetsTagString = "abilities";
          break;
      }
      if (!encodedPokemon || movesetsTagString === "") {
        return null;
      }

      const url = `${
        ShowdownStatsService._apiURL
      }/${tag}/${format.toLowerCase()}${
        rule.toLowerCase() === "bo3" ? "bo3" : ""
      }/${cutline}/${encodedPokemon}/${movesetsTagString}?all=true`;
      const response = await this.httpClient.get<unknown[]>(url);
      const data = response.data as Array<Record<string, unknown>>;

      data.forEach((row) => {
        spreads.push({
          name: row.name as string,
          usage: Number(row.percentage) * 100,
        });
      });

      return spreads;
    } catch (error) {
      console.error(`获取chaos配招${movesetsTag}数据时出错:`, error);
      if (error instanceof Error) {
        console.error("错误信息:", error.message);
      }
      return [];
    }
  }

  /**
   * 获取Chaos分布数据1
   * @param format 格式
   * @param tag 标签
   * @param cutline 分界线
   * @param pokemon 宝可梦名称
   * @returns Promise<ChaosNatureSpread1[]>
   */
  async getChaosSpreads1Data(
    format: string,
    rule: string,
    tag: string,
    cutline: string,
    pokemon: string
  ): Promise<ChaosNatureSpread1[]> {
    if (
      !ShowdownStatsService.hasRequiredSelectionParams(
        format,
        rule,
        tag,
        cutline
      )
    ) {
      return [];
    }

    // 获取宝可梦的完整名称而不是tag
    const { ShowdownDataService } = await import("./showdown.data.service");
    const pokemonData = ShowdownDataService.getPokemonSpecies(pokemon);
    const pokemonName = pokemonData?.name || pokemon;
    const encodedPokemon = encodeURIComponent(pokemonName);

    try {
      const url = `${
        ShowdownStatsService._apiURL
      }/${tag}/${format.toLowerCase()}${
        rule.toLowerCase() === "bo3" ? "bo3" : ""
      }/${cutline}/${encodedPokemon}/spreads1`;
      const response = await this.httpClient.get<unknown[]>(url);
      const data = response.data as Array<Record<string, unknown>>;
      const spreads: ChaosNatureSpread1[] = [];
      data.forEach((row) => {
        const spread = ChaosNatureSpread1.fromJson(row);
        spreads.push(spread);
      });
      return spreads;
    } catch (error) {
      console.error("获取chaos分布数据1时出错:", error);
      if (error instanceof Error) {
        console.error("错误信息:", error.message);
      }
      return [];
    }
  }
  /**
   * 获取Chaos分布数据1
   * @param format 格式
   * @param tag 标签
   * @param cutline 分界线
   * @param pokemon 宝可梦名称
   * @returns Promise<ChaosNatureSpread1[]>
   */
  async getChaosSpreads2Data(
    format: string,
    rule: string,
    tag: string,
    cutline: string,
    pokemon: string
  ): Promise<ChaosSpread2[]> {
    if (
      !ShowdownStatsService.hasRequiredSelectionParams(
        format,
        rule,
        tag,
        cutline
      )
    ) {
      return [];
    }

    // 获取宝可梦的完整名称而不是tag
    const { ShowdownDataService } = await import("./showdown.data.service");
    const pokemonData = ShowdownDataService.getPokemonSpecies(pokemon);
    const pokemonName = pokemonData?.name || pokemon;
    const encodedPokemon = encodeURIComponent(pokemonName);

    try {
      const url = `${
        ShowdownStatsService._apiURL
      }/${tag}/${format.toLowerCase()}${
        rule.toLowerCase() === "bo3" ? "bo3" : ""
      }/${cutline}/${encodedPokemon}/spreads2`;
      const response = await this.httpClient.get<unknown[]>(url);
      const data = response.data as Array<Record<string, unknown>>;
      const spreads: ChaosSpread2[] = [];
      data.forEach((row) => {
        const spread = ChaosSpread2.fromJson(row);
        spreads.push(spread);
      });
      return spreads;
    } catch (error) {
      console.error("获取chaos分布数据2时出错:", error);
      if (error instanceof Error) {
        console.error("错误信息:", error.message);
      }
      return [];
    }
  }
}

// 导出单例实例
export const showdownStatsService = new ShowdownStatsService();
export default showdownStatsService;
