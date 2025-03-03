import { IncomingForm } from 'formidable';
import fs from 'fs';
import { processAndSaveImage } from '../../../lib/imageProcessing';

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse the incoming form data
  const form = new IncomingForm({
    keepExtensions: true,
    multiples: true,
  });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Get the image file
    const file = Array.isArray(files.image) ? files.image[0] : files.image; // 'image' is the field name in the form
    
    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Read the file buffer
    const fileBuffer = await fs.promises.readFile(file.filepath);
    
    // Process and save the image
    const imagePath = await processAndSaveImage(fileBuffer, file.originalFilename);
    
    // Clean up the temporary file
    await fs.promises.unlink(file.filepath);

    // Return the image path to be stored in the database
    return res.status(200).json({ imagePath });
  } catch (error) {
    console.error('Error processing image upload:', error);
    return res.status(500).json({ error: 'Error processing image upload' });
  }
}