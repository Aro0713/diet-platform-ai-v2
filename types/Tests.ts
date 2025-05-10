export interface LabTest {
  name: string;
  unit: string;
  normalRange: string;
}

export const standardTests: LabTest[] = [
  {
    name: "Glukoza",
    unit: "mg/dl",
    normalRange: "70–99"
  },
  {
    name: "Insulina",
    unit: "µIU/ml",
    normalRange: "2–25"
  },
  {
    name: "Lipidogram",
    unit: "-",
    normalRange: "zależne od frakcji (LDL < 115, HDL > 40/50, TG < 150)"
  },
  {
    name: "Morfologia",
    unit: "-",
    normalRange: "w zależności od parametru (np. Hb, RBC, WBC)"
  },
  {
    name: "TSH",
    unit: "µIU/ml",
    normalRange: "0.27–4.2"
  },
  {
    name: "ALT",
    unit: "U/l",
    normalRange: "do 35 (kobiety), do 50 (mężczyźni)"
  },
  {
    name: "Kreatynina",
    unit: "mg/dl",
    normalRange: "0.6–1.3"
  }
];
