
import { useState, useEffect } from "react";
import { useParams } from "react-router";

function Hall() {
  const { hallName } = useParams();
  const [dishes, setDishes] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState("all");

  useEffect(() => {
    setSelectedDiet("all");

    fetch("/api/halls/" + encodeURIComponent(hallName) + "/dishes")
      .then((response) => response.json())
      .then((data) => setDishes(data))
      .catch((error) => console.log(error));
  }, [hallName]);

  let visibleDishes = [];

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];

    if (selectedDiet === "all") {
      visibleDishes.push(dish);
    } else if (selectedDiet === "vegetarian" && dish.vegetarian) {
      visibleDishes.push(dish);
    } else if (selectedDiet === "vegan" && dish.vegan) {
      visibleDishes.push(dish);
    } else if (selectedDiet === "glutenFree" && dish.glutenFree) {
      visibleDishes.push(dish);
    }
  }

  return (
    <div>
      <h1>{hallName}</h1>

      <label htmlFor="diet">Filter by diet: </label>
      <select
        id="diet"
        value={selectedDiet}
        onChange={(event) => setSelectedDiet(event.target.value)}
      >
        <option value="all">All dishes</option>
        <option value="vegetarian">Vegetarian</option>
        <option value="vegan">Vegan</option>
        <option value="glutenFree">Gluten Free</option>
      </select>

      <h2>Dishes</h2>

      {visibleDishes.length === 0 && (
        <p>No dishes match this filter.</p>
      )}

      {visibleDishes.map((dish) => (
        <div key={dish._id}>
          <h3>{dish.name}</h3>

          {dish.vegetarian && <p>Vegetarian</p>}
          {dish.vegan && <p>Vegan</p>}
          {dish.glutenFree && <p>Gluten Free</p>}
        </div>
      ))}
    </div>
  );
}

export default Hall;
