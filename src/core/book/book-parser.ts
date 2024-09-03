import { nanoid } from 'nanoid';
import { BookshelfStoreEntity, TextContentStoreEntity } from '../database/database';
import { Chapter as BookChapter } from './book';
import CoverImage from '../../assets/cover.jpg';
import { isUndefined } from '../is';

export type Chapter = {
  title: string,
  contents: string[]
}

type Options = {
  bookname?: string
  author?: string
  coverImageUrl?: string
  intro?: string
}

export abstract class BookParser {
  public static readonly PID = '8xh5pRkZwIRS9tPKLFnQo';
  public static readonly BASE_URL = 'rhD2t2NbTrEG5_Srb1-Iy';

  public abstract getBookName(): Promise<string>;
  public abstract getAuthor(): Promise<string>;
  public abstract getIntro(): Promise<string>;
  public abstract getCoverImageUrl(): Promise<string | undefined>;
  public abstract getChapterTitleList(): Promise<string[]>;
  public abstract getChapterList(): Promise<Chapter[]>;

  public async toDatabaseEntity(options?: Options): Promise<{ bookshelf: BookshelfStoreEntity, textContents: TextContentStoreEntity[] }> {
    const bookname = isUndefined(options?.bookname) ? await this.getBookName() : options.bookname;
    const author = isUndefined(options?.author) ? await this.getAuthor() : options.author;
    const intro = isUndefined(options?.intro) ? await this.getIntro() : options.intro;
    const coverImageUrl = isUndefined(options?.coverImageUrl) ? await this.getCoverImageUrl() : options.coverImageUrl;
    const chapters = await this.getChapterList();
    const chapterList: BookChapter[] = chapters.map((c, i) => {
      return {
        title: c.title,
        index: i,
        url: nanoid()
      }
    });
    const detailPageUrl = nanoid();
    const bookshelf: BookshelfStoreEntity = {
      id: nanoid(),
      pid: BookParser.PID,
      detailPageUrl,
      pluginVersionCode: 0,
      baseUrl: BookParser.BASE_URL,
      readIndex: -1,
      readScrollTop: 0,
      searchIndex: `${bookname} ${author}`,
      bookname,
      author,
      coverImageUrl: coverImageUrl || CoverImage,
      intro,
      latestChapterTitle: chapterList[chapterList.length - 1]?.title,
      chapterList,
      timestamp: Date.now()
    }
    const textContents: TextContentStoreEntity[] = chapters.map((c, i) => {
      return {
        id: nanoid(),
        pid: BookParser.PID,
        detailUrl: detailPageUrl,
        chapter: chapterList[i],
        textContent: c.contents
      }
    });

    return {
      bookshelf,
      textContents
    }
  }
}