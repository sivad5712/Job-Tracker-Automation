function detectRecruiterStatus_(
  message,
  thread,
  myEmails
) {

  const subject =
    (message.getSubject() || '')
      .toLowerCase();

  const body =
    getApplicationEmailText_(
      message
    ).toLowerCase();

  const text =
    subject +
    '\n' +
    body;


  // ==========================================
  // OFFER
  // ==========================================

  const offerPatterns = [

    /pleased to offer you/i,

    /pleased to extend.*offer/i,

    /extend.*offer of employment/i,

    /employment offer/i,

    /offer letter/i,

    /client.*(?:made|extended).*offer/i,

    /client would like to offer/i

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

    /not to move forward/i,

    /not moving forward/i,

    /not be moving forward/i,

    /will not move forward/i,

    /not moving forward/i,

    /not be moving forward/i,

    /will not move forward/i,

    /not selected/i,

    /not been selected/i,

    /decided to proceed with other candidates/i,

    /decided to move forward with other candidates/i,

    /moving forward with other candidates/i,

    /client.*(?:passed|declined|rejected)/i,

    /client.*not proceeding/i,

    /client.*not moving forward/i,

    /unable to move forward/i,

    /we regret to inform/i

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
  // CLOSED
  // ==========================================

  const closedPatterns = [

    /position has been closed/i,

    /position is closed/i,

    /role has been closed/i,

    /role is closed/i,

    /requirement has been closed/i,

    /requirement is closed/i,

    /position has been cancelled/i,

    /position has been canceled/i,

    /role has been cancelled/i,

    /role has been canceled/i,

    /requirement has been cancelled/i,

    /requirement has been canceled/i,

    /position is on hold/i,

    /role is on hold/i,

    /requirement is on hold/i

  ];


  if (
    closedPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Closed',
      reason: 'Position/requirement closed or on hold'
    };
  }


  // ==========================================
  // INTERVIEW
  // ==========================================

  const interviewPatterns = [

    /interview invitation/i,

    /invite you to interview/i,

    /invited to interview/i,

    /schedule.*interview/i,

    /interview availability/i,

    /selected for.*interview/i,

    /client.*(?:would like|wants).*interview/i,

    /client.*interview/i,

    /interview has been scheduled/i,

    /interview scheduled/i,

    /phone interview/i,

    /video interview/i,

    /technical interview/i,

    /onsite interview/i

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

    /online assessment/i,

    /technical assessment/i,

    /coding assessment/i,

    /skills assessment/i,

    /complete.*assessment/i,

    /assessment invitation/i,

    /coding challenge/i,

    /technical test/i,

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


  // ==========================================
  // SUBMITTED TO CLIENT
  // ==========================================

  const submittedPatterns = [

    /submitted your profile/i,

    /submitted your resume/i,

    /submitted your candidature/i,

    /submitted your candidacy/i,

    /profile has been submitted/i,

    /resume has been submitted/i,

    /your profile was submitted/i,

    /your resume was submitted/i,

    /submitted.*to the client/i,

    /submitted.*to our client/i,

    /submission to the client/i,

    /profile.*presented to.*client/i,

    /resume.*presented to.*client/i,

    /presented your profile/i

  ];


  if (
    submittedPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'Submitted',
      reason: 'Profile/resume submitted to client'
    };
  }


  // ==========================================
  // RTR - RIGHT TO REPRESENT
  // ==========================================

  const rtrPatterns = [

    /\bright to represent\b/i,

    /\brtr\b/i,

    /right-to-represent/i,

    /authorization to represent/i,

    /authorize.*represent/i,

    /authorise.*represent/i,

    /permission to represent/i,

    /representation authorization/i,

    /representation confirmation/i,

    /exclusive.*represent/i

  ];


  if (
    rtrPatterns.some(
      pattern =>
        pattern.test(text)
    )
  ) {

    return {
      status: 'RTR',
      reason: 'Right to Represent detected'
    };
  }


  // ==========================================
  // NORMAL RECRUITER REPLY
  // ==========================================
  //
  // Only count it as "Replied" when YOU had
  // already sent a message earlier in this thread.
  // This prevents an initial recruiter cold email
  // from incorrectly becoming "Replied".
  // ==========================================

  if (
    hasEarlierOutgoingMessage_(
      thread,
      message,
      myEmails
    )
  ) {

    return {
      status: 'Replied',
      reason: 'Recruiter replied after your outgoing email'
    };
  }


  return {
    status: '',
    reason: ''
  };
}



// =====================================================
// CHECK WHETHER YOU SENT AN EARLIER MESSAGE
// IN THE SAME GMAIL THREAD
// =====================================================

function hasEarlierOutgoingMessage_(
  thread,
  currentMessage,
  myEmails
) {

  const messages =
    thread.getMessages();


  const currentTime =
    currentMessage
      .getDate()
      .getTime();


  for (
    let i = 0;
    i < messages.length;
    i++
  ) {

    const message =
      messages[i];


    if (
      message.getId() ===
      currentMessage.getId()
    ) {
      continue;
    }


    if (
      message
        .getDate()
        .getTime() >=
      currentTime
    ) {
      continue;
    }


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

      return true;
    }

  }


  return false;
}



// =====================================================
// FIND MATCHING RECRUITER ROW
// =====================================================

