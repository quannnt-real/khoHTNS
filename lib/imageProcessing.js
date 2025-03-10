import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Process and save uploaded image
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - URL path to the saved image
 */
export async function processAndSaveImage(buffer, filename) {
  const timestamp = Date.now();
  const extension = path.extname(filename);
  const baseFilename = path.basename(filename, extension);
  const newFilename = `${baseFilename}-${timestamp}.jpg`;
  const outputPath = path.join(uploadDir, newFilename);
  
  // Xử lý trong một bước với cấu hình tối ưu
  await sharp(buffer)
    .resize({
      width: 1280,
      height: 1280,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputPath);
  
  // Kiểm tra kích thước và giảm chất lượng nếu cần
  let fileStats = fs.statSync(outputPath);
  if (fileStats.size > 300 * 1024) {
    await sharp(buffer)
      .resize({ width: 1000, height: 1000, fit: 'inside' })
      .jpeg({ quality: 60, progressive: true })
      .toFile(outputPath);
  }
  
  return `/uploads/${newFilename}`;
}