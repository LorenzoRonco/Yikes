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
      <Row>
        <Col>
          <h1>Welcome to Yikes!</h1>
        </Col>
      </Row>
      {!props.user ? <NotLoggedInHome /> : <LoggedInHome user={props.user} />}
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
      <Row className="mt-3">
        <Col>
          <div className="alert alert-success">
            Welcome back, {props.user.name}! You can start a new game clicking
            the button below.
          </div>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <button
            onClick={handleNewGame}
            className="btn btn-info"
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              color: "white",
              backgroundColor: "#17a2b8",
            }}
            disabled={loading}
          >
            {loading ? "Creating..." : "New Game"}
          </button>
        </Col>
      </Row>
    </>
  );
}

function NotLoggedInHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNewDemoGame = async () => {
    setLoading(true);
    try {
      const { initialCards, newCard  } = await API.createDemoGame();

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
      <Row className="mt-3">
        <Col>
          <div className="alert alert-warning">
            Login to start a new game, or just start a demo game with the button
            below!
          </div>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <button
            onClick={handleNewDemoGame}
            className="btn btn-info"
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              color: "white",
              backgroundColor: "#17a2b8",
            }}
            disabled={loading}
          >
            {loading ? "Creating..." : "New Demo Game"}
          </button>
        </Col>
      </Row>
    </>
  );
}

export default Home;
