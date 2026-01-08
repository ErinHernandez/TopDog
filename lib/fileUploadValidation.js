/**
 * File Upload Validation
 * 
 * Validates file uploads for type, size, and content to prevent security issues.
 */

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  csv: {
    mimeTypes: ['text/csv', 'text/plain', 'application/csv'],
    extensions: ['.csv'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  json: {
    mimeTypes: ['application/json', 'text/json'],
    extensions: ['.json'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};

/**
 * Validate file type
 * @param {File} file - File object
 * @param {string} allowedType - Type from ALLOWED_FILE_TYPES
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFileType(file, allowedType = 'csv') {
  const config = ALLOWED_FILE_TYPES[allowedType];
  
  if (!config) {
    return {
      valid: false,
      error: `Invalid file type configuration: ${allowedType}`
    };
  }

  // Check file extension
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!config.extensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${config.extensions.join(', ')}`
    };
  }

  // Check MIME type
  if (file.type && !config.mimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed MIME types: ${config.mimeTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {string} allowedType - Type from ALLOWED_FILE_TYPES
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFileSize(file, allowedType = 'csv') {
  const config = ALLOWED_FILE_TYPES[allowedType];
  
  if (!config) {
    return {
      valid: false,
      error: `Invalid file type configuration: ${allowedType}`
    };
  }

  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate CSV file content
 * @param {string} csvContent - CSV file content
 * @returns {Object} { valid: boolean, error?: string, data?: Array }
 */
export function validateCSVContent(csvContent) {
  if (!csvContent || typeof csvContent !== 'string') {
    return {
      valid: false,
      error: 'Invalid CSV content'
    };
  }

  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return {
      valid: false,
      error: 'CSV file must contain at least a header row and one data row'
    };
  }

  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(csvContent)) {
      return {
        valid: false,
        error: 'CSV file contains potentially malicious content'
      };
    }
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim());
  
  if (headers.length === 0) {
    return {
      valid: false,
      error: 'CSV file must contain headers'
    };
  }

  // Parse data rows
  const data = [];
  const errors = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    data.push(row);
  }

  if (errors.length > 0 && errors.length === lines.length - 1) {
    return {
      valid: false,
      error: `All data rows have errors: ${errors[0]}`
    };
  }

  return {
    valid: true,
    data,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Comprehensive file validation
 * @param {File} file - File object
 * @param {string} allowedType - Type from ALLOWED_FILE_TYPES
 * @param {Object} options - Additional validation options
 * @returns {Promise<Object>} Validation result
 */
export async function validateFile(file, allowedType = 'csv', options = {}) {
  const { validateContent = false } = options;
  
  // Validate file type
  const typeValidation = validateFileType(file, allowedType);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, allowedType);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate content if requested
  if (validateContent && allowedType === 'csv') {
    try {
      const content = await readFileAsText(file);
      const contentValidation = validateCSVContent(content);
      return contentValidation;
    } catch (error) {
      return {
        valid: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  return { valid: true };
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content as text
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

/**
 * Get allowed file types configuration
 */
export function getAllowedFileTypes() {
  return ALLOWED_FILE_TYPES;
}

export default {
  validateFileType,
  validateFileSize,
  validateCSVContent,
  validateFile,
  getAllowedFileTypes,
};

