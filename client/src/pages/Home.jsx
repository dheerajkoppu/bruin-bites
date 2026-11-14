import { useState, useEffect } from "react";
import { Link } from "react-router";

// Photos from Wikimedia Commons, credited in the README
const hallPhotos = {
  "Bruin Plate": "/halls/bruin-plate.jpg",
  "De Neve": "/halls/de-neve.jpg",
  Epicuria: "/halls/epicuria.jpg",
  Feast: "/halls/feast.jpg",
};

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
      <p className="page-subtitle">Choose a dining hall to see its menu.</p>

      <div className="card-grid">
        {halls.map((hall) => (
          <Link
            key={hall}
            className="hall-card"
            to={"/halls/" + encodeURIComponent(hall)}
          >
            {hallPhotos[hall] && (
              <img className="hall-photo" src={hallPhotos[hall]} alt="" />
            )}
            <div className="hall-card-body">
              <span className="hall-name">{hall}</span>
              <span className="hall-cta">View menu →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
