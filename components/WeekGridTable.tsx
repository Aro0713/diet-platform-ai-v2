import React from "react";

interface Meal {
  menu: string;
}

interface DayPlan {
  [mealName: string]: Meal;
}

interface DietPlan {
  [dayName: string]: DayPlan;
}

interface Props {
  diet: DietPlan;
}

const polishDays: Record<string, string> = {
  Monday: "Poniedziałek",
  Tuesday: "Wtorek",
  Wednesday: "Środa",
  Thursday: "Czwartek",
  Friday: "Piątek",
  Saturday: "Sobota",
  Sunday: "Niedziela",
};

const mealOrder = ["Śniadanie", "II śniadanie", "Obiad", "Kolacja"];

export default function WeekGridTable({ diet }: Props) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr>
          <th style={{ border: "1px solid #ccc", padding: "4px" }}>Dzień</th>
          {mealOrder.map((meal) => (
            <th key={meal} style={{ border: "1px solid #ccc", padding: "4px" }}>{meal}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(diet).map(([day, meals]) => (
          <tr key={day}>
            <td style={{ border: "1px solid #ccc", padding: "4px", fontWeight: "bold" }}>
              {polishDays[day] || day}
            </td>
            {mealOrder.map((meal) => (
              <td key={meal} style={{ border: "1px solid #ccc", padding: "4px" }}>
                {meals?.[meal]?.menu || "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
