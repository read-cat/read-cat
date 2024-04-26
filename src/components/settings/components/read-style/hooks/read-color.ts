import { Ref, reactive, ref } from 'vue';
import { WindowEvent } from '../../../../window/index.vue';
import { ReadColor } from '../../../../../core/window/default-read-style';
import { nanoid } from 'nanoid';
import { ColorPickerInstance } from 'element-plus';
import { useReadColorStore } from '../../../../../store/read-color';
import { useMessage } from '../../../../../hooks/message';

type Target = keyof ReadColor | 'bookmarkColor.odd' | 'bookmarkColor.even';

export const useReadColor = (win: Ref<WindowEvent | undefined>) => {
  const readColorForm = reactive<ReadColor>({
    id: '',
    name: '',
    backgroundColor: '',
    textColor: '',
    bookmarkColor: {
      odd: '',
      even: ''
    },
    readAloudColor: ''
  });
  const colorPickerModelValue = ref('');
  const colorPickerRef = ref<ColorPickerInstance>();
  const target = ref<Target>('backgroundColor');
  const isEdit = ref(false);
  const showEditBtn = ref(false);
  const { put, remove } = useReadColorStore();
  const message = useMessage();

  const showColorPicker = (e: MouseEvent, t: Target) => {
    e.stopPropagation();
    target.value = t;
    if (t.includes('bookmarkColor')) {
      const key = t.split('.')[1];
      colorPickerModelValue.value = Reflect.get(readColorForm.bookmarkColor, key);
    } else {
      colorPickerModelValue.value = Reflect.get(readColorForm, t)
    }
    colorPickerRef.value?.show();
  }
  const colorPickerActiveChange = (val: string | null) => {
    if (!val?.trim()) {
      val = '#FFFFFF';
    }
    val = val.trim();
    if (target.value.includes('bookmarkColor')) {
      const key = target.value.split('.')[1];
      Reflect.set(readColorForm.bookmarkColor, key, val);
      return;
    }
    Reflect.set(readColorForm, target.value, val);
  }

  const showAddWindow = () => {
    if (win.value?.isShow()) {
      return;
    }
    readColorForm.id = nanoid();
    readColorForm.name = '';
    readColorForm.backgroundColor = '#1A1C1D';
    readColorForm.textColor = '#AAAAB5';
    readColorForm.bookmarkColor = {
      odd: '#7B800A',
      even: '#AAAAB5'
    };
    readColorForm.readAloudColor = '#1E78EB';
    isEdit.value = false;
    win.value?.show();
  }

  const showEditWindow = (e: MouseEvent, readColor: ReadColor) => {
    e.stopPropagation();
    if (win.value?.isShow()) {
      return;
    }
    showEditBtn.value = false;
    const { id, name, backgroundColor, textColor, bookmarkColor, readAloudColor } = readColor;
    readColorForm.id = id;
    readColorForm.name = name;
    readColorForm.backgroundColor = backgroundColor;
    readColorForm.textColor = textColor;
    readColorForm.bookmarkColor = bookmarkColor;
    readColorForm.readAloudColor = readAloudColor;
    isEdit.value = true;
    win.value?.show();
  }

  const putCustomReadColor = () => {
    if (!readColorForm.name?.trim()) {
      message.warning('未设置名称');
      return;
    }
    if (!readColorForm.backgroundColor?.trim()) {
      message.warning('未设置背景颜色');
      return;
    }
    if (!readColorForm.textColor?.trim()) {
      message.warning('未设置文本颜色');
      return;
    }
    if (!readColorForm.bookmarkColor.odd?.trim()) {
      message.warning('未设置书签(odd)文本颜色');
      return;
    }
    if (!readColorForm.bookmarkColor.even?.trim()) {
      message.warning('未设置书签(even)文本颜色');
      return;
    }
    if (!readColorForm.readAloudColor?.trim()) {
      message.warning('未设置朗读文本颜色');
      return;
    }
    put(readColorForm).catch(e => message.error(e.message)).finally(() => {
      win.value?.hide();
    });
  }
  const deleteCustomReadColor = () => {
    remove(readColorForm.id).catch(e => message.error(e.message)).finally(() => {
      win.value?.hide();
    });
  }

  return {
    colorPickerModelValue,
    colorPickerRef,
    readColorForm,
    showColorPicker,
    colorPickerActiveChange,
    isEdit,
    showEditBtn,
    showAddWindow,
    showEditWindow,
    putCustomReadColor,
    deleteCustomReadColor,
  }
}