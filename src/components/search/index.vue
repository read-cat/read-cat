<script setup lang="ts">
import { ElIcon } from 'element-plus';
import Window, { WindowEvent, WindowSize } from '../window/index.vue';
import IconSearch from '../../assets/svg/icon-search.svg';
import IconOpenBook from '../../assets/svg/icon-open-book.svg';
import IconLoading from '../../assets/svg/icon-loading.svg';
import { useSearchStore } from '../../store/search';
import { PagePath } from '../../core/window';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../store/window';
import SearchBox from './components/search-box/index.vue';
import ChapterBox from './components/chapter-box/index.vue';
import { reactive, ref } from 'vue';
import { useHeaderStyle } from '../../hooks/header-style';


const win = useWindowStore();
const { currentPath, searchBoxHeaderText } = storeToRefs(win);

const searchKey = ref('');
const searchProgress = ref(0);
const { searchStyle } = useHeaderStyle(searchKey, searchProgress);

const { isRunningSearch } = storeToRefs(useSearchStore());

const winEvent = ref<WindowEvent>();
const showSearchBox = () => {
  if (win.disableShowSearchBox.get(win.currentPath)) {
    return;
  }
  winEvent.value?.show();
}

const winSize = reactive<WindowSize>({
  width: '400px',
  height: '500px'
});
</script>
<script lang="ts">
export default {
  name: 'Search'
}
</script>
<template>
  <div class="container" :style="{
    '--rc-search-border-color': searchStyle.borderColor,
    '--rc-search-bgcolor': searchStyle.backgroundColor,
    '--rc-theme-color': searchStyle.color,
    '--rc-search-box-bgcolor': searchStyle.boxBackgroundColor,
  }">
    <div id="search" @click="showSearchBox" v-memo="[currentPath, isRunningSearch, searchBoxHeaderText]">
      <div class="title">
        <IconOpenBook v-if="currentPath === PagePath.READ" />
        <ElIcon v-else-if="isRunningSearch && currentPath === PagePath.SEARCH" class="is-loading">
          <IconLoading />
        </ElIcon>
        <IconSearch v-else />
        <span>{{ searchBoxHeaderText }}</span>
      </div>
    </div>
    <Window :to-body="false" destroy-on-close :top="5" :width="winSize.width" :height="winSize.height" background-color="var(--rc-search-box-bgcolor)"
      @event="e => winEvent = e">
      <SearchBox v-if="currentPath !== PagePath.READ" v-model:search-key="searchKey" v-model:search-progress="searchProgress" :window-event="winEvent" :window-size="winSize" />
      <ChapterBox :window-event="winEvent" v-else />
    </Window>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  width: 100%;
  #search {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    width: calc(100% - 12px);
    height: 24px;
    color: var(--rc-theme-color);
    font-size: 12px;
    border: 1px solid var(--rc-search-border-color);
    border-radius: 5px;
    background-color: var(--rc-search-bgcolor);
    cursor: pointer;

    .title {
      display: flex;
      align-items: center;

      span {
        display: inline-block;
        margin-left: 5px;
        max-width: 270px;
        overflow: hidden;
        text-wrap: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>