/**
 * ProITBridge — Course enrollment GAS (₹1000 flow).
 *
 * Sheet "Enrollments" — columns in this exact order:
 *
 *   A  Timestamp
 *   B  Enrollment ID
 *   C  Full Name
 *   D  Email Address
 *   E  Mobile Number
 *   F  Country of Residence
 *   G  Address
 *   H  Program
 *   I  Course Type
 *   J  Payment ID
 *   K  Payment Method
 *   L  Amount
 *   M  Payment Status      ← PENDING → SUCCESS / FAILED / CANCELLED (real time)
 *   N  Execution_id        ← CRM / automation column, left blank on creation
 *   O  Call Summary
 *   P  Status              ← CRM follow-up status
 *   Q  next_call_time
 *   R  Assigned to
 *   S  Remarks
 *   T  Status              ← duplicate per spec
 *
 * Two actions:
 *   - registerEnrollment      → append PENDING row, generate enrollmentId, return it
 *   - updateEnrollmentPayment → match row by enrollmentId, patch payment id + status
 *
 * Client sends `application/text` JSON in doPost; we also support doGet so
 * you can test from the browser URL bar.
 */

const SHEET_NAME = 'Enrollments';

const HEADERS = [
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

const COL = {
  TIMESTAMP: 1,
  ENROLLMENT_ID: 2,
  FULL_NAME: 3,
  EMAIL: 4,
  MOBILE: 5,
  COUNTRY: 6,
  ADDRESS: 7,
  PROGRAM: 8,
  COURSE_TYPE: 9,
  PAYMENT_ID: 10,
  PAYMENT_METHOD: 11,
  AMOUNT: 12,
  PAYMENT_STATUS: 13,
};

// ---------- Entry points ----------------------------------------------------

function doPost(e) {
  const body = parsePostBody(e);
  return dispatch(body);
}

function doGet(e) {
  return dispatch(e && e.parameter ? e.parameter : {});
}

function dispatch(p) {
  try {
    const action = String(p.action || '').trim();
    switch (action) {
      case 'registerEnrollment':       return jsonOk(handleRegister(p));
      case 'updateEnrollmentPayment':  return jsonOk(handleUpdate(p));
      default:                          return jsonOk({ status: 'error', message: 'unknown action: ' + action });
    }
  } catch (err) {
    return jsonOk({ status: 'error', message: String(err && err.message || err) });
  }
}

// ---------- Handlers --------------------------------------------------------

function handleRegister(p) {
  const sheet = getOrCreateSheet();
  const now = new Date();

  const enrollmentId = generateEnrollmentId();
  const row = new Array(HEADERS.length).fill('');
  row[COL.TIMESTAMP - 1]      = now;
  row[COL.ENROLLMENT_ID - 1]  = enrollmentId;
  row[COL.FULL_NAME - 1]      = p.fullName || '';
  row[COL.EMAIL - 1]          = p.email || '';
  row[COL.MOBILE - 1]         = String(p.mobile || '');
  row[COL.COUNTRY - 1]        = p.countryResidence || '';
  row[COL.ADDRESS - 1]        = p.address || '';
  row[COL.PROGRAM - 1]        = p.program || '';
  row[COL.COURSE_TYPE - 1]    = p.courseType || '';
  row[COL.PAYMENT_ID - 1]     = '';
  row[COL.PAYMENT_METHOD - 1] = p.paymentMethod || '';
  row[COL.AMOUNT - 1]         = Number(p.amount) || 1000;
  row[COL.PAYMENT_STATUS - 1] = String(p.paymentStatus || 'PENDING').toUpperCase();
  // Columns N–T stay blank for CRM/automation to populate later.

  sheet.appendRow(row);
  return {
    status: 'success',
    enrollmentId: enrollmentId,
    message: 'Pending enrollment created',
  };
}

function handleUpdate(p) {
  const enrollmentId = String(p.enrollmentId || '').trim();
  if (!enrollmentId) return { status: 'error', message: 'missing enrollmentId' };

  const sheet = getOrCreateSheet();
  const row = findRowByEnrollmentId(sheet, enrollmentId);
  if (row === -1) return { status: 'error', message: 'enrollmentId not found: ' + enrollmentId };

  if (p.paymentId !== undefined && String(p.paymentId).length > 0) {
    sheet.getRange(row, COL.PAYMENT_ID).setValue(String(p.paymentId));
  }
  if (p.paymentStatus !== undefined) {
    sheet.getRange(row, COL.PAYMENT_STATUS).setValue(String(p.paymentStatus).toUpperCase());
  }
  return { status: 'success', enrollmentId: enrollmentId, message: 'Updated' };
}

// ---------- Helpers ---------------------------------------------------------

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByEnrollmentId(sheet, enrollmentId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, COL.ENROLLMENT_ID, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === enrollmentId) return i + 2;
  }
  return -1;
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

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (_) {
    return {};
  }
}

function jsonOk(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
