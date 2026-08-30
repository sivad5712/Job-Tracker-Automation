function findMatchingApplication_(
  spreadsheet,
  message,
  thread
) {

  const emailText =
    (
      (message.getSubject() || '') +
      '\n' +
      getApplicationEmailText_(message) +
      '\n' +
      (message.getFrom() || '')
    ).toLowerCase();


  const threadId =
    thread.getId();


  const sender =
    parseEmailAddress_(
      message.getFrom()
    );


  const senderName =
    normalizeApplicationText_(
      sender.name
    );


  const senderDomainCompany =
    normalizeApplicationText_(
      extractCompanyFromEmail_(
        sender.email
      )
    );


  const candidates = [];


  spreadsheet
    .getSheets()
    .forEach(sheet => {

      const sheetName =
        sheet.getName();


      // Only daily YYYY-MM-DD tabs
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          sheetName
        )
      ) {
        return;
      }


      const finder =
        sheet.createTextFinder(
          'PORTAL / DIRECT JOB APPLICATIONS'
        );


      finder.matchEntireCell(true);


      const portalCell =
        finder.findNext();


      if (!portalCell) {
        return;
      }


      const firstDataRow =
        portalCell.getRow() + 2;


      const lastRow =
        sheet.getLastRow();


      if (
        lastRow <
        firstDataRow
      ) {
        return;
      }


      const data =
        sheet
          .getRange(
            firstDataRow,
            1,
            lastRow -
              firstDataRow +
              1,
            7
          )
          .getDisplayValues();


      data.forEach(
        (row, index) => {

          const company =
            String(
              row[2] || ''
            ).trim();


          const position =
            String(
              row[3] || ''
            ).trim();


          if (
            !company &&
            !position
          ) {
            return;
          }


          const realRow =
            firstDataRow +
            index;


          const companyNormalized =
            normalizeApplicationText_(
              company
            );


          const positionNormalized =
            normalizeApplicationText_(
              position
            );


          let score = 0;


          // ====================================
          // SAME GMAIL THREAD = VERY STRONG
          // ====================================

          const linkFormula =
            sheet
              .getRange(
                realRow,
                7
              )
              .getFormula();


          if (
            linkFormula &&
            linkFormula.includes(
              threadId
            )
          ) {

            score += 10;
          }


          // ====================================
          // JOB TITLE APPEARS IN EMAIL
          // ====================================

          if (
            positionNormalized.length >= 5 &&
            normalizeApplicationText_(
              emailText
            ).includes(
              positionNormalized
            )
          ) {

            score += 7;
          }


          // ====================================
          // COMPANY APPEARS IN EMAIL
          // ====================================

          if (
            companyNormalized.length >= 3 &&
            normalizeApplicationText_(
              emailText
            ).includes(
              companyNormalized
            )
          ) {

            score += 5;
          }


          // ====================================
          // SENDER NAME MATCHES COMPANY
          // ====================================

          if (
            companyNormalized &&
            senderName &&
            (
              senderName.includes(
                companyNormalized
              ) ||
              companyNormalized.includes(
                senderName
              )
            )
          ) {

            score += 4;
          }


          // ====================================
          // SENDER DOMAIN MATCHES COMPANY
          // ====================================

          if (
            companyNormalized &&
            senderDomainCompany &&
            (
              senderDomainCompany.includes(
                companyNormalized
              ) ||
              companyNormalized.includes(
                senderDomainCompany
              )
            )
          ) {

            score += 4;
          }


          if (score > 0) {

            candidates.push({

              sheet: sheet,

              row: realRow,

              company: company,

              position: position,

              score: score

            });
          }

        }
      );

    });


  if (
    candidates.length === 0
  ) {
    return null;
  }


  // Highest score first
  candidates.sort(
    (a, b) =>
      b.score - a.score
  );


  const best =
    candidates[0];


  // Require reliable evidence
  if (
    best.score < 7
  ) {
    return null;
  }


  // If two different applications tie,
  // avoid updating the wrong one.
  if (
    candidates.length > 1 &&
    candidates[1].score ===
      best.score
  ) {

    return null;
  }


  return best;
}



// =====================================================
// NORMALIZE TEXT FOR MATCHING
// =====================================================

function normalizeApplicationText_(
  value
) {

  return String(
    value || ''
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

// =====================================================
// STEP 11
// MASTER JOB TRACKER AUTOMATION
// =====================================================

function runJobTrackerAutomation() {

  // Prevent two automation runs from overlapping.
  const lock =
    LockService.getScriptLock();


  // Wait up to 30 seconds for another run to finish.
  const gotLock =
    lock.tryLock(30000);


  if (!gotLock) {

    Logger.log(
      'Another Job Tracker run is already in progress. Skipping this run.'
    );

    return;
  }


  try {

    Logger.log(
      '================================'
    );

    Logger.log(
      'JOB TRACKER AUTOMATION STARTED'
    );

    Logger.log(
      '================================'
    );


    // ==========================================
    // 1. RECRUITER / VENDOR SENT EMAILS
    // ==========================================

    Logger.log(
      'STEP 1: Syncing recruiter/vendor emails...'
    );


    syncRecruiterSentEmailsToSheet();


    Logger.log(
      'Recruiter/vendor sync finished.'
    );

    // ==========================================
// 2. RECRUITER / VENDOR STATUS UPDATES
// ==========================================

Logger.log(
  '--------------------------------'
);

Logger.log(
  'STEP 2: Checking recruiter/vendor statuses...'
);


syncRecruiterStatuses();


Logger.log(
  'Recruiter/vendor status sync finished.'
);


    // ==========================================
    // 3. PORTAL / DIRECT APPLICATIONS
    // ==========================================

    Logger.log(
      '--------------------------------'
    );

    Logger.log(
      'STEP 3: Syncing portal applications...'
    );


    syncPortalApplicationsToSheet();


    Logger.log(
      'Portal application sync finished.'
    );


    // ==========================================
    // 4. APPLICATION STATUS UPDATES
    // ==========================================

    Logger.log(
      '--------------------------------'
    );

    Logger.log(
      'STEP 4: Checking application statuses...'
    );


    syncApplicationStatuses();


    Logger.log(
      'Application status sync finished.'
    );
    

    // ==========================================
// 5. REFRESH DASHBOARD
// ==========================================

Logger.log(
  '--------------------------------'
);

Logger.log(
  'STEP 5: Refreshing Dashboard...'
);


try {

  refreshJobDashboard();

  Logger.log(
    'Dashboard refresh finished.'
  );

} catch (dashboardError) {

  // Dashboard problem should NOT stop
  // the main job tracker automation.
  Logger.log(
    'Dashboard refresh failed: ' +
    dashboardError.toString()
  );

}

    // ==========================================
    // COMPLETE
    // ==========================================

    Logger.log(
      '================================'
    );

    Logger.log(
      'JOB TRACKER AUTOMATION COMPLETED SUCCESSFULLY'
    );

    Logger.log(
      '================================'
    );


  } catch (error) {

    Logger.log(
      '================================'
    );

    Logger.log(
      'JOB TRACKER AUTOMATION ERROR'
    );

    Logger.log(
      error.toString()
    );

    throw error;


  } finally {

    lock.releaseLock();

  }
}

// =====================================================
// STEP 11A
// UPDATE RECRUITER STATUS DROPDOWNS
// =====================================================

