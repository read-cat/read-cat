import { Ref, reactive, ref } from 'vue';
import { WindowEvent } from '../../../../window/index.vue';
import { BackgroundSize, ReadBackground } from '../../../../../core/window/default-read-style';
import { nanoid } from 'nanoid';
import { useReadColorStore } from '../../../../../store/read-color';
import { useMessage } from '../../../../../hooks/message';
import { cloneByJSON, newError } from '../../../../../core/utils';
import { showOpenFileDialog } from '../../../../../core/utils/file';

type Target = keyof ReadBackground | 'bookmarkColor.odd' | 'bookmarkColor.even';

export const useReadColor = (win: Ref<WindowEvent | undefined>) => {
  const readColorForm = reactive<ReadBackground>({
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
  const colorInputRef = ref<HTMLInputElement>();
  const target = ref<Target>('backgroundColor');
  const isEdit = ref(false);
  const showEditBtn = ref(false);
  const { put, remove, imageMap } = useReadColorStore();
  const message = useMessage();

  const showColorPicker = (e: MouseEvent, t: Target) => {
    e.stopPropagation();
    target.value = t;
    let value = '';
    if (t.includes('bookmarkColor')) {
      const key = t.split('.')[1];
      value = Reflect.get(readColorForm.bookmarkColor, key);
    } else {
      value = Reflect.get(readColorForm, t)
    }
    if (!colorInputRef.value) {
      return;
    }
    colorInputRef.value.value = value.trim();
    colorInputRef.value.click();
  }
  const colorPickerOnInput = () => {
    if (!colorInputRef.value) {
      return;
    }
    let val = colorInputRef.value.value.trim();
    if (!val) {
      val = '#FFFFFF';
    }
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

  const showEditWindow = (e: MouseEvent, readColor: ReadBackground) => {
    e.stopPropagation();
    if (win.value?.isShow()) {
      return;
    }
    showEditBtn.value = false;
    const { id, name, backgroundColor, textColor, bookmarkColor, readAloudColor, backgroundImage } = readColor;
    readColorForm.id = id;
    readColorForm.name = name;
    readColorForm.backgroundColor = backgroundColor;
    readColorForm.textColor = textColor;
    readColorForm.bookmarkColor = bookmarkColor;
    readColorForm.readAloudColor = readAloudColor;
    readColorForm.backgroundImage = backgroundImage ? cloneByJSON(backgroundImage) : void 0;
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
    if (!readColorForm.backgroundImage) {
      const old = imageMap.get(readColorForm.id);
      old && URL.revokeObjectURL(old.url);
      imageMap.delete(readColorForm.id);
    }
    put({
      id: readColorForm.id,
      name: readColorForm.name,
      backgroundColor: readColorForm.backgroundColor,
      textColor: readColorForm.textColor,
      bookmarkColor: readColorForm.bookmarkColor,
      readAloudColor: readColorForm.readAloudColor,
      backgroundImage: readColorForm.backgroundImage ? {
        size: readColorForm.backgroundImage.size,
        image: readColorForm.backgroundImage.image,
        blur: readColorForm.backgroundImage.blur
      } : void 0
    }).catch(e => message.error(e.message)).finally(() => {
      win.value?.hide();
    });
  }
  const deleteCustomReadColor = () => {
    remove(readColorForm.id).catch(e => message.error(e.message)).finally(() => {
      win.value?.hide();
    });
  }

  const addBackgroundImage = () => {
    showOpenFileDialog({
      excludeAcceptAllOption: true,
      multiple: false,
      types: [{
        description: '图片文件',
        accept: {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        }
      }]
    }).then(async ([file]) => {
      if (await file.size() / 1024 /1024 > 1) {
        return Promise.reject(newError('图片文件大小超过1MB'));
      }
      const buffer = await file.buffer();
      const base64 = (file.type ? `data:${file.type};base64,` : '') + buffer.toString('base64');
      if (readColorForm.backgroundImage) {
        readColorForm.backgroundImage = {
          ...readColorForm.backgroundImage,
          image: base64
        };
      } else {
        readColorForm.backgroundImage = {
          size: BackgroundSize.STRETCH,
          image: base64,
        }
      }
    }).catch(e => {
      if (e.name === 'CanceledError') {
        return;
      }
      GLOBAL_LOG.error('read color addBackgroundImage', e);
      message.error(e.message);
    });
  }

  const removeBackgroundImage = () => {
    if (!readColorForm.backgroundImage) {
      return;
    }
    readColorForm.backgroundImage = void 0;
  }

  return {
    readColorForm,
    showColorPicker,
    colorPickerOnInput,
    isEdit,
    showEditBtn,
    showAddWindow,
    showEditWindow,
    putCustomReadColor,
    deleteCustomReadColor,
    addBackgroundImage,
    removeBackgroundImage,
    colorInputRef,
  }
}