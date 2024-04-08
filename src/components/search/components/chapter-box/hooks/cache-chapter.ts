import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../../../store/detail';
import { useTextContentStore } from '../../../../../store/text-content';
import { isNull } from '../../../../../core/is';

export const useCacheChapter = () => {
  const { currentDetailUrl, detailResult } = storeToRefs(useDetailStore());
  const { cache: _cache } = useTextContentStore();
  
  const cache = (index: number) => {
    if (isNull(currentDetailUrl.value) || isNull(detailResult.value)) {
      return;
    }
    const { pid, chapterList } = detailResult.value;
    _cache(pid, currentDetailUrl.value, chapterList, index);
  }

  return {
    cache,
  }
}