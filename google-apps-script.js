/**
 * Surf Wala Laundry — Google Sheets webhook (Google Apps Script)
 *
 * Every new booking is also written as a row to a Google Sheet, so the staff
 * can see bookings without opening the admin dashboard.
 *
 * HOW TO INSTALL:
 *  1. Open your Google Sheet → Extensions → Apps Script.
 *  2. Replace the existing code with this file and click Save.
 *  3. Deploy → New deployment → type "Web app".
 *  4. "Execute as": Me, "Who has access": Anyone → Deploy → Authorize.
 *  5. Copy the Web app URL and set it as the GOOGLE_SHEET_WEBHOOK_URL
 *     environment variable (in .env.local or in Vercel settings).
 *     Never commit this URL – anyone who has it can add rows to the sheet.
 *
 * After any code change, create a NEW deployment (Deploy → New deployment),
 * because Google keeps serving the old version of an existing deployment.
 */

var SHEET_NAME = 'Reservations'
var HEADERS = [
  'Booking Number', 'Date', 'Customer Name', 'Phone', 'Service',
  'Slot', 'Washing', 'Drying', 'Price', 'Received At',
]

// The app sends the booking as URL parameters (GET request from the server)
function doGet(e) {
  return handleBooking(e.parameter || {})
}

// Also accepts a JSON body (POST), e.g. for testing with other tools
function doPost(e) {
  var p
  try {
    p = JSON.parse(e.postData.contents)
  } catch (parseErr) {
    p = e.parameter || {}
  }
  return handleBooking(p)
}

function handleBooking(p) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS)
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
    }

    sheet.appendRow([
      p.bookingNumber || '',
      p.bookingDate || '',
      p.customerName || '',
      p.phoneNumber || '',
      p.serviceType || '',
      p.slotNumber || '',
      p.washing || '',
      p.drying || '',
      p.price || '',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    ])

    return jsonResponse({ status: 'success' })
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.message })
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

/** Run manually from the Apps Script editor to test writing to the sheet. */
function testBooking() {
  var result = handleBooking({
    bookingNumber: 'SW-20260801-TEST',
    bookingDate: '2026-08-01',
    customerName: 'Test User',
    phoneNumber: '+91 98765 43210',
    serviceType: 'Standard',
    slotNumber: '1',
    washing: 'Mixed',
    drying: 'Mixed',
    price: 'Rs 350',
  })
  Logger.log(result.getContent())
}
