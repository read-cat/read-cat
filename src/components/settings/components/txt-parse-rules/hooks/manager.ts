import { reactive, ref } from 'vue';
import { TxtParseRule, TxtParserType } from '../../../../../core/book/txt-parser';
import { useMessage } from '../../../../../hooks/message';
import { useTxtParseRuleStore } from '../../../../../store/txt-parse-rules';
import { ElMessageBox } from 'element-plus';
import { storeToRefs } from 'pinia';
import { cloneByJSON } from '../../../../../core/utils';
import { WindowEvent } from '../../../..';
import { nanoid } from 'nanoid';

export const useManager = () => {
  const checked = ref<string[]>([]);
  const message = useMessage();
  const { remove, put } = useTxtParseRuleStore();
  const { rules } = storeToRefs(useTxtParseRuleStore());
  const ruleForm = reactive<TxtParseRule>({
    id: '',
    name: '',
    value: '',
    example: '',
    type: TxtParserType.CHAPTER_LIST,
    flags: []
  });
  const ruleEditWindow = ref<WindowEvent>();
  const isEdit = ref(false);

  const handleSelectionChange = (val: TxtParseRule[]) => {
    checked.value = val.filter(v => !v.builtIn).map(v => v.id);
  }
  const checkSelectable = (val: TxtParseRule) => {
    return !val.builtIn;
  }
  const removeRule = (id: string) => {
    if (rules.value.findIndex(r => r.id === id) < 0) {
      message.warning(`找不到ID为:${id}的解析规则`);
      return;
    }
    ElMessageBox.confirm(`是否删除ID为:${id}的解析规则?`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(() => remove(id)).then(() => {
      message.success('已删除该解析规则');
    }).catch(e => {
      if (e === 'cancel') {
        return;
      }
      GLOBAL_LOG.error('remove txt parse rule id:', id, e);
      message.error(e.message);
    });
  }
  const editRule = (id: string) => {
    if (ruleEditWindow.value?.isShow()) {
      return;
    }
    const rule = rules.value.find(r => r.id === id);
    if (!rule) {
      message.warning(`找不到ID为:${id}的解析规则`);
      return;
    }
    const { id: _id, name, value, example, type, flags } = cloneByJSON(rule);
    ruleForm.id = _id;
    ruleForm.name = name;
    ruleForm.value = value;
    ruleForm.example = example;
    ruleForm.type = type;
    ruleForm.flags = flags;
    isEdit.value = true;
    ruleEditWindow.value?.show();
  }
  const addRule = () => {
    if (ruleEditWindow.value?.isShow()) {
      return;
    }
    ruleForm.id = nanoid();
    ruleForm.name = '';
    ruleForm.value = '';
    ruleForm.example = '';
    ruleForm.type = TxtParserType.CHAPTER_LIST;
    ruleForm.flags = [];
    isEdit.value = false;
    ruleEditWindow.value?.show();
  }
  const saveRule = () => {
    if (!ruleForm.name.trim()) {
      message.warning('名称不能为空');
      return;
    }
    if (!ruleForm.example.trim()) {
      message.warning('示例不能为空');
      return;
    }
    if (!ruleForm.value.trim()) {
      message.warning('规则不能为空');
      return;
    }
    put(ruleForm).then(() => {
      message.success(`已${isEdit.value ? '保存' : '添加'}该解析规则`);
      ruleEditWindow.value?.hide();
    }).catch(e => {
      message.error(e.message);
      GLOBAL_LOG.error('put txt parse rule', e);
    });
  }
  const removeChecked = () => {
    if (checked.value.length < 1) {
      message.warning('未选择解析规则');
      return;
    }
    ElMessageBox.confirm(`已选择${checked.value.length}条解析规则, 是否将其删除?`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      let error = 0;
      for (const id of checked.value) {
        await remove(id).catch(e => {
          GLOBAL_LOG.error('remove checked txt parse rule id:', id, e);
          error++;
        });
      }
      return Promise.resolve(error);
    }).then(error => {
      if (error) {
        message.info(`已删除${checked.value.length - error}条解析规则, ${error}条删除失败`);
        return;
      }
      message.success('已删除选择的解析规则');
    }).catch(e => {
      if (e === 'cancel') {
        return;
      }
      GLOBAL_LOG.error('remove checked txt parse rule', e);
      message.error(e.message);
    });
  }

  return {
    handleSelectionChange,
    removeRule,
    editRule,
    addRule,
    removeChecked,
    checkSelectable,
    ruleForm,
    ruleEditWindow,
    isEdit,
    saveRule,
  }
}