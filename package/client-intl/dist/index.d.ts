export interface MessageType {
    [key: string]: string;
}
/**
 * 创建多语言 api
 */
export declare const createIntl: (opt: {
    message: MessageType;
    lang: string;
}, assignTo?: any) => {
    __: (text: string, description?: string, values?: any) => string;
    __define: (_text: string, _description?: string) => any;
};
