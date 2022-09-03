import { OrgTimestamp } from './ast';

const toString = Object.prototype.toString;
export const assign = Object.assign;
export const isString = (v: any) => toString.call(v) === '[object String]';
export const isArray = Array.isArray;

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
