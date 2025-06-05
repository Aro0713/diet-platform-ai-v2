'use client';

import PanelCard from './PanelCard';

export const testsByCondition: { [key: string]: string[] } = {
  "Cukrzyca typu 2": ["HbA1c", "Glukoza na czczo", "Insulina"],
  "Cukrzyca typu 1": ["HbA1c", "Glukoza na czczo"],
  "Nadciśnienie tętnicze": ["Ciśnienie krwi", "Profil lipidowy"],
  "Miażdżyca": ["Cholesterol całkowity", "LDL", "HDL", "Trójglicerydy"],
  "Otyłość": ["BMI", "Obwód pasa"],
  "Insulinooporność": ["Insulina", "Glukoza", "HOMA-IR"],
  "Rak jelita grubego": ["Kolonoskopia – opis", "CEA"],
  "Rak żołądka": ["Gastroskopia – opis", "CA19-9"],
  "Choroby nerek": ["Kreatynina", "eGFR", "Białko w moczu"],
  "Choroby wątroby": ["AST", "ALT", "Bilirubina", "USG wątroby – opis"],
  "Anemia niedoborowa": ["Hemoglobina", "MCV", "Ferrytyna"],
  "PCOS": ["Testosteron", "DHEA-S", "USG jajników – opis"],
  "Łuszczyca (nasilenie przy złej diecie)": ["Opis stanu skóry"],
  "Atopowe zapalenie skóry (AZS)": ["Opis zmian skórnych"],
  "Depresja": ["Skala depresji – opis (np. PHQ-9)"],
  "Migreny": ["Opis kliniczny migren"],
  "Zespół metaboliczny": ["Obwód pasa", "Glukoza", "Lipidogram"],
  "Choroby pasożytnicze (parazytozy)": ["Wynik badania pasożyta – opis"],
  // Dla chorób bez przypisanych badań możemy pokazywać ogólny opis:
  "Kamica nerkowa": ["Opis badania USG lub wyniku laboratoryjnego"],
  "Przewlekła choroba nerek (PChN)": ["Kreatynina", "eGFR", "Białko w moczu"],
  "Hiperlipidemia (wysoki cholesterol, triglicerydy)": ["Cholesterol całkowity", "LDL", "HDL", "Trójglicerydy"],
  "Zaburzenia pracy tarczycy: niedoczynność, nadczynność": ["TSH", "FT3", "FT4"],
  "Choroba niedokrwienna serca (choroba wieńcowa)": ["EKG – opis", "Troponina", "Profil lipidowy"],
  "Zawał mięśnia sercowego": ["EKG – opis", "Troponina"],
  "Udary mózgu (niedokrwienne)": ["CT głowy – opis", "MRI mózgu – opis"],
  "Niewydolność serca": ["Frakcja wyrzutowa LVEF", "NT-proBNP"],
  "Rak przełyku": ["Endoskopia – opis", "Biopsja – opis"],
  "Rak trzustki": ["CA19-9", "USG/MRI jamy brzusznej – opis"],
  "Rak wątroby": ["AFP (marker nowotworowy)", "USG wątroby – opis"],
  "Rak piersi": ["Mammografia – opis", "Biopsja piersi – opis"],
  "Rak prostaty": ["PSA", "Biopsja prostaty – opis"],
  "Rak jajnika": ["CA125", "USG ginekologiczne – opis"],
  "Choroby trzustki": ["Amylaza", "Lipaza", "USG trzustki – opis"],
  "Choroby pęcherzyka żółciowego (kamica żółciowa)": ["USG jamy brzusznej – opis"],
  "Zespół jelita drażliwego (IBS)": ["Rozpoznanie kliniczne – opis"],
  "Choroba uchyłkowa jelit": ["Kolonoskopia – opis"],
  "Zaparcia przewlekłe": ["Wywiad kliniczny – opis"],
  "Biegunki przewlekłe": ["Badania kału – opis"],
  "Nietolerancje pokarmowe": ["Testy alergiczne IgG/IgE", "Opis nietolerancji"],
  "Zapalenie żołądka": ["Gastroskopia – opis"],
  "Celiakia": ["Przeciwciała tTG", "Endoskopia – opis"],
  "Osteoporoza": ["Badanie densytometryczne (DEXA)"],
  "Osteopenia": ["Badanie densytometryczne (DEXA)"],
  "Choroba zwyrodnieniowa stawów": ["RTG stawów – opis"],
};

interface TestResultsFormProps {
  selectedTests: string[];
  testResults: { [key: string]: string };
  setTestResults: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const TestResultsForm: React.FC<TestResultsFormProps> = ({ selectedTests, testResults, setTestResults }) => {
  const handleResultChange = (testName: string, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [testName]: value
    }));
  };

  return (
    <PanelCard title="🧪 Wyniki badań" className="bg-[#0d1117] text-white border border-gray-600">
      {selectedTests.map((condition) => (
        <div key={condition} className="border border-gray-600 p-4 mb-4 rounded-md bg-[#1e293b]">
          <h3 className="font-semibold text-white mb-3">{condition}</h3>

          {(testsByCondition[condition] || ["Opis choroby"]).map((testName) => (
            <div key={testName} className="mb-3">
              <label className="block text-sm text-white mb-1">{testName}</label>
              <input
                type="text"
                value={testResults[testName] || ''}
                onChange={(e) => handleResultChange(testName, e.target.value)}
                placeholder={`Wpisz wynik: ${testName}`}
                className="w-full rounded-md px-3 py-2 bg-[#0f172a] text-white border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      ))}
    </PanelCard>
  );
};

export default TestResultsForm;
