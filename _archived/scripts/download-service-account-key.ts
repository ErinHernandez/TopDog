#!/usr/bin/env npx ts-node
/**
 * Script to download Firebase service account key using Puppeteer
 * 
 * This script automates the download of the service account key from Firebase Console.
 * It opens the browser, navigates to the service accounts page, and downloads the key.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ID = 'topdog-e9d48';
const DOWNLOAD_PATH = path.join(process.cwd(), 'service-account-key.json');

async function downloadServiceAccountKey(): Promise<void> {
  console.log('🚀 Starting service account key download...\n');
  
  const browser: Browser = await puppeteer.launch({
    headless: false, // Show browser so user can see what's happening
    defaultViewport: null,
  });

  try {
    const page: Page = await browser.newPage();
    
    // Set up download behavior using CDP (Chrome DevTools Protocol)
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: process.cwd(),
    });

    console.log('📂 Navigating to Firebase Console...');
    await page.goto(`https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk`, {
      waitUntil: 'networkidle2',
    });

    console.log('🔍 Looking for "Generate new private key" button...');
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and click the generate button
    // The button might have different text or be in a dialog
    const buttonSelectors: string[] = [
      'button:has-text("Generate new private key")',
      'button[aria-label*="Generate"]',
      'button:has-text("Generate")',
      '//button[contains(text(), "Generate")]',
      '//button[contains(text(), "private key")]',
    ];

    let clicked = false;
    for (const selector of buttonSelectors) {
      try {
        if (selector.startsWith('//')) {
          // XPath selector (page.$x exists at runtime; type assertion for Puppeteer type defs)
          type PageWithX = { $x(expression: string): Promise<{ click(): Promise<void> }[]> };
          const buttons = await (page as unknown as PageWithX).$x(selector);
          if (buttons.length > 0) {
            await buttons[0]!.click();
            clicked = true;
            console.log('✅ Clicked generate button');
            break;
          }
        } else {
          // CSS selector
          await page.waitForSelector(selector, { timeout: 2000 });
          await page.click(selector);
          clicked = true;
          console.log('✅ Clicked generate button');
          break;
        }
      } catch (error) {
        // Try next selector
        continue;
      }
    }

    if (!clicked) {
      console.log('⚠️  Could not automatically find the button.');
      console.log('   Please manually click "Generate new private key" in the browser window.');
      console.log('   The script will wait for the download to complete...');
      
      // Wait for download to start (check for JSON file in download directory)
      let downloaded = false;
      const maxWait = 60000; // 60 seconds
      const startTime = Date.now();
      
      while (!downloaded && (Date.now() - startTime) < maxWait) {
        // Check if the file was downloaded
        const files = fs.readdirSync(process.cwd());
        const jsonFiles = files.filter((f: string) => f.endsWith('.json') && f.includes(PROJECT_ID));

        if (jsonFiles.length > 0) {
          const downloadedFile = path.join(process.cwd(), jsonFiles[0]!);
          // Move/rename to service-account-key.json
          if (fs.existsSync(downloadedFile)) {
            fs.renameSync(downloadedFile, DOWNLOAD_PATH);
            downloaded = true;
            console.log(`✅ Downloaded and saved to: ${DOWNLOAD_PATH}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!downloaded) {
        console.error('❌ Download did not complete within 60 seconds.');
        console.error('   Please download the file manually and save it as service-account-key.json');
        await browser.close();
        process.exit(1);
      }
    } else {
      // Wait for download
      console.log('⏳ Waiting for download to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for downloaded file
      const files = fs.readdirSync(process.cwd());
      const jsonFiles = files.filter((f: string) => f.endsWith('.json') && f.includes(PROJECT_ID));

      if (jsonFiles.length > 0) {
        const downloadedFile = path.join(process.cwd(), jsonFiles[0]!);
        if (fs.existsSync(downloadedFile)) {
          fs.renameSync(downloadedFile, DOWNLOAD_PATH);
          console.log(`✅ Downloaded and saved to: ${DOWNLOAD_PATH}`);
        }
      } else {
        console.log('⚠️  File not found. Please check the browser for the download.');
      }
    }

    // Keep browser open for a moment so user can see
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Error during download:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('\n✅ Service account key download complete!');
  console.log(`   File saved to: ${DOWNLOAD_PATH}`);
}

// Run the script
downloadServiceAccountKey().catch((error: Error) => {
  console.error('❌ Failed to download service account key:', error);
  process.exit(1);
});
