function runAllJobsRecruiterStatusBackfillBatch() {

  const lock =
    LockService.getScriptLock();


  if (!lock.tryLock(5000)) {

    Logger.log(
      'Another Job Tracker process is running. Recruiter status batch will try again later.'
    );

    return;
  }


  try {

    const properties =
      PropertiesService
        .getScriptProperties();


    const active =
      properties.getProperty(
        'ALL_JOBS_RECRUITER_STATUS_ACTIVE'
      );


    if (active !== 'true') {

      Logger.log(
        'Historical recruiter status backfill is not active.'
      );

      return;
    }


    const spreadsheet =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );


    const timeZone =
      spreadsheet
        .getSpreadsheetTimeZone();


    const allJobsSheet =
      spreadsheet.getSheetByName(
        'All Jobs'
      );


    if (!allJobsSheet) {

      throw new Error(
        'All Jobs sheet was not found.'
      );
    }


    const processedSheet =
      getOrCreateProcessedSheet_(
        spreadsheet
      );


    const myEmails =
      getMyEmailAddresses_();


    const start =
      Number(
        properties.getProperty(
          'ALL_JOBS_RECRUITER_STATUS_START'
        ) || 0
      );


    const BATCH_SIZE = 75;


    Logger.log(
      '================================'
    );

    Logger.log(
      'ALL JOBS - HISTORICAL RECRUITER STATUS BACKFILL'
    );

    Logger.log(
      'Starting Gmail thread position: ' +
      start
    );


    const threads =
      GmailApp.search(
        'in:anywhere',
        start,
        BATCH_SIZE
      );


    if (
      threads.length === 0
    ) {

      finishAllJobsRecruiterStatusBackfill_();

      return;
    }


    let incomingMessagesChecked = 0;
    let statusEmailsFound = 0;
    let rowsUpdated = 0;
    let sameStatusSkipped = 0;
    let backwardSkipped = 0;
    let duplicatesSkipped = 0;
    let unmatched = 0;


    threads.forEach(thread => {

      // Gmail returns messages in chronological order.
      // That is what we want here:
      //
      // Replied -> RTR -> Submitted -> Interview...
      //
      // Our existing progression rules then prevent
      // an older/lower stage from replacing a later one.

      const messages =
        thread.getMessages();


      messages.forEach(message => {

        // ======================================
        // IGNORE EMAILS SENT BY YOU
        // ======================================

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


        incomingMessagesChecked++;


        // ======================================
        // USE EXISTING RECRUITER STATUS DETECTOR
        // ======================================

        const detection =
          detectRecruiterStatus_(
            message,
            thread,
            myEmails
          );


        if (!detection.status) {
          return;
        }


        statusEmailsFound++;


        const messageId =
          message.getId();


        // ======================================
        // HISTORICAL DUPLICATE CHECK
        // ======================================

        if (
          isAlreadyProcessed_(
            processedSheet,
            'ALL_RECRUITER_STATUS',
            messageId
          )
        ) {

          duplicatesSkipped++;

          return;
        }


        // ======================================
        // FIND MATCHING ALL JOBS RECRUITER ROWS
        // ======================================

        const matches =
          findMatchingAllJobsRecruiterRows_(
            allJobsSheet,
            message,
            thread
          );


        if (
          !matches ||
          matches.length === 0
        ) {

          unmatched++;

          return;
        }


        let messageMatched = false;


        matches.forEach(match => {

          const currentStatus =
            String(
              match.status || ''
            ).trim();


          // ====================================
          // SAME STATUS
          // ====================================

          if (
            currentStatus.toLowerCase() ===
            detection.status.toLowerCase()
          ) {

            sameStatusSkipped++;

            messageMatched = true;

            return;
          }


          // ====================================
          // USE EXISTING PROGRESSION RULES
          // ====================================

          if (
            !shouldUpdateRecruiterStatus_(
              currentStatus,
              detection.status
            )
          ) {

            backwardSkipped++;

            messageMatched = true;

            return;
          }


          // ====================================
          // UPDATE STATUS COLUMN G
          // ====================================

          allJobsSheet
            .getRange(
              match.row,
              7
            )
            .setValue(
              detection.status
            );


          rowsUpdated++;

          messageMatched = true;


          Logger.log(
            '--------------------------------'
          );

          Logger.log(
            'ALL JOBS RECRUITER STATUS UPDATED'
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
            'Reason: ' +
            detection.reason
          );

        });


        // ======================================
        // MARK MESSAGE PROCESSED
        // ======================================

        if (messageMatched) {

          const messageDate =
            Utilities.formatDate(
              message.getDate(),
              timeZone,
              'yyyy-MM-dd'
            );


          markAsProcessed_(
            processedSheet,
            'ALL_RECRUITER_STATUS',
            messageId,
            messageDate,
            'All Jobs',
            matches[0].row,
            matches[0].email
          );

        }

      });

    });


    // ==========================================
    // MOVE TO NEXT GMAIL BATCH
    // ==========================================

    const nextStart =
      start +
      threads.length;


    properties.setProperty(
      'ALL_JOBS_RECRUITER_STATUS_START',
      String(nextStart)
    );


    Logger.log(
      '================================'
    );

    Logger.log(
      'Gmail threads processed: ' +
      threads.length
    );

    Logger.log(
      'Incoming messages checked: ' +
      incomingMessagesChecked
    );

    Logger.log(
      'Recruiter status emails found: ' +
      statusEmailsFound
    );

    Logger.log(
      'All Jobs recruiter rows updated: ' +
      rowsUpdated
    );

    Logger.log(
      'Same statuses skipped: ' +
      sameStatusSkipped
    );

    Logger.log(
      'Backward status changes skipped: ' +
      backwardSkipped
    );

    Logger.log(
      'Duplicates skipped: ' +
      duplicatesSkipped
    );

    Logger.log(
      'Unmatched status emails: ' +
      unmatched
    );

    Logger.log(
      'Next Gmail position: ' +
      nextStart
    );


    if (
      threads.length <
      BATCH_SIZE
    ) {

      finishAllJobsRecruiterStatusBackfill_();

    } else {

      Logger.log(
        'More historical recruiter status Gmail remains.'
      );

    }


  } finally {

    lock.releaseLock();

  }
}



// =====================================================
// FIND RECRUITER ROWS INSIDE "ALL JOBS"
// =====================================================

