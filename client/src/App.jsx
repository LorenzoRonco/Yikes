import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import Home from "./components/Home";
import DefaultLayout from "./components/DefaultLayout";
import { Routes, Route, Navigate } from "react-router";
import { LoginForm } from "./components/AuthComponents";
import DemoGame from "./components/DemoGame";
import NotFound from "./components/NotFound";
import API from "./API/API.mjs";
import GamePage from "./components/GamePage";
import ProfilePage from "./components/ProfilePage";
import "./App.css"


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch {
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setUser(user);
    } catch (err) {
      setMessage({ msg: err, type: "danger" });
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
    //setMessage({ msg: "Logout effettuato!", type: "success" });
  };

  return (
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} user={user} message={message} setMessage={setMessage} />}>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/games/:gameId" element={<GamePage user={user}/>}></Route>
        <Route path="/games/demo" element={<DemoGame user={user}/>}></Route>
        <Route path="/profile" element={loggedIn ? <ProfilePage user={user}/> : <Navigate replace to="/" />}></Route> {/* if user not logged id, redirect him to the home*/}
      </Route>
      <Route path="/login" element={loggedIn ? (<Navigate replace to="/" />) : (<LoginForm handleLogin={handleLogin} />)} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
