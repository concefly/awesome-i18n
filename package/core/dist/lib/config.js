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
                use: 'awesome-i18n-loader-js',
            },
        ],
        reducer: 'awesome-i18n-reducer-icu',
        translator: 'awesome-i18n-translator-google',
    };
}
exports.getDefaultConfig = getDefaultConfig;
