
const getEmailTemplate = (subject, content, userName = 'there') => {

  // Escape name before inserting it into HTML
  const safeName = String(userName)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>

    <body style="
      margin:0;
      padding:0;
      background:#f5f2fc;
      font-family:Arial, Helvetica, sans-serif;
    ">

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f5f2fc; padding:35px 12px;">

        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
              style="
                max-width:600px;
                width:100%;
                background:#ffffff;
                border-radius:16px;
                overflow:hidden;
                box-shadow:0 8px 30px rgba(70,40,120,0.08);
              ">

              <!-- HEADER -->
              <tr>
                <td align="center"
                  style="
                    background:#7653c9;
                    padding:32px 20px;
                  ">

                  <h1 style="
                    color:#ffffff;
                    margin:0;
                    font-size:32px;
                    font-weight:700;
                    letter-spacing:0.5px;
                  ">
                    Sellora
                  </h1>

                  <p style="
                    color:#eee7ff;
                    margin:10px 0 0;
                    font-size:13px;
                    letter-spacing:2px;
                  ">
                    SHOP • SELL • GROW
                  </p>

                </td>
              </tr>

              <!-- EMAIL CONTENT -->
              <tr>
                <td style="
                  padding:35px 30px;
                  color:#374151;
                  font-size:15px;
                  line-height:1.8;
                ">

                  <h2 style="
                    color:#241344;
                    font-size:23px;
                    margin:0 0 18px;
                  ">
                    Hi ${safeName},
                  </h2>

                  <div style="color:#4b5563;">
                    ${content}
                  </div>

                  <p style="
                    margin-top:32px;
                    color:#4b5563;
                  ">
                    Warm Regards,<br>
                    <strong style="color:#7653c9;">
                      Team Sellora
                    </strong>
                  </p>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="
                  background:#f8f6fc;
                  padding:25px 15px;
                  border-top:1px solid #eee8fa;
                ">

                  <h3 style="
                    color:#7653c9;
                    margin:0 0 8px;
                    font-size:18px;
                  ">
                    Sellora
                  </h3>

                  <p style="
                    color:#77718a;
                    font-size:12px;
                    margin:5px 0;
                  ">
                    Shop • Sell • Grow
                  </p>

                  <p style="
                    color:#9993a5;
                    font-size:11px;
                    margin:12px 0 0;
                  ">
                    © 2026 Sellora. All rights reserved.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>

      </table>

    </body>
    </html>
  `
}

module.exports = getEmailTemplate
