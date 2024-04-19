import { isFunction, isUndefined } from '../is';
import { PluginInterface } from './defined/plugins';
import { TextToSpeechEngine } from './defined/ttsengine';

export const isTTSEngine = (plugin: PluginInterface) => {
  const p = <TextToSpeechEngine>plugin.prototype;
  if (isUndefined(p.transform)) {
    throw 'Function [transform] not found';
  }
  if (!isFunction(p.transform)) {
    throw 'Property [transform] is not of function type';
  }
  if (isUndefined(p.getVoiceList)) {
    throw 'Function [getVoiceList] not found';
  }
  if (!isFunction(p.getVoiceList)) {
    throw 'Property [getVoiceList] is not of function type';
  }
}