export const cnRegCharList = '\u4e00-\u9fa5。，、？！；“”《》（）';

/** 中文正则 */
export const cnReg = new RegExp(`^[${cnRegCharList}]+$`);
