function runAllJobsPortalBackfillBatch() {

  const lock =
    LockService.getScriptLock();


  if (!lock.tryLock(5000)) {

    Logger.log(
      'Another Job Tracker process is currently running. This batch will try again later.'
    );

    return;
  }


  try {

    const properties =
      PropertiesService
        .getScriptProperties();


    const active =
      properties.getProperty(
        'ALL_JOBS_PORTAL_ACTIVE'
      );


    if (active !== 'true') {

      Logger.log(
        'Historical portal backfill is not active.'
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
          'ALL_JOBS_PORTAL_START'
        ) || 0
      );


    const BATCH_SIZE = 75;


    Logger.log(
      '================================'
    );

    Logger.log(
      'ALL JOBS - HISTORICAL PORTAL BACKFILL'
    );

    Logger.log(
      'Starting Gmail thread position: ' +
      start
    );


    // Search historical Gmail.
    // Individual messages are filtered below.
    const threads =
      GmailApp.search(
        'in:anywhere',
        start,
        BATCH_SIZE
      );


    if (
      threads.length === 0
    ) {

      finishAllJobsPortalBackfill_();

      return;
    }


    let incomingMessagesChecked = 0;
    let applicationsFound = 0;
    let applicationsAdded = 0;
    let duplicatesSkipped = 0;


    threads.forEach(thread => {

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
        // EXISTING APPLICATION DETECTOR
        // ======================================

        const detection =
          detectRealJobApplication_(
            message
          );


        if (!detection.isApplication) {
          return;
        }


        applicationsFound++;


        const messageId =
          message.getId();


        // Historical All Jobs duplicate tracking
        if (
          isAlreadyProcessed_(
            processedSheet,
            'ALL_PORTAL',
            messageId
          )
        ) {

          duplicatesSkipped++;

          return;
        }


        // ======================================
        // EXTRACT APPLICATION INFORMATION
        // ======================================

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


        const applicationNumber =
          getNextPortalApplicationNumber_(
            allJobsSheet
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


        const record = {

          date: date,

          portal: portal,

          company: company,

          position: position,

          applicationNumber:
            applicationNumber,

          status: 'Applied',

          emailLink: emailLink

        };


        // ======================================
        // WRITE INTO ALL JOBS
        // ======================================

        const insertedRow =
          insertPortalApplicationRecord_(
            allJobsSheet,
            record
          );


        const messageDate =
          Utilities.formatDate(
            message.getDate(),
            timeZone,
            'yyyy-MM-dd'
          );


        const applicationKey =
          [
            company,
            position
          ]
            .filter(Boolean)
            .join(' | ');


        markAsProcessed_(
          processedSheet,
          'ALL_PORTAL',
          messageId,
          messageDate,
          'All Jobs',
          insertedRow,
          applicationKey
        );


        applicationsAdded++;

      });

    });


    const nextStart =
      start +
      threads.length;


    properties.setProperty(
      'ALL_JOBS_PORTAL_START',
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
      'Incoming messages checked: ' +
      incomingMessagesChecked
    );

    Logger.log(
      'Applications found: ' +
      applicationsFound
    );

    Logger.log(
      'New All Jobs applications added: ' +
      applicationsAdded
    );

    Logger.log(
      'Duplicates skipped: ' +
      duplicatesSkipped
    );

    Logger.log(
      'Next Gmail position: ' +
      nextStart
    );


    if (
      threads.length <
      BATCH_SIZE
    ) {

      finishAllJobsPortalBackfill_();

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
// FINISH HISTORICAL PORTAL BACKFILL
// =====================================================

function finishAllJobsPortalBackfill_() {

  const properties =
    PropertiesService
      .getScriptProperties();


  properties.setProperty(
    'ALL_JOBS_PORTAL_ACTIVE',
    'false'
  );


  deleteAllJobsPortalBackfillTriggers_();


  Logger.log(
    '================================'
  );

  Logger.log(
    'ALL JOBS PORTAL BACKFILL COMPLETED'
  );

  Logger.log(
    'Temporary portal backfill trigger removed.'
  );

  Logger.log(
    '================================'
  );
}



// =====================================================
// DELETE TEMPORARY PORTAL BACKFILL TRIGGER
// =====================================================

function deleteAllJobsPortalBackfillTriggers_() {

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(trigger => {

    if (
      trigger.getHandlerFunction() ===
      'runAllJobsPortalBackfillBatch'
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

function stopAllJobsPortalBackfill() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_PORTAL_ACTIVE',
      'false'
    );


  deleteAllJobsPortalBackfillTriggers_();


  Logger.log(
    'Historical portal backfill stopped.'
  );
}

// =====================================================
// STEP 12D
// HISTORICAL PORTAL STATUS BACKFILL FOR "ALL JOBS"
// =====================================================

function startAllJobsPortalStatusBackfill() {

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
    'ALL_JOBS_PORTAL_STATUS_START',
    '0'
  );

  properties.setProperty(
    'ALL_JOBS_PORTAL_STATUS_ACTIVE',
    'true'
  );


  deleteAllJobsPortalStatusTriggers_();


  ScriptApp
    .newTrigger(
      'runAllJobsPortalStatusBackfillBatch'
    )
    .timeBased()
    .everyMinutes(10)
    .create();


  Logger.log(
    'Historical portal STATUS backfill started.'
  );

  Logger.log(
    'Running first status batch now...'
  );


  runAllJobsPortalStatusBackfillBatch();
}



// =====================================================
// PROCESS ONE HISTORICAL PORTAL STATUS BATCH
// =====================================================

