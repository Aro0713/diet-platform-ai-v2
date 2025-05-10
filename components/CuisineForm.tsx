import React from "react";

interface Props {
  selectedCuisine: string;
  setSelectedCuisine: (value: string) => void;
}

const SelectCuisineForm = ({ selectedCuisine, setSelectedCuisine }: Props) => {
  return (
    <select
      className="border px-2 py-1 rounded w-full"
      value={selectedCuisine}
      onChange={(e) => setSelectedCuisine(e.target.value)}
    >
      <option value="">Wybierz kuchnię</option>
      <option value="polska">Polska</option>
      <option value="śródziemnomorska">Śródziemnomorska</option>
      <option value="japońska">Japońska</option>
      <option value="indyjska">Indyjska</option>
      <option value="meksykańska">Meksykańska</option>
      <option value="wegańska">Wegańska</option>
    </select>
  );
};

export default SelectCuisineForm;
