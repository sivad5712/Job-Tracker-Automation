function shouldUpdateRecruiterStatus_(
  currentStatus,
  newStatus
) {

  currentStatus =
    String(
      currentStatus || ''
    ).trim();


  newStatus =
    String(
      newStatus || ''
    ).trim();


  if (!newStatus) {
    return false;
  }


  if (!currentStatus) {
    return true;
  }


  if (
    currentStatus.toLowerCase() ===
    newStatus.toLowerCase()
  ) {
    return false;
  }


  // ==========================================
  // OFFER SHOULD NOT BE DOWNGRADED
  // ==========================================

  if (
    currentStatus === 'Offer'
  ) {

    return false;
  }


  // ==========================================
  // OFFER CAN OVERRIDE EVERYTHING ELSE
  // ==========================================

  if (
    newStatus === 'Offer'
  ) {

    return true;
  }


  // ==========================================
  // REJECTION CAN OVERRIDE ACTIVE STAGES
  // ==========================================

  if (
    newStatus === 'Rejected'
  ) {

    return true;
  }


  // ==========================================
  // CLOSED CAN OVERRIDE ACTIVE STAGES,
  // BUT NOT REJECTED OR OFFER
  // ==========================================

  if (
    newStatus === 'Closed'
  ) {

    return ![
      'Rejected',
      'Offer'
    ].includes(
      currentStatus
    );
  }


  // Don't reopen terminal statuses
  if (
    [
      'Rejected',
      'Closed',
      'Offer'
    ].includes(
      currentStatus
    )
  ) {

    return false;
  }


  // ==========================================
  // NORMAL PROGRESSION
  // ==========================================

  const rank = {

    'Sent': 1,

    'Follow-up Sent': 2,

    'Replied': 3,

    'RTR': 4,

    'Submitted': 5,

    'Assessment': 6,

    'Interview': 7

  };


  const oldRank =
    rank[currentStatus] || 0;


  const newRank =
    rank[newStatus] || 0;


  return (
    newRank >
    oldRank
  );
}

// =====================================================
// GET ONLY THE NEWEST PART OF A RECRUITER REPLY
// IGNORE QUOTED OLDER EMAILS IN THE THREAD
// =====================================================

function getNewestRecruiterReplyText_(message) {

  let text =
    getApplicationEmailText_(
      message
    ) || '';


  // Remove Gmail quoted lines beginning with >
  text =
    text
      .split('\n')
      .filter(
        line =>
          !line.trim().startsWith('>')
      )
      .join('\n');


  // Common beginning of quoted Gmail history
  const quoteMarkers = [

    /\nOn .+ wrote:\s*/i,

    /\n-{2,}\s*Original Message\s*-{2,}/i,

    /\nFrom:\s.+/i,

    /\nSent:\s.+/i

  ];


  let cutPosition =
    text.length;


  quoteMarkers.forEach(
    pattern => {

      const match =
        pattern.exec(text);


      if (
        match &&
        match.index <
        cutPosition
      ) {

        cutPosition =
          match.index;
      }

    }
  );


  return text
    .substring(
      0,
      cutPosition
    )
    .trim();
}

// =====================================================
// STEP 12A
// CREATE ALL JOBS MASTER SHEET
// =====================================================

function createAllJobsSheet() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  // ==========================================
  // DON'T CREATE IT TWICE
  // ==========================================

  let allJobsSheet =
    spreadsheet.getSheetByName(
      'All Jobs'
    );


  if (allJobsSheet) {

    Logger.log(
      'All Jobs sheet already exists.'
    );

    return allJobsSheet;
  }


  // ==========================================
  // COPY OUR TEMPLATE
  // ==========================================

  const templateSheet =
    spreadsheet.getSheetByName(
      'TEMPLATE'
    );


  if (!templateSheet) {

    throw new Error(
      'TEMPLATE sheet was not found.'
    );
  }


  allJobsSheet =
    templateSheet.copyTo(
      spreadsheet
    );


  allJobsSheet.setName(
    'All Jobs'
  );


  // ==========================================
  // MAKE SURE THE MASTER SHEET IS CLEAN
  // ==========================================

  const recruiterFinder =
    allJobsSheet.createTextFinder(
      'RECRUITER / VENDOR EMAILS SENT'
    );

  recruiterFinder.matchEntireCell(true);

  const recruiterCell =
    recruiterFinder.findNext();


  const portalFinder =
    allJobsSheet.createTextFinder(
      'PORTAL / DIRECT JOB APPLICATIONS'
    );

  portalFinder.matchEntireCell(true);

  const portalCell =
    portalFinder.findNext();


  if (
    !recruiterCell ||
    !portalCell
  ) {

    throw new Error(
      'Required sections were not found in the TEMPLATE.'
    );
  }


  // ==========================================
  // RECRUITER STATUS DROPDOWN
  // ==========================================

  const recruiterStatuses = [

    'Sent',
    'Follow-up Sent',
    'Replied',
    'RTR',
    'Submitted',
    'Assessment',
    'Interview',
    'Rejected',
    'Offer',
    'Closed'

  ];


  const recruiterValidation =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        recruiterStatuses,
        true
      )
      .setAllowInvalid(false)
      .build();


  // Prepare recruiter status cells
  allJobsSheet
    .getRange(
      recruiterCell.getRow() + 2,
      7,
      4,
      1
    )
    .setDataValidation(
      recruiterValidation
    );


  // ==========================================
  // PORTAL STATUS DROPDOWN
  // ==========================================

  const portalStatuses = [

    'Applied',
    'Assessment',
    'Interview',
    'Rejected',
    'Offer',
    'Withdrawn'

  ];


  const portalValidation =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        portalStatuses,
        true
      )
      .setAllowInvalid(false)
      .build();


  allJobsSheet
    .getRange(
      portalCell.getRow() + 2,
      6,
      Math.max(
        1,
        allJobsSheet.getMaxRows() -
        portalCell.getRow() -
        1
      ),
      1
    )
    .setDataValidation(
      portalValidation
    );


  Logger.log(
    'All Jobs master sheet created successfully.'
  );


  return allJobsSheet;
}

// =====================================================
// STEP 12B
// ONE-TIME HISTORICAL RECRUITER / VENDOR BACKFILL
// INTO "ALL JOBS"
// =====================================================

function startAllJobsRecruiterBackfill() {

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


  // Start historical scan from newest sent threads.
  properties.setProperty(
    'ALL_JOBS_RECRUITER_START',
    '0'
  );

  properties.setProperty(
    'ALL_JOBS_RECRUITER_ACTIVE',
    'true'
  );


  // Remove any old temporary backfill trigger.
  deleteAllJobsRecruiterBackfillTriggers_();


  // Temporary trigger.
  // It automatically gets deleted when backfill finishes.
  ScriptApp
    .newTrigger(
      'runAllJobsRecruiterBackfillBatch'
    )
    .timeBased()
    .everyMinutes(10)
    .create();


  Logger.log(
    'Historical recruiter backfill started.'
  );

  Logger.log(
    'Running first batch now...'
  );


  // Run first batch immediately.
  runAllJobsRecruiterBackfillBatch();
}



// =====================================================
// PROCESS ONE HISTORICAL RECRUITER BATCH
// =====================================================

