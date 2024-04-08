<script setup lang="ts">
import {
  ElPagination,
  ElResult
} from 'element-plus';
import { useRouter } from 'vue-router';
import CoverImage from '../../assets/cover.jpg';
import { usePagination } from './hooks/pagination';
import { useSearchStore } from '../../store/search';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../store/settings';
import { PagePath } from '../../core/window';

const router = useRouter();
const { options } = useSettingsStore();
const { isRunningSearch, searchResult } = storeToRefs(useSearchStore());
const { totalPage, currentPage, showValue, currentPageChange } = usePagination(searchResult, 50);

const getDetail = (pid: string, detailUrl: string) => {
  router.push({
    path: PagePath.DETAIL,
    query: {
      pid,
      detailUrl
    }
  });
}
</script>

<template>
  <div class="container loading" v-loading="isRunningSearch && searchResult.length <= 0"
    element-loading-text="正在搜索中...">
    <div id="pagination" v-if="totalPage > 1" :class="[options.enableBlur ? 'app-blur' : '']" :style="{
    '--rc-search-pagination-blur-bgcolor': options.enableBlur ? '' : 'var(--rc-search-box-bgcolor)'
  }">
      <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" :page-count="totalPage" :current-page="currentPage"
        @current-change="currentPageChange" />
    </div>
    <ul v-if="searchResult.length > 0">
      <TransitionGroup v-memo="[options.enableTransition, isRunningSearch]" :name="options.enableTransition && isRunningSearch ? 'search-list' : void 0">
        <li v-for="item in showValue" :key="item.detailPageUrl" @click="getDetail(item.pid, item.detailPageUrl)">
          <div class="cover-image">
            <img :src="`${item.coverImageUrl ? item.coverImageUrl : CoverImage}`"
              @error="e => (<HTMLImageElement>e.target).src = CoverImage">
            <div class="mask">
              <p>{{ item.bookname }}</p>
              <p>{{ item.author }}</p>
              <p v-show="item.latestChapterTitle">{{ item.latestChapterTitle }}</p>
              <p>组: {{ item.group }}</p>
              <p>源: {{ item.sourceName }}</p>
              <p>耗时: {{ item.time }}ms</p>
            </div>
          </div>
        </li>
      </TransitionGroup>
      <li v-once class="hide" />
      <li v-once class="hide" />
      <li v-once class="hide" />
      <li v-once class="hide" />
      <li v-once class="hide" />
      <li v-once class="hide" />
      <li v-once class="hide" />
    </ul>
    <div class="no-result" v-else v-show="!isRunningSearch">
      <ElResult icon="success" title="没有搜索结果"></ElResult>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  #pagination {
    display: inline-block;
    position: sticky;
    top: 10px;
    margin-left: 10px;
    padding: 5px 10px;
    background-color: var(--rc-search-pagination-blur-bgcolor);
    border-radius: 10px;
    overflow: hidden;
    z-index: 9;

    :deep(.el-pagination) {
      --el-pagination-bg-color: none;
      --el-pagination-hover-color: var(--rc-theme-color);

      button {
        background-color: transparent !important;
      }
    }
  }

  .search-list-enter-from {
    opacity: 0.5;
  }
  .search-list-enter-to {
    opacity: 1;
  }
  .search-list-enter-active {
    transition: opacity 0.5s ease;
  }

  ul {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;

    li {
      margin: 15px 7.5px 0 7.5px;
      width: 140px;
      cursor: pointer;


      &:hover {
        .cover-image {
          img {
            transform: scale(1.2);
          }
        }
      }

      .cover-image {
        position: relative;
        width: 140px;
        height: 170px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        // background-image: url(IconPic);
        border-radius: 10px;
        overflow: hidden;
        background-color: rgba(127, 127, 127, 0.3);

        img {
          display: block;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.2s ease 0s;
          z-index: 1;
        }


        .mask {
          position: absolute;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          bottom: 0;
          padding: 5px;
          width: calc(100% - 10px);
          background-color: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(15px);
          color: #eeeeee;
          font-size: 14px;

          p {
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            text-wrap: nowrap;

            &:nth-child(1) {
              font-weight: bold;
            }

            &:nth-child(2),
            &:nth-child(3) {
              font-size: 12px;
            }

            &:nth-child(4),
            &:nth-child(5),
            &:nth-child(6) {
              margin-bottom: 0;
              font-size: 10px;
              text-align: right;
              text-wrap: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }

    }

    .hide {
      cursor: default;
    }
  }
}
</style>