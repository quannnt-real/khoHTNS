// Mô-đun theo dõi và ghi nhật ký các hoạt động redirect
import fs from 'fs';
import path from 'path';

const LOG_ENABLED = false;
const LOG_FILE = path.join(process.cwd(), 'redirect-debug.log');

// Ghi nhật ký đối với các redirect
export function logRedirect(type, from, to, stack) {
  if (!LOG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const stackTrace = stack || new Error().stack;
  
  const logEntry = `\n[REDIRECT ${timestamp}] \n` +
    `Type: ${type}\n` +
    `From: ${from}\n` +
    `To: ${to === undefined ? 'UNDEFINED' : to}\n` +
    `Stack: ${stackTrace}\n` +
    `-----------------------------------------\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (e) {
    console.error('Lỗi khi ghi nhật ký redirect:', e);
  }
}

// Hàm trống này giữ lại chỉ để không phải thay đổi các import
export function monkeyPatchNextResponse() {
  // Không làm gì cả
}

// Wrapper cơ bản không thực hiện bất kỳ logic nào
export function safeRouterPush(router, url, options) {
  if (!router || !router.push) return false;
  return router.push(url, undefined, options);
}

export function safeRouterReplace(router, url, options) {
  if (!router || !router.replace) return false;
  return router.replace(url, undefined, options);
}

export default {
  logRedirect,
  monkeyPatchNextResponse,
  safeRouterPush,
  safeRouterReplace
};