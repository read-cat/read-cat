<script setup lang="ts">
import { useBookstoreStore } from '../../store/bookstore';
import CoverImage from '../../assets/cover.jpg';
import { Text } from '../../components';
import {
  ElPagination,
  ElSelect,
  ElOption,
  ElEmpty
} from 'element-plus';
import { BookStoreItem } from '../../core/book/book';
import { useData } from './hooks/data';
import { useSearch } from './hooks/search';
import { useSettingsStore } from '../../store/settings';
import { useWindowStore } from '../../store/window';
import { PagePath } from '../../core/window';

const win = useWindowStore();
const settings = useSettingsStore();
const bookstore = useBookstoreStore();

const {
  showValue,
  totalPage,
  currentPage,
  currentPageChange,
  onCurrentPageChange,
  isRun,
  navItem,
  source,
  disableSelect,
  selected,
  clear,
  isEmpty
} = useData();

const scrollTop = () => {
  const main = document.querySelector('#bookstore-list main');
  if (!main) {
    return;
  }
  main.scrollTop = 0;
}

const navItemClick = (key: string) => {
  selected.value = key;
  bookstore.refreshData(selected.value);
  scrollTop();
}
onCurrentPageChange(() => {
  scrollTop();
});
const { search } = useSearch();
const listItemClick = (item: BookStoreItem) => {
  search(item.bookname, item.author || null);
}

const sourceChange = () => {
  clear();
  selected.value = '';
  bookstore.refreshNavItem();
  bookstore.refreshData(selected.value);
}

win.onRefresh(PagePath.BOOKSTORE, () => {
  if (!selected.value) {
    return;
  }
  bookstore.refreshData(selected.value, true);
});
</script>

<template>
  <div class="container">
    <nav>
      <main class="rc-scrollbar">
        <ul>
          <li :class="[
            'rc-button',
            item === selected ? 'nav-item-selected' : ''
          ]" v-for="item of navItem" :key="item" @click="navItemClick(item)">
            <Text ellipsis :title="item">{{ item }}</Text>
          </li>
        </ul>
      </main>
      <footer>
        <ElSelect
          v-if="source.length > 0"
          v-model="settings.bookStore.use"
          no-data-text="暂无已启用的书城插件"
          placeholder="请选择书城插件"
          @change="sourceChange"
          :disabled="disableSelect"
        >
          <ElOption v-for="item of source" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </footer>
    </nav>
    <section id="bookstore-list" class="list-container" v-loading="isRun">
      <ElEmpty v-if="isEmpty" description="暂无内容" />
      <main v-else class="rc-scrollbar">
        <ul>
          <li v-for="item of showValue" :class="item.intro ? 'has-intro' : ''" @click="listItemClick(item)">
            <img
              :src="item.coverImageUrl"
              :alt="item.bookname"
              @error="e => (<HTMLImageElement>e.target).src = CoverImage"
              @load="e => (<HTMLImageElement>e.target).style.opacity = '1'"
            />
            <div class="mask">
              <Text ellipsis max-width="12rem" class="title" :title="item.bookname">{{ item.bookname }}</Text>
              <p v-if="item.author" class="author" :title="`作者：${item.author}`">{{ item.author }}</p>
              <p v-if="item.intro" class="intro" :title="item.intro">{{ item.intro }}</p>
            </div>
          </li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
          <li class="hide"></li>
        </ul>
      </main>
      <footer>
        <ElPagination layout="prev, pager, next" :page-count="totalPage"
        :current-page="currentPage" @current-change="currentPageChange" hide-on-single-page />
      </footer>
    </section>
  </div>
</template>
<style lang="scss">
.list-container {
  .el-loading-mask {
    background-color: var(--rc-window-box-bgcolor);
    z-index: 99;
  }
}
</style>
<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  height: calc(100% - 1rem);
  
  nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 1rem;
    padding: 1rem 0 1rem 1rem;
    width: 19rem;
    background-color: var(--rc-window-box-bgcolor);
    border-radius: 10px;
    box-shadow: var(--rc-shadow-light);
    overflow: hidden;
    main {
      padding-right: 1rem;
      width: calc(100% - 1rem);
      height: calc(100% - 4rem);
      ul li {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;
        margin-bottom: .5rem;
        padding: .5rem 1rem;
        border-radius: .7rem;
        font-size: 1.4rem;
        &:active {
          transform: scale(0.98);
        }
        &:last-child {
          margin-bottom: 0;
        }
        &:is(.nav-item-selected) {
          background-color: var(--rc-button-hover-bgcolor);
        }
      }
    }
    footer {
      width: calc(100% - 1rem);
      height: 3rem;
    }
  }
  section.list-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 1rem 1.5rem 1rem 1rem;
    padding: 1rem 0 1rem 1rem;
    width: calc(100% - 22rem);
    height: calc(100% - 4rem);
    background-color: var(--rc-window-box-bgcolor);
    border-radius: 1rem;
    box-shadow: var(--rc-shadow-light);
    overflow: hidden;

    :deep(.el-empty) {
      height: 100%;
    }

    main {
      padding-right: 1rem;
      height: calc(100% - 4rem);

      ul {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: .5rem;
        li {
          position: relative;
          width: 13rem;
          height: 17rem;
          background-color: var(--rc-list-item-bgcolor);
          border-radius: 1rem;
          overflow: hidden;
          cursor: pointer;
          &:is(.hide) {
            height: 0;
          }

          img {
            width: 100%;
            height: 100%;
            transition: all .2s ease;
            opacity: 0;
          }
          div.mask {
            position: absolute;
            left: 0;
            bottom: 0;
            padding: .2rem;
            width: calc(100% - 0.4rem);
            height: 4rem;
            background-color: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            transition: all .2s ease;
            .title {
              font-size: 1.3rem;
              font-weight: bold;
              color: #FFFFFF;
            }

            p.author {
              padding-right: .5rem;
              color: #FFFFFF;
              text-align: right;
              font-size: 1.3rem;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }

            p.intro {
              margin-top: .5rem;
              display: none;
              color: #FFFFFF;
              font-size: 1.3rem;
            }
          }

          &:hover {
            &:is(.has-intro) {
              div.mask {
                height: 10rem;
                p.intro {
                  display: -webkit-box;
                  height: 5rem;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  line-clamp: 3;
                  -webkit-line-clamp: 3;
                  -webkit-box-orient: vertical;
                }
                &:not(.has-intro) ~ img {
                  height: 10rem;
                }
              }
            }
            &:not(.has-intro) {
              img {
                transform: scale(1.2);
              }
            }
          }
        }
      }
    }
    footer {
      display: flex;
      justify-content: flex-end;
      width: calc(100% - 1rem);
      height: 3rem;
    }
  }
}
</style>