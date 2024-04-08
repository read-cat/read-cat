import { isDate, isNull } from '../is';

/**
 * 日期转换
 * @param timestamp 时间戳
 * @param format 输出格式
 */
export function format(timestamp: number, format: string): string;
/**
 * 日期转换
 * @param date 日期
 * @param format 输出格式
 */
export function format(date: Date, format: string): string;

export function format(date: any, format: string): string {
  let temp: Date = date;
  if (!isDate(date)) {
    temp = new Date(date);
  }
  const o: any = {
    'M+': temp.getMonth() + 1,
    'd+': temp.getDate(),
    'H+': temp.getHours(),
    'm+': temp.getMinutes(),
    's+': temp.getSeconds(),
    'q+': Math.floor((temp.getMonth() + 3) / 3),
    'S': temp.getMilliseconds()
  }

  const match = /(y+)/.exec(format);
  if (!isNull(match)) {
    format = format.replace(match[1], (temp.getFullYear() + "").substring(4 - match[1].length));
  }

  for (const key in o) {
    const match = new RegExp(`(${key})`).exec(format);
    if (!isNull(match)) {
      format = format.replace(match[1], (match[1].length == 1) ? (o[key]) : (("00" + o[key]).substring(`${o[key]}`.length)));
    }
  }
  return format;
}