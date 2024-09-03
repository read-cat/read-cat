import {
  AxiosStatic,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosRequestHeaders,
} from 'axios';
import { IncomingHttpHeaders } from 'http';

export interface CustomAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  onData?(next?: Buffer): void;
  cookies?: Record<string, string | number | boolean> | string;
  rejectUnauthorized?: boolean;
}
export interface CustomDownloadAxiosRequestConfig<D = any> extends CustomAxiosRequestConfig<D> {
  downloadRange?: {
    start: number,
    total: number
  }
}
export interface CustomInternalAxiosRequestConfig<D = any> extends CustomDownloadAxiosRequestConfig<D> {
  headers: AxiosRequestHeaders;
}
export interface CustomCreateAxiosDefaults<D = any> extends CustomAxiosRequestConfig<D> {

}
export interface CustomAxiosResponse<T = any, D = any> {
  data: T;
  status: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  config: CustomInternalAxiosRequestConfig<D>;
  request?: any;
}
export interface CustomAxios extends AxiosInstance {
  <T = any, R = AxiosResponse<T>, D = any>(config: CustomAxiosRequestConfig<D>): Promise<R>;
  <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  /**
   * 文件下载
   * @param url 下载地址
   * @param target 文件保存全路径
   * @return sha256
   */
  download<D = any>(url: string, target: string, config?: CustomDownloadAxiosRequestConfig<D>): Promise<string>;
  /**连接测试, 返回耗时毫秒数 */
  test<D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<number>;
  request<T = any, R = CustomAxiosResponse<T>, D = any>(config: CustomAxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  head<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  options<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  postForm<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  putForm<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  patchForm<T = any, R = CustomAxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
}
export interface CustomAxiosStatic extends AxiosStatic {
  create(config?: CustomCreateAxiosDefaults): CustomAxios;
}