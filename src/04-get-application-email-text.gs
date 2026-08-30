function getApplicationEmailText_(message) {

  let plain =
    message.getPlainBody() || '';


  // Some ATS emails are mainly HTML.
  if (plain.trim().length < 40) {

    let html =
      message.getBody() || '';


    html =
      html
        .replace(
          /<style[\s\S]*?<\/style>/gi,
          ' '
        )
        .replace(
          /<script[\s\S]*?<\/script>/gi,
          ' '
        )
        .replace(
          /<br\s*\/?>/gi,
          '\n'
        )
        .replace(
          /<\/p>/gi,
          '\n'
        )
        .replace(
          /<\/div>/gi,
          '\n'
        )
        .replace(
          /<[^>]+>/g,
          ' '
        )
        .replace(
          /&nbsp;/gi,
          ' '
        )
        .replace(
          /&amp;/gi,
          '&'
        )
        .replace(
          /&lt;/gi,
          '<'
        )
        .replace(
          /&gt;/gi,
          '>'
        );


    plain += '\n' + html;
  }


  return plain;
}



// =====================================================
// DETECT REAL JOB APPLICATION
// =====================================================

function detectRealJobApplication_(message) {

  const subject =
    (message.getSubject() || '')
      .toLowerCase()
      .trim();


 const body =
  getNewestRecruiterReplyText_(
    message
  ).toLowerCase();


  const from =
    (message.getFrom() || '')
      .toLowerCase();


  const combined =
    subject +
    '\n' +
    from +
    '\n' +
    body;


  let score = 0;

  const reasons = [];


  // =================================================
  // VERY STRONG APPLICATION CONFIRMATIONS
  // =================================================

  const veryStrongPatterns = [

    /thank you for your application/i,

    /thank you for applying/i,

    /thanks for applying/i,

    /thanks for your application/i,

    /application received/i,

    /application has been received/i,

    /application was received/i,

    /we received your application/i,

    /we've received your application/i,

    /we have received your application/i,

    /has received your application/i,

    /your application has been received/i,

    /your application was received/i,

    /received your application for/i,

    /received your application to/i,

    /application submitted/i,

    /application has been submitted/i,

    /application was submitted/i,

    /your application has been submitted/i,

    /your application was submitted/i,

    /successfully submitted your application/i,

    /successfully submitted an application/i,

    /successfully applied/i,

    /application confirmation/i,

    /confirmation of your application/i,

    /submission confirmation/i,

    /your submission has been received/i,

    /we received your submission/i

  ];


  veryStrongPatterns.forEach(
    pattern => {

      if (pattern.test(combined)) {

        score += 8;

        reasons.push(
          'strong confirmation: ' +
          pattern.toString()
        );
      }

    }
  );


  // =================================================
  // STRONG SUBJECT CONFIRMATION
  // =================================================

  const strongSubjectPatterns = [

    /thank you for.*applic/i,

    /application received/i,

    /application confirmation/i,

    /application submitted/i,

    /thanks for applying/i,

    /thank you for applying/i,

    /we received your application/i

  ];


  strongSubjectPatterns.forEach(
    pattern => {

      if (pattern.test(subject)) {

        score += 8;

        reasons.push(
          'confirmation in subject'
        );
      }

    }
  );


  // =================================================
  // SECONDARY ATS / APPLICATION LANGUAGE
  // =================================================

  const secondaryPatterns = [

    /thank you for your interest in/i,

    /thanks for your interest in/i,

    /we appreciate your interest in/i,

    /we appreciate your application/i,

    /your application for/i,

    /application for the position/i,

    /application for the role/i,

    /application for our/i,

    /candidate application/i,

    /application status/i,

    /we will review your application/i,

    /our recruiting team will review/i,

    /our recruitment team will review/i,

    /reviewing your qualifications/i,

    /review your qualifications/i,

    /next steps in the hiring process/i,

    /next steps in our hiring process/i,

    /we will be in touch/i,

    /our team will contact you/i,

    /you applied to/i,

    /you applied for/i

  ];


  secondaryPatterns.forEach(
    pattern => {

      if (pattern.test(combined)) {

        score += 3;

        reasons.push(
          'ATS/application language'
        );
      }

    }
  );


  // =================================================
  // KNOWN JOB BOARDS / ATS SYSTEMS
  // =================================================

  const atsIndicators = [

    'monster.com',
    'ses.monster.com',

    'linkedin.com',

    'dice.com',

    'indeed.com',

    'ziprecruiter.com',

    'myworkdayjobs.com',
    'workday.com',

    'greenhouse.io',

    'lever.co',

    'icims.com',

    'smartrecruiters.com',

    'jobvite.com',

    'taleo.net',

    'oraclecloud.com',

    'brassring.com',

    'successfactors.com',

    'successfactors.eu',

    'ashbyhq.com',

    'workable.com',

    'phenom.com',

    'eightfold.ai',

    'rippling.com',

    'bamboohr.com',

    'recruitee.com',

    'applytojob.com',

    'jazzhr.com',

    'paylocity.com',

    'ultipro.com',

    'ukg.com',

    'adp.com',

    'dayforcehcm.com',

    'jobdiva.com',

    'bullhornstaffing.com',

    'careers-page.com'

  ];


  atsIndicators.forEach(
    ats => {

      if (combined.includes(ats)) {

        score += 2;

        reasons.push(
          'known job/ATS system: ' +
          ats
        );
      }

    }
  );


  // =================================================
  // GENERAL APPLICATION TERMS
  // =================================================

  const applicationTerms = [

    'application',
    'applicant',
    'candidate',
    'position',
    'role',
    'job',
    'career',
    'hiring',
    'talent acquisition',
    'recruiting team',
    'recruitment team'

  ];


  let termCount = 0;


  applicationTerms.forEach(
    term => {

      if (combined.includes(term)) {
        termCount++;
      }

    }
  );


  if (termCount >= 3) {

    score += 2;

    reasons.push(
      'multiple application terms'
    );
  }


  // =================================================
  // JOB ALERT / RECOMMENDATION SIGNALS
  // =================================================

  const recommendationPatterns = [

    /job alert/i,

    /new jobs for you/i,

    /recommended jobs/i,

    /jobs you may be interested in/i,

    /jobs based on your profile/i,

    /similar jobs for you/i,

    /similar jobs/i,

    /top job picks/i,

    /weekly job alert/i,

    /daily job alert/i,

    /recommended for you/i

  ];


  const hasVeryStrongEvidence =
    score >= 8;


  if (!hasVeryStrongEvidence) {

    const looksLikeRecommendation =
      recommendationPatterns.some(
        pattern =>
          pattern.test(combined)
      );


    if (looksLikeRecommendation) {

      score -= 4;

      reasons.push(
        'possible job alert/recommendation'
      );
    }
  }


  const isApplication =
    score >= 6;


  return {

    isApplication: isApplication,

    score: score,

    reason:
      reasons.length
        ? reasons.slice(0, 8).join(' | ')
        : 'No application evidence'

  };
}



// =====================================================
// DETECT PORTAL / ATS
// =====================================================

