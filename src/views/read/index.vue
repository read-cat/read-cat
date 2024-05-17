<script setup lang="ts">
import {
  ElDivider,
  ElIcon
} from 'element-plus';
import { nextTick, onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { useWindowStore } from '../../store/window';
import { useSettingsStore } from '../../store/settings';
import { Font } from '../../core/font';
import { useTextContentStore } from '../../store/text-content';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useScrollTop } from './hooks/scrolltop';
import { PagePath } from '../../core/window';
import { useMessage } from '../../hooks/message';
import { isNull, isUndefined } from '../../core/is';
import { useDetailStore } from '../../store/detail';
import { Menu, MenuItem } from '../../components';
import { useBookmarks } from './hooks/bookmarks';
import { useTextContent } from './hooks/text-content';
import IconArrowLineUp from '../../assets/svg/icon-arrow-line-up.svg';
import IconArrowLineDown from '../../assets/svg/icon-arrow-line-down.svg';
import { useReadAloudStore } from '../../store/read-aloud';
import { useScrollToggleChapter } from './hooks/scroll-toggle-chapter';

const route = useRoute();

const pid = String(route.query.pid);
const detailUrl = String(route.query.detailUrl);

const { currentChapter } = storeToRefs(useTextContentStore());
const { mainElement } = storeToRefs(useScrollTopStore());
const { scrollToTextContent } = useScrollTopStore();
const { calcReadProgress, onRefresh } = useWindowStore();
const { isDark } = storeToRefs(useWindowStore());
const { setBookmark, contents } = useBookmarks();
const { options } = useSettingsStore();

const {
  width,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  sectionSpacing,
  lineSpacing,
  bookmarkColorEven,
  bookmarkColorOdd,
  readAloudColor,
} = storeToRefs(useSettingsStore());

const { nextChapter, prevChapter } = useTextContent();

const {
  pageHeight,
} = useScrollToggleChapter();

onMounted(() => {
  nextTick(() => {
    calcReadProgress(mainElement.value);
  });
});
const { isRunningGetTextContent } = storeToRefs(useTextContentStore());
const { getTextContent } = useTextContentStore();

useScrollTop(pid, detailUrl);

const message = useMessage();
const { setCurrentReadIndex } = useDetailStore();
const { isSelectPlay, playerStatus } = storeToRefs(useReadAloudStore());
const { stop: readAloudStop } = useReadAloudStore();
onRefresh(PagePath.READ, () => {
  if (isNull(currentChapter.value)) {
    return;
  }
  readAloudStop();
  getTextContent(pid, currentChapter.value, true).then(() => {
    if (isNull(currentChapter.value) || isUndefined(currentChapter.value.index)) {
      setCurrentReadIndex(-1);
      GLOBAL_LOG.warn(`chapter index is undefined, pid:${pid}`, currentChapter.value);
      message.warning('无法获取章节索引');
    } else {
      setCurrentReadIndex(currentChapter.value.index);
    }
    scrollToTextContent(void 0, 'instant');
  }).catch(e => {
    message.error(e.message);
  });
});

</script>

<template>
  <div :class="['container', isRunningGetTextContent ? 'loading' : '']" v-loading="isRunningGetTextContent" :style="{
    '--font-family': `'${fontFamily === '' ? Font.default : fontFamily}'`
  }">
    <div v-if="options.enableScrollToggleChapter && !isRunningGetTextContent" class="scroll-top-to-prev-chapter">
      <p>向上滚动切换上一章节</p>
      <ElIcon size="60">
        <IconArrowLineUp />
      </ElIcon>
    </div>
    <div id="text-content" v-show="!isRunningGetTextContent" v-html="contents" :style="{
      width,
      minHeight: pageHeight,
      fontSize,
      fontWeight,
      '--rc-read-aloud-color': isDark ? '' : readAloudColor,
      '--rc-bookmark-odd-color': isDark ? '' : bookmarkColorOdd,
      '--rc-bookmark-even-color': isDark ? '' : bookmarkColorEven,
      '--rc-bookmark-odd-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorOdd : '',
      '--rc-bookmark-even-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorEven : '',
    }" :class="[isSelectPlay && playerStatus === 'pause' ? 'play-start' : '']"></div>
    <div v-if="options.enableScrollToggleChapter && !isRunningGetTextContent" class="scroll-bottom-to-next-chapter">
      <ElIcon size="60">
        <IconArrowLineDown />
      </ElIcon>
      <p>向下滚动切换下一章节</p>
    </div>
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
  flex-direction: column;
  align-items: center;
  color: var(--rc-text-color);

  :deep(.el-loading-mask) {
    height: 100vh;
    background-color: var(--rc-header-color) !important;
  }

  #text-content {
    * {
      font-family: var(--font-family);
    }

    &.play-start {
      :deep(div[data-index]) {
        &:hover {
          color: var(--rc-read-aloud-color);
          cursor: pointer;
        }
      }
    }
    &>:deep(div[data-index]) {
      margin-bottom: v-bind(sectionSpacing);
      text-indent: 2em;
      letter-spacing: v-bind(letterSpacing);
      line-height: v-bind(lineSpacing);
      user-select: text;
      cursor: default;
      transition: color 0.3s ease;
      overflow: hidden;
      
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
        user-select: text;
      }
    }
  }

  .scroll-bottom-to-next-chapter,
  .scroll-top-to-prev-chapter {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: v-bind(pageHeight);
  }
  .scroll-bottom-to-next-chapter {
    padding-top: 50px;
  }
  .scroll-top-to-prev-chapter {
    padding-bottom: 50px;
    justify-content: flex-end;
  }
}
</style>