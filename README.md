# card2lore

纯前端（Vite + TypeScript）页面：上传酒馆角色卡（`.json` / `.png`），提取 `character_book`，输出并下载三种 JSON：
- raw worldbook（原始结构）
- legacy world_info（SillyTavern 旧版兼容结构）
- RikkaHub native（`type: "lorebook"`，可直接在 RikkaHub 导入）

支持：
- 点击选择文件或拖拽上传
- 下载 Raw/Legacy/RikkaHub Native JSON
- 一键复制 Raw/Legacy JSON 到剪贴板

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm test
```

## Manual Acceptance Checklist

1. 上传含 `data.character_book` 的 `.json` 角色卡，确认页面显示条目数，且可下载三种 JSON。
2. 上传含 `tEXt/chara` 的 `.png` 角色卡，确认同样可下载三种 JSON。
3. 上传不含世界书的角色卡，确认报错 `NO_CHARACTER_BOOK` 且下载按钮禁用。
4. 点击“复制 Raw JSON”与“复制 Legacy JSON”，确认剪贴板内容正确。
5. 在移动端宽度（浏览器 DevTools 手机视图）验证上传、预览、下载、复制流程可用。
