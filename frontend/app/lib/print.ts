export const printMedicalDoc = (title: string, contentHtml: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để in tài liệu.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("vi-VN");

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0056b3;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0056b3;
        }
        .clinic-info {
          text-align: right;
          font-size: 14px;
        }
        .title {
          text-align: center;
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .content {
          margin-bottom: 30px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          margin-top: 40px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          button {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">MedFlow AI</div>
        <div class="clinic-info">
          Phòng khám Đa khoa MedFlow<br>
          Địa chỉ: 123 Đường Y Tế, Quận Sức Khoẻ, TP.HCM<br>
          Hotline: 1900 1234
        </div>
      </div>
      
      <div class="title">${title}</div>
      
      <div class="content">
        ${contentHtml}
      </div>
      
      <div class="footer">
        <p>Tài liệu được in từ hệ thống MedFlow AI vào ngày ${dateStr}.</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
