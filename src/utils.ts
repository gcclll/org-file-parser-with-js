import { OrgTimestamp } from './ast';

const toString = Object.prototype.toString;
export const assign = Object.assign;
export const isString = (v: any): boolean =>
  toString.call(v) === '[object String]';
export const isRegExp = (v: any): boolean =>
  toString.call(v) === '[object RegExp]';
export const isArray = Array.isArray;
export const hasOwn = Object.prototype.hasOwnProperty;

export function matchTimestamp(timestamp: string): OrgTimestamp | string {
  const re =
    /((?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})|(?<week>\w{3})|(?<time>\d{2}:\d{2}(-\d{2}:\d{2})?)|(?<dein>[-+]\d+[wydm]))/gi;

  let result: OrgTimestamp = { year: '', month: '', day: '' };
  const matches = Array.from(timestamp.matchAll(re));
  for (const match of matches) {
    const gs = match.groups;
    if (gs) {
      Object.keys(gs).forEach((key) => {
        if (gs[key]) result[key as keyof OrgTimestamp] = gs[key];
      });
    }
  }

  const { year, month, day } = result;
  if (!year && !month && !day) {
    return timestamp.trim();
  }
  result.date =`${year}-${month}-${day}`
  if (result.time) {
    const [hour, minute, seconds] = result.time.split(':')
    assign(result, { hour, minute, seconds })
  }

  return result;
}

export function findIndex(
  list: Array<any>,
  callback: (element: any, index: number, list: Array<any>) => any,
  fromIndex: number = 0
) {
  return list.slice(fromIndex).findIndex(callback);
}

export function traverse(
  root: any,
  cb: (node: any, parent: any, i: number) => void
): void {
  const children = root.children;

  if (children?.length) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      cb(child, root, i);
      traverse(child, cb);
    }
  }
}

export function hasElement<T>(arr: T[], ele: T): boolean {
  return arr.indexOf(ele) > -1;
}

export function buildUrlParam(
  o: Record<string, string>,
  withSpace = false
): string {
  const params: string[] = [];

  for (let prop in o) {
    if (hasOwn.call(o, prop)) {
      const value = o[prop];
      if (value || withSpace) {
        params.push(`${prop}=${value || ''}`);
      }
    }
  }

  return params.join('&');
}

export const nonColorNames: Array<RegExp | string> = [/^https?/];
export function isNonColorNames(
  s: string,
  formats: Array<RegExp | string> = nonColorNames
): boolean {
  for (let i = 0; i < formats.length; i++) {
    const strOrRe = formats[i];

    if (isRegExp(strOrRe) && (strOrRe as RegExp).test(s)) {
      return true;
    }

    if (isString(strOrRe) && s.indexOf(strOrRe as string) !== 0) {
      return true;
    }
  }

  return false;
}

// 用来排除 color text 中特殊的文本，如：https://...
export function genColorRegFn(
  re: RegExp,
  formats: Array<RegExp | string> = nonColorNames
): (s: string) => boolean {
  return (s: string) => {
    s = s.trim();

    if (!re.test(s)) {
      return false;
    }

    return !isNonColorNames(s, formats);
  };
}

export function code2Str(code: number): string {
  return String.fromCharCode(code)
}

export function str2Code(ch: string): number {
  return ch.charCodeAt(0)
}
