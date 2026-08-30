const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

function testSpreadsheetConnection() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  Logger.log('Connected successfully');
  Logger.log('Spreadsheet name: ' + spreadsheet.getName());

  const sheets = spreadsheet.getSheets();

  Logger.log(
    'Sheets: ' +
    sheets.map(sheet => sheet.getName()).join(', ')
  );
}

function getTodaySheetName() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  const timeZone = spreadsheet.getSpreadsheetTimeZone();

  return Utilities.formatDate(
    new Date(),
    timeZone,
    'yyyy-MM-dd'
  );
}


function createTodaySheet() {

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  const todayName = getTodaySheetName();

  // Check whether today's sheet already exists
  let todaySheet = spreadsheet.getSheetByName(todayName);

  if (todaySheet) {
    Logger.log('Today sheet already exists: ' + todayName);
    return todaySheet;
  }

  // Find TEMPLATE
  const templateSheet = spreadsheet.getSheetByName('TEMPLATE');

  if (!templateSheet) {
    throw new Error(
      'TEMPLATE sheet was not found. Make sure the sheet is named TEMPLATE.'
    );
  }

  // Copy TEMPLATE
  todaySheet = templateSheet.copyTo(spreadsheet);

  // Rename using today's date
  todaySheet.setName(todayName);

  Logger.log('Created new daily sheet: ' + todayName);

  return todaySheet;
}
function testTodaysSentEmails() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const timeZone = spreadsheet.getSpreadsheetTimeZone();

  const today = Utilities.formatDate(
    new Date(),
    timeZone,
    'yyyy-MM-dd'
  );

  Logger.log('Scanning SENT emails for: ' + today);

  // Search only recent Sent-mail threads.
  // We will filter the messages precisely to today's date below.
  const threads = GmailApp.search('in:sent newer_than:2d');

  let count = 0;

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(message => {
      const messageDate = Utilities.formatDate(
        message.getDate(),
        timeZone,
        'yyyy-MM-dd'
      );

      // Only messages sent today
      if (messageDate !== today) {
        return;
      }

      count++;

      Logger.log('--------------------------------');
      Logger.log('Date: ' + message.getDate());
      Logger.log('To: ' + message.getTo());
      Logger.log('Subject: ' + message.getSubject());
      Logger.log('Message ID: ' + message.getId());
    });
  });

  Logger.log('--------------------------------');
  Logger.log('Total emails sent today: ' + count);
}

function testRecruiterSentEmails() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const timeZone = spreadsheet.getSpreadsheetTimeZone();

  const today = Utilities.formatDate(
    new Date(),
    timeZone,
    'yyyy-MM-dd'
  );

  Logger.log('Scanning for recruiter/vendor emails YOU sent on: ' + today);

  const threads = GmailApp.search('in:sent newer_than:2d');

  let totalSentToday = 0;
  let recruiterEmailsFound = 0;

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach((message, index) => {

      const messageDate = Utilities.formatDate(
        message.getDate(),
        timeZone,
        'yyyy-MM-dd'
      );

      if (messageDate !== today) {
        return;
      }

      // Make sure this message is actually in Sent Mail
      if (!message.isInChats() && message.getTo()) {

        totalSentToday++;

        const result = isRecruiterVendorEmail(
          message,
          messages,
          index
        );

        if (result.isRecruiter) {

          recruiterEmailsFound++;

          Logger.log('================================');
          Logger.log('RECRUITER/VENDOR EMAIL FOUND');
          Logger.log('Date: ' + message.getDate());
          Logger.log('To: ' + message.getTo());
          Logger.log('Subject: ' + message.getSubject());
          Logger.log('Message ID: ' + message.getId());
          Logger.log('Reason: ' + result.reason);
        }
      }
    });
  });

  Logger.log('================================');
  Logger.log('Total emails sent today: ' + totalSentToday);
  Logger.log(
    'Recruiter/vendor emails detected: ' +
    recruiterEmailsFound
  );
}


function isRecruiterVendorEmail(message, allMessages, currentIndex) {

  const subject = (message.getSubject() || '').toLowerCase();

  const body = (
    message.getPlainBody() || ''
  ).toLowerCase();

  const to = (
    message.getTo() || ''
  ).toLowerCase();

  const combinedText =
    subject + ' ' +
    body + ' ' +
    to;


  // ------------------------------------
  // STRONG JOB / RECRUITER KEYWORDS
  // ------------------------------------

  const strongKeywords = [

    'recruiter',
    'recruitment',
    'recruiting',
    'staffing',

    'job opportunity',
    'career opportunity',
    'new opportunity',

    'job opening',
    'position available',
    'open position',

    'job requirement',
    'requirement',
    'job description',

    'resume',
    'attached resume',
    'updated resume',
    'my resume',

    'cv attached',
    'attached cv',

    'software engineer',
    'software developer',

    'java developer',
    'java engineer',

    'full stack developer',
    'full stack engineer',

    'backend developer',
    'backend engineer',

    'contract position',
    'contract role',

    'w2',
    'c2c',
    'corp to corp',

    'hourly rate',
    'pay rate',

    'interview',
    'technical interview',

    'client requirement',
    'client position',

    'submission',
    'submitted profile',

    'availability',
    'available for this role',

    'hiring',
    'hiring manager'
  ];


  // ------------------------------------
  // Check your outgoing email itself
  // ------------------------------------

  const outgoingMatches =
    strongKeywords.filter(keyword =>
      combinedText.includes(keyword)
    );

  if (outgoingMatches.length >= 2) {

    return {
      isRecruiter: true,
      reason:
        'Outgoing email contains job/recruiter keywords: ' +
        outgoingMatches.slice(0, 4).join(', ')
    };
  }


  // ------------------------------------
  // Check earlier incoming emails
  // in the same Gmail thread.
  //
  // This handles:
  //
  // Recruiter emails you first
  //       ↓
  // You reply
  //       ↓
  // Your reply gets tracked
  // ------------------------------------

  if (currentIndex > 0) {

    let previousText = '';

    for (let i = 0; i < currentIndex; i++) {

      const previousMessage = allMessages[i];

      previousText += ' ' +
        (previousMessage.getSubject() || '') +
        ' ' +
        (previousMessage.getPlainBody() || '');

    }

    previousText = previousText.toLowerCase();

    const previousMatches =
      strongKeywords.filter(keyword =>
        previousText.includes(keyword)
      );

    if (previousMatches.length >= 2) {

      return {
        isRecruiter: true,
        reason:
          'Previous email in this thread appears job/recruiter related: ' +
          previousMatches.slice(0, 4).join(', ')
      };
    }
  }


  return {
    isRecruiter: false,
    reason: 'Not enough recruiter/job evidence'
  };
}

// =====================================================
// STEP 7
// WRITE SENT RECRUITER/VENDOR EMAILS TO TODAY'S SHEET
// =====================================================

