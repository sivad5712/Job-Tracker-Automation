function runAllJobsRecruiterBackfillBatch() {

  const lock =
    LockService.getScriptLock();


  if (!lock.tryLock(5000)) {

    Logger.log(
      'Another historical backfill batch is already running.'
    );

    return;
  }


  try {

    const properties =
      PropertiesService
        .getScriptProperties();


    const active =
      properties.getProperty(
        'ALL_JOBS_RECRUITER_ACTIVE'
      );


    if (active !== 'true') {

      Logger.log(
        'Historical recruiter backfill is not active.'
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
          'ALL_JOBS_RECRUITER_START'
        ) || 0
      );


    // Small batch so Apps Script stays safely
    // below the execution-time limit.
    const BATCH_SIZE = 75;


    Logger.log(
      '================================'
    );

    Logger.log(
      'ALL JOBS - HISTORICAL RECRUITER BACKFILL'
    );

    Logger.log(
      'Starting Gmail thread position: ' +
      start
    );


    const threads =
      GmailApp.search(
        'in:sent',
        start,
        BATCH_SIZE
      );


    // ==========================================
    // NOTHING LEFT = BACKFILL COMPLETE
    // ==========================================

    if (
      threads.length === 0
    ) {

      finishAllJobsRecruiterBackfill_();

      return;
    }


    let outgoingMessagesChecked = 0;
    let recruiterEmailsFound = 0;
    let recruiterRowsAdded = 0;
    let duplicatesSkipped = 0;


    threads.forEach(thread => {

      const messages =
        thread.getMessages();


      messages.forEach(
        (message, index) => {

          // ======================================
          // ONLY EMAILS SENT BY YOU
          // ======================================

          const sender =
            parseEmailAddress_(
              message.getFrom()
            );


          if (
            !sender.email ||
            !myEmails.includes(
              sender.email.toLowerCase()
            )
          ) {

            return;
          }


          outgoingMessagesChecked++;


          // ======================================
          // EXISTING RECRUITER DETECTION
          // ======================================

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


          // Separate historical duplicate key.
          // Daily-sheet processing does not interfere.
          if (
            isAlreadyProcessed_(
              processedSheet,
              'ALL_RECRUITER',
              messageId
            )
          ) {

            duplicatesSkipped++;

            return;
          }


          // ======================================
          // EXTRACT SAME DATA AS DAILY TRACKER
          // ======================================

          const record =
            extractRecruiterRecord_(
              message,
              messages,
              index,
              thread,
              timeZone
            );


          // ======================================
          // WRITE INTO ALL JOBS
          // ======================================

          const insertedRow =
            insertRecruiterRecord_(
              allJobsSheet,
              record
            );


          const messageDate =
            Utilities.formatDate(
              message.getDate(),
              timeZone,
              'yyyy-MM-dd'
            );


          markAsProcessed_(
            processedSheet,
            'ALL_RECRUITER',
            messageId,
            messageDate,
            'All Jobs',
            insertedRow,
            record.email
          );


          recruiterRowsAdded++;

        }
      );

    });


    // Move to next page of Gmail threads.
    const nextStart =
      start +
      threads.length;


    properties.setProperty(
      'ALL_JOBS_RECRUITER_START',
      String(nextStart)
    );


    Logger.log(
      '--------------------------------'
    );

    Logger.log(
      'Gmail threads processed this batch: ' +
      threads.length
    );

    Logger.log(
      'Outgoing messages checked: ' +
      outgoingMessagesChecked
    );

    Logger.log(
      'Recruiter/vendor emails found: ' +
      recruiterEmailsFound
    );

    Logger.log(
      'New All Jobs recruiter rows added: ' +
      recruiterRowsAdded
    );

    Logger.log(
      'Duplicates skipped: ' +
      duplicatesSkipped
    );

    Logger.log(
      'Next Gmail position: ' +
      nextStart
    );


    // If fewer than 25 threads came back,
    // we have reached the end.
    if (
      threads.length <
      BATCH_SIZE
    ) {

      finishAllJobsRecruiterBackfill_();

    } else {

      Logger.log(
        'More historical Gmail remains.'
      );

      Logger.log(
        'The temporary trigger will continue automatically.'
      );

    }


  } finally {

    lock.releaseLock();

  }
}



// =====================================================
// FINISH RECRUITER HISTORICAL BACKFILL
// =====================================================

function finishAllJobsRecruiterBackfill_() {

  const properties =
    PropertiesService
      .getScriptProperties();


  properties.setProperty(
    'ALL_JOBS_RECRUITER_ACTIVE',
    'false'
  );


  deleteAllJobsRecruiterBackfillTriggers_();


  Logger.log(
    '================================'
  );

  Logger.log(
    'ALL JOBS RECRUITER BACKFILL COMPLETED'
  );

  Logger.log(
    'Temporary recruiter backfill trigger removed.'
  );

  Logger.log(
    '================================'
  );
}



// =====================================================
// DELETE TEMPORARY RECRUITER BACKFILL TRIGGER
// =====================================================

function deleteAllJobsRecruiterBackfillTriggers_() {

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(trigger => {

    if (
      trigger.getHandlerFunction() ===
      'runAllJobsRecruiterBackfillBatch'
    ) {

      ScriptApp.deleteTrigger(
        trigger
      );
    }

  });
}



// =====================================================
// OPTIONAL EMERGENCY STOP
// =====================================================

function stopAllJobsRecruiterBackfill() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_RECRUITER_ACTIVE',
      'false'
    );


  deleteAllJobsRecruiterBackfillTriggers_();


  Logger.log(
    'Historical recruiter backfill stopped.'
  );
}
// =====================================================
// STEP 12C
// ONE-TIME HISTORICAL PORTAL APPLICATION BACKFILL
// INTO "ALL JOBS"
// =====================================================

function startAllJobsPortalBackfill() {

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


  const properties =
    PropertiesService
      .getScriptProperties();


  properties.setProperty(
    'ALL_JOBS_PORTAL_START',
    '0'
  );

  properties.setProperty(
    'ALL_JOBS_PORTAL_ACTIVE',
    'true'
  );


  deleteAllJobsPortalBackfillTriggers_();


  ScriptApp
    .newTrigger(
      'runAllJobsPortalBackfillBatch'
    )
    .timeBased()
    .everyMinutes(10)
    .create();


  Logger.log(
    'Historical portal/application backfill started.'
  );

  Logger.log(
    'Running first batch now...'
  );


  runAllJobsPortalBackfillBatch();
}



// =====================================================
// PROCESS ONE HISTORICAL PORTAL BATCH
// =====================================================

