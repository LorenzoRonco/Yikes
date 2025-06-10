import { useLocation, useParams } from "react-router";
import { useEffect, useState } from "react";
import { Card, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import API from "../API/API.mjs";


function GamePage() {
  const { gameId } = useParams();
  const location = useLocation();

  const [game, setGame] = useState(location.state?.game || null);
  const [initialCards, setInitialCards] = useState(location.state?.initialCards || []);
  const [started, setStarted] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roundCount, setRoundCount] = useState(1); // Per tenere traccia del round corrente

  useEffect(() => {
    if (!game) {
      // Fetch game e carte se necessario
    }
  }, [game]);

  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const card = await API.createRound(gameId, { roundId: roundCount }); // Es. roundId 1, modifica se serve
      setNewCard(card);
      setStarted(true);
    } catch (err) {
      setError("Errore durante l'estrazione della carta.");
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

  return (
    <Container>
      <h2 className="my-4">Game #{game.id}</h2>

      {/* RIGA CON LA NUOVA CARTA */}
      {newCard && (
        <>
          <h4>Nuova Carta</h4>
          <Row className="mb-4">
            <Col xs={12} md={4}>
              <Card>
                <Card.Img variant="top" src={API.SERVER_URL+newCard.imageUrl} alt={newCard.title} />
                <Card.Body>
                  <Card.Title>{newCard.title}</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* CARTE INIZIALI 
      //TODO: devi rifarlo anche quando la carta viene indovinata perchè sarà aggiunta alla mano */}
      
      <h4>Mano del giocatore</h4>
      <Row>
        {initialCards.sort((c1,c2) => c1.misfortune-c2.misfortune).map((card) => (
          <Col key={card.id} xs={12} md={4} className="mb-3">
            <Card>
              <Card.Img variant="top" src={API.SERVER_URL+card.imageUrl} alt={card.title} />
              <Card.Body>
                <Card.Title>{card.title} - misfortune: {card.misfortune}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default GamePage;
