export type TestFieldType = 'number' | 'text' | 'select';

export interface TestDefinition {
  name: string;
  type: TestFieldType;
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
  placeholder?: string;
}

export interface DiseaseTestMap {
  [disease: string]: TestDefinition[];
}

export const diseaseGroups: { [group: string]: string[] } = {
  'Metaboliczne': ['Cukrzyca typu 2', 'Insulinooporność'],
  'Kardiologiczne': ['Nadciśnienie tętnicze', 'Choroba wieńcowa'],
  'Przewodu pokarmowego': ['Zespół jelita drażliwego', 'Celiakia'],
  'Nowotworowe': ['Rak jelita grubego'],
  'Skórne': ['Łuszczyca'],
  'Neurologiczne': ['Padaczka'],
  'Pasożytnicze': ['Toksoplazmoza'],
  'Niedobory': ['Niedobór żelaza', 'Niedobór witaminy D']
};

export const diseaseTestsMap: DiseaseTestMap = {
  'Cukrzyca typu 2': [
    { name: 'Glukoza na czczo', type: 'number', unit: 'mg/dl', min: 70, max: 125, placeholder: '70–125' },
    { name: 'HbA1c', type: 'number', unit: '%', min: 4, max: 14, placeholder: '4–14' }
  ],
  'Insulinooporność': [
    { name: 'Insulina na czczo', type: 'number', unit: 'µU/ml', min: 2, max: 25, placeholder: '2–25' },
    { name: 'Glukoza na czczo', type: 'number', unit: 'mg/dl', min: 70, max: 99, placeholder: '70–99' }
  ],
  'Nadciśnienie tętnicze': [
    { name: 'Ciśnienie krwi', type: 'text', placeholder: 'np. 120/80' }
  ],
  'Choroba wieńcowa': [
    { name: 'Cholesterol całkowity', type: 'number', unit: 'mg/dl', min: 100, max: 300, placeholder: '100–300' }
  ],
  'Zespół jelita drażliwego': [
    { name: 'Badanie kału', type: 'select', options: ['Prawidłowe', 'Nieprawidłowe', 'Nieoznaczone'] }
  ],
  'Celiakia': [
    { name: 'Przeciwciała anty-tTG', type: 'number', unit: 'U/ml', min: 0, max: 100, placeholder: '0–100' }
  ],
  'Niedobór żelaza': [
    { name: 'Ferrytyna', type: 'number', unit: 'ng/ml', min: 10, max: 300, placeholder: '10–300' }
  ],
  'Niedobór witaminy D': [
    { name: '25(OH)D', type: 'number', unit: 'ng/ml', min: 10, max: 100, placeholder: '10–100' }
  ]
};
