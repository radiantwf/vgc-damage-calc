import AppConstants from '../utils/app.constants';

// HTTP响应接口
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

// HTTP错误类
export class HttpError extends Error {
  public status: number;
  public response?: Response;
  public data?: any;

  constructor(message: string, status: number, response?: Response, data?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.response = response;
    this.data = data;
  }
}

// HTTP客户端类
class HttpClient {
  private static _instance: HttpClient;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  private constructor() {
    this.baseURL = AppConstants.BaseApiURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.timeout = 15000; // 15秒超时
  }

  static get instance(): HttpClient {
    if (!HttpClient._instance) {
      HttpClient._instance = new HttpClient();
    }
    return HttpClient._instance;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new HttpError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          response,
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof HttpError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HttpError('Request timeout', 408);
        }
        throw new HttpError(error.message, 0);
      }
      
      throw new HttpError('Unknown error occurred', 0);
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let fullUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return this.request<T>(fullUrl, {
      method: 'GET',
    });
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE',
    });
  }
}

export default HttpClient;