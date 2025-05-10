import { useState } from "react";
import { useRouter } from "next/router";

export default function Interview() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.mealsPerDayDecision) {
    alert('⚠️ Lekarz musi określić liczbę posiłków w planie diety.');
    return;
  }
  try {
      const response = await fetch("/api/saveInterview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push("/patient-profile"); // zmienisz na odpowiednią stronę
      } else {
        console.error("Błąd podczas zapisywania wywiadu");
      }
    } catch (error) {
      console.error("Błąd:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Wywiad z Pacjentem</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* Sekcje zaczynają się tutaj */}

        {/* Dane podstawowe i cel wizyty */}
        <h2 className="text-xl font-semibold mb-4">Dane podstawowe i cel wizyty</h2>
        <TextArea label="Jakie są Pani/Pana oczekiwania względem współpracy dietetycznej?" name="expectations" handleChange={handleChange} />
        <TextArea label="Czy była Pani/Pan wcześniej na diecie? Jakie były efekty?" name="previousDiets" handleChange={handleChange} />
        <TextArea label="Czy obecnie korzysta Pani/Pan z jakiejkolwiek diety lub planu żywieniowego?" name="currentDiet" handleChange={handleChange} />
        <TextArea label="Czy ma Pani/Pan konkretne cele? (np. redukcja masy ciała, poprawa wyników, wsparcie w chorobie, przyrost masy mięśniowej)" name="goals" handleChange={handleChange} />

        {/* Stan zdrowia */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Stan zdrowia</h2>
        <TextArea label="Czy choruje Pani/Pan na jakiekolwiek choroby przewlekłe? (np. cukrzyca, nadciśnienie, choroby tarczycy, PCOS)" name="chronicDiseases" handleChange={handleChange} />
        <TextArea label="Czy były diagnozowane choroby dietozależne? (np. insulinooporność, hipercholesterolemia)" name="dietRelatedDiseases" handleChange={handleChange} />
        <TextArea label="Czy występują problemy żołądkowo-jelitowe? (wzdęcia, zaparcia, biegunki, refluks)" name="gastrointestinalIssues" handleChange={handleChange} />
        <TextArea label="Czy ma Pani/Pan alergie lub nietolerancje pokarmowe?" name="allergies" handleChange={handleChange} />
        <TextArea label="Czy przyjmuje Pani/Pan leki na stałe? Jakie?" name="medications" handleChange={handleChange} />
        <TextArea label="Czy stosuje Pani/Pan suplementy diety? Jakie i w jakich dawkach?" name="supplements" handleChange={handleChange} />
        <TextArea label="Czy były wykonywane ostatnio badania krwi? (jeśli tak, prośba o wyniki)" name="bloodTests" handleChange={handleChange} />
        <TextArea label="Jak wygląda Pani/Pana poziom stresu i jakość snu?" name="stressSleep" handleChange={handleChange} />
        <TextArea label="Czy występują choroby w rodzinie? (np. cukrzyca, nadciśnienie, nowotwory)" name="familyDiseases" handleChange={handleChange} />

        {/* Styl życia */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Styl życia</h2>
        <TextArea label="Jak wygląda Pani/Pana aktywność fizyczna? (rodzaj, częstotliwość, czas trwania)" name="physicalActivity" handleChange={handleChange} />
        <TextArea label="Jaki jest charakter pracy? (siedząca, fizyczna, zmianowa)" name="workType" handleChange={handleChange} />
        <TextArea label="Ile godzin dziennie Pani/Pan śpi? Czy sen jest regularny?" name="sleepHours" handleChange={handleChange} />
        <TextArea label="Jak wygląda poziom stresu na co dzień?" name="dailyStress" handleChange={handleChange} />
        <TextArea label="Czy pali Pani/Pan papierosy?" name="smoking" handleChange={handleChange} />
        <TextArea label="Czy spożywa Pani/Pan alkohol? Jak często i w jakiej ilości?" name="alcohol" handleChange={handleChange} />
        <TextArea label="Czy pije Pani/Pan kawę, herbatę, napoje energetyczne?" name="caffeineDrinks" handleChange={handleChange} />

        {/* Nawyki żywieniowe */}
<h2 className="text-xl font-semibold mt-10 mb-4">Nawyki żywieniowe</h2>
<TextArea label="Ile posiłków dziennie Pani/Pan spożywa?" name="mealsPerDay" handleChange={handleChange} />
<TextArea label="O jakich porach dnia najczęściej Pani/Pan je?" name="mealTimes" handleChange={handleChange} />
<TextArea label="Czy często pojawia się podjadanie między posiłkami?" name="snacking" handleChange={handleChange} />
<TextArea label="Czy spożywa Pani/Pan regularnie śniadania?" name="breakfast" handleChange={handleChange} />
<TextArea label="Jak często sięga Pani/Pan po słodycze, przekąski typu fast-food?" name="sweetsFastFood" handleChange={handleChange} />
<TextArea label="Ile wody Pani/Pan wypija dziennie? Jakie inne napoje są spożywane?" name="waterIntake" handleChange={handleChange} />
<TextArea label="Jak często spożywane są produkty takie jak: nabiał?" name="dairyFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywane są produkty takie jak: mięso i wędliny?" name="meatFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywane są produkty takie jak: ryby?" name="fishFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywane są produkty takie jak: warzywa i owoce?" name="fruitsVegetablesFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywane są produkty zbożowe? (jakie rodzaje?)" name="grainsFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywane są tłuszcze? (jakie źródła?)" name="fatsFrequency" handleChange={handleChange} />
<TextArea label="Jak często spożywa Pani/Pan żywność przetworzoną?" name="processedFoodsFrequency" handleChange={handleChange} />
<TextArea label="Czy gotuje Pani/Pan w domu, czy częściej jada 'na mieście'?" name="cookingHabits" handleChange={handleChange} />

{/* Preferencje i nietolerancje pokarmowe */}
<h2 className="text-xl font-semibold mt-10 mb-4">Preferencje i nietolerancje pokarmowe</h2>
<TextArea label="Jakie produkty Pani/Pan lubi najbardziej?" name="favoriteFoods" handleChange={handleChange} />
<TextArea label="Jakich produktów Pani/Pan nie toleruje lub nie lubi?" name="dislikedFoods" handleChange={handleChange} />
<TextArea label="Czy są produkty, które chciał(a)by Pani/Pan wykluczyć z diety? (np. mięso, gluten, laktoza)" name="excludedFoods" handleChange={handleChange} />
<TextArea label="Czy stosuje Pani/Pan dietę wegetariańską/wegańską lub inną specjalną?" name="specialDiet" handleChange={handleChange} />
<TextArea label="Jak wygląda apetyt w ciągu dnia? (zwiększony, zmniejszony, napady głodu)" name="appetite" handleChange={handleChange} />

{/* Historia masy ciała */}
<h2 className="text-xl font-semibold mt-10 mb-4">Historia masy ciała</h2>
<TextArea label="Jaka jest obecna masa ciała i wzrost?" name="currentWeightHeight" handleChange={handleChange} />
<TextArea label="Jaka była najwyższa i najniższa masa ciała w ostatnich latach?" name="weightHistory" handleChange={handleChange} />
<TextArea label="Czy waga waha się często?" name="weightFluctuations" handleChange={handleChange} />
<TextArea label="Czy w przeszłości stosował(a) Pani/Pan diety odchudzające lub inne restrykcyjne diety?" name="pastDiets" handleChange={handleChange} />
<TextArea label="Czy występują epizody objadania się?" name="bingeEating" handleChange={handleChange} />

{/* Problemy trawienne i jelitowe */}
<h2 className="text-xl font-semibold mt-10 mb-4">Problemy trawienne i jelitowe</h2>
<TextArea label="Czy często występują wzdęcia?" name="bloating" handleChange={handleChange} />
<TextArea label="Czy często występują zaparcia?" name="constipation" handleChange={handleChange} />
<TextArea label="Czy często występują biegunki?" name="diarrhea" handleChange={handleChange} />
<TextArea label="Czy często występuje refluks?" name="reflux" handleChange={handleChange} />
<TextArea label="Czy występują bóle brzucha po posiłkach?" name="stomachPainAfterMeals" handleChange={handleChange} />
<TextArea label="Jak często wypróżnia się Pani/Pan w ciągu dnia/tygodnia?" name="bowelMovementFrequency" handleChange={handleChange} />
<TextArea label="Czy były diagnozowane choroby jelit (IBS, SIBO, celiakia)?" name="bowelDiseases" handleChange={handleChange} />

{/* Kobiety – pytania dodatkowe */}
<h2 className="text-xl font-semibold mt-10 mb-4">Kobiety – pytania dodatkowe</h2>
<TextArea label="Czy cykle miesiączkowe są regularne?" name="menstrualCycleRegularity" handleChange={handleChange} />
<TextArea label="Czy występują dolegliwości hormonalne? (np. PCOS, endometrioza)" name="hormonalIssues" handleChange={handleChange} />
<TextArea label="Czy jest Pani w ciąży lub karmi piersią?" name="pregnancyOrBreastfeeding" handleChange={handleChange} />
<TextArea label="Czy stosuje Pani antykoncepcję hormonalną?" name="hormonalContraception" handleChange={handleChange} />

{/* Motywacja i możliwości */}
<h2 className="text-xl font-semibold mt-10 mb-4">Motywacja i możliwości</h2>
<TextArea label="Jak ocenia Pani/Pan swoją motywację do zmiany nawyków (w skali 1-10)?" name="motivationLevel" handleChange={handleChange} />
<TextArea label="Czy są jakieś bariery w realizacji diety? (np. brak czasu, praca zmianowa, brak umiejętności kulinarnych)" name="dietBarriers" handleChange={handleChange} />
<TextArea label="Ile czasu może Pani/Pan poświęcić na przygotowywanie posiłków?" name="timeForMealPreparation" handleChange={handleChange} />
<TextArea label="Czy ma Pani/Pan budżetowe ograniczenia dotyczące diety?" name="budgetConstraints" handleChange={handleChange} />

{/* Inne */}
<h2 className="text-xl font-semibold mt-10 mb-4">Inne</h2>
<TextArea label="Czy są produkty, które MUSZĄ się znaleźć w diecie?" name="mandatoryProducts" handleChange={handleChange} />
<TextArea label="Czy są jakieś okoliczności zdrowotne lub życiowe, które powinnam znać, układając dietę?" name="importantHealthConditions" handleChange={handleChange} />
<TextArea label="Czy jest coś, co szczególnie utrudniało Pani/Panu wcześniej utrzymanie zdrowej diety?" name="dietDifficulties" handleChange={handleChange} />
<TextArea label="Jakie leki aktualnie przyjmuje Pani/Pan?" name="currentMedications" handleChange={handleChange} />
<TextArea label="Jaką suplementację stosuje Pani/Pan?" name="currentSupplements" handleChange={handleChange} />

<h2 className="text-xl font-semibold mt-10 mb-4">Liczba posiłków w planie (ustala lekarz)</h2>
<div>
  <label className="block mb-2 font-medium">Ile posiłków powinien zawierać plan diety?</label>
  <select
    name="mealsPerDayDecision"
    onChange={(e) => setFormData({ ...formData, mealsPerDayDecision: Number(e.target.value) })}
    required
    className="w-full p-2 border rounded mb-4"
    value={formData.mealsPerDayDecision || ''}
  >
    <option value="" disabled>Wybierz...</option>
    <option value="3">3 posiłki</option>
    <option value="4">4 posiłki</option>
    <option value="5">5 posiłków</option>
  </select>
</div>

        {/* Przycisk zapisujący */}
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Zapisz wywiad
        </button>
      </form>
    </div>
  );
}

// Mały pomocniczy komponent dla textarea
function TextArea({ label, name, handleChange }: { label: string, name: string, handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <textarea
        name={name}
        onChange={handleChange}
        className="w-full p-2 border rounded mb-4"
        rows={3}
      />
    </div>
  );
}
