function findMatchingRecruiterRecord_(
  spreadsheet,
  message,
  thread
) {

  const sender =
    parseEmailAddress_(
      message.getFrom()
    );


  const senderEmail =
    String(
      sender.email || ''
    )
      .toLowerCase()
      .trim();


  const senderName =
    normalizeApplicationText_(
      sender.name
    );


  const emailText =
    normalizeApplicationText_(

      (message.getSubject() || '') +
      '\n' +
      getApplicationEmailText_(message) +
      '\n' +
      (message.getFrom() || '')

    );


  const threadId =
    thread.getId();


  const candidates = [];


  spreadsheet
    .getSheets()
    .forEach(sheet => {

      const sheetName =
        sheet.getName();


      if (
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


      const firstRow =
        recruiterCell.getRow() + 2;


      const lastRow =
        portalCell.getRow() - 5;


      if (
        lastRow <
        firstRow
      ) {
        return;
      }


      const data =
        sheet
          .getRange(
            firstRow,
            1,
            lastRow -
              firstRow +
              1,
            8
          )
          .getDisplayValues();


      data.forEach(
        (row, index) => {

          const company =
            String(
              row[1] || ''
            ).trim();


          const recruiterName =
            String(
              row[2] || ''
            ).trim();


          const recruiterEmail =
            String(
              row[4] || ''
            )
              .toLowerCase()
              .trim();


          const jobTitle =
            String(
              row[5] || ''
            ).trim();


          const status =
            String(
              row[6] || ''
            ).trim();


          if (
            !company &&
            !recruiterEmail &&
            !jobTitle
          ) {
            return;
          }


          const realRow =
            firstRow +
            index;


          let score = 0;

          let sameThread = false;
          let emailMatch = false;
          let jobMatch = false;
          let companyMatch = false;


          // ====================================
          // SAME GMAIL THREAD
          // ====================================

          const linkFormula =
            sheet
              .getRange(
                realRow,
                8
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
          // EXACT RECRUITER EMAIL
          // ====================================

          if (
            senderEmail &&
            recruiterEmail &&
            senderEmail ===
              recruiterEmail
          ) {

            emailMatch = true;

            score += 12;
          }


          // ====================================
          // JOB TITLE
          // ====================================

          const jobNormalized =
            normalizeApplicationText_(
              jobTitle
            );


          if (
            jobNormalized.length >= 5 &&
            emailText.includes(
              jobNormalized
            )
          ) {

            jobMatch = true;

            score += 10;
          }


          // ====================================
          // COMPANY
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


          // ====================================
          // RECRUITER NAME
          // ====================================

          const recruiterNameNormalized =
            normalizeApplicationText_(
              recruiterName
            );


          if (
            recruiterNameNormalized &&
            senderName &&
            (
              senderName.includes(
                recruiterNameNormalized
              ) ||
              recruiterNameNormalized.includes(
                senderName
              )
            )
          ) {

            score += 4;
          }


          // ====================================
          // IMPORTANT SAFETY RULE
          // ====================================
          //
          // Valid match only when:
          //
          // 1. Same Gmail conversation
          //
          // OR
          //
          // 2. Same recruiter email AND
          //    job/company matches.
          //
          // Sender email alone is NOT enough.
          // ====================================

          const reliableMatch =
            sameThread ||
            (
              emailMatch &&
              (
                jobMatch ||
                companyMatch
              )
            );


          if (!reliableMatch) {
            return;
          }


          candidates.push({

            sheet: sheet,

            row: realRow,

            company: company,

            recruiterName:
              recruiterName,

            email:
              recruiterEmail,

            jobTitle:
              jobTitle,

            status:
              status,

            score:
              score,

            sameThread:
              sameThread

          });

        }
      );

    });


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


  // ==========================================
  // DON'T GUESS BETWEEN TWO EQUAL MATCHES
  // ==========================================

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
// RECRUITER STATUS PROGRESSION RULES
// =====================================================

