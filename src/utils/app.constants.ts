// 应用常量配置

class AppConstants {
  static readonly Gen = 9;

  private static _instance: AppConstants;

  private constructor() {}

  static get instance(): AppConstants {
    if (!AppConstants._instance) {
      AppConstants._instance = new AppConstants();
    }
    return AppConstants._instance;
  }

  private static get _currentHost(): string {
    return `${window.location.protocol}//${window.location.host}`;
  }

  static get WebHost(): string {
    if (process.env.NODE_ENV !== "development") {
      return `${this._currentHost}/calc`;
    } else {
      return "calc";
    }
  }

  static get ImageHost(): string {
    return `${this._currentHost}/images`;
  }

  static get BaseApiURL(): string {
    if (process.env.NODE_ENV !== "development") {
      return `${this._currentHost}/api`;
    } else {
      return "http://localhost:8888/api";
    }
  }

  /**
   * 生成7天+随机数小时的缓存时长，避免同时过期
   */
  static getCacheDuration(): number {
    // 7天 + 0-24小时的随机数
    const baseDays = 7;
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    return (
      baseDays * 24 * 60 * 60 * 1000 +
      randomHours * 60 * 60 * 1000 +
      randomMinutes * 60 * 1000
    );
  }
}

export default AppConstants;
