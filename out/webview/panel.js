"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
/**
 * 生成侧边栏 Webview 的 HTML 内容
 * 词典数据通过模板注入，避免额外的消息请求
 */
function getWebviewContent(context) {
    const dict = context.globalState.get('customDict', {});
    const dictJson = JSON.stringify(dict);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>翻译助手</title>
    <style>
        :root {
            --bg: var(--vscode-sideBar-background);
            --card-bg: var(--vscode-editor-background);
            --input-bg: var(--vscode-input-background);
            --border: var(--vscode-input-border, #ddd);
            --primary: var(--vscode-button-background);
            --primary-hover: var(--vscode-button-hoverBackground);
            --primary-fg: var(--vscode-button-foreground);
            --text: var(--vscode-foreground);
            --text-sub: var(--vscode-descriptionForeground);
            --radius: 8px;
            --shadow: 0 2px 8px rgba(0,0,0,.08);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 12px;
            font: 13px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--text);
        }

        h1 {
            margin: 0 0 12px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .card {
            background: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 12px;
            margin-bottom: 12px;
        }

        .card-title {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 12px;
            color: var(--text-sub);
        }

        textarea {
            width: 100%;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
            min-height: 60px;
        }

        textarea:focus {
            outline: none;
            border-color: var(--primary);
        }

        .btn-primary {
            width: 100%;
            padding: 10px 0;
            border: none;
            border-radius: 6px;
            background: var(--primary);
            color: var(--primary-fg);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 8px;
            transition: background 0.2s;
        }

        .btn-primary:hover {
            background: var(--primary-hover);
        }

        .result-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--input-bg);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 8px;
        }

        .result-left { flex: 1; }

        .result-label {
            font-size: 11px;
            color: var(--text-sub);
            text-transform: uppercase;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }

        .result-value {
            font-family: Menlo, Monaco, monospace;
            font-size: 13px;
            word-break: break-all;
        }

        .copy-btn {
            flex-shrink: 0;
            margin-left: 10px;
            padding: 4px 10px;
            font-size: 11px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text);
            cursor: pointer;
            transition: all 0.2s;
        }

        .copy-btn:hover {
            background: var(--primary);
            color: var(--primary-fg);
            border-color: var(--primary);
        }

        .copy-btn.copied {
            background: #2ea04380;
            border-color: #2ea043;
            color: #fff;
        }

        .hint {
            font-size: 11px;
            color: var(--text-sub);
            margin-top: 8px;
        }

        .small-btn {
            padding: 4px 10px;
            font-size: 11px;
            border-radius: 4px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text);
            cursor: pointer;
            transition: all 0.2s;
        }

        .small-btn:hover {
            background: var(--primary);
            color: var(--primary-fg);
            border-color: var(--primary);
        }

        .dict-item {
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dict-item:last-child {
            border-bottom: none;
        }

        .dict-item .dict-text {
            cursor: pointer;
            flex: 1;
        }

        .dict-item .dict-text:hover {
            color: var(--vscode-textLink-foreground);
        }

        .dict-item .remove-btn {
            padding: 2px 8px;
            font-size: 11px;
            border-radius: 4px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-sub);
            cursor: pointer;
            margin-left: 8px;
        }

        .dict-item .remove-btn:hover {
            background: #d32f2f30;
            border-color: #d32f2f;
            color: #d32f2f;
        }

        .dict-form {
            display: flex;
            gap: 6px;
            margin-bottom: 10px;
        }

        .dict-form input {
            flex: 1;
            padding: 6px 8px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 12px;
        }

        .dict-form input:focus {
            outline: none;
            border-color: var(--primary);
        }

        .empty-hint {
            font-size: 11px;
            color: var(--text-sub);
            text-align: center;
            padding: 12px 0;
        }
    </style>
</head>
<body>
    <h1>👽 翻译助手</h1>

    <div class="card">
        <span class="card-title">📝 输入中文</span>
        <textarea id="inp" placeholder="例如：用户登录页面重构"></textarea>
        <button class="btn-primary" id="btn">✨ 生成命名</button>
        <div class="hint">将自动生成 6 种常用命名格式</div>
    </div>

    <div id="out"></div>

    <div class="card">
        <span class="card-title">📖 自定义词典</span>
        <div class="dict-form">
            <input id="dict-zh" placeholder="中文" />
            <input id="dict-en" placeholder="英文" />
            <button class="small-btn" id="dict-add-btn">添加</button>
        </div>
        <div id="dict-list"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const inp = document.getElementById('inp');
        const btn = document.getElementById('btn');
        const out = document.getElementById('out');

        let currentResults = [];
        let currentDict = {};

        // HTML 转义，防止 XSS
        function escape(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // ==================== 翻译 ====================

        btn.onclick = () => {
            const text = inp.value.trim();
            if (!text) return;
            out.innerHTML = '<div class="card"><div class="hint">生成中...</div></div>';
            vscode.postMessage({ command: 'translate', text });
        };

        // ==================== 词典操作 ====================

        document.getElementById('dict-add-btn').onclick = () => {
            const zhEl = document.getElementById('dict-zh');
            const enEl = document.getElementById('dict-en');
            const zh = zhEl.value.trim();
            const en = enEl.value.trim();
            if (!zh || !en) return;
            vscode.postMessage({ command: 'addDict', zh, en });
            zhEl.value = '';
            enEl.value = '';
        };

        // ==================== 消息处理 ====================

        window.addEventListener('message', event => {
            const msg = event.data;

            if (msg.type === 'result') {
                currentResults = msg.results;
                renderResults(msg.results);
            }

            if (msg.type === 'error') {
                out.innerHTML = '<div class="card"><div class="hint">' + escape(msg.msg) + '</div></div>';
            }

            if (msg.type === 'dict') {
                currentDict = msg.data;
                renderDict();
            }
        });

        // ==================== 渲染结果 ====================

        function renderResults(results) {
            let html = '<div class="card">';
            for (let i = 0; i < results.length; i++) {
                const item = results[i];
                html += '<div class="result-item">'
                    + '<div class="result-left">'
                    + '<div class="result-label">' + escape(item.label) + '</div>'
                    + '<div class="result-value">' + escape(item.value) + '</div>'
                    + '</div>'
                    + '<button class="copy-btn" data-index="' + i + '">复制</button>'
                    + '</div>';
            }
            html += '</div>';
            out.innerHTML = html;
            bindCopyButtons();
        }

        function bindCopyButtons() {
            out.querySelectorAll('.copy-btn').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.index);
                    const text = currentResults[idx].value;
                    navigator.clipboard.writeText(text).then(() => {
                        btn.textContent = '已复制';
                        btn.classList.add('copied');
                        setTimeout(() => {
                            btn.textContent = '复制';
                            btn.classList.remove('copied');
                        }, 1500);
                    });
                };
            });
        }

        // ==================== 渲染词典 ====================

        function renderDict() {
            const list = document.getElementById('dict-list');
            const entries = Object.entries(currentDict);
            if (entries.length === 0) {
                list.innerHTML = '<div class="empty-hint">暂无自定义词典</div>';
                return;
            }
            let html = '';
            for (const [zh, en] of entries) {
                html += '<div class="dict-item">'
                    + '<span class="dict-text" data-zh="' + escape(zh) + '">' + escape(zh) + ' → ' + escape(en) + '</span>'
                    + '<button class="remove-btn" data-zh="' + escape(zh) + '">删除</button>'
                    + '</div>';
            }
            list.innerHTML = html;
            bindDictEvents();
        }

        function bindDictEvents() {
            const list = document.getElementById('dict-list');
            // 点击词条填入输入框
            list.querySelectorAll('.dict-text').forEach(el => {
                el.onclick = () => {
                    inp.value = el.dataset.zh;
                    inp.focus();
                };
            });
            // 删除按钮
            list.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = () => {
                    vscode.postMessage({ command: 'removeDict', zh: btn.dataset.zh });
                };
            });
        }

        // ==================== 初始化 ====================

        currentDict = ${dictJson};
        renderDict();
        inp.focus();
    </script>
    <div style="text-align:center; margin-top:8px; font-size:10px; color:var(--text-sub);">v0.0.2</div>
</body>
</html>`;
}
