import path from "path";
import fs from "fs";

export const getRootAssetPath = (relativePath: string): string => {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(__dirname, "../../", relativePath),
    path.resolve(__dirname, "../../../", relativePath)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
};

export const getFontPath = (fontFileName: string): string | null => {
  const resolved = getRootAssetPath(path.join("fonts", fontFileName));
  return fs.existsSync(resolved) ? resolved : null;
};

export const cleanupTempFiles = (): void => {
  const dirsToClean = [
    process.cwd(),
    __dirname,
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "src")
  ];
  const tempPatterns = [
    /^avatar.*\.png$/i,
    /^heart_.*\.png$/i,
    /^output-avatar\.png$/i,
    /^ping\.png$/i,
    /^temp-avatar-.*\.(tmp|jpg|png)$/i
  ];

  for (const dir of dirsToClean) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (tempPatterns.some(regex => regex.test(file))) {
        try {
          fs.unlinkSync(path.join(dir, file));
          console.log(`🧹 Removed leftover temp file: ${file}`);
        } catch (err: any) {
          console.warn(`⚠️ Failed to remove temp file ${file}:`, err?.message);
        }
      }
    }
  }
};
