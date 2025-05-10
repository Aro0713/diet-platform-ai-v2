import { useState, FC } from 'react'

type Ingredient = {
  product: string
  weight: number
}

type Meal = {
  name: string
  ingredients: Ingredient[]
  calories: number
  glycemicIndex: number
}

interface Props {
  initial: Meal[]
  onSave: (updated: Meal[]) => void
}

const DietEditor: FC<Props> = ({ initial, onSave }) => {
  const [diet, setDiet] = useState<Meal[]>(initial)

  const handleIngredientChange = (
    mealIndex: number,
    ingredientIndex: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const updated = [...diet]
    const ing = { ...updated[mealIndex].ingredients[ingredientIndex] }

    if (field === 'product' && typeof value === 'string') {
      ing.product = value
    } else if (field === 'weight' && typeof value === 'number') {
      ing.weight = value
    }

    updated[mealIndex].ingredients[ingredientIndex] = ing
    setDiet(updated)
  }

  const updateMealCalories = (mealIndex: number, calories: number) => {
    const updated = [...diet]
    updated[mealIndex].calories = calories
    setDiet(updated)
  }

  const applyMockCalories = (mealIndex: number) => {
    const sum = diet[mealIndex].ingredients.reduce((acc, i) => acc + i.weight * 2, 0)
    updateMealCalories(mealIndex, Math.round(sum))
  }

  return (
    <div className='bg-white p-6 rounded shadow max-w-4xl space-y-8'>
      <h2 className='text-xl font-semibold'>Edytuj jadłospis pacjenta</h2>

      {diet.map((meal, mealIndex) => (
        <div key={mealIndex} className='border-b pb-6'>
          <h3 className='text-lg font-bold mb-2'>{meal.name}</h3>

          {meal.ingredients.map((ingredient, ingredientIndex) => (
            <div key={ingredientIndex} className='grid grid-cols-2 gap-4 mb-2'>
              <input
                type='text'
                className='border px-2 py-1'
                value={ingredient.product}
                onChange={(e) =>
                  handleIngredientChange(mealIndex, ingredientIndex, 'product', e.target.value)
                }
              />
              <input
                type='number'
                className='border px-2 py-1'
                value={ingredient.weight}
                onChange={(e) =>
                  handleIngredientChange(mealIndex, ingredientIndex, 'weight', Number(e.target.value))
                }
              />
            </div>
          ))}

          <div className='text-sm text-gray-600 mb-2'>
            Całkowita masa posiłku:{' '}
            <strong>
              {meal.ingredients.reduce((sum, i) => sum + i.weight, 0)} g
            </strong>
          </div>

          <div className='text-sm text-gray-600 mb-2'>
            Kalorie: <strong>{meal.calories}</strong> kcal &nbsp;|&nbsp; Indeks glikemiczny:{' '}
            <strong>{meal.glycemicIndex}</strong>
          </div>

          <button
            onClick={() => applyMockCalories(mealIndex)}
            className='text-sm text-blue-500 underline mt-1'
          >
            Przelicz kalorie automatycznie
          </button>
        </div>
      ))}

      <button
        onClick={() => onSave(diet)}
        className='bg-green-600 text-white px-4 py-2 rounded'
      >
        Zatwierdź i zapisz dietę
      </button>
    </div>
  )
}

export default DietEditor
