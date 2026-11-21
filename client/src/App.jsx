import { Routes, Route } from "react-router";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import Hall from "./pages/Hall.jsx";
import Search from "./pages/Search.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import FriendProfile from "./pages/FriendProfile.jsx";

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
          <Route path="/users/:username" element={<FriendProfile />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
