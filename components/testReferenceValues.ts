export const testReferenceValues: { [key: string]: string } = {
  // === Cukrzyca
  "HbA1c": "4.0–5.6 %",
  "Glukoza": "70–99 mg/dL",
  "Insulina": "2–25 µIU/mL",
  "HOMA-IR": "< 2.5",

  // === Lipidy
  "Cholesterol całkowity": "< 200 mg/dL",
  "LDL": "< 100 mg/dL",
  "HDL": "> 40 mg/dL",
  "Trójglicerydy": "< 150 mg/dL",
  "Lipidogram": "LDL < 115 mg/dL, HDL > 40/50 mg/dL, TG < 150 mg/dL",

  // === Nerki
  "Kreatynina": "0.6–1.3 mg/dL",
  "eGFR": "> 90 mL/min/1.73m²",
  "Mocznik": "17–43 mg/dL",
  "Białko w moczu": "0–150 mg/d",
  "Badanie moczu": "Patrz wynik opisowy",

  // === Wątroba
  "AST": "0–40 U/L",
  "ALT": "0–40 U/L",
  "Bilirubina": "0.2–1.2 mg/dL",
  "Albumina": "3.4–5.4 g/dL",
  "Prealbumina": "15–35 mg/dL",
  "Panel wątrobowy": "Patrz wynik opisowy",

  // === Tarczyca
  "TSH": "0.4–4.0 mIU/L",
  "FT3": "2.0–4.4 pg/mL",
  "FT4": "0.9–1.7 ng/dL",
  "Anty-TPO": "< 34 IU/mL",
  "Anty-TG": "< 115 IU/mL",

  // === Elektrolity
  "Wapń": "8.5–10.5 mg/dL",
  "Fosfor": "2.5–4.5 mg/dL",
  "PTH": "10–65 pg/mL",
  "Sód (Na)": "135–145 mmol/L",
  "Potas (K)": "3.5–5.0 mmol/L",
  "Magnez (Mg)": "0.65–1.05 mmol/L",

  // === Hematologia
  "Morfologia": "Patrz pełny wynik",
  "MCV": "80–100 fL",
  "Ferrytyna": "30–400 ng/mL",
  "Żelazo": "60–170 µg/dL",
  "Żelazo (Fe) / ferrytyna": "wg płci/lab",
   "Witamina B12": "200–900 pg/mL",
  "Kwas foliowy": "2.7–17.0 ng/mL",
  "Witamina D3 [25(OH)D]": "30–50 ng/mL", 
  "Witamina K": "wg laboratorium",
  "Witamina A": "0.3–0.8 mg/L",
  "Witamina E": "5–20 mg/L",
  "Witamina C": "0.4–1.5 mg/dL",

  // === Onkologia
  "CEA": "< 5 ng/mL",
  "CA 19-9": "< 37 U/mL",
  "AFP": "< 10 ng/mL",
  "CA 72-4": "< 6 U/mL",
  "CA 15-3": "< 30 U/mL",
  "CA-125": "< 35 U/mL",
  "PSA": "< 4.0 ng/mL",

  // === Inne badania
  "CRP": "< 5 mg/L",
  "OB.": "do 20 mm/h (zależnie od wieku)",
  "Homocysteina": "< 15 µmol/L",
  "NT-proBNP": "< 125 pg/mL (<75 lat), < 450 pg/mL (>75 lat)",
  "Troponiny": "< 0.01 ng/mL",

  // === Badania obrazowe
  "USG jamy brzusznej": "Patrz opis badania",
  "USG nerek": "Patrz opis badania",
  "USG tarczycy": "Patrz opis badania",
  "USG trzustki": "Patrz opis badania",
  "USG ginekologiczne": "Patrz opis badania",
  "USG piersi": "Patrz opis badania",
  "Mammografia": "Patrz opis badania",
  "TK jamy brzusznej": "Patrz opis badania",
  "TK głowy": "Patrz opis badania",
  "MRI mózgu": "Patrz opis badania",
  "MRI mózgu i rdzenia kręgowego": "Patrz opis badania",
  "Gastroskopia": "Patrz opis badania",
  "Kolonoskopia": "Patrz opis badania",
  "Endoskopia": "Patrz opis badania",
  "Biopsja": "Patrz opis badania",
  "Biopsja piersi": "Patrz opis badania",
  "Biopsja prostaty": "Patrz opis badania",

  // === Testy alergiczne
  "IgE (alergie)": "do 100 IU/mL",
  "Testy alergiczne IgG/IgE": "Patrz interpretacja",
  "Testy skórne": "Patrz interpretacja",

  // === Inne
  "Badanie kału (pasożyty, krew utajona)": "Patrz wynik badania",
  "Kalprotektyna w kale": "< 50 µg/g",
  "Test wodorowy (laktoza, fruktoza)": "Patrz interpretacja",
  "Rozpoznanie kliniczne – opis": "Opis lekarza",
  "Skala depresji – opis (np. PHQ-9)": "Patrz opis",

  // === Nowe badania z KROKU 3
  "EEG": "Patrz opis badania",
  "Poziom leków przeciwpadaczkowych (wg stosowanego leku)": "wg zaleceń lekarza prowadzącego",
  "Testy funkcji motorycznych (UPDRS)": "Patrz wynik testu",
  "Spirometria": "FEV1/FVC wg norm wiekowych",
  "Gazometria krwi": "pH: 7.35–7.45, PaO2: 75–100 mmHg, PaCO2: 35–45 mmHg",
  "Elastaza w kale": "> 200 µg/g kału",
  "Holter EKG": "Patrz opis badania",
  "Krzywa cukrowa (OGTT)": "na czczo 70–99 mg/dL, po 2h < 140 mg/dL",
  "Krzywa insulinowa": "wg interpretacji laboratorium",
  "Kortyzol": "rano: 5–25 µg/dL, wieczorem: 2–9 µg/dL",
  "ACTH": "7–63 pg/mL",
  "Fenyloalanina we krwi": "2–6 mg/dL (u osób leczonych)",
  "Tyrozyna we krwi": "0.8–1.5 mg/dL",
  "Galaktoza we krwi": "< 10 mg/dL",
  "Aktywność GALT": "14–24 U/g Hb",

  // === Zespół krótkiego jelita (SBS)
  "Długość czynnego jelita (cm)": "np. 80–200",
  "Resekcja zastawki krętniczo-kątniczej": "tak / nie",
  "Objętość stolca / doby (ml)": "np. <1000 ml/d (cel)",
  "Nawodnienie – liczba mikcji / doby": "docelowo ≥4",
  "Masa ciała / 7 dni (trend)": "np. +/– kg/tydz."
};
