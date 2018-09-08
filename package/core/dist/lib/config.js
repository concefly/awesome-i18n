"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getDefaultConfig() {
    return {
        input: '.',
        output: './i18n',
        defaultLang: 'zh-cn',
        langs: ['zh-cn', 'en'],
        loader: [
            {
                test: /\.js$/,
                use: 'ai18n-loader-js',
            },
        ],
        reducer: 'ai18n-reducer-icu',
        translator: 'ai18n-translator-google',
    };
}
exports.getDefaultConfig = getDefaultConfig;
