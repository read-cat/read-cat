<script setup lang="ts">
import {
  ElContainer,
  ElHeader,
  ElText,
  ElInput,
  ElButton,
  ElMain,
  ElTooltip,
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
const { searchkey: storeSearchkey, addSearchKey, removeSearchKey, search: searchExecute } = useSearchStore();
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
  const has = storeSearchkey.filter(v => v.searchkey === key).length > 0;
  if (!has) {
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
  const i = storeSearchkey.findIndex(v => v.id === id);
  if (i < 0) {
    return;
  }
  removeSearchKey(id);
}

const searchInputRef = ref<InputInstance>();
onMounted(() => {
  setTimeout(() => searchInputRef.value?.focus(), 200);
})
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
            <li v-for="item in storeSearchkey" :key="item.id" @click="e => search(e, item.searchkey)">
              <ElTooltip v-memo="[item.searchkey]" effect="light" :show-after="1500" :content="item.searchkey">
                <span>{{ item.searchkey }}</span>
              </ElTooltip>
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
  height: 75px;

  &:deep(.el-input) {
    border-radius: 5px;
    background-color: rgba(127, 127, 127, 0.1);

    .el-input__wrapper {
      padding: 0 8px;
      background-color: transparent;
      box-shadow: none;

      .el-input__inner {
        margin: 4px 0;
        font-size: 13px;
        height: 20px;
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
      margin-top: 5px;
      margin-left: 20px;
      width: calc(v-bind(width) - 20px);
      height: calc(v-bind(height) - 75px - 20px - 40px);
      font-size: 13px;
      color: var(--rc-text-color);

      div {
        position: absolute;
        left: calc(50% - 10px);
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
      }

      ul {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        padding-right: 20px;

        li {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: 4px 5px;
          margin-top: 5px;
          // margin-right: 5px;
          width: calc((v-bind(width) - 20px - 5px) / 3 - 21px);
          border-radius: 5px;
          background-color: rgba(127, 127, 127, 0.08);

          &:nth-child(3n) {
            margin-right: 0;

          }

          span {
            display: inline-block;
            width: calc((v-bind(width) - 20px - 5px) / 3 - 21px);
            overflow: hidden;
            text-overflow: ellipsis;
            text-wrap: nowrap;
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
              width: calc((v-bind(width) - 20px - 5px) / 3 - 21px - 14px);
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
          padding: 4px 5px;
          height: 0;
          width: calc((v-bind(width) - 20px - 5px) / 3 - 21px);
        }
      }
    }
  }
}
</style>