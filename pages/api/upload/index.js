import { IncomingForm } from 'formidable';
import fs from 'fs';
import { processAndSaveImage } from '../../../lib/imageProcessing';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sử dụng một mẫu nhỏ gọn hơn
  const form = new IncomingForm({
    keepExtensions: true,
    multiples: true,
  });

  try {
    // Tối ưu code xử lý form
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.image && (Array.isArray(files.image) ? files.image[0] : files.image);
    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    // console.log('Processing file:', file.originalFilename, 'type:', file.mimetype);

    // Đọc và xử lý ảnh
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const imagePath = await processAndSaveImage(fileBuffer, file.originalFilename);
    
    // Xóa file tạm
    await fs.promises.unlink(file.filepath).catch(console.error);

    return res.status(200).json({ imagePath });
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ 
      error: 'Error processing image upload', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}