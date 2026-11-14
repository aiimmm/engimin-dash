/**
 * ============================================================================
 * GOOGLE APPS SCRIPT — User Login Logger Webhook
 * ============================================================================
 *
 * Kolom Sheet:
 * [No, ID, Name, Username, Email, Password, Pwd, Last Login, IP Address]
 *
 * PETUNJUK PEMASANGAN:
 * 1. Buka Google Sheets baru / yang sudah ada di akun Google Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus kode default (jika ada), lalu copy-paste seluruh isi file ini ke editor Apps Script.
 * 4. Klik tombol 'Save' (Simpan / Ctrl+S).
 * 5. Klik tombol 'Deploy' (Terapkan) berwarna biru di kanan atas > pilih 'New deployment' (Penerapan baru).
 * 6. Klik ikon roda gigi (Select type) > pilih 'Web app' (Aplikasi web).
 * 7. Isi konfigurasi:
 *    - Description: "Login Logger"
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING agar Next.js bisa mengirim data tanpa login Google
 * 8. Klik 'Deploy'. Berikan izin (Authorize access) jika Google meminta.
 * 9. Salin "Web app URL" yang berakhiran /exec (contoh: https://script.google.com/macros/s/.../exec).
 * 10. Masukkan URL tersebut ke file .env.local aplikasi Anda:
 *     USER_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/XXXXX/exec"
 */

// MODE PENYIMPANAN:
// "UPSERT" -> Rekomendasi: Jika akun (ID / Username / Email) sudah ada di tabel, update barisnya. Jika belum ada, tambah baris baru.
// "APPEND" -> Audit Log: Selalu tambahkan baris baru ke paling bawah setiap kali login berhasil.
var MODE = "UPSERT";

// NAMA TAB SHEET:
// Kosongkan ("") untuk memakai Sheet aktif pertama, atau isi nama tab misal "User Logins"
var SHEET_NAME = "";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci proses selama maksimal 10 detik untuk mencegah tumpang tindih request konkuren
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No payload received" }, 400);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ status: "error", message: "Invalid JSON format" }, 400);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME || "Logins");
    }

    var headers = [
      "No",
      "ID",
      "Name",
      "Username",
      "Email",
      "Password",
      "Pwd",
      "Last Login",
      "IP Address",
    ];

    // Inisialisasi header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1E293B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    var id = String(data.id || data._id || "").trim();
    var name = String(data.name || "").trim();
    var username = String(data.username || data.usr || "").trim();
    var email = String(data.email || "").trim();
    var password = String(data.password || "");
    var pwd = String(data.pwd || "").trim();
    var lastLogin = String(
      data.lastLogin ||
        data.lastlogin ||
        data["last login"] ||
        Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy, HH:mm:ss"),
    );
    var ipAddress = String(data.ipAddress || data.ip || data["ip address"] || "-").trim();

    var isUpdated = false;
    var targetRow = -1;

    if (MODE === "UPSERT" && sheet.getLastRow() > 1) {
      var lastRow = sheet.getLastRow();
      var dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

      for (var i = 0; i < dataRange.length; i++) {
        var existingId = String(dataRange[i][1] || "").trim();
        var existingUsername = String(dataRange[i][3] || "")
          .trim()
          .toLowerCase();
        var existingEmail = String(dataRange[i][4] || "")
          .trim()
          .toLowerCase();

        var matchId = id && existingId && existingId === id;
        var matchUser = username && existingUsername && existingUsername === username.toLowerCase();
        var matchEmail = email && existingEmail && existingEmail === email.toLowerCase();

        if (matchId || matchUser || matchEmail) {
          targetRow = i + 2; // +2 karena indeks array 0-based dan row 1 adalah header
          break;
        }
      }
    }

    if (targetRow > 1) {
      // UPDATE baris yang sudah ada (kolom ID sampai IP Address, kolom No tetap tidak berubah)
      var updateRange = sheet.getRange(targetRow, 2, 1, 8);
      updateRange.setValues([
        ["'" + id, name, username, email, "'" + password, "'" + pwd, lastLogin, ipAddress],
      ]);
      isUpdated = true;
    } else {
      // APPEND baris baru
      var nextNo = Math.max(1, sheet.getLastRow()); // Baris ke-2 menjadi No. 1, baris ke-3 No. 2, dst.
      var newRow = [
        nextNo,
        "'" + id,
        name,
        username,
        email,
        "'" + password,
        "'" + pwd,
        lastLogin,
        ipAddress,
      ];
      sheet.appendRow(newRow);
    }

    return jsonResponse({
      status: "success",
      action: isUpdated ? "updated" : "inserted",
      user: username || email,
      lastLogin: lastLogin,
    });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return jsonResponse({
    status: "ok",
    message: "Google Apps Script Login Logger Webhook is running active.",
  });
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
