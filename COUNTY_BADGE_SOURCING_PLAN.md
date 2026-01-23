# US County Badge Sourcing & Generation Plan

## Executive Summary

This document provides a complete implementation plan for sourcing, processing, and generating badge images for all **3,143 US counties**. The badges will be used in the Location Integrity System to display user-earned county badges.

### The Challenge
- **3,143 counties** need badge images
- **~100 county seals** available on Wikimedia Commons (SVG format)
- **~3,043 counties** need programmatic badge generation
- No centralized database of county seals exists

### Solution Overview
1. **Phase 1**: Download all available seals from Wikimedia Commons (~100)
2. **Phase 2**: Scrape county government websites for additional seals (~500-1,000 estimated)
3. **Phase 3**: Generate programmatic badges for remaining counties (~2,000-2,500)
4. **Phase 4**: Store in Firebase Storage with consistent naming

---

## Part 1: County Data Foundation

### 1.1 FIPS Code Data Source

US counties are identified by FIPS codes (Federal Information Processing Standards). We need a complete list with:
- State FIPS code (2 digits)
- County FIPS code (3 digits)
- County name
- State name/abbreviation

**Primary Data Source**: Census Bureau via GitHub

```bash
# Download complete FIPS codes CSV
curl -o fips_codes.csv https://raw.githubusercontent.com/kjhealy/fips-codes/master/state_and_county_fips_master.csv
```

### 1.2 County Data Types

```typescript
// src/badges/types/countyTypes.ts

export interface CountyData {
  fips: string;           // Full FIPS code: "06037"
  stateFips: string;      // State portion: "06"
  countyFips: string;     // County portion: "037"
  countyName: string;     // "Los Angeles County"
  stateAbbr: string;      // "CA"
  stateName: string;      // "California"
  badgeId: string;        // "US-CA-06037"
}

export interface BadgeMetadata {
  badgeId: string;
  countyName: string;
  stateAbbr: string;
  source: 'wikimedia' | 'county_website' | 'generated';
  sourceUrl?: string;
  imageFormat: 'svg' | 'png';
  width: number;
  height: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface BadgeGenerationConfig {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  fontFamily: string;
  cornerRadius: number;
}
```

### 1.3 FIPS Data Parser

```typescript
// src/badges/data/fipsParser.ts

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { CountyData } from '../types/countyTypes';

// State FIPS to abbreviation mapping
const STATE_FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR', '78': 'VI'
};

const STATE_FIPS_TO_NAME: Record<string, string> = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
  '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
  '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
  '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
  '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
  '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
  '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
  '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
  '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
  '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
  '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
  '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
  '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming',
  '72': 'Puerto Rico', '78': 'Virgin Islands'
};

export function loadAllCounties(csvPath: string): CountyData[] {
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  const counties: CountyData[] = [];

  for (const record of records) {
    const stateFips = record.fips?.toString().padStart(5, '0').slice(0, 2);
    const countyFips = record.fips?.toString().padStart(5, '0').slice(2, 5);

    if (!stateFips || !countyFips || countyFips === '000') {
      continue; // Skip state-level entries
    }

    const stateAbbr = STATE_FIPS_TO_ABBR[stateFips];
    const stateName = STATE_FIPS_TO_NAME[stateFips];

    if (!stateAbbr) continue;

    counties.push({
      fips: `${stateFips}${countyFips}`,
      stateFips,
      countyFips,
      countyName: record.name || `County ${countyFips}`,
      stateAbbr,
      stateName,
      badgeId: `US-${stateAbbr}-${stateFips}${countyFips}`
    });
  }

  console.log(`Loaded ${counties.length} counties`);
  return counties;
}

export function getCountyByFips(counties: CountyData[], fips: string): CountyData | undefined {
  return counties.find(c => c.fips === fips);
}

export function getCountiesByState(counties: CountyData[], stateAbbr: string): CountyData[] {
  return counties.filter(c => c.stateAbbr === stateAbbr);
}
```

---

## Part 2: Wikimedia Commons Scraping

### 2.1 Understanding Wikimedia Structure

County seals on Wikimedia Commons are organized in categories:
- `Category:SVG seals of counties in the United States` (parent)
- `Category:Seals of counties in California` (state-specific)
- `Category:Seals of counties in Texas` (state-specific)

**API Endpoint**: `https://commons.wikimedia.org/w/api.php`

### 2.2 Wikimedia Scraper

```typescript
// src/badges/scrapers/wikimediaScraper.ts

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { CountyData, BadgeMetadata } from '../types/countyTypes';

const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const DOWNLOAD_DIR = './badges/wikimedia';

interface WikimediaFile {
  title: string;
  url: string;
  descriptionUrl: string;
}

// State name variations for matching
const STATE_NAME_VARIATIONS: Record<string, string[]> = {
  'California': ['California', 'CA'],
  'Texas': ['Texas', 'TX'],
  'New York': ['New York', 'NY'],
  // ... add all states
};

/**
 * Get all files from a Wikimedia category
 */
async function getCategoryFiles(categoryName: string): Promise<WikimediaFile[]> {
  const files: WikimediaFile[] = [];
  let continueToken: string | undefined;

  do {
    const params: Record<string, string> = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: categoryName,
      cmtype: 'file',
      cmlimit: '500',
      format: 'json'
    };

    if (continueToken) {
      params.cmcontinue = continueToken;
    }

    const response = await axios.get(WIKIMEDIA_API, { params });
    const data = response.data;

    if (data.query?.categorymembers) {
      for (const member of data.query.categorymembers) {
        files.push({
          title: member.title,
          url: '', // Will be filled in next step
          descriptionUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(member.title)}`
        });
      }
    }

    continueToken = data.continue?.cmcontinue;
  } while (continueToken);

  return files;
}

/**
 * Get direct download URL for a file
 */
async function getFileUrl(filename: string): Promise<string | null> {
  const params = {
    action: 'query',
    titles: filename,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json'
  };

  const response = await axios.get(WIKIMEDIA_API, { params });
  const pages = response.data.query?.pages;

  if (pages) {
    const pageId = Object.keys(pages)[0];
    return pages[pageId]?.imageinfo?.[0]?.url || null;
  }

  return null;
}

/**
 * Parse county name from Wikimedia filename
 * Examples:
 * - "File:Seal of Los Angeles County, California.svg" -> "Los Angeles"
 * - "File:Harris County, Texas seal.svg" -> "Harris"
 */
function parseCountyFromFilename(filename: string): { countyName: string; stateName: string } | null {
  // Remove "File:" prefix and extension
  let name = filename.replace(/^File:/, '').replace(/\.(svg|png|jpg)$/i, '');

  // Common patterns
  const patterns = [
    /Seal of ([^,]+) County,?\s*([A-Za-z\s]+)/i,
    /([^,]+) County,?\s*([A-Za-z\s]+)\s*seal/i,
    /([^,]+) County\s*\(([A-Za-z\s]+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        countyName: match[1].trim(),
        stateName: match[2].trim()
      };
    }
  }

  return null;
}

/**
 * Match a Wikimedia file to a county in our database
 */
function matchToCounty(
  parsed: { countyName: string; stateName: string },
  counties: CountyData[]
): CountyData | null {
  const normalizedCountyName = parsed.countyName.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedStateName = parsed.stateName.toLowerCase().replace(/\s+/g, ' ').trim();

  return counties.find(county => {
    const countyMatch = county.countyName.toLowerCase().includes(normalizedCountyName) ||
                        normalizedCountyName.includes(county.countyName.toLowerCase().replace(' county', ''));
    const stateMatch = county.stateName.toLowerCase() === normalizedStateName ||
                       county.stateAbbr.toLowerCase() === normalizedStateName;
    return countyMatch && stateMatch;
  }) || null;
}

/**
 * Download a file from Wikimedia
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outputPath, response.data);
}

/**
 * Main scraping function
 */
export async function scrapeWikimediaSeals(counties: CountyData[]): Promise<Map<string, BadgeMetadata>> {
  const results = new Map<string, BadgeMetadata>();

  // Ensure download directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Categories to scrape
  const categories = [
    'Category:SVG seals of counties in the United States',
    'Category:Seals of counties in California',
    'Category:Seals of counties in Texas',
    'Category:Seals of counties in Florida',
    'Category:Seals of counties in New York',
    'Category:Seals of counties in Pennsylvania',
    'Category:Seals of counties in Ohio',
    'Category:Seals of counties in Illinois',
    'Category:Seals of counties in Georgia',
    'Category:Seals of counties in North Carolina',
    'Category:Seals of counties in Michigan',
    'Category:Seals of counties in New Jersey',
    'Category:Seals of counties in Virginia',
    'Category:Seals of counties in Washington',
    'Category:Seals of counties in Arizona',
    'Category:Seals of counties in Massachusetts',
    'Category:Seals of counties in Tennessee',
    'Category:Seals of counties in Indiana',
    'Category:Seals of counties in Missouri',
    'Category:Seals of counties in Maryland',
    'Category:Seals of counties in Wisconsin',
    'Category:Seals of counties in Colorado',
    'Category:Seals of counties in Minnesota',
    'Category:Seals of counties in South Carolina',
    'Category:Seals of counties in Alabama',
    'Category:Seals of counties in Louisiana',
    'Category:Seals of counties in Kentucky',
    'Category:Seals of counties in Oregon',
    'Category:Seals of counties in Oklahoma',
    'Category:Seals of counties in Connecticut',
    'Category:Seals of counties in Utah',
    'Category:Seals of counties in Iowa',
    'Category:Seals of counties in Nevada',
    'Category:Seals of counties in Arkansas',
    'Category:Seals of counties in Mississippi',
    'Category:Seals of counties in Kansas',
    'Category:Seals of counties in New Mexico',
    'Category:Seals of counties in Nebraska',
    'Category:Seals of counties in West Virginia',
    'Category:Seals of counties in Idaho',
    'Category:Seals of counties in Hawaii',
    'Category:Seals of counties in New Hampshire',
    'Category:Seals of counties in Maine',
    'Category:Seals of counties in Montana',
    'Category:Seals of counties in Rhode Island',
    'Category:Seals of counties in Delaware',
    'Category:Seals of counties in South Dakota',
    'Category:Seals of counties in North Dakota',
    'Category:Seals of counties in Alaska',
    'Category:Seals of counties in Vermont',
    'Category:Seals of counties in Wyoming'
  ];

  const allFiles: WikimediaFile[] = [];

  // Collect all files from all categories
  for (const category of categories) {
    console.log(`Scraping category: ${category}`);
    try {
      const files = await getCategoryFiles(category);
      allFiles.push(...files);
      console.log(`  Found ${files.length} files`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  Error scraping ${category}:`, error);
    }
  }

  // Deduplicate by title
  const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.title, f])).values());
  console.log(`\nTotal unique files: ${uniqueFiles.length}`);

  // Process each file
  let matched = 0;
  let downloaded = 0;

  for (const file of uniqueFiles) {
    // Parse county from filename
    const parsed = parseCountyFromFilename(file.title);
    if (!parsed) {
      console.log(`  Could not parse: ${file.title}`);
      continue;
    }

    // Match to county
    const county = matchToCounty(parsed, counties);
    if (!county) {
      console.log(`  No match for: ${parsed.countyName}, ${parsed.stateName}`);
      continue;
    }

    matched++;

    // Skip if already have this county
    if (results.has(county.badgeId)) {
      continue;
    }

    // Get download URL
    const url = await getFileUrl(file.title);
    if (!url) {
      console.log(`  Could not get URL for: ${file.title}`);
      continue;
    }

    // Determine format
    const isSvg = url.toLowerCase().endsWith('.svg');
    const format = isSvg ? 'svg' : 'png';
    const filename = `${county.badgeId}.${format}`;
    const outputPath = path.join(DOWNLOAD_DIR, filename);

    // Download
    try {
      await downloadFile(url, outputPath);
      downloaded++;

      results.set(county.badgeId, {
        badgeId: county.badgeId,
        countyName: county.countyName,
        stateAbbr: county.stateAbbr,
        source: 'wikimedia',
        sourceUrl: file.descriptionUrl,
        imageFormat: format,
        width: 200,  // Will be updated after processing
        height: 200,
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      console.log(`  Downloaded: ${county.countyName}, ${county.stateAbbr}`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`  Error downloading ${file.title}:`, error);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Downloaded: ${downloaded}`);

  return results;
}

/**
 * Save metadata to JSON
 */
export function saveMetadata(metadata: Map<string, BadgeMetadata>, outputPath: string): void {
  const obj = Object.fromEntries(metadata);
  fs.writeFileSync(outputPath, JSON.stringify(obj, null, 2));
}
```

---

## Part 3: County Website Scraping

### 3.1 Strategy Overview

Many counties have official seals on their government websites. Common URL patterns:
- `https://www.{county}.{state}.gov`
- `https://www.co.{county}.{state}.us`
- `https://www.{county}county.gov`

### 3.2 County Website Scraper

```typescript
// src/badges/scrapers/countyWebsiteScraper.ts

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { CountyData, BadgeMetadata } from '../types/countyTypes';

const DOWNLOAD_DIR = './badges/county_websites';
const USER_AGENT = 'CountyBadgeBot/1.0 (Educational Research)';

// Known county website patterns by state
const STATE_URL_PATTERNS: Record<string, string[]> = {
  'CA': [
    'https://www.{county}.ca.gov',
    'https://www.co.{county}.ca.us',
    'https://{county}.ca.gov'
  ],
  'TX': [
    'https://www.{county}.tx.gov',
    'https://www.co.{county}.tx.us',
    'https://www.{county}county.org'
  ],
  'FL': [
    'https://www.{county}county.gov',
    'https://www.{county}fl.gov',
    'https://www.co.{county}.fl.us'
  ],
  'NY': [
    'https://www.{county}ny.gov',
    'https://www.co.{county}.ny.us',
    'https://www.{county}county.gov'
  ],
  // Add patterns for all states
  'DEFAULT': [
    'https://www.{county}county.gov',
    'https://www.co.{county}.{state_lower}.us',
    'https://www.{county}.{state_lower}.gov'
  ]
};

/**
 * Generate potential URLs for a county
 */
function generatePotentialUrls(county: CountyData): string[] {
  const patterns = STATE_URL_PATTERNS[county.stateAbbr] || STATE_URL_PATTERNS['DEFAULT'];
  const countySlug = county.countyName
    .toLowerCase()
    .replace(' county', '')
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');

  return patterns.map(pattern =>
    pattern
      .replace('{county}', countySlug)
      .replace('{state_lower}', county.stateAbbr.toLowerCase())
  );
}

/**
 * Find seal/logo images on a page
 */
async function findSealImages(url: string): Promise<string[]> {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const images: string[] = [];

    // Look for images with seal-related attributes
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt')?.toLowerCase() || '';
      const className = $(el).attr('class')?.toLowerCase() || '';
      const id = $(el).attr('id')?.toLowerCase() || '';

      // Check if image is likely a seal
      const isSeal =
        alt.includes('seal') ||
        alt.includes('logo') ||
        alt.includes('county') ||
        src.toLowerCase().includes('seal') ||
        src.toLowerCase().includes('logo') ||
        className.includes('seal') ||
        className.includes('logo') ||
        id.includes('seal') ||
        id.includes('logo');

      if (isSeal && src) {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(src, url).href;
        images.push(absoluteUrl);
      }
    });

    return images;
  } catch (error) {
    return [];
  }
}

/**
 * Score an image URL to determine likelihood of being a seal
 */
function scoreSealLikelihood(url: string): number {
  let score = 0;
  const lower = url.toLowerCase();

  if (lower.includes('seal')) score += 10;
  if (lower.includes('logo')) score += 5;
  if (lower.includes('county')) score += 3;
  if (lower.includes('official')) score += 2;
  if (lower.endsWith('.svg')) score += 5;
  if (lower.endsWith('.png')) score += 3;
  if (lower.includes('header')) score -= 2;
  if (lower.includes('footer')) score -= 2;
  if (lower.includes('banner')) score -= 3;
  if (lower.includes('icon') && !lower.includes('favicon')) score += 1;

  return score;
}

/**
 * Download and validate an image
 */
async function downloadAndValidate(
  imageUrl: string,
  outputPath: string
): Promise<boolean> {
  try {
    const response = await axios.get(imageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      responseType: 'arraybuffer',
      timeout: 15000
    });

    const contentType = response.headers['content-type'];
    const data = response.data;

    // Validate it's an image
    if (!contentType?.includes('image')) {
      return false;
    }

    // Check minimum size (seals should be at least 50x50)
    // This is a basic check; more sophisticated validation could use sharp
    if (data.length < 1000) {
      return false;
    }

    fs.writeFileSync(outputPath, data);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Scrape a single county's website for seal
 */
async function scrapeCountySeal(
  county: CountyData,
  existingBadges: Set<string>
): Promise<BadgeMetadata | null> {
  // Skip if we already have this county
  if (existingBadges.has(county.badgeId)) {
    return null;
  }

  const potentialUrls = generatePotentialUrls(county);

  for (const baseUrl of potentialUrls) {
    console.log(`  Trying: ${baseUrl}`);

    // Find seal images
    const images = await findSealImages(baseUrl);

    if (images.length === 0) {
      // Try /about or /government pages
      const subpages = ['/about', '/government', '/county-seal', '/about-us'];
      for (const subpage of subpages) {
        const subImages = await findSealImages(baseUrl + subpage);
        images.push(...subImages);
      }
    }

    if (images.length === 0) {
      continue;
    }

    // Score and sort images
    const scored = images.map(url => ({
      url,
      score: scoreSealLikelihood(url)
    })).sort((a, b) => b.score - a.score);

    // Try to download the best candidates
    for (const candidate of scored.slice(0, 3)) {
      if (candidate.score < 3) continue;

      const ext = candidate.url.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
      const filename = `${county.badgeId}.${ext}`;
      const outputPath = path.join(DOWNLOAD_DIR, filename);

      const success = await downloadAndValidate(candidate.url, outputPath);

      if (success) {
        return {
          badgeId: county.badgeId,
          countyName: county.countyName,
          stateAbbr: county.stateAbbr,
          source: 'county_website',
          sourceUrl: candidate.url,
          imageFormat: ext as 'svg' | 'png',
          width: 200,
          height: 200,
          createdAt: new Date(),
          lastUpdated: new Date()
        };
      }
    }
  }

  return null;
}

/**
 * Main county website scraping function
 */
export async function scrapeCountyWebsites(
  counties: CountyData[],
  existingMetadata: Map<string, BadgeMetadata>
): Promise<Map<string, BadgeMetadata>> {
  const results = new Map<string, BadgeMetadata>(existingMetadata);
  const existingBadges = new Set(existingMetadata.keys());

  // Ensure download directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Counties without badges
  const missingCounties = counties.filter(c => !existingBadges.has(c.badgeId));
  console.log(`Scraping ${missingCounties.length} county websites...`);

  let found = 0;
  let failed = 0;

  for (const county of missingCounties) {
    console.log(`\n${county.countyName}, ${county.stateAbbr} (${county.badgeId})`);

    try {
      const metadata = await scrapeCountySeal(county, existingBadges);

      if (metadata) {
        results.set(county.badgeId, metadata);
        existingBadges.add(county.badgeId);
        found++;
        console.log(`  ✓ Found seal`);
      } else {
        failed++;
        console.log(`  ✗ No seal found`);
      }
    } catch (error) {
      failed++;
      console.log(`  ✗ Error: ${error}`);
    }

    // Rate limiting - be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n\nSummary:`);
  console.log(`  Found: ${found}`);
  console.log(`  Not found: ${failed}`);

  return results;
}
```

---

## Part 4: Programmatic Badge Generation

### 4.1 Design System

For counties without official seals, we generate attractive badges programmatically.

**Badge Design Specs:**
- **Size**: 200x200 pixels (2x for retina: 400x400)
- **Shape**: Circular with optional border
- **Colors**: State-based color schemes
- **Content**: County name, state abbreviation, optional founding year

### 4.2 State Color Schemes

```typescript
// src/badges/generation/stateColors.ts

export interface StateColorScheme {
  primary: string;      // Main background/accent color
  secondary: string;    // Secondary color
  text: string;         // Text color
  border: string;       // Border color
  gradient?: [string, string]; // Optional gradient
}

// Color schemes based on state flags/themes
export const STATE_COLORS: Record<string, StateColorScheme> = {
  'AL': { primary: '#9E1B32', secondary: '#FFFFFF', text: '#FFFFFF', border: '#6B1223' },
  'AK': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'AZ': { primary: '#C41E3A', secondary: '#FFD700', text: '#FFFFFF', border: '#8B1528' },
  'AR': { primary: '#C41E3A', secondary: '#002868', text: '#FFFFFF', border: '#8B1528' },
  'CA': { primary: '#002868', secondary: '#C41E3A', text: '#FFFFFF', border: '#001845' },
  'CO': { primary: '#002868', secondary: '#C41E3A', text: '#FFFFFF', border: '#001845' },
  'CT': { primary: '#002868', secondary: '#FFFFFF', text: '#FFFFFF', border: '#001845' },
  'DE': { primary: '#002868', secondary: '#FFCD00', text: '#FFFFFF', border: '#001845' },
  'FL': { primary: '#BF0A30', secondary: '#FFFFFF', text: '#FFFFFF', border: '#8B0721' },
  'GA': { primary: '#BF0A30', secondary: '#002868', text: '#FFFFFF', border: '#8B0721' },
  'HI': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'ID': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'IL': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'IN': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'IA': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'KS': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'KY': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'LA': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'ME': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'MD': { primary: '#9D2235', secondary: '#FFD200', text: '#000000', border: '#6B1724' },
  'MA': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'MI': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'MN': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'MS': { primary: '#BF0A30', secondary: '#002868', text: '#FFFFFF', border: '#8B0721' },
  'MO': { primary: '#BF0A30', secondary: '#002868', text: '#FFFFFF', border: '#8B0721' },
  'MT': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'NE': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'NV': { primary: '#002868', secondary: '#C0C0C0', text: '#FFFFFF', border: '#001845' },
  'NH': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'NJ': { primary: '#E3AB57', secondary: '#002868', text: '#002868', border: '#B8893F' },
  'NM': { primary: '#FFD700', secondary: '#BF0A30', text: '#BF0A30', border: '#CCA300' },
  'NY': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'NC': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'ND': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'OH': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'OK': { primary: '#007EB6', secondary: '#FFFFFF', text: '#FFFFFF', border: '#005D87' },
  'OR': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'PA': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'RI': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'SC': { primary: '#002868', secondary: '#FFFFFF', text: '#FFFFFF', border: '#001845' },
  'SD': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'TN': { primary: '#BF0A30', secondary: '#002868', text: '#FFFFFF', border: '#8B0721' },
  'TX': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'UT': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'VT': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF', border: '#004B00' },
  'VA': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'WA': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF', border: '#004B00' },
  'WV': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'WI': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' },
  'WY': { primary: '#002868', secondary: '#BF0A30', text: '#FFFFFF', border: '#001845' },
  'DC': { primary: '#BF0A30', secondary: '#FFFFFF', text: '#FFFFFF', border: '#8B0721' },
  'PR': { primary: '#BF0A30', secondary: '#002868', text: '#FFFFFF', border: '#8B0721' },
  'VI': { primary: '#002868', secondary: '#FFD700', text: '#FFFFFF', border: '#001845' }
};

export function getStateColors(stateAbbr: string): StateColorScheme {
  return STATE_COLORS[stateAbbr] || {
    primary: '#002868',
    secondary: '#FFD700',
    text: '#FFFFFF',
    border: '#001845'
  };
}
```

### 4.3 Badge Generator with Canvas

```typescript
// src/badges/generation/badgeGenerator.ts

import { createCanvas, registerFont, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { CountyData, BadgeMetadata, BadgeGenerationConfig } from '../types/countyTypes';
import { getStateColors, StateColorScheme } from './stateColors';

const OUTPUT_DIR = './badges/generated';
const BADGE_SIZE = 400; // 2x for retina
const DISPLAY_SIZE = 200;

// Register custom fonts (optional)
// registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto', weight: 'bold' });

/**
 * Format county name for display
 */
function formatCountyName(name: string): string[] {
  // Remove "County" suffix if present
  let cleanName = name.replace(/\s+County$/i, '');

  // Split long names into multiple lines
  if (cleanName.length > 12) {
    const words = cleanName.split(' ');
    if (words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      return [
        words.slice(0, mid).join(' '),
        words.slice(mid).join(' ')
      ];
    }
  }

  return [cleanName];
}

/**
 * Calculate font size to fit text
 */
function calculateFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
): number {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `bold ${size}px Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return size;
    }
  }
  return minSize;
}

/**
 * Draw a circular badge
 */
function drawCircularBadge(
  ctx: CanvasRenderingContext2D,
  county: CountyData,
  colors: StateColorScheme,
  size: number
): void {
  const center = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = radius - 15;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw outer ring gradient
  const gradient = ctx.createRadialGradient(
    center, center, innerRadius,
    center, center, radius
  );
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.border);

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw inner circle
  ctx.beginPath();
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = colors.secondary;
  ctx.fill();

  // Draw decorative inner border
  ctx.beginPath();
  ctx.arc(center, center, innerRadius - 5, 0, Math.PI * 2);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw county name
  const nameLines = formatCountyName(county.countyName);
  const lineHeight = size * 0.12;
  const startY = center - (nameLines.length - 1) * lineHeight / 2;

  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  nameLines.forEach((line, index) => {
    const fontSize = calculateFontSize(ctx, line, innerRadius * 1.5, 48, 20);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillText(line, center, startY + index * lineHeight);
  });

  // Draw state abbreviation at bottom
  ctx.font = `bold 32px Arial, sans-serif`;
  ctx.fillText(county.stateAbbr, center, center + innerRadius * 0.6);

  // Draw "COUNTY" text curved at top
  drawCurvedText(ctx, 'COUNTY', center, center, innerRadius - 25, -Math.PI * 0.7, -Math.PI * 0.3, colors.primary);
}

/**
 * Draw curved text along an arc
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const anglePerChar = (endAngle - startAngle) / (text.length - 1);

  for (let i = 0; i < text.length; i++) {
    const angle = startAngle + i * anglePerChar;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw a shield-shaped badge
 */
function drawShieldBadge(
  ctx: CanvasRenderingContext2D,
  county: CountyData,
  colors: StateColorScheme,
  size: number
): void {
  const margin = 20;
  const width = size - margin * 2;
  const height = size - margin * 2;

  ctx.clearRect(0, 0, size, size);

  // Draw shield shape
  ctx.beginPath();
  ctx.moveTo(margin, margin + 30);
  ctx.lineTo(margin, margin + height * 0.6);
  ctx.quadraticCurveTo(margin, size - margin, size / 2, size - margin);
  ctx.quadraticCurveTo(size - margin, size - margin, size - margin, margin + height * 0.6);
  ctx.lineTo(size - margin, margin + 30);
  ctx.quadraticCurveTo(size - margin, margin, size - margin - 30, margin);
  ctx.lineTo(margin + 30, margin);
  ctx.quadraticCurveTo(margin, margin, margin, margin + 30);
  ctx.closePath();

  // Fill with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.border);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw inner border
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw county name
  const nameLines = formatCountyName(county.countyName);
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = 45;
  const startY = size * 0.4 - (nameLines.length - 1) * lineHeight / 2;

  nameLines.forEach((line, index) => {
    const fontSize = calculateFontSize(ctx, line, width * 0.8, 42, 18);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillText(line, size / 2, startY + index * lineHeight);
  });

  // Draw "COUNTY" below name
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('COUNTY', size / 2, startY + nameLines.length * lineHeight + 10);

  // Draw state abbreviation
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText(county.stateAbbr, size / 2, size * 0.75);
}

/**
 * Generate badge for a county
 */
export async function generateBadge(
  county: CountyData,
  style: 'circular' | 'shield' = 'circular'
): Promise<Buffer> {
  const canvas = createCanvas(BADGE_SIZE, BADGE_SIZE);
  const ctx = canvas.getContext('2d');
  const colors = getStateColors(county.stateAbbr);

  if (style === 'shield') {
    drawShieldBadge(ctx, county, colors, BADGE_SIZE);
  } else {
    drawCircularBadge(ctx, county, colors, BADGE_SIZE);
  }

  return canvas.toBuffer('image/png');
}

/**
 * Generate and save badge
 */
export async function generateAndSaveBadge(
  county: CountyData,
  style: 'circular' | 'shield' = 'circular'
): Promise<BadgeMetadata> {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const buffer = await generateBadge(county, style);
  const filename = `${county.badgeId}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(outputPath, buffer);

  return {
    badgeId: county.badgeId,
    countyName: county.countyName,
    stateAbbr: county.stateAbbr,
    source: 'generated',
    imageFormat: 'png',
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    createdAt: new Date(),
    lastUpdated: new Date()
  };
}

/**
 * Generate badges for all counties without badges
 */
export async function generateMissingBadges(
  counties: CountyData[],
  existingMetadata: Map<string, BadgeMetadata>,
  style: 'circular' | 'shield' = 'circular'
): Promise<Map<string, BadgeMetadata>> {
  const results = new Map<string, BadgeMetadata>(existingMetadata);
  const existingBadges = new Set(existingMetadata.keys());

  const missingCounties = counties.filter(c => !existingBadges.has(c.badgeId));
  console.log(`Generating ${missingCounties.length} badges...`);

  let generated = 0;

  for (const county of missingCounties) {
    try {
      const metadata = await generateAndSaveBadge(county, style);
      results.set(county.badgeId, metadata);
      generated++;

      if (generated % 100 === 0) {
        console.log(`  Generated ${generated}/${missingCounties.length}`);
      }
    } catch (error) {
      console.error(`  Error generating badge for ${county.badgeId}:`, error);
    }
  }

  console.log(`\nGenerated ${generated} badges`);
  return results;
}
```

---

## Part 5: Image Processing & Normalization

### 5.1 Image Processor

All badges (from any source) need to be normalized to consistent format.

```typescript
// src/badges/processing/imageProcessor.ts

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = './badges/processed';
const BADGE_SIZE = 200;
const BADGE_SIZE_2X = 400;

interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Process and normalize a badge image
 */
export async function processImage(
  inputPath: string,
  badgeId: string
): Promise<ProcessingResult> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const ext = path.extname(inputPath).toLowerCase();
    const outputPath1x = path.join(OUTPUT_DIR, `${badgeId}.png`);
    const outputPath2x = path.join(OUTPUT_DIR, `${badgeId}@2x.png`);

    if (ext === '.svg') {
      // Convert SVG to PNG at both resolutions
      await sharp(inputPath)
        .resize(BADGE_SIZE, BADGE_SIZE, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath1x);

      await sharp(inputPath)
        .resize(BADGE_SIZE_2X, BADGE_SIZE_2X, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath2x);
    } else {
      // Process raster image
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Create 1x version
      await sharp(inputPath)
        .resize(BADGE_SIZE, BADGE_SIZE, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath1x);

      // Create 2x version (upscale if needed)
      await sharp(inputPath)
        .resize(BADGE_SIZE_2X, BADGE_SIZE_2X, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath2x);
    }

    return { success: true, outputPath: outputPath1x };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create circular crop of an image
 */
export async function createCircularBadge(
  inputPath: string,
  outputPath: string,
  size: number
): Promise<void> {
  const roundedCorners = Buffer.from(
    `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`
  );

  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover'
    })
    .composite([{
      input: roundedCorners,
      blend: 'dest-in'
    }])
    .png()
    .toFile(outputPath);
}

/**
 * Process all badges from all sources
 */
export async function processAllBadges(
  wikimediaDir: string,
  websiteDir: string,
  generatedDir: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const directories = [
    { dir: wikimediaDir, source: 'wikimedia' },
    { dir: websiteDir, source: 'website' },
    { dir: generatedDir, source: 'generated' }
  ];

  for (const { dir, source } of directories) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    console.log(`Processing ${files.length} files from ${source}...`);

    for (const file of files) {
      const inputPath = path.join(dir, file);
      const badgeId = path.basename(file, path.extname(file));

      // Skip if already processed
      if (results.has(badgeId)) continue;

      const result = await processImage(inputPath, badgeId);

      if (result.success && result.outputPath) {
        results.set(badgeId, result.outputPath);
      }
    }
  }

  console.log(`Processed ${results.size} badges`);
  return results;
}
```

---

## Part 6: Firebase Storage Upload

### 6.1 Storage Uploader

```typescript
// src/badges/storage/firebaseUploader.ts

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { BadgeMetadata } from '../types/countyTypes';

const STORAGE_BUCKET = 'badges';
const BATCH_SIZE = 500;

interface UploadResult {
  badgeId: string;
  url1x: string;
  url2x: string;
}

/**
 * Upload a single badge to Firebase Storage
 */
async function uploadBadge(
  badgeId: string,
  localPath1x: string,
  localPath2x: string
): Promise<UploadResult> {
  const storage = getStorage();

  // Upload 1x version
  const ref1x = ref(storage, `${STORAGE_BUCKET}/${badgeId}.png`);
  const data1x = fs.readFileSync(localPath1x);
  await uploadBytes(ref1x, data1x, { contentType: 'image/png' });
  const url1x = await getDownloadURL(ref1x);

  // Upload 2x version
  const ref2x = ref(storage, `${STORAGE_BUCKET}/${badgeId}@2x.png`);
  const data2x = fs.readFileSync(localPath2x);
  await uploadBytes(ref2x, data2x, { contentType: 'image/png' });
  const url2x = await getDownloadURL(ref2x);

  return { badgeId, url1x, url2x };
}

/**
 * Upload all badges to Firebase Storage
 */
export async function uploadAllBadges(
  processedDir: string,
  metadata: Map<string, BadgeMetadata>
): Promise<void> {
  const db = getFirestore();
  const badgeIds = Array.from(metadata.keys());

  console.log(`Uploading ${badgeIds.length} badges...`);

  let uploaded = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const badgeId of badgeIds) {
    const localPath1x = path.join(processedDir, `${badgeId}.png`);
    const localPath2x = path.join(processedDir, `${badgeId}@2x.png`);

    if (!fs.existsSync(localPath1x)) {
      console.log(`  Skipping ${badgeId} - file not found`);
      continue;
    }

    try {
      const result = await uploadBadge(
        badgeId,
        localPath1x,
        fs.existsSync(localPath2x) ? localPath2x : localPath1x
      );

      // Update metadata with URLs
      const meta = metadata.get(badgeId)!;
      const docRef = doc(db, 'badgeAssets', badgeId);

      batch.set(docRef, {
        ...meta,
        url: result.url1x,
        url2x: result.url2x,
        uploadedAt: new Date()
      });

      batchCount++;
      uploaded++;

      // Commit batch when full
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
        console.log(`  Uploaded ${uploaded}/${badgeIds.length}`);
      }
    } catch (error) {
      console.error(`  Error uploading ${badgeId}:`, error);
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nUploaded ${uploaded} badges`);
}
```

### 6.2 Firestore Badge Asset Schema

```typescript
// Firestore collection: badgeAssets

interface BadgeAsset {
  badgeId: string;           // "US-CA-06037"
  countyName: string;        // "Los Angeles County"
  stateAbbr: string;         // "CA"
  source: 'wikimedia' | 'county_website' | 'generated';
  sourceUrl?: string;        // Original source URL if scraped
  url: string;               // Firebase Storage URL (1x)
  url2x: string;             // Firebase Storage URL (2x)
  imageFormat: 'png';
  width: number;             // 200
  height: number;            // 200
  createdAt: Timestamp;
  uploadedAt: Timestamp;
}
```

---

## Part 7: Main Orchestration Script

### 7.1 Complete Pipeline

```typescript
// src/badges/pipeline/runPipeline.ts

import * as fs from 'fs';
import * as path from 'path';
import { loadAllCounties } from '../data/fipsParser';
import { scrapeWikimediaSeals, saveMetadata } from '../scrapers/wikimediaScraper';
import { scrapeCountyWebsites } from '../scrapers/countyWebsiteScraper';
import { generateMissingBadges } from '../generation/badgeGenerator';
import { processAllBadges } from '../processing/imageProcessor';
import { uploadAllBadges } from '../storage/firebaseUploader';
import { BadgeMetadata } from '../types/countyTypes';

const DATA_DIR = './badges';
const FIPS_CSV = './data/fips_codes.csv';
const METADATA_FILE = './badges/metadata.json';

async function loadExistingMetadata(): Promise<Map<string, BadgeMetadata>> {
  if (fs.existsSync(METADATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    return new Map(Object.entries(data));
  }
  return new Map();
}

async function main() {
  console.log('=== County Badge Pipeline ===\n');

  // Step 1: Load county data
  console.log('Step 1: Loading county data...');
  const counties = loadAllCounties(FIPS_CSV);
  console.log(`  Loaded ${counties.length} counties\n`);

  // Load existing metadata
  let metadata = await loadExistingMetadata();
  console.log(`  Existing badges: ${metadata.size}\n`);

  // Step 2: Scrape Wikimedia Commons
  console.log('Step 2: Scraping Wikimedia Commons...');
  metadata = await scrapeWikimediaSeals(counties);
  saveMetadata(metadata, METADATA_FILE);
  console.log(`  Total badges after Wikimedia: ${metadata.size}\n`);

  // Step 3: Scrape county websites (optional - slow)
  const SCRAPE_WEBSITES = process.env.SCRAPE_WEBSITES === 'true';
  if (SCRAPE_WEBSITES) {
    console.log('Step 3: Scraping county websites...');
    metadata = await scrapeCountyWebsites(counties, metadata);
    saveMetadata(metadata, METADATA_FILE);
    console.log(`  Total badges after website scraping: ${metadata.size}\n`);
  } else {
    console.log('Step 3: Skipping county website scraping (set SCRAPE_WEBSITES=true to enable)\n');
  }

  // Step 4: Generate missing badges
  console.log('Step 4: Generating missing badges...');
  metadata = await generateMissingBadges(counties, metadata, 'circular');
  saveMetadata(metadata, METADATA_FILE);
  console.log(`  Total badges after generation: ${metadata.size}\n`);

  // Step 5: Process all images
  console.log('Step 5: Processing and normalizing images...');
  await processAllBadges(
    path.join(DATA_DIR, 'wikimedia'),
    path.join(DATA_DIR, 'county_websites'),
    path.join(DATA_DIR, 'generated')
  );

  // Step 6: Upload to Firebase (optional)
  const UPLOAD_TO_FIREBASE = process.env.UPLOAD_TO_FIREBASE === 'true';
  if (UPLOAD_TO_FIREBASE) {
    console.log('Step 6: Uploading to Firebase Storage...');
    await uploadAllBadges(path.join(DATA_DIR, 'processed'), metadata);
  } else {
    console.log('Step 6: Skipping Firebase upload (set UPLOAD_TO_FIREBASE=true to enable)\n');
  }

  // Summary
  console.log('\n=== Pipeline Complete ===');
  console.log(`Total counties: ${counties.length}`);
  console.log(`Total badges: ${metadata.size}`);

  const sources = {
    wikimedia: 0,
    county_website: 0,
    generated: 0
  };

  for (const [_, meta] of metadata) {
    sources[meta.source]++;
  }

  console.log(`  From Wikimedia: ${sources.wikimedia}`);
  console.log(`  From county websites: ${sources.county_website}`);
  console.log(`  Programmatically generated: ${sources.generated}`);
}

main().catch(console.error);
```

---

## Part 8: Package Configuration

### 8.1 package.json

```json
{
  "name": "county-badge-pipeline",
  "version": "1.0.0",
  "scripts": {
    "download-fips": "curl -o data/fips_codes.csv https://raw.githubusercontent.com/kjhealy/fips-codes/master/state_and_county_fips_master.csv",
    "scrape:wikimedia": "ts-node src/badges/scrapers/wikimediaScraper.ts",
    "scrape:websites": "SCRAPE_WEBSITES=true ts-node src/badges/pipeline/runPipeline.ts",
    "generate": "ts-node src/badges/generation/badgeGenerator.ts",
    "process": "ts-node src/badges/processing/imageProcessor.ts",
    "upload": "UPLOAD_TO_FIREBASE=true ts-node src/badges/pipeline/runPipeline.ts",
    "pipeline": "ts-node src/badges/pipeline/runPipeline.ts",
    "pipeline:full": "SCRAPE_WEBSITES=true UPLOAD_TO_FIREBASE=true ts-node src/badges/pipeline/runPipeline.ts"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "canvas": "^2.11.2",
    "cheerio": "^1.0.0-rc.12",
    "csv-parse": "^5.5.0",
    "firebase": "^10.7.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### 8.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Part 9: Directory Structure

```
badges/
├── data/
│   └── fips_codes.csv              # Downloaded FIPS data
├── wikimedia/                       # Raw downloads from Wikimedia
│   ├── US-CA-06037.svg
│   └── ...
├── county_websites/                 # Scraped from county sites
│   ├── US-TX-48201.png
│   └── ...
├── generated/                       # Programmatically generated
│   ├── US-AL-01001.png
│   └── ...
├── processed/                       # Normalized final badges
│   ├── US-CA-06037.png             # 200x200
│   ├── US-CA-06037@2x.png          # 400x400 (retina)
│   └── ...
└── metadata.json                    # Complete badge metadata

src/badges/
├── types/
│   └── countyTypes.ts
├── data/
│   └── fipsParser.ts
├── scrapers/
│   ├── wikimediaScraper.ts
│   └── countyWebsiteScraper.ts
├── generation/
│   ├── stateColors.ts
│   └── badgeGenerator.ts
├── processing/
│   └── imageProcessor.ts
├── storage/
│   └── firebaseUploader.ts
└── pipeline/
    └── runPipeline.ts
```

---

## Part 10: Legal & Copyright Considerations

### 10.1 Copyright Status by Source

| Source | Copyright Status | Usage Rights |
|--------|-----------------|--------------|
| Wikimedia Commons | Varies - check license | Most are public domain or CC |
| County Websites | Government work | Generally public domain |
| Programmatic | Original creation | Full ownership |

### 10.2 Important Notes

1. **US Government Works**: County seals created by government employees in their official capacity are generally public domain under 17 U.S.C. § 105.

2. **State Variations**: Some states have specific laws protecting county seals:
   - California: Gov. Code § 27420 protects county seals from commercial use
   - Texas: Local Gov. Code § 156.001 allows counties to adopt seals

3. **Trademark-like Protection**: Even if not copyrighted, some seals may have trademark-like protection preventing misrepresentative use.

4. **Our Use Case**: Displaying badges earned by visiting counties is likely:
   - Non-commercial (part of a game)
   - Not implying official endorsement
   - Transformative (used as achievement badges)

5. **Recommendation**: For scraped seals, consider adding a disclaimer that badges are for entertainment purposes and do not imply official endorsement.

---

## Part 11: Estimated Costs & Timeline

### 11.1 Processing Costs

| Component | Estimated |
|-----------|-----------|
| Firebase Storage (3,143 badges × 2 sizes × ~50KB) | ~300MB = ~$0.08/month |
| Bandwidth (1M badge views/month × 50KB) | ~50GB = ~$6/month |
| **Total Monthly** | **~$6.08** |

### 11.2 Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Setup & FIPS data | 1 hour | Download and parse |
| Wikimedia scraping | 2-3 hours | ~100 seals |
| County website scraping | 20-40 hours | Optional, can skip |
| Badge generation | 1-2 hours | ~3,000 badges |
| Image processing | 30 minutes | Batch processing |
| Firebase upload | 1-2 hours | Batch uploads |
| **Total (without website scraping)** | **5-8 hours** |
| **Total (with website scraping)** | **25-45 hours** |

### 11.3 Recommended Approach

1. **Quick Start**: Skip website scraping, generate all missing badges
2. **Enhanced**: Run website scraping overnight, then generate remaining
3. **Full**: All phases, maximum quality

---

## Appendix A: Testing Checklist

- [ ] FIPS data downloads and parses correctly
- [ ] Wikimedia scraper finds and downloads seals
- [ ] County name parsing handles edge cases
- [ ] State color schemes render correctly
- [ ] Badge generator creates valid PNGs
- [ ] Image processor handles SVG and PNG inputs
- [ ] Firebase upload completes without errors
- [ ] Firestore metadata is queryable
- [ ] Badge URLs resolve correctly in app

---

## Appendix B: Troubleshooting

### Common Issues

1. **Canvas module fails to install**
   ```bash
   # On macOS
   brew install pkg-config cairo pango libpng jpeg giflib librsvg
   npm install canvas
   ```

2. **Sharp module fails**
   ```bash
   npm rebuild sharp
   ```

3. **Wikimedia rate limiting**
   - Increase delay between requests
   - Use Wikimedia API auth token

4. **Firebase upload timeouts**
   - Reduce batch size
   - Implement retry logic

---

*Document Version: 1.0*
*Created: January 2026*
*For: Best Ball Tournament Location Integrity System*
