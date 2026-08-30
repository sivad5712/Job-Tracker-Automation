function refreshJobDashboard() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  const timeZone =
    spreadsheet.getSpreadsheetTimeZone();

  const allJobsSheet =
    spreadsheet.getSheetByName(
      'All Jobs'
    );


  if (!allJobsSheet) {
    throw new Error(
      'All Jobs sheet was not found.'
    );
  }


  // ==========================================
  // CREATE DASHBOARD IF NEEDED
  // ==========================================

  let dashboard =
    spreadsheet.getSheetByName(
      'Dashboard'
    );


  if (!dashboard) {

    dashboard =
      spreadsheet.insertSheet(
        'Dashboard'
      );

  }


  dashboard.clear();


  // ==========================================
  // FIND ALL JOBS SECTIONS
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
      'Required sections were not found in All Jobs.'
    );
  }


  // ==========================================
  // READ RECRUITER DATA
  // ==========================================

  const recruiterFirstRow =
    recruiterCell.getRow() + 2;

  const recruiterLastRow =
    portalCell.getRow() - 5;


  let recruiterData = [];


  if (
    recruiterLastRow >=
    recruiterFirstRow
  ) {

    recruiterData =
      allJobsSheet
        .getRange(
          recruiterFirstRow,
          1,
          recruiterLastRow -
            recruiterFirstRow +
            1,
          8
        )
        .getDisplayValues()
        .filter(
          row =>
            row.some(
              value =>
                String(value).trim() !== ''
            )
        );

  }


  // ==========================================
  // READ PORTAL DATA
  // ==========================================

  const portalFirstRow =
    portalCell.getRow() + 2;

  const allJobsLastRow =
    allJobsSheet.getLastRow();


  let portalData = [];


  if (
    allJobsLastRow >=
    portalFirstRow
  ) {

    portalData =
      allJobsSheet
        .getRange(
          portalFirstRow,
          1,
          allJobsLastRow -
            portalFirstRow +
            1,
          7
        )
        .getDisplayValues()
        .filter(
          row =>
            row.some(
              value =>
                String(value).trim() !== ''
            )
        );

  }


  // ==========================================
  // HELPER FOR STATUS COUNTS
  // ==========================================

  function countRecruiterStatus(status) {

    return recruiterData.filter(
      row =>
        String(row[6] || '')
          .trim()
          .toLowerCase() ===
        status.toLowerCase()
    ).length;

  }


  function countPortalStatus(status) {

    return portalData.filter(
      row =>
        String(row[5] || '')
          .trim()
          .toLowerCase() ===
        status.toLowerCase()
    ).length;

  }


  // ==========================================
  // TODAY COUNTS
  // ==========================================

  const today =
    Utilities.formatDate(
      new Date(),
      timeZone,
      'MM/dd/yyyy'
    );


  const todayRecruiters =
    recruiterData.filter(
      row =>
        String(row[0]).trim() ===
        today
    ).length;


  const todayApplications =
    portalData.filter(
      row =>
        String(row[0]).trim() ===
        today
    ).length;


  // ==========================================
  // DASHBOARD CONTENT
  // ==========================================

  const values = [

    [
      'JOB TRACKER DASHBOARD',
      ''
    ],

    [
      'Last Refreshed',
      Utilities.formatDate(
        new Date(),
        timeZone,
        'MM/dd/yyyy hh:mm a'
      )
    ],

    [
      '',
      ''
    ],

    [
      'TODAY',
      ''
    ],

    [
      'Recruiter / Vendor Emails',
      todayRecruiters
    ],

    [
      'Applications',
      todayApplications
    ],

    [
      '',
      ''
    ],

    [
      'RECRUITER / VENDOR SUMMARY',
      ''
    ],

    [
      'Total Recruiter Emails',
      recruiterData.length
    ],

    [
      'Sent',
      countRecruiterStatus(
        'Sent'
      )
    ],

    [
      'Follow-up Sent',
      countRecruiterStatus(
        'Follow-up Sent'
      )
    ],

    [
      'Replied',
      countRecruiterStatus(
        'Replied'
      )
    ],

    [
      'RTR',
      countRecruiterStatus(
        'RTR'
      )
    ],

    [
      'Submitted',
      countRecruiterStatus(
        'Submitted'
      )
    ],

    [
      'Assessment',
      countRecruiterStatus(
        'Assessment'
      )
    ],

    [
      'Interview',
      countRecruiterStatus(
        'Interview'
      )
    ],

    [
      'Rejected',
      countRecruiterStatus(
        'Rejected'
      )
    ],

    [
      'Offer',
      countRecruiterStatus(
        'Offer'
      )
    ],

    [
      'Closed',
      countRecruiterStatus(
        'Closed'
      )
    ],

    [
      '',
      ''
    ],

    [
      'PORTAL / DIRECT APPLICATION SUMMARY',
      ''
    ],

    [
      'Total Applications',
      portalData.length
    ],

    [
      'Applied',
      countPortalStatus(
        'Applied'
      )
    ],

    [
      'Assessment',
      countPortalStatus(
        'Assessment'
      )
    ],

    [
      'Interview',
      countPortalStatus(
        'Interview'
      )
    ],

    [
      'Rejected',
      countPortalStatus(
        'Rejected'
      )
    ],

    [
      'Offer',
      countPortalStatus(
        'Offer'
      )
    ],

    [
      'Withdrawn',
      countPortalStatus(
        'Withdrawn'
      )
    ]

  ];


  dashboard
    .getRange(
      1,
      1,
      values.length,
      2
    )
    .setValues(
      values
    );


  // ==========================================
  // SIMPLE FORMATTING
  // ==========================================

  dashboard
    .getRange('A1:B1')
    .merge()
    .setFontWeight('bold')
    .setFontSize(16)
    .setHorizontalAlignment(
      'center'
    );


  dashboard
    .getRange('A4:B4')
    .setFontWeight('bold');


  dashboard
    .getRange('A8:B8')
    .setFontWeight('bold');


  dashboard
    .getRange('A21:B21')
    .setFontWeight('bold');


  dashboard
    .getRange(
      1,
      1,
      values.length,
      2
    )
    .setVerticalAlignment(
      'middle'
    );


  dashboard.setColumnWidth(
    1,
    260
  );

  dashboard.setColumnWidth(
    2,
    160
  );


  dashboard.setFrozenRows(
    1
  );


  Logger.log(
    'Dashboard refreshed successfully.'
  );

  Logger.log(
    'Recruiter rows counted: ' +
    recruiterData.length
  );

  Logger.log(
    'Applications counted: ' +
    portalData.length
  );
}