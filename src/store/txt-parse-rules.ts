import { defineStore } from 'pinia';
import { Pattern, TxtParseRule, TxtParserType } from '../core/book/txt-parser';
import { cloneByJSON, errorHandler, newError, replaceInvisibleStr } from '../core/utils';
import { TxtParseRuleEntity } from '../core/database/database';

const DEFAULT_RULES: TxtParseRule[] = [{
  id: 'AE6kzxxofv-4UnqBxvSV2',
  name: '内置',
  type: TxtParserType.CHAPTER_LIST,
  value: '(?<=[　\\s])(?:序章|楔子|正文(?!完|结)|终章|后记|尾声|番外|第\\s{0,4}[\\d〇零一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+?\\s{0,4}(?:章|节(?!课)|卷|集(?![合和]))).{0,30}$',
  flags: [Pattern.IGNORE_CASE, Pattern.MULTI_LINE, Pattern.GLOBAL],
  example: '第一章 标题',
  builtIn: true
}, {
  id: 'SfwXQ2qb6TVPKo4G6ug4v',
  name: '内置',
  type: TxtParserType.CHAPTER_LIST,
  value: '(?<=\\={3,6}).{1,40}?(?=\\=)',
  flags: [Pattern.IGNORE_CASE, Pattern.MULTI_LINE, Pattern.GLOBAL],
  example: '===第一章 标题===',
  builtIn: true
}, {
  id: 'jFPrS9h-CYX1u1Y2aYM1M',
  name: '内置',
  type: TxtParserType.BOOK_NAME,
  flags: [Pattern.IGNORE_CASE, Pattern.MULTI_LINE, Pattern.GLOBAL],
  value: '《(.+)》',
  example: '《书名》',
  builtIn: true
}, {
  id: 'B2gh-91PQEPA9PtNbD-2W',
  name: '内置',
  type: TxtParserType.AUTHOR,
  flags: [],
  value: '作者：(.{1,})',
  example: '作者：XXX',
  builtIn: true
}, {
  id: 'BdmBCcSTGulJDbnrHefFA',
  name: '内置',
  type: TxtParserType.BOOK_NAME,
  flags: [],
  value: '书名：(.{1,})',
  example: '书名：XXX',
  builtIn: true
}, {
  id: 'Jw_0yEay4TXIePHog5H-R',
  name: '内置',
  type: TxtParserType.BOOK_NAME,
  flags: [],
  value: '(.+)\r?\n作者：.+',
  example: '书名\\r\\n作者：XXX',
  builtIn: true
}, {
  id: 'uWAO_Q9QN8wj-yFqknTiW',
  name: '内置',
  type: TxtParserType.BOOK_NAME,
  flags: [],
  value: '(.+)作者：.+',
  example: '书名 作者：XXX',
  builtIn: true
}];

export const useTxtParseRuleStore = defineStore('TxtParseRule', {
  state: () => {
    return {
      _rules: [] as TxtParseRule[]
    }
  },
  getters: {
    rules(): TxtParseRule[] {
      return [...DEFAULT_RULES, ...this._rules];
    }
  },
  actions: {
    async remove(id: string): Promise<void> {
      try {
        const i = this._rules.findIndex(v => v.id === id);
        if (i >= 0) {
          await GLOBAL_DB.store.txtParseRuleStore.remove(id);
          this._rules.splice(i, 1);
        }
      } catch (e: any) {
        return errorHandler(e);
      }
    },
    async put(entity: TxtParseRuleEntity) {
      const _entity = cloneByJSON(replaceInvisibleStr(entity));
      if (!entity.id.trim()) {
        throw newError('ID为空');
      }
      if (!entity.name.trim()) {
        throw newError('名称为空');
      }
      if (!entity.example.trim()) {
        throw newError('示例为空');
      }
      //校验正则
      new RegExp(entity.value);
      await GLOBAL_DB.store.txtParseRuleStore.put(_entity, false);
      const i = this._rules.findIndex(v => v.id === _entity.id);
        if (i >= 0) {
          this._rules[i] = _entity;
        } else {
          this._rules.push(_entity);
        }
    },
  }
});