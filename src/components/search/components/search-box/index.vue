<script setup lang="ts">
import {
  ElContainer,
  ElHeader,
  ElText,
  ElInput,
  ElButton,
  ElMain,
  InputInstance
} from 'element-plus';
import IconSearchKeyDelete from '../../../../assets/svg/icon-searchkey-delete.svg';
import IconSearch from '../../../../assets/svg/icon-search.svg';
import { PagePath } from '../../../../core/window';
import { useSearchStore } from '../../../../store/search';
import { useMessage } from '../../../../hooks/message';
import { isUndefined } from '../../../../core/is';
import { nanoid } from 'nanoid';
import { useRouter } from 'vue-router';
import { WindowEvent, WindowSize } from '../../../window/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  windowEvent?: WindowEvent,
  windowSize: WindowSize
}>();

const searchKey = defineModel('searchKey', {
  required: true,
  default: ''
});
const searchProgress = defineModel('searchProgress', {
  required: true,
  default: 0
});

const { width, height } = props.windowSize;
const router = useRouter();
const message = useMessage();
const { options } = useSettingsStore();
const { addSearchKey, removeSearchKey, hasSearchKey, search: searchExecute } = useSearchStore();
const { searchkey: storeSearchkey } = storeToRefs(useSearchStore());
const search = (e: MouseEvent | KeyboardEvent, val: string) => {
  if (e instanceof KeyboardEvent && e.code !== 'Enter') {
    return;
  }
  const key = val.trim();
  if (!key) {
    message.warning('请输入搜索关键字');
    return;
  }
  if (key.length < 2) {
    message.warning('搜索关键字少于2字');
    return;
  }
  const keys = key.split('&');
  const bookname = keys[0].trim();
  const author = (isUndefined(keys[1]) || keys[1].trim().length <= 0) ? null : keys[1].trim();
  if (bookname.length < 2) {
    message.warning('书名少于2字');
    return;
  }
  searchKey.value = key;
  if (!hasSearchKey('value', key)) {
    addSearchKey({
      id: nanoid(),
      searchkey: key,
      timestamp: Date.now()
    });
  }
  props.windowEvent?.hide();
  searchExecute(bookname, author, '', p => searchProgress.value = p);
  router.push(PagePath.SEARCH);
}

const deleteSearchkeyHistory = (e: MouseEvent, id: string) => {
  e.stopPropagation();
  if (!hasSearchKey('id', id)) {
    return;
  }
  removeSearchKey(id);
}

const searchInputRef = ref<InputInstance>();
onMounted(() => {
  setTimeout(() => searchInputRef.value?.focus(), 200);
});
</script>
<script lang="ts">
export default {
  name: 'SearchBox'
}
</script>
<template>
  <ElContainer id="search-box-container">
    <ElHeader id="search-box-header">
      <ElText v-once type="info" size="small">搜索</ElText>
      <ElInput ref="searchInputRef" v-memo="[searchKey]" v-model="searchKey" clearable placeholder="请输入书名、作者" @keyup="(e: KeyboardEvent) => search(e, searchKey)">
        <template #append>
          <ElButton :icon="IconSearch" @click="e => search(e, searchKey)" />
        </template>
      </ElInput>
      <ElText v-once type="info" size="small">精准搜索: 书名&作者</ElText>
    </ElHeader>
    <ElMain id="search-box-main">
      <div id="search-history">
        <ElText v-once type="info" size="small">搜索历史</ElText>
        <div id="search-history-box" :class="['rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
          <div v-if="storeSearchkey.length <= 0">
            <ElText v-once size="small" type="info">没有搜索历史</ElText>
          </div>
          <ul v-else>
            <li v-for="item in storeSearchkey" :key="item.id" @click="(e: MouseEvent) => search(e, item.searchkey)">
              <span v-memo="[item.searchkey]" :title="item.searchkey" class="rc-text-ellipsis">{{ item.searchkey }}</span>
              <i v-memo="[item.id]" @click="e => deleteSearchkeyHistory(e, item.id)">
                <IconSearchKeyDelete />
              </i>
            </li>
            <i v-once class="hide" />
            <i v-once class="hide" />
            <i v-once class="hide" />
          </ul>
        </div>
      </div>
    </ElMain>
  </ElContainer>
</template>

<style scoped lang="scss">
#search-box-header {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 7.5rem;

  &:deep(.el-input) {
    border-radius: .5rem;
    background-color: rgba(127, 127, 127, 0.1);

    .el-input__wrapper {
      padding: 0 .8rem;
      background-color: transparent;
      box-shadow: none;

      .el-input__inner {
        margin: .4rem 0;
        font-size: 1.3rem;
        height: 2rem;
        color: var(--rc-text-color);
        border-color: var(--rc-text-color);

        &::selection {
          background-color: rgba(127, 127, 127, 0.3);
        }
      }
    }

    .el-input-group__append {
      box-shadow: none;
      background-color: transparent;

      .el-icon {
        color: var(--rc-text-color);
      }
    }

  }
}

#search-box-main {
  #search-history {
    display: flex;
    flex-direction: column;
    align-items: center;

    #search-history-box {
      position: relative;
      margin-top: .5rem;
      margin-left: 2rem;
      width: calc(v-bind(width) - 2rem);
      height: calc(v-bind(height) - 7.5rem - 2rem - 4rem);
      font-size: 1.3rem;
      color: var(--rc-text-color);

      div {
        position: absolute;
        left: calc(50% - 1rem);
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.2rem;
      }

      ul {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        padding-right: 2rem;

        li {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: .4rem .5rem;
          margin-top: .5rem;
          width: calc((v-bind(width) - 2rem - .5rem) / 3 - 2.1rem);
          border-radius: .5rem;
          background-color: rgba(127, 127, 127, 0.08);

          &:nth-child(3n) {
            margin-right: 0;

          }

          span {
            width: calc((v-bind(width) - 2rem - .5rem) / 3 - 2.1rem);
          }

          i {
            display: none;
            align-items: center;
            transition: color 0.3s;

            &:hover {
              color: rgb(245, 108, 108);
            }
          }

          &:hover {
            cursor: pointer;

            span {
              width: calc((v-bind(width) - 2rem - .5rem) / 3 - 2.1rem - 1.4rem);
            }

            i {
              display: flex;
            }
          }

          &:active {
            transform: scale(0.95);
          }
        }
        i.hide {
          padding: .4rem .5rem;
          height: 0;
          width: calc((v-bind(width) - 2rem - .5rem) / 3 - 2.1rem);
        }
      }
    }
  }
}
</style>