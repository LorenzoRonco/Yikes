import React from "react";
import { useLocation, useParams } from "react-router";
import { useEffect, useState, Fragment } from "react";
import { Card, Button, Container, Row, Col, Spinner, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import API from "../API/API.mjs";
import 'bootstrap/dist/css/bootstrap.min.css';

function GamePage(props) {
  const navigate = useNavigate();
  const { user } = props;
  const { gameId } = useParams();
  const location = useLocation();

  const [game, setGame] = useState(location.state?.game || null);
  const [initialCards, setInitialCards] = useState(location.state?.initialCards || []);
  const [started, setStarted] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roundCount, setRoundCount] = useState(1);

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = useState(null);
  const [lastGuessCard, setLastGuessCard] = useState(null);
  const [lastHand, setLastHand] = useState(null);
  const [gameStatus, setGameStatus] = useState("ongoing");

  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [wasTimeout, setWasTimeout] = useState(false);
  const [loadingNewGame, setLoadingNewGame] = useState(false);

  useEffect(() => {
    if (location.state?.game && location.state?.initialCards) {
      setGame(location.state.game);
      setInitialCards(location.state.initialCards);
      setGameStatus(location.state.game.status);
      setStarted(false);
      setNewCard(null);
      setRoundCount(1);
      setShowFeedback(false);
      setLastGuessCorrect(null);
      setLastGuessCard(null);
      setLastHand(null);
      setTimeLeft(30);
      setTimerActive(false);
      setWasTimeout(false);
      setError(null);
    }
  }, [gameId]);  // reset everything when gameId changes (to handle "New Game" from end game page)


  useEffect(() => {
    if (location.state?.game && !game) {
      setGame(location.state.game);
      setGameStatus(location.state.game.status);
    }

    if (location.state?.initialCards?.length > 0 && initialCards.length === 0) {
      setInitialCards(location.state.initialCards);
    }
  }, [location.state]);


  useEffect(() => {
    if (!timerActive) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          clearInterval(intervalId);
          setTimerActive(false);
          handleTimeout();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerActive]);

  const startTimer = () => {
    setTimeLeft(30);
    setTimerActive(true);
  };


  const handleTimeout = async () => {
    setError(null);
    setWasTimeout(true);

    try {
      const result = await API.updateRound(gameId, roundCount, null); //null index 'cause user didn't guessed
      setLastGuessCorrect(result.correct);
      setLastGuessCard(result.guessCard);
      setLastHand(result.hand);

      const updatedGame = await API.updateGame(gameId);
      setGame(updatedGame);
      setGameStatus(updatedGame.status);

      setShowFeedback(true);
    } catch (err) {
      setError("Error during round evaluation");
    }
  };


  useEffect(() => {
    return () => {
      setTimerActive(false);
    };
  }, []);


  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const card = await API.createRound(gameId, { roundId: roundCount });
      setNewCard(card);
      setStarted(true);
      startTimer();
    } catch (err) {
      setError("Error during creation of first round");
    }
    setLoading(false);
  };

  const handleInsertCard = async (index) => {
    setTimerActive(false);
    if (!newCard) return;

    setError(null);

    try {
      const result = await API.updateRound(gameId, roundCount, index);
      setLastGuessCorrect(result.correct);
      setLastGuessCard(result.guessCard);
      setLastHand(result.hand);

      setShowFeedback(true);
    } catch (err) {
      setError("Error during evaluation");
    }
  };

  const handleNextRound = async () => {
    setLoading(true);
    setError(null);
    const nextRound = roundCount + 1;

    try {
      const updatedGame = await API.updateGame(gameId);
      setGame(updatedGame);
      setGameStatus(updatedGame.status);

      if (updatedGame.status === "ongoing") {
        const card = await API.createRound(gameId, { roundId: nextRound });
        setNewCard(card);
        setInitialCards(lastHand); // update hand
        setRoundCount(nextRound);
        setWasTimeout(false);
        setShowFeedback(false); // close feedback
        startTimer();
      }
      // if the game is "won" or "lost" the end game page will be shown automatically
    } catch (err) {
      setError("Error during advancement to next round");
    }

    setLoading(false);
  };

  const handleNewGame = async () => {
    console.log(user)
    if (!user) {
      navigate("/");
      return;
    }

    setLoadingNewGame(true);
    try {
      const { game, initialCards } = await API.createGame({
        userId: user.id,
        startedAt: dayjs().toISOString(),
        correctGuesses: 0,
        status: "ongoing",
      });

      navigate(`/games/${game.id}`, {
        state: { game, initialCards },
      });
    } catch (err) {
      setError("Error during the creation of the new game");
    } finally {
      setLoadingNewGame(false);
    }
  };


  if (!game) return <div>Loading game...</div>;

  if (!started) {
    return (
      <Container className="text-center mt-5">
        <GameInstructions />
        {error && <div className="text-danger mb-3">{error}</div>}
        <Button onClick={handleStartGame} variant="primary" size="lg" disabled={loading}
          className="d-block mx-auto"
          style={{
            padding: "12px 28px",
            fontSize: "1.25rem",
            borderRadius: "10px",
            backgroundColor: "#57b8d4",
            borderColor: "#57b8d4",
            boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
            transition: 'background-color 0.3s ease',
            fontWeight: '700',
          }}
        >
          {loading ? <Spinner animation="border" size="sm" /> : "Start game"}
        </Button>
      </Container>
    );
  }

  if (gameStatus === "won" || gameStatus === "lost") {
    return (
      <FinalScreen
        gameStatus={gameStatus}
        lastHand={lastHand}
        handleNewGame={handleNewGame}
        loading={loadingNewGame}
      />
    );
  }

  if (showFeedback) {
    return (
      <FeedbackSection
        lastGuessCorrect={lastGuessCorrect}
        wasTimeout={wasTimeout}
        lastGuessCard={lastGuessCard}
        handleNextRound={handleNextRound}
        loading={loading}
        roundCount={roundCount}
        gameStatus={gameStatus}
      />
    );
  }


  return (
    <Container>
      <h2 className="my-4 " style={{ fontWeight: '700', color: '#E45341' }}>Round {roundCount}</h2>

      {newCard && (
        <>
          <NewCardSection newCard={newCard} />
        </>
      )}
      <div className="mb-4">
        <h5 className="text-danger mb-2 fw-semibold">
          <i className="bi bi-clock-fill me-2"></i>Time left:
        </h5>
        <ProgressBar
          animated
          striped
          variant={timeLeft > 10 ? "primary" : "danger"}
          now={(timeLeft / 30) * 100}
          style={{ height: '1.5rem', borderRadius: '1rem', fontWeight: '600', fontSize: '0.9rem' }}
          label={`${timeLeft}s`}
        />
      </div>

      <PlayerHand initialCards={initialCards} handleInsertCard={handleInsertCard} />
    </Container>
  );
}


function PlayerHand({ initialCards, handleInsertCard }) {
  return (
    <>
      <h4 style={{ fontWeight: '500', color: '#E45341' }}>Player's hand</h4>
      <Row className="flex-nowrap overflow-auto">
        <Col xs="auto" className="d-flex align-items-center">
          <Button
            style={{
              padding: "6px 16px",
              fontSize: "0.9rem",
              borderRadius: "8px",
              backgroundColor: "#57b8d4",
              borderColor: "#57b8d4",
              boxShadow: "0 3px 6px rgb(228 83 65 / 0.3)",
              fontWeight: "700",
              color: "white",
              whiteSpace: "nowrap",
              minWidth: "100px",
            }}
            variant="primary"
            onClick={() => handleInsertCard(0)}>Insert here</Button>
        </Col>

        {initialCards
          .sort((c1, c2) => c1.misfortune - c2.misfortune)
          .map((card, idx) => (
            <Fragment key={card.id}>
              <Col xs="auto">
                <Card
                  className="shadow rounded-4 overflow-hidden border-0 mb-3"
                  style={{ width: '15rem' }}
                >
                  <Card.Img
                    variant="top"
                    src={API.SERVER_URL + card.imageUrl}
                    alt={card.title}
                    style={{ height: '160px', objectFit: 'cover' }}
                  />
                  <Card.Body className="d-flex flex-column justify-content-between">
                    <Card.Title className="fw-bold text-dark text-center">{card.title}</Card.Title>
                    <Card.Subtitle className="fw-bold text-dark text-center">Misfortune: {card.misfortune}</Card.Subtitle>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="auto" className="d-flex align-items-center">
                <Button style={{
                  padding: "6px 16px",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  backgroundColor: "#57b8d4",
                  borderColor: "#57b8d4",
                  boxShadow: "0 3px 6px rgb(228 83 65 / 0.3)",
                  fontWeight: "700",
                  color: "white",
                  whiteSpace: "nowrap",
                  minWidth: "100px",
                }}
                  variant="primary" onClick={() => handleInsertCard(idx + 1)}>
                  Insert here
                </Button>
              </Col>
            </Fragment>
          ))}
      </Row>
    </>
  );
}

function NewCardSection({ newCard }) {
  if (!newCard) return null;
  return (
    <>
      <Row className="mb-4 justify-content-center">
        <Col xs={12} md={4} className="d-flex flex-column align-items-center">
          <h4 className="mb-3 text-center lead text-secondary">New Card</h4>
          <Card
            className="shadow rounded-4 overflow-hidden border-0 mb-3"
            style={{ width: '15rem' }}
          >
            <Card.Img
              variant="top"
              src={API.SERVER_URL + newCard.imageUrl}
              alt={newCard.title}
              style={{ height: '160px', objectFit: 'cover' }}
            />
            <Card.Body className="d-flex flex-column justify-content-between">
              <Card.Title className="fw-bold text-dark text-center">{newCard.title}</Card.Title>
              <Card.Subtitle className="fw-bold text-dark text-center">Misfortune: {newCard.misfortune}</Card.Subtitle>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}


function FeedbackSection({ lastGuessCorrect, wasTimeout, lastGuessCard, handleNextRound, loading, roundCount, gameStatus }) {
  return (
    <Container className="text-center mt-5">
      <h3 className={lastGuessCorrect ? "mb-3 text-success" : "mb-3 text-danger"}>
        {lastGuessCorrect
          ? "You guessed correctly! ✅"
          : wasTimeout
            ? "Time's over! ⏰"
            : "Wrong answer! ❌"}
      </h3>

      <Card className=" shadow rounded-4 overflow-hidden border-0 mb-3 mx-auto d-block"
        style={{ width: '15rem' }}>
        <Card.Img
          variant="top"
          src={API.SERVER_URL + lastGuessCard.imageUrl} alt={lastGuessCard.title}
          style={{ height: '160px', objectFit: 'cover' }} />
        <Card.Body className="d-flex flex-column justify-content-between">
          <Card.Title className="fw-bold text-dark text-center">{lastGuessCard.title}</Card.Title>
          <Card.Text>Misfortune: {lastGuessCard.misfortune}</Card.Text>
        </Card.Body>
      </Card>
      <Button onClick={handleNextRound} variant="primary" size="lg" disabled={loading}
        style={{
          padding: "12px 28px",
          fontSize: "1.25rem",
          borderRadius: "10px",
          backgroundColor: "#57b8d4",
          borderColor: "#57b8d4",
          boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
          fontWeight: '700',
        }}>
        {loading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          gameStatus === "ongoing" ? `Round ${roundCount + 1}` : "Final results"
        )}
      </Button>
    </Container>
  );
}

function FinalScreen({ gameStatus, lastHand, handleNewGame, loading }) {
  return (
    <Container className="text-center mt-5">
      <h2 className={gameStatus === "won" ? "text-success" : "text-danger"}>
        {gameStatus === "won" ? "You won! 🏆" : "You lost! 😕"}
      </h2>
      <h5 className="my-4 lead text-secondary">Your cards:</h5>
      <Row className="justify-content-center">
        {lastHand
          .sort((c1, c2) => c1.misfortune - c2.misfortune)
          .map((card) => (
            <Col xs="auto" key={card.id} className="mb-3">
              <Card className=" shadow rounded-4 overflow-hidden border-0 mb-3 mx-auto d-block"
                style={{ width: '12rem' }}>
                <Card.Img variant="top" src={API.SERVER_URL + card.imageUrl} alt={card.title}
                  style={{ height: '160px', objectFit: 'cover' }} />
                <Card.Body className="d-flex flex-column justify-content-between">
                  <Card.Title className="fw-bold text-dark text-center">{card.title}</Card.Title>
                  <Card.Text>Misfortune: {card.misfortune}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
      <div className="mt-4">
        <Button variant="primary" className="me-3" onClick={() => window.location.href = "/"}
          style={{
            padding: "10px 26px",
            fontSize: "1.25rem",
            borderRadius: "10px",
            backgroundColor: "#feb871",
            borderColor: "#feb871",
            boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
            fontWeight: '700',
          }}>Home</Button>
        <Button variant="success" className="ms-3" onClick={handleNewGame}
          style={{
            padding: "10px 26px",
            fontSize: "1.25rem",
            borderRadius: "10px",
            backgroundColor: "#57b8d4",
            borderColor: "#57b8d4",
            boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
            fontWeight: '700',
          }} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "New Game"}
        </Button>
      </div>
    </Container>
  );
}


function GameInstructions() {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>🃏 How the Game Works</Card.Title>
        <Card.Text>
          You start with <strong>3 random misfortune cards</strong>.<br />
          In each round, you'll get a <strong>new situation</strong> (image and title only).<br />
          Your task is to <strong>guess where it fits</strong> among your current cards based on its hidden misfortune value (1–100).
        </Card.Text>
        <Card.Text>
          <span className="text-success">✅ Correct guess</span>: you get the new card.<br />
          <span className="text-danger">❌ Wrong or timeout</span>: you lose the round.
        </Card.Text>
        <Card.Text>
          <strong>Win</strong> by collecting 6 cards.<br />
          <strong>Lose</strong> after 3 wrong guesses.
        </Card.Text>
      </Card.Body>
    </Card>
  );
}


export default GamePage;

