import { IncomingHttpHeaders } from 'http';

export type Params = Record<string, number | string | boolean>;
export type Charset = 'UTF8' | 'GBK';
export type RequestMethod = 'GET' | 'POST';
export type ResponseType = 'buffer' | 'string';
export type Protocol = 'http' | 'https' | 'socks4' | 'socks5';
export type RequestProxy = {
  host: string,
  port: number,
  protocol: Protocol,
  username?: string,
  password?: string
}
export type RequestConfig = {
  params?: Params | URLSearchParams,
  headers?: IncomingHttpHeaders,
  proxy?: RequestProxy,
  urlencode?: Charset,
  charset?: Charset,
  responseType?: ResponseType
}

export type Response = {
  body: Buffer | string,
  headers: IncomingHttpHeaders,
  code?: number,
  message?: string
}