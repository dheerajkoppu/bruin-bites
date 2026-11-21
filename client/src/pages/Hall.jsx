
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";

function Hall() {
  const { hallName } = useParams();
  const [dishes, setDishes] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setSelectedDiet("all");
    setSearchText("");

    fetch("/api/halls/" + encodeURIComponent(hallName) + "/dishes")
      .then((response) => response.json())
      .then((data) => setDishes(data))
      .catch((error) => console.log(error));
  }, [hallName]);

  let visibleDishes = [];

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];

    if (!dish.name.toLowerCase().includes(searchText.trim().toLowerCase())) {
      continue;
    }

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

      <div className="filter-bar">
        <input
          type="search"
          className="filter-search"
          aria-label="Search this menu"
          placeholder={"Search " + hallName + "'s menu"}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <label htmlFor="diet" className="visually-hidden">Filter by diet:</label>
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
      </div>

      <h2>Dishes</h2>

      {visibleDishes.length === 0 && (
        <p className="empty-state">No dishes match your search or filter.</p>
      )}

      <div className="card-grid">
        {visibleDishes.map((dish) => (
          <div key={dish._id} className="dish-card">
            <h3>
              <Link to={"/dishes/" + dish._id}>
                {dish.name}
              </Link>
            </h3>

            <div className="tags">
              {dish.vegetarian && <span className="tag">Vegetarian</span>}
              {dish.vegan && <span className="tag">Vegan</span>}
              {dish.glutenFree && <span className="tag">Gluten Free</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Hall;
