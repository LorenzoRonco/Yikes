import React from "react";
import { useLocation, useParams } from "react-router";
import { useEffect, useState, Fragment } from "react";
import { Card, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import API from "../API/API.mjs";
import 'bootstrap/dist/css/bootstrap.min.css';

function GamePage() {
  const { gameId } = useParams();
  const location = useLocation();

  const [game, setGame] = useState(location.state?.game || null);
  const [initialCards, setInitialCards] = useState(location.state?.initialCards || []);
  const [started, setStarted] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roundCount, setRoundCount] = useState(1);

  // Nuovi stati per la schermata di feedback dopo il tentativo
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = useState(null);
  const [lastGuessCard, setLastGuessCard] = useState(null);
  const [lastHand, setLastHand] = useState(null);

  useEffect(() => {
    if (!game) {
      // fetch game e carte se necessario
    }
  }, [game]);

  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const card = await API.createRound(gameId, { roundId: roundCount });
      setNewCard(card);
      setStarted(true);
    } catch (err) {
      setError("Error during first round creation.");
    }
    setLoading(false);
  };

  const handleInsertCard = async (index) => {
    if (!newCard) return;

    setError(null);

    try {
      const result = await API.updateRound(gameId, roundCount, index);
      // result: { correct, hand, guessCard }

      // Mostra schermata feedback
      setLastGuessCorrect(result.correct);
      setLastGuessCard(result.guessCard);
      setLastHand(result.hand);
      setShowFeedback(true);

    } catch (err) {
      setError("Errror during guess evaluation.");
    }
  };

  const handleNextRound = async () => {
    setLoading(true);
    setError(null);
     const nextRound = roundCount + 1; //I cannot do directly SetRoundCount(roundCount + 1) because it will not be updated immediately
    try {
      
      console.log(roundCount)
      const card = await API.createRound(gameId, { roundId: nextRound });
      setNewCard(card);
      setInitialCards(lastHand); // update hand
      setRoundCount(nextRound);
      setShowFeedback(false);
    } catch (err) {
      setError("Error during next round creation.");
    }
    setLoading(false);
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

  // Schermata feedback dopo il tentativo
  if (showFeedback) {
    return (
      <Container className="text-center mt-5">
        <h3>{lastGuessCorrect ? "Hai indovinato!" : "Ordine errato!"}</h3>
        <Card style={{ width: "18rem", margin: "20px auto" }}>
          <Card.Img variant="top" src={API.SERVER_URL + lastGuessCard.imageUrl} alt={lastGuessCard.title} />
          <Card.Body>
            <Card.Title>{lastGuessCard.title}</Card.Title>
            <Card.Text>Misfortune: {lastGuessCard.misfortune}</Card.Text>
          </Card.Body>
        </Card>
        <Button onClick={handleNextRound} variant="primary" size="lg" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : `Round ${roundCount + 1}`}
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="my-4">Game #{game.id}</h2>

      {newCard && (
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
      )}

      <h4>Mano del giocatore</h4>
      {error && <div className="text-danger mb-3">{error}</div>}
      <Row className="flex-nowrap overflow-auto">
        {/* Bottone prima della prima carta */}
        <Col xs="auto">
          <Button variant="outline-primary" onClick={() => handleInsertCard(0)}>Inserisci qui</Button>
        </Col>

        {/* Alterna carta + bottone */}
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
    </Container>
  );
}

export default GamePage;
