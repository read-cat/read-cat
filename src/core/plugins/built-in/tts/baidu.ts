import { isNull, isUndefined } from '../../../is';
import { PluginConstructorParams } from '../../defined/plugins';
import { EndCallback, NextCallback, TTSOptions, Voice } from '../../defined/ttsengine';
import { chunkArray } from '../../../utils';

export class BaiduTTSEngine {
  public static readonly ID = 'WzxAqrd1GZ0vTzZQUf3DK';
  public static readonly TYPE = 2;
  public static readonly GROUP = '(内置)TTS';
  public static readonly NAME = 'Baidu TTS Engine';
  public static readonly VERSION = '1.0.0';
  public static readonly VERSION_CODE = 0;
  public static readonly PLUGIN_FILE_URL = '';
  public static readonly REQUIRE = {
    ApiKey: '',
    SecretKey: ''
  };

  private store;
  private request;
  private uuid;
  constructor(options: PluginConstructorParams) {
    const { request, store, uuid } = options;
    this.store = store;
    this.request = request;
    this.uuid = uuid;
  }
  async getToken() {
    try {
      const now = Date.now();
      const { body } = await this.request.post(`https://aip.baidubce.com/oauth/2.0/token?client_id=${BaiduTTSEngine.REQUIRE.ApiKey}&client_secret=${BaiduTTSEngine.REQUIRE.SecretKey}&grant_type=client_credentials`, {
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
        responseType: 'json'
      });
      const { access_token, expires_in } = body;
      await this.store.setStoreValue('token', {
        access_token,
        expires: now + expires_in * 1000
      });
      return access_token;
    } catch (e: any) {
      if (e.responseBody && e.responseBody.error) {
        const { error, error_description } = e.responseBody;
        return Promise.reject(new Error(`${error}, ${error_description}`));
      }
      return Promise.reject(e);
    }
  }
  async transform(texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback): Promise<void> {
    if (!BaiduTTSEngine.REQUIRE.ApiKey.trim()) {
      return Promise.reject(new Error('未配置ApiKey'));
    }
    if (!BaiduTTSEngine.REQUIRE.SecretKey.trim()) {
      return Promise.reject(new Error('未配置SecretKey'));
    }
    const {
      voice,
      signal,
      start,
      maxLineWordCount,
      volume,
    } = options;
    let _start = !isUndefined(start) ? start : 0;
    let _maxLineWordCount = isUndefined(maxLineWordCount) || maxLineWordCount > 60 ? 60 : maxLineWordCount;
    let cuid = await this.store.getStoreValue('cuid');
    if (!cuid) {
      cuid = this.uuid();
      await this.store.setStoreValue('cuid', cuid);
    }
    const token = await this.store.getStoreValue('token');
    let _token = '';
    const toBuffer = async (text: string) => {
      if (!/([\u4e00-\u9fa5]|[a-z0-9])+/igm.test(text)) {
        return Buffer.alloc(0);
      }
      if (isNull(token) || Date.now() >= token.expires) {
        _token = await this.getToken();
      } else {
        _token = token.access_token;
      }
      const { body, headers } = await this.request.post('https://tsn.baidu.com/text2audio', {
        signal,
        responseType: 'arraybuffer',
        params: {
          tok: _token,
          tex: encodeURIComponent(text),
          cuid,
          ctp: '1',
          lan: 'zh',
          per: voice || '3',
          aue: '3',
          vol: !isUndefined(volume) ? volume : 10
        }
      });
      const contentType = headers['content-type'];
      if (!contentType || contentType.includes('application/json')) {
        const { err_no, err_msg } = JSON.parse(body);
        return Promise.reject(new Error(`${err_no}, ${err_msg}`));
      }
      if (!contentType.includes('audio/mp3')) {
        return Promise.reject(new Error(`Unsupported audio types: ${contentType}`));
      }
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
    return [{
      name: '度小宇(基础音库)',
      value: '1'
    }, {
      name: '度小美(基础音库)',
      value: '0'
    }, {
      name: '度逍遥(基础音库)',
      value: '3'
    }, {
      name: '度丫丫(基础音库)',
      value: '4'
    }, {
      name: '度逍遥(精品音库)',
      value: '5003'
    }, {
      name: '度小鹿(精品音库)',
      value: '5118'
    }, {
      name: '度博文(精品音库)',
      value: '106'
    }, {
      name: '度小童(精品音库)',
      value: '110'
    }, {
      name: '度小萌(精品音库)',
      value: '111'
    }, {
      name: '度米朵(精品音库)',
      value: '103'
    }, {
      name: '度小娇(精品音库)',
      value: '5'
    }];
  }
}