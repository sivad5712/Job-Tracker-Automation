function syncPortalApplicationsToSheet() {

  const spreadsheet =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const timeZone =
    spreadsheet.getSpreadsheetTimeZone();

  // Make sure today's sheet exists
  const todaySheet =
    createTodaySheet();

  const processedSheet =
    getOrCreateProcessedSheet_(
      spreadsheet
    );

  const today =
    Utilities.formatDate(
      new Date(),
      timeZone,
      'yyyy-MM-dd'
    );

  const myEmails =
    getMyEmailAddresses_();


  Logger.log(
    'Scanning applications for: ' +
    today
  );


  const threads =
    GmailApp.search(
      'newer_than:2d'
    );


  let applicationsFound = 0;

  let applicationsAdded = 0;

  let duplicatesSkipped = 0;


  threads.forEach(thread => {

    const messages =
      thread.getMessages();


    messages.forEach(message => {


      // ==========================================
      // ONLY TODAY'S EMAILS
      // ==========================================

      const messageDate =
        Utilities.formatDate(
          message.getDate(),
          timeZone,
          'yyyy-MM-dd'
        );


      if (
        messageDate !== today
      ) {
        return;
      }


      // ==========================================
      // IGNORE EMAILS SENT BY YOU
      // ==========================================

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


      // ==========================================
      // DETECT REAL APPLICATION
      // ==========================================

      const detection =
        detectRealJobApplication_(
          message
        );


      if (
        !detection.isApplication
      ) {
        return;
      }


      applicationsFound++;


      const messageId =
        message.getId();


      // ==========================================
      // DUPLICATE PREVENTION
      // ==========================================

      if (
        isAlreadyProcessed_(
          processedSheet,
          'PORTAL',
          messageId
        )
      ) {

        duplicatesSkipped++;

        return;
      }


      // ==========================================
      // EXTRACT INFORMATION
      // ==========================================

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
          todaySheet
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


      // ==========================================
      // INSERT INTO PORTAL SECTION
      // ==========================================

      const insertedRow =
        insertPortalApplicationRecord_(
          todaySheet,
          record
        );


      // ==========================================
      // MARK MESSAGE AS PROCESSED
      // ==========================================

      const applicationKey =
        [
          company,
          position
        ]
          .filter(Boolean)
          .join(' | ');


      markAsProcessed_(
        processedSheet,
        'PORTAL',
        messageId,
        today,
        todaySheet.getName(),
        insertedRow,
        applicationKey
      );

      syncPortalApplicationToAllJobs_(
        message,
        thread,
        timeZone
      );
      applicationsAdded++;


      Logger.log(
        '--------------------------------'
      );

      Logger.log(
        'APPLICATION ADDED'
      );

      Logger.log(
        'Portal: ' +
        portal
      );

      Logger.log(
        'Company: ' +
        company
      );

      Logger.log(
        'Position: ' +
        position
      );

      Logger.log(
        'Application #: ' +
        applicationNumber
      );

    });

  });


  Logger.log(
    '================================'
  );

  Logger.log(
    'Applications found: ' +
    applicationsFound
  );

  Logger.log(
    'New applications added: ' +
    applicationsAdded
  );

  Logger.log(
    'Duplicates skipped: ' +
    duplicatesSkipped
  );

  Logger.log(
    'Portal application sync completed.'
  );
}



// =====================================================
// GET NEXT APPLICATION NUMBER
// =====================================================

function getNextPortalApplicationNumber_(
  sheet
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


  // Portal title
  // Header is one row below title
  // Data starts two rows below title

  const firstDataRow =
    portalTitleRow + 2;


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    firstDataRow
  ) {

    return 1;
  }


  const numberOfRows =
    lastRow -
    firstDataRow +
    1;


  const values =
    sheet
      .getRange(
        firstDataRow,
        5,
        numberOfRows,
        1
      )
      .getValues();


  let highestNumber = 0;


  values.forEach(row => {

    const number =
      parseInt(
        row[0],
        10
      );


    if (
      !isNaN(number) &&
      number > highestNumber
    ) {

      highestNumber =
        number;
    }

  });


  return highestNumber + 1;
}



// =====================================================
// INSERT PORTAL APPLICATION ROW
// =====================================================

