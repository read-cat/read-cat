<script setup lang="ts">
import { ElTree } from 'element-plus';
import { WindowEvent } from '../window/index.vue';
import { useBookmark } from './hooks/bookmark';

const props = defineProps<{
  windowEvent?: WindowEvent
}>();
const { bookmarkTree, currentChapterBookmarkId, nodeClick } = useBookmark(props.windowEvent);

</script>
<script lang="ts">
export default {
  name: 'Bookmark'
}
</script>

<template>
  <div class="container">
    <ElTree
      v-memo="[bookmarkTree]"
      :data="bookmarkTree"
      :props="{ children: 'children', label: 'label' }"
      node-key="id"
      empty-text="暂无书签"
      :default-expanded-keys="currentChapterBookmarkId ? [currentChapterBookmarkId] : void 0"
      @node-click="nodeClick"
    >
    </ElTree>
  </div>
</template>

<style scoped lang="scss">
.container {
  :deep(.el-tree) {
    --el-tree-node-hover-bg-color: var(--rc-button-hover-background-color);
    --el-fill-color-blank: none;

    &>.el-tree-node {
      background-color: transparent;
      &:focus {
        background-color: transparent;

        &>.el-tree-node__content {
          background-color: transparent;
        }
      }

      &>.el-tree-node__content {
        &:hover {
          background-color: transparent;
        }
      }
    }

    .el-tree-node__content {
      height: auto;
      transition: background-color 0.2s ease;

      span {
        text-wrap: wrap;
      }

      /* &:hover {
        background-color: var(--el-tree-node-hover-bg-color) !important;
      } */
    }

    .el-tree-node {
      border-radius: 5px;
      overflow: hidden;

    }

    .el-tree-node__children {
      & > .el-tree-node:focus > .el-tree-node__content {
        background-color: transparent;
      }
      .el-tree-node__content:hover {
        background-color: var(--el-tree-node-hover-bg-color) !important;
      }
    }

  }
}
</style>