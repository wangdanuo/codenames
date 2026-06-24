# CodeNames

中英文翻译 & 命名格式生成助手

## 功能

- 🌐 输入中文，一键生成 7 种常用命名格式（小驼峰、大驼峰、下划线、大写下划线、短横线、Git 分支、Git 分支(带时间)）
- 📖 自定义词典，支持精确匹配和部分匹配
- ⚙️ 翻译源可切换：默认 Google（免 key），配置后自动切换为百度翻译（国内更稳定）
- 🐞 一键插入 `console.log`：光标停在变量上，按快捷键即可在下一行插入 `console.log`

## 自定义词典

用于把业务术语、专有名词等固定映射到指定英文，避免每次都依赖在线翻译。词条可在侧边栏底部维护。

## 翻译源

- **默认**：使用 Google 免费接口（`translate.googleapis.com`），无需任何配置，但国内网络可能不稳定
- **百度翻译**（推荐国内用户）：在 [百度翻译开放平台](https://api.fanyi.baidu.com/manage/developer) 注册并创建一个「**通用翻译**」类型的应用，获取 APP ID 与密钥后在 VSCode 设置中填入：
  - `codenames.baiduAppId`
  - `codenames.baiduSecret`

  填好后下次翻译即自动走百度翻译，面板底部会显示「当前：百度翻译」。

## 命名格式示例

输入：`用户登录页面`

| 格式 | 结果 |
|------|------|
| 小驼峰 | `userLoginPage` |
| 大驼峰 | `UserLoginPage` |
| 下划线 | `user_login_page` |
| 大写下划线 | `USER_LOGIN_PAGE` |
| 短横线 | `user-login-page` |
| Git 分支 | `feature/user-login-page` |
| Git 分支(带时间) | `feature/user-login-page-260624` |

## 一键插入 console.log

把光标放在变量名上，按下快捷键即可在下一行插入 `console.log`。

### 快捷键

| 平台 | 快捷键 | 说明 |
|------|--------|------|
| macOS | `⇧⌘L` | Shift + Command + L |
| Windows | `Shift+Ctrl+L` | |
| Linux | `Shift+Ctrl+L` | |

> ⚠️ 注意：原 `Cmd+L` 在 macOS 上是「扩展行选择」默认绑定，本扩展改用 `Shift+Cmd+L` 以避免冲突。
> 如果你已经在使用 `Shift+Cmd+L`，可在 `Preferences: Open Keyboard Shortcuts` 中搜索 `codenames.insertConsoleLog` 重新指派。

### 修饰键对照表

VSCode 的快捷键在 `package.json` 中统一用逻辑名声明，再分别映射到不同平台：

| 名称 | macOS | Windows | Linux |
|------|-------|---------|-------|
| `cmd` | ⌘ Command | — | — |
| `ctrl` | Control | Ctrl | Ctrl |
| `alt` | Option (⌥) | Alt | Alt |
| `shift` | Shift | Shift | Shift |
| `super` | ⌘ Command | Win | Super |

## 许可

MIT License
