# Google Cloud Vision API Setup

This guide will help you set up Google Cloud Vision API for your TopDog project.

## Prerequisites

1. Google Cloud Platform account
2. A Google Cloud project
3. Billing enabled on your project

## Step 1: Enable the Cloud Vision API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Cloud Vision API"
5. Click on "Cloud Vision API" and then click "Enable"

## Step 2: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `vision-api-service-account`
   - Description: `Service account for Cloud Vision API`
4. Click "Create and Continue"
5. For roles, add "Cloud Vision API User"
6. Click "Done"

## Step 3: Generate Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. The key file will be downloaded automatically

## Step 4: Set Up Authentication

### Option A: Environment Variables (Recommended for Production)

1. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

2. For Next.js deployment (Vercel, etc.), add this as an environment variable in your deployment platform.

### Option B: Service Account Key File (Development)

1. Place the downloaded JSON key file in your project (but don't commit it to git!)
2. Update the `lib/cloudVision.js` file to use the key file:

```javascript
const client = new vision.ImageAnnotatorClient({
  keyFilename: './path/to/your/service-account-key.json',
});
```

## Step 5: Add to .gitignore

Make sure to add the service account key to your `.gitignore`:

```
# Google Cloud credentials
*.json
!package.json
!package-lock.json
!firebase.json
!firestore.rules
!firestore.indexes.json
```

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/vision-demo`

3. Upload an image and test the analysis

## Usage Examples

### Basic Text Detection
```javascript
import { detectText } from '../lib/cloudVision';

const text = await detectText('./path/to/image.jpg');
console.log('Detected text:', text);
```

### Full Image Analysis
```javascript
import { analyzeImageFromBase64 } from '../lib/cloudVision';

const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
const results = await analyzeImageFromBase64(base64Image);
console.log('Analysis results:', results);
```

## API Endpoints

### POST /api/vision/analyze

Analyze an image using Cloud Vision API.

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "imageType": "image/jpeg",
  "analysisType": "full"
}
```

**Analysis Types:**
- `full` - Complete analysis (text, labels, faces, objects)
- `text` - Text detection only
- `document` - Document text detection
- `labels` - Label detection only
- `faces` - Face detection only
- `objects` - Object detection only

**Response:**
```json
{
  "success": true,
  "result": {
    "text": [...],
    "labels": [...],
    "faces": [...],
    "objects": [...]
  },
  "analysisType": "full"
}
```

## Cost Considerations

- Cloud Vision API charges per 1,000 images analyzed
- Text detection: $1.50 per 1,000 images
- Label detection: $1.50 per 1,000 images
- Face detection: $1.50 per 1,000 images
- Object detection: $1.50 per 1,000 images

Monitor your usage in the Google Cloud Console to avoid unexpected charges.

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure your service account key is properly configured
2. **API Not Enabled**: Ensure Cloud Vision API is enabled in your Google Cloud project
3. **Billing Not Enabled**: Cloud Vision API requires billing to be enabled
4. **Quota Exceeded**: Check your API quotas in the Google Cloud Console

### Error Messages

- `7 PERMISSION_DENIED`: Check service account permissions
- `8 RESOURCE_EXHAUSTED`: Check API quotas
- `3 INVALID_ARGUMENT`: Check image format and size

## Security Best Practices

1. Never commit service account keys to version control
2. Use environment variables for production deployments
3. Restrict service account permissions to minimum required
4. Regularly rotate service account keys
5. Monitor API usage and costs

## Integration with TopDog

The Cloud Vision API can be integrated into your TopDog application for:

- Analyzing uploaded player photos
- Extracting text from scanned documents
- Processing team logos and images
- Content moderation for user uploads
- OCR for processing printed materials

For specific integration examples, see the `ImageAnalyzer` component and API endpoint implementations. 