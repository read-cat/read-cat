<script lang="ts" setup>
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import IconAdd from '../../../../assets/svg/icon-add.svg';
import IconDelete from '../../../../assets/svg/icon-delete.svg';
import {
  ElButton,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSelect,
  ElOption,
  ElInput,
  ElCheckboxGroup,
  ElCheckbox,
  ElInputNumber,
} from 'element-plus';
import { useTxtParseRuleStore } from '../../../../store/txt-parse-rules';
import { storeToRefs } from 'pinia';
import { useDefaultPagination } from '../../../../hooks/default-pagination';
import { useManager } from './hooks/manager';
import { Pattern, TxtParserType } from '../../../../core/book/txt-parser';
import { Text, Window, CloseButton } from '../../..';
import { useSettingsStore } from '../../../../store/settings';
import { isUndefined } from '../../../../core/is';

const { rules } = storeToRefs(useTxtParseRuleStore());

const {
  totalPage,
  showValue,
  currentPage,
  currentPageChange
} = useDefaultPagination(rules);

const {
  handleSelectionChange,
  removeRule,
  editRule,
  addRule,
  removeChecked,
  checkSelectable,
  ruleEditWindow,
  isEdit,
  ruleForm,
  saveRule,
} = useManager();

const { txtParse } = useSettingsStore();
</script>
<script lang="ts">
export default {
  name: 'SettingsTxtParseRule'
}
</script>

<template>
  <div class="settings-txt-parse-rule">
    <SettingsCard title="配置">
      <SettingsCardItem title="最大行数">
        <ElInputNumber v-model="txtParse.maxLines" @change="cur => txtParse.maxLines = Math.floor(isUndefined(cur) ? 300 : cur)"
          size="small" :value-on-clear="300" :min="100" :max="500" :step="1" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard :sticky="0">
      <template #header>
        <span class="title">管理</span>
        <div>
          <ElButton v-once title="添加" type="primary" size="small" circle :icon="IconAdd" @click="addRule" />
          <ElButton v-once title="删除" type="danger" size="small" circle :icon="IconDelete" @click="removeChecked" />
        </div>
      </template>
      <ElTable v-memo="[showValue]" :data="showValue" @selection-change="handleSelectionChange"
          empty-text="暂无解析规则">
          <ElTableColumn type="selection" width="30" :selectable="checkSelectable" />
          <ElTableColumn label="ID" width="100">
            <template #default="{ row }">
              <Text ellipsis :title="row.id" max-width="100%">{{ row.id }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型" width="90">
            <template #default="{ row }">
              <ElTag v-if="row.type === TxtParserType.BOOK_NAME">书名</ElTag>
              <ElTag v-else-if="row.type === TxtParserType.AUTHOR">作者</ElTag>
              <ElTag v-else-if="row.type === TxtParserType.INTRO">简介</ElTag>
              <ElTag v-else-if="row.type === TxtParserType.CHAPTER_LIST">章节列表</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="名称" width="100">
            <template #default="{ row }">
              <Text ellipsis max-width="100%" :title="row.name">{{ row.name }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="示例" width="150">
            <template #default="{ row }">
              <Text ellipsis max-width="100%" :title="row.example">{{ row.example }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" fixed="right">
            <template #default="{ row }">
              <template v-if="!row.builtIn">
                <ElButton link size="small" type="danger" @click="removeRule(row.id)">删除</ElButton>
                <ElButton link size="small" type="primary" @click="editRule(row.id)">编辑</ElButton>
              </template>
            </template>
          </ElTableColumn>
      </ElTable>
      <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" :page-count="totalPage"
        :current-page="currentPage" @current-change="currentPageChange" hide-on-single-page />
        <Window class-name="txt-parse-rule-edit-window" width="300" height="400" centerX centerY destroy-on-close :click-hide="false" :z-index="1000" @event="e => ruleEditWindow = e">
          <section>
            <header>
              <Text>{{ isEdit ? '编辑' : '添加' }}</Text>
              <CloseButton @click="ruleEditWindow?.hide()" />
            </header>
            <main>
              <ul>
                <li class="row">
                  <span>类型</span>
                  <ElSelect v-model="ruleForm.type">
                    <ElOption label="书名" :value="TxtParserType.BOOK_NAME" />
                    <ElOption label="作者" :value="TxtParserType.AUTHOR" />
                    <ElOption label="简介" :value="TxtParserType.INTRO" />
                    <ElOption label="章节列表" :value="TxtParserType.CHAPTER_LIST" />
                  </ElSelect>
                </li>
                <li class="row">
                  <span>名称</span>
                  <ElInput v-model="ruleForm.name" />
                </li>
                <li>
                  <span>示例</span>
                  <ElInput v-model="ruleForm.example" />
                </li>
                <li>
                  <span>规则(正则表达式)</span>
                  <ElInput v-model="ruleForm.value" type="textarea" resize="none" rows="3" />
                </li>
                <li>
                  <span>匹配模式</span>
                  <ElCheckboxGroup v-model="ruleForm.flags">
                    <ElCheckbox :value="Pattern.IGNORE_CASE" label="忽略大小写" />
                    <ElCheckbox :value="Pattern.MULTI_LINE" label="多行匹配" />
                    <ElCheckbox :value="Pattern.GLOBAL" label="全局匹配" />
                  </ElCheckboxGroup>
                </li>
              </ul>
            </main>
            <footer>
              <ElButton type="primary" @click="saveRule">{{ isEdit ? '保存' : '添加' }}</ElButton>
            </footer>
          </section>
        </Window>
    </SettingsCard>
  </div>
</template>
<style lang="scss">
.txt-parse-rule-edit-window {
  section {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    height: calc(100% - 20px);
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    main {
      ul {
        li {
          margin-bottom: 5px;
          span {
            font-size: 14px;
          }
          &.row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            span {
              display: inline-block;
              width: 40px;
            }
            .el-select,
            .el-input {
              width: calc(100% - 50px);
            }
          }
          .el-input {
            .el-input__wrapper {
              padding: 0 5px;
              height: 30px;
              .el-input__inner {
                height: 20px;
                line-height: 20px;
              }
            }
          }
          .el-textarea__inner {
            padding: 5px;
          }
          
        }
      }
    }
    footer {
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
<style scoped lang="scss">
.settings-txt-parse-rule {

  :deep(.el-table) {
    .el-table__cell {
      padding: 5px 0;
    }

    th.el-table__cell:is(.el-table-fixed-column--right),
    tr td:is(.el-table-fixed-column--right) {
      --el-table-tr-bg-color: var(--rc-card-bgcolor);
    }

    .rc-text {
      font-size: 12px;
    }
    td.el-table__cell div .el-button + .el-button {
      margin-left: 2px;
    }
    td.el-table__cell div {
      display: flex;
      align-items: center;
      font-size: 12px;
      padding: 0 0 0 10px;
    }
    .el-table__header-wrapper .cell {
      padding: 0 10px;
    }
  }
  :deep(.el-input) {
    height: 30px;

    .el-input__wrapper {
      cursor: default;
      .el-input__inner[type="number"] {
        height: 20px !important;
        font-size: 14px;
      }
    }
  }
}
</style>