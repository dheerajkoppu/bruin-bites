import { useState, useEffect } from "react";
import { Link } from "react-router";

function Home() {
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    fetch("/api/halls")
      .then((response) => response.json())
      .then((data) => setHalls(data))
      .catch((error) => console.log(error));
  }, []);

  return (
    <div>
      <h1>Dining Halls</h1>
      <p>Choose a dining hall to see its menu.</p>

      {halls.map((hall) => (
        <div key={hall}>
          <Link to ={"/halls/" + encodeURIComponent(hall)}>
            {hall}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default Home;
