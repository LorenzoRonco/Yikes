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
}, [gameId]);  // <-- ogni volta che cambia gameId, resetta tutto


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
    setWasTimeout(true); // <-- QUI

    try {
      const result = await API.updateRound(gameId, roundCount, null); // indice nullo
      setLastGuessCorrect(result.correct);
      setLastGuessCard(result.guessCard);
      setLastHand(result.hand);

      const updatedGame = await API.updateGame(gameId);
      setGame(updatedGame);
      setGameStatus(updatedGame.status);

      setShowFeedback(true);
    } catch (err) {
      setError("Errore durante la valutazione automatica.");
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
      setError("Errore durante la creazione del primo round.");
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

      // lascia decidere a handleNextRound cosa fare dopo
      setShowFeedback(true);
    } catch (err) {
      setError("Errore durante la valutazione.");
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
        setInitialCards(lastHand); // aggiorna la mano con quella aggiornata
        setRoundCount(nextRound);
        setWasTimeout(false);
        setShowFeedback(false); // chiude il feedback
        startTimer();
      }
      // ❗ se lo status è "won" o "lost", NON fare nulla: la schermata verrà mostrata automaticamente
    } catch (err) {
      setError("Errore durante l'avanzamento al prossimo round.");
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
      setError("Errore durante la creazione della nuova partita.");
    } finally {
      setLoadingNewGame(false);
    }
  };


  if (!game) return <div>Loading game...</div>;

  if (!started) {
    return (
      <Container className="text-center mt-5">
        {error && <div className="text-danger mb-3">{error}</div>}
        <Button onClick={handleStartGame} variant="primary" size="lg" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Inizia il gioco"}
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
      <h2 className="my-4">Game #{game.id}</h2>

      {newCard && (
        <>
          <NewCardSection newCard={newCard} />
        </>
      )}
      <div className="mb-3">
        <h5 className="text-danger mb-1">Tempo rimasto:</h5>
        <ProgressBar
          animated
          variant={timeLeft > 10 ? "primary" : "danger"}
          now={(timeLeft / 30) * 100}
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
      <h4>Mano del giocatore</h4>
      <Row className="flex-nowrap overflow-auto">
        <Col xs="auto">
          <Button variant="outline-primary" onClick={() => handleInsertCard(0)}>Inserisci qui</Button>
        </Col>

        {initialCards
          .sort((c1, c2) => c1.misfortune - c2.misfortune)
          .map((card, idx) => (
            <Fragment key={card.id}>
              <Col xs="auto">
                <Card style={{ width: "12rem" }}>
                  <Card.Img
                    variant="top"
                    src={API.SERVER_URL + card.imageUrl}
                    alt={card.title}
                    style={{ height: "150px", objectFit: "cover" }}
                  />
                  <Card.Body>
                    <Card.Title style={{ fontSize: "0.9rem" }}>
                      {card.title} <br /> misfortune: {card.misfortune}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="auto">
                <Button variant="outline-primary" onClick={() => handleInsertCard(idx + 1)}>
                  Inserisci qui
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
      <h4>Nuova Carta</h4>
      <Row className="mb-4">
        <Col xs={12} md={4}>
          <Card>
            <Card.Img variant="top" src={API.SERVER_URL + newCard.imageUrl} alt={newCard.title} />
            <Card.Body>
              <Card.Title>{newCard.title}</Card.Title>
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
      <h3>
        {lastGuessCorrect
          ? "Hai indovinato!"
          : wasTimeout
            ? "Tempo scaduto!"
            : "Ordine errato!"}
      </h3>

      <Card style={{ width: "18rem", margin: "20px auto" }}>
        <Card.Img variant="top" src={API.SERVER_URL + lastGuessCard.imageUrl} alt={lastGuessCard.title} />
        <Card.Body>
          <Card.Title>{lastGuessCard.title}</Card.Title>
          <Card.Text>Misfortune: {lastGuessCard.misfortune}</Card.Text>
        </Card.Body>
      </Card>
      <Button onClick={handleNextRound} variant="primary" size="lg" disabled={loading}>
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
        {gameStatus === "won" ? "Hai vinto!" : "Hai perso!"}
      </h2>
      <h5 className="my-4">Le tue carte:</h5>
      <Row className="justify-content-center">
        {lastHand
          .sort((c1, c2) => c1.misfortune - c2.misfortune)
          .map((card) => (
            <Col xs="auto" key={card.id} className="mb-3">
              <Card style={{ width: "12rem" }}>
                <Card.Img variant="top" src={API.SERVER_URL + card.imageUrl} />
                <Card.Body>
                  <Card.Title style={{ fontSize: "0.9rem" }}>{card.title}</Card.Title>
                  <Card.Text>Misfortune: {card.misfortune}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
      <div className="mt-4">
        <Button variant="primary" className="me-3" onClick={() => window.location.href = "/"}>Torna alla Home</Button>
        <Button variant="success" onClick={handleNewGame} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Nuova Partita"}
        </Button>
      </div>
    </Container>
  );
}

export default GamePage;

