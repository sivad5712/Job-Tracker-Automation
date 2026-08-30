function shouldUpdatePortalStatus_(
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
  // WITHDRAWN IS FINAL
  // ==========================================

  if (
    currentStatus === 'Withdrawn'
  ) {

    return false;
  }


  // ==========================================
  // OFFER SHOULD NOT GO BACKWARD
  // ==========================================

  if (
    currentStatus === 'Offer'
  ) {

    return false;
  }


  // ==========================================
  // A LATER REAL OFFER MAY OVERRIDE REJECTION
  // ==========================================

  if (
    newStatus === 'Offer'
  ) {

    return true;
  }


  // ==========================================
  // WITHDRAWAL MAY CLOSE AN ACTIVE APPLICATION
  // ==========================================

  if (
    newStatus === 'Withdrawn'
  ) {

    return (
      currentStatus !== 'Offer' &&
      currentStatus !== 'Rejected'
    );

  }


  // ==========================================
  // REJECTION MAY CLOSE ACTIVE APPLICATION
  // ==========================================

  if (
    newStatus === 'Rejected'
  ) {

    return true;
  }


  // Don't reopen rejected application
  // with an older Assessment/Interview email.
  if (
    currentStatus === 'Rejected'
  ) {

    return false;
  }


  // ==========================================
  // NORMAL PROGRESSION
  // ==========================================

  const rank = {

    'Applied': 1,

    'Assessment': 2,

    'Interview': 3

  };


  const currentRank =
    rank[currentStatus] || 0;


  const newRank =
    rank[newStatus] || 0;


  return (
    newRank >
    currentRank
  );
}

// =====================================================
// STEP 12H
// CHECK ALL JOBS HISTORICAL BACKFILL PROGRESS
// =====================================================

function checkAllJobsBackfillProgress() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  const properties =
    PropertiesService
      .getScriptProperties();


  Logger.log(
    '================================'
  );

  Logger.log(
    'ALL JOBS BACKFILL PROGRESS'
  );

  Logger.log(
    '================================'
  );


  // ==========================================
  // RECRUITER HISTORY
  // ==========================================

  const recruiterPosition =
    properties.getProperty(
      'ALL_JOBS_RECRUITER_START'
    ) || '0';


  const recruiterActive =
    properties.getProperty(
      'ALL_JOBS_RECRUITER_ACTIVE'
    ) || 'false';


  Logger.log(
    'Recruiter history active: ' +
    recruiterActive
  );

  Logger.log(
    'Recruiter Gmail position: ' +
    recruiterPosition
  );


  // ==========================================
  // PORTAL HISTORY
  // ==========================================

  const portalPosition =
    properties.getProperty(
      'ALL_JOBS_PORTAL_START'
    ) || '0';


  const portalActive =
    properties.getProperty(
      'ALL_JOBS_PORTAL_ACTIVE'
    ) || 'false';


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'Portal history active: ' +
    portalActive
  );

  Logger.log(
    'Portal Gmail position: ' +
    portalPosition
  );


  // ==========================================
  // PORTAL STATUS HISTORY
  // ==========================================

  const portalStatusPosition =
    properties.getProperty(
      'ALL_JOBS_PORTAL_STATUS_START'
    ) || '0';


  const portalStatusActive =
    properties.getProperty(
      'ALL_JOBS_PORTAL_STATUS_ACTIVE'
    ) || 'false';


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'Portal status history active: ' +
    portalStatusActive
  );

  Logger.log(
    'Portal status Gmail position: ' +
    portalStatusPosition
  );


  // ==========================================
  // RECRUITER STATUS HISTORY
  // ==========================================

  const recruiterStatusPosition =
    properties.getProperty(
      'ALL_JOBS_RECRUITER_STATUS_START'
    ) || '0';


  const recruiterStatusActive =
    properties.getProperty(
      'ALL_JOBS_RECRUITER_STATUS_ACTIVE'
    ) || 'false';


  Logger.log(
    '--------------------------------'
  );

  Logger.log(
    'Recruiter status history active: ' +
    recruiterStatusActive
  );

  Logger.log(
    'Recruiter status Gmail position: ' +
    recruiterStatusPosition
  );


  // ==========================================
  // COUNT ALL JOBS ROWS
  // ==========================================

  const allJobsSheet =
    spreadsheet.getSheetByName(
      'All Jobs'
    );


  if (allJobsSheet) {

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
      recruiterCell &&
      portalCell
    ) {

      const recruiterFirstRow =
        recruiterCell.getRow() + 2;


      const recruiterLastRow =
        portalCell.getRow() - 5;


      let recruiterRows = 0;


      if (
        recruiterLastRow >=
        recruiterFirstRow
      ) {

        const recruiterValues =
          allJobsSheet
            .getRange(
              recruiterFirstRow,
              1,
              recruiterLastRow -
                recruiterFirstRow +
                1,
              8
            )
            .getDisplayValues();


        recruiterRows =
          recruiterValues.filter(
            row =>
              row.some(
                value =>
                  String(value).trim() !== ''
              )
          ).length;
      }


      Logger.log(
        '--------------------------------'
      );

      Logger.log(
        'Recruiter rows currently in All Jobs: ' +
        recruiterRows
      );

    }

  }


  Logger.log(
    '================================'
  );

}

// =====================================================
// DASHBOARD / SUMMARY
// =====================================================

