import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";

function Hall() {
  const { hallName } = useParams();
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    fetch("/api/halls/" + encodeURIComponent(hallName) + "/dishes")
      .then((response) => response.json())
      .then((data) => setDishes(data))
      .catch((error) => console.log(error));
  }, [hallName]);

  return (
    <div>
      <h1>{hallName}</h1>
      <h2>Dishes</h2>

      {dishes.map((dish) => (
        <div key={dish._id}>
          <h3>
            <Link to={"/dishes/" + dish._id}>
              {dish.name}
            </Link>
          </h3>

          {dish.vegetarian && <p>Vegetarian</p>}
          {dish.vegan && <p>Vegan</p>}
          {dish.glutenFree && <p>Gluten Free</p>}
        </div>
      ))}
    </div>
  );
}

export default Hall;
