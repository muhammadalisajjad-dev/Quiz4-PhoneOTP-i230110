// Genuine browser capture against the FIREBASE HOSTING URL (not localhost).
// Tests the configured Firebase predefined test number: +1 650-555-3434 / code 654321.
// Requires: npm i --no-save playwright-core ; npx playwright-core install ffmpeg
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'https://safeskip-a2.web.app';
const OUT_SCREENSHOTS = path.resolve('Screenshot');
const OUT_EVIDENCE = path.resolve('Evidence');
const RAW_VIDEO = path.join(OUT_EVIDENCE, '_raw-video');
fs.mkdirSync(OUT_SCREENSHOTS, { recursive: true });
fs.mkdirSync(OUT_EVIDENCE, { recursive: true });
fs.mkdirSync(RAW_VIDEO, { recursive: true });

const logLines = [];
const log = (msg) => { const line = `[${new Date().toISOString()}] ${msg}`; logLines.push(line); console.log(line); };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 460, height: 900 },
  recordVideo: { dir: RAW_VIDEO, size: { width: 460, height: 900 } },
});
const page = await context.newPage();

page.on('console', (m) => { if (m.type() === 'error') log(`console.error: ${m.text()}`); });
page.on('pageerror', (e) => log(`pageerror: ${e.message}`));
page.on('response', async (r) => {
  const url = r.url();
  if (url.includes('identitytoolkit') || url.includes('recaptcha')) {
    let body = '';
    try { body = (await r.text()).slice(0, 500); } catch {}
    log(`network ${r.status()} ${url} ${body}`);
  }
});

async function cap(name) {
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, name), type: 'jpeg', quality: 88, fullPage: true });
  log(`Captured ${name}`);
}

async function waitText(text, ms = 45000) {
  try { await page.getByText(text, { exact: true }).waitFor({ timeout: ms }); return true; }
  catch { return false; }
}

async function tryCapError() {
  const body = await page.evaluate(() => document.body.innerText);
  if (/not configured|not valid|quota|unauthorized|billing|blaze|configuration/i.test(body)) {
    await cap('04-error-state.jpeg');
    return true;
  }
  return false;
}

try {
  log(`Opening ${HOST}`);
  await page.goto(HOST, { waitUntil: 'load', timeout: 120000 });
  await page.getByText('Send OTP', { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForTimeout(800);
  log('Phone-entry screen rendered on hosting');
  await cap('01-phone-entry.jpeg');

  // Open country picker and select United States (+1) so we can type the test number.
  await page.getByText('Pakistan', { exact: true }).first().click();
  await waitText('Select country');
  await page.waitForTimeout(600);
  await cap('00-country-picker.jpeg');
  await page.getByText('United States', { exact: true }).click();
  await page.waitForTimeout(600);
  log('Country set to United States +1');

  // Type the test number digits.
  const phoneInput = page.getByPlaceholder('••••••').count() > 0
    ? page.getByPlaceholder('300 1234567')
    : page.locator('input').first();
  await phoneInput.click();
  await phoneInput.pressSequentially('6505553434', { delay: 60 });
  await page.waitForTimeout(800);
  await cap('01-phone-entry.jpeg');
  log('Typed test number 6505553434');

  // Request code from Firebase.
  log('Tapping Send OTP');
  await page.getByText('Send OTP', { exact: true }).click();

  // Poll for up to 110s: navigation to /otp OR an error card appearing.
  // Also log button text (loading state) to see if sendOtp is in flight.
  let otpReached = false;
  let errorSeen = false;
  const start = Date.now();
  while (Date.now() - start < 110000) {
    await page.waitForTimeout(3000);
    const url = page.url();
    const body = await page.evaluate(() => document.body.innerText);
    const btnText = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => /Send OTP|Verifying|Loading/i.test(x.textContent || ''));
      return b ? b.textContent : null;
    });
    log(`poll url=${url} btn=${btnText} body=${body.replace(/\s+/g, ' ').slice(0, 100)}`);
    if (url.includes('/otp') || body.includes('Enter verification code')) { otpReached = true; break; }
    if (/not configured|invalid.*code|quota|unauthorized|operation not allowed|missing phone number|network request failed/i.test(body)) { errorSeen = true; break; }
  }
  await page.waitForTimeout(600);
  log(`OTP screen reached: ${otpReached}; error seen: ${errorSeen}`);

  if (otpReached) {
    await cap('02-otp-requested.jpeg');
    log('OTP screen reached - test number accepted by Firebase');

    // Enter the console-defined code 654321.
    const codeInput = page.getByPlaceholder('••••••');
    await codeInput.click();
    await codeInput.pressSequentially('654321', { delay: 60 });
    await page.waitForTimeout(600);

    // Tap Verify OTP.
    await page.getByText('Verify OTP', { exact: true }).click();

    // Poll for up to 45s: success screen OR an error card appearing.
    let successReached = false;
    const sStart = Date.now();
    while (Date.now() - sStart < 45000) {
      await page.waitForTimeout(3000);
      const url = page.url();
      const body = await page.evaluate(() => document.body.innerText);
      log(`s-poll url=${url} bodyStart=${body.replace(/\s+/g, ' ').slice(0, 120)}`);
      if (url.includes('/success') || body.includes('Phone number verified')) { successReached = true; break; }
      if (/invalid.*code|expired|quota|unauthorized|operation not allowed|network request failed/i.test(body)) { break; }
    }
    await page.waitForTimeout(600);
    log(`Success screen reached: ${successReached}`);
    if (successReached) {
      await cap('03-verification-success.jpeg');
      log('VERIFICATION SUCCESS via confirmationResult.confirm("654321") on Firebase');
    } else {
      const err = await tryCapError();
      log(`Success NOT reached; error captured: ${err}`);
      log(`Body text: ${(await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 600)}`);
    }
  } else {
    const err = await tryCapError();
    log(`OTP screen NOT reached; error captured: ${err}`);
    log(`Body text: ${(await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 600)}`);
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
    log(`Video saved: ${dest}`);
  } else {
    log('No video file produced.');
  }
  fs.rmSync(RAW_VIDEO, { recursive: true, force: true });
}
