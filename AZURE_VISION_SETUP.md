# Microsoft Azure Computer Vision API Setup

This guide will help you set up Microsoft Azure Computer Vision API for your TopDog project.

## Prerequisites

1. Microsoft Azure account
2. Azure subscription (free tier available)
3. Basic knowledge of Azure portal

## Step 1: Create Azure Account (if you don't have one)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign up for a free account (includes $200 credit and free services)
3. Complete the verification process

## Step 2: Create a Computer Vision Resource

1. Go to [Azure Portal](https://portal.azure.com/)
2. Click "Create a resource"
3. Search for "Computer Vision"
4. Select "Computer Vision" and click "Create"
5. Fill in the required information:
   - **Subscription**: Choose your subscription
   - **Resource group**: Create new or use existing
   - **Region**: Choose a region close to your users
   - **Name**: `topdog-vision-api` (or your preferred name)
   - **Pricing tier**: Choose "Free (F0)" for free tier
6. Click "Review + create" then "Create"

## Step 3: Get Your API Keys and Endpoint

1. Once the resource is created, go to the resource
2. In the left sidebar, click "Keys and Endpoint"
3. Copy the following:
   - **Key 1** (or Key 2)
   - **Endpoint** URL

## Step 4: Set Up Environment Variables

### For Development:

1. Create a `.env.local` file in your project root:
```bash
AZURE_COMPUTER_VISION_KEY=your_api_key_here
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
```

2. Add `.env.local` to your `.gitignore` (already done)

### For Production (Vercel, etc.):

1. Go to your deployment platform settings
2. Add environment variables:
   - `AZURE_COMPUTER_VISION_KEY`: Your API key
   - `AZURE_COMPUTER_VISION_ENDPOINT`: Your endpoint URL

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3001/azure-vision-demo`

3. Enter a test image URL and analyze it

## Azure Computer Vision Features

### Free Tier Limits (F0):
- **5,000 transactions per month**
- **20 calls per minute**
- **4MB image size limit**

### Available Features:

1. **OCR (Optical Character Recognition)**
   - Extract printed text from images
   - Support for multiple languages
   - High accuracy for clean text

2. **Read API**
   - Advanced document text extraction
   - Layout analysis
   - Handwriting recognition
   - Better for complex documents

3. **Object Detection**
   - Identify objects in images
   - Bounding box coordinates
   - Confidence scores

4. **Face Detection**
   - Detect faces in images
   - Age and gender estimation
   - Facial expression analysis

5. **Image Tagging**
   - Automatic tag generation
   - Confidence scores
   - Descriptive labels

6. **Image Description**
   - Natural language descriptions
   - Content summarization
   - Caption generation

## Usage Examples

### Basic OCR
```javascript
import { extractTextFromImage } from '../lib/azureVision';

const result = await extractTextFromImage('https://example.com/image.jpg');
console.log('Extracted text:', result.text);
```

### Full Image Analysis
```javascript
import { analyzeImage } from '../lib/azureVision';

const result = await analyzeImage('https://example.com/image.jpg');
console.log('Description:', result.description);
console.log('Tags:', result.tags);
console.log('Objects:', result.objects);
```

## API Endpoints

### POST /api/azure-vision/analyze

Analyze an image using Azure Computer Vision API.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "analysisType": "full"
}
```

**Analysis Types:**
- `full` - Complete analysis (description, tags, objects, faces, categories)
- `ocr` - Text extraction (printed text)
- `read` - Document text extraction (advanced OCR)
- `objects` - Object detection only
- `faces` - Face detection only
- `tags` - Image tagging only
- `description` - Image description only

**Response:**
```json
{
  "success": true,
  "result": {
    "description": { "captions": [...] },
    "tags": [...],
    "objects": [...],
    "faces": [...],
    "categories": [...]
  },
  "analysisType": "full"
}
```

## Cost Considerations

### Free Tier (F0):
- 5,000 transactions per month
- 20 calls per minute
- Perfect for development and small applications

### Paid Tiers:
- **S1**: $1 per 1,000 transactions
- **S2**: $0.80 per 1,000 transactions
- **S3**: $0.60 per 1,000 transactions

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Check your API key and endpoint
2. **Rate Limit Exceeded**: You're making too many requests
3. **Image Size Too Large**: Images must be under 4MB for free tier
4. **Invalid Image URL**: Make sure the URL is publicly accessible

### Error Messages:

- `401 Unauthorized`: Check your API key
- `429 Too Many Requests`: Rate limit exceeded
- `400 Bad Request`: Invalid image URL or format
- `413 Payload Too Large`: Image file too large

## Security Best Practices

1. Never commit API keys to version control
2. Use environment variables for all credentials
3. Rotate API keys regularly
4. Monitor usage in Azure portal
5. Set up alerts for usage limits

## Integration with TopDog

Azure Computer Vision can be integrated into your TopDog application for:

- **Player Photo Analysis**: Extract player names from photos
- **Document Processing**: OCR for scanned documents
- **Content Moderation**: Analyze uploaded images
- **Image Tagging**: Automatically tag team logos and player photos
- **Text Extraction**: Process printed materials and forms

## Monitoring and Analytics

1. **Azure Portal**: Monitor usage, costs, and performance
2. **Application Insights**: Track API calls and errors
3. **Cost Management**: Set up budgets and alerts
4. **Usage Analytics**: Understand your application patterns

## Next Steps

1. Test the API with sample images
2. Integrate into your TopDog application
3. Set up monitoring and alerts
4. Optimize for your specific use cases
5. Consider upgrading to paid tier if needed

For more information, visit the [Azure Computer Vision documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/). 