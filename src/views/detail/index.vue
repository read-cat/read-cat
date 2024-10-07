<script setup lang="ts">
import {
  ElResult,
  ElButton,
  ElCheckTag,
  ElPagination,
  ElRow,
  ElCol,
  ElIcon,
  ElContainer,
  ElHeader,
  ElText,
  ElMain
} from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useDetailStore } from '../../store/detail';
import IconStar from '../../assets/svg/icon-star.svg';
import IconStarActive from '../../assets/svg/icon-star-active.svg';
import IconMore from '../../assets/svg/icon-more.svg';
import IconRedo from '../../assets/svg/icon-redo.svg';
import IconUser from '../../assets/svg/icon-user.svg';
import IconDot from '../../assets/svg/icon-dot.svg';
import IconBack from '../../assets/svg/icon-goback-back.svg';
import IconCache from '../../assets/svg/icon-cache.svg';
import IconBookmarkBtn from '../../assets/svg/icon-bookmark-btn.svg';
import { Window, WindowEvent, Text } from '../../components';
import Bookmark from '../../components/bookmark/index.vue';
import { storeToRefs } from 'pinia';
import { isNull } from '../../core/is';
import { useChapterPagination } from './hooks/pagination';
import { useBookshelf } from './hooks/bookshelf';
import { useTextContentStore } from '../../store/text-content';
import { useTextContent } from './hooks/text-content';
import { useDetail } from './hooks/detail';
import { useWindowStore } from '../../store/window';
import { PagePath } from '../../core/window';
import { ref } from 'vue';
import { useSettingsStore } from '../../store/settings';
import CoverImage from '../../assets/cover.jpg';
import { BookParser } from '../../core/book/book-parser';
import { useMessage } from '../../hooks/message';

const route = useRoute();
const router = useRouter();
const { options } = useSettingsStore();
const { pid, detailUrl } = route.query;
const detailStore = useDetailStore();
const { isRunningGetDetailPage, detailResult, error, cacheIndexs } = storeToRefs(detailStore);
const { exist, putAndRemoveBookshelf, setExist } = useBookshelf(String(pid), String(detailUrl), detailResult);
const { getChapterContent } = useTextContent(detailResult, String(detailUrl), exist);
const {
  totalPage,
  currentPage,
  showValue,
  currentPageChange,
  currentReadIndex
} = useChapterPagination(detailResult);

const { exec, onReady } = useDetail(String(pid), String(detailUrl), setExist);
onReady(() => {
  const { to } = route.query;
  if (!to || to === 'normal') {
    return;
  }
  const message = useMessage();
  if (!detailResult.value) {
    message.error('无法获取详情页');
    return;
  }
  let index = -1;
  if (to === 'already') {
    index = currentReadIndex.value;
  } else if (to === 'latest') {
    index = detailResult.value.chapterList.length - 1;
  }
  const chapter = detailResult.value.chapterList[index];
  if (!chapter) {
    message.error(`无法获取章节信息`);
    GLOBAL_LOG.error(
      'detail: to onReady',
      `bookname=${detailResult.value.bookname},`,
      `pid=${detailResult.value.pid},`,
      `to=${to},`,
      `chapterIndex=${index},`,
      `chapterList length=${detailResult.value.chapterList.length}`
    );
    return;
  }
  getChapterContent(chapter);
});
exec();

const { onRefresh } = useWindowStore();
onRefresh(PagePath.DETAIL, () => exec(true));

const { isRunningGetTextContent } = storeToRefs(useTextContentStore());

const bookmarkWindow = ref<WindowEvent>();
</script>

<template>
  <div class="container loading" v-loading="isRunningGetDetailPage || isRunningGetTextContent"
    element-loading-text="正在加载中...">
    <div class="no-result" v-show="error" v-if="!isRunningGetDetailPage && error || isNull(detailResult)">
      <ElResult icon="error" title="错误提示" :sub-title="error ? error : 'unknown'">
        <template #extra>
          <ElButton size="small" :icon="IconBack" @click="router.back()">返回</ElButton>
          <ElButton size="small" :icon="IconRedo" @click="exec(true)">刷新</ElButton>
        </template>
      </ElResult>
    </div>
    <div v-else id="detail-result">
      <div id="detail-result-box">
        <div class="info">
          <img v-memo="[detailResult.coverImageUrl]" :src="detailResult.coverImageUrl"
            @error="e => (<HTMLImageElement>e.target).src = CoverImage">
          <div>
            <div class="col">
              <p v-memo="[detailResult.bookname]" class="bookname rc-text-ellipsis">{{ detailResult.bookname }}</p>
              <div class="btn" v-memo="[exist]">
                <ElCheckTag v-if="false && exist && pid !== BookParser.PID" type="primary" size="small" :checked="true">
                  <IconMore /><span>换源</span>
                </ElCheckTag>
                <ElCheckTag v-if="exist" type="warning" size="small" :checked="true" @click="bookmarkWindow?.show()">
                  <IconBookmarkBtn /><span>书签</span>
                </ElCheckTag>
                <ElCheckTag type="success" size="small" :checked="true" @click="putAndRemoveBookshelf">
                  <IconStar v-if="!exist" />
                  <IconStarActive v-else />
                  <span>{{ exist ? '移出' : '加入' }}书架</span>
                </ElCheckTag>
              </div>
            </div>
            <div class="col">
              <p class="author">
                <IconUser v-once />
                <Text v-memo="[detailResult.author]" :title="`作者 ${detailResult?.author}`" ellipsis max-width="calc(100% - 15px)">{{ detailResult?.author }}</Text>
              </p>
              <p class="latest-chapter">
                <IconDot v-once style="color: var(--rc-latest-chapter-color);" />
                <Text
                  v-memo="[detailResult.chapterList, detailResult.latestChapterTitle]"
                  :title="`最新章节 ${detailResult?.latestChapterTitle ? detailResult.latestChapterTitle :
                    detailResult?.chapterList[detailResult?.chapterList.length - 1]?.title}`"
                  ellipsis
                  max-width="calc(100% - 15px)"
                >
                  {{
                    detailResult?.latestChapterTitle ? detailResult.latestChapterTitle :
                    detailResult?.chapterList[detailResult?.chapterList.length - 1]?.title
                  }}
                </Text>
              </p>
            </div>
            <span v-once>简介:</span>
            <p v-memo="[options.enableTransition, detailResult.intro]" :class="['intro', 'rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">{{
    detailResult?.intro ? detailResult.intro : '无' }}</p>
          </div>
        </div>
        <div class="chapter">
          <div class="col">
            <p v-once>章节目录</p>
            <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" :page-count="totalPage" :current-page="currentPage"
              @current-change="currentPageChange" size="small" hide-on-single-page />
          </div>
          <div :class="['list', 'rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
            <ElRow v-for="(item, index) in showValue" :key="index">
              <ElCol class="rc-button" :span="8" v-for="i in item" :key="i.url" @click="getChapterContent(i)">
                <ElIcon v-if="cacheIndexs[<string>detailUrl].includes(i.index)"  title="已缓存">
                  <IconCache />
                </ElIcon>
                <Text :title="i.title" ellipsis max-width="100%" :data-index="i.index" :style="{
                  color: `${currentReadIndex === i.index ? 'var(--rc-theme-color)' : ''}`
                }">{{ i.title }}</Text>
              </ElCol>
            </ElRow>
          </div>
        </div>
      </div>
    </div>
    <Window top="10" centerX @event="e => bookmarkWindow = e" class-name="bookmark-window">
      <ElContainer>
        <ElHeader class="header" v-once>
          <ElText type="info" size="small">书签</ElText>
        </ElHeader>
        <ElMain :class="['main', 'rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
          <Bookmark />
        </ElMain>
      </ElContainer>
    </Window>
  </div>
</template>
<style lang="scss">
.bookmark-window {
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
  }

  .main {
    padding: 10px 20px;
    max-height: 470px;
  }
}
</style>
<style scoped lang="scss">
.container {
  #detail-result {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;

    #detail-result-box {
      display: flex;
      flex-direction: column;
      padding: 10px;
      width: 700px;
      height: calc(100% - 20px);
      z-index: 1;

      &>div {
        padding: 10px;
        background-color: rgba(127, 127, 127, 0.05);
        border-radius: 10px;
      }

      .col {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .info {
        display: flex;
        flex-direction: row;
        margin-bottom: 20px;
        height: 170px;

        img {
          margin-right: 10px;
          width: 140px;
          height: 170px;
          object-fit: cover;
          border-radius: 10px;
        }

        &>div {
          margin-top: 5px;
          width: calc(100% - 150px);

          p {
            font-size: 14px;
            user-select: text;

            &:hover {
              cursor: default;
            }
          }

          &>span {
            font-size: 14px;
          }

          .bookname {
            width: 290px;
            font-size: 21px;
            font-weight: bold;
          }

          .col:nth-child(1) {
            .btn {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              width: 220px;

              :deep(.el-check-tag) {
                display: flex;
                align-items: center;
                padding: 5px 10px;
                margin-right: 5px;
                font-size: 12px;

                &:last-child {
                  margin-right: 0;
                }

                span {
                  margin-left: 4px;
                }
              }
            }
          }

          .author,
          .latest-chapter {
            display: flex;
            align-items: center;

            span {
              margin-left: 5px;
              user-select: text;
            }
          }

          .author {
            width: 40%;

          }

          .latest-chapter {
            width: 58%;
          }

          .intro {
            width: 100%;
            height: 80px;
            font-size: 12px;
            overflow-y: scroll;
            text-indent: 2em;
          }
        }
      }

      .chapter {
        padding: 2px 0 10px 10px;
        height: calc(100% - 230px);

        &>.col {
          margin-bottom: 5px;
          align-items: center;
          height: 25px;

          p {
            font-size: 12px;
          }

          :deep(.el-pagination) {
            --el-pagination-bg-color: none;
            --el-pagination-button-disabled-bg-color: none;
            --el-pagination-hover-color: var(--rc-theme-color);
            margin-right: 5px;
          }
        }

        .list {
          display: flex;
          flex-direction: column;
          height: calc(100% - 25px);

          :deep(.el-row) {
            margin-bottom: 5px;
            margin-right: 10px;
            contain: layout;
            .el-col {
              display: flex;
              padding: 0 10px;
              height: 30px;
              font-size: 13px;
              justify-content: flex-start;

              &:active {
                transform: scale(0.95);
              }
            }
          }

          :deep(.el-icon) {
            margin-right: 5px;
          }
        }
      }
    }
  }
}
</style>