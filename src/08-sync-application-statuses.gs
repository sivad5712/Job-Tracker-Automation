function syncApplicationStatuses() {

  const spreadsheet =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const timeZone =
    spreadsheet.getSpreadsheetTimeZone();

  const processedSheet =
    getOrCreateProcessedSheet_(
      spreadsheet
    );

  const today =
    Utilities.formatDate(
      new Date(),
      timeZone,
      'yyyy-MM-dd'
    );

  const myEmails =
    getMyEmailAddresses_();

  Logger.log(
    'Scanning application status emails for: ' +
    today
  );


  const threads =
    GmailApp.search(
      'newer_than:2d'
    );


  let statusEmailsFound = 0;
  let applicationsUpdated = 0;
  let duplicatesSkipped = 0;
  let unmatched = 0;


  threads.forEach(thread => {

    const messages =
      thread.getMessages();


    messages.forEach(message => {

      // ==========================================
      // ONLY TODAY'S EMAILS
      // ==========================================

      const messageDate =
        Utilities.formatDate(
          message.getDate(),
          timeZone,
          'yyyy-MM-dd'
        );


      if (messageDate !== today) {
        return;
      }


      // ==========================================
      // IGNORE EMAILS SENT BY YOU
      // ==========================================

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


      // ==========================================
      // DETECT STATUS
      // ==========================================

      const statusDetection =
        detectApplicationStatus_(
          message
        );


      if (!statusDetection.status) {
        return;
      }


      statusEmailsFound++;


      const messageId =
        message.getId();


      // ==========================================
      // DUPLICATE STATUS EMAIL CHECK
      // ==========================================

      if (
        isAlreadyProcessed_(
          processedSheet,
          'STATUS',
          messageId
        )
      ) {

        duplicatesSkipped++;

        return;
      }
      const allJobsStatusResult =
       syncPortalStatusToAllJobs_(
       message,
       thread,
       statusDetection,
       timeZone
  );

      // ==========================================
      // FIND EXISTING APPLICATION
      // ==========================================

      const match =
        findMatchingApplication_(
          spreadsheet,
          message,
          thread
        );


      if (!match) {

  // It may be an older application that exists
  // in All Jobs but predates our daily tracker.
  if (
    allJobsStatusResult &&
    allJobsStatusResult.matched
  ) {

    markAsProcessed_(
      processedSheet,
      'STATUS',
      messageId,
      today,
      'All Jobs',
      allJobsStatusResult.row || '',
      ''
    );


    Logger.log(
      'Status handled by All Jobs historical record.'
    );


    return;
  }


  unmatched++;


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'STATUS EMAIL FOUND BUT NO APPLICATION MATCH'
  );

  Logger.log(
    'Status: ' +
    statusDetection.status
  );

  Logger.log(
    'From: ' +
    message.getFrom()
  );

  Logger.log(
    'Subject: ' +
    message.getSubject()
  );


  return;
}


      // ==========================================
      // UPDATE STATUS COLUMN
      // ==========================================

    const oldStatus =
  match.sheet
    .getRange(
      match.row,
      6
    )
    .getDisplayValue();


// ==========================================
// SKIP IF STATUS IS ALREADY THE SAME
// ==========================================

if (
  oldStatus.trim().toLowerCase() ===
  statusDetection.status.trim().toLowerCase()
) {

  // Mark this Gmail message as processed
  // so it will not be checked again later.
  markAsProcessed_(
    processedSheet,
    'STATUS',
    messageId,
    today,
    match.sheet.getName(),
    match.row,
    match.company +
      ' | ' +
      match.position
  );


  duplicatesSkipped++;


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'STATUS ALREADY SAME - SKIPPED'
  );

  Logger.log(
    'Company: ' +
    match.company
  );

  Logger.log(
    'Position: ' +
    match.position
  );

  Logger.log(
    'Current status: ' +
    oldStatus
  );


  return;
}


// ==========================================
// STATUS IS DIFFERENT - UPDATE IT
// ==========================================

match.sheet
  .getRange(
    match.row,
    6
  )
  .setValue(
    statusDetection.status
  );


      // ==========================================
      // MARK STATUS EMAIL PROCESSED
      // ==========================================

      markAsProcessed_(
        processedSheet,
        'STATUS',
        messageId,
        today,
        match.sheet.getName(),
        match.row,
        match.company +
          ' | ' +
          match.position
      );


      applicationsUpdated++;


      Logger.log(
        '--------------------------------'
      );

      Logger.log(
        'APPLICATION STATUS UPDATED'
      );

      Logger.log(
        'Company: ' +
        match.company
      );

      Logger.log(
        'Position: ' +
        match.position
      );

      Logger.log(
        'Old status: ' +
        oldStatus
      );

      Logger.log(
        'New status: ' +
        statusDetection.status
      );

      Logger.log(
        'Daily sheet: ' +
        match.sheet.getName()
      );

      Logger.log(
        'Row: ' +
        match.row
      );

      Logger.log(
        'Match score: ' +
        match.score
      );

      Logger.log(
        'Reason: ' +
        statusDetection.reason
      );

    });

  });


  Logger.log(
    '================================'
  );

  Logger.log(
    'Status emails found: ' +
    statusEmailsFound
  );

  Logger.log(
    'Applications updated: ' +
    applicationsUpdated
  );

  Logger.log(
    'Duplicates skipped: ' +
    duplicatesSkipped
  );

  Logger.log(
    'Status emails unmatched: ' +
    unmatched
  );

  Logger.log(
    'Application status sync completed.'
  );
}



// =====================================================
// DETECT APPLICATION STATUS
// =====================================================

