function runAllJobsPortalStatusBackfillBatch() {

  const lock =
    LockService.getScriptLock();


  if (!lock.tryLock(5000)) {

    Logger.log(
      'Another Job Tracker process is running. Status batch will try again later.'
    );

    return;
  }


  try {

    const properties =
      PropertiesService
        .getScriptProperties();


    const active =
      properties.getProperty(
        'ALL_JOBS_PORTAL_STATUS_ACTIVE'
      );


    if (active !== 'true') {

      Logger.log(
        'Historical portal status backfill is not active.'
      );

      return;
    }


    const spreadsheet =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );


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
          'ALL_JOBS_PORTAL_STATUS_START'
        ) || 0
      );


    const BATCH_SIZE = 75;


    Logger.log(
      '================================'
    );

    Logger.log(
      'ALL JOBS - HISTORICAL PORTAL STATUS BACKFILL'
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

      finishAllJobsPortalStatusBackfill_();

      return;
    }


    let statusEmailsFound = 0;
    let statusesUpdated = 0;
    let olderStatusesSkipped = 0;
    let duplicatesSkipped = 0;
    let unmatched = 0;


    threads.forEach(thread => {

      // IMPORTANT:
      // Process newest message first.
      const messages =
        thread
          .getMessages()
          .slice()
          .reverse();


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


        // ======================================
        // DETECT HISTORICAL STATUS
        // ======================================

        const detection =
          detectHistoricalPortalStatus_(
            message
          );


        if (!detection.status) {
          return;
        }


        statusEmailsFound++;


        const messageId =
          message.getId();


        if (
          isAlreadyProcessed_(
            processedSheet,
            'ALL_PORTAL_STATUS',
            messageId
          )
        ) {

          duplicatesSkipped++;

          return;
        }


        // ======================================
        // FIND APPLICATION INSIDE ALL JOBS
        // ======================================

        const match =
          findMatchingAllJobsPortalApplication_(
            allJobsSheet,
            message,
            thread
          );


        if (!match) {

          unmatched++;

          return;
        }


        const currentStatus =
          String(
            match.status || ''
          ).trim();


        // ======================================
        // NEWEST STATUS WINS
        //
        // All historical applications begin
        // as "Applied".
        //
        // Once we find the newest later status,
        // older status emails cannot overwrite it.
        // ======================================

        if (
          currentStatus &&
          currentStatus !== 'Applied'
        ) {

          markAsProcessed_(
            processedSheet,
            'ALL_PORTAL_STATUS',
            messageId,
            '',
            'All Jobs',
            match.row,
            match.company +
              ' | ' +
              match.position
          );


          olderStatusesSkipped++;

          return;
        }


        // ======================================
        // UPDATE STATUS
        // ======================================

        allJobsSheet
          .getRange(
            match.row,
            6
          )
          .setValue(
            detection.status
          );


        markAsProcessed_(
          processedSheet,
          'ALL_PORTAL_STATUS',
          messageId,
          '',
          'All Jobs',
          match.row,
          match.company +
            ' | ' +
            match.position
        );


        statusesUpdated++;


        Logger.log(
          '--------------------------------'
        );

        Logger.log(
          'ALL JOBS APPLICATION STATUS UPDATED'
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

    });


    const nextStart =
      start +
      threads.length;


    properties.setProperty(
      'ALL_JOBS_PORTAL_STATUS_START',
      String(nextStart)
    );


    Logger.log(
      '================================'
    );

    Logger.log(
      'Status emails found this batch: ' +
      statusEmailsFound
    );

    Logger.log(
      'All Jobs statuses updated: ' +
      statusesUpdated
    );

    Logger.log(
      'Older statuses skipped: ' +
      olderStatusesSkipped
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

      finishAllJobsPortalStatusBackfill_();

    } else {

      Logger.log(
        'More historical status Gmail remains.'
      );

    }


  } finally {

    lock.releaseLock();

  }
}



// =====================================================
// HISTORICAL PORTAL STATUS DETECTOR
// USE ONLY NEWEST PART OF EMAIL
// =====================================================

