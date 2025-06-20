import React from "react";
import {
  View,
  Text,
  StyleSheet
} from "@react-pdf/renderer";

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
  Sunday: "Niedziela"
};

const mealOrder = ["Śniadanie", "II śniadanie", "Obiad", "Kolacja"];

const styles = StyleSheet.create({
  table: {
  width: "100%",
  borderStyle: "solid",
  borderColor: "#ccc",
  borderWidth: 1,
  marginTop: 10,
  flexDirection: "column"
},
  row: {
    flexDirection: "row"
  },
  header: {
    backgroundColor: "#eee",
    fontWeight: "bold"
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 4,
    fontSize: 9,
    flexGrow: 1
  },
  firstCell: {
    fontWeight: "bold",
    backgroundColor: "#f9f9f9"
  }
});

export default function WeekGridTablePdf({ diet }: Props) {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.header]}>
        <Text style={styles.cell}>Dzień</Text>
        {mealOrder.map((meal) => (
          <Text key={meal} style={styles.cell}>{meal}</Text>
        ))}
      </View>
      {Object.entries(diet).map(([day, meals]) => (
        <View key={day} style={styles.row}>
          <Text style={[styles.cell, styles.firstCell]}>
            {polishDays[day] || day}
          </Text>
          {mealOrder.map((meal) => (
            <Text key={meal} style={styles.cell}>
              {meals?.[meal]?.menu || "-"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
