/**
 * ProITBridge — Unified Apps Script.
 *
 * One deployment, one web-app URL, one spreadsheet, three tabs:
 *   - "₹89 Database"     ← induction (₹89) flow
 *   - "₹1000 Database"   ← course enrollment (₹1000) flow
 *   - "WatchProgress"    ← induction video watch analytics
 *
 * Both frontend env vars (VITE_GAS_INDUCTION_URL, VITE_GAS_ENROLLMENT_URL)
 * point at this single deployment. Actions are namespaced so they don't
 * collide.
 *
 * ============================================================================
 * ACTIONS
 * ============================================================================
 *
 * Induction (₹89) — GET, query-string
 *   ?action=register&fullName=...&email=...&mobile=...
 *                   [&status=SUCCESS&paymentId=...]
 *     Appends a new row with an auto-generated User ID. If status and
 *     paymentId are provided (current flow: register only after payment),
 *     the row is inserted directly as SUCCESS with the paymentId. Otherwise
 *     falls back to a PENDING row for any legacy caller.
 *
 *   ?action=updatePayment&fullName=...&email=...&mobile=...&paymentId=...
 *     Flips the most recent PENDING row to SUCCESS + writes Payment ID.
 *     If no PENDING row exists, appends a SUCCESS row defensively.
 *
 *   ?action=checkAccess&mobile=...
 *     Looks up the most recent row for this mobile.
 *     Returns { hasAccess, status, userName, userId, email, paymentId }.
 *
 *   ?action=updateWatch&mobile=...&fullName=...&videoId=...
 *                      &watchedSec=...&maxPositionSec=...&durationSec=...
 *                      &completed=TRUE|FALSE&lastSeenAt=ISO
 *                      [&enrollmentClicked=TRUE]
 *     Upsert (mobile, videoId) in WatchProgress. All counters and boolean
 *     flags are monotonic — once a value rises (or completed / enrollment-
 *     Clicked flip to TRUE) it never reverts.
 *
 * Enrollment (₹1000) — POST, application/text JSON body (or GET for tests)
 *   action=registerEnrollment + fullName, email, mobile, countryResidence,
 *     address, program, courseType, paymentMethod, amount, paymentStatus,
 *     paymentId
 *     Appends a row, generates an enrollmentId, returns it. paymentStatus
 *     defaults to PENDING but the current client always sends SUCCESS with
 *     a real paymentId.
 *
 *   action=updateEnrollmentPayment + enrollmentId, paymentId, paymentStatus
 *     Patches an existing row by enrollmentId.
 *
 * ============================================================================
 * DEPLOYMENT
 *   1. Open the spreadsheet → Extensions → Apps Script.
 *   2. Paste this file as Code.gs (replace any existing content).
 *   3. Deploy → Manage deployments → pencil → New version → Deploy.
 *      The web-app URL stays the same; frontend/.env does NOT need to change.
 * ============================================================================
 */

// ============================================================================
// SHEET / COLUMN CONFIG
// ============================================================================

const SHEETS = {
  INDUCTION:  '₹89 Database',
  ENROLLMENT: '₹1000 Database',
  WATCH:      'WatchProgress',
};

// --- Induction (₹89) sheet --------------------------------------------------

const INDUCTION_COL = {
  TIMESTAMP:    1,
  FULL_NAME:    2,
  MOBILE:       3,
  EMAIL:        4,
  USER_ID:      5,
  STATUS:       6,
  PAYMENT_ID:   7,
  ASSIGNED_TO:  8,   // manual — never written
  CALL_SUMMARY: 9,   // manual — never written
  LEAD_TYPE:    10,  // manual — never written
};

const INDUCTION_HEADERS = [
  'Timestamp',
  'Full Name',
  'Mobile Number',
  'Email Address',
  'User ID',
  'Status',
  'Payment ID',
  'Assigned to',
  'Call Summary',
  'Lead Type',
];

const USER_ID_PREFIX = 'PIB89';
const IST_TIMEZONE = 'Asia/Kolkata';

const STATUS_PENDING = 'PENDING';
const STATUS_SUCCESS = 'SUCCESS';

// --- Enrollment (₹1000) sheet -----------------------------------------------

const ENROLLMENT_COL = {
  TIMESTAMP:      1,
  ENROLLMENT_ID:  2,
  FULL_NAME:      3,
  EMAIL:          4,
  MOBILE:         5,
  COUNTRY:        6,
  ADDRESS:        7,
  PROGRAM:        8,
  COURSE_TYPE:    9,
  PAYMENT_ID:     10,
  PAYMENT_METHOD: 11,
  AMOUNT:         12,
  PAYMENT_STATUS: 13,
};

const ENROLLMENT_HEADERS = [
  'Timestamp',
  'Enrollment ID',
  'Full Name',
  'Email Address',
  'Mobile Number',
  'Country of Residence',
  'Address',
  'Program',
  'Course Type',
  'Payment ID',
  'Payment Method',
  'Amount',
  'Payment Status',
  'Execution_id',
  'Call Summary',
  'Status',
  'next_call_time',
  'Assigned to',
  'Remarks',
  'Status',
];

// --- WatchProgress sheet ----------------------------------------------------

const WATCH_HEADERS = [
  'mobile',
  'fullName',
  'videoId',
  'watchedSec',
  'maxPositionSec',
  'durationSec',
  'completed',
  'firstSeenAt',
  'lastSeenAt',
  'completionPct',
  'watchedPct',
  'enrollmentClicked',
];

// ============================================================================
// ENTRY POINTS
// ============================================================================

function doGet(e) {
  return dispatch((e && e.parameter) || {});
}

function doPost(e) {
  // Enrollment client sends JSON in the body. Other actions use query-string;
  // if both are present, query-string params win (consistent with doGet).
  const body = parsePostBody(e);
  const params = Object.assign({}, body, (e && e.parameter) || {});
  return dispatch(params);
}

function dispatch(p) {
  const action = String(p.action || '').trim();
  try {
    switch (action) {
      // Induction
      case 'register':                 return handleInductionRegister(p);
      case 'updatePayment':            return handleInductionUpdatePayment(p);
      case 'checkAccess':              return handleInductionCheckAccess(p);
      case 'updateWatch':              return handleUpdateWatch(p);
      // Enrollment
      case 'registerEnrollment':       return jsonResponse(handleEnrollmentRegister(p));
      case 'updateEnrollmentPayment':  return jsonResponse(handleEnrollmentUpdate(p));
      default:
        return jsonResponse({ status: 'error', message: 'unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: String(err && err.message || err) });
  }
}

// ============================================================================
// INDUCTION HANDLERS
// ============================================================================

function handleInductionRegister(p) {
  const sheet = inductionSheet();
  const fullName = sanitizeName(p.fullName);
  const email = sanitizeEmail(p.email);
  const mobile = normalizeMobile(p.mobile);
  if (!fullName || !isValidEmail(email) || !isValidMobile(mobile)) {
    return textResponse('INVALID');
  }

  // Honor explicit status + paymentId from the "register only on payment
  // success" client flow. Legacy callers that omit these still get PENDING.
  const rawStatus = String(p.status || '').trim().toUpperCase();
  const status = rawStatus === STATUS_SUCCESS ? STATUS_SUCCESS : STATUS_PENDING;
  const paymentId = status === STATUS_SUCCESS ? String(p.paymentId || '').trim() : '';

  // Serialize User ID generation so two simultaneous registers can't collide.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const userId = nextInductionUserId(sheet);
    sheet.appendRow([
      nowIst(),
      fullName,
      mobile,
      email,
      userId,
      status,
      paymentId,
      '', '', '', // Assigned to, Call Summary, Lead Type — never auto-filled
    ]);
    return textResponse('OK ' + userId);
  } finally {
    lock.releaseLock();
  }
}

function handleInductionUpdatePayment(p) {
  const sheet = inductionSheet();
  const mobile = normalizeMobile(p.mobile);
  const paymentId = String(p.paymentId || '').trim();
  if (!isValidMobile(mobile) || !paymentId) {
    return textResponse('INVALID');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const width = INDUCTION_COL.STATUS - INDUCTION_COL.FULL_NAME + 1;
    const range = sheet.getRange(2, INDUCTION_COL.FULL_NAME, lastRow - 1, width);
    const values = range.getValues(); // [Full Name, Mobile, Email, User ID, Status]
    for (let i = values.length - 1; i >= 0; i--) {
      const rowMobile = normalizeMobile(values[i][1]);
      const rowStatus = String(values[i][4]).trim().toUpperCase();
      if (rowMobile === mobile && rowStatus === STATUS_PENDING) {
        const sheetRow = i + 2;
        sheet.getRange(sheetRow, INDUCTION_COL.STATUS).setValue(STATUS_SUCCESS);
        sheet.getRange(sheetRow, INDUCTION_COL.PAYMENT_ID).setValue(paymentId);
        return textResponse('UPDATED');
      }
    }
  }

  // Defensive fallback: no PENDING row exists — append SUCCESS directly so
  // a successful payer is never locked out.
  const fullName = sanitizeName(p.fullName) || 'Unknown';
  const email = sanitizeEmail(p.email);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const userId = nextInductionUserId(sheet);
    sheet.appendRow([
      nowIst(),
      fullName,
      mobile,
      email,
      userId,
      STATUS_SUCCESS,
      paymentId,
      '', '', '',
    ]);
  } finally {
    lock.releaseLock();
  }
  return textResponse('APPENDED');
}

function handleInductionCheckAccess(p) {
  const sheet = inductionSheet();
  const mobile = normalizeMobile(p.mobile);
  if (!isValidMobile(mobile)) {
    return jsonResponse({ hasAccess: false, status: 'NONE' });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ hasAccess: false, status: 'NONE' });

  const width = INDUCTION_COL.PAYMENT_ID - INDUCTION_COL.TIMESTAMP + 1;
  const range = sheet.getRange(2, INDUCTION_COL.TIMESTAMP, lastRow - 1, width);
  const values = range.getValues();
  // values[i] = [Timestamp, Full Name, Mobile, Email, User ID, Status, Payment ID]

  // Most recent row for this mobile wins.
  for (let i = values.length - 1; i >= 0; i--) {
    const rowMobile = normalizeMobile(values[i][2]);
    if (rowMobile !== mobile) continue;
    const rowStatus = String(values[i][5]).trim().toUpperCase();
    return jsonResponse({
      hasAccess: rowStatus === STATUS_SUCCESS,
      status: rowStatus || 'NONE',
      userId: String(values[i][4]).trim(),
      userName: String(values[i][1]).trim(),
      email: String(values[i][3]).trim(),
      paymentId: String(values[i][6]).trim(),
    });
  }
  return jsonResponse({ hasAccess: false, status: 'NONE' });
}

// ============================================================================
// WATCH PROGRESS HANDLER
// ============================================================================

function handleUpdateWatch(p) {
  const mobile  = String(p.mobile  || '').trim();
  const videoId = String(p.videoId || '').trim();
  if (!mobile || !videoId) return jsonResponse({ ok: false, error: 'missing mobile/videoId' });

  // Serialize read-modify-write so concurrent updateWatch calls (e.g. a CTA
  // click happening at the same instant as a video-tick flush) don't
  // overwrite each other's monotonic counters / flags.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // Fast-path: "enrollmentClicked only" updates from the CTA button never
    // touch watch counters — single-cell write to column L.
    const enrollmentOnly =
      String(p.enrollmentClicked).toUpperCase() === 'TRUE' &&
      p.watchedSec === undefined &&
      p.maxPositionSec === undefined &&
      p.durationSec === undefined;

    if (enrollmentOnly) {
      const sheetEarly = watchSheet();
      const rowEarly = findWatchRow(sheetEarly, mobile, videoId);
      const nowEarly = p.lastSeenAt || new Date().toISOString();

      if (rowEarly === -1) {
        sheetEarly.appendRow([
          mobile, p.fullName || '', videoId,
          0, 0, 0, false,
          nowEarly, nowEarly, 0, 0, true,
        ]);
        return jsonResponse({ ok: true, mode: 'append-cta', enrollmentClicked: true });
      }

      sheetEarly.getRange(rowEarly, 12).setValue(true);       // L: enrollmentClicked
      sheetEarly.getRange(rowEarly,  9).setValue(nowEarly);   // I: lastSeenAt
      return jsonResponse({ ok: true, mode: 'cell-cta', enrollmentClicked: true });
    }

    const sheet = watchSheet();
    const watchedSec      = toNum(p.watchedSec);
    const maxPositionSec  = toNum(p.maxPositionSec);
    const durationSec     = toNum(p.durationSec);
    const completed       = String(p.completed).toUpperCase() === 'TRUE';
    const enrollmentClick = String(p.enrollmentClicked).toUpperCase() === 'TRUE';
    const now             = p.lastSeenAt || new Date().toISOString();

    const lastRow = sheet.getLastRow();
    const data = lastRow >= 2
      ? sheet.getRange(2, 1, lastRow - 1, WATCH_HEADERS.length).getValues()
      : [];

    let rowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === mobile && String(data[i][2]) === videoId) {
        rowIndex = i + 2;
        break;
      }
    }

    if (rowIndex === -1) {
      const completionPct = durationSec > 0 ? Math.round((maxPositionSec / durationSec) * 100) : 0;
      const watchedPct    = durationSec > 0 ? Math.round((watchedSec     / durationSec) * 100) : 0;
      sheet.appendRow([
        mobile,
        p.fullName || '',
        videoId,
        watchedSec,
        maxPositionSec,
        durationSec,
        completed,
        now,
        now,
        completionPct,
        watchedPct,
        enrollmentClick,
      ]);
      return jsonResponse({ ok: true, mode: 'append' });
    }

    const prev = data[rowIndex - 2];
    // Monotonic — never let counters or boolean flags move backwards.
    const newWatched     = Math.max(toNum(prev[3]), watchedSec);
    const newMaxPos      = Math.max(toNum(prev[4]), maxPositionSec);
    const newDuration    = durationSec || toNum(prev[5]);
    const newComplete    = (String(prev[6]).toUpperCase() === 'TRUE') || completed;
    const firstSeen      = prev[7] || now;
    const prevEnroll     = String(prev[11]).toUpperCase();
    const newEnrollClick = (prevEnroll === 'TRUE') || enrollmentClick;
    const newCompletion  = newDuration > 0 ? Math.round((newMaxPos  / newDuration) * 100) : 0;
    const newWatchedPct  = newDuration > 0 ? Math.round((newWatched / newDuration) * 100) : 0;

    sheet.getRange(rowIndex, 1, 1, WATCH_HEADERS.length).setValues([[
      mobile,
      p.fullName || prev[1] || '',
      videoId,
      newWatched,
      newMaxPos,
      newDuration,
      newComplete,
      firstSeen,
      now,
      newCompletion,
      newWatchedPct,
      newEnrollClick,
    ]]);

    return jsonResponse({ ok: true, mode: 'update', enrollmentClicked: newEnrollClick });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// ENROLLMENT HANDLERS
// ============================================================================

function handleEnrollmentRegister(p) {
  const sheet = enrollmentSheet();
  const now = new Date();

  const enrollmentId = generateEnrollmentId();
  const row = new Array(ENROLLMENT_HEADERS.length).fill('');
  row[ENROLLMENT_COL.TIMESTAMP - 1]      = now;
  row[ENROLLMENT_COL.ENROLLMENT_ID - 1]  = enrollmentId;
  row[ENROLLMENT_COL.FULL_NAME - 1]      = p.fullName || '';
  row[ENROLLMENT_COL.EMAIL - 1]          = p.email || '';
  row[ENROLLMENT_COL.MOBILE - 1]         = String(p.mobile || '');
  row[ENROLLMENT_COL.COUNTRY - 1]        = p.countryResidence || '';
  row[ENROLLMENT_COL.ADDRESS - 1]        = p.address || '';
  row[ENROLLMENT_COL.PROGRAM - 1]        = p.program || '';
  row[ENROLLMENT_COL.COURSE_TYPE - 1]    = p.courseType || '';
  row[ENROLLMENT_COL.PAYMENT_ID - 1]     = String(p.paymentId || '');
  row[ENROLLMENT_COL.PAYMENT_METHOD - 1] = p.paymentMethod || '';
  row[ENROLLMENT_COL.AMOUNT - 1]         = Number(p.amount) || 1000;
  row[ENROLLMENT_COL.PAYMENT_STATUS - 1] = String(p.paymentStatus || 'PENDING').toUpperCase();
  // Columns N–T stay blank for CRM/automation to populate later.

  sheet.appendRow(row);
  return {
    status: 'success',
    enrollmentId: enrollmentId,
    message: 'Enrollment row created',
  };
}

function handleEnrollmentUpdate(p) {
  const enrollmentId = String(p.enrollmentId || '').trim();
  if (!enrollmentId) return { status: 'error', message: 'missing enrollmentId' };

  const sheet = enrollmentSheet();
  const row = findRowByEnrollmentId(sheet, enrollmentId);
  if (row === -1) return { status: 'error', message: 'enrollmentId not found: ' + enrollmentId };

  if (p.paymentId !== undefined && String(p.paymentId).length > 0) {
    sheet.getRange(row, ENROLLMENT_COL.PAYMENT_ID).setValue(String(p.paymentId));
  }
  if (p.paymentStatus !== undefined) {
    sheet.getRange(row, ENROLLMENT_COL.PAYMENT_STATUS).setValue(String(p.paymentStatus).toUpperCase());
  }
  return { status: 'success', enrollmentId: enrollmentId, message: 'Updated' };
}

// ============================================================================
// SHEET HELPERS
// ============================================================================

function inductionSheet() {
  return ensureSheet(SHEETS.INDUCTION, INDUCTION_HEADERS);
}

function enrollmentSheet() {
  return ensureSheet(SHEETS.ENROLLMENT, ENROLLMENT_HEADERS);
}

function watchSheet() {
  const sheet = ensureSheet(SHEETS.WATCH, WATCH_HEADERS);
  // If an older WatchProgress is missing the enrollmentClicked column,
  // extend the header row in place.
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headerRow.length < WATCH_HEADERS.length) {
    const startCol = headerRow.length + 1;
    const missing = WATCH_HEADERS.slice(headerRow.length);
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    sheet.getRange(1, 1, 1, WATCH_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Sequential, human-readable Induction User ID: PIB89-YYYYMMDD-NNNN. NNNN is
// the 1-based position of the new data row, stable as long as nextInductionUserId
// is invoked under the script lock.
function nextInductionUserId(sheet) {
  const seq = Math.max(0, sheet.getLastRow() - 1) + 1;
  const datePart = Utilities.formatDate(new Date(), IST_TIMEZONE, 'yyyyMMdd');
  const seqPart = ('0000' + seq).slice(-4);
  return USER_ID_PREFIX + '-' + datePart + '-' + seqPart;
}

function generateEnrollmentId() {
  // PIB-YYYYMMDD-XXXXXX  (date + 6-char base36 suffix)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return 'PIB-' + y + m + d + '-' + suffix;
}

function findRowByEnrollmentId(sheet, enrollmentId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, ENROLLMENT_COL.ENROLLMENT_ID, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === enrollmentId) return i + 2;
  }
  return -1;
}

function findWatchRow(sheet, mobile, videoId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // [mobile, fullName, videoId]
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === mobile && String(values[i][2]) === videoId) {
      return i + 2;
    }
  }
  return -1;
}

// ============================================================================
// UTILITIES
// ============================================================================

function nowIst() {
  return Utilities.formatDate(new Date(), IST_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
}

function normalizeMobile(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.slice(-10);
}

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function sanitizeName(name) {
  return String(name || '').trim().slice(0, 80);
}

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase().slice(0, 120);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (_) {
    return {};
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function textResponse(text) {
  return ContentService.createTextOutput(text);
}
