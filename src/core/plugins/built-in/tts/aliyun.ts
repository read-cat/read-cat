import { isNull, isUndefined } from '../../../is';
import { PluginConstructorParams } from '../../defined/plugins';
import { EndCallback, NextCallback, TTSOptions, Voice } from '../../defined/ttsengine';
import { chunkArray } from '../../../utils';
import { createHmac } from 'crypto';

export class AliyunTTSEngine {
  public static readonly ID = 'JCc1MhA1-9pd_VJC2y6BB';
  public static readonly TYPE = 2;
  public static readonly GROUP = '(内置)TTS';
  public static readonly NAME = 'Aliyun TTS Engine';
  public static readonly VERSION = '1.0.0';
  public static readonly VERSION_CODE = 0;
  public static readonly PLUGIN_FILE_URL = '';
  public static readonly REQUIRE = {
    AccessKeyId: '',
    AccessKeySecret: '',
    AppKey: '',
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
  percentEncode(val: string) {
    return encodeURIComponent(val).replace('+', '%20').replace('*', '%2A').replace('%7E', '~');
  }
  queryString() {
    const obj: Record<string, string> = {
      AccessKeyId: AliyunTTSEngine.REQUIRE.AccessKeyId,
      Action: 'CreateToken',
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: this.uuid(false),
      SignatureVersion: '1.0',
      Timestamp: (new Date).toISOString(),
      Version: '2019-02-28',
    }
    return Object.keys(obj).map(key => `${key}=${this.percentEncode(obj[key])}`).join('&');
  }
  stringToSign(queryString: string) {
    return `GET&%2F&${this.percentEncode(queryString)}`;
  }
  signature(queryString: string) {
    const stringToSign = this.stringToSign(queryString);
    return createHmac('sha1', AliyunTTSEngine.REQUIRE.AccessKeySecret + '&').update(stringToSign).digest('base64');
  }
  async getToken() {
    try {
      const queryString = this.queryString();
      const signature = this.percentEncode(this.signature(queryString));
      const { body } = await this.request.get(`http://nls-meta.cn-shanghai.aliyuncs.com/?Signature=${signature}&${queryString}`, {
        responseType: 'json'
      });
      const { Id, ExpireTime } = body.Token;
      await this.store.setStoreValue('token', {
        id: Id,
        expireTime: ExpireTime
      });
      return Id;
    } catch (e: any) {
      if (e.responseBody && e.responseBody.Message) {
        const { Message, Code } = e.responseBody;
        return Promise.reject(new Error(`${Code}, ${Message}`));
      }
      return Promise.reject(e);
    }
  }
  async transform(texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback): Promise<void> {
    if (!AliyunTTSEngine.REQUIRE.AccessKeyId.trim()) {
      return Promise.reject(new Error('未配置AccessKeyId'));
    }
    if (!AliyunTTSEngine.REQUIRE.AccessKeySecret.trim()) {
      return Promise.reject(new Error('未配置AccessKeySecret'));
    }
    if (!AliyunTTSEngine.REQUIRE.AppKey.trim()) {
      return Promise.reject(new Error('未配置AppKey'));
    }
    const {
      voice,
      signal,
      start,
      maxLineWordCount
    } = options;
    let _start = !isUndefined(start) ? start : 0;
    let _maxLineWordCount = isUndefined(maxLineWordCount) || maxLineWordCount < 100 || maxLineWordCount > 300 ? 300 : maxLineWordCount;
    const token = await this.store.getStoreValue('token');
    let _token = '';
    const toBuffer = async (text: string) => {
      if (!/([\u4e00-\u9fa5]|[a-z0-9])+/igm.test(text)) {
        return Buffer.alloc(0);
      }
      if (isNull(token) || Math.ceil(Date.now() / 1000) >= token.expireTime) {
        _token = await this.getToken();
      } else {
        _token = token.id;
      }
      const { body, headers } = await this.request.post('https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts', {
        signal,
        responseType: 'arraybuffer',
        headers: {
          'content-type': 'application/json',
          'X-NLS-Token': _token,
        },
        params: {
          appkey: AliyunTTSEngine.REQUIRE.AppKey,
          text,
          token: _token,
          format: 'mp3',
          voice: voice || 'abin'
        }
      }).catch(e => {
        if (!e.responseBody) {
          return Promise.reject(e);
        }
        const { status, message } = JSON.parse((<Buffer>e.responseBody).toString('utf-8'));
        return Promise.reject(new Error(`${status}, ${message}`));
      });
      const contentType = headers['content-type'];
      if (!contentType || !contentType.includes('audio/mpeg')) {
        const res = JSON.parse(body);
        return Promise.reject(new Error(res.message));
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
      name: '阿斌(中文及中英文混合)',
      value: 'abin'
    }, {
      name: '知小白(中文及中英文混合)',
      value: 'zhixiaobai'
    }, {
      name: '知小夏(中文及中英文混合)',
      value: 'zhixiaoxia'
    }, {
      name: '知小妹(中文及中英文混合)',
      value: 'zhixiaomei'
    }, {
      name: '知柜(中文及中英文混合)',
      value: 'zhigui'
    }, {
      name: '知硕(中文及中英文混合)',
      value: 'zhishuo'
    }, {
      name: '艾夏(中文及中英文混合)',
      value: 'aixia'
    }, {
      name: '知猫(中文)',
      value: 'zhimao'
    }, {
      name: '知媛(中文)',
      value: 'zhiyuan'
    }, {
      name: '知雅(中文)',
      value: 'zhiya'
    }, {
      name: '知悦(中文)',
      value: 'zhiyue'
    }, {
      name: '知达(中文)',
      value: 'zhida'
    }, {
      name: '知莎(中文)',
      value: 'zhistella'
    }, {
      name: '知锋_多情感(中文及中英文混合)',
      value: 'zhifeng_emo'
    }, {
      name: '知冰_多情感(中文及中英文混合)',
      value: 'zhibing_emo'
    }, {
      name: '知妙_多情感(中文及英文)',
      value: 'zhimiao_emo'
    }, {
      name: '知米_多情感(中文及中英文混合)',
      value: 'zhimi_emo'
    }, {
      name: '知燕_多情感(中文及中英文混合)',
      value: 'zhiyan_emo'
    }, {
      name: '知贝_多情感(中文及中英文混合)',
      value: 'zhibei_emo'
    }, {
      name: '知甜_多情感(中文及中英文混合)',
      value: 'zhitian_emo'
    }, {
      name: '小云(中文及中英文混合)',
      value: 'xiaoyun'
    }, {
      name: '小刚(中文及中英文混合)',
      value: 'xiaogang'
    }, {
      name: '若兮(中文及中英文混合)',
      value: 'ruoxi'
    }, {
      name: '思琪(中文及中英文混合)',
      value: 'siqi'
    }, {
      name: '思佳(中文及中英文混合)',
      value: 'sijia'
    }, {
      name: '思诚(中文及中英文混合)',
      value: 'sicheng'
    }, {
      name: '艾琪(中文及中英文混合)',
      value: 'aiqi'
    }, {
      name: '艾佳(中文及中英文混合)',
      value: 'aijia'
    }, {
      name: '艾诚(中文及中英文混合)',
      value: 'aicheng'
    }, {
      name: '艾达(中文及中英文混合)',
      value: 'aida'
    }, {
      name: '宁儿(纯中文)',
      value: 'ninger'
    }, {
      name: '瑞琳(纯中文)',
      value: 'ruilin'
    }, {
      name: '思悦(中文及中英文混合)',
      value: 'siyue'
    }, {
      name: '艾雅(中文及中英文混合)',
      value: 'aiya'
    }, {
      name: '艾美(中文及中英文混合)',
      value: 'aimei'
    }, {
      name: '艾雨(中文及中英文混合)',
      value: 'aiyu'
    }, {
      name: '艾悦(中文及中英文混合)',
      value: 'aiyue'
    }, {
      name: '艾婧(中文及中英文混合)',
      value: 'aijing'
    }, {
      name: '小美(中文及中英文混合)',
      value: 'xiaomei'
    }, {
      name: '艾娜(纯中文)',
      value: 'aina'
    }, {
      name: '伊娜(纯中文)',
      value: 'yina'
    }, {
      name: '思婧(纯中文)',
      value: 'sijing'
    }, {
      name: '思彤(纯中文)',
      value: 'sitong'
    }, {
      name: '小北(纯中文)',
      value: 'xiaobei'
    }, {
      name: '艾彤(纯中文)',
      value: 'aitong'
    }, {
      name: '艾薇(纯中文)',
      value: 'aiwei'
    }, {
      name: '艾宝(纯中文)',
      value: 'aibao'
    }, {
      name: '姗姗(粤文（简体）及粤英文混合)',
      value: 'shanshan'
    }, {
      name: '小玥(中文及中英文混合)',
      value: 'chuangirl'
    }, {
      name: 'Lydia(英文及英中文混合)',
      value: 'lydia'
    }, {
      name: '艾硕(中文及中英文混合)',
      value: 'aishuo'
    }, {
      name: '青青(中文)',
      value: 'qingqing'
    }, {
      name: '翠姐(中文)',
      value: 'cuijie'
    }, {
      name: '小泽(中文)',
      value: 'xiaoze'
    }, {
      name: '马树(中文及中英文混合)',
      value: 'mashu'
    }, {
      name: '小仙(中文及中英文混合)',
      value: 'xiaoxian'
    }, {
      name: '悦儿(纯中文)',
      value: 'yuer'
    }, {
      name: '猫小美(中文及中英文混合)',
      value: 'maoxiaomei'
    }, {
      name: '艾飞(中文及中英文混合)',
      value: 'aifei'
    }, {
      name: '亚群(中文及中英文混合)',
      value: 'yaqun'
    }, {
      name: '巧薇(中文及中英文混合)',
      value: 'qiaowei'
    }, {
      name: '大虎(中文及中英文混合)',
      value: 'dahu'
    }, {
      name: '佳佳(粤文（简体）及粤英文混合)',
      value: 'jiajia'
    }, {
      name: '桃子(粤文（简体）及粤英文混合)',
      value: 'taozi'
    }, {
      name: '柜姐(中文及中英文混合)',
      value: 'guijie'
    }, {
      name: '艾伦(中文及中英文混合)',
      value: 'ailun'
    }, {
      name: '杰力豆(纯中文)',
      value: 'jielidou'
    }, {
      name: '老铁(纯中文)',
      value: 'laotie'
    }, {
      name: '老妹(纯中文)',
      value: 'laomei'
    }, {
      name: '艾侃(纯中文)',
      value: 'aikan'
    }, {
      name: 'Stella(中文及中英文混合)',
      value: 'stella'
    }, {
      name: 'Stanley(中文及中英文混合)',
      value: 'stanley'
    }, {
      name: 'Kenny(中文及中英文混合)',
      value: 'kenny'
    }, {
      name: 'Rosa(中文及中英文混合)',
      value: 'rosa'
    }, {
      name: 'Kelly(香港粤语)',
      value: 'kelly'
    }, {
      name: '智香(日文)',
      value: 'tomoka'
    }, {
      name: '智也(日文)',
      value: 'tomoya'
    }, {
      name: 'Annie(英文)',
      value: 'annie'
    }, {
      name: 'Indah(纯印尼语)',
      value: 'indah'
    }, {
      name: 'Cally(纯英文)',
      value: 'cally'
    }, {
      name: 'Harry(英文)',
      value: 'harry'
    }, {
      name: 'Abby(英文)',
      value: 'abby'
    }, {
      name: 'Andy(英文)',
      value: 'andy'
    }, {
      name: 'Eric(英文)',
      value: 'eric'
    }, {
      name: 'Emily(英文)',
      value: 'emily'
    }, {
      name: 'Luna(英文)',
      value: 'luna'
    }, {
      name: 'Luca(英文)',
      value: 'luca'
    }, {
      name: 'Wendy(英文)',
      value: 'wendy'
    }, {
      name: 'William(英文)',
      value: 'william'
    }, {
      name: 'Olivia(英文)',
      value: 'olivia'
    }, {
      name: 'Farah(纯马来语)',
      value: 'farah'
    }, {
      name: 'ava(纯英文)',
      value: 'ava'
    }, {
      name: 'Tala(菲律宾语)',
      value: 'tala'
    }, {
      name: 'Tien(越南语)',
      value: 'tien'
    }, {
      name: 'Becca(纯英语)',
      value: 'becca'
    }, {
      name: 'Kyong(韩语)',
      value: 'Kyong'
    }, {
      name: 'masha(俄语)',
      value: 'masha'
    }, {
      name: 'camila(西班牙语)',
      value: 'camila'
    }, {
      name: 'perla(意大利语)',
      value: 'perla'
    }, {
      name: 'clara(法语)',
      value: 'clara'
    }, {
      name: 'hanna(德语)',
      value: 'hanna'
    }, {
      name: 'waan(泰语)',
      value: 'waan'
    }, {
      name: 'betty(美式英文)',
      value: 'betty'
    }, {
      name: 'beth(美式英文)',
      value: 'beth'
    }, {
      name: 'cindy(美式英文)',
      value: 'cindy'
    }, {
      name: 'donna(美式英文)',
      value: 'donna'
    }, {
      name: 'eva(美式英文)',
      value: 'eva'
    }, {
      name: 'brian(美式英文)',
      value: 'brian'
    }];
  }
}