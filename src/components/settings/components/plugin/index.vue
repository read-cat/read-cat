<script setup lang="ts">
import {
  ElInput,
  ElButton,
  ElInputNumber,
  ElTooltip,
  ElTable,
  ElTableColumn,
  ElCheckTag,
  ElPagination,
  ElPopover,
  ElTag,
  ElIcon
} from 'element-plus';
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { isUndefined } from '../../../../core/is';
import IconRedo from '../../../../assets/svg/icon-redo.svg';
import { usePlugin } from './hooks/plugin';
import { usePagination } from './hooks/pagination';
import { useSearch } from './hooks/search';
import { PluginType } from '../../../../core/plugins';
import IconLoading from '../../../../assets/svg/icon-loading.svg';
import IconImport from '../../../../assets/svg/icon-import.svg';
import IconDelete from '../../../../assets/svg/icon-delete.svg';
import IconUpdate from '../../../../assets/svg/icon-update.svg';
import IconSearch from '../../../../assets/svg/icon-search.svg';
import Window from '../../../../components/window/index.vue';
import { usePluginDevtools } from './hooks/plugin-devtools';

const { pluginDevtools } = useSettingsStore();
const {
  plugins,
  refresh,
  handleSelectionChange,
  toggleState,
  deletePlugin,
  updatePlugin,
  updateChecked,
  deleteChecked,
  importPlugin,
  importErrorList,
  importErrorWindow,
} = usePlugin();
const { searchkey, searchResult } = useSearch(plugins);
const {
  totalPage,
  showValue,
  currentPage,
  currentPageChange
} = usePagination(searchResult);

const {
  openPluginDevtoolsKit,
  start
} = usePluginDevtools();
</script>
<script lang="ts">
export default {
  name: 'SettingsPlugin'
}
</script>

<template>
  <div class="settings-plugin">
    <SettingsCard title="开发">
      <SettingsCardItem v-memo="[pluginDevtools.resourcePath]" title="工具包"
        class-name="settings-card-item-plugin-devtools-resource-path">
        <ElInput v-model="pluginDevtools.resourcePath" size="small" readonly placeholder="未导入工具包">
          <template #append>
            <ElButton @click="openPluginDevtoolsKit">导入</ElButton>
          </template>
        </ElInput>
      </SettingsCardItem>
      <SettingsCardItem v-memo="[pluginDevtools.port]" title="端口号">
        <ElInputNumber v-model="pluginDevtools.port"
          @change="cur => pluginDevtools.port = Math.floor(isUndefined(cur) ? 6028 : cur)" size="small"
          :value-on-clear="6028" :min="0" :max="65535" :step="1" />
      </SettingsCardItem>
      <SettingsCardItem v-once title="">
        <ElButton size="small" type="primary" @click="start">启动</ElButton>
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard>
      <template #header>
        <span v-once class="title">管理</span>
        <div style="display: flex; align-items: center;">
          <ElTooltip v-once effect="light" placement="bottom-start" content="导入" :show-after="1000">
            <ElButton circle size="small" type="warning" :icon="IconImport" @click="importPlugin" />
          </ElTooltip>
          <ElTooltip v-once effect="light" placement="bottom-start" content="刷新" :show-after="1000">
            <ElButton circle size="small" type="primary" :icon="IconRedo" @click="refresh" />
          </ElTooltip>
          <ElTooltip v-once effect="light" placement="bottom-start" content="删除" :show-after="1000">
            <ElButton circle size="small" type="danger" :icon="IconDelete" @click="deleteChecked" />
          </ElTooltip>
          <ElTooltip v-once effect="light" placement="bottom-start" content="更新" :show-after="1000">
            <ElButton circle size="small" type="success" :icon="IconUpdate" @click="updateChecked" />
          </ElTooltip>
          <ElInput v-memo="[searchkey]" class="settings-card-item-plugin-search-input" v-model="searchkey"
            clearable placeholder="请输入搜索关键字" :prefix-icon="IconSearch" />
        </div>
      </template>
      <ElTable v-memo="[showValue]" :data="showValue" height="260" @selection-change="handleSelectionChange"
        empty-text="暂无插件">
        <ElTableColumn type="selection" width="30" />
        <ElTableColumn label="ID" width="100">
          <template #default="{ row }">
            <ElTooltip effect="light" placement="bottom-start" :content="row.id">
              <span class="settings-card-item-plugin-label">{{ row.id }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类型" width="70">
          <template #default="{ row }">
            <ElTag v-if="row.type === PluginType.BOOK_SOURCE">书源</ElTag>
            <ElTag v-else-if="row.type === PluginType.BOOK_STORE">书城</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="分组" width="80">
          <template #default="{ row }">
            <ElTooltip effect="light" placement="bottom-start" :content="row.group">
              <span class="settings-card-item-plugin-label">{{ row.group }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="名称" width="90">
          <template #default="{ row }">
            <ElTooltip effect="light" placement="bottom-start" :content="row.name">
              <span class="settings-card-item-plugin-label">{{ row.name }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="70">
          <template #default="{ row }">
            <ElCheckTag class="settings-card-item-plugin-state-check-tag" :checked="row.enable" type="primary"
              @click="toggleState(row)">{{ row.enable ? '启用' : '禁用' }}</ElCheckTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="版本号" width="70">
          <template #default="{ row }">
            <ElIcon class="is-loading" v-if="row.updating">
              <IconLoading />
            </ElIcon>
            <ElTooltip v-else effect="light" placement="bottom-start" :content="row.version">
              <span class="settings-card-item-plugin-label">{{ row.version }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" fixed="right">
          <template #default="{ row }">
            <ElButton link size="small" type="danger" @click="deletePlugin(row)">删除</ElButton>
            <ElButton link size="small" type="success" @click="updatePlugin(row)">更新</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" :page-count="totalPage" :current-page="currentPage"
        @current-change="currentPageChange" hide-on-single-page />
    </SettingsCard>
    <Window width="400" height="400" center destroy-on-close :z-index="1000" @event="e => importErrorWindow = e">
      <p v-once style="margin: 5px 0;font-size: 12px; text-align: center; color: var(--rc-error-color)">插件导入失败列表</p>
      <ElTable v-memo="[importErrorList]" :data="importErrorList" height="380">
        <ElTableColumn label="文件名" width="150">
          <template #default="{ row }">
            <ElPopover trigger="hover" title="文件名" :content="row.name" width="200">
              <template #reference>
                <span class="settings-card-item-plugin-label">{{ row.name }}</span>
              </template>
            </ElPopover>
          </template>
        </ElTableColumn>
        <ElTableColumn label="错误原因" width="250">
          <template #default="{ row }">
            <ElPopover trigger="hover" title="错误原因" width="350">
              <template #reference>
                <span class="settings-card-item-plugin-label">{{ row.error }}</span>
              </template>
              <span style="color: var(--rc-error-color)">{{ row.error }}</span>
            </ElPopover>
          </template>
        </ElTableColumn>
      </ElTable>
    </Window>
  </div>
</template>
<style lang="scss">
.settings-card-item-plugin-search-input {
  margin-left: 10px;

  .el-input__wrapper {
    height: 25px;

    .el-input__inner {
      font-size: 12px;
      height: 15px !important;
    }
  }
}

.settings-card-item-plugin-label {
  display: inline-block;
  max-width: 100%;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-card-item-plugin-state-check-tag {
  padding: 5px 10px !important;
  font-size: 12px !important;
}

.settings-card-item-plugin-devtools-resource-path {
  width: 300px;

  .el-input {
    height: 25px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 15px !important;
      }

      * {
        cursor: default;
      }
    }
  }

}
</style>
<style scoped lang="scss">
.settings-plugin {
  .rc-button {
    width: 20px;
    height: 20px;
    border-radius: 5px;

    &:active {
      transform: scale(0.9);
    }
  }

  :deep(.el-table) {
    .el-table__cell {
      padding: 5px 0;
    }

    td.el-table__cell div {
      display: flex;
      align-items: center;
      font-size: 12px;
    }
  }
}
</style>