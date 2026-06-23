# CodeNames

中英文翻译 & 命名格式生成助手

## 功能

- 🌐 输入中文，一键生成 6 种常用命名格式（小驼峰、大驼峰、下划线、大写下划线、短横线、Git 分支）
- 📖 自定义词典，支持精确匹配和部分匹配
- 📋 侧边栏快速访问，无需打开网页
- 🎨 适配 VSCode 主题色
- ⚙️ 翻译源可切换：默认 Google（免 key），配置后自动切换为百度翻译（国内更稳定）

## 使用

点击 VSCode 活动栏的 CodeNames 图标打开侧边栏，输入中文即可生成命名格式。

## 自定义词典

在侧边栏底部的"自定义词典"区域：
- 添加：填写中文和英文，点击"添加"
- 删除：点击词条旁的"删除"按钮
- 点击词条可以快速填入输入框

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

## 许可

MIT License
