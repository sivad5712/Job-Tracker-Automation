function detectApplicationPortal_(message) {

  const from =
    (message.getFrom() || '')
      .toLowerCase();


  // Use sender address instead of entire body.
  // This avoids false LinkedIn detection from
  // LinkedIn links inside company emails.


  if (from.includes('monster.com')) {
    return 'Monster';
  }


  if (from.includes('linkedin.com')) {
    return 'LinkedIn';
  }


  if (from.includes('dice.com')) {
    return 'Dice';
  }


  if (from.includes('indeed.com')) {
    return 'Indeed';
  }


  if (from.includes('ziprecruiter.com')) {
    return 'ZipRecruiter';
  }


  if (
    from.includes('myworkdayjobs.com') ||
    from.includes('workday.com')
  ) {
    return 'Workday';
  }


  if (from.includes('greenhouse.io')) {
    return 'Greenhouse';
  }


  if (from.includes('lever.co')) {
    return 'Lever';
  }


  if (from.includes('icims.com')) {
    return 'iCIMS';
  }


  if (from.includes('smartrecruiters.com')) {
    return 'SmartRecruiters';
  }


  if (from.includes('jobvite.com')) {
    return 'Jobvite';
  }


  if (from.includes('taleo.net')) {
    return 'Taleo';
  }


  if (from.includes('oraclecloud.com')) {
    return 'Oracle Recruiting';
  }


  if (from.includes('successfactors')) {
    return 'SuccessFactors';
  }


  if (from.includes('ashbyhq.com')) {
    return 'Ashby';
  }


  if (from.includes('workable.com')) {
    return 'Workable';
  }


  return 'Company Portal';
}



// =====================================================
// EXTRACT COMPANY
// =====================================================

function extractApplicationCompany_(message, portal) {

  const subject =
    message.getSubject() || '';


  const body =
    getApplicationEmailText_(
      message
    );


  const combined =
    subject +
    '\n' +
    body;


  const patterns = [

    // Monster:
    // OPUSING LLC has received your application for ...

    /(?:^|\n)\s*([A-Z][A-Za-z0-9&.'’\- ]{1,80}?)\s+has received your application for/i,


    // We received your application at Company

    /received your application at\s+([^\n\r.!|]+)/i,


    // We received your application with Company

    /received your application with\s+([^\n\r.!|]+)/i,


    // Thank you for applying with Company

    /thank you for applying with\s+([^\n\r.!|]+)/i,


    // Your application with Company

    /your application with\s+([^\n\r.!|]+)/i

  ];


  for (const pattern of patterns) {

    const match =
      combined.match(pattern);


    if (
      match &&
      match[1]
    ) {

      const company =
        cleanExtractedValue_(
          match[1]
        );


      if (
        company.length >= 2 &&
        company.length <= 100
      ) {

        return company;
      }
    }
  }


  // =================================================
  // SENDER DISPLAY NAME
  //
  // System One Careers
  // becomes:
  // System One
  // =================================================

  const sender =
    parseEmailAddress_(
      message.getFrom()
    );


  if (sender.name) {

    let senderCompany =
      sender.name
        .replace(
          /\bcareers?\b/gi,
          ''
        )
        .replace(
          /\brecruiting\b/gi,
          ''
        )
        .replace(
          /\brecruitment\b/gi,
          ''
        )
        .replace(
          /\btalent acquisition\b/gi,
          ''
        )
        .replace(
          /\bjobs?\b/gi,
          ''
        )
        .replace(
          /\bnotifications?\b/gi,
          ''
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();


    const genericNames = [

      'monster.com',
      'monster',

      'linkedin',

      'dice',

      'indeed',

      'ziprecruiter',

      'workday',

      'greenhouse',

      'lever',

      'icims',

      'smartrecruiters',

      'jobvite',

      'taleo'

    ];


    const isGeneric =
      genericNames.includes(
        senderCompany.toLowerCase()
      );


    if (
      senderCompany &&
      !isGeneric
    ) {

      return senderCompany;
    }
  }


  // =================================================
  // DOMAIN FALLBACK
  // =================================================

  const domainCompany =
    extractCompanyFromEmail_(
      sender.email
    );


  const badDomainCompanies = [

    'monster',
    'ses',
    'linkedin',
    'dice',
    'indeed',
    'ziprecruiter',
    'workday',
    'greenhouse',
    'lever',
    'icims',
    'smartrecruiters',
    'jobvite',
    'taleo'

  ];


  if (
    domainCompany &&
    !badDomainCompanies.includes(
      domainCompany.toLowerCase()
    )
  ) {

    return domainCompany;
  }


  return '';
}



// =====================================================
// EXTRACT POSITION
// =====================================================

function extractApplicationPosition_(message) {

  const subject =
    (message.getSubject() || '')
      .replace(
        /^(re|fw|fwd)\s*:\s*/gi,
        ''
      )
      .trim();


  const body =
    getApplicationEmailText_(
      message
    );


  const combined =
    subject +
    '\n' +
    body;


  const patterns = [

    // System One:
    // Thank you for your application to
    // Senior API Platform Software Engineer !

    /thank you for your application to\s+(.+?)(?:\s*!|\s*$)/i,


    // Monster:
    // received your application for
    // General Labor in Mount Vernon, OH

    /received your application for\s+([^\n\r]+?)(?=\s+in\s+[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\b|\n|\.|$)/i,


    // Application for the position of Senior Engineer

    /application for (?:the )?(?:position|role) (?:of|as)?\s*([^\n\r,.|]+)/i,


    // Application for Senior Engineer position

    /application for (?:the )?([^\n\r,.|]+?)\s+(?:position|role)/i,


    // You applied for Senior Engineer

    /(?:you )?applied for\s+([^\n\r,.|]+)/i,


    // Thank you for applying for Senior Engineer

    /thank you for applying for\s+([^\n\r,.|]+)/i,


    // Thanks for applying for Senior Engineer

    /thanks for applying for\s+([^\n\r,.|]+)/i,


    // Interest in the Senior Engineer position

    /interest in (?:the )?([^\n\r,.|]+?)\s+(?:position|role)/i,


    // Position: Senior Engineer

    /\bposition\s*:\s*([^\n\r|]+)/i,


    // Job Title: Senior Engineer

    /\bjob title\s*:\s*([^\n\r|]+)/i,


    // Role: Senior Engineer

    /\brole\s*:\s*([^\n\r|]+)/i

  ];


  for (const pattern of patterns) {

    const match =
      combined.match(pattern);


    if (
      match &&
      match[1]
    ) {

      let position =
        cleanExtractedValue_(
          match[1]
        );


      position =
        position
          .replace(
            /[!|]+$/g,
            ''
          )
          .trim();


      if (
        position.length >= 2 &&
        position.length <= 140
      ) {

        return position;
      }
    }
  }


  return '';
}



// =====================================================
// CLEAN EXTRACTED VALUE
// =====================================================

function cleanExtractedValue_(value) {

  if (!value) {
    return '';
  }


  return value
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
      /\s+/g,
      ' '
    )
    .replace(
      /^[\s\-:|]+|[\s\-:|]+$/g,
      ''
    )
    .trim();
}

// =====================================================
// STEP 9
// WRITE DETECTED JOB APPLICATIONS TO TODAY'S SHEET
// =====================================================

