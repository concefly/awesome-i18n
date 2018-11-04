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
                test: /\.jsx?$/,
                use: 'ai18n-loader-js',
            },
            {
                test: /\.tsx?$/,
                use: 'ai18n-loader-ts',
            },
        ],
        reducer: 'ai18n-reducer',
        translator: 'ai18n-translator-google',
    };
}
exports.getDefaultConfig = getDefaultConfig;
