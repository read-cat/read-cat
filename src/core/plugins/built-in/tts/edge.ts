import { isNull, isString, isUndefined } from '../../../is';
import { PluginConstructorParams, RequireItem } from '../../defined/plugins';
import { EndCallback, NextCallback, TTSOptions, Voice } from '../../defined/ttsengine';
import { chunkArray } from '../../../utils';
import { escapeXML } from '../../../utils/html';
import { WebSocketClient } from '../../../websocket';

/**
 * 功能实现参考自 https://github.com/rany2/edge-tts/
 */

// ============ Sec-MS-GEC v2 生成（CS64+SHA-256 双摘要，移植自 edge-tts 7.x 的 generate_sec_ms_gec_v2） ============
const WIN_EPOCH = 11644473600;
const U32 = 4294967295;
const SHA256_INITIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SHA256_STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SHA256_SCHEDULE = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const SHA256_ROUND_CONSTANTS = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];
const SHA256_ADJUSTMENT = 0xC9DC06A7;
const SHA256_BLOCK_CONSTANTS = [...SHA256_ROUND_CONSTANTS.slice(0, 14), SHA256_ADJUSTMENT, ...SHA256_ROUND_CONSTANTS.slice(15)];
const SHA256_SIGMA0_ADJ = 0x059C0B80;
const SHA256_SIGMA1_ADJ = 0x000B92C0;
const CS64_COEFFICIENTS = [
  [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038],
  [0xC89C5933, 0xB328CBDF], [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C],
  [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB], [0x06064CF3, 0xFA51A3DA],
  [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167]
];
const CS64_FACTOR = 0x82893933;
const CS64_ADJ0 = 0xF2F90B1A;
const CS64_ADJ1 = 0x0B1A0000;
const mul = (a: number, b: number) => Math.imul(a, b) >>> 0;
const rol16 = (v: number) => (((v << 16) >>> 0) | (v >>> 16)) >>> 0;
const sigma0 = (v: number) => ((v >>> 7) ^ ((v << 25) >>> 0) ^ (v >>> 18) ^ ((v << 14) >>> 0) ^ (v >>> 3)) >>> 0;
const sigma1 = (v: number) => ((v >>> 17) ^ ((v << 15) >>> 0) ^ (v >>> 19) ^ ((v << 13) >>> 0) ^ (v >>> 10)) >>> 0;

function sha256Rounds(state: number[], words: number[], firstRound = 0): number[] {
  let a = state[0], b = state[1], c = state[2], d = state[3], e = state[4], f = state[5], g = state[6], h = state[7];
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8);
  const ROTR = (v: number, n: number) => ((v >>> n) | ((v << (32 - n)) >>> 0)) >>> 0;
  for (let index = firstRound; index < aligned; index++) {
    const t1 = (h + (ROTR(e, 6) ^ ROTR(e, 11) ^ ROTR(e, 25)) + (g ^ (e & (f ^ g))) + constants[index] + words[index]) >>> 0;
    const t2 = ((ROTR(a, 2) ^ ROTR(a, 13) ^ ROTR(a, 22)) + ((a & b) | (c & (a | b)))) >>> 0;
    [a, b, c, d, e, f, g, h] = [(t1 + t2) & U32, a, b, c, (d + t1) & U32, e, f, g];
  }
  for (let index = aligned; index < 64; index += 8) {
    let t1 = (h + (ROTR(e, 6) ^ ROTR(e, 11) ^ ROTR(e, 25)) + (g ^ (e & (f ^ g))) + constants[index] + words[index]) >>> 0;
    let t2 = ((ROTR(a, 2) ^ ROTR(a, 13) ^ ROTR(a, 22)) + ((a & b) | (c & (a | b)))) >>> 0;
    d = (d + t1) & U32; h = (t1 + t2) & U32;
    t1 = (g + (ROTR(d, 6) ^ ROTR(d, 11) ^ ROTR(d, 25)) + (f ^ (d & (e ^ f))) + constants[index + 1] + words[index + 1]) >>> 0;
    t2 = ((ROTR(h, 2) ^ ROTR(h, 13) ^ ROTR(h, 22)) + ((h & a) | (b & (h | a)))) >>> 0;
    c = (c + t1) & U32; g = (t1 + t2) & U32;
    t1 = (f + (ROTR(c, 6) ^ ROTR(c, 11) ^ ROTR(c, 25)) + (e ^ (c & (d ^ e))) + constants[index + 2] + words[index + 2]) >>> 0;
    t2 = ((ROTR(g, 2) ^ ROTR(g, 13) ^ ROTR(g, 22)) + ((g & h) | (a & (g | h)))) >>> 0;
    b = (b + t1) & U32; f = (t1 + t2) & U32;
    t1 = (e + (ROTR(b, 6) ^ ROTR(b, 11) ^ ROTR(b, 25)) + (d ^ (b & (c ^ d))) + constants[index + 3] + words[index + 3]) >>> 0;
    t2 = ((ROTR(f, 2) ^ ROTR(f, 13) ^ ROTR(f, 22)) + ((f & g) | (h & (f | g)))) >>> 0;
    a = (a + t1) & U32; e = (t1 + t2) & U32;
    t1 = (d + (ROTR(a, 6) ^ ROTR(a, 11) ^ ROTR(a, 25)) + (c ^ (a & (b ^ c))) + constants[index + 4] + words[index + 4]) >>> 0;
    t2 = ((ROTR(e, 2) ^ ROTR(e, 13) ^ ROTR(e, 22)) + ((e & f) | (g & (e | f)))) >>> 0;
    h = (h + t1) & U32; d = (t1 + t2) & U32;
    t1 = (c + (ROTR(h, 6) ^ ROTR(h, 11) ^ ROTR(h, 25)) + (b ^ (h & (a ^ b))) + constants[index + 5] + words[index + 5]) >>> 0;
    t2 = ((ROTR(d, 2) ^ ROTR(d, 13) ^ ROTR(d, 22)) + ((d & e) | (f & (d | e)))) >>> 0;
    g = (g + t1) & U32; c = (t1 + t2) & U32;
    t1 = (b + (ROTR(g, 6) ^ ROTR(g, 11) ^ ROTR(g, 25)) + (a ^ (g & (h ^ a))) + constants[index + 6] + words[index + 6]) >>> 0;
    t2 = ((ROTR(c, 2) ^ ROTR(c, 13) ^ ROTR(c, 22)) + ((c & d) | (e & (c | d)))) >>> 0;
    f = (f + t1) & U32; b = (t1 + t2) & U32;
    t1 = (a + (ROTR(f, 6) ^ ROTR(f, 11) ^ ROTR(f, 25)) + (h ^ (f & (g ^ h))) + constants[index + 7] + words[index + 7]) >>> 0;
    t2 = ((ROTR(b, 2) ^ ROTR(b, 13) ^ ROTR(b, 22)) + ((b & c) | (d & (b | c)))) >>> 0;
    e = (e + t1) & U32; a = (t1 + t2) & U32;
  }
  return [a, b, c, d, e, f, g, h];
}
function expandSchedule(words: number[], firstWord = 16): void {
  for (let index = firstWord; index < 64; index++) {
    const x = words[index - 2], y = words[index - 15];
    const s1 = ((x >>> 17) ^ ((x << 15) >>> 0) ^ (x >>> 19) ^ ((x << 13) >>> 0) ^ (x >>> 10)) >>> 0;
    const s0 = ((y >>> 7) ^ ((y << 25) >>> 0) ^ (y >>> 18) ^ ((y << 14) >>> 0) ^ (y >>> 3)) >>> 0;
    words.push(((s1 + words[index - 7] + s0 + words[index - 16]) & U32) >>> 0);
  }
}
const sha256InitCache = new Map<string, number[]>();
function sha256Init(data: Buffer): number[] {
  const key = data.toString('hex');
  if (sha256InitCache.has(key)) {
    return sha256InitCache.get(key)!;
  }
  const words: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  words.push((data[0] << 16 | data[1] << 8 | data[2]) >>> 0);
  words.push((data[3] << 24 | data[4] << 16 | data[5] << 8 | data[6]) >>> 0);
  for (let index = 16; index < 30; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) value += index === 16 ? ((sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJ) >>> 0) : sigma1(words[index - 2]);
    if (index - 7 >= 14) value += words[index - 7];
    if (index - 15 >= 14) value += index === 29 ? ((sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJ) >>> 0) : sigma0(words[index - 15]);
    words.push(value >>> 0);
  }
  words.push(((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) & U32) >>> 0);
  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  const res = working.map((v, i) => ((v + SHA256_INITIAL[i]) & U32) >>> 0);
  sha256InitCache.set(key, res);
  return res;
}
function sha256Digest(dataBytes: Buffer): Buffer {
  const length = 57 + dataBytes.length;
  let padded = Buffer.concat([Buffer.from(dataBytes.slice(7)), Buffer.from([0x80])]);
  padded = Buffer.concat([padded, Buffer.alloc(((55 - length) % 64 + 64) % 64)]);
  const lenBuf = Buffer.alloc(8);
  lenBuf.writeBigUInt64BE(BigInt(length * 8));
  padded = Buffer.concat([padded, lenBuf]);
  let state = sha256Init(dataBytes.slice(0, 7));
  for (let offset = 0; offset < padded.length; offset += 64) {
    const block = padded.slice(offset, offset + 64);
    const words: number[] = [];
    for (let i = 0; i < 16; i++) {
      words.push(block.readUInt32BE(i * 4));
    }
    expandSchedule(words);
    const working = sha256Rounds(state, words);
    state = working.map((v, i) => ((v + state[i]) & U32) >>> 0);
  }
  const out = Buffer.alloc(32);
  state.forEach((v, i) => out.writeUInt32BE(v >>> 0, i * 4));
  return out;
}
function wordsLe4Even(data: Buffer): number[] {
  let padded = Buffer.from(data);
  const rem = padded.length % 4;
  if (rem) {
    padded = Buffer.concat([padded, Buffer.alloc(4 - rem)]);
  }
  const words: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    words.push(padded.readUInt32LE(i));
  }
  if (words.length % 2) {
    words.push(0);
  }
  return words;
}
function cs64Digest(data: Buffer, digest: Buffer): number[] {
  const keyA = digest.readUInt32LE(0) | 1;
  const keyB = digest.readUInt32LE(4) | 1;
  const factors = [mul(keyA, CS64_FACTOR), mul(keyB, CS64_FACTOR)];
  const terms: number[] = CS64_COEFFICIENTS.map(([coeff], index) => mul(coeff, factors[index % 2]));
  const offsets: number[] = CS64_COEFFICIENTS.map(([, off]) => off);
  const words = wordsLe4Even(Buffer.concat([Buffer.from([0]), data]));
  words.forEach((word, index) => {
    let term = mul(word, index % 2 === 0 ? keyA : keyB);
    let offset = mul(rol16(word), index % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (index === 0) {
      term = (term + mul(CS64_ADJ0, factors[0])) >>> 0;
      offset = (offset + CS64_ADJ1) >>> 0;
    }
    terms.push(term >>> 0);
    offsets.push(offset >>> 0);
  });
  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index], y = terms[index + 1];
    let t = rol16((offsets[index] + x) >>> 0);
    let q = mul(t, 0x76F50F34);
    swapAcc = (swapAcc + (mul(rol16(q), 0xC3EFEA97) + q)) >>> 0;
    t = rol16((offsets[index + 1] + y) >>> 0);
    q = mul(t, 0x1881CE3C);
    swapLast = (mul(rol16(q), 0x35BD1EC9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;
    state = (mul(state, keyA) + x) >>> 0;
    state = mul(rol16(state), 0xCF98B111);
    state = mul(rol16(state), 0x87085B9F);
    state = mul(rol16(state), 0x12CEB96D);
    state = mul(rol16(state), 0x257E1D83);
    acc = (acc + state) >>> 0;
    t = (mul(state, keyB) + y) >>> 0;
    t = mul(rol16(t), 0xA27416F5);
    t = mul(rol16(t), 0xD38396FF);
    state = mul(rol16(mul(rol16(t), 0x7C932B89)), 0xBFA49F69);
    acc = (acc + state) >>> 0;
  }
  return [(swapLast ^ state) >>> 0, (swapAcc ^ acc) >>> 0];
}
function generateSecMsGecV2(token: string): string {
  let ticks = Date.now() / 1000;
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 1e7;
  const strToHash = Buffer.from(Math.round(ticks) + '' + token, 'ascii');
  const digest = sha256Digest(strToHash);
  const cs64Buf = Buffer.alloc(8);
  const cs = cs64Digest(strToHash, digest);
  cs64Buf.writeUInt32LE(cs[0], 0);
  cs64Buf.writeUInt32LE(cs[1], 4);
  return cs64Buf.toString('hex').toUpperCase() + '-' + digest.toString('hex').toUpperCase();
}
// ============ Sec-MS-GEC v2 实现结束 ============

export class EdgeTTSEngine {
  public static readonly ID = 'hK1lY7FGM-UIYf76pN0Sk';
  public static readonly TYPE = 2;
  public static readonly GROUP = '(内置)TTS';
  public static readonly NAME = 'Edge TTS Engine';
  public static readonly VERSION = '1.0.0';
  public static readonly VERSION_CODE = 0;
  public static readonly PLUGIN_FILE_URL = '';
  public static readonly REQUIRE: Record<string, RequireItem> = {
    proxy: {
      label: '代理',
      type: 'boolean',
      default: false,
      description: '朗读报错时可尝试开启该选项，同时开启设置/代理'
    },
    edgeVersion: {
      label: 'Edge版本号',
      type: 'string',
      default: '143.0.3650.75'
    }
  };

  private static readonly TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  private static readonly WEBSOCKET_MAX_SIZE = 2 ** 16;;

  private uuid;
  private request;
  private wss: WebSocketClient | null = null;
  constructor(options: PluginConstructorParams) {
    const { request, uuid } = options;
    this.uuid = uuid;
    this.request = request;
  }
  get proxy() {
    return EdgeTTSEngine.REQUIRE.proxy.value;
  }
  get edgeVersion() {
    return EdgeTTSEngine.REQUIRE.edgeVersion.value;
  }

  private getSecMsGec() {
    return generateSecMsGecV2(EdgeTTSEngine.TOKEN);
  }
  connect() {
    return new Promise<void>((reso, reje) => {
      if (this.wss && this.wss.readyState === 1) {
        return reso();
      }
      const query: Record<string, string> = {
        TrustedClientToken: EdgeTTSEngine.TOKEN,
        ConnectionId: this.uuid(),
        'Sec-MS-GEC': this.getSecMsGec(),
        'Sec-MS-GEC-Version': `2-${this.edgeVersion}`
      };
      const queryStr = Object.keys(query).map(key => `${key}=${query[key]}`).join('&');
      this.wss = new WebSocketClient(`wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?${queryStr}`, {
        headers: {
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${this.edgeVersion} Safari/537.36 Edg/${this.edgeVersion}`,
          'Cookie': `muid=${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()};`
        },
        proxy: this.proxy
      });
      this.wss?.once('open', () => {
        this.wss?.send(
          'Path: speech.config\r\n' +
          `X-Timestamp: ${(new Date).toISOString()}\r\n` +
          'Content-Type: application/json; charset=utf-8\r\n\r\n' +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
          , e => {
            return e ? reje(e) : reso();
          });
      });
      this.wss?.once('error', e => {
        return reje(e);
      });
      /* this.wss?.once('close', () => {
        console.log('断开连接');
      }); */
    });
  }
  sendSSMLRequest(ssmlHeaders: string) {
    return new Promise<Buffer>((reso, reje) => {
      if (isNull(this.wss)) {
        return reje();
      }
      let body = Buffer.alloc(0);
      this.wss.onmessage = e => {
        if (!isString(e.data)) {
          const data = <Buffer>e.data.slice(e.data.toString('utf-8').indexOf('Path:audio') + 12);
          body = Buffer.concat([body, data]);
          return;
        }
        const str = e.data.toString();
        if (str.includes('Path:turn.end')) {
          return reso(body);
        }
      }
      this.wss.onerror = e => {
        return reje(new Error(e.message));
      }
      this.wss.onclose = e => {
        return e.reason ? reje(new Error(e.reason)) : reso(Buffer.alloc(0));
      }
      this.wss.send(ssmlHeaders, e => {
        if (e) {
          return reje(e);
        }
      });
    });
  }
  createSSMLHeaders(ssml: string) {
    return (
      'Path: ssml\r\n' +
      `X-RequestId: ${this.uuid()}\r\n` +
      `X-Timestamp: ${(new Date).toISOString()}\r\n` +
      'Content-Type: application/ssml+xml\r\n\r\n' +
      ssml
    );
  }
  createSSML(text: string, voice: string, rate: string, volume: string, pitch: string) {
    return (
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">' +
      `<voice name="${voice}">` +
      `<prosody pitch="${pitch}" rate="${rate}" volume="${volume}">` +
      escapeXML(text.trim()) +
      '</prosody>' +
      '</voice>' +
      '</speak>'
    );
  }
  calcMaxMesgSize(voice: string, rate: string, volume: string, pitch: string) {
    const headers = this.createSSMLHeaders(this.createSSML('', voice, rate, volume, pitch));
    return EdgeTTSEngine.WEBSOCKET_MAX_SIZE - (headers.length + 50);
  }
  async transform(texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback): Promise<void> {
    await this.connect();
    const {
      voice,
      rate,
      volume,
      signal,
      start,
      maxLineWordCount
    } = options;
    signal.onabort = () => {
      this.wss?.close();
    }
    let _voice = voice || 'Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)';
    let _rate = !isUndefined(rate) ? `${Math.floor(rate * 100)}%` : '0%';
    let _volume = !isUndefined(volume) ? `${Math.floor(volume * 100)}%` : '100%';
    let _start = !isUndefined(start) ? start : 0;
    let _maxLineWordCount = isUndefined(maxLineWordCount) || maxLineWordCount < 100 ? 100 : maxLineWordCount;
    const toBuffer = async (text: string) => {
      if (!/([\u4e00-\u9fa5]|[a-z0-9])+/igm.test(text)) {
        return Buffer.alloc(0);
      }
      const ssml = this.createSSML(text, _voice, _rate, _volume, '0Hz');
      const headers = this.createSSMLHeaders(ssml);
      const body = await this.sendSSMLRequest(headers);
      return body;
    }
    for (let i = _start; i < texts.length; i++) {
      if (signal.aborted) {
        break;
      }
      const text = texts[i];
      const chunks = chunkArray(Array.from(text), _maxLineWordCount);
      for (let j = 0; j < chunks.length; j++) {
        const t = chunks[j].join('');
        const body = await toBuffer(t);
        next({
          blob: new Blob([body], { type: 'audio/mp3' }),
          index: j
        }, i);
      }
    }
    end();
  }
  async getVoiceList(): Promise<Voice[]> {
    const { body } = await this.request.get(`https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${EdgeTTSEngine.TOKEN}`, {
      proxy: this.proxy.value
    }).catch(() => ({ body: '[]' }));
    const voices: Voice[] = JSON.parse(body).map((v: any) => {
      return {
        name: v.FriendlyName,
        value: v.Name
      }
    });
    if (voices.length < 1) {
      return [{
        name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)'
      }, {
        name: 'Microsoft Xiaoyi Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoyiNeural)'
      }, {
        name: 'Microsoft Yunjian Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, YunjianNeural)'
      }, {
        name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, YunxiNeural)'
      }, {
        name: 'Microsoft Yunxia Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, YunxiaNeural)'
      }, {
        name: 'Microsoft Yunyang Online (Natural) - Chinese (Mainland)',
        value: 'Microsoft Server Speech Text to Speech Voice (zh-CN, YunyangNeural)'
      }];
    }
    const mainland: Voice[] = [];
    const arr: Voice[] = [];
    voices.forEach(v => {
      if (v.name.includes('Chinese (Mainland)')) {
        mainland.push(v);
      } else {
        arr.push(v);
      }
    });
    
    return [...mainland, ...arr];;
  }
}