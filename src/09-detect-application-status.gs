function detectApplicationStatus_(message) {

  const subject =
    (message.getSubject() || '')
      .toLowerCase()
      .trim();

  const body =
    getApplicationEmailText_(
      message
    ).toLowerCase();

  const from =
    (message.getFrom() || '')
      .toLowerCase();

  const text =
    subject +
    '\n' +
    body;


  // =================================================
  // IGNORE COMMUNITY / NEWSLETTER / JOB ALERT CONTENT
  // =================================================

  const promotionalPatterns = [

    /glassdoor community/i,

    /community digest/i,

    /community post/i,

    /newsletter/i,

    /career advice/i,

    /job alert/i,

    /jobs for you/i,

    /recommended jobs/i,

    /recommended for you/i,

    /similar jobs/i,

    /top job picks/i,

    /discussion/i

  ];


  const looksPromotional =
    promotionalPatterns.some(
      pattern =>
        pattern.test(
          subject + '\n' + from
        )
    );


  // Strong evidence that the email is talking
  // directly about YOUR application/candidacy.

  const directApplicationPatterns = [

    /your application/i,

    /your candidacy/i,

    /you applied for/i,

    /you applied to/i,

    /position you applied/i,

    /role you applied/i,

    /thank you for applying/i,

    /regarding your application/i,

    /update on your application/i,

    /status of your application/i,

    /your interview/i,

    /your assessment/i,

    /pleased to offer you/i,

    /we would like to offer you/i,

    /we'd like to offer you/i

  ];


  const hasDirectApplicationContext =
    directApplicationPatterns.some(
      pattern =>
        pattern.test(text)
    );


  // A newsletter/community email should not update
  // an application unless it very clearly addresses
  // the user's own application.

  if (
    looksPromotional &&
    !hasDirectApplicationContext
  ) {

    return {
      status: '',
      reason:
        'Ignored community/newsletter content'
    };
  }


  // =================================================
  // OFFER
  // =================================================

  const offerPatterns = [

    /pleased to offer you/i,

    /pleased to extend (?:you )?(?:an )?offer/i,

    /we would like to offer you/i,

    /we'd like to offer you/i,

    /we are pleased to offer you/i,

    /offer of employment/i,

    /employment offer for you/i,

    /your offer letter/i,

    /offer letter is ready/i,

    /offer letter has been/i

  ];


  if (
    offerPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Offer',
      reason:
        'Direct employment offer detected'
    };
  }


  // =================================================
  // REJECTED
  // =================================================

  const rejectionPatterns = [

    /we regret to inform you/i,

    /your application will not be moving forward/i,

    /your application is not moving forward/i,

    /not moving forward with your application/i,

    /unable to move forward with your application/i,

    /not proceeding with your application/i,

    /not progressing with your application/i,

    /you have not been selected/i,

    /you were not selected/i,

    /decided to move forward with other candidates/i,

    /moving forward with other candidates/i,

    /position has been filled/i,

    /role has been filled/i

  ];


  if (
    rejectionPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Rejected',
      reason:
        'Direct rejection language detected'
    };
  }


  // =================================================
  // INTERVIEW
  // =================================================

  const interviewPatterns = [

    /invite you to interview/i,

    /invited you to interview/i,

    /invited to interview/i,

    /interview invitation/i,

    /schedule your interview/i,

    /schedule an interview with you/i,

    /would like to interview you/i,

    /would like to schedule.*interview/i,

    /selected for an interview/i,

    /your interview has been scheduled/i,

    /interview has been scheduled for you/i

  ];


  if (
    interviewPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Interview',
      reason:
        'Direct interview invitation detected'
    };
  }


  // =================================================
  // ASSESSMENT
  // =================================================

  const assessmentPatterns = [

    /complete your assessment/i,

    /assessment invitation/i,

    /invited to complete.*assessment/i,

    /please complete.*assessment/i,

    /take your assessment/i,

    /your online assessment/i,

    /your technical assessment/i,

    /your coding assessment/i,

    /assessment is the next step/i,

    /assessment as the next step/i,

    /assessment required for your application/i

  ];


  if (
    assessmentPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Assessment',
      reason:
        'Direct assessment request detected'
    };
  }


  // =================================================
  // WITHDRAWN
  // =================================================

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
      reason:
        'Application withdrawal detected'
    };
  }


  return {
    status: '',
    reason: ''
  };
}



// =====================================================
// FIND MATCHING APPLICATION ACROSS DAILY SHEETS
// =====================================================

