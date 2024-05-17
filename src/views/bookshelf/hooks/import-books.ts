import { storeToRefs } from 'pinia';
import { TxtParser, TxtParserType, Rule } from '../../../core/book/txt-parser';
import { useTxtParseRuleStore } from '../../../store/txt-parse-rules';
import { useBookshelfStore } from '../../../store/bookshelf';
import { reactive, ref } from 'vue';
import { WindowEvent } from '../../../components/window/index.vue';
import { useMessage } from '../../../hooks/message';
import { BookParser } from '../../../core/book/book-parser';
import { nanoid } from 'nanoid';
import CoverImage from '../../../assets/cover.jpg';
import { newError } from '../../../core/utils';

export type Book = {
  id: string
  filename: string
  importing: boolean
  status: {
    type: 'pending' | 'fulfilled' | 'rejected',
    msg?: string
  }
  type: 'txt' | 'epub'
  bookname: string
  author: string
  coverImageUrl: string
  intro: string
  chapterTitleList: string[]
  chapterLength: number
  parser: BookParser
  encoding: string
}

export const useImportBooks = () => {
  const message = useMessage();
  const { rules: txtRules } = storeToRefs(useTxtParseRuleStore());
  const { put, remove } = useBookshelfStore();
  const importBooksWindow = ref<WindowEvent>();
  const isLoading = ref(false);
  const books = ref<Book[]>([]);
  const currentPage = ref<number>(1);
  const modelRule = reactive({
    bookname: '',
    author: '',
    intro: '',
    chapterList: ''
  });

  const currentChange = (page: number) => {
    currentPage.value = page;
    const book = books.value[page - 1];
    if (book.type !== 'txt') {
      return;
    }
    const parser = <TxtParser>book.parser;
    modelRule.bookname = parser.rule.bookname?.id || '';
    modelRule.author = parser.rule.author?.id || '';
    modelRule.intro = parser.rule.intro?.id || '';
    modelRule.chapterList = parser.rule.chapterList?.id || '';
  }

  const ruleChange = async (type: keyof Rule) => {
    const book = books.value[currentPage.value - 1];
    if (book.type !== 'txt') {
      return;
    }
    try {
      isLoading.value = true;
      const parser = (<TxtParser>book.parser);
      parser.rule[type] = txtRules.value.find(r => r.id === modelRule[type]);
      switch (type) {
        case 'bookname':
          book.bookname = await parser.getBookName();
          break;
        case 'author':
          book.author = await parser.getAuthor();
          break;
        case 'intro':
          book.intro = await parser.getIntro();
          break;
        case 'chapterList':
          const chapterTitleList = await book.parser.getChapterTitleList();
          book.chapterTitleList = chapterTitleList.length > 6 ?
            [...chapterTitleList.slice(0, 3), '···', ...chapterTitleList.slice(-3)] :
            chapterTitleList;
          book.chapterLength = chapterTitleList.length;
          break;

        default:
          break;
      }
    } catch (e: any) {
      message.error(e.message);
      GLOBAL_LOG.error('import book update rule', e);
    } finally {
      isLoading.value = false;
    }
  }
  const encodingChange = async () => {
    const book = books.value[currentPage.value - 1];
    if (book.type !== 'txt' || !book.encoding) {
      return;
    }
    try {
      isLoading.value = true;
      const parser = <TxtParser>book.parser;
      await parser.setEncoding(book.encoding);
      book.bookname = await parser.getBookName();
      book.author = await parser.getAuthor();
      book.intro = await parser.getIntro();
      const chapterTitleList = await book.parser.getChapterTitleList();
      book.chapterTitleList = chapterTitleList.length > 6 ?
        [...chapterTitleList.slice(0, 3), '···', ...chapterTitleList.slice(-3)] :
        chapterTitleList;
      book.chapterLength = chapterTitleList.length;
    } catch (e: any) {
      message.error(e.message);
      GLOBAL_LOG.error('import book file:', book.filename, 'setEncoding', book.encoding, e);
    } finally {
      isLoading.value = false;
    }
  }

  const handlerTxtBook = (name: string, path?: string, buffer?: Buffer) => {
    const rules = {
      bookname: txtRules.value.filter(r => r.type === TxtParserType.BOOK_NAME)[0],
      author: txtRules.value.filter(r => r.type === TxtParserType.AUTHOR)[0],
      intro: txtRules.value.filter(r => r.type === TxtParserType.INTRO)[0],
      chapterList: txtRules.value.filter(r => r.type === TxtParserType.CHAPTER_LIST)[0]
    };
    modelRule.bookname = rules.bookname?.id || '';
    modelRule.author = rules.author?.id || '';
    modelRule.intro = rules.intro?.id || '';
    modelRule.chapterList = rules.chapterList?.id || '';
    return new Promise<Book>(async (reso, _) => {
      try {
        let parser;
        if (path) {
          parser = await TxtParser.loadFromFilePath(path, rules);
        } else if (buffer) {
          parser = await TxtParser.loadFromBuffer(buffer, rules);
        } else {
          throw newError('path and content is empty');
        }
        const bookname = await parser.getBookName().catch(e => {
          GLOBAL_LOG.error('import book, file:', name, 'parse bookname error', e);
          return Promise.resolve('');
        });
        const author = await parser.getAuthor().catch(e => {
          GLOBAL_LOG.error('import book, file:', name, 'parse author error', e);
          return Promise.resolve('');
        });
        const coverImageUrl = await parser.getCoverImageUrl().then(cover => cover || CoverImage).catch(e => {
          GLOBAL_LOG.error('import book, file:', name, 'parse coverImageUrl error', e);
          return Promise.resolve(CoverImage);
        });
        const intro = await parser.getIntro().catch(e => {
          GLOBAL_LOG.error('import book, file:', name, 'parse intro error', e);
          return Promise.resolve('');
        });
        const chapterTitleList = await parser.getChapterTitleList().catch(e => {
          GLOBAL_LOG.error('import book, file:', name, 'parse chapterList error', e);
          return Promise.resolve(<string[]>[]);
        });
        return reso({
          id: nanoid(),
          filename: name,
          importing: false,
          status: {
            type: 'pending'
          },
          type: 'txt',
          bookname,
          author,
          coverImageUrl,
          intro,
          chapterLength: chapterTitleList.length,
          chapterTitleList: chapterTitleList.length > 6 ? [...chapterTitleList.slice(0, 3), '···', ...chapterTitleList.slice(-3)] : chapterTitleList,
          parser,
          encoding: parser.encoding || ''
        });
      } catch (e: any) {
        GLOBAL_LOG.error('import book, file:', name, 'parse error', e);
        return reso({
          id: nanoid(),
          filename: name,
          importing: false,
          status: {
            type: 'rejected',
            msg: e.message
          },
          bookname: '',
          author: '',
          coverImageUrl: '',
          intro: '',
          chapterLength: 0,
          chapterTitleList: [] as string[],
          type: 'txt',
          parser: void 0 as any,
          encoding: ''
        });
      }
    });
  }

  const fileDragChange = async (files: File[]) => {
    const bookfiles = files.filter(({ name }) => {
      return name.endsWith('.txt') || name.endsWith('.text');
    });
    if (bookfiles.length < 1) {
      message.warning('找不到书籍文件');
      return;
    }
    try {
      isLoading.value = true;
      currentPage.value = 1;
      importBooksWindow.value?.show();
      const tempBooks: Book[] = [];
      for (const { name, path } of bookfiles) {
        if (name.endsWith('.txt') || name.endsWith('.text')) {
          const book = await handlerTxtBook(name, path);
          tempBooks.push(book);
        }
      }
      books.value = tempBooks;
    } catch (e: any) {
      message.error(e.message);
      GLOBAL_LOG.error('import books', e);
    } finally {
      books.value.length < 1 && importBooksWindow.value?.hide();
      isLoading.value = false;
    }
  }

  const openBookFile = () => {
    showOpenFilePicker({
      multiple: true,
      types: [{
        accept: {
          'text/plain': ['.txt'],
          // 'application/epub+zip': ['.epub']
        },
        description: '电子书籍'
      }],
      excludeAcceptAllOption: true
    }).catch(e => {
      message.warning(e.message);
      return null;
    }).then(async handles => {
      if (!handles) {
        return;
      }
      const files = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        if (file.name.endsWith('.txt') || file.name.endsWith('.text')) {
          files.push(file);
        }
      }
      if (files.length < 1) {
        message.warning('找不到书籍文件');
        return;
      }
      isLoading.value = true;
      currentPage.value = 1;
      importBooksWindow.value?.show();
      const tempBooks: Book[] = [];
      for (const file of files) {
        const { name } = file;
        if (name.endsWith('.txt') || name.endsWith('.text')) {
          const book = await handlerTxtBook(name, void 0, Buffer.from(await file.arrayBuffer()));
          tempBooks.push(book);
        }
      }
      books.value = tempBooks;
    }).catch(e => {
      message.error(e.message);
      GLOBAL_LOG.error('import book open file', e);
    }).finally(() => {
      isLoading.value = false;
    });
  }

  const importBook = async () => {
    const index = currentPage.value - 1;
    const book = books.value[index];
    try {
      book.importing = true;
      const { bookname, author, intro, coverImageUrl } = book;
      if (!bookname) {
        message.warning('请输入书名');
        return;
      }
      if (!author) {
        message.warning('请输入作者');
        return;
      }
      const { bookshelf, textContents } = await book.parser.toDatabaseEntity({
        bookname,
        author,
        intro,
        coverImageUrl
      });
      const ps = [];
      for (const textContent of textContents) {
        ps.push(GLOBAL_DB.store.textContentStore.put(textContent));
      }
      for (const item of await Promise.allSettled(ps)) {
        if (item.status === 'rejected') {
          await remove(bookshelf.id);
          await GLOBAL_DB.store.textContentStore.removeByPidAndDetailUrl(bookshelf.pid, bookshelf.detailPageUrl);
          throw item.reason;
        }
      }
      await put(bookshelf).catch(e => {
        GLOBAL_DB.store.textContentStore.removeByPidAndDetailUrl(bookshelf.pid, bookshelf.detailPageUrl);
        return Promise.reject(e);
      });
      book.status.type = 'fulfilled';
    } catch (e: any) {
      book.status = {
        type: 'rejected',
        msg: e.message
      };
    } finally {
      book.importing = false;
    }
  }
  const closeImportBookWindow = () => {
    for (const { importing } of books.value) {
      if (importing) {
        message.warning('正在执行本地书籍导入任务');
        return;
      }
    }
    setTimeout(() => books.value = [], 1000);
    importBooksWindow.value?.hide();
  }
  const removeImportBook = () => {
    removeImportBookByIndex(currentPage.value - 1);
  }
  const removeImportBookByIndex = (index: number, closeWindow = true) => {
    if (books.value.length <= 1 && closeWindow) {
      closeImportBookWindow();
      return;
    }
    const page = index + 1;
    books.value.splice(page - 1, 1);
    currentPage.value = page > books.value.length ? 1 : page;
  }

  return {
    fileDragChange,
    importBooksWindow,
    isLoading,
    books,
    currentPage,
    currentChange,
    importBook,
    modelRule,
    ruleChange,
    closeImportBookWindow,
    removeImportBook,
    openBookFile,
    encodingChange,
  }
}