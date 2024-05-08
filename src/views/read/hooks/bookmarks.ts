import { storeToRefs } from 'pinia';
import { isNull, isUndefined } from '../../../core/is';
import { useMessage } from '../../../hooks/message';
import { useTextContentStore } from '../../../store/text-content';
import { h, markRaw, ref, VNode, watch } from 'vue';
import { useBookmarkStore } from '../../../store/bookmark';
import { nanoid } from 'nanoid';
import { ElInput, ElMessageBox, ElNotification } from 'element-plus';
import IconBookmark from '../../../assets/svg/icon-bookmark.svg?component';
import { useDetailStore } from '../../../store/detail';
import { BookmarkStoreEntity } from '../../../core/database/database';
import { format } from '../../../core/utils/date';
import { errorHandler } from '../../../core/utils';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useSettingsStore } from '../../../store/settings';

export const useBookmarks = () => {
  const message = useMessage();
  const { options } = useSettingsStore();
  const { currentChapter, textContent } = storeToRefs(useTextContentStore());
  const { getBookmarkByChapterUrl, put, getBookmarkById } = useBookmarkStore();
  const { _bookmarks } = storeToRefs(useBookmarkStore());
  const { currentDetailUrl, currentPid } = storeToRefs(useDetailStore());
  const { exist } = useBookshelfStore();
  const contents = ref<string>('');


  if (!Object.hasOwn(window, 'showBookmark')) {
    Object.defineProperty(window, 'showBookmark', {
      get() {
        return (bid: string, rid: string) => {
          const bookmark = getBookmarkById(bid);
          const val = bookmark?.range.find(r => r.id === rid);
          if (isUndefined(bookmark) || isUndefined(val)) {
            message.error('无法获取书签');
            return;
          }
          const date = format(val.timestamp, 'yyyy/MM/dd HH:mm');
          ElNotification({
            icon: markRaw(IconBookmark),
            title: bookmark.chapterTitle,
            message: h('div', {
              class: `rc-scrollbar ${options.enableTransition ? 'rc-scrollbar-behavior' : ''}`,
              style: {
                maxHeight: '400px'
              },
              onVnodeMounted(vnode) {
                const e: HTMLElement | null = vnode.el?.parentElement;
                const sibling = e?.previousElementSibling as HTMLElement;
                const e1: HTMLElement | null | undefined = e?.parentElement;
                const e2: HTMLElement | null | undefined = e1?.parentElement;
                sibling && (sibling.style.maxWidth = '245px');
                sibling && (sibling.style.fontSize = '15px');
                e1 && (e1.style.width = '100%');
                e2 && (e2.style.paddingRight = '0');
              },
            }, [
              h('h4', {
                style: {
                  userSelect: 'text',
                  cursor: 'default',
                }
              }, val.title),
              h('p', {
                style: {
                  marginRight: '10px',
                  fontSize: '12px',
                  userSelect: 'text',
                  cursor: 'default',
                  textAlign: 'right',
                }
              }, date),
              h('div', null, (() => {
                const vnodes: VNode[] = [];
                val.content.replaceAll('\r', '').split('\n').forEach(v => {
                  vnodes.push(h('p', {
                    style: {
                      fontSize: '13px',
                      userSelect: 'text',
                      cursor: 'default'
                    }
                  }, v));
                });
                return vnodes;
              })())
            ]),
            offset: 30
          });
        }
      },
      set() {
        return;
      },
    });
  }

  const setBookmark = async () => {
    if (isNull(currentDetailUrl.value)) {
      message.error('无法获取详情页链接');
      return;
    }
    if (isNull(currentChapter.value)) {
      message.error('无法获取当前章节');
      return;
    }
    if (isNull(currentPid.value)) {
      message.error('无法获取插件ID');
      return;
    }
    if (!exist(currentPid.value, currentDetailUrl.value)) {
      message.warning('未加入书架');
      return;
    }
    const selection = getSelection();
    if (isNull(selection)) {
      message.error('selection is null');
      return;
    }
    if (selection.type !== 'Range') {
      message.warning('未选中文字');
      return;
    }
    const range = selection.getRangeAt(0);
    const { startContainer, endContainer } = range;
    if (isNull(startContainer.parentElement) || isNull(endContainer.parentElement)) {
      message.error('段落获取失败');
      return;
    }
    if (
      startContainer.parentElement.classList.contains('bookmark') ||
      endContainer.parentElement.classList.contains('bookmark') ||
      startContainer !== endContainer
    ) {
      message.warning('无法跨段设置书签或选中文本已有书签');
      return;
    }
    const { startOffset, endOffset } = range;
    const { index } = startContainer.parentElement.dataset;
    if (isUndefined(index)) {
      message.error('无法获取段落索引');
      return;
    }
    let offset = 0;
    let prev = startContainer.previousSibling;
    while (prev) {
      const text = prev.textContent;
      if (text) {
        offset += text.length;
      }
      prev = prev.previousSibling;
    }
    const content = String(range.cloneContents().textContent);
    try {
      const input = ref('');
      await ElMessageBox({
        icon: markRaw(IconBookmark),
        title: '书签',
        message: () => h('div', null, [
          h('div', null, [
            h('h4', null, currentChapter.value?.title),
            h('p', null, content)
          ]),
          h(ElInput, {
            type: 'textarea',
            'onUpdate:modelValue': value => input.value = value,
            onVnodeMounted(vnode) {
              const e = <HTMLElement>vnode.el;
              e.firstElementChild?.classList.add('rc-scrollbar');
              (<HTMLElement>e.firstElementChild).style.maxHeight = '300px';
              (<HTMLElement>e.parentElement?.parentElement).style.width = '100%';
              (<HTMLElement>e.parentElement?.parentElement?.parentElement).style.alignItems = 'flex-start';
            },
            modelValue: input.value,
            placeholder: '请输入书签内容',
            autosize: true,
          }),
        ]),
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        showCancelButton: true
      });
      if (!input.value.trim()) {
        message.error('无法设置书签, 书签内容为空');
        return;
      }
      let bookmark = getBookmarkByChapterUrl(currentChapter.value.url);
      if (isUndefined(bookmark)) {
        bookmark = {
          id: `bookmark-${nanoid(12)}`,
          detailUrl: currentDetailUrl.value,
          chapterTitle: currentChapter.value.title,
          chapterUrl: currentChapter.value.url,
          range: [],
          timestamp: Date.now(),
        }
      }
      bookmark.range.push({
        id: `bookmark-range-${nanoid(12)}`,
        start: startOffset + offset,
        end: endOffset + offset,
        index: Number(index),
        content: input.value.trim(),
        title: content,
        timestamp: Date.now()
      });
      await put(bookmark);
    } catch (e) {
      if (e === 'cancel') {
        return;
      }
      message.error(`书签设置失败, ${errorHandler(e, true)}`);
      GLOBAL_LOG.error('setBookmark', e);
    }
  }

  const addTag = (text: string, index: number) => {
    return `<div data-index="${index}">${text}</div>`;
  }

  const handlerBookmarks = (text: string, index: number, bookmark?: BookmarkStoreEntity) => {
    if (isNull(currentChapter.value)) {
      return addTag(text, index);
    }
    isUndefined(bookmark) && (bookmark = getBookmarkByChapterUrl(currentChapter.value.url));
    if (isUndefined(bookmark)) {
      return addTag(text, index);
    }
    const ranges = bookmark.range.filter(v => v.index === index);
    if (ranges.length <= 0) {
      return addTag(text, index);
    }
    const arr: string[] = [];
    const sort = ranges.sort((a, b) => a.start - b.start);
    // 处理段落内多个书签
    const handler = (from: number, index: number) => {
      if (index >= sort.length) {
        const substr = text.slice(from);
        (substr.length > 0) && arr.push(substr);
      } else {
        const { start, end, id } = sort[index];
        const substr = text.slice(from, start);
        (substr.length > 0) && arr.push(substr);
        arr.push(`<span id="${id}" class="bookmark${(index + 1) % 2 === 0 ? ' even' : ''}" ondblclick="showBookmark('${bookmark.id}','${id}')">${text.slice(start, end)}</span>`);
        handler(end, index + 1);
      }
    }
    handler(0, 0);
    return addTag(arr.join(''), index);
  }

  watch(() => textContent.value, (newVal) => {
    if (isNull(newVal) || newVal.contents.length <= 1) {
      const err = isNull(newVal) ? ['无法获取章节标题'] : [...newVal.contents];
      err.push('正文获取失败');
      contents.value = err.map(e => addTag(e, 1)).join('');
      return;
    }
    contents.value = newVal.contents.map((text, index) => handlerBookmarks(text, index)).join('');
  }, {
    immediate: true
  });

  watch(() => _bookmarks.value, (newVal) => {
    if (isNull(textContent.value)) {
      return;
    }
    const bookmark = newVal.find(v => v.chapterUrl === currentChapter.value?.url);
    contents.value = textContent.value.contents.map((text, index) => handlerBookmarks(text, index, bookmark)).join('');
  }, {
    deep: true
  });

  return {
    contents,
    setBookmark
  }
}