import { diseaseTestsMap, TestDefinition } from '../lib/diseaseTestsMap';


// Mapa badań przypisanych do chorób
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
    <div className="my-4">
      <label className="block mb-2 font-semibold">Wyniki badań pacjenta</label>

      {selectedTests.map((condition) => (
        <div key={condition} className="border p-4 mb-4 rounded shadow-sm bg-white">
          <h3 className="font-bold mb-2">{condition}</h3>

          {(testsByCondition[condition] || ["Opis choroby"]).map((testName) => (
            <div key={testName} className="mb-2">
              <label className="block text-sm mb-1">{testName}</label>
              <input
                type="text"
                value={testResults[testName] || ''}
                onChange={(e) => handleResultChange(testName, e.target.value)}
                className="w-full p-2 border rounded"
                placeholder={`Wpisz wynik badania: ${testName}`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TestResultsForm;
