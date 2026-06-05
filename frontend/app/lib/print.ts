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

/**
 * In phiếu kết quả xét nghiệm chuẩn y khoa (PDF-ready).
 * Hỗ trợ: bảng chỉ số, hình ảnh chẩn đoán (nhúng base64), phân tích AI.
 */
export const printLabResultPDF = async (result: {
  testType: string;
  bodyPart?: string;
  createdAt: string;
  status?: string;
  indicators?: Array<{ name: string; value: number | string; unit?: string; referenceRange?: string; normalRange?: string }>;
  imageUrl?: string;
  aiAnalysis?: string;
  doctorNotes?: string;
}, patientName: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để in tài liệu.");
    return;
  }

  const dateStr = new Date(result.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  const printDateStr = new Date().toLocaleDateString("vi-VN");

  // Nhúng hình ảnh dưới dạng base64 để hiển thị trong PDF khi không có internet
  let imageBase64 = "";
  if (result.imageUrl) {
    try {
      const resp = await fetch(result.imageUrl);
      const blob = await resp.blob();
      imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // fallback: dùng URL trực tiếp nếu không thể fetch
      imageBase64 = result.imageUrl;
    }
  }

  const indicatorsHtml = result.indicators && result.indicators.length > 0
    ? result.indicators.map((ind, idx) => {
        const refRange = ind.referenceRange || ind.normalRange || "";
        const val = Number(ind.value);
        const [lo, hi] = refRange.split("-").map(Number);
        const isAbnormal = refRange && !isNaN(lo) && !isNaN(hi) && (val < lo || val > hi);
        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><strong>${ind.name}</strong></td>
            <td style="text-align:center; font-weight:bold; color:${isAbnormal ? "#dc2626" : "#111"}">${ind.value}</td>
            <td style="text-align:center">${ind.unit || "—"}</td>
            <td style="text-align:center">${refRange || "—"}</td>
            <td style="text-align:center">
              ${isAbnormal
                ? `<span style="color:#dc2626;font-weight:bold">Bất thường</span>`
                : `<span style="color:#16a34a;font-weight:bold">Bình thường</span>`}
            </td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="6" style="text-align:center;color:#888;font-style:italic">Không có chỉ số đo được</td></tr>`;

  const imageSection = imageBase64
    ? `<div class="section">
        <div class="section-title">Hình ảnh chẩn đoán${result.bodyPart ? ` — ${result.bodyPart}` : ""}</div>
        <div style="text-align:center;margin-top:12px">
          <img src="${imageBase64}" alt="Hình ảnh chẩn đoán"
               style="max-width:100%;max-height:480px;object-fit:contain;border:1px solid #ddd;border-radius:8px;padding:4px"/>
          <p style="font-size:11px;color:#888;margin-top:6px;font-style:italic">
            Ảnh chẩn đoán ${result.testType}${result.bodyPart ? ` — ${result.bodyPart}` : ""}
          </p>
        </div>
      </div>`
    : "";

  const aiSection = result.aiAnalysis
    ? `<div class="section">
        <div class="section-title">Phân tích AI (Tham khảo)</div>
        <div style="background:#f0f7ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;margin-top:10px;font-size:12px;line-height:1.7;color:#1e3a5f">
          ${result.aiAnalysis.replace(/\n/g, "<br>")}
        </div>
        <p style="font-size:10px;color:#f59e0b;margin-top:8px;font-style:italic">
          Lưu ý: Thông tin AI chỉ mang tính tham khảo, không thay thế chẩn đoán chuyên môn.
        </p>
      </div>`
    : "";

  const noteSection = result.doctorNotes
    ? `<div class="section">
        <div class="section-title">Ghi chú của bác sĩ</div>
        <p style="margin-top:8px;font-size:13px;line-height:1.7">${result.doctorNotes}</p>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu kết quả xét nghiệm — ${result.testType}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, 'Segoe UI', sans-serif;
      font-size: 13px; color: #222;
      max-width: 820px; margin: 0 auto; padding: 28px 32px;
      line-height: 1.5;
    }
    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 18px;
    }
    .logo { font-size: 22px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.5px; }
    .logo span { color: #10b981; }
    .clinic-info { text-align: right; font-size: 11px; color: #555; line-height: 1.7; }
    /* ── Doc title ── */
    .doc-title {
      text-align: center; font-size: 20px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 1px;
      color: #1d4ed8; margin: 14px 0 20px;
    }
    /* ── Patient info box ── */
    .info-box {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px 24px; background: #f8faff;
      border: 1px solid #dbeafe; border-radius: 8px;
      padding: 14px 18px; margin-bottom: 20px;
    }
    .info-item label { font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase; }
    .info-item p { font-size: 14px; font-weight: 700; color: #111; margin-top: 2px; }
    /* ── Section ── */
    .section { margin-bottom: 22px; }
    .section-title {
      font-size: 13px; font-weight: 800; text-transform: uppercase;
      color: #1d4ed8; border-bottom: 1px solid #dbeafe;
      padding-bottom: 6px; margin-bottom: 10px; letter-spacing: 0.5px;
    }
    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
    th {
      background: #1d4ed8; color: #fff; font-weight: 700;
      padding: 8px 10px; text-align: center; font-size: 11px;
    }
    td { border: 1px solid #e2e8f0; padding: 7px 10px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8faff; }
    /* ── Signature ── */
    .signature-row {
      display: flex; justify-content: space-between; margin-top: 36px;
    }
    .sig-box { text-align: center; width: 200px; }
    .sig-box p { font-size: 11px; font-weight: 700; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 60px; }
    /* ── Footer ── */
    .page-footer {
      text-align: center; font-size: 10px; color: #999;
      border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 30px;
    }
    @media print {
      body { padding: 16px 20px; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="logo">MedFlow<span> AI</span></div>
      <div style="font-size:11px;color:#555;margin-top:4px">Hệ thống Quản lý Bệnh viện Thông minh</div>
    </div>
    <div class="clinic-info">
      Phòng khám Đa khoa MedFlow AI<br>
      Địa chỉ: 123 Đường Y Tế, Quận Sức Khoẻ, TP.HCM<br>
      Điện thoại: 1900 1234 | Email: info@medflow.ai<br>
      Mã phiếu: <strong>LAB-${Date.now().toString().slice(-8)}</strong>
    </div>
  </div>

  <!-- Doc title -->
  <div class="doc-title">Phiếu kết quả xét nghiệm</div>

  <!-- Patient info -->
  <div class="info-box">
    <div class="info-item">
      <label>Bệnh nhân</label>
      <p>${patientName}</p>
    </div>
    <div class="info-item">
      <label>Loại xét nghiệm</label>
      <p>${result.testType}</p>
    </div>
    <div class="info-item">
      <label>Ngày thực hiện</label>
      <p>${dateStr}</p>
    </div>
    <div class="info-item">
      <label>Vị trí / Bộ phận</label>
      <p>${result.bodyPart || "—"}</p>
    </div>
    <div class="info-item">
      <label>Trạng thái</label>
      <p style="color:#16a34a">Đã có kết quả</p>
    </div>
    <div class="info-item">
      <label>Ngày in phiếu</label>
      <p>${printDateStr}</p>
    </div>
  </div>

  <!-- Indicators table -->
  <div class="section">
    <div class="section-title">Bảng chỉ số xét nghiệm</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px">STT</th>
          <th>Tên chỉ số</th>
          <th style="width:90px">Giá trị</th>
          <th style="width:70px">Đơn vị</th>
          <th style="width:110px">Khoảng chuẩn</th>
          <th style="width:110px">Đánh giá</th>
        </tr>
      </thead>
      <tbody>
        ${indicatorsHtml}
      </tbody>
    </table>
  </div>

  ${noteSection}
  ${imageSection}
  ${aiSection}

  <!-- Signature -->
  <div class="signature-row">
    <div class="sig-box">
      <p>Kỹ thuật viên xét nghiệm<br><em>(Ký và ghi rõ họ tên)</em></p>
    </div>
    <div class="sig-box">
      <p>Bác sĩ phụ trách<br><em>(Ký và ghi rõ họ tên)</em></p>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <p>Phiếu kết quả xét nghiệm được tạo bởi hệ thống MedFlow AI — ${printDateStr}</p>
    <p style="margin-top:2px">Tài liệu này có giá trị pháp lý khi có chữ ký của bác sĩ phụ trách.</p>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
