// Genuine browser capture for the Phone OTP app (web build).
// Requires: npm i --no-save playwright-core
// Uses the locally installed Google Chrome (channel: "chrome") on http://localhost:8081.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT_SCREENSHOTS = path.resolve('Screenshot');
const OUT_EVIDENCE = path.resolve('Evidence');
const RAW_VIDEO = path.join(OUT_EVIDENCE, '_raw-video');
fs.mkdirSync(OUT_SCREENSHOTS, { recursive: true });
fs.mkdirSync(OUT_EVIDENCE, { recursive: true });
fs.mkdirSync(RAW_VIDEO, { recursive: true });

const logLines = [];
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  logLines.push(line);
  console.log(line);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 460, height: 900 },
  recordVideo: { dir: RAW_VIDEO, size: { width: 460, height: 900 } },
});
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() === 'error') log(`console.error: ${m.text()}`);
});
page.on('pageerror', (e) => log(`pageerror: ${e.message}`));
page.on('response', async (r) => {
  const url = r.url();
  if (url.includes('identitytoolkit') || url.includes('recaptcha')) {
    let body = '';
    try {
      body = (await r.text()).slice(0, 600);
    } catch {}
    log(`network ${r.status()} ${url} ${body}`);
  }
});

try {
  log('Opening http://localhost:8081');
  await page.goto('http://localhost:8081', { waitUntil: 'load', timeout: 120000 });
  await page.getByText('Send OTP', { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForTimeout(1200);
  log('Phone-entry screen rendered');

  // Country picker
  await page.getByText('Pakistan', { exact: true }).first().click();
  await page.getByText('Select country', { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, '00-country-picker.jpeg'), type: 'jpeg', quality: 88, fullPage: true });
  log('Captured 00-country-picker.jpeg');

  // Close picker by choosing Pakistan (keeps the default dial code).
  await page.getByText('Pakistan', { exact: true }).last().click();
  await page.waitForTimeout(700);

  // Type the number so the video and screenshot show a real input value.
  const phoneInput = page.getByPlaceholder('300 1234567');
  await phoneInput.click();
  await phoneInput.pressSequentially('3001234567', { delay: 70 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, '01-phone-entry.jpeg'), type: 'jpeg', quality: 88, fullPage: true });
  log('Captured 01-phone-entry.jpeg');

  // Request the code from Firebase.
  log('Tapping Send OTP');
  await page.getByText('Send OTP', { exact: true }).click();

  const errorVisible = await page
    .getByText('Firebase Authentication is not configured for this project.', { exact: false })
    .waitFor({ timeout: 60000 })
    .then(() => true)
    .catch(() => false);

  await page.waitForTimeout(1500);
  const bodyText = await page.evaluate(() => document.body.innerText);
  log(`Error card visible: ${errorVisible}`);
  log(`URL after Send OTP: ${page.url()}`);
  log(`Body text: ${bodyText.replace(/\s+/g, ' ').slice(0, 700)}`);

  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, '04-error-state.jpeg'), type: 'jpeg', quality: 88, fullPage: true });
  log('Captured 04-error-state.jpeg');

  // Prove the OTP screen is not reachable in this run.
  const otpReachable = bodyText.includes('Enter verification code');
  log(`OTP screen reachable: ${otpReachable}`);
  if (!otpReachable) {
    log('OTP screen was NOT reached; no success state exists to capture.');
  }
} catch (error) {
  log(`CAPTURE FAILED: ${error.message}`);
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, '99-capture-failure.jpeg'), type: 'jpeg', quality: 88 }).catch(() => {});
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  fs.writeFileSync(path.join(OUT_EVIDENCE, 'runtime-log.txt'), logLines.join('\n') + '\n', 'utf8');

  const files = fs.readdirSync(RAW_VIDEO).filter((f) => f.endsWith('.webm'));
  if (files.length) {
    const src = path.join(RAW_VIDEO, files[0]);
    const dest = path.join(OUT_EVIDENCE, 'otp-demo.webm');
    fs.renameSync(src, dest);
    console.log(`Video saved: ${dest}`);
  } else {
    console.log('No video file produced.');
  }
  fs.rmSync(RAW_VIDEO, { recursive: true, force: true });
}
