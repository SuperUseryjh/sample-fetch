# sample-fetch

这是一个 Tampermonkey 用户脚本，旨在帮助用户从各种在线评测系统（Online Judge, OJ）页面中快速提取代码片段（通常是输入/输出样例），并将其发送到本地运行的 API 服务，以便创建新的题目。

## 功能特性

*   **多平台支持：** 兼容多个主流 OJ 平台，自动识别并提取页面上的代码样例。
*   **本地 API 集成：** 将提取到的样例数据和题目信息发送到本地 API 进行处理。
*   **简洁的用户界面：** 在页面上提供一个可拖动的图标按钮，点击即可触发抓取和发送操作。
*   **实时状态反馈：** 通过页面上的临时消息提示，显示操作进度和结果。
*   **智能题目信息填充：** 尝试自动抓取当前页面的 OJ 名称和题目名称。

## 支持的平台

*   **洛谷 (Luogu):** `luogu.com.cn`, `www.luogu.com.cn`
*   **核桃 OJ (HTOJ):** `htoj.com.cn`
*   **AtCoder:** `atcoder.jp`
*   **Codeforces:** `codeforces.com`

## 安装

本脚本需要：
* [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展程序。
* [OICPP](oicpp.mywwth.top) 本地处理样例

1.  **安装 Tampermonkey：** 如果你尚未安装，请根据你的浏览器（Chrome, Firefox, Edge 等）安装 Tampermonkey 扩展程序。
2.  **安装脚本：**
    *   点击 [fetch_tampermonkey.user.js](fetch_tampermonkey.user.js) 文件链接。
    *   Tampermonkey 会自动检测到这是一个用户脚本，并提示你安装。点击“安装”即可。

## 使用方法

1.  **访问支持的 OJ 页面：** 在浏览器中打开一个支持的 OJ 网站上的题目页面。
2.  **点击图标按钮：** 在页面的右上角，你会看到一个可拖动的 **`⬇️`** 图标按钮。点击它。
3.  **查看状态：** 脚本将自动提取页面上的样例和题目信息，并尝试发送到本地 API。操作过程中，页面右上角会显示一个临时状态消息（例如“正在提取代码并发送请求...”），并在操作完成后显示成功或失败信息。
    *   如果 OJ 或题目名称无法自动获取，或者没有找到可提取的 `<code>` 标签，会弹出警告并显示错误消息。

## 故障排除

*   **“请求失败: ... 请确认oicpp是否正在运行。”：** 这通常意味着你的本地 API 服务（`oicpp`）没有运行，或者运行在不同的端口。请检查你的 API 服务状态。
*   **按钮不显示或功能不正常：** 确保 Tampermonkey 扩展已启用，并且脚本已正确安装并处于活动状态。尝试刷新页面。

## 作者

Mr_Onion

## 许可证

[CC-BY-NC-SA-4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)
