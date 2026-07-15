/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APPS_SCRIPT_CODE = `/**
 * Google Apps Script untuk Koperasi SMAN 1 Soko
 * Salin kode ini ke Editor Apps Script Spreadsheet Anda.
 * 
 * Panduan Singkat:
 * 1. Buka Google Spreadsheet baru.
 * 2. Klik Ekstensi -> Apps Script.
 * 3. Hapus semua kode bawaan, lalu tempel kode ini.
 * 4. Jalankan fungsi "setupDatabase" sekali untuk membuat tabel & isi data awal secara otomatis.
 * 5. Terapkan (Deploy) sebagai Aplikasi Web:
 *    - Klik Terapkan -> Penerapan Baru (New Deployment).
 *    - Pilih Jenis: Aplikasi Web (Web App).
 *    - Jalankan Sebagai: Saya (Email Anda).
 *    - Siapa yang memiliki akses: Siapa saja (Anyone) -> Agar aplikasi React dapat mengakses.
 * 6. Salin URL Aplikasi Web yang dihasilkan dan masukkan ke halaman Pengaturan Aplikasi SMAN 1 Soko.
 */

// Konfigurasi nama-nama sheet
const SHEETS = {
  ANGGOTA: "Anggota",
  TRANSAKSI: "Transaksi",
  ASET: "Aset",
  PENGATURAN: "Pengaturan"
};

/**
 * Menangani permintaan HTTP GET (Mengambil Data)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "getAll") {
      const data = {
        members: getSheetDataAsJson(ss.getSheetByName(SHEETS.ANGGOTA)),
        transactions: getSheetDataAsJson(ss.getSheetByName(SHEETS.TRANSAKSI)),
        assets: getSheetDataAsJson(ss.getSheetByName(SHEETS.ASET)),
        config: getSettingsAsJson(ss.getSheetByName(SHEETS.PENGATURAN))
      };
      return createJsonResponse({ status: "success", data: data });
    }
    
    return createJsonResponse({ status: "error", message: "Aksi tidak dikenal" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Menangani permintaan HTTP POST (Menyimpan/Mengubah Data)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "syncAll") {
      // Sinkronisasi penuh dari klien
      if (postData.members) saveJsonToSheet(ss.getSheetByName(SHEETS.ANGGOTA), postData.members, ["id"]);
      if (postData.transactions) saveJsonToSheet(ss.getSheetByName(SHEETS.TRANSAKSI), postData.transactions, ["id"]);
      if (postData.assets) saveJsonToSheet(ss.getSheetByName(SHEETS.ASET), postData.assets, ["id"]);
      if (postData.config) saveSettings(ss.getSheetByName(SHEETS.PENGATURAN), postData.config);
      
      return createJsonResponse({ status: "success", message: "Sinkronisasi database berhasil!" });
    }
    
    if (action === "addTransaction") {
      const tx = postData.data;
      const sheet = ss.getSheetByName(SHEETS.TRANSAKSI);
      appendRowFromJson(sheet, tx);
      
      // Jika ada kaitan dengan anggota, update saldo anggotanya langsung di Google Sheets
      if (tx.memberId) {
        updateMemberBalances(ss.getSheetByName(SHEETS.ANGGOTA), tx);
      }
      return createJsonResponse({ status: "success", message: "Transaksi berhasil dicatat" });
    }
    
    return createJsonResponse({ status: "error", message: "Aksi post tidak dikenal" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * SETUP DATABASE OTOMATIS
 * Jalankan fungsi ini sekali untuk membuat semua tabel awal beserta data contoh.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Sheet Anggota
  let sheetAnggota = ss.getSheetByName(SHEETS.ANGGOTA);
  if (!sheetAnggota) {
    sheetAnggota = ss.insertSheet(SHEETS.ANGGOTA);
  } else {
    sheetAnggota.clear();
  }
  const headersAnggota = ["id", "name", "type", "status", "joinDate", "leaveDate", "simpananPokok", "simpananWajib", "simpananSukarela", "loanBalance", "totalInterestPaid", "phone"];
  sheetAnggota.appendRow(headersAnggota);
  // Tambah beberapa data contoh
  sheetAnggota.appendRow(["197508122005011003", "Drs. H. Sugeng, M.Pd.", "guru", "active", "2018-01-15", "", 100000, 1200000, 3450000, 4000000, 450000, "081234567890"]);
  sheetAnggota.appendRow(["198203152010022001", "Sri Wahyuni, S.Pd.", "guru", "active", "2019-03-20", "", 100000, 1000000, 1800000, 0, 180000, "081398765432"]);
  sheetAnggota.appendRow(["20080512001", "Ahmad Dani Prasetyo", "siswa", "active", "2024-07-15", "", 10000, 60000, 150000, 0, 0, "081211223344"]);
  formatHeaderRow(sheetAnggota);

  // 2. Setup Sheet Transaksi
  let sheetTransaksi = ss.getSheetByName(SHEETS.TRANSAKSI);
  if (!sheetTransaksi) {
    sheetTransaksi = ss.insertSheet(SHEETS.TRANSAKSI);
  } else {
    sheetTransaksi.clear();
  }
  const headersTransaksi = ["id", "date", "type", "memberId", "memberName", "amount", "interestAmount", "description", "recordedBy"];
  sheetTransaksi.appendRow(headersTransaksi);
  sheetTransaksi.appendRow(["TX-001", "2026-07-01", "simpanan_wajib", "197508122005011003", "Drs. H. Sugeng, M.Pd.", 100000, 0, "Simpanan Wajib bulan Juli 2026", "Hj. Endang Setyowati (Bendahara)"]);
  sheetTransaksi.appendRow(["TX-002", "2026-07-05", "bayar_cicilan", "197508122005011003", "Drs. H. Sugeng, M.Pd.", 500000, 75000, "Bayar cicilan ke-5 + Jasa Pinjam 1.5%", "Hj. Endang Setyowati (Bendahara)"]);
  formatHeaderRow(sheetTransaksi);

  // 3. Setup Sheet Aset
  let sheetAset = ss.getSheetByName(SHEETS.ASET);
  if (!sheetAset) {
    sheetAset = ss.insertSheet(SHEETS.ASET);
  } else {
    sheetAset.clear();
  }
  const headersAset = ["id", "name", "category", "value", "description", "lastUpdated"];
  sheetAset.appendRow(headersAset);
  sheetAset.appendRow(["AST-01", "Kas Tunai Koperasi (Brankas)", "cash", 4850000, "Uang tunai brankas koperasi", "2026-07-14"]);
  sheetAset.appendRow(["AST-02", "Rekening Bank Jatim SMAN 1 Soko", "bank", 28450000, "Saldo kas di Bank Jatim", "2026-07-14"]);
  sheetAset.appendRow(["AST-03", "Piutang Pinjaman Anggota", "receivable", 5200000, "Sisa pinjaman berjalan di anggota", "2026-07-14"]);
  formatHeaderRow(sheetAset);

  // 4. Setup Sheet Pengaturan
  let sheetPengaturan = ss.getSheetByName(SHEETS.PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet(SHEETS.PENGATURAN);
  } else {
    sheetPengaturan.clear();
  }
  const headersPengaturan = ["key", "value"];
  sheetPengaturan.appendRow(headersPengaturan);
  sheetPengaturan.appendRow(["loanInterestRate", 1.5]);
  sheetPengaturan.appendRow(["shuJasaSimpan", 30]);
  sheetPengaturan.appendRow(["shuJasaPinjam", 25]);
  sheetPengaturan.appendRow(["shuPengurus", 15]);
  sheetPengaturan.appendRow(["shuCadangan", 20]);
  sheetPengaturan.appendRow(["shuSosial", 5]);
  sheetPengaturan.appendRow(["shuPendidikan", 5]);
  formatHeaderRow(sheetPengaturan);

  Logger.log("DATABASE BERHASIL DISIAPKAN!");
}

// --- FUNGSI PEMBANTU ---

function formatHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground("#3B82F6") // Blue Tailwind color
       .setFontColor("#FFFFFF")
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
  sheet.autoResizeColumns(1, sheet.getLastColumn());
}

function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const jsonData = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    jsonData.push(item);
  }
  return jsonData;
}

function getSettingsAsJson(sheet) {
  if (!sheet) return {};
  const rows = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    const value = Number(rows[i][1]);
    if (key) {
      config[key] = isNaN(value) ? rows[i][1] : value;
    }
  }
  return config;
}

function saveSettings(sheet, config) {
  if (!sheet) return;
  sheet.clear();
  sheet.appendRow(["key", "value"]);
  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      sheet.appendRow([key, config[key]]);
    }
  }
  formatHeaderRow(sheet);
}

function saveJsonToSheet(sheet, dataList, primaryKeys) {
  if (!sheet) return;
  sheet.clear();
  if (dataList.length === 0) return;
  
  const headers = Object.keys(dataList[0]);
  sheet.appendRow(headers);
  
  dataList.forEach(item => {
    const row = headers.map(h => item[h]);
    sheet.appendRow(row);
  });
  formatHeaderRow(sheet);
}

function appendRowFromJson(sheet, item) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => item[h] !== undefined ? item[h] : "");
  sheet.appendRow(row);
}

function updateMemberBalances(sheetAnggota, tx) {
  if (!sheetAnggota) return;
  const rows = sheetAnggota.getDataRange().getValues();
  const headers = rows[0];
  
  const idCol = headers.indexOf("id");
  const pokokCol = headers.indexOf("simpananPokok");
  const wajibCol = headers.indexOf("simpananWajib");
  const sukarelaCol = headers.indexOf("simpananSukarela");
  const loanCol = headers.indexOf("loanBalance");
  const interestCol = headers.indexOf("totalInterestPaid");
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol].toString() === tx.memberId.toString()) {
      const rowNum = i + 1;
      
      if (tx.type === "simpanan_pokok" && pokokCol !== -1) {
        const val = Number(rows[i][pokokCol]) + Number(tx.amount);
        sheetAnggota.getRange(rowNum, pokokCol + 1).setValue(val);
      } else if (tx.type === "simpanan_wajib" && wajibCol !== -1) {
        const val = Number(rows[i][wajibCol]) + Number(tx.amount);
        sheetAnggota.getRange(rowNum, wajibCol + 1).setValue(val);
      } else if (tx.type === "simpanan_sukarela" && sukarelaCol !== -1) {
        const val = Number(rows[i][sukarelaCol]) + Number(tx.amount);
        sheetAnggota.getRange(rowNum, sukarelaCol + 1).setValue(val);
      } else if (tx.type === "tarik_simpanan" && sukarelaCol !== -1) {
        const val = Math.max(0, Number(rows[i][sukarelaCol]) - Number(tx.amount));
        sheetAnggota.getRange(rowNum, sukarelaCol + 1).setValue(val);
      } else if (tx.type === "pinjaman_baru" && loanCol !== -1) {
        const val = Number(rows[i][loanCol]) + Number(tx.amount);
        sheetAnggota.getRange(rowNum, loanCol + 1).setValue(val);
      } else if (tx.type === "bayar_cicilan" && loanCol !== -1) {
        const val = Math.max(0, Number(rows[i][loanCol]) - Number(tx.amount));
        sheetAnggota.getRange(rowNum, loanCol + 1).setValue(val);
        
        if (tx.interestAmount && interestCol !== -1) {
          const intVal = Number(rows[i][interestCol]) + Number(tx.interestAmount);
          sheetAnggota.getRange(rowNum, interestCol + 1).setValue(intVal);
        }
      }
      break;
    }
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
