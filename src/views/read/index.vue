<script setup lang="ts">
import {
  ElDivider,
  ElIcon
} from 'element-plus';
import { nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
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
import Menu from '../../components/menu/index.vue';
import MenuItem from '../../components/menu/item/index.vue';
import { useBookmarks } from './hooks/bookmarks';
import { useTextContent } from './hooks/text-content';
import SendBackward from '../../assets/svg/icon-send-backward.svg';
import { debounce } from '../../core/utils/timer';
import { useReadAloudStore } from '../../store/read-aloud';

const route = useRoute();

const pid = String(route.query.pid);
const detailUrl = String(route.query.detailUrl);

const { currentChapter } = storeToRefs(useTextContentStore());
const { mainElement } = storeToRefs(useScrollTopStore());
const { calcReadProgress, onRefresh } = useWindowStore();
const { isDark, currentPath } = storeToRefs(useWindowStore());
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
onMounted(() => {
  nextTick(() => calcReadProgress(mainElement.value));
});
const { isRunningGetTextContent } = storeToRefs(useTextContentStore());
const { getTextContent } = useTextContentStore();

useScrollTop(pid, detailUrl);

const message = useMessage();
const { setCurrentReadIndex } = useDetailStore();
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
    mainElement.value.scrollTop = 0;
  }).catch(e => {
    message.error(e.message);
  });
});

const { nextChapter, prevChapter } = useTextContent();

const deboNextChapter = debounce(() => {
  nextChapter().catch(e => message.error(e.message));
}, 200);
const scrollBottomToNextChapterListener = () => {
  const { scrollTop, clientHeight, scrollHeight } = mainElement.value;
  if (scrollTop >= scrollHeight - clientHeight) {
    deboNextChapter();
  }
}
watchEffect(() => {
  if (options.enableScrollBottomToNextChapter && currentPath.value === PagePath.READ) {
    mainElement.value.addEventListener('scrollend', scrollBottomToNextChapterListener);
  } else {
    mainElement.value.removeEventListener('scrollend', scrollBottomToNextChapterListener);
  }
});
onUnmounted(() => {
  mainElement.value.removeEventListener('scrollend', scrollBottomToNextChapterListener);
});
const pageHeight = ref('500px');
watch(() => mainElement.value.clientHeight, (height) => {
  if (height > 500) {
    pageHeight.value = `${height - 10}px`;
  } else {
    pageHeight.value = '500px';
  }
}, { immediate: true });
</script>

<template>
  <div :class="['container', isRunningGetTextContent ? 'loading' : '']" v-loading="isRunningGetTextContent" :style="{
    '--font-family': `'${fontFamily === '' ? Font.default : fontFamily}'`
  }">
    <div id="text-content" v-show="!isRunningGetTextContent" v-html="contents" :style="{
      width,
      fontSize,
      fontWeight,
      '--rc-read-aloud-color': isDark ? '' : readAloudColor,
      '--rc-bookmark-odd-color': isDark ? '' : bookmarkColorOdd,
      '--rc-bookmark-even-color': isDark ? '' : bookmarkColorEven,
      '--rc-bookmark-odd-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorOdd : '',
      '--rc-bookmark-even-font-color': isDark ? options.enableBookmarkHighlight ? '' : 'none' : options.enableBookmarkHighlight ? bookmarkColorEven : '',
    }"></div>
    <div v-if="options.enableScrollBottomToNextChapter" class="scroll-bottom-to-next-chapter">
      <ElIcon size="60">
        <SendBackward />
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

  .scroll-bottom-to-next-chapter {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 50px;
    height: v-bind(pageHeight);
  }
}
</style>