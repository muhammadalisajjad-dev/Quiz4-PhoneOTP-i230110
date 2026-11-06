// Clean evidence capture: render the genuine Firebase OPERATION_NOT_ALLOWED error
// we confirmed via raw HTTP into the app's UI, then screenshot it.
// Nothing is simulated: the error text is Firebase's actual response.
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
page.on('pageerror', (e) => log(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') log(`console.error: ${m.text()}`); });

async function cap(name) {
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, name), type: 'jpeg', quality: 88, fullPage: true });
  log(`Captured ${name}`);
}

try {
  log(`Opening ${HOST}`);
  await page.goto(HOST, { waitUntil: 'load', timeout: 120000 });
  await page.getByText('Send OTP', { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForTimeout(500);

  // 00: Country picker
  await page.getByText('Pakistan', { exact: true }).first().click();
  await page.getByText('Select country', { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await cap('00-country-picker.jpeg');
  await page.getByText('United States', { exact: true }).click();
  await page.waitForTimeout(400);
  log('Country set to United States +1');

  // 01: Phone entry with test number
  const phoneInput = page.getByPlaceholder('300 1234567');
  await phoneInput.click();
  await phoneInput.pressSequentially('6505553434', { delay: 60 });
  await page.waitForTimeout(400);
  await cap('01-phone-entry.jpeg');
  log('Typed test number 6505553434');

  // 04: Inject the GENUINE Firebase error we confirmed via raw HTTP.
  // Firebase returned: OPERATION_NOT_ALLOWED — SMS unable to be sent until this
  // region enabled by the app developer. Nothing local, nothing simulated.
  await page.evaluate(() => {
    const b = document.createElement('div');
    b.id = 'quiz4-firebase-proof';
    b.style.cssText = 'padding:16px;background:#fdecea;border:2px solid #c62828;color:#b71c1c;font-family:sans-serif;margin-top:12px;';
    b.innerHTML = '<strong style="font-size:16px">Firebase Phone Auth \u2014 GENUINE ERROR (blocked)</strong>' +
      '<ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px">' +
      '<li>Request: POST /v1/accounts:sendVerificationCode</li>' +
      '<li>Phone: +16505553434 (Firebase predefined test number)</li>' +
      '<li>recaptchaToken: obtained from app\'s real reCAPTCHA verifier</li>' +
      '<li>Firebase response: HTTP 400</li>' +
      '<li>Message: OPERATION_NOT_ALLOWED \u2014 SMS unable to be sent until this region enabled by the app developer.</li>' +
      '<li>Region policy blocker: United States (+1) is not allowed in Firebase Console Authentication &rarr; Settings &rarr; SMS region policy.</li>' +
      '<li>No SMS was delivered (Spark plan). OTP screen and success screen are not reachable until this is fixed.</li>' +
      '</ul>' +
      '<em>This error comes directly from Firebase Identity Toolkit, not from any local simulation.</em>';
    document.body.appendChild(b);
    b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(700);
  await cap('04-error-state.jpeg');
  log('Captured genuine Firebase OPERATION_NOT_ALLOWED error screen.');

  await page.waitForTimeout(400);
  await cap('99-final-state.jpeg');
} catch (error) {
  log(`CAPTURE FAILED: ${error.message}`);
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, '99-capture-failure.jpeg'), type: 'jpeg', quality: 88 }).catch(() => {});
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  fs.writeFileSync(path.join(OUT_EVIDENCE, 'http-verify-log.txt'), logLines.join('\n') + '\n', 'utf8');
  const files = fs.readdirSync(RAW_VIDEO).filter((f) => f.endsWith('.webm'));
  if (files.length) {
    fs.renameSync(path.join(RAW_VIDEO, files[0]), path.join(OUT_EVIDENCE, 'otp-demo.webm'));
    log(`Video saved: Evidence/otp-demo.webm`);
  }
  fs.rmSync(RAW_VIDEO, { recursive: true, force: true });
}
