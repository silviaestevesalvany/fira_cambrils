/**
 * Totselecta · Fira Cambrils
 * Rep els contactes de l'app i els afegeix al full
 * "Recogida datos leads fira Cambrils".
 *
 * Columnes: A Nom restaurant | B Nom client | C Poblacio | D Telefon |
 *           E email | F interes | G Notes | H Data (s'afegeix automàticament)
 */

var SPREADSHEET_ID = "1PDFywzyahZY8KtYgIkO6AYODFpKIfUNh43R0zCxbVv4";
var SHEET_NAME = ""; // buit = primera pestanya del full
var TOKEN = "totselecta-fira-cambrils"; // ha de coincidir amb config.js

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var lead = JSON.parse(e.postData.contents);
    if (lead.token !== TOKEN) return json({ ok: false, error: "Token no vàlid" });
    if (!lead.restaurant) return json({ ok: false, error: "Falta el nom del restaurant" });

    lock.waitLock(20000);

    // Evita duplicats si l'app reenvia el mateix contacte
    var cache = CacheService.getScriptCache();
    if (lead.id && cache.get(lead.id)) return json({ ok: true, duplicate: true });

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];

    if (!sheet.getRange("H1").getValue()) sheet.getRange("H1").setValue("Data");

    var when = lead.data ? new Date(lead.data) : new Date();
    sheet.appendRow([
      text(lead.restaurant),
      text(lead.client),
      text(lead.poblacio),
      lead.telefon ? "'" + lead.telefon : "",
      text(lead.email),
      text(lead.interes),
      text(lead.notes),
      Utilities.formatDate(when, "Europe/Madrid", "dd/MM/yyyy HH:mm")
    ]);

    if (lead.id) cache.put(lead.id, "1", 21600);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Per comprovar ràpidament que el desplegament funciona obrint la URL al navegador
function doGet() {
  return json({ ok: true, app: "Totselecta Fira Cambrils" });
}

// Desa sempre com a text (manté el "+" dels telèfons i evita fórmules)
function text(v) {
  v = v == null ? "" : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
