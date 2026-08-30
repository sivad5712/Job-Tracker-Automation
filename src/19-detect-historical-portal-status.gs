function detectHistoricalPortalStatus_(
  message
) {

  const subject =
    (message.getSubject() || '')
      .toLowerCase();


  const body =
    getNewestRecruiterReplyText_(
      message
    ).toLowerCase();


  const from =
    (message.getFrom() || '')
      .toLowerCase();


  const text =
    subject +
    '\n' +
    body;


  // ==========================================
  // IGNORE COMMUNITY / NEWSLETTER CONTENT
  // ==========================================

  const promotionalPatterns = [

    /glassdoor community/i,

    /community digest/i,

    /newsletter/i,

    /career advice/i,

    /job alert/i,

    /jobs for you/i,

    /recommended jobs/i,

    /similar jobs/i

  ];


  const directContextPatterns = [

    /your application/i,

    /your candidacy/i,

    /you applied/i,

    /regarding your application/i,

    /update on your application/i,

    /your interview/i,

    /your assessment/i,

    /pleased to offer you/i

  ];


  const promotional =
    promotionalPatterns.some(
      pattern =>
        pattern.test(
          subject + '\n' + from
        )
    );


  const directContext =
    directContextPatterns.some(
      pattern =>
        pattern.test(text)
    );


  if (
    promotional &&
    !directContext
  ) {

    return {
      status: '',
      reason: ''
    };
  }


  // ==========================================
  // WITHDRAWN
  // ==========================================

  const withdrawnPatterns = [

    /your application has been withdrawn/i,

    /your application was withdrawn/i,

    /you have withdrawn your application/i,

    /withdrawal of your application/i

  ];


  if (
    withdrawnPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Withdrawn',
      reason: 'Withdrawal detected'
    };
  }


  // ==========================================
  // OFFER
  // ==========================================

  const offerPatterns = [

    /pleased to offer you/i,

    /pleased to extend.*offer/i,

    /we would like to offer you/i,

    /we are pleased to offer you/i,

    /offer of employment/i,

    /your offer letter/i,

    /offer letter is ready/i

  ];


  if (
    offerPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Offer',
      reason: 'Offer detected'
    };
  }


  // ==========================================
  // REJECTED
  // ==========================================

  const rejectedPatterns = [

    /decided not to move forward/i,

    /decided not to proceed/i,

    /not moving forward with your application/i,

    /your application will not be moving forward/i,

    /your application is not moving forward/i,

    /unable to move forward with your application/i,

    /not proceeding with your application/i,

    /not selected/i,

    /have not been selected/i,

    /we regret to inform you/i,

    /moving forward with other candidates/i,

    /position has been filled/i,

    /role has been filled/i

  ];


  if (
    rejectedPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Rejected',
      reason: 'Rejection detected'
    };
  }


  // ==========================================
  // INTERVIEW
  // ==========================================

  const interviewPatterns = [

    /invite you to interview/i,

    /invited to interview/i,

    /interview invitation/i,

    /schedule your interview/i,

    /schedule an interview/i,

    /would like to interview you/i,

    /selected for an interview/i,

    /your interview has been scheduled/i,

    /interview availability/i,

    /phone interview/i,

    /video interview/i,

    /technical interview/i

  ];


  if (
    interviewPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Interview',
      reason: 'Interview detected'
    };
  }


  // ==========================================
  // ASSESSMENT
  // ==========================================

  const assessmentPatterns = [

    /complete your assessment/i,

    /assessment invitation/i,

    /online assessment/i,

    /technical assessment/i,

    /coding assessment/i,

    /skills assessment/i,

    /coding challenge/i,

    /hackerrank/i,

    /codility/i

  ];


  if (
    assessmentPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Assessment',
      reason: 'Assessment detected'
    };
  }


  return {
    status: '',
    reason: ''
  };
}



// =====================================================
// FIND MATCHING PORTAL APPLICATION INSIDE ALL JOBS
// =====================================================

function findMatchingAllJobsPortalApplication_(
  sheet,
  message,
  thread
) {

  const finder =
    sheet.createTextFinder(
      'PORTAL / DIRECT JOB APPLICATIONS'
    );


  finder.matchEntireCell(true);


  const portalCell =
    finder.findNext();


  if (!portalCell) {

    return null;
  }


  const firstDataRow =
    portalCell.getRow() + 2;


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    firstDataRow
  ) {

    return null;
  }


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
        firstDataRow,
        1,
        lastRow -
          firstDataRow +
          1,
        7
      )
      .getDisplayValues();


  const candidates = [];


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


      const status =
        String(
          row[5] || ''
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


      let score = 0;

      let sameThread = false;

      let positionMatch = false;

      let companyMatch = false;


      // ====================================
      // SAME GMAIL THREAD
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

        sameThread = true;

        score += 30;
      }


      // ====================================
      // POSITION MATCH
      // ====================================

      const positionNormalized =
        normalizeApplicationText_(
          position
        );


      if (
        positionNormalized.length >= 5 &&
        emailText.includes(
          positionNormalized
        )
      ) {

        positionMatch = true;

        score += 10;
      }


      // ====================================
      // COMPANY MATCH
      // ====================================

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


      const reliableMatch =
        sameThread ||
        positionMatch ||
        (
          companyMatch &&
          positionMatch
        );


      if (!reliableMatch) {
        return;
      }


      candidates.push({

        row: realRow,

        company: company,

        position: position,

        status: status,

        score: score

      });

    }
  );


  if (
    candidates.length === 0
  ) {

    return null;
  }


  candidates.sort(
    (a, b) =>
      b.score -
      a.score
  );


  const best =
    candidates[0];


  // Don't guess if two applications
  // have exactly the same score.
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
// FINISH HISTORICAL PORTAL STATUS BACKFILL
// =====================================================

function finishAllJobsPortalStatusBackfill_() {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALL_JOBS_PORTAL_STATUS_ACTIVE',
      'false'
    );


  deleteAllJobsPortalStatusTriggers_();


  Logger.log(
    '================================'
  );

  Logger.log(
    'ALL JOBS PORTAL STATUS BACKFILL COMPLETED'
  );

  Logger.log(
    'Temporary portal status trigger removed.'
  );

  Logger.log(
    '================================'
  );
}



// =====================================================
// DELETE TEMPORARY PORTAL STATUS TRIGGERS
// =====================================================

