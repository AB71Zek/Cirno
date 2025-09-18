const sharp = require('sharp');

/**
 * Compress image to specific dimensions at 80% quality
 * @param {Buffer} inputBuffer - The input image buffer
 * @returns {Promise<Buffer>} - The compressed image buffer
 */
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer)
    .resize(1200, null, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 80,
      progressive: true
    })
    .toBuffer();
}

/**
 * Get image metadata without processing
 * @param {Buffer} inputBuffer - The input image buffer
 * @returns {Promise<Object>} - Image metadata
 */
async function getImageMetadata(inputBuffer) {
  return await sharp(inputBuffer).metadata();
}

/**
 * Validate image buffer and get basic info
 * @param {Buffer} inputBuffer - The input image buffer
 * @returns {Promise<Object>} - Validation result with metadata
 */
async function validateImage(inputBuffer) {
  try {
    const metadata = await getImageMetadata(inputBuffer);
    const fileSizeKB = inputBuffer.length / 1024;
    
    return {
      isValid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        sizeKB: fileSizeKB,
        aspectRatio: metadata.width / metadata.height
      }
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Convert image buffer to base64 with MIME type
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} mimeType - The MIME type of the image
 * @returns {Object} - Object with base64 data and MIME type
 */
function imageToBase64(imageBuffer, mimeType) {
  return {
    mimeType: mimeType,
    data: imageBuffer.toString('base64')
  };
}

module.exports = {
  compressImage,
  getImageMetadata,
  validateImage,
  imageToBase64
};
