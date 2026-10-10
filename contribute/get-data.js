async function fetchSheetData2() {
  const spreadsheetId = "1sVCmgprkNQLroXlowU-Rp0PlUySAFZ331x3H5t3VT7A";
  const sheetName = "posts";
  const url = `https://script.google.com/macros/s/AKfycbwEZj9RKrO2c502VHhL8OaznlZJtHTLl_pOXRMeqOs0BOUaBEf-OGsGBBj-0_YNazBo/exec?spreadsheetId=${spreadsheetId}&sheetName=${sheetName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur lors de l'appel à la Web App Google");
    return await response.json();
  } catch (error) {
    console.error("❌ Erreur fetchSheetData :", error);
    location.reload();
    return [];
  }
}
