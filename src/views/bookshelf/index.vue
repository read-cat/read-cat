<script setup lang="ts">
import {
  ElResult,
  ElButton,
  ElCheckbox,
  ElPagination,
  ElInput,
  ElIcon,
  ElCheckboxGroup,
  ElCard,
  ElTooltip
} from 'element-plus';
import { onMounted, ref } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { PagePath } from '../../core/window';
import { useSearch } from './hooks/search';
import { usePagination } from './hooks/pagination';
import { useRefresh } from './hooks/refresh';
import IconSearch from '../../assets/svg/icon-search.svg';
import IconUser from '../../assets/svg/icon-user.svg';
import IconDot from '../../assets/svg/icon-dot.svg';
import IconLoading from '../../assets/svg/icon-loading.svg';
import IconBack from '../../assets/svg/icon-goback-back.svg';
import IconPlugin from '../../assets/svg/icon-settings-plugins.svg';
import { useSettingsStore } from '../../store/settings';
import CoverImage from '../../assets/cover.jpg';
import { Book } from '../../store/bookshelf';
import { useRouter } from 'vue-router';
import { useWindowStore } from '../../store/window';
import { useBookshelfCheckbox } from './hooks/bookshelf-checkbox';
import { useImportBooks } from './hooks/import-books';
import FileDrag from '../../components/file-drag/index.vue';

const router = useRouter();
const { options } = useSettingsStore();
const { pageScrollTop } = useScrollTopStore();
onMounted(() => {
  pageScrollTop(PagePath.BOOKSHELF);
});

const { refresh, refreshValues } = useRefresh();
const { search, searchValues } = useSearch(refreshValues);
const { totalPage, currentPage, currentPageChange, showValue } = usePagination(searchValues);
const searchkey = ref('');

const { onRefresh } = useWindowStore();
onRefresh(PagePath.BOOKSHELF, refresh);

const goDetailPage = (item: Book) => {
  router.push({
    path: PagePath.DETAIL,
    query: {
      pid: item.pid,
      detailUrl: item.detailPageUrl
    }
  });
}

const {
  checkAll,
  isIndeterminate,
  checkedCities,
  handleCheckAllChange,
  handleCheckedCitiesChange
} = useBookshelfCheckbox();

const {
  fileDragChange
} = useImportBooks();

</script>

<template>
  <FileDrag class="container" tip="导入书籍" @change="fileDragChange">
    <div class="bookshelf-container">
      <div class="no-result" v-if="refreshValues.length <= 0">
        <ElResult icon="info" title="暂无书本">
          <template #extra>
            <ElButton size="small" :icon="IconBack" @click="router.back()">返回</ElButton>
          </template>
        </ElResult>
      </div>
      <div class="result" v-else>
        <div :class="['toolbar', options.enableBlur ? 'app-blur' : '']">
          <div class="left">
            <ElCheckbox v-memo="[checkAll, isIndeterminate]" v-model="checkAll" label="全选"
              :indeterminate="isIndeterminate" @change="handleCheckAllChange" />
            <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" small hide-on-single-page
              :page-count="totalPage" :current-page="currentPage" @current-change="currentPageChange" />
          </div>
          <div class="right">
            <ElInput v-memo="[searchkey]" v-model="searchkey" @keyup="search(searchkey)" placeholder="请输入书名、作者"
              clearable>
              <template #prefix>
                <ElIcon>
                  <IconSearch />
                </ElIcon>
              </template>
            </ElInput>
          </div>
        </div>
        <ElCheckboxGroup class="list" v-model="checkedCities" @change="handleCheckedCitiesChange">
          <ElCard shadow="hover" v-for="item in showValue" :key="item.id" @click="goDetailPage(item)">
            <div class="cover" v-memo="[item.coverImageUrl]">
              <img :src="item.coverImageUrl" @error="e => (<HTMLImageElement>e.target).src = CoverImage" />
            </div>
            <div class="info">
              <div>
                <p class="bookname" v-if="item.bookname">
                  <ElTooltip v-memo="[item.bookname]" effect="light" :content="item.bookname" placement="bottom"
                    :show-after="1500">
                    <span>{{ item.bookname }}</span>
                  </ElTooltip>
                  <ElIcon class="is-loading" v-if="item.isRunningRefresh">
                    <IconLoading style="width: 12px;height: 12px;" />
                  </ElIcon>
                  <ElTooltip v-else-if="item.error" effect="light" placement="bottom" :show-after="1500">
                    <template #content>
                      <span class="rc-error-color">错误 {{ item.error }}</span>
                    </template>
                    <IconDot class="rc-error-color" style="width: 14px;height: 14px;" />
                  </ElTooltip>
                </p>
                <p v-if="item.author">
                  <ElTooltip v-once effect="light" content="作者" placement="bottom" :show-after="1500">
                    <IconUser style="margin-right: 4px;width: 12px;height: 12px;" />
                  </ElTooltip>
                  <ElTooltip v-memo="[item.author]" effect="light" :content="'作者 ' + item.author" placement="bottom"
                    :show-after="1500">
                    <span>{{ item.author }}</span>
                  </ElTooltip>
                </p>
                <p>
                  <ElTooltip v-once effect="light" content="插件" placement="bottom" :show-after="1500">
                    <IconPlugin style="margin-right: 4px;width: 12px;height: 12px;" />
                  </ElTooltip>
                  <ElTooltip v-memo="[item.group, item.pluginName]" effect="light"
                    :content="`插件 ${item.group}-${item.pluginName}`" placement="bottom" :show-after="1500">
                    <span>{{ `${item.group}-${item.pluginName}` }}</span>
                  </ElTooltip>
                </p>
              </div>
              <div>
                <p v-if="item.readChapterTitle">
                  <ElTooltip v-once effect="light" content="已读" placement="bottom" :show-after="1500">
                    <IconDot style="color: var(--rc-theme-color);" />
                  </ElTooltip>
                  <ElTooltip v-memo="[item.readChapterTitle]" effect="light" :content="'已读 ' + item.readChapterTitle"
                    placement="bottom" :show-after="1500">
                    <span>{{ item.readChapterTitle }}</span>
                  </ElTooltip>
                </p>
                <p v-if="item.latestChapterTitle">
                <div>
                  <ElTooltip v-once effect="light" content="最新章节" placement="bottom" :show-after="1500">
                    <IconDot style="color: var(--rc-latest-chapter-color);" />
                  </ElTooltip>
                  <ElTooltip v-memo="[item.latestChapterTitle]" effect="light"
                    :content="'最新章节 ' + item.latestChapterTitle" placement="bottom" :show-after="1500">
                    <span>{{ item.latestChapterTitle }}</span>
                  </ElTooltip>
                </div>
                <ElCheckbox v-memo="[item.id]" :key="`checkbox-${item.id}`" :value="item.id"
                  @click="(e: MouseEvent) => e.stopPropagation()" />
                </p>
              </div>
            </div>
          </ElCard>
          <i v-once class="hide" />
          <i v-once class="hide" />
          <i v-once class="hide" />
          <i v-once class="hide" />
          <i v-once class="hide" />
          <i v-once class="hide" />
        </ElCheckboxGroup>
      </div>
    </div>
  </FileDrag>
</template>

<style scoped lang="scss">
.bookshelf-container {
  .app-blur {
    background-color: var(--rc-window-box-blur-bgcolor) !important;
  }

  .result {
    :deep(.el-checkbox) {
      .el-checkbox__inner {
        --el-checkbox-checked-bg-color: var(--rc-theme-color);
        --el-checkbox-checked-input-border-color: var(--rc-theme-color);
      }

      .el-checkbox__input.is-checked+.el-checkbox__label {
        --el-checkbox-checked-text-color: var(--rc-theme-color);
      }
    }
  }

  .toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 10px;
    margin: 0 15px 0 10px;
    padding: 0 10px;
    height: 40px;
    background-color: var(--rc-header-color);
    border-radius: 10px;
    z-index: 1;

    .left {
      display: flex;
      flex-direction: row;

      :deep(.el-pagination) {
        --el-pagination-hover-color: var(--rc-theme-color);
        --el-pagination-button-disabled-bg-color: none;
        --el-pagination-bg-color: none;
        --el-pagination-button-disabled-color: var(--rc-text-color);
      }

      :deep(.el-checkbox) {
        margin-right: 20px;
      }
    }

    .right {
      :deep(.el-input) {
        background-color: rgba(127, 127, 127, 0.1);
        border-radius: 10px;

        .el-input__wrapper {
          --el-input-bg-color: none;
          padding: 3px 10px;
          box-shadow: none;

          .el-input__inner {
            font-size: 12px;
            height: 20px;
          }
        }
      }
    }

  }

  .list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 15px;
    font-size: 14px;

    :deep(.el-card) {
      margin: 0 10px 10px 0;
      border-radius: 10px;
      cursor: pointer;

      .el-card__body {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 0;

        width: 300px;
      }

      &:hover .cover img {
        transform: scale(1.2);
      }

      .el-checkbox {
        width: 20px;

        .el-checkbox__label {
          display: none;
        }
      }
    }


    .cover {
      margin-right: 5px;
      width: 110px;
      height: 140px;
      overflow: hidden;
      border-radius: 10px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.2s ease 0s;
      }
    }


    i.hide {
      margin: 0 10px 10px 0;
      width: 300px;
      height: 0;
    }

    .info {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 180px;
      color: var(--rc-text-color);

      p {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 2px;
        font-size: 12px;
        height: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        span {
          display: inline-block;
          max-width: 160px;
          line-height: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          text-wrap: nowrap;
        }
      }

      .bookname {
        font-size: 16px;
        font-weight: bold;
        justify-content: space-between;

        svg {
          margin-right: 3px;
        }
      }

      &>div:first-child {
        margin-top: 5px;
      }

      &>div:last-child {
        margin-bottom: 5px;

        p {
          height: 15px;

          &:last-child {
            display: flex;
            justify-content: space-between;
            align-items: center;

            div {
              display: flex;
              align-items: center;
            }

            span {
              max-width: 145px;
            }
          }
        }
      }
    }


  }
}
</style>