export const enum OrgErrorCodes {
  ERROR_BADGE_LESS_ARGS, // 至少要有 label 和 message, 如：<badge:label|message>
}

const errorMessages: Record<OrgErrorCodes, string> = {
  [OrgErrorCodes.ERROR_BADGE_LESS_ARGS]: '至少要有 label 和 message, 如：<badge:label|message>'
};

export function throwError(type: OrgErrorCodes) {
  const msg = `[${type}] ${errorMessages[type]}`
  throw new SyntaxError(String(msg))
}
