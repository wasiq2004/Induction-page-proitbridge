/**
 * ProITBridge — Induction Access Control + Watch Analytics (₹89).
 * Google Apps Script bound to the induction tracking spreadsheet.
 *
 * ============================================================================
 * SHEETS (auto-created if missing)
 * ============================================================================
 *
 * "₹89 Database" — one row per user, drives payment + login.
 *   A  User ID             ← auto-generated on register (PIB89-YYYYMMDD-NNNN)
 *   B  Timestamp           ← written by script on register
 *   C  Full Name           ← written by script on register
 *   D  Email               ← written by script on register
 *   E  Mobile Number       ← written by script (10-digit string)
 *   F  Status              ← PENDING → SUCCESS
 *   G  Payment ID          ← written by script on updatePayment
 *   H  Assigned to         ← manual / team-managed — script never writes
 *   I  Call Summary        ← manual / team-managed — script never writes
 *   J  Induction status    ← manual / team-managed — script never writes
 *
 * "WatchProgress" — one row per (mobile, videoId), updated as users watch.
 *   A  mobile
 *   B  fullName
 *   C  videoId
 *   D  watchedSec          ← real watched seconds (seeks excluded)
 *   E  maxPositionSec      ← furthest timeline position reached
 *   F  durationSec         ← total video length
 *   G  completed           ← TRUE once `ended` event fires
 *   H  firstSeenAt
 *   I  lastSeenAt
 *   J  completionPct       ← max / duration × 100  (how far they got)
 *   K  watchedPct          ← watched / duration × 100  (how much they viewed)
 *   L  enrollmentClicked   ← TRUE once user clicks "Complete Enrollment" CTA
 *
 * ============================================================================
 * ENDPOINTS — all HTTP GET, dispatched by `?action=`
 * ============================================================================
 *
 *   ?action=register&fullName=...&email=...&mobile=...
 *     Appends a new PENDING row with an auto-generated User ID.
 *
 *   ?action=updatePayment&fullName=...&email=...&mobile=...&paymentId=...
 *     Flips the most recent PENDING row to SUCCESS + writes Payment ID.
 *     If no PENDING row exists, appends a SUCCESS row defensively.
 *
 *   ?action=checkAccess&mobile=...
 *     Looks up the most recent row for this mobile.
 *     Returns { hasAccess, status, userName, userId, email, paymentId }.
 *       status ∈ "SUCCESS" | "PENDING" | "NONE"
 *
 *   ?action=updateWatch&mobile=...&fullName=...&videoId=...
 *                      &watchedSec=...&maxPositionSec=...&durationSec=...
 *                      &completed=TRUE|FALSE&lastSeenAt=ISO
 *                      [&enrollmentClicked=TRUE]
 *     Upsert (mobile, videoId) row in WatchProgress. All counters are
 *     monotonic — once a value goes up (or completed flips to TRUE, or
 *     enrollmentClicked flips to TRUE) it never reverts.
 *
 * ============================================================================
 * DEPLOYMENT
 *   1. Open the Google Sheet → Extensions → Apps Script.
 *   2. Paste this file as Code.gs (replace existing content).
 *   3. Deploy → Manage deployments → pencil → New version → Deploy.
 *      The web-app URL stays the same; frontend/.env does NOT need to change.
 * ============================================================================
 */

// ---------- Config ----------------------------------------------------------

const SHEETS = {
  INDUCTIONS: '₹89 Database',
  WATCH: 'WatchProgress',
};

// 1-based column indices for the ₹89 Database tab.
const COL = {
  USER_ID: 1,
  TIMESTAMP: 2,
  FULL_NAME: 3,
  EMAIL: 4,
  MOBILE: 5,
  STATUS: 6,
  PAYMENT_ID: 7,
  ASSIGNED_TO: 8,        // manual — never written
  CALL_SUMMARY: 9,       // manual — never written
  INDUCTION_STATUS: 10,  // manual — never written
};

const INDUCTION_HEADERS = [
  'User ID',
  'Timestamp',
  'Full Name',
  'Email',
  'Mobile Number',
  'Status',
  'Payment ID',
  'Assigned to',
  'Call Summary',
  'Induction status',
];

const USER_ID_PREFIX = 'PIB89';

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

const STATUS_PENDING = 'PENDING';
const STATUS_SUCCESS = 'SUCCESS';

// ---------- Entry point -----------------------------------------------------

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || '').trim();
  try {
    switch (action) {
      case 'register':      return handleRegister(params);
      case 'updatePayment': return handleUpdatePayment(params);
      case 'checkAccess':   return handleCheckAccess(params);
      case 'updateWatch':   return handleUpdateWatch(params);
      default:              return jsonResponse({ status: 'error', message: 'Unknown action' });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: String(err && err.message || err) });
  }
}

function doPost(e) {
  // Mirror so a future POST client just works.
  return doGet(e);
}

// ---------- Inductions handlers --------------------------------------------

function handleRegister(p) {
  const sheet = inductionsSheet();
  const fullName = sanitizeName(p.fullName);
  const email = sanitizeEmail(p.email);
  const mobile = normalizeMobile(p.mobile);
  if (!fullName || !isValidEmail(email) || !isValidMobile(mobile)) {
    return textResponse('INVALID');
  }

  // Serialize User ID generation so two simultaneous registers can't collide
  // on the same sequential suffix.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const userId = nextUserId(sheet);
    sheet.appendRow([
      userId,
      new Date(),
      fullName,
      email,
      mobile,
      STATUS_PENDING,
      '',
      '', // Assigned to     — never auto-fill
      '', // Call Summary    — never auto-fill
      '', // Induction status — never auto-fill
    ]);
    return textResponse('OK ' + userId);
  } finally {
    lock.releaseLock();
  }
}

function handleUpdatePayment(p) {
  const sheet = inductionsSheet();
  const mobile = normalizeMobile(p.mobile);
  const paymentId = String(p.paymentId || '').trim();
  if (!isValidMobile(mobile) || !paymentId) {
    return textResponse('INVALID');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    // Read Full Name through Status in one call.
    const width = COL.STATUS - COL.FULL_NAME + 1;
    const range = sheet.getRange(2, COL.FULL_NAME, lastRow - 1, width);
    const values = range.getValues(); // [Full Name, Email, Mobile, Status]
    for (let i = values.length - 1; i >= 0; i--) {
      const rowMobile = normalizeMobile(values[i][2]);
      const rowStatus = String(values[i][3]).trim().toUpperCase();
      if (rowMobile === mobile && rowStatus === STATUS_PENDING) {
        const sheetRow = i + 2;
        sheet.getRange(sheetRow, COL.STATUS).setValue(STATUS_SUCCESS);
        sheet.getRange(sheetRow, COL.PAYMENT_ID).setValue(paymentId);
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
    const userId = nextUserId(sheet);
    sheet.appendRow([
      userId,
      new Date(),
      fullName,
      email,
      mobile,
      STATUS_SUCCESS,
      paymentId,
      '', '', '',
    ]);
  } finally {
    lock.releaseLock();
  }
  return textResponse('APPENDED');
}

function handleCheckAccess(p) {
  const sheet = inductionsSheet();
  const mobile = normalizeMobile(p.mobile);
  if (!isValidMobile(mobile)) {
    return jsonResponse({ hasAccess: false, status: 'NONE' });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ hasAccess: false, status: 'NONE' });

  // Read User ID through Payment ID in one block.
  const width = COL.PAYMENT_ID - COL.USER_ID + 1;
  const range = sheet.getRange(2, COL.USER_ID, lastRow - 1, width);
  const values = range.getValues();
  // values[i] = [User ID, Timestamp, Full Name, Email, Mobile, Status, Payment ID]

  // Most recent row for this mobile wins.
  for (let i = values.length - 1; i >= 0; i--) {
    const rowMobile = normalizeMobile(values[i][4]);
    if (rowMobile !== mobile) continue;
    const rowStatus = String(values[i][5]).trim().toUpperCase();
    return jsonResponse({
      hasAccess: rowStatus === STATUS_SUCCESS,
      status: rowStatus || 'NONE',
      userId: String(values[i][0]).trim(),
      userName: String(values[i][2]).trim(),
      email: String(values[i][3]).trim(),
      paymentId: String(values[i][6]).trim(),
    });
  }
  return jsonResponse({ hasAccess: false, status: 'NONE' });
}

// ---------- WatchProgress handler ------------------------------------------

function handleUpdateWatch(p) {
  const mobile  = String(p.mobile  || '').trim();
  const videoId = String(p.videoId || '').trim();
  if (!mobile || !videoId) return jsonResponse({ ok: false, error: 'missing mobile/videoId' });

  // Serialize read-modify-write so concurrent updateWatch calls (e.g. CTA
  // click happening at the same instant as a periodic ticker flush) don't
  // overwrite each other's monotonic counters or boolean flags.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // up to 10s; longer than any single sheet op

  try {
    // Fast-path: "enrollmentClicked only" updates (from the CTA button)
    // never touch watch counters. We do a targeted single-cell write to
    // column L so we cannot be raced by a video-tick read-modify-write that
    // happens at the same instant.
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

      sheetEarly.getRange(rowEarly, 12).setValue(true);                      // L: enrollmentClicked
      sheetEarly.getRange(rowEarly,  9).setValue(nowEarly);                  // I: lastSeenAt
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
    const newWatched      = Math.max(toNum(prev[3]), watchedSec);
    const newMaxPos       = Math.max(toNum(prev[4]), maxPositionSec);
    const newDuration     = durationSec || toNum(prev[5]);
    const newComplete     = (String(prev[6]).toUpperCase() === 'TRUE') || completed;
    const firstSeen       = prev[7] || now;
    const prevEnroll      = String(prev[11]).toUpperCase();
    const newEnrollClick  = (prevEnroll === 'TRUE') || enrollmentClick;
    const newCompletion   = newDuration > 0 ? Math.round((newMaxPos  / newDuration) * 100) : 0;
    const newWatchedPct   = newDuration > 0 ? Math.round((newWatched / newDuration) * 100) : 0;

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

// ---------- Sheet helpers ---------------------------------------------------

function inductionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.INDUCTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.INDUCTIONS);
    sheet.appendRow(INDUCTION_HEADERS);
    sheet.getRange(1, 1, 1, INDUCTION_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(INDUCTION_HEADERS);
    sheet.getRange(1, 1, 1, INDUCTION_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Sequential, human-readable User ID: PIB89-YYYYMMDD-NNNN. The NNNN is the
// 1-based position of the new row (counting from the first data row), so IDs
// are stable and never collide as long as nextUserId is invoked under the
// script lock.
function nextUserId(sheet) {
  const seq = Math.max(0, sheet.getLastRow() - 1) + 1; // next data row index
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Asia/Kolkata';
  const datePart = Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
  const seqPart = ('0000' + seq).slice(-4);
  return USER_ID_PREFIX + '-' + datePart + '-' + seqPart;
}

function watchSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.WATCH);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.WATCH);
    sheet.appendRow(WATCH_HEADERS);
    sheet.getRange(1, 1, 1, WATCH_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(WATCH_HEADERS);
    sheet.getRange(1, 1, 1, WATCH_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    // If an older WatchProgress is missing the enrollmentClicked column,
    // extend the header row in place. Existing rows then get FALSE on
    // the next write (Math.max / monotonic boolean handles it cleanly).
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headerRow.length < WATCH_HEADERS.length) {
      const startCol = headerRow.length + 1;
      const missing = WATCH_HEADERS.slice(headerRow.length);
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      sheet.getRange(1, 1, 1, WATCH_HEADERS.length).setFontWeight('bold');
    }
  }
  return sheet;
}

// ---------- Utilities -------------------------------------------------------

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

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function textResponse(text) {
  return ContentService.createTextOutput(text);
}
