import { ClientOptions } from 'ws';
export interface CustomClientOptions extends ClientOptions {
  proxy?: boolean
}