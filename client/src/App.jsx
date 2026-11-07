import { Routes, Route } from "react-router";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import Hall from "./pages/Hall.jsx";
import Search from "./pages/Search.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Dish from "./pages/Dish.jsx";

function App() {
  return (
    <AuthProvider>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/halls/:hallName" element={<Hall />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dishes/:id" element={<Dish />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
