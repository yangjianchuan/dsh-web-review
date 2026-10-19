# dsh-web-review

[English](./README_en.md)

> ⭐ 如果这个项目对你有帮助，欢迎点个 Star 支持一下！你的支持是我持续维护和改进的动力。

在内置浏览器中，像使用设计工具一样选择页面元素、填写修改意见，并临时调整文本、颜色、字体、尺寸、间距、边框与效果。确认发送后，Agent 会结合页面批注修改当前工作区中的源码。

<p align="center">
  <img width="100%" alt="dsh-web-review 网页预览、元素批注与视觉调整演示" src="./docs/assets/web-review-demo.gif" />
</p>

<p align="center">
  <img width="49%" alt="dsh-web-review 网页预览" src="./docs/assets/web-review-preview.jpg" />
  <img width="49%" alt="dsh-web-review 元素批注与属性调整器" src="./docs/assets/web-review-annotation-editor.jpg" />
</p>

> 如果你用过 v0、Codex 等 Coding Agent 应用的内置浏览器，你应该对此会很熟悉。

## 安装

### 方式一：从 npm 安装（推荐）

安装并启动：

```sh
dsh plugin --profile web add @canglongcl/dsh-web-review
dsh web
```

### 方式二：从 GitHub 源码安装

克隆仓库并使用内置安装脚本将本地构建包安装到 DSH 指定 Profile：

```sh
# 1. 克隆仓库
git clone https://github.com/yangjianchuan/dsh-web-review.git
cd dsh-web-review

# 2. 安装依赖并构建插件包
pnpm install

# 3. 安装到 DSH profile（默认安装到 web profile）
pnpm install:dsh

# 4. 启动 DSH Web
dsh web
```

> **提示**：
> - `pnpm install:dsh` 会自动执行 `pnpm package:official` 生成官方包构件（`dist/package`），并通过 `dsh plugin --profile web add file:...` 将其挂载为 DSH Profile Bundle Layer。
> - 若需安装到其他 profile（如 `tui`），可执行 `pnpm install:dsh tui`。
> - 若当前已有运行中的 DSH Web 实例导致配置文件锁死（报 `拒绝访问` 或 `os error 5`），请先停止服务后再安装（例如 `& "$HOME\.dsh\start.ps1" -Action stop`）。详细说明见 [docs/local-dsh-install.md](./docs/local-dsh-install.md)。

### 更新插件

如果你是通过 GitHub 源码安装的，进入之前克隆的仓库，拉取最新代码并重新构建、安装：

```powershell
# 1. 进入之前克隆的仓库目录
cd dsh-web-review

# 2. 获取最新代码并安装更新
git pull
pnpm install
pnpm install:dsh

# 3. 重启 DSH Web，让新版本生效（标准方式）
# 先在运行 DSH Web 的终端按 Ctrl+C 停止服务，再执行：
dsh web
```

如果你的 Windows 环境使用本地服务管理脚本，也可以通过下面的命令重启：

```powershell
& "$HOME\.dsh\start.ps1" -Action restart
```

> **注意：** `pnpm install:dsh` 会重新构建官方插件包并安装到 `web` Profile，但不会自动重启 DSH Web。如果安装时提示清单文件访问被拒绝（Windows `os error 5`），请先停止 DSH Web，再安装并重新启动。更多说明见 [本地安装与验证指南](./docs/local-dsh-install.md)。

## 使用方法

1. 告诉启动要评审的前端页面，点击AI返回的地址页面。
   也可以切换到 DSH 的「网页预览」Tab，输入页面的绝对 HTTP(S) URL。
2. 点击批注按钮，再点击页面中的目标元素。
3. 填写修改意见；如需视觉调整，展开「调整」并修改属性。
4. 点击批注工具栏中的发送按钮，发送后会自动切回「对话」Tab；或在 DSH 的输入框中填写更多提示词，然后点击 DSH 发送按钮，注释会随着你的提示词一同发送。
5. Agent 修改源码后，刷新预览进行验收；不满意可以继续下一轮批注。

## 主要功能

### 网页预览

- 在 DSH 内打开 Agent 提供的链接页面

### 元素批注

- 悬停高亮并点选页面元素。
- 为多个目标添加批注。
- 自动附带选择器、文本、可访问名称和源码线索，帮助 Agent 找到对应实现。

### 实时视觉调整

- 修改文本、颜色、字体、字号、行高、尺寸和透明度。
- 调整间距、布局、边框、圆角和效果。
- 所有修改即时预览。

### AI 协作

- 批注会作为独立上下文随你的提示词注入。
- 对话中的页面批注沿用 DSH 原生折叠行：收起时显示页面与批注数，展开后只展示目标、修改意图、前后值和可用源码线索。
- Agent 根据批注修改当前工作区源码，页面中的临时调整不会直接写入工程。

### `dsh-better-sidebar`集成

安装 [dsh-better-sidebar](https://www.npmjs.com/package/dsh-better-sidebar) 后，网页预览会自动在侧边栏中打开。你也可以在侧边栏新建 `tab` 菜单中打开`网页预览`以启用。

### UI 优化 Skills

插件内置了 [Jakub Krehel 的设计 Skills](https://github.com/jakubkrehel/skills)：

- `better-ui`
- `better-typography`
- `better-layout`
- `better-writing`
- `better-accessibility`
- `better-colors`
- `better-interface`
- `interface-review`

你可以通过斜杠命令调用 skill，也可以在批注编辑器中选择，让 Agent 在本轮修改中参考相应规则。

## 插件能力评测

项目包含一套面向真实使用流程的评测，用于验证 Agent 在收到插件生成的页面批注后，能否正确定位源码并完成前端修改。

评测覆盖：

- 文案、样式、布局和响应式修改。
- 多元素与多项关联修改。
- React、Vue 和静态页面。
- 源码锚点可用及缺失时的定位。
- 语义化与无障碍要求。
- 多轮批注和修改范围判断。
- Token 使用量、执行步骤和运行耗时。

评测设计、运行方式和结果解释见 [Eval suite](./eval/README.md)。

## 参与开发

开发环境、架构说明与验证流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

版本变更记录见 [CHANGELOG.md](./CHANGELOG.md)。
