import * as vscode from 'vscode';
import { getWebviewContent } from './webview/panel';

/**
 * 翻译助手 - 侧边栏 Webview View Provider
 * 将翻译界面嵌入 VSCode 侧边栏
 */
class TranslatorSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'translator.sidebar.view';

    constructor(private readonly context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = getWebviewContent(this.context);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            const webview = webviewView.webview;
            switch (message.command) {
                case 'translate':
                    await handleTranslate(message.text, webview, this.context);
                    break;
                case 'addDict':
                    addDictEntry(message.zh, message.en, this.context);
                    sendDict(webview, this.context);
                    break;
                case 'removeDict':
                    removeDictEntry(message.zh, this.context);
                    sendDict(webview, this.context);
                    break;
            }
        });
    }
}

// ==================== 翻译逻辑 ====================

const TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=';

async function handleTranslate(text: string, webview: vscode.Webview, context: vscode.ExtensionContext) {
    try {
        const dict = context.globalState.get<Record<string, string>>('customDict', {});

        // 1. 精确匹配词典
        let english = dict[text];

        // 2. 部分匹配：用词典中最长的匹配项替换输入中的对应部分
        if (!english) {
            let translated = text;
            const sortedEntries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
            for (const [zh, en] of sortedEntries) {
                if (translated.includes(zh)) {
                    translated = translated.replaceAll(zh, en);
                }
            }
            if (translated !== text) {
                english = translated;
            }
        }

        // 3. 在线翻译（如果还有中文，确保全部翻译）
        if (!english || /[\u4e00-\u9fff]/.test(english)) {
            const targetText = english || text;
            const response = await fetch(TRANSLATE_API + encodeURIComponent(targetText));
            const json = await response.json();
            english = json[0][0][0].trim();
        }

        // 生成 6 种命名格式
        const words = english.split(/[\s\-_]+/).filter(Boolean);
        const results = [
            { label: '小驼峰', value: camelCase(words) },
            { label: '大驼峰', value: pascalCase(words) },
            { label: '下划线', value: snakeCase(words) },
            { label: '大写下划线', value: upperSnakeCase(words) },
            { label: '短横线', value: kebabCase(words) },
            { label: 'Git 分支', value: `feature/${kebabCase(words)}` },
        ];

        webview.postMessage({ type: 'result', results });
    } catch {
        webview.postMessage({ type: 'error', msg: '翻译失败，请检查网络' });
    }
}

// ==================== 命名转换 ====================

function capitalize(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

function camelCase(words: string[]): string {
    return words[0].toLowerCase() + words.slice(1).map(capitalize).join('');
}

function pascalCase(words: string[]): string {
    return words.map(capitalize).join('');
}

function snakeCase(words: string[]): string {
    return words.map(w => w.toLowerCase()).join('_');
}

function upperSnakeCase(words: string[]): string {
    return words.map(w => w.toUpperCase()).join('_');
}

function kebabCase(words: string[]): string {
    return words.map(w => w.toLowerCase()).join('-');
}

// ==================== 词典操作 ====================

function addDictEntry(zh: string, en: string, context: vscode.ExtensionContext) {
    const dict = context.globalState.get<Record<string, string>>('customDict', {});
    dict[zh] = en;
    context.globalState.update('customDict', dict);
}

function removeDictEntry(zh: string, context: vscode.ExtensionContext) {
    const dict = context.globalState.get<Record<string, string>>('customDict', {});
    delete dict[zh];
    context.globalState.update('customDict', dict);
}

function sendDict(webview: vscode.Webview, context: vscode.ExtensionContext) {
    const dict = context.globalState.get<Record<string, string>>('customDict', {});
    webview.postMessage({ type: 'dict', data: dict });
}

// ==================== 扩展入口 ====================

export function activate(context: vscode.ExtensionContext) {
    const provider = new TranslatorSidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(TranslatorSidebarProvider.viewType, provider)
    );
}

export function deactivate() {}
