function insertPortalApplicationRecord_(
  sheet,
  record
) {

  const finder =
    sheet.createTextFinder(
      'PORTAL / DIRECT JOB APPLICATIONS'
    );


  finder.matchEntireCell(true);


  const portalCell =
    finder.findNext();


  if (!portalCell) {

    throw new Error(
      'PORTAL / DIRECT JOB APPLICATIONS section was not found.'
    );
  }


  const portalTitleRow =
    portalCell.getRow();


  const portalHeaderRow =
    portalTitleRow + 1;


  let insertionRow =
    portalHeaderRow + 1;


  // ==========================================
  // FIND FIRST EMPTY PORTAL ROW
  // ==========================================

  while (
    insertionRow <=
    sheet.getMaxRows()
  ) {

    const values =
      sheet
        .getRange(
          insertionRow,
          1,
          1,
          7
        )
        .getDisplayValues()[0];


    const isEmpty =
      values.every(
        value =>
          String(value).trim() === ''
      );


    if (isEmpty) {
      break;
    }


    insertionRow++;

  }


  // Add a row if necessary

  if (
    insertionRow >
    sheet.getMaxRows()
  ) {

    sheet.insertRowAfter(
      sheet.getMaxRows()
    );
  }


  // ==========================================
  // WRITE APPLICATION
  // ==========================================

  const range =
    sheet.getRange(
      insertionRow,
      1,
      1,
      7
    );


  range.setValues([[
    record.date,
    record.portal,
    record.company,
    record.position,
    record.applicationNumber,
    record.status,
    ''
  ]]);


  // ==========================================
  // FORMAT ROW
  // ==========================================

  range
    .setWrap(true)
    .setVerticalAlignment(
      'middle'
    );


  range.setBorder(
    true,
    true,
    true,
    true,
    true,
    true
  );


  // ==========================================
  // STATUS DROPDOWN
  // ==========================================

  const statusValidation =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        [
          'Applied',
          'Assessment',
          'Interview',
          'Rejected',
          'Offer',
          'Withdrawn'
        ],
        true
      )
      .setAllowInvalid(false)
      .build();


  sheet
    .getRange(
      insertionRow,
      6
    )
    .setDataValidation(
      statusValidation
    );


  // ==========================================
  // CLICKABLE GMAIL LINK
  // ==========================================

  sheet
    .getRange(
      insertionRow,
      7
    )
    .setFormula(
      '=HYPERLINK("' +
      record.emailLink +
      '","Open Email")'
    );


  return insertionRow;
}

// =====================================================
// STEP 10
// UPDATE EXISTING APPLICATION STATUS FROM GMAIL
// =====================================================

