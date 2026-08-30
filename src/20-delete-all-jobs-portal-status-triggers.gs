function deleteAllJobsPortalStatusTriggers_() {

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(trigger => {

    if (
      trigger.getHandlerFunction() ===
      'runAllJobsPortalStatusBackfillBatch'
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

function stopAllJobsPortalStatusBackfill() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_PORTAL_STATUS_ACTIVE',
      'false'
    );


  deleteAllJobsPortalStatusTriggers_();


  Logger.log(
    'Historical portal status backfill stopped.'
  );
}

// =====================================================
// STEP 12E
// HISTORICAL RECRUITER STATUS BACKFILL FOR "ALL JOBS"
// =====================================================

function startAllJobsRecruiterStatusBackfill() {

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
    'ALL_JOBS_RECRUITER_STATUS_START',
    '0'
  );

  properties.setProperty(
    'ALL_JOBS_RECRUITER_STATUS_ACTIVE',
    'true'
  );


  deleteAllJobsRecruiterStatusTriggers_();


  ScriptApp
    .newTrigger(
      'runAllJobsRecruiterStatusBackfillBatch'
    )
    .timeBased()
    .everyMinutes(10)
    .create();


  Logger.log(
    'Historical recruiter STATUS backfill started.'
  );

  Logger.log(
    'Running first recruiter status batch now...'
  );


  runAllJobsRecruiterStatusBackfillBatch();
}



// =====================================================
// PROCESS ONE HISTORICAL RECRUITER STATUS BATCH
// =====================================================

