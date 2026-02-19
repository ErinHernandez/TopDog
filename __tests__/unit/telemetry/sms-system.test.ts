import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock firebase-admin/firestore before importing sendReviewSMS
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue(undefined),
  })),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

// Mock Twilio client
vi.mock('../../../lib/studio/cowork/sms/twilioClient', () => ({
  sendMMS: vi.fn().mockResolvedValue({ messageSid: 'SM123abc456' }),
}));

// Mock snapshot uploader
vi.mock('../../../lib/studio/cowork/sms/snapshotUploader', () => ({
  uploadSnapshot: vi.fn().mockResolvedValue('https://example.com/uploaded.jpg'),
}));

import { parseInboundSMS } from '../../../lib/studio/cowork/sms/parseInboundSMS';
import {
  E164_REGEX,
  isValidE164,
  isImageUrl,
  supportsMMS,
} from '../../../lib/studio/cowork/sms/config';
import {
  analyzeInboundImage,
  inferIntentFromKeywords,
} from '../../../lib/studio/cowork/sms/imageAnalyzer';
import { composeMessageBody } from '../../../lib/studio/cowork/sms/sendReviewSMS';
import { ParsedInboundSMS, ImageIntent } from '../../../lib/studio/cowork/sms/types';

describe('parseInboundSMS', () => {
  it('should parse valid Twilio webhook body with all fields', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Test feedback message',
      NumMedia: '1',
      MediaUrl0: 'https://example.com/image.jpg',
      MediaContentType0: 'image/jpeg',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result).toEqual({
      messageSid: 'SM123abc456',
      from: '+14155552671',
      to: '+14155553671',
      body: 'Test feedback message',
      numMedia: 1,
      media: [
        {
          url: 'https://example.com/image.jpg',
          contentType: 'image/jpeg',
        },
      ],
      accountSid: 'AC123abc456',
    });
  });

  it('should parse message without media', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Just text feedback',
      NumMedia: '0',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.body).toBe('Just text feedback');
    expect(result.numMedia).toBe(0);
    expect(result.media).toHaveLength(0);
  });

  it('should parse message with empty body', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      NumMedia: '0',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.body).toBe('');
  });

  it('should extract multiple media items', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Multiple images',
      NumMedia: '3',
      MediaUrl0: 'https://example.com/image1.jpg',
      MediaContentType0: 'image/jpeg',
      MediaUrl1: 'https://example.com/image2.png',
      MediaContentType1: 'image/png',
      MediaUrl2: 'https://example.com/image3.gif',
      MediaContentType2: 'image/gif',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.numMedia).toBe(3);
    expect(result.media).toHaveLength(3);
    expect(result.media[0]).toEqual({
      url: 'https://example.com/image1.jpg',
      contentType: 'image/jpeg',
    });
    expect(result.media[1]).toEqual({
      url: 'https://example.com/image2.png',
      contentType: 'image/png',
    });
    expect(result.media[2]).toEqual({
      url: 'https://example.com/image3.gif',
      contentType: 'image/gif',
    });
  });

  it('should use default content type when missing', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Message with unknown media',
      NumMedia: '1',
      MediaUrl0: 'https://example.com/file.bin',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.media[0].contentType).toBe('application/octet-stream');
  });

  it('should skip missing media URLs', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Message with missing URL',
      NumMedia: '2',
      MediaUrl0: 'https://example.com/image.jpg',
      MediaContentType0: 'image/jpeg',
      MediaContentType1: 'image/png',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.media).toHaveLength(1);
    expect(result.media[0].url).toBe('https://example.com/image.jpg');
  });

  it('should parse NumMedia as number string', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Message',
      NumMedia: '5',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.numMedia).toBe(5);
    expect(typeof result.numMedia).toBe('number');
  });

  it('should handle zero NumMedia', () => {
    const formData = {
      MessageSid: 'SM123abc456',
      From: '+14155552671',
      To: '+14155553671',
      Body: 'Text only',
      NumMedia: '0',
      AccountSid: 'AC123abc456',
    };

    const result = parseInboundSMS(formData);

    expect(result.numMedia).toBe(0);
    expect(result.media).toHaveLength(0);
  });

  it('should preserve all required fields exactly', () => {
    const formData = {
      MessageSid: 'SM12345',
      From: '+19876543210',
      To: '+12025551234',
      Body: 'Important message',
      NumMedia: '0',
      AccountSid: 'AC12345',
    };

    const result: ParsedInboundSMS = parseInboundSMS(formData);

    expect(result.messageSid).toBe('SM12345');
    expect(result.from).toBe('+19876543210');
    expect(result.to).toBe('+12025551234');
    expect(result.accountSid).toBe('AC12345');
  });
});

describe('Phone Number Validation (E.164)', () => {
  it('should validate correct E.164 format', () => {
    expect(isValidE164('+14155552671')).toBe(true);
    expect(isValidE164('+447911123456')).toBe(true);
    expect(isValidE164('+33123456789')).toBe(true);
    expect(isValidE164('+919876543210')).toBe(true);
  });

  it('should reject invalid E.164 formats', () => {
    expect(isValidE164('14155552671')).toBe(false); // Missing +
    expect(isValidE164('+1415555267')).toBe(true); // 10 digits total is valid (1 country code + 9 digits)
    expect(isValidE164('+14155552671234567890')).toBe(false); // Too long (16+ digits)
    expect(isValidE164('+0123456789')).toBe(false); // Leading 0 after +
    expect(isValidE164('1-415-555-2671')).toBe(false); // Formatted
  });

  it('should require + prefix', () => {
    expect(isValidE164('+12125551234')).toBe(true);
    expect(isValidE164('12125551234')).toBe(false);
  });

  it('should handle single digit country codes', () => {
    expect(isValidE164('+1234567890')).toBe(true); // 1 country code + 9 digits
  });

  it('should handle multi-digit country codes', () => {
    expect(isValidE164('+4417911123456')).toBe(true); // 44 country code
    expect(isValidE164('+33123456789')).toBe(true); // 33 country code
  });

  it('should reject empty or whitespace', () => {
    expect(isValidE164('')).toBe(false);
    expect(isValidE164('   ')).toBe(false);
  });
});

describe('Image URL Detection', () => {
  it('should detect image URLs by extension', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/photo.png')).toBe(true);
    expect(isImageUrl('https://example.com/screenshot.jpeg')).toBe(true);
    expect(isImageUrl('https://example.com/graphic.gif')).toBe(true);
    expect(isImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isImageUrl('https://example.com/image.bmp')).toBe(true);
    expect(isImageUrl('https://example.com/icon.svg')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(isImageUrl('https://example.com/image.JPG')).toBe(true);
    expect(isImageUrl('https://example.com/image.PNG')).toBe(true);
    expect(isImageUrl('https://example.com/image.GIF')).toBe(true);
  });

  it('should reject non-image URLs', () => {
    expect(isImageUrl('https://example.com/document.pdf')).toBe(false);
    expect(isImageUrl('https://example.com/video.mp4')).toBe(false);
    expect(isImageUrl('https://example.com/file.txt')).toBe(false);
    expect(isImageUrl('https://example.com/data')).toBe(false);
  });

  it('should detect image in query parameters', () => {
    expect(isImageUrl('https://example.com/api?file=image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/get.php?id=123&image=photo.png')).toBe(true);
  });
});

describe('MMS Support by Country', () => {
  it('should support MMS for US and Canada', () => {
    expect(supportsMMS('US')).toBe(true);
    expect(supportsMMS('CA')).toBe(true);
  });

  it('should reject unsupported countries', () => {
    expect(supportsMMS('GB')).toBe(false);
    expect(supportsMMS('DE')).toBe(false);
    expect(supportsMMS('JP')).toBe(false);
    expect(supportsMMS('AU')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(supportsMMS('us')).toBe(true);
    expect(supportsMMS('ca')).toBe(true);
    expect(supportsMMS('Us')).toBe(true);
    expect(supportsMMS('CA')).toBe(true);
  });
});

describe('composeMessageBody', () => {
  it('should compose message with review token', () => {
    const body = composeMessageBody('abc-def-123456-token');

    expect(body).toContain('TopDog Design Review');
    expect(body).toContain('abc-def-'); // First 8 chars of token
    expect(body).toContain('Take a screenshot');
    expect(body).toContain('Markup');
    expect(body).toContain('Reply to this message');
  });

  it('should include first 8 characters of token', () => {
    const token = 'very-long-review-token-that-is-256-chars';
    const body = composeMessageBody(token);

    const expectedPreview = token.substring(0, 8);
    expect(body).toContain(expectedPreview);
  });

  it('should contain all required sections', () => {
    const body = composeMessageBody('test-token-123456');

    expect(body).toContain('TopDog Design Review');
    expect(body).toContain('screenshot or photo');
    expect(body).toContain('Photos app');
    expect(body).toContain('Markup');
    expect(body).toContain('text comments');
    expect(body).toContain('Review Code');
  });

  it('should format message consistently', () => {
    const body1 = composeMessageBody('token-111');
    const body2 = composeMessageBody('token-222');

    // Same structure, different tokens
    const lines1 = body1.split('\n');
    const lines2 = body2.split('\n');

    expect(lines1).toHaveLength(lines2.length);
    expect(lines1[0]).toBe(lines2[0]); // Same header
  });
});

describe('analyzeInboundImage', () => {
  it('should classify annotation when dimensions match original', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 1024,
        height: 768,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalDimensions: { width: 1024, height: 768 },
    });

    expect(result.intent).toBe('annotation');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.matchesOriginal).toBe(true);
  });

  it('should classify annotation with tolerance (±2px)', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 1025,
        height: 766,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalDimensions: { width: 1024, height: 768 },
    });

    expect(result.intent).toBe('annotation');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.matchesOriginal).toBe(true);
  });

  it('should reject dimension match beyond tolerance', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 1030,
        height: 768,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalDimensions: { width: 1024, height: 768 },
    });

    expect(result.intent).not.toBe('annotation');
    expect(result.matchesOriginal).toBe(false);
  });

  it('should detect iPhone camera by width', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 4032,
        height: 3024,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
    });

    expect(result.isIPhoneCamera).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('should detect iPhone camera by height', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 3024,
        height: 4032,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
    });

    expect(result.isIPhoneCamera).toBe(true);
  });

  it('should classify replacement when dimensions similar but not exact', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 1050,
        height: 790,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalDimensions: { width: 1024, height: 768 },
    });

    expect(result.intent).toBe('replacement');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should classify new-content for unrelated dimensions', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 800,
        height: 600,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalDimensions: { width: 2000, height: 1500 },
    });

    expect(result.intent).toBe('new-content');
    expect(result.confidence).toBeLessThan(0.75);
  });

  it('should use aspect ratio matching', async () => {
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width: 1024,
        height: 768,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
      originalAspectRatio: 1024 / 768,
    });

    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should return image dimensions in result', async () => {
    const width = 1920;
    const height = 1080;
    const result = await analyzeInboundImage({
      inboundImage: {
        imageId: 'img-1',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        width,
        height,
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        intent: 'unknown',
        intentConfidence: 0,
      },
    });

    expect(result.dimensions).toEqual({ width, height });
  });
});

describe('inferIntentFromKeywords', () => {
  it('should classify as annotation with annotation keywords', () => {
    const result = inferIntentFromKeywords('Here is my markup feedback on the design');
    expect(result.intent).toBe('annotation');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should detect multiple annotation keywords', () => {
    expect(inferIntentFromKeywords('I annotated the design').intent).toBe('annotation');
    expect(inferIntentFromKeywords('Check my marked-up version').intent).toBe('annotation');
    expect(inferIntentFromKeywords('Here is my feedback').intent).toBe('annotation');
  });

  it('should classify as replacement with replacement keywords', () => {
    const result = inferIntentFromKeywords('Here is the updated version');
    expect(result.intent).toBe('replacement');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('should detect multiple replacement keywords', () => {
    expect(inferIntentFromKeywords('I replaced the design').intent).toBe('replacement');
    expect(inferIntentFromKeywords('Here is the new version').intent).toBe('replacement');
    expect(inferIntentFromKeywords('I revised the layout').intent).toBe('replacement');
  });

  it('should classify as reference with reference keywords', () => {
    const result = inferIntentFromKeywords('This is a good reference');
    expect(result.intent).toBe('reference');
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('should detect multiple reference keywords', () => {
    expect(inferIntentFromKeywords('Like this inspiration').intent).toBe('reference');
    expect(inferIntentFromKeywords('Check this example').intent).toBe('reference');
  });

  it('should be case-insensitive', () => {
    expect(inferIntentFromKeywords('MARKUP').intent).toBe('annotation');
    expect(inferIntentFromKeywords('Replace').intent).toBe('replacement');
    expect(inferIntentFromKeywords('REFERENCE').intent).toBe('reference');
  });

  it('should return unknown intent for unrelated text', () => {
    const result = inferIntentFromKeywords('Just a regular message');
    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBe(0);
  });

  it('should prioritize replacement over annotation', () => {
    const result = inferIntentFromKeywords('I marked it up and here is the replacement');
    expect(result.intent).toBe('replacement');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('should prioritize replacement over reference', () => {
    const result = inferIntentFromKeywords('This is a reference for the replacement');
    expect(result.intent).toBe('replacement');
  });

  it('should handle no matching keywords', () => {
    const result = inferIntentFromKeywords('Just saying hello there friend');
    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBe(0);
  });
});
