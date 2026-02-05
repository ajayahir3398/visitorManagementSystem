const DATA_URI_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

export const normalizeBase64Image = (value, options = {}) => {
  if (!value) return null;

  const defaultMime = options.defaultMime || 'image/jpeg';
  const maxBytes = options.maxBytes || null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/\s+/g, '');

  // If it is a data URI, validate and extract base64
  if (DATA_URI_REGEX.test(cleaned)) {
    const commaIndex = cleaned.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid base64 image data');
    }
    const base64Part = cleaned.slice(commaIndex + 1);
    if (!BASE64_REGEX.test(base64Part)) {
      throw new Error('Invalid base64 image data');
    }
    if (maxBytes) {
      const approxBytes = Math.floor((base64Part.length * 3) / 4);
      if (approxBytes > maxBytes) {
        throw new Error('Image is too large');
      }
    }
    return cleaned;
  }

  // Otherwise treat as raw base64 and convert to data URI
  if (!BASE64_REGEX.test(cleaned)) {
    throw new Error('Invalid base64 image data');
  }

  if (maxBytes) {
    const approxBytes = Math.floor((cleaned.length * 3) / 4);
    if (approxBytes > maxBytes) {
      throw new Error('Image is too large');
    }
  }

  return `data:${defaultMime};base64,${cleaned}`;
};
