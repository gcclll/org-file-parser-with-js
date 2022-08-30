import { OrgTimestamp } from './ast';

export const isArray = Array.isArray;

export function matchTimestamp(timestamp: string): OrgTimestamp | string {
  const re =
    /((?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})|(?<week>\w{3})|(?<time>\d{2}:\d{2}(-\d{2}:\d{2})?)|(?<dein>[-+]\d+[wydm]))/gi;

  let result: OrgTimestamp = { year: '', month: '', day: '' };
  for (const match of timestamp.matchAll(re)) {
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
