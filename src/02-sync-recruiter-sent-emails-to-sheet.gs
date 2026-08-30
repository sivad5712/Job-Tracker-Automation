function syncRecruiterSentEmailsToSheet() {

  const spreadsheet =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const timeZone =
    spreadsheet.getSpreadsheetTimeZone();

  // Make sure today's sheet exists
  const todaySheet = createTodaySheet();

  const today =
    Utilities.formatDate(
      new Date(),
      timeZone,
      'yyyy-MM-dd'
    );

  // Hidden helper sheet used for duplicate prevention
  const processedSheet =
    getOrCreateProcessedSheet_(spreadsheet);

  Logger.log(
    'Scanning recruiter/vendor sent emails for: ' +
    today
  );

  const threads =
    GmailApp.search('in:sent newer_than:2d');

  let recruiterEmailsFound = 0;
  let added = 0;
  let duplicatesSkipped = 0;


  threads.forEach(thread => {

    const messages = thread.getMessages();

    messages.forEach((message, index) => {

      const messageDate =
        Utilities.formatDate(
          message.getDate(),
          timeZone,
          'yyyy-MM-dd'
        );

      // Only today's sent emails
      if (messageDate !== today) {
        return;
      }


      // Use the recruiter detector from Step 6
      const detection =
        isRecruiterVendorEmail(
          message,
          messages,
          index
        );


      if (!detection.isRecruiter) {
        return;
      }


      recruiterEmailsFound++;


      const messageId =
        message.getId();


      // ---------------------------------------------
      // DUPLICATE CHECK
      // ---------------------------------------------

      if (
        isAlreadyProcessed_(
          processedSheet,
          'RECRUITER',
          messageId
        )
      ) {

        duplicatesSkipped++;

        return;
      }


      // ---------------------------------------------
      // EXTRACT INFORMATION
      // ---------------------------------------------

      const record =
        extractRecruiterRecord_(
          message,
          messages,
          index,
          thread,
          timeZone
        );


      // ---------------------------------------------
      // INSERT INTO TODAY'S SHEET
      // ---------------------------------------------

      const insertedRow =
        insertRecruiterRecord_(
          todaySheet,
          record
        );


      // ---------------------------------------------
      // MARK EMAIL AS PROCESSED
      // ---------------------------------------------

      markAsProcessed_(
        processedSheet,
        'RECRUITER',
        messageId,
        today,
        todaySheet.getName(),
        insertedRow,
        record.email
      );

      syncRecruiterMessageToAllJobs_(
         message,
         messages,
         index,
         thread,
         timeZone
      );
      added++;

    });

  });


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'Recruiter emails found: ' +
    recruiterEmailsFound
  );

  Logger.log(
    'New recruiter rows added: ' +
    added
  );

  Logger.log(
    'Duplicates skipped: ' +
    duplicatesSkipped
  );

  Logger.log(
    'Recruiter sync finished successfully.'
  );
}



// =====================================================
// CREATE / GET HIDDEN PROCESSED SHEET
// =====================================================

function getOrCreateProcessedSheet_(spreadsheet) {

  let sheet =
    spreadsheet.getSheetByName('_Processed');


  if (!sheet) {

    sheet =
      spreadsheet.insertSheet('_Processed');


    sheet.getRange(
      1,
      1,
      1,
      7
    ).setValues([[
      'Type',
      'Gmail Message ID',
      'Processed At',
      'Daily Sheet',
      'Row',
      'Key',
      'Notes'
    ]]);


    sheet
      .getRange('A1:G1')
      .setFontWeight('bold');


    // Hide this helper tab
    sheet.hideSheet();

  }


  return sheet;
}



// =====================================================
// CHECK WHETHER EMAIL WAS ALREADY PROCESSED
// =====================================================

function isAlreadyProcessed_(
  processedSheet,
  type,
  messageId
) {

  const lastRow =
    processedSheet.getLastRow();


  if (lastRow < 2) {
    return false;
  }


  const data =
    processedSheet
      .getRange(
        2,
        1,
        lastRow - 1,
        2
      )
      .getValues();


  return data.some(row => {

    return (
      String(row[0]) === String(type) &&
      String(row[1]) === String(messageId)
    );

  });
}



// =====================================================
// SAVE PROCESSED MESSAGE
// =====================================================

function markAsProcessed_(
  processedSheet,
  type,
  messageId,
  date,
  sheetName,
  rowNumber,
  key
) {

  processedSheet.appendRow([
    type,
    messageId,
    new Date(),
    sheetName,
    rowNumber,
    key || '',
    ''
  ]);

}



// =====================================================
// EXTRACT RECRUITER INFORMATION
// =====================================================

function extractRecruiterRecord_(
  message,
  messages,
  currentIndex,
  thread,
  timeZone
) {

  const recipient =
    parseEmailAddress_(
      message.getTo()
    );


  let recruiterName =
    recipient.name;


  let recruiterEmail =
    recipient.email;


  // If Gmail recipient name is missing,
  // try to find it from an earlier message
  // in the same thread.

  if (!recruiterName) {

    for (
      let i = currentIndex - 1;
      i >= 0;
      i--
    ) {

      const sender =
        parseEmailAddress_(
          messages[i].getFrom()
        );


      if (
        sender.email &&
        recruiterEmail &&
        sender.email.toLowerCase() ===
        recruiterEmail.toLowerCase()
      ) {

        recruiterName =
          sender.name;

        break;
      }
    }
  }


  const company =
    extractCompanyFromEmail_(
      recruiterEmail
    );


  const phone =
    extractRecruiterPhone_(
      messages,
      currentIndex,
      recruiterEmail
    );


  const jobTitle =
    extractJobTitleFromSubject_(
      message.getSubject()
    );


  const status =
    determineRecruiterSentStatus_(
      messages,
      currentIndex
    );


  const date =
    Utilities.formatDate(
      message.getDate(),
      timeZone,
      'MM/dd/yyyy'
    );


  const emailLink =
    'https://mail.google.com/mail/u/0/#all/' +
    thread.getId();


  return {

    date: date,

    company: company,

    recruiterName: recruiterName,

    phone: phone,

    email: recruiterEmail,

    jobTitle: jobTitle,

    status: status,

    emailLink: emailLink

  };
}



// =====================================================
// PARSE NAME + EMAIL
//
// Example:
//
// John Smith <john@company.com>
//
// becomes:
//
// name  = John Smith
// email = john@company.com
// =====================================================

function parseEmailAddress_(text) {

  if (!text) {

    return {
      name: '',
      email: ''
    };
  }


  // If multiple recipients exist,
  // use the first one for now.

  const firstRecipient =
    text.split(',')[0].trim();


  const bracketMatch =
    firstRecipient.match(
      /^(?:"?([^"<]+)"?\s*)?<([^>]+)>$/
    );


  if (bracketMatch) {

    return {

      name:
        (bracketMatch[1] || '')
          .trim(),

      email:
        (bracketMatch[2] || '')
          .trim()
          .toLowerCase()

    };
  }


  const emailMatch =
    firstRecipient.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );


  return {

    name: '',

    email:
      emailMatch
        ? emailMatch[0].toLowerCase()
        : ''

  };
}



// =====================================================
// GET COMPANY FROM RECRUITER EMAIL DOMAIN
//
// Example:
//
// john@teksystems.com
//
// becomes approximately:
//
// Teksystems
//
// Generic Gmail/Yahoo/etc. addresses remain blank.
// =====================================================

function extractCompanyFromEmail_(email) {

  if (!email || !email.includes('@')) {
    return '';
  }


  const domain =
    email
      .split('@')[1]
      .toLowerCase();


  const genericDomains = [

    'gmail.com',
    'googlemail.com',

    'yahoo.com',
    'ymail.com',

    'outlook.com',
    'hotmail.com',
    'live.com',

    'icloud.com',
    'me.com',

    'aol.com'

  ];


  if (genericDomains.includes(domain)) {
    return '';
  }


  let name =
    domain.split('.')[0];


  name =
    name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c =>
        c.toUpperCase()
      );


  return name;
}



// =====================================================
// EXTRACT RECRUITER PHONE
//
// Looks primarily at earlier incoming messages.
// This reduces the chance of accidentally taking
// YOUR phone number from your email signature.
// =====================================================

