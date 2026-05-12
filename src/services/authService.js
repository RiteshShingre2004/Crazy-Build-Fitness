// ── Crazy Build · authService.js ─────────────────────────────────────────────
// Handles all communication with the Express OTP backend.

const API_BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001';

/**
 * Wraps a raw network error (TypeError: Failed to fetch) into a
 * human-readable message so the user knows the server is offline.
 */
function toFriendlyError(err, fallback) {
  if (
    err instanceof TypeError &&
    (err.message === 'Failed to fetch' ||
      err.message.includes('NetworkError') ||
      err.message.includes('fetch'))
  ) {
    const e = new Error(
      '⚠️ Cannot reach the auth server. Make sure the backend is running on port 3001.\n' +
      'Run: cd server && npm run dev'
    );
    e.isNetworkError = true;
    return e;
  }
  return new Error(err?.message || fallback);
}

/**
 * Safely parse a fetch Response as JSON.
 * If the body is empty or not valid JSON, returns a fallback object
 * so callers never see "Unexpected end of JSON input".
 * @param {Response} res
 * @param {string}   fallbackError  — message to use when body is unreadable
 * @returns {Promise<object>}
 */
async function safeJson(res, fallbackError = 'Unexpected server response.') {
  const text = await res.text();
  if (!text || !text.trim()) {
    // Empty body — return a synthetic error object
    return { error: fallbackError };
  }
  try {
    return JSON.parse(text);
  } catch {
    // Body exists but is not valid JSON (e.g. an HTML error page)
    console.error('[authService] Non-JSON response body:', text.slice(0, 200));
    return { error: fallbackError };
  }
}

/**
 * Request a 6-digit OTP to be sent to `email`.
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 * @throws {Error} with a user-friendly `.message` from the API
 */
export async function sendOTP(email) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/send-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  } catch (networkErr) {
    throw toFriendlyError(networkErr, 'Failed to send verification code.');
  }

  const data = await safeJson(res, 'Failed to send verification code.');

  if (!res.ok) {
    const err = new Error(data.error || 'Failed to send verification code.');
    err.retryAfter = data.retryAfter || null;
    throw err;
  }

  return data; // { message }
}

/**
 * Verify the OTP entered by the user.
 * @param {string} email
 * @param {string} otp  — 6-digit string
 * @returns {Promise<{ token: string, email: string, message: string }>}
 * @throws {Error} with a user-friendly `.message` from the API
 */
export async function verifyOTP(email, otp) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim().toLowerCase(), otp }),
    });
  } catch (networkErr) {
    throw toFriendlyError(networkErr, 'Verification failed. Please try again.');
  }

  const data = await safeJson(res, 'Verification failed. Please try again.');

  if (!res.ok) {
    throw new Error(data.error || 'Verification failed. Please try again.');
  }

  return data; // { token, email, message }
}

/**
 * Ping the backend to check if it is reachable.
 * @returns {Promise<boolean>}
 */
export async function pingServer() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
