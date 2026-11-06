// Genuine browser capture of the COMPLETE successful Firebase test-number flow.
// URL: https://safeskip-a2.web.app
// Phone: +1 650-555-3434 (Firebase predefined test number)
// Code: 654321 (console-defined test code)
//
// This script:
// 1. Records a continuous video of the entire flow
// 2. Captures screenshots at key steps
// 3. Tests invalid-code error WITHOUT disrupting the successful flow
// 4. Confirms genuine Firebase verification success
//
// Requires: npm i --no-save playwright-core ; npx playwright-core install ffmpeg
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'https://safeskip-a2.web.app';
const TEST_PHONE = '+16505553434';
const TEST_CODE = '654321';
const WRONG_CODE = '000000';

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

async function cap(page, name) {
  await page.screenshot({ path: path.join(OUT_SCREENSHOTS, name), type: 'jpeg', quality: 88, fullPage: true });
  log(`Captured ${name}`);
}

async function bodyText(page) {
  return await page.evaluate(() => document.body.innerText).catch(() => '');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 460, height: 900 },
  recordVideo: { dir: RAW_VIDEO, size: { width: 460, height: 900 } },
});
const page = await context.newPage();

page.on('pageerror', (e) => log(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') log(`console.error: ${m.text()}`); });

let successConfirmed = false;
let invalidCodeCaptured = false;

try {
  log(`Opening ${HOST}`);
  await page.goto(HOST, { waitUntil: 'load', timeout: 120000 });
  await page.getByText('Send OTP', { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForTimeout(500);
  log('Phone-entry screen rendered on hosting');

  // 1. Country picker -> United States (+1)
  await page.getByText('Pakistan', { exact: true }).first().click();
  await page.getByText('Select country', { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await cap(page, '00-country-picker.jpeg');
  await page.getByText('United States', { exact: true }).click();
  await page.waitForTimeout(400);
  log('Country set to United States +1');

  // 2. Type the test number
  const phoneInput = page.getByPlaceholder('300 1234567');
  await phoneInput.click();
  await phoneInput.pressSequentially('6505553434', { delay: 60 });
  await page.waitForTimeout(400);
  await cap(page, '01-phone-entry.jpeg');
  log(`Typed test number ${TEST_PHONE}`);

  // 3. Send OTP
  log('Tapping Send OTP');
  await page.getByText('Send OTP', { exact: true }).click();

  // Wait for OTP screen (poll, since navigation may take a moment)
  let otpReached = false;
  const sStart = Date.now();
  while (Date.now() - sStart < 45000) {
    await page.waitForTimeout(1000);
    const txt = await bodyText(page);
    if (txt.includes('Enter verification code')) { otpReached = true; break; }
    if (/OPERATION_NOT_ALLOWED|not configured|invalid.*code|quota|unauthorized/i.test(txt)) break;
  }
  await page.waitForTimeout(400);

  if (!otpReached) {
    log('OTP screen NOT reached — Firebase blocked sendVerificationCode');
    await cap(page, '04-error-state.jpeg');
    log('ABORT: cannot proceed to OTP entry / success.');
    process.exitCode = 1;
  } else {
    await cap(page, '02-otp-requested.jpeg');
    log('OTP screen reached — Firebase accepted the test number');

    // 4. Test invalid code FIRST (capture error WITHOUT disrupting success flow)
    const wrongInput = page.getByPlaceholder('••••••');
    await wrongInput.click();
    await wrongInput.pressSequentially(WRONG_CODE, { delay: 60 });
    await page.waitForTimeout(400);
    await page.getByText('Verify OTP', { exact: true }).click();
    await page.waitForTimeout(3000);
    const afterWrong = await bodyText(page);
    if (/incorrect|wrong|expired|invalid/i.test(afterWrong)) {
      await cap(page, '05-invalid-code-error.jpeg');
      invalidCodeCaptured = true;
      log('Invalid-code error captured (genuine Firebase rejection of wrong code)');
    } else {
      log('No invalid-code error appeared after wrong code — may need different approach');
    }

    // Clear the wrong code and enter the CORRECT test code
    await wrongInput.click();
    // Select all and overwrite
    await page.keyboard.press('Control+A');
    await wrongInput.pressSequentially(TEST_CODE, { delay: 60 });
    await page.waitForTimeout(400);

    // 5. Verify with correct code
    log(`Tapping Verify OTP with code ${TEST_CODE}`);
    await page.getByText('Verify OTP', { exact: true }).click();

    // Wait for success screen
    let successReached = false;
    const sucStart = Date.now();
    while (Date.now() - sucStart < 45000) {
      await page.waitForTimeout(1000);
      const txt = await bodyText(page);
      if (txt.includes('Phone number verified') || txt.includes('Verification successful')) {
        successReached = true; break;
      }
      if (/incorrect|wrong|expired|invalid|error/i.test(txt)) break;
    }
    await page.waitForTimeout(400);

    if (successReached) {
      await cap(page, '03-verification-success.jpeg');
      successConfirmed = true;
      log(`VERIFICATION SUCCESS via confirmationResult.confirm("${TEST_CODE}") on Firebase`);
    } else {
      log('Success screen NOT reached after correct code');
      const finalTxt = await bodyText(page);
      log(`Final body: ${finalTxt.replace(/\s+/g, ' ').slice(0, 600)}`);
      process.exitCode = 1;
    }
  }

  // Final state screenshot
  await cap(page, '99-final-state.jpeg');
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
    fs.renameSync(path.join(RAW_VIDEO, files[0]), path.join(OUT_EVIDENCE, 'otp-demo-success.webm'));
    log(`Video saved: Evidence/otp-demo-success.webm`);
  } else {
    log('No video file produced.');
  }
  fs.rmSync(RAW_VIDEO, { recursive: true, force: true });

  log(`=== SUMMARY ===`);
  log(`successConfirmed: ${successConfirmed}`);
  log(`invalidCodeCaptured: ${invalidCodeCaptured}`);
}
