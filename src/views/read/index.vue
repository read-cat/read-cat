<script setup lang="ts">
import {
  ElDivider
} from 'element-plus';
import { onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { useWindowStore } from '../../store/window';
import { useSettingsStore } from '../../store/settings';
import { Font } from '../../core/font';
import { useTextContentStore } from '../../store/text-content';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBookshelf } from './hooks/bookshelf';
import { PagePath } from '../../core/window';
import { useMessage } from '../../hooks/message';
import { isNull, isUndefined } from '../../core/is';
import { useDetailStore } from '../../store/detail';
import Menu from '../../components/menu/index.vue';
import MenuItem from '../../components/menu/item/index.vue';
import { useBookmarks } from './hooks/bookmarks';
import { DefaultReadColor } from '../../core/window/read-style';
import { useTextContent } from './hooks/text-content';

const route = useRoute();

const pid = String(route.query.pid);
const detailUrl = String(route.query.detailUrl);

const { setDefaultReadColorById } = useSettingsStore();
(<any>window).setBgColor = (index: number) => {
  const all = DefaultReadColor.getAll();
  setDefaultReadColorById(all[index].id);
}

const { currentChapter } = storeToRefs(useTextContentStore());
const { mainElement } = useScrollTopStore();
const { calcReadProgress } = useWindowStore();
const { isDark } = storeToRefs(useWindowStore());
const { setBookmark, contents } = useBookmarks();
const { options } = useSettingsStore();

const {
  width,
  fontFamily,
  fontSize,
  letterSpacing,
  sectionSpacing,
  lineSpacing,
  bookmarkColorEven,
  bookmarkColorOdd,
  readAloudColor,
} = storeToRefs(useSettingsStore());
onMounted(() => {
  setTimeout(() => calcReadProgress(mainElement), 500);
  // pageScrollTop(PagePath.READ);
});
const { isRunningGetTextContent } = storeToRefs(useTextContentStore());
const { getTextContent } = useTextContentStore();

useBookshelf(pid, detailUrl);

const message = useMessage();
const { onRefresh } = useWindowStore();
const { setCurrentReadIndex } = useDetailStore();
onRefresh(PagePath.READ, () => {
  if (isNull(currentChapter.value)) {
    return;
  }
  getTextContent(pid, currentChapter.value, true).then(() => {
    if (isNull(currentChapter.value) || isUndefined(currentChapter.value.index)) {
      setCurrentReadIndex(-1);
      GLOBAL_LOG.warn(`chapter index is undefined, pid:${pid}`, currentChapter.value);
      message.warning('无法获取章节索引');
    } else {
      setCurrentReadIndex(currentChapter.value.index);
    }
  }).catch(e => {
    message.error(e.message);
  });
});

const { nextChapter, prevChapter } = useTextContent();
</script>

<template>
  <div :class="['container', isRunningGetTextContent ? 'loading' : '']" v-loading="isRunningGetTextContent" :style="{
    fontFamily: `'${fontFamily === '' ? Font.DEFAULT_FONT : fontFamily}'`
  }">
    <div id="text-content" v-show="!isRunningGetTextContent" v-html="contents" :style="{
      '--rc-read-aloud-color': isDark ? '' : readAloudColor,
      '--rc-bookmark-odd-color': isDark ? '' : bookmarkColorOdd,
      '--rc-bookmark-even-color': isDark ? '' : bookmarkColorEven,
      '--rc-bookmark-odd-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorOdd : '',
      '--rc-bookmark-even-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorEven : '',
    }"></div>
    <Menu trigger="#main" class-name="read-menu" :disabled="isRunningGetTextContent">
      <MenuItem label="上一章" @click="prevChapter(true)" />
      <MenuItem label="下一章" @click="nextChapter(true)" />
      <ElDivider v-once />
      <MenuItem label="设置书签" @click="setBookmark" />
    </Menu>
  </div>
</template>

<style lang="scss">
.read-menu {
  .el-divider {
    margin: 5px 0 4px 0;
  }
}
</style>
<style scoped lang="scss">
.loading.container {
  overflow: hidden;

  #text-content {
    height: 0;
  }
}

.container {
  display: flex;
  justify-content: center;
  color: var(--rc-text-color);

  :deep(.el-loading-mask) {
    height: 100vh;
    background-color: var(--rc-header-color) !important;
  }

  #text-content {
    width: v-bind(width);
    font-size: v-bind(fontSize);

    &>:deep(div[data-index]) {
      margin-bottom: v-bind(sectionSpacing);
      text-indent: 2em;
      letter-spacing: v-bind(letterSpacing);
      line-height: v-bind(lineSpacing);
      user-select: text;
      cursor: default;
      transition: color 0.3s ease;
      .bookmark {
        border-bottom: 1.5px solid var(--rc-bookmark-odd-color);
        color: var(--rc-bookmark-odd-font-color);
        cursor: pointer;
        user-select: text;
        &.even {
          border-bottom: 1.5px solid var(--rc-bookmark-even-color);
          color: var(--rc-bookmark-even-font-color);
        }
      }

      &.current-read-aloud {
        color: var(--rc-read-aloud-color);
      }
      &:first-child {
        display: none;
      }
      &:last-child {
        margin-bottom: 0;
      }

      * {
        max-width: 100%;
      }
    }
  }
}
</style>