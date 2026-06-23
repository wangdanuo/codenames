import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { getWebviewContent } from './webview/panel';

/**
 * 翻译助手 - 侧边栏 Webview View Provider
 * 将翻译界面嵌入 VSCode 侧边栏
 */
class TranslatorSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codenames.sidebar.view';

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
                case 'openExternal':
                    if (typeof message.url === 'string' && /^https?:\/\//.test(message.url)) {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    }
                    break;
            }
        });
    }
}

// ==================== 翻译逻辑 ====================

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=';
const BAIDU_TRANSLATE_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

function md5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

interface BaiduConfig { appid: string; secret: string; }

function getBaiduConfig(): BaiduConfig {
    const config = vscode.workspace.getConfiguration('codenames');
    return {
        appid: config.get<string>('baiduAppId', '').trim(),
        secret: config.get<string>('baiduSecret', '').trim(),
    };
}

async function translateByGoogle(text: string): Promise<string> {
    const response = await fetch(GOOGLE_TRANSLATE_API + encodeURIComponent(text));
    if (!response.ok) {
        throw new Error(`Google 翻译 HTTP ${response.status}`);
    }
    const json: unknown = await response.json();
    if (!Array.isArray(json) || !Array.isArray(json[0])) {
        throw new Error('Google 翻译返回数据格式异常');
    }
    const translated = (json[0] as unknown[])
        .map(seg => (Array.isArray(seg) && seg.length > 0 ? String(seg[0] ?? '') : ''))
        .join('')
        .trim();
    if (!translated) {
        throw new Error('Google 翻译返回为空');
    }
    return translated;
}

interface BaiduTransResult { dst?: string }
interface BaiduResponse { error_code?: string; error_msg?: string; trans_result?: BaiduTransResult[] }

async function translateByBaidu(text: string, appid: string, secret: string): Promise<string> {
    const salt = Date.now().toString();
    const sign = md5(appid + text + salt + secret);
    const params = new URLSearchParams({ q: text, from: 'zh', to: 'en', appid, salt, sign });
    const response = await fetch(BAIDU_TRANSLATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    const json = await response.json() as BaiduResponse;
    if (json.error_code) {
        throw new Error(`百度翻译错误 ${json.error_code}: ${json.error_msg || ''}`.trim());
    }
    if (!Array.isArray(json.trans_result) || json.trans_result.length === 0) {
        throw new Error('百度翻译返回数据格式异常');
    }
    const translated = json.trans_result.map(seg => seg.dst || '').join('').trim();
    if (!translated) {
        throw new Error('百度翻译返回为空');
    }
    return translated;
}

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

        // 3. 在线翻译（如果还有中文，确保全部翻译；配置了百度 key 则优先使用）
        if (!english || /[\u4e00-\u9fff]/.test(english)) {
            const targetText = english || text;
            const { appid, secret } = getBaiduConfig();
            if (appid && secret) {
                english = await translateByBaidu(targetText, appid, secret);
            } else {
                english = await translateByGoogle(targetText);
            }
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
    } catch (err) {
        const detail = err instanceof Error && err.message ? `: ${err.message}` : '';
        webview.postMessage({ type: 'error', msg: `翻译失败，请检查网络${detail}` });
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
