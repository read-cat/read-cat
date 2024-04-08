import { IncomingHttpHeaders } from 'http';

export class ResponseError extends Error {
  public headers: IncomingHttpHeaders;
  public statusCode: number | undefined;
  public statusMessage: string | undefined;
  constructor(message: string, headers: IncomingHttpHeaders, statusCode?: number, statusMessage?: string) {
    super(message);
    this.headers = headers;
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }
}