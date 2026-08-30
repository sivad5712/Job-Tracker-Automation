function findMatchingAllJobsRecruiterRows_(
  sheet,
  message,
  thread
) {

  const recruiterFinder =
    sheet.createTextFinder(
      'RECRUITER / VENDOR EMAILS SENT'
    );


  recruiterFinder.matchEntireCell(true);


  const recruiterCell =
    recruiterFinder.findNext();


  const portalFinder =
    sheet.createTextFinder(
      'PORTAL / DIRECT JOB APPLICATIONS'
    );


  portalFinder.matchEntireCell(true);


  const portalCell =
    portalFinder.findNext();


  if (
    !recruiterCell ||
    !portalCell
  ) {

    return [];
  }


  const firstRow =
    recruiterCell.getRow() + 2;


  const lastRow =
    portalCell.getRow() - 5;


  if (
    lastRow <
    firstRow
  ) {

    return [];
  }


  const sender =
    parseEmailAddress_(
      message.getFrom()
    );


  const senderEmail =
    String(
      sender.email || ''
    )
      .toLowerCase()
      .trim();


  const emailText =
    normalizeApplicationText_(

      (message.getSubject() || '') +
      '\n' +
      getNewestRecruiterReplyText_(
        message
      ) +
      '\n' +
      (message.getFrom() || '')

    );


  const threadId =
    thread.getId();


  const data =
    sheet
      .getRange(
        firstRow,
        1,
        lastRow -
          firstRow +
          1,
        8
      )
      .getDisplayValues();


  const sameThreadMatches = [];
  const fallbackCandidates = [];


  data.forEach(
    (row, index) => {

      const company =
        String(
          row[1] || ''
        ).trim();


      const recruiterName =
        String(
          row[2] || ''
        ).trim();


      const recruiterEmail =
        String(
          row[4] || ''
        )
          .toLowerCase()
          .trim();


      const jobTitle =
        String(
          row[5] || ''
        ).trim();


      const status =
        String(
          row[6] || ''
        ).trim();


      if (
        !company &&
        !recruiterEmail &&
        !jobTitle
      ) {

        return;
      }


      const realRow =
        firstRow +
        index;


      const linkFormula =
        sheet
          .getRange(
            realRow,
            8
          )
          .getFormula();


      // ====================================
      // BEST MATCH:
      // SAME GMAIL THREAD
      // ====================================

      if (
        linkFormula &&
        linkFormula.includes(
          threadId
        )
      ) {

        sameThreadMatches.push({

          row: realRow,

          company: company,

          recruiterName:
            recruiterName,

          email:
            recruiterEmail,

          jobTitle:
            jobTitle,

          status:
            status,

          score:
            100

        });


        return;
      }


      // ====================================
      // FALLBACK MATCH
      // ====================================

      let score = 0;

      let emailMatch = false;
      let jobMatch = false;
      let companyMatch = false;


      if (
        senderEmail &&
        recruiterEmail &&
        senderEmail ===
          recruiterEmail
      ) {

        emailMatch = true;

        score += 12;
      }


      const jobNormalized =
        normalizeApplicationText_(
          jobTitle
        );


      if (
        jobNormalized.length >= 5 &&
        emailText.includes(
          jobNormalized
        )
      ) {

        jobMatch = true;

        score += 10;
      }


      const companyNormalized =
        normalizeApplicationText_(
          company
        );


      if (
        companyNormalized.length >= 3 &&
        emailText.includes(
          companyNormalized
        )
      ) {

        companyMatch = true;

        score += 7;
      }


      // Sender email by itself is NOT enough.
      const reliableFallback =
        emailMatch &&
        (
          jobMatch ||
          companyMatch
        );


      if (!reliableFallback) {
        return;
      }


      fallbackCandidates.push({

        row: realRow,

        company: company,

        recruiterName:
          recruiterName,

        email:
          recruiterEmail,

        jobTitle:
          jobTitle,

        status:
          status,

        score:
          score

      });

    }
  );


  // ==========================================
  // SAME THREAD ALWAYS WINS
  //
  // Multiple outgoing emails in the same
  // thread may produce multiple All Jobs rows.
  // They should all reflect that thread's status.
  // ==========================================

  if (
    sameThreadMatches.length > 0
  ) {

    return sameThreadMatches;
  }


  // ==========================================
  // FALLBACK MUST BE UNIQUE
  // ==========================================

  if (
    fallbackCandidates.length === 0
  ) {

    return [];
  }


  fallbackCandidates.sort(
    (a, b) =>
      b.score -
      a.score
  );


  const best =
    fallbackCandidates[0];


  if (
    fallbackCandidates.length > 1 &&
    fallbackCandidates[1].score ===
      best.score
  ) {

    return [];
  }


  return [
    best
  ];
}



// =====================================================
// FINISH HISTORICAL RECRUITER STATUS BACKFILL
// =====================================================

function finishAllJobsRecruiterStatusBackfill_() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_RECRUITER_STATUS_ACTIVE',
      'false'
    );


  deleteAllJobsRecruiterStatusTriggers_();


  Logger.log(
    '================================'
  );

  Logger.log(
    'ALL JOBS RECRUITER STATUS BACKFILL COMPLETED'
  );

  Logger.log(
    'Temporary recruiter status trigger removed.'
  );

  Logger.log(
    '================================'
  );
}



// =====================================================
// DELETE TEMPORARY RECRUITER STATUS TRIGGER
// =====================================================

function deleteAllJobsRecruiterStatusTriggers_() {

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(trigger => {

    if (
      trigger.getHandlerFunction() ===
      'runAllJobsRecruiterStatusBackfillBatch'
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

function stopAllJobsRecruiterStatusBackfill() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_RECRUITER_STATUS_ACTIVE',
      'false'
    );


  deleteAllJobsRecruiterStatusTriggers_();


  Logger.log(
    'Historical recruiter status backfill stopped.'
  );
}

// =====================================================
// STEP 12F
// KEEP "ALL JOBS" UPDATED WITH NEW RECORDS
// =====================================================


// =====================================================
// ADD NEW RECRUITER MESSAGE TO ALL JOBS
// =====================================================

function syncRecruiterMessageToAllJobs_(
  message,
  messages,
  index,
  thread,
  timeZone
) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  const allJobsSheet =
    spreadsheet.getSheetByName(
      'All Jobs'
    );


  if (!allJobsSheet) {
    return;
  }


  const processedSheet =
    getOrCreateProcessedSheet_(
      spreadsheet
    );


  const messageId =
    message.getId();


  // Historical backfill and future automation
  // use the SAME duplicate key.
  if (
    isAlreadyProcessed_(
      processedSheet,
      'ALL_RECRUITER',
      messageId
    )
  ) {

    return;
  }


  const record =
    extractRecruiterRecord_(
      message,
      messages,
      index,
      thread,
      timeZone
    );


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


  Logger.log(
    'Added recruiter message to All Jobs.'
  );
}



// =====================================================
// ADD NEW PORTAL APPLICATION TO ALL JOBS
// =====================================================

