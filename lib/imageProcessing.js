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
  
  // Process the image: resize to max 1280px and optimize
  await sharp(buffer)
    .resize({
      width: 1280,
      height: 1280,
      fit: 'inside', // Keep aspect ratio, don't exceed 1280px in any dimension
      withoutEnlargement: true // Don't enlarge if smaller than 1280px
    })
    .jpeg({ quality: 80 }) // Adjust quality to keep file size under 300KB
    .toFile(outputPath);
  
  // Check file size and reduce quality if needed
  let fileStats = fs.statSync(outputPath);
  let quality = 80;
  
  // If the file is still too large, reduce quality until it's under 300KB
  while (fileStats.size > 300 * 1024 && quality > 10) {
    quality -= 10;
    await sharp(buffer)
      .resize({
        width: 1280,
        height: 1280,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFile(outputPath);
    
    fileStats = fs.statSync(outputPath);
  }
  
  // Return the URL path for storing in the database
  return `/uploads/${newFilename}`;
}