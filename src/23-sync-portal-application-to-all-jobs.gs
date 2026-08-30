function syncPortalApplicationToAllJobs_(
  message,
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


  if (
    isAlreadyProcessed_(
      processedSheet,
      'ALL_PORTAL',
      messageId
    )
  ) {

    return;
  }


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


  Logger.log(
    'Added portal application to All Jobs.'
  );
}

// =====================================================
// STEP 12G
// KEEP ALL JOBS STATUS UPDATED WITH FUTURE EMAILS
// =====================================================


// =====================================================
// FUTURE RECRUITER STATUS -> ALL JOBS
// =====================================================

function syncRecruiterStatusToAllJobs_(
  message,
  thread,
  detection,
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

    return {
      matched: false,
      updated: false
    };

  }


  const processedSheet =
    getOrCreateProcessedSheet_(
      spreadsheet
    );


  const messageId =
    message.getId();


  // Historical status backfill and future
  // automation share the same duplicate key.
  if (
    isAlreadyProcessed_(
      processedSheet,
      'ALL_RECRUITER_STATUS',
      messageId
    )
  ) {

    return {
      matched: true,
      updated: false
    };

  }


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

    return {
      matched: false,
      updated: false
    };

  }


  let updated = false;


  matches.forEach(match => {

    const currentStatus =
      String(
        match.status || ''
      ).trim();


    // Same status - nothing to change
    if (
      currentStatus.toLowerCase() ===
      detection.status.toLowerCase()
    ) {

      return;

    }


    // Use the recruiter progression rules
    // already created in Step 11B.
    if (
      !shouldUpdateRecruiterStatus_(
        currentStatus,
        detection.status
      )
    ) {

      return;

    }


    allJobsSheet
      .getRange(
        match.row,
        7
      )
      .setValue(
        detection.status
      );


    updated = true;


    Logger.log(
      'ALL JOBS RECRUITER STATUS UPDATED'
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
      'Old status: ' +
      currentStatus
    );

    Logger.log(
      'New status: ' +
      detection.status
    );

  });


  const messageDate =
    Utilities.formatDate(
      message.getDate(),
      timeZone,
      'yyyy-MM-dd'
    );


  // Mark even a same/backward status as processed
  // because this Gmail message has been evaluated.
  markAsProcessed_(
    processedSheet,
    'ALL_RECRUITER_STATUS',
    messageId,
    messageDate,
    'All Jobs',
    matches[0].row,
    matches[0].email
  );


  return {
    matched: true,
    updated: updated,
    row: matches[0].row
  };
}



// =====================================================
// FUTURE PORTAL STATUS -> ALL JOBS
// =====================================================

function syncPortalStatusToAllJobs_(
  message,
  thread,
  detection,
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

    return {
      matched: false,
      updated: false
    };

  }


  const processedSheet =
    getOrCreateProcessedSheet_(
      spreadsheet
    );


  const messageId =
    message.getId();


  if (
    isAlreadyProcessed_(
      processedSheet,
      'ALL_PORTAL_STATUS',
      messageId
    )
  ) {

    return {
      matched: true,
      updated: false
    };

  }


  const match =
    findMatchingAllJobsPortalApplication_(
      allJobsSheet,
      message,
      thread
    );


  if (!match) {

    return {
      matched: false,
      updated: false
    };

  }


  const currentStatus =
    String(
      match.status || ''
    ).trim();


  let updated = false;


  if (
    currentStatus.toLowerCase() !==
    detection.status.toLowerCase()
  ) {

    if (
      shouldUpdatePortalStatus_(
        currentStatus,
        detection.status
      )
    ) {

      allJobsSheet
        .getRange(
          match.row,
          6
        )
        .setValue(
          detection.status
        );


      updated = true;


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

    }

  }


  const messageDate =
    Utilities.formatDate(
      message.getDate(),
      timeZone,
      'yyyy-MM-dd'
    );


  markAsProcessed_(
    processedSheet,
    'ALL_PORTAL_STATUS',
    messageId,
    messageDate,
    'All Jobs',
    match.row,
    match.company +
      ' | ' +
      match.position
  );


  return {
    matched: true,
    updated: updated,
    row: match.row
  };
}



// =====================================================
// PORTAL STATUS PROGRESSION
// =====================================================

