import { BookParser, Chapter } from '../book-parser';
import ParseChapterContentWorker from './worker/parse-chapter-content?worker';
import ParseChapterListWorker from './worker/parse-chapter-list?worker';
import ReadFileWorker from './worker/read-file?worker';
import RegExpExecWorker from './worker/regexp-exec?worker';
import { newError } from '../../utils';
import { decode } from '../../../worker';
import { useSettingsStore } from '../../../store/settings';

export enum TxtParserType {
  BOOK_NAME,
  AUTHOR,
  INTRO,
  CHAPTER_LIST
}

export enum Pattern {
  IGNORE_CASE = 'i',
  MULTI_LINE = 'm',
  GLOBAL = 'g',
}

export type TxtParseRule = {
  id: string
  name: string
  value: string
  example: string
  type: TxtParserType
  flags: Pattern[]
  builtIn?: boolean
}

export type Rule = {
  bookname?: TxtParseRule,
  author?: TxtParseRule,
  intro?: TxtParseRule,
  chapterList?: TxtParseRule
}

export const LINE_SPLIT_RULE = {
  id: 'guIDQ99PelX2-XTHD1eo6',
  name: '内置',
  type: TxtParserType.CHAPTER_LIST,
  value: '按最大行数分割',
  flags: [],
  example: '按最大行数分割',
  builtIn: true
}


export class TxtParser extends BookParser {
  private content: string;
  private raw: Buffer;
  private _encoding: string;
  public rule: Rule;
  constructor(content: string, encoding: string, raw: Buffer, rule: Rule) {
    super();
    this.content = content;
    this._encoding = encoding;
    this.rule = rule;
    this.raw = raw;
  }

  private createRegExp(rule: TxtParseRule) {
    const flags = Array.from((new Set(Array.from(rule.flags.join(''))))).join('');
    return new RegExp(rule.value, flags);
  }
  
  private regExpExec(pattern: RegExp, content: string) {
    return new Promise<RegExpExecArray | null>((reso, reje) => {
      try {
        const worker = new RegExpExecWorker();
        worker.postMessage({
          pattern,
          content
        });
        worker.onmessage = e => {
          const { result, error } = e.data;
          worker.terminate();
          return error ? reje(newError(error)) : reso(result);
        }
        worker.onerror = e => {
          worker.terminate();
          return reje(newError(e.message));
        }
      } catch (e) {
        return reje(e);
      }
    });
  }

  public getBookName() {
    return new Promise<string>(async (reso, reje) => {
      try {
        if (!this.rule.bookname) {
          return reso('');
        }
        const booknameExec = await this.regExpExec(this.createRegExp(this.rule.bookname), this.content);
        return reso((booknameExec ? booknameExec[1] || booknameExec[0] : '').trim());
      } catch (e) {
        return reje(e);
      }
    });
  }
  public getAuthor() {
    return new Promise<string>(async (reso, reje) => {
      try {
        if (!this.rule.author) {
          return reso('');
        }
        const authorExec = await this.regExpExec(this.createRegExp(this.rule.author), this.content);
        return reso((authorExec ? authorExec[1] || authorExec[0] : '').trim());
      } catch (e) {
        return reje(e);
      }
    });
  }
  public getIntro() {
    return new Promise<string>(async (reso, reje) => {
      try {
        if (!this.rule.intro) {
          return reso('');
        }
        const introExec = await this.regExpExec(this.createRegExp(this.rule.intro), this.content);
        return reso((introExec ? introExec[1] || introExec[0] : '').trim());
      } catch (e) {
        return reje(e);
      }
    });
  }
  public getCoverImageUrl(): Promise<string | undefined> {
    return new Promise<string | undefined>((reso, reje) => {
      try {
        return reso(void 0);
      } catch (e) {
        return reje(e);
      }
    });
  }
  public getChapterTitleList(): Promise<string[]> {
    return new Promise<string[]>((reso, reje) => {
      try {
        if (!this.rule.chapterList) {
          return reso([]);
        }
        if (this.rule.chapterList.id === LINE_SPLIT_RULE.id) {
          return reso([LINE_SPLIT_RULE.id]);
        }
        const worker = new ParseChapterListWorker();
        const pattern = this.createRegExp(this.rule.chapterList);
        worker.postMessage({
          pattern,
          content: this.content
        });
        worker.onmessage = e => {
          const { result, error } = e.data;
          worker.terminate();
          return error ? reje(newError(error)) : reso(result);
        }
        worker.onerror = e => {
          worker.terminate();
          return reje(newError(e.message));
        }
      } catch (e) {
        return reje(e);
      }
    });
  }
  public getChapterList() {
    return new Promise<Chapter[]>(async (reso, reje) => {
      try {
        const { txtParse } = useSettingsStore();
        const worker = new ParseChapterContentWorker();
        const chapterList = await this.getChapterTitleList();
        worker.postMessage({
          content: this.content,
          maxLines: txtParse.maxLines,
          chapterTitleList: chapterList
        });
        worker.onmessage = e => {
          const { result, error } = e.data;
          worker.terminate();
          return error ? reje(newError(error)) : reso(result);
        }
        worker.onerror = e => {
          worker.terminate();
          return reje(newError(e.message));
        }
      } catch (e) {
        return reje(e);
      }
    });
  }

  public get encoding(): string {
    return this._encoding;
  }
  public async setEncoding(encoding: string) {
    const { value, encoding: _encoding } = await decode(this.raw, encoding);
    this.content = value;
    this._encoding = _encoding;
  }

  public static load(content: string, encoding: string, rule: Rule, raw?: Buffer) {
    return new TxtParser(content, encoding, raw || Buffer.from(content), rule);
  }
  public static async loadFromBuffer(buffer: Buffer, rule: Rule, encoding?: string) {
    const result = await decode(buffer, encoding);
    return this.load(result.value, result.encoding, rule, buffer);
  }
  public static loadFromFilePath(filepath: string, rule: Rule, encoding?: string) {
    return new Promise<TxtParser>((reso, reje) => {
      const worker = new ReadFileWorker();
      worker.postMessage({
        path: filepath,
        encoding
      });
      worker.onmessage = e => {
        const { error, result, encoding, buffer } = e.data;
        worker.terminate();
        return error ? reje(newError(error)) : reso(this.load(result, encoding, rule, Buffer.from(buffer)));
      }
      worker.onerror = e => {
        worker.terminate();
        return reje(newError(e.message));
      }
      
    });
  }
}
