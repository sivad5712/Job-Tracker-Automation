function extractRecruiterPhone_(
  messages,
  currentIndex,
  recruiterEmail
) {

  const phoneRegex =
    /(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)\d{3}[\s.\-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d+)?/i;


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
      recruiterEmail &&
      sender.email &&
      sender.email.toLowerCase() ===
      recruiterEmail.toLowerCase()
    ) {

      const body =
        messages[i].getPlainBody() || '';


      const match =
        body.match(phoneRegex);


      if (match) {
        return match[0].trim();
      }
    }

  }


  return '';
}



// =====================================================
// EXTRACT JOB TITLE FROM EMAIL SUBJECT
// =====================================================

function extractJobTitleFromSubject_(subject) {

  if (!subject) {
    return '';
  }


  let cleanSubject =
    subject
      .replace(
        /^(re|fw|fwd)\s*:\s*/gi,
        ''
      )
      .trim();


  const patterns = [

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*java\s+full[\s-]?stack\s+(?:developer|engineer)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*full[\s-]?stack\s+(?:developer|engineer)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*java\s+(?:developer|engineer|architect)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*software\s+(?:developer|engineer|architect)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*backend\s+(?:developer|engineer)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*front[\s-]?end\s+(?:developer|engineer)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*cloud\s+(?:developer|engineer|architect)\b/i,

    /\b(?:senior|sr\.?|lead|principal|staff)?\s*devops\s+(?:developer|engineer)\b/i,

    /\bsoftware development engineer\b/i

  ];


  for (const pattern of patterns) {

    const match =
      cleanSubject.match(pattern);


    if (match) {

      return match[0]
        .replace(/\s+/g, ' ')
        .trim();

    }

  }


  // If a clear role cannot be extracted,
  // preserve the subject instead of inventing one.

  if (cleanSubject.length <= 100) {
    return cleanSubject;
  }


  return cleanSubject.substring(0, 100);
}



// =====================================================
// DETERMINE SENT / FOLLOW-UP SENT
// =====================================================

function determineRecruiterSentStatus_(
  messages,
  currentIndex
) {

  const myEmails =
    getMyEmailAddresses_();


  let previousSentByMe = 0;


  for (
    let i = 0;
    i < currentIndex;
    i++
  ) {

    const sender =
      parseEmailAddress_(
        messages[i].getFrom()
      );


    if (
      sender.email &&
      myEmails.includes(
        sender.email.toLowerCase()
      )
    ) {

      previousSentByMe++;

    }

  }


  if (previousSentByMe > 0) {
    return 'Follow-up Sent';
  }


  return 'Sent';
}



// =====================================================
// GET YOUR GMAIL ADDRESS + ALIASES
// =====================================================

function getMyEmailAddresses_() {

  const emails = [];


  const primary =
    Session
      .getEffectiveUser()
      .getEmail();


  if (primary) {

    emails.push(
      primary.toLowerCase()
    );

  }


  const aliases =
    GmailApp.getAliases();


  aliases.forEach(alias => {

    emails.push(
      alias.toLowerCase()
    );

  });


  return emails;
}



// =====================================================
// INSERT RECRUITER ROW
//
// IMPORTANT:
//
// Portal section is moved automatically.
//
// Always maintains exactly:
//
// 4 blank rows
//
// between recruiter records and Portal section.
// =====================================================

function insertRecruiterRecord_(
  sheet,
  record
) {

  const finder =
    sheet.createTextFinder(
      'PORTAL / DIRECT JOB APPLICATIONS'
    );


  finder.matchEntireCell(true);


  const portalCell =
    finder.findNext();


  if (!portalCell) {

    throw new Error(
      'PORTAL / DIRECT JOB APPLICATIONS section was not found.'
    );

  }


  const portalRow =
    portalCell.getRow();


  // Portal title has exactly 4 blank rows
  // above it.
  //
  // New recruiter record goes immediately
  // before those 4 blank rows.

  const insertionRow =
    portalRow - 4;


  // Insert a new row.
  // Everything below automatically moves down,
  // including Portal data.

  sheet.insertRowBefore(
    insertionRow
  );


  const range =
    sheet.getRange(
      insertionRow,
      1,
      1,
      8
    );


  range.setValues([[
    record.date,
    record.company,
    record.recruiterName,
    record.phone,
    record.email,
    record.jobTitle,
    record.status,
    ''
  ]]);


  // Basic clean formatting

  range
    .setWrap(true)
    .setVerticalAlignment('middle');


  range.setBorder(
    true,
    true,
    true,
    true,
    true,
    true
  );


  // Clickable Gmail link

  sheet
    .getRange(
      insertionRow,
      8
    )
    .setFormula(
      '=HYPERLINK("' +
      record.emailLink +
      '","Open Email")'
    );


  return insertionRow;
}

// =====================================================
// STEP 8 - HIGH RECALL APPLICATION DETECTOR
// =====================================================

function testPortalApplicationEmails() {

  const spreadsheet =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const timeZone =
    spreadsheet.getSpreadsheetTimeZone();

  const today =
    Utilities.formatDate(
      new Date(),
      timeZone,
      'yyyy-MM-dd'
    );

  Logger.log(
    'Scanning ALL incoming emails for applications on: ' +
    today
  );

  const threads =
    GmailApp.search('newer_than:2d');

  const myEmails =
    getMyEmailAddresses_();

  let totalChecked = 0;
  let applicationCount = 0;


  threads.forEach(thread => {

    const messages =
      thread.getMessages();


    messages.forEach(message => {

      const messageDate =
        Utilities.formatDate(
          message.getDate(),
          timeZone,
          'yyyy-MM-dd'
        );


      if (messageDate !== today) {
        return;
      }


      // Ignore emails sent by you
      const sender =
        parseEmailAddress_(
          message.getFrom()
        );


      if (
        sender.email &&
        myEmails.includes(
          sender.email.toLowerCase()
        )
      ) {
        return;
      }


      totalChecked++;


      const detection =
        detectRealJobApplication_(
          message
        );


      if (!detection.isApplication) {
        return;
      }


      applicationCount++;


      const portal =
        detectApplicationPortal_(
          message
        );


      const company =
        extractApplicationCompany_(
          message,
          portal
        );


      const position =
        extractApplicationPosition_(
          message
        );


      Logger.log(
        '================================'
      );

      Logger.log(
        '✅ APPLICATION FOUND'
      );

      Logger.log(
        'Date: ' +
        message.getDate()
      );

      Logger.log(
        'From: ' +
        message.getFrom()
      );

      Logger.log(
        'Subject: ' +
        message.getSubject()
      );

      Logger.log(
        'Portal: ' +
        portal
      );

      Logger.log(
        'Company: ' +
        company
      );

      Logger.log(
        'Position: ' +
        position
      );

      Logger.log(
        'Confidence score: ' +
        detection.score
      );

      Logger.log(
        'Reason: ' +
        detection.reason
      );

      Logger.log(
        'Message ID: ' +
        message.getId()
      );

    });

  });


  Logger.log(
    '================================'
  );

  Logger.log(
    'Messages checked today: ' +
    totalChecked
  );

  Logger.log(
    'Confirmed/probable applications found: ' +
    applicationCount
  );
}



// =====================================================
// GET EMAIL TEXT
// =====================================================

