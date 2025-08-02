import { Meme } from "../app/meme-tinder/page";

// 本地meme图片文件名列表
const MEME_FILES = [
  "Screenshot 2025-08-02 at 15.43.04.png",
  "Screenshot 2025-08-02 at 15.44.54.png",
  "Screenshot 2025-08-02 at 15.47.39.png",
  "Screenshot 2025-08-02 at 15.50.41.png",
  "Screenshot 2025-08-02 at 15.52.21.png",
  "Screenshot 2025-08-02 at 15.53.30.png",
];

/**
 * 获取本地meme图片列表
 * @returns Meme数组
 */
export const getLocalMemes = (): Meme[] => {
  return MEME_FILES.map((filename, index) => ({
    id: index + 1,
    imageUrl: `/memes/${filename}`,
    title: `Meme #${index + 1}`,
    description: `这是第${index + 1}个表情包 - 给它投票吧！`,
  }));
};

/**
 * 检查本地图片是否存在
 * @param filename 图片文件名
 * @returns Promise<boolean>
 */
export const checkImageExists = async (filename: string): Promise<boolean> => {
  try {
    const response = await fetch(`/memes/${filename}`, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * 获取所有可用的本地meme图片
 * @returns Promise<Meme[]>
 */
export const getAvailableLocalMemes = async (): Promise<Meme[]> => {
  const availableMemes: Meme[] = [];

  for (let i = 0; i < MEME_FILES.length; i++) {
    const filename = MEME_FILES[i];
    const exists = await checkImageExists(filename);
    if (exists) {
      availableMemes.push({
        id: i + 1,
        imageUrl: `/memes/${filename}`,
        title: `Meme #${i + 1}`,
        description: `这是第${i + 1}个表情包 - 给它投票吧！`,
      });
    }
  }

  return availableMemes;
};

/**
 * 添加新的meme图片文件
 * @param filename 新图片文件名
 */
export const addMemeFile = (filename: string) => {
  if (!MEME_FILES.includes(filename)) {
    MEME_FILES.push(filename);
  }
};
