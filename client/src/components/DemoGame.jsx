import React, { useState, useEffect, Fragment } from "react";
import { useLocation, useNavigate } from "react-router";
import { Card, Button, Container, Row, Col, Spinner, ProgressBar } from "react-bootstrap";
import API from "../API/API.mjs";
import 'bootstrap/dist/css/bootstrap.min.css';

function DemoGame({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [initialCards, setInitialCards] = useState(location.state?.initialCards || []);
    const [newCard, setNewCard] = useState(location.state?.newCard || null);
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showFeedback, setShowFeedback] = useState(false);
    const [lastGuessCorrect, setLastGuessCorrect] = useState(null);
    const [lastGuessCard, setLastGuessCard] = useState(null);
    const [lastHand, setLastHand] = useState(null);
    const [gameFinished, setGameFinished] = useState(false);

    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [wasTimeout, setWasTimeout] = useState(false);

    useEffect(() => {
        if (!timerActive) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === 1) {
                    clearInterval(interval);
                    setTimerActive(false);
                    handleTimeout();
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive]);

    const startTimer = () => {
        setTimeLeft(30);
        setTimerActive(true);
    };

    const handleStartGame = () => {
        setStarted(true);
        startTimer();
    };

    const handleTimeout = async () => {
        setWasTimeout(true);
        try {
            const card = await API.getCard(newCard.id);
            setLastGuessCard(card);
            setLastGuessCorrect(false);
            setShowFeedback(true);
            setGameFinished(true);
        } catch (err) {
            setError("Errore durante il timeout.");
        }
    };

    const handleInsertCard = async (index, initialCards, newCard) => {
        setTimerActive(false);
        try {
            const guessCard = await API.getCard(newCard.id);
            const isCorrect = await API.evaluateDemoGame(initialCards, guessCard, index);

            let updatedHand = [...initialCards];

            if (isCorrect) {
                updatedHand.splice(index, 0, guessCard);
                updatedHand.sort((a, b) => a.misfortune - b.misfortune);
                setInitialCards(updatedHand);
            }

            setLastGuessCorrect(isCorrect);
            setLastGuessCard(guessCard);
            setLastHand(isCorrect ? updatedHand : initialCards);
            setShowFeedback(true);
            setGameFinished(true);
        } catch (err) {
            setError("Errore durante la valutazione.");
        }
    };

    const handleHomeButton = () => {
        navigate("/");
    };

    const handleInsertCardWrapper = (index) => {
        handleInsertCard(index, initialCards, newCard);
    };

    const restartDemoGame = async () => {
        setLoading(true);
        setError(null);
        try {
            const { initialCards, newCard } = await API.createDemoGame();

            setInitialCards(initialCards);
            setNewCard(newCard);
            setStarted(false);
            setShowFeedback(false);
            setLastGuessCard(null);
            setLastGuessCorrect(null);
            setLastHand(null);
            setGameFinished(false);
            setWasTimeout(false);
            setTimeLeft(30);
            setTimerActive(false);
        } catch (err) {
            setError("Errore durante il riavvio della demo.");
        } finally {
            setLoading(false);
        }
    };

    if (!started) {
        return (
            <Container className="text-center mt-5">
                {error && <div className="text-danger mb-3">{error}</div>}
                <Button onClick={handleStartGame} variant="primary" size="lg" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : "Inizia il gioco demo"}
                </Button>
            </Container>
        );
    }

    if (showFeedback) {
        return (
            <FeedbackSection
                lastGuessCorrect={lastGuessCorrect}
                wasTimeout={wasTimeout}
                lastGuessCard={lastGuessCard}
                lastHand={lastHand || initialCards}
                gameFinished={gameFinished}
                handleHomeButton={handleHomeButton}
                handleRestartDemo={restartDemoGame}
            />
        );
    }

    return (
        <Container>
            <h2 className="my-4">Demo Game</h2>

            {newCard && <NewCardSection newCard={newCard} />}

            <div className="mb-3">
                <h5 className="text-danger mb-1">Tempo rimasto:</h5>
                <ProgressBar
                    animated
                    variant={timeLeft > 10 ? "primary" : "danger"}
                    now={(timeLeft / 30) * 100}
                    label={`${timeLeft}s`}
                />
            </div>

            <PlayerHand initialCards={initialCards} handleInsertCard={handleInsertCardWrapper} />
        </Container>
    );
}

function PlayerHand({ initialCards, handleInsertCard }) {
    const sorted = [...initialCards].sort((a, b) => a.misfortune - b.misfortune);
    return (
        <>
            <h4>Mano del giocatore</h4>
            <Row className="flex-nowrap overflow-auto">
                <Col xs="auto">
                    <Button variant="outline-primary" onClick={() => handleInsertCard(0)}>Inserisci qui</Button>
                </Col>
                {sorted.map((card, idx) => (
                    <Fragment key={card.id}>
                        <Col xs="auto">
                            <Card style={{ width: "12rem" }}>
                                <Card.Img variant="top" src={API.SERVER_URL + card.imageUrl} />
                                <Card.Body>
                                    <Card.Title style={{ fontSize: "0.9rem" }}>{card.title}</Card.Title>
                                    <Card.Text>Misfortune: {card.misfortune}</Card.Text>
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
                        <Card.Img variant="top" src={API.SERVER_URL + newCard.imageUrl} />
                        <Card.Body>
                            <Card.Title>{newCard.title}</Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
}

function FeedbackSection({ lastGuessCorrect, wasTimeout, lastGuessCard, lastHand, gameFinished, handleHomeButton, handleRestartDemo }) {
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
                <Card.Img variant="top" src={API.SERVER_URL + lastGuessCard.imageUrl} />
                <Card.Body>
                    <Card.Title>{lastGuessCard.title}</Card.Title>
                    <Card.Text>Misfortune: {lastGuessCard.misfortune}</Card.Text>
                </Card.Body>
            </Card>

            <h5 className="mt-4">La tua mano finale:</h5>
            <Row className="justify-content-center">
                {[...lastHand]
                    .sort((a, b) => a.misfortune - b.misfortune)
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

            <Button variant="success" onClick={handleHomeButton} className="me-2">
                Torna alla Home
            </Button>

            <Button variant="primary" onClick={handleRestartDemo}>
                Prova un'altra demo
            </Button>
        </Container>
    );
}

export default DemoGame;