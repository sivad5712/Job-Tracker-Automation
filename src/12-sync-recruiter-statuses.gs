function syncRecruiterStatuses() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

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
    'Scanning recruiter/vendor status emails for: ' +
    today
  );


  const threads =
    GmailApp.search(
      'newer_than:2d'
    );


  let recruiterStatusEmailsFound = 0;
  let statusesUpdated = 0;
  let duplicatesSkipped = 0;
  let sameStatusSkipped = 0;
  let progressionSkipped = 0;
  let unmatched = 0;


  threads.forEach(thread => {

    const messages =
      thread.getMessages();


    messages.forEach(message => {

      // ==========================================
      // ONLY TODAY
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


      const messageId =
        message.getId();


      // ==========================================
      // ALREADY PROCESSED?
      // ==========================================

      if (
        isAlreadyProcessed_(
          processedSheet,
          'RECRUITER_STATUS',
          messageId
        )
      ) {

        duplicatesSkipped++;

        return;
      }


      // ==========================================
      // FIND CORRECT RECRUITER ROW
      // ==========================================

      const match =
        findMatchingRecruiterRecord_(
          spreadsheet,
          message,
          thread
        );


      // This prevents random incoming email
      // from being treated as recruiter activity.
      if (!match) {
        return;
      }


      // ==========================================
      // DETECT STATUS
      // ==========================================

      const detection =
        detectRecruiterStatus_(
          message,
          thread,
          myEmails
        );


      // Matched recruiter, but email does not
      // represent a useful status change.
      if (!detection.status) {

        return;
      }


      recruiterStatusEmailsFound++;

      const allJobsStatusResult =
      syncRecruiterStatusToAllJobs_(
      message,
      thread,
      detection,
     timeZone
  );


      const currentStatus =
        String(
          match.status || ''
        ).trim();


      // ==========================================
      // SAME STATUS - SKIP
      // ==========================================

      if (
        currentStatus.toLowerCase() ===
        detection.status.toLowerCase()
      ) {

        markAsProcessed_(
          processedSheet,
          'RECRUITER_STATUS',
          messageId,
          today,
          match.sheet.getName(),
          match.row,
          match.email
        );


        sameStatusSkipped++;


        Logger.log(
          '--------------------------------'
        );

        Logger.log(
          'RECRUITER STATUS ALREADY SAME - SKIPPED'
        );

        Logger.log(
          'Recruiter: ' +
          match.recruiterName
        );

        Logger.log(
          'Company: ' +
          match.company
        );

        Logger.log(
          'Job: ' +
          match.jobTitle
        );

        Logger.log(
          'Current status: ' +
          currentStatus
        );


        return;
      }


      // ==========================================
      // PREVENT STATUS FROM MOVING BACKWARD
      // ==========================================

      if (
        !shouldUpdateRecruiterStatus_(
          currentStatus,
          detection.status
        )
      ) {

        markAsProcessed_(
          processedSheet,
          'RECRUITER_STATUS',
          messageId,
          today,
          match.sheet.getName(),
          match.row,
          match.email
        );


        progressionSkipped++;


        Logger.log(
          '--------------------------------'
        );

        Logger.log(
          'RECRUITER STATUS DOWNGRADE SKIPPED'
        );

        Logger.log(
          'Current: ' +
          currentStatus
        );

        Logger.log(
          'Detected: ' +
          detection.status
        );


        return;
      }


      // ==========================================
      // UPDATE STATUS COLUMN G
      // ==========================================

      match.sheet
        .getRange(
          match.row,
          7
        )
        .setValue(
          detection.status
        );


      markAsProcessed_(
        processedSheet,
        'RECRUITER_STATUS',
        messageId,
        today,
        match.sheet.getName(),
        match.row,
        match.email
      );


      statusesUpdated++;


      Logger.log(
        '--------------------------------'
      );

      Logger.log(
        'RECRUITER STATUS UPDATED'
      );

      Logger.log(
        'Company: ' +
        match.company
      );

      Logger.log(
        'Recruiter: ' +
        match.recruiterName
      );

      Logger.log(
        'Email: ' +
        match.email
      );

      Logger.log(
        'Job: ' +
        match.jobTitle
      );

      Logger.log(
        'Old status: ' +
        currentStatus
      );

      Logger.log(
        'New status: ' +
        detection.status
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
        detection.reason
      );

    });

  });


  Logger.log(
    '================================'
  );

  Logger.log(
    'Recruiter status emails found: ' +
    recruiterStatusEmailsFound
  );

  Logger.log(
    'Recruiter statuses updated: ' +
    statusesUpdated
  );

  Logger.log(
    'Already-processed emails skipped: ' +
    duplicatesSkipped
  );

  Logger.log(
    'Same statuses skipped: ' +
    sameStatusSkipped
  );

  Logger.log(
    'Backward status changes skipped: ' +
    progressionSkipped
  );

  Logger.log(
    'Recruiter status sync completed.'
  );
}



// =====================================================
// DETECT RECRUITER STATUS
// =====================================================

