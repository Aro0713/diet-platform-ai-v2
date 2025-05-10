import React from "react";  // ⬅️ to sprawia, że plik jest modułem
import { useState } from "react";
import { Meal } from "../types";


interface DietGridEditorProps {
  editableDiet: Record<string, Meal[]>;
  setEditableDiet: (diet: Record<string, Meal[]>) => void;
  setConfirmedDiet: (meals: Meal[]) => void;
}

const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const mealOrder = ["Śniadanie", "Lunch", "Obiad", "Podwieczorek", "Kolacja"];

export const DietGridEditor = ({
  editableDiet,
  setEditableDiet,
  setConfirmedDiet,
}: DietGridEditorProps) => {
  const [saveMessage, setSaveMessage] = useState("");

  const handleChange = (
    day: string,
    mealName: string,
    field: keyof Meal,
    value: string | number
  ) => {
    const meals = editableDiet[day] || [];
    const mealIndex = meals.findIndex((m) => m.name === mealName);
    if (mealIndex === -1) return;

    const updatedMeal = { ...meals[mealIndex], [field]: value };
    const updatedDay = [...meals];
    updatedDay[mealIndex] = updatedMeal;

    setEditableDiet({ ...editableDiet, [day]: updatedDay });
  };

  const handleSave = () => {
    const allMeals = Object.values(editableDiet).flat();
    setConfirmedDiet(allMeals);
    setSaveMessage("✅ Zapisano zmiany");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border table-fixed">
        <thead>
          <tr>
            <th className="border p-2 w-28">🍽️ Posiłek</th>
            {days.map((day) => (
              <th key={day} className="border p-2 text-center">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mealOrder.map((mealName) => (
            <tr key={mealName}>
              <td className="border p-2 font-semibold">{mealName}</td>
              {days.map((day) => {
                const meal = (editableDiet[day] || []).find(
                  (m) => m.name === mealName
                );
                if (!meal) {
                  return (
                    <td
                      key={`${day}-${mealName}`}
                      className="border p-1 italic text-gray-400"
                    >
                      Brak
                    </td>
                  );
                }

                return (
                  <td key={`${day}-${mealName}`} className="border p-1">
                    <div className="space-y-1">
                      <input
                        className="w-full border px-1 py-0.5 rounded"
                        value={meal.name}
                        onChange={(e) =>
                          handleChange(day, mealName, "name", e.target.value)
                        }
                      />
                      <input
                        className="w-full border px-1 py-0.5 rounded"
                        value={meal.calories}
                        type="number"
                        onChange={(e) =>
                          handleChange(
                            day,
                            mealName,
                            "calories",
                            Number(e.target.value)
                          )
                        }
                        placeholder="kcal"
                      />
                      <input
                        className="w-full border px-1 py-0.5 rounded"
                        value={meal.glycemicIndex}
                        type="number"
                        onChange={(e) =>
                          handleChange(
                            day,
                            mealName,
                            "glycemicIndex",
                            Number(e.target.value)
                          )
                        }
                        placeholder="IG"
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          💾 Zapisz zmiany
        </button>
        {saveMessage && (
          <p className="ml-4 text-green-700 font-semibold">{saveMessage}</p>
        )}
      </div>
    </div>
  );
};

export default DietGridEditor;

