/** 中文正则 */
export const cnReg = /^[\u4e00-\u9fa5。，、？！；“”《》（）]+$/;

// 用 g flag 重新创建正则
export const cnRegGlobal = new RegExp(cnReg, 'g');
