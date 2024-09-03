<script setup lang="ts">
import {
  ElContainer,
  ElHeader,
  ElText,
  ElRadioGroup,
  ElRadioButton,
  ElMain,
  ElIcon,
  ElPagination
} from 'element-plus';
import { ref } from 'vue';
import { usePagination } from './hooks/pagination';
import { Chapter } from '../../../../core/book/book';
import { useTextContentStore } from '../../../../store/text-content';
import { useMessage } from '../../../../hooks/message';
import { isNull, isUndefined } from '../../../../core/is';
import { useDetailStore } from '../../../../store/detail';
import { storeToRefs } from 'pinia';
import { WindowEvent } from '../../../window/index.vue';
import { useBookshelfStore } from '../../../../store/bookshelf';
import { useCacheChapter } from './hooks/cache-chapter';
import IconCache from '../../../../assets/svg/icon-cache.svg';
import Bookmark from '../../../bookmark/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { useWindowStore } from '../../../../store/window';
import { useScrollTopStore } from '../../../../store/scrolltop';
import { Text } from '../../..';
import { useReadAloudStore } from '../../../../store/read-aloud';

const props = defineProps<{
  windowEvent?: WindowEvent
}>();


const { isDark } = storeToRefs(useWindowStore());
const { textColor, backgroundImage } = storeToRefs(useSettingsStore());
const radioValue = ref('directory');
const { options } = useSettingsStore();
const message = useMessage();
const { setCurrentReadIndex } = useDetailStore();
const { currentDetailUrl, cacheIndexs } = storeToRefs(useDetailStore());
const { getTextContent } = useTextContentStore();
const { exist, getBookshelfEntity, put } = useBookshelfStore();
const { cache } = useCacheChapter();
const {
  pid,
  totalPage,
  currentPage,
  showValue,
  currentPageChange,
  currentChapterTitle,
  currentChapterPage
} = usePagination(13);
const { scrollToTextContent } = useScrollTopStore();
const directoryItemClick = (chapter: Chapter) => {
  if (currentChapterTitle.value === chapter.title) {
    return;
  }
  props.windowEvent?.hide();
  const { playerStatus, play, stop } = useReadAloudStore();
  getTextContent(pid.value, chapter).then(() => {
    scrollToTextContent(void 0, 'instant');
    if (isUndefined(chapter.index)) {
      setCurrentReadIndex(-1);
      GLOBAL_LOG.warn(`chapter index is undefined, pid:${pid}`, chapter);
      message.warning('无法获取章节索引');
    } else {
      setCurrentReadIndex(chapter.index);
      if (isNull(currentDetailUrl.value) || !exist(pid.value, currentDetailUrl.value)) {
        return;
      }
      cache(chapter.index);
      getBookshelfEntity(pid.value, currentDetailUrl.value).then(entity => {
        if (!entity) {
          return;
        }
        put({
          ...entity,
          readIndex: chapter.index
        });
      });
    }
    stop();
    if (playerStatus !== 'pause') {
      play(0);
    }
  }).catch(e => {
    message.error(e.message);
  });
}
</script>
<script lang="ts">
export default {
  name: 'ChapterBox'
}
</script>

<template>
  <ElContainer class="chapter-box-container" :style="{
    '--text-color': isDark ? '' : backgroundImage ? '' : textColor,
  }">
    <ElHeader class="chapter-box-header">
      <ElText size="small" truncated v-memo="[currentChapterPage, currentChapterTitle]">当前章节(第{{ currentChapterPage }}页)
        {{ currentChapterTitle }}</ElText>
      <ElRadioGroup v-memo="[radioValue]" v-model="radioValue" size="small" text-color="var(--rc-text-color)">
        <ElRadioButton label="目录" value="directory" />
        <ElRadioButton label="书签" value="bookmark" />
      </ElRadioGroup>
    </ElHeader>
    <ElMain class="chapter-box-main">
      <div v-show="radioValue === 'directory'" class="directory">
        <template v-if="currentDetailUrl">
          <ul>
            <li v-for="item in showValue" :key="item.url" class="rc-button" @click="directoryItemClick(item)">
              <ElIcon v-if="cacheIndexs[currentDetailUrl].includes(item.index)" title="已缓存">
                <IconCache />
              </ElIcon>
              <Text ellipsis max-width="350" :title="item.title" :style="{
                color: `${item.title === currentChapterTitle ? 'var(--rc-theme-color)' : ''}`,
                fontWeight: `${item.title === currentChapterTitle ? 'bold' : ''}`
              }">{{ item.title }}</Text>
            </li>
          </ul>
          <ElPagination layout="prev, pager, next" :current-page="currentPage" :page-count="totalPage"
            @current-change="currentPageChange" hide-on-single-page />
        </template>
      </div>
      <div v-show="radioValue === 'bookmark'"
        :class="['bookmark', 'rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
        <Bookmark :window-event="windowEvent" />
      </div>
    </ElMain>
  </ElContainer>
</template>

<style scoped lang="scss">
.chapter-box-container {
  * {
    color: var(--text-color);
  }

  .chapter-box-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: .5rem;
    height: 6rem;

    :deep(.el-radio-group) {
      margin-top: 1rem;

      .el-radio-button__inner {
        padding: .7rem 5rem;
        background-color: rgba(127, 127, 127, 0.1);
        border: none;
        box-shadow: none;

        &:hover {
          color: var(--rc-theme-color);
        }
      }

      .el-radio-button__original-radio:checked+.el-radio-button__inner {
        background-color: var(--rc-search-border-color);
      }
    }
  }

  .chapter-box-main {
    padding: .5rem 0;

    .directory {
      position: relative;

      ul {
        height: 39rem;

        li {
          margin: 0 2rem .5rem;
          padding: 0 1rem;
          line-height: 2.5rem;
          height: 2.5rem;
          font-size: 1.4rem;
          justify-content: flex-start;
          color: currentColor;
          border-radius: .5rem;
          contain: layout;

          &:active {
            transform: scale(0.95);
          }

          &:last-child {
            margin-bottom: 0;
          }

          :deep(.el-icon) {
            margin-right: .5rem;
          }
        }
      }

      :deep(.el-pagination) {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
        --el-pagination-hover-color: var(--rc-theme-color);

        button,
        .el-pager li {
          background-color: transparent;
        }
      }

    }

    .bookmark {
      padding: 0 2rem;
      height: 42.5rem;
    }
  }
}
</style>