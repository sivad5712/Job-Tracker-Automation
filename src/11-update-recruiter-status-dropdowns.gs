function updateRecruiterStatusDropdowns() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  const statuses = [
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


  const validation =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        statuses,
        true
      )
      .setAllowInvalid(false)
      .build();


  const sheets =
    spreadsheet.getSheets();


  let updatedSheets = 0;


  sheets.forEach(sheet => {

    const sheetName =
      sheet.getName();


    // Update TEMPLATE and daily date sheets only
    if (
      sheetName !== 'TEMPLATE' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        sheetName
      )
    ) {
      return;
    }


    const recruiterFinder =
      sheet.createTextFinder(
        'RECRUITER / VENDOR EMAILS SENT'
      );


    recruiterFinder
      .matchEntireCell(true);


    const recruiterCell =
      recruiterFinder.findNext();


    if (!recruiterCell) {
      return;
    }


    const portalFinder =
      sheet.createTextFinder(
        'PORTAL / DIRECT JOB APPLICATIONS'
      );


    portalFinder
      .matchEntireCell(true);


    const portalCell =
      portalFinder.findNext();


    if (!portalCell) {
      return;
    }


    const firstRecruiterRow =
      recruiterCell.getRow() + 2;


    // Four blank rows exist before portal section
    const lastRecruiterAreaRow =
      portalCell.getRow() - 5;


    if (
      lastRecruiterAreaRow >=
      firstRecruiterRow
    ) {

      sheet
        .getRange(
          firstRecruiterRow,
          7,
          lastRecruiterAreaRow -
            firstRecruiterRow +
            1,
          1
        )
        .setDataValidation(
          validation
        );
    }


    // Also prepare additional empty recruiter rows
    // so future rows support the same dropdown.
    const availableRows =
      Math.max(
        1,
        portalCell.getRow() -
          firstRecruiterRow
      );


    sheet
      .getRange(
        firstRecruiterRow,
        7,
        availableRows,
        1
      )
      .setDataValidation(
        validation
      );


    updatedSheets++;

  });


  Logger.log(
    'Recruiter status dropdowns updated.'
  );

  Logger.log(
    'Sheets updated: ' +
    updatedSheets
  );

}


// =====================================================
// STEP 11B
// UPDATE RECRUITER / VENDOR STATUS FROM INCOMING EMAILS
// =====================================================

