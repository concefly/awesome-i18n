export declare type TranslatorFuncType = ((text: string, opt: {
    from: string;
    to: string;
    description?: string;
}) => Promise<{
    message: string;
}>);
