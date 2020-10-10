export const cnRegCharList = '\u4e00-\u9fa5。，、？！；“”《》（）';

/** @deprecated - 用 cnRegCharList 替代 */
export const cnReg = new RegExp(`^[${cnRegCharList}]+$`);
