import * as fs from "node:fs";
import * as path from "node:path";

interface ScreenshotOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
}

/**
 * Find the system Chrome/Chromium executable.
 */
function findChromePath(): string | null {
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        ]
      : process.platform === "win32"
        ? [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium",
          ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Capture a screenshot of a URL using puppeteer-core.
 * Returns the output path or null if Chrome/puppeteer not available.
 */
export async function captureScreenshot(
  url: string,
  outputDir: string,
  options: ScreenshotOptions = {}
): Promise<string | null> {
  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn("  Chrome/Chromium not found. Skipping screenshots.");
    return null;
  }

  let puppeteer;
  try {
    puppeteer = await import("puppeteer-core");
  } catch {
    console.warn("  puppeteer-core not installed. Skipping screenshots.");
    return null;
  }

  const { width = 1280, height = 800, fullPage = false } = options;

  let browser;
  try {
    browser = await puppeteer.default.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Generate filename from URL
    const hostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, "-");
    const filename = `${hostname}.png`;
    const outputPath = path.join(outputDir, filename);

    fs.mkdirSync(outputDir, { recursive: true });
    await page.screenshot({ path: outputPath, fullPage });

    return outputPath;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`  Screenshot failed for ${url}: ${msg}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate a comparison image with all screenshots side by side.
 * Creates an HTML page with screenshots and captures it.
 */
export async function generateComparisonImage(
  screenshots: Array<{ name: string; path: string }>,
  outputPath: string
): Promise<string | null> {
  if (screenshots.length === 0) return null;

  const chromePath = findChromePath();
  if (!chromePath) return null;

  let puppeteer;
  try {
    puppeteer = await import("puppeteer-core");
  } catch {
    return null;
  }

  // Build HTML template for side-by-side comparison
  const imageCards = screenshots
    .map((s) => {
      const imgData = fs.readFileSync(s.path);
      const base64 = imgData.toString("base64");
      return `
        <div style="flex: 1; min-width: 300px; max-width: 500px; margin: 10px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #f5f5f5; padding: 8px 12px; font-weight: bold; font-size: 14px; border-bottom: 1px solid #ddd;">${s.name}</div>
          <img src="data:image/png;base64,${base64}" style="width: 100%; display: block;" />
        </div>
      `;
    })
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fff;">
      <h2 style="margin: 0 0 16px 0; color: #333;">Competitor Comparison</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 0;">
        ${imageCards}
      </div>
    </body>
    </html>
  `;

  let browser;
  try {
    browser = await puppeteer.default.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const pageWidth = Math.min(screenshots.length * 520 + 40, 2560);
    await page.setViewport({ width: pageWidth, height: 800 });
    await page.setContent(html, { waitUntil: "load" });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await page.screenshot({ path: outputPath, fullPage: true });

    return outputPath;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`  Comparison image generation failed: ${msg}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
