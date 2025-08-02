# Meme图片管理

## 当前图片

项目当前使用以下本地meme图片（位于 `public/memes/` 文件夹）：

1. Screenshot 2025-08-02 at 15.43.04.png
2. Screenshot 2025-08-02 at 15.44.54.png
3. Screenshot 2025-08-02 at 15.47.39.png
4. Screenshot 2025-08-02 at 15.50.41.png
5. Screenshot 2025-08-02 at 15.52.21.png
6. Screenshot 2025-08-02 at 15.53.30.png

## 如何添加新的Meme图片

### 方法1：直接添加图片

1. 将新的图片文件放入 `public/memes/` 文件夹
2. 在 `utils/memeLoader.ts` 文件中的 `MEME_FILES` 数组里添加新图片的文件名

例如：

```typescript
const MEME_FILES = [
  "Screenshot 2025-08-02 at 15.43.04.png",
  "Screenshot 2025-08-02 at 15.44.54.png",
  // ... 其他图片
  "your-new-meme.jpg", // 添加新图片
];
```

### 方法2：使用工具函数

你也可以使用 `addMemeFile()` 函数来动态添加新图片：

```typescript
import { addMemeFile } from "~~/utils/memeLoader";

// 添加新的meme图片
addMemeFile("your-new-meme.jpg");
```

## 支持的图片格式

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)

## 注意事项

1. 图片文件名不能包含空格或特殊字符（除了连字符和下划线）
2. 建议图片尺寸保持一致，推荐 400x400 到 800x800 像素
3. 文件大小建议控制在 1MB 以内，以确保加载速度
4. 添加新图片后需要重启开发服务器

## 图片显示逻辑

- 每个图片会自动分配一个ID（从1开始）
- 标题格式：`Meme #[序号]`
- 描述格式：`这是第[序号]个表情包 - 给它投票吧！`

如果需要自定义标题和描述，可以修改 `utils/memeLoader.ts` 中的 `getLocalMemes()` 函数。
