import { useParams } from "react-router";

function Hall() {
  const { hallName } = useParams();

  return (
    <div>
      <h1>{hallName}</h1>
    </div>
  );
}

export default Hall;
