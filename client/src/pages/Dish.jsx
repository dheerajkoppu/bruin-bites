import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth.js";
import CompareDishes from "../components/CompareDishes.jsx";
import WantToTry from "../components/WantToTry.jsx";

function Dish() {
  const { id } = useParams();
  return <DishDetails key={id} id={id} />;
}

function DishDetails({ id }) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [dish, setDish] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoInput = useRef(null);

  function clearPhoto() {
    setPhoto(null);
    setPhotoError("");
    setUploadError("");
    if (photoInput.current) photoInput.current.value = "";
  }

  function selectPhoto(event) {
    const file = event.target.files[0];
    setPhoto(null);
    setUploadError("");
    setPhotoError("");
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Photo must be a JPG or PNG.");
    } else if (file.size >= 5 * 1024 * 1024) {
      setPhotoError("Photo must be under 5 MB.");
    } else {
      setPhoto(file);
    }
  }

  async function uploadPhoto() {
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("photo", photo);
      const response = await fetch(`/api/dishes/${id}/photos`, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not upload your photo.");
      }
      const data = await response.json();
      setDish((current) => ({ ...current, photos: [data.photo, ...(current.photos || [])] }));
      clearPhoto();
      setMessage("Rating and photo saved!");
    } catch (error) {
      setUploadError(`Your rating was saved, but the photo was not uploaded. ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function finishRating(badges = []) {
    setEarnedBadges(badges);
    setMessage("Rating saved!");
    if (photo) await uploadPhoto();
    setSelectedGroup(null);
  }

  useEffect(() => {
  let ignore = false;

  async function loadDish() {
    setDish(null);
    setError("");

    try {
      const response = await fetch("/api/dishes/" + id);

      if (!response.ok) {
        if (!ignore) {
          setError("Could not find this dish.");
        }
        return;
      }

      const data = await response.json();

      if (!ignore) {
        setDish(data);
      }
    } catch {
      if (!ignore) {
        setError("Could not load this dish.");
      }
    }
  }

  loadDish();

  return () => {
    ignore = true;
  };
}, [id]);

  function startRating(group) {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setMessage("");
    setEarnedBadges([]);
    setSelectedGroup(group);
  }

  if (error !== "") {
    return <p role="alert">{error}</p>;
  }

  if (dish === null) {
    return <p>Loading dish...</p>;
  }

  const ratingDisabled = isLoading || selectedGroup !== null || uploading || photoError !== "" || uploadError !== "";

  return (
    <div>
      <h1>{dish.name}</h1>

      <p>{dish.hall}</p>

      {dish.vegetarian && <p>Vegetarian</p>}
      {dish.vegan && <p>Vegan</p>}
      {dish.glutenFree && <p>Gluten Free</p>}

      {user ? (
        <WantToTry key={user._id || user.email} dish={dish} />
      ) : (
        <button type="button" disabled={isLoading} onClick={() => navigate("/login")}>
          Save to Want to Try
        </button>
      )}

      <h2>Rate this dish</h2>

      {user && (
        <div className="rating-photo">
          <label htmlFor="rating-photo">Add a photo (optional)</label>
          <p id="photo-help">JPG or PNG, under 5 MB.</p>
          <input
            ref={photoInput}
            id="rating-photo"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            aria-describedby="photo-help"
            aria-invalid={photoError !== ""}
            disabled={selectedGroup !== null || uploading}
            onChange={selectPhoto}
          />
          {(photo || photoError || uploadError) && (
            <button type="button" disabled={selectedGroup !== null || uploading} onClick={clearPhoto}>
              Remove photo
            </button>
          )}
          {photoError && <p className="form-error" role="alert">{photoError}</p>}
          {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
          {uploadError && <button type="button" disabled={uploading} onClick={uploadPhoto}>Retry photo upload</button>}
          {uploading && <p role="status">Uploading photo…</p>}
        </div>
      )}

      <button
        disabled={ratingDisabled}
        onClick={() => startRating("liked")}
      >
        Liked it
      </button>

      <button
        disabled={ratingDisabled}
        onClick={() => startRating("fine")}
      >
        It was fine
      </button>

      <button
        disabled={ratingDisabled}
        onClick={() => startRating("disliked")}
      >
        Didn't like it
      </button>

      {selectedGroup !== null && (
        <CompareDishes
          dish={dish}
          group={selectedGroup}
          username={user?.username}
          onDone={finishRating}
        />
      )}

      {message !== "" && <p role="status">{message}</p>}
      {earnedBadges.length > 0 && (
        <p role="status">You earned {earnedBadges.map((badge) => `"${badge.name}"`).join(" and ")}!</p>
      )}

      <section aria-labelledby="dish-photos-heading">
        <h2 id="dish-photos-heading">Dish photos</h2>
        {dish.photos?.length ? (
          <div className="dish-photos">
            {dish.photos.map((photo, index) => (
              <a key={photo._id} href={photo.url}>
                <img src={photo.url} alt={`${dish.name} photo ${index + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        ) : <p>No photos yet.</p>}
      </section>

    </div>
  );
}

export default Dish;
