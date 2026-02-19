import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useRef, useCallback } from 'react';

// ============================================================================
// Design System (matches wireframe page)
// ============================================================================

const MCM = {
  bg: '#0A0A0B',
  surface: '#141416',
  line: '#2A2A2E',
  lineActive: '#4A4A50',
  text: '#F0F0F0',
  textMuted: '#888888',
  textDim: '#555555',
  orange: '#FF6B4A',
  teal: '#4ECDC4',
  gold: '#F4B942',
  coral: '#FF8A80',
  sage: '#95D5B2',
};

// Get color for element type (matches wireframe page)
const getColorForType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'button': return MCM.orange;
    case 'textfield':
    case 'securefield': return MCM.teal;
    case 'text':
    case 'label': return MCM.gold;
    case 'image':
    case 'icon': return MCM.coral;
    case 'tab':
    case 'tabbar': return MCM.sage;
    case 'card': return MCM.teal;
    case 'progress': return MCM.orange;
    case 'badge': return MCM.gold;
    case 'list': return MCM.lineActive;
    case 'link': return MCM.textMuted;
    case 'checkbox': return MCM.lineActive;
    case 'segmented': return MCM.sage;
    case 'toggle': return MCM.teal;
    default: return MCM.lineActive;
  }
};

// ============================================================================
// Types
// ============================================================================

interface ExtractedElement {
  id: string;
  name: string;
  type: string;
  notes?: string;
  y: number;
  side: 'left' | 'right';
}

interface ExtractionResult {
  screenTitle: string;
  elements: ExtractedElement[];
  swiftCode: string;
  screenshotPreview: string;
  timestamp: number;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  swiftCode?: string;
  extractionResult?: ExtractionResult;
  error?: string;
}

// ============================================================================
// Extraction Logic
// ============================================================================

// Analyze screenshot and extract UI elements
async function analyzeScreenshot(
  imageBase64: string,
  prompt: string
): Promise<ExtractionResult> {
  // Try to call the vision API for real analysis
  try {
    const response = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: imageBase64,
        imageType: 'screenshot',
        analysisType: 'objects',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      // If we got real data, process it
      if (data.success && data.result) {
        return processVisionResult(data.result, imageBase64, prompt);
      }
    }
  } catch {
    // Fall back to simulated extraction
    console.info('Vision API unavailable, using simulated extraction');
  }
  
  // Simulated extraction based on common UI patterns
  return simulateExtraction(imageBase64, prompt);
}

// Process vision API result into extraction format
function processVisionResult(
  visionResult: unknown,
  imageBase64: string,
  prompt: string
): ExtractionResult {
  // Extract relevant info from vision API
  const objects = (visionResult as { objects?: Array<{ name: string; confidence: number; boundingPoly?: { normalizedVertices?: Array<{ y?: number }> } }> })?.objects || [];
  
  const elements: ExtractedElement[] = objects.map((obj, i) => ({
    id: `${i + 1}`,
    name: obj.name || `Element ${i + 1}`,
    type: inferElementType(obj.name),
    notes: prompt || undefined,
    y: obj.boundingPoly?.normalizedVertices?.[0]?.y || (0.1 + i * 0.12),
    side: i % 2 === 0 ? 'left' as const : 'right' as const,
  }));

  return {
    screenTitle: prompt || 'Extracted Screen',
    elements: elements.length > 0 ? elements : generateDefaultElements(),
    swiftCode: generateSwiftCode(elements, prompt),
    screenshotPreview: imageBase64,
    timestamp: Date.now(),
  };
}

// Infer SwiftUI element type from detected object name
function inferElementType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('button') || lowerName.includes('btn')) return 'Button';
  if (lowerName.includes('text') || lowerName.includes('label')) return 'Text';
  if (lowerName.includes('input') || lowerName.includes('field')) return 'TextField';
  if (lowerName.includes('image') || lowerName.includes('icon') || lowerName.includes('avatar')) return 'Image';
  if (lowerName.includes('list') || lowerName.includes('row')) return 'List';
  if (lowerName.includes('card') || lowerName.includes('container')) return 'Card';
  if (lowerName.includes('tab')) return 'TabBar';
  if (lowerName.includes('progress') || lowerName.includes('bar')) return 'Progress';
  if (lowerName.includes('badge')) return 'Badge';
  if (lowerName.includes('toggle') || lowerName.includes('switch')) return 'Toggle';
  return 'Card';
}

// Generate default elements when no detection available
function generateDefaultElements(): ExtractedElement[] {
  return [
    { id: '1', name: 'Header', type: 'Text', y: 0.08, side: 'left' },
    { id: '2', name: 'Content Card', type: 'Card', notes: 'Main content area', y: 0.25, side: 'left' },
    { id: '3', name: 'Action Button', type: 'Button', notes: 'Primary CTA', y: 0.45, side: 'right' },
    { id: '4', name: 'List Section', type: 'List', y: 0.60, side: 'left' },
    { id: '5', name: 'Navigation', type: 'TabBar', notes: 'Bottom nav', y: 0.92, side: 'right' },
  ];
}

// Simulated extraction for demo/fallback
function simulateExtraction(imageBase64: string, prompt: string): ExtractionResult {
  // Analyze prompt to generate contextual elements
  const lowerPrompt = prompt.toLowerCase();
  let screenTitle = 'Extracted Screen';
  let elements: ExtractedElement[] = [];

  if (lowerPrompt.includes('profile') || lowerPrompt.includes('settings') || lowerPrompt.includes('account')) {
    screenTitle = 'Profile Screen';
    elements = [
      { id: '1', name: 'Background Badge', type: 'Card', notes: 'Customization Coming Soon', y: 0.12, side: 'left' },
      { id: '2', name: 'Profile Header', type: 'Text', notes: 'Profile title', y: 0.20, side: 'left' },
      { id: '3', name: 'Subtitle', type: 'Text', notes: 'Manage your account settings', y: 0.24, side: 'right' },
      { id: '4', name: 'Payment Methods', type: 'List', notes: 'Lock icon', y: 0.32, side: 'left' },
      { id: '5', name: 'Rankings', type: 'List', notes: 'Chevron nav', y: 0.40, side: 'left' },
      { id: '6', name: 'Customization', type: 'List', notes: 'Gear icon', y: 0.48, side: 'right' },
      { id: '7', name: 'Autodraft Limits', type: 'List', notes: 'Chevron nav', y: 0.56, side: 'left' },
      { id: '8', name: 'Account Information', type: 'List', notes: 'Chevron nav', y: 0.64, side: 'right' },
      { id: '9', name: 'Deposit History', type: 'List', notes: 'Lock icon', y: 0.72, side: 'left' },
      { id: '10', name: 'Tab Bar', type: 'TabBar', notes: '5 tabs', y: 0.92, side: 'right' },
    ];
  } else if (lowerPrompt.includes('login') || lowerPrompt.includes('sign in')) {
    screenTitle = 'Sign In Screen';
    elements = [
      { id: '1', name: 'Logo', type: 'Image', y: 0.12, side: 'left' },
      { id: '2', name: 'Email Field', type: 'TextField', y: 0.30, side: 'left' },
      { id: '3', name: 'Password Field', type: 'SecureField', y: 0.42, side: 'left' },
      { id: '4', name: 'Sign In Button', type: 'Button', notes: 'Primary CTA', y: 0.58, side: 'right' },
      { id: '5', name: 'Forgot Password', type: 'Link', y: 0.70, side: 'right' },
    ];
  } else if (lowerPrompt.includes('draft') || lowerPrompt.includes('player')) {
    screenTitle = 'Draft Screen';
    elements = [
      { id: '1', name: 'Search Bar', type: 'TextField', y: 0.08, side: 'left' },
      { id: '2', name: 'Position Filter', type: 'Segmented', notes: 'ALL/QB/RB/WR/TE', y: 0.16, side: 'right' },
      { id: '3', name: 'Player List', type: 'List', y: 0.45, side: 'left' },
      { id: '4', name: 'Draft Button', type: 'Button', y: 0.80, side: 'right' },
      { id: '5', name: 'Timer Bar', type: 'Progress', y: 0.92, side: 'left' },
    ];
  } else {
    // Default extraction
    elements = generateDefaultElements();
    screenTitle = prompt || 'Extracted Screen';
  }

  return {
    screenTitle,
    elements,
    swiftCode: generateSwiftCode(elements, screenTitle),
    screenshotPreview: imageBase64,
    timestamp: Date.now(),
  };
}

// Generate Swift code from extracted elements
function generateSwiftCode(elements: ExtractedElement[], screenTitle: string): string {
  const structName = `${screenTitle.replace(/[^a-zA-Z0-9]/g, '')  }View`;
  
  const elementCode = elements.map(el => {
    switch (el.type) {
      case 'Button':
        return `            Button("${el.name}") {
                // Action
            }
            .buttonStyle(.borderedProminent)`;
      case 'TextField':
        return `            TextField("${el.name}", text: $${el.name.toLowerCase().replace(/\s/g, '')})
                .textFieldStyle(.roundedBorder)`;
      case 'SecureField':
        return `            SecureField("${el.name}", text: $${el.name.toLowerCase().replace(/\s/g, '')})
                .textFieldStyle(.roundedBorder)`;
      case 'Text':
        return `            Text("${el.name}")
                .font(.headline)`;
      case 'Image':
        return `            Image(systemName: "photo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: 100)`;
      case 'List':
        return `            // ${el.name}
            List {
                Text("Item 1")
                Text("Item 2")
            }
            .listStyle(.insetGrouped)`;
      case 'Card':
        return `            // ${el.name}
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(hex: "${MCM.surface}"))
                .frame(height: 120)
                .overlay(
                    Text("${el.notes || el.name}")
                        .foregroundStyle(.secondary)
                )`;
      case 'TabBar':
        return `            // ${el.name}
            TabView {
                Text("Tab 1").tabItem { Label("Home", systemImage: "house") }
                Text("Tab 2").tabItem { Label("Profile", systemImage: "person") }
            }`;
      case 'Progress':
        return `            // ${el.name}
            ProgressView(value: 0.6)
                .progressViewStyle(.linear)`;
      case 'Badge':
        return `            // ${el.name}
            Text("${el.notes || 'Badge'}")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.orange)
                .cornerRadius(4)`;
      case 'Segmented':
        return `            // ${el.name}
            Picker("Filter", selection: $selected) {
                Text("All").tag(0)
                Text("Option 1").tag(1)
                Text("Option 2").tag(2)
            }
            .pickerStyle(.segmented)`;
      default:
        return `            // ${el.name} (${el.type})
            Text("${el.name}")`;
    }
  }).join('\n\n');

  return `// Generated SwiftUI Component
// Screen: ${screenTitle}
// Elements: ${elements.length}

import SwiftUI

struct ${structName}: View {
    // State variables
    @State private var selected = 0
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
${elementCode}
            }
            .padding()
        }
        .background(Color(hex: "${MCM.bg}"))
    }
}

// Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    ${structName}()
}`;
}

// ============================================================================
// Main Page
// ============================================================================

export default function ExtractionPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sendingToWireframe, setSendingToWireframe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add files to state
  const addFiles = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedImage) {
      setSelectedImage(newImages[0]!.id);
    }
  }, [selectedImage]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );

    addFiles(files);
  }, [addFiles]);

  // Handle file select
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  }, [addFiles]);

  // Remove image
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImage === id) {
      setSelectedImage(images.find((img) => img.id !== id)?.id || null);
    }
  };

  // Process image - extract UI elements
  const processImage = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, status: 'processing' } : img
      )
    );

    try {
      // Convert image to base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(image.file);
      });

      // Perform extraction
      const extractionResult = await analyzeScreenshot(imageBase64, prompt);

      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { 
                ...img, 
                status: 'complete', 
                swiftCode: extractionResult.swiftCode,
                extractionResult 
              }
            : img
        )
      );
    } catch (error) {
      console.error('Extraction failed:', error);
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, status: 'error', error: 'Extraction failed' }
            : img
        )
      );
    }
  };

  // Send extraction result to wireframe page for review
  const sendToWireframe = async (imageData: UploadedImage) => {
    if (!imageData.extractionResult) return;
    
    setSendingToWireframe(true);
    
    // Store extraction in localStorage for wireframe page to pick up
    localStorage.setItem('pendingExtraction', JSON.stringify(imageData.extractionResult));
    
    // Navigate to wireframe page with flag indicating pending extraction
    await router.push('/dev/wireframe?review=pending');
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const selectedImageData = images.find((img) => img.id === selectedImage);

  return (
    <>
      <Head>
        <title>Screenshot → Swift | TopDog Dev</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: MCM.bg,
          color: MCM.text,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 32px',
            background: MCM.surface,
            borderBottom: `2px solid ${MCM.orange}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Atomic Logo */}
            <svg width={36} height={36} viewBox="0 0 36 36">
              <circle cx={18} cy={18} r={16} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
              <circle cx={18} cy={18} r={4} fill={MCM.orange} />
              {[0, 1, 2].map((i) => {
                const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
                const x = 18 + 12 * Math.cos(angle);
                const y = 18 + 12 * Math.sin(angle);
                return (
                  <g key={i}>
                    <line x1={18} y1={18} x2={x} y2={y} stroke={MCM.orange} strokeOpacity={0.4} />
                    <circle cx={x} cy={y} r={3} fill={MCM.orange} />
                  </g>
                );
              })}
            </svg>

            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4, color: MCM.text }}>
                EXTRACTION
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, color: MCM.textMuted }}>
                Screenshot → SwiftUI Code
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/dev/catalog"
              style={{
                fontSize: 11,
                color: MCM.teal,
                textDecoration: 'none',
                padding: '8px 16px',
                border: `1px solid ${MCM.teal}`,
                borderRadius: 6,
              }}
            >
              Catalog
            </Link>
            <Link
              href="/dev/wireframe"
              style={{
                fontSize: 11,
                color: MCM.orange,
                textDecoration: 'none',
                padding: '8px 16px',
                border: `1px solid ${MCM.orange}`,
                borderRadius: 6,
              }}
            >
              Wireframe →
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr 400px',
            minHeight: 'calc(100vh - 65px)',
          }}
        >
          {/* Left Panel - Image List */}
          <div
            style={{
              background: MCM.surface,
              borderRight: `1px solid ${MCM.line}`,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: MCM.textMuted,
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              SCREENSHOTS
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${MCM.line}`,
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = MCM.orange)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = MCM.line)}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: 24, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 12, color: MCM.textMuted }}>
                Drop screenshots here
              </div>
              <div style={{ fontSize: 10, color: MCM.textDim, marginTop: 4 }}>
                or click to browse
              </div>
            </div>

            {/* Image List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 4,
                    cursor: 'pointer',
                    background:
                      selectedImage === img.id ? `${MCM.orange}20` : 'transparent',
                    border:
                      selectedImage === img.id
                        ? `1px solid ${MCM.orange}`
                        : '1px solid transparent',
                  }}
                >
                  <Image
                    src={img.preview}
                    alt={img.name}
                    width={40}
                    height={40}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                    unoptimized
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: MCM.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {img.name}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color:
                          img.status === 'complete'
                            ? MCM.sage
                            : img.status === 'processing'
                            ? MCM.gold
                            : img.status === 'error'
                            ? MCM.coral
                            : MCM.textDim,
                      }}
                    >
                      {img.status === 'complete'
                        ? '✓ Extracted'
                        : img.status === 'processing'
                        ? '⟳ Processing...'
                        : img.status === 'error'
                        ? '✕ Error'
                        : 'Ready'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: MCM.textDim,
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 14,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    color: MCM.textDim,
                    fontSize: 11,
                  }}
                >
                  No screenshots yet
                </div>
              )}
            </div>
          </div>

          {/* Center Panel - Preview */}
          <div
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `
                linear-gradient(${MCM.line}22 1px, transparent 1px),
                linear-gradient(90deg, ${MCM.line}22 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          >
            {selectedImageData ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: MCM.textMuted,
                    marginBottom: 16,
                  }}
                >
                  {selectedImageData.name}
                </div>
                <Image
                  src={selectedImageData.preview}
                  alt={selectedImageData.name}
                  width={800}
                  height={600}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    borderRadius: 12,
                    boxShadow: `0 0 0 1px ${MCM.lineActive}, 0 20px 60px rgba(0,0,0,0.5)`,
                  }}
                  unoptimized
                />

                {/* Prompt Input */}
                <div style={{ width: '100%', maxWidth: 500, marginTop: 24 }}>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Optional: Describe what to extract (e.g., 'the login button')"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: MCM.surface,
                      border: `1px solid ${MCM.line}`,
                      borderRadius: 8,
                      color: MCM.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Extract Button */}
                <button
                  onClick={() => processImage(selectedImageData.id)}
                  disabled={selectedImageData.status === 'processing'}
                  style={{
                    marginTop: 16,
                    padding: '12px 32px',
                    background:
                      selectedImageData.status === 'processing'
                        ? MCM.lineActive
                        : MCM.orange,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      selectedImageData.status === 'processing'
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {selectedImageData.status === 'processing'
                    ? 'Extracting...'
                    : selectedImageData.status === 'complete'
                    ? 'Re-extract'
                    : 'Extract to SwiftUI'}
                </button>
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: MCM.textDim,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                <div style={{ fontSize: 14 }}>Select or upload a screenshot</div>
                <div style={{ fontSize: 11, marginTop: 8, color: MCM.textDim }}>
                  Screenshots will be converted to SwiftUI code
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Code Output */}
          <div
            style={{
              background: MCM.surface,
              borderLeft: `1px solid ${MCM.line}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: `1px solid ${MCM.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: MCM.textMuted,
                  letterSpacing: 1,
                }}
              >
                SWIFT OUTPUT
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedImageData?.swiftCode && (
                  <button
                    onClick={() => copyCode(selectedImageData.swiftCode!)}
                    style={{
                      background: MCM.teal,
                      color: MCM.bg,
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 12px',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Copy Code
                  </button>
                )}
              </div>
            </div>

            {/* Extracted Elements List - shows when extraction is complete */}
            {selectedImageData?.extractionResult && (
              <div
                style={{
                  borderBottom: `1px solid ${MCM.line}`,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: MCM.bg,
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: MCM.teal, letterSpacing: 1 }}>
                    EXTRACTED ELEMENTS
                  </div>
                  <div style={{ fontSize: 10, color: MCM.textMuted }}>
                    {selectedImageData.extractionResult.elements.length} found
                  </div>
                </div>
                <div style={{ padding: '0 12px 12px' }}>
                  {selectedImageData.extractionResult.elements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: MCM.bg,
                        borderRadius: 4,
                        marginBottom: 4,
                        border: `1px solid ${MCM.line}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: MCM.text }}>{el.name}</span>
                        {el.notes && (
                          <span style={{ fontSize: 9, color: MCM.textDim }}>— {el.notes}</span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: getColorForType(el.type),
                          padding: '2px 6px',
                          background: `${getColorForType(el.type)}20`,
                          borderRadius: 3,
                        }}
                      >
                        {el.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send to Wireframe Button - shows when extraction is complete */}
            {selectedImageData?.extractionResult && (
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${MCM.line}`,
                  background: `${MCM.orange}10`,
                }}
              >
                <button
                  onClick={() => sendToWireframe(selectedImageData)}
                  disabled={sendingToWireframe}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: sendingToWireframe ? MCM.lineActive : MCM.orange,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: sendingToWireframe ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {sendingToWireframe ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send to Wireframe →
                    </>
                  )}
                </button>
                <div style={{ fontSize: 10, color: MCM.textMuted, marginTop: 8, textAlign: 'center' }}>
                  Review extraction on wireframe page before adding
                </div>
              </div>
            )}

            {/* Swift Code Section */}
            <div
              style={{
                flex: 1,
                padding: 16,
                overflowY: 'auto',
              }}
            >
              {selectedImageData?.swiftCode ? (
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'SF Mono, Menlo, Monaco, monospace',
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: MCM.text,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedImageData.swiftCode}
                </pre>
              ) : selectedImageData?.status === 'processing' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: MCM.gold,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 24,
                        marginBottom: 8,
                        animation: 'spin 1s linear infinite',
                      }}
                    >
                      ⟳
                    </div>
                    <div style={{ fontSize: 12 }}>Analyzing screenshot...</div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: MCM.textDim,
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  {selectedImageData
                    ? 'Click "Extract to SwiftUI" to generate code'
                    : 'Select a screenshot to see generated code'}
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div
              style={{
                padding: 16,
                borderTop: `1px solid ${MCM.line}`,
                fontSize: 10,
                color: MCM.textDim,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, color: MCM.textMuted }}>
                WORKFLOW
              </div>
              <ol style={{ margin: 0, paddingLeft: 16 }}>
                <li style={{ marginBottom: 4 }}>Upload app screenshot</li>
                <li style={{ marginBottom: 4 }}>Optionally describe target element</li>
                <li style={{ marginBottom: 4 }}>Extract to SwiftUI code</li>
                <li style={{ marginBottom: 4 }}>Copy to Xcode project</li>
                <li>Refine in wireframe overlay</li>
              </ol>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </>
  );
}
