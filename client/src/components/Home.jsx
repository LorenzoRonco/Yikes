import React from "react";
import NavHeader from "./NavHeader";
import { Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { useState } from "react";
import API from "../API/API.mjs";
import dayjs from "dayjs";


function Home(props) {
  return (
    <>
      <Row className="text-center my-5">
        <Col>
          <h1 style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: '4rem', color: '#E45341' }}>Welcome to Yikes!</h1>
          <p className="lead text-secondary">
            Your luck is just a click away! 🎲
          </p>
        </Col>
      </Row>
      <Row>
       <Col> {!props.user ? <NotLoggedInHome /> : <LoggedInHome user={props.user} />}
      <HowItWorks /></Col>
      </Row>
      
    </>
  );
}

function LoggedInHome(props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // it will be used to show a loading state while the game is being created
  //and to disable the buttons

  const handleNewGame = async () => {
    setLoading(true);
    try {
      const { game, initialCards } = await API.createGame({
        userId: props.user.id,
        startedAt: dayjs().toISOString(),
        correctGuesses: 0,
        status: "ongoing",
      });

      navigate(`/games/${game.id}`, {
        state: { game, initialCards },
      });
    } catch (err) {
      alert("Error during creation of the game" + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-3 text-warning fs-5 fw-semibold">
        Welcome back, {props.user.name}! Ready to challenge your luck?
      </div>
      <button
        onClick={handleNewGame}
        className="d-block mx-auto"
        style={{
          padding: "12px 28px",
          fontSize: "1.25rem",
          borderRadius: "10px",
          backgroundColor: "#57b8d4",
          borderColor: "#57b8d4",
          boxShadow: '0 4px 8px rgb(228 83 65 / 0.4)',
          fontWeight: '700',
        }}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="bi bi-hourglass-split me-2"></i> Creating...
          </>
        ) : (
          <>
            <i className="bi bi-lightning-fill me-2"></i> New Game
          </>
        )}
      </button>
    </>
  );
}

function NotLoggedInHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNewDemoGame = async () => {
    setLoading(true);
    try {
      const { initialCards, newCard } = await API.createDemoGame();

      navigate(`/games/demo`, {
        state: { initialCards, newCard },
      });
    } catch (err) {
      alert("Error during creation of the demo game" + err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="mb-3 text-warning fs-5 fw-semibold">
        Login to start a new game, or just try a demo game now!
      </div>
      <button
        onClick={handleNewDemoGame}
        className="d-block mx-auto"
        style={{
          padding: "12px 28px",
          fontSize: "1.25rem",
          borderRadius: "10px",
          backgroundColor: "#57b8d4",
          borderColor: "#57b8d4",
          boxShadow: '0 4px 8px rgb(228 83 65 / 0.4)',
          fontWeight: '700',
        }}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="bi bi-hourglass-split me-2"></i> Creating...
          </>
        ) : (
          <>
            <i className="bi bi-lightning-fill me-2"></i> New Demo Game
          </>
        )}
      </button>
    </>
  );
}

function HowItWorks() {
  return (
    <section className="mt-5">
      <h2 className="text-center mb-4" style={{ fontWeight: '700', color: '#E45341' }}>
        How it works
      </h2>
      <Row>
        <Col md={4} className="text-center mb-3">
          <i className="bi bi-play-btn-fill fs-1 mb-2" style={{ color: '#E45341' }}></i>
          <h5>Create a game</h5>
          <p>Start a new game and get your initial cards.</p>
        </Col>
        <Col md={4} className="text-center mb-3">
          <i className="bi bi-person-raised-hand fs-1 mb-2" style={{ color: '#E45341' }}></i>
          <h5>Make your guesses</h5>
          <p>Try to guess correctly and collect points.</p>
        </Col>
        <Col md={4} className="text-center mb-3">
          <i className="bi bi-trophy-fill fs-1 mb-2" style={{ color: '#E45341' }}></i>
          <h5>Win the game</h5>
          <p>Earn 3 cards to win!</p>
        </Col>
      </Row>
    </section>
  );
}

export default Home;
