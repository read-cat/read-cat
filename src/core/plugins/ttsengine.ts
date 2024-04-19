import { isFunction, isUndefined } from '../is';
import { newError } from '../utils';
import { PluginInterface } from './defined/plugins';
import { TextToSpeechEngine } from './defined/ttsengine';

export const isTTSEngine = (plugin: PluginInterface) => {
  const p = <TextToSpeechEngine>plugin.prototype;
  if (isUndefined(p.transform)) {
    throw newError('Function [transform] not found');
  }
  if (!isFunction(p.transform)) {
    throw newError('Property [transform] is not of function type');
  }
  if (isUndefined(p.getVoiceList)) {
    throw newError('Function [getVoiceList] not found');
  }
  if (!isFunction(p.getVoiceList)) {
    throw newError('Property [getVoiceList] is not of function type');
  }
}