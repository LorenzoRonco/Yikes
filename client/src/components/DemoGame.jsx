import { useState, useEffect, Fragment } from "react";
import { useLocation, useNavigate } from "react-router";
import { PlayerHand, NewCardSection } from "./GameComponents";
import { Card, Button, Container, Row, Col, Spinner, ProgressBar } from "react-bootstrap";
import API from "../API/API.mjs";
import 'bootstrap/dist/css/bootstrap.min.css';

function DemoGame() {
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
        }, 1000); //set interval updates every 1000 ms = 1 s
        return () => clearInterval(interval);
    }, [timerActive]); //handleTimeout is not inserted cause it dependes from card.id, so it would be updated everytime it changes

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
            setError("Error during timeout");
        }
    };

    const handleInsertCard = async (index, initialCards, newCard) => {
        setTimerActive(false); //switchOff the timer
        try {
            const guessCard = await API.getCard(newCard.id);
            const isCorrect = await API.evaluateDemoGame(initialCards, guessCard, index);

            let updatedHand = [...initialCards];

            if (isCorrect) {
                updatedHand.splice(index, 0, guessCard); //put guessCard in the hand
                updatedHand.sort((a, b) => a.misfortune - b.misfortune); //sort by misfortune
                setInitialCards(updatedHand);
            }

            setLastGuessCorrect(isCorrect);
            setLastGuessCard(guessCard);
            setLastHand(isCorrect ? updatedHand : initialCards);
            setShowFeedback(true);
            setGameFinished(true);
        } catch (err) {
            setError("Error during validation.");
        }
    };

    const handleHomeButton = () => {
        navigate("/");
    };

    const handleInsertCardWrapper = (index) => { //needed because when I would call handleInsertCard, I have only the index,
        //while it needs other 2 parameters (taken from the context)
        handleInsertCard(index, initialCards, newCard);
    };

    const restartDemoGame = async () => {
        setLoading(true);
        setError(null);
        try {
            const { initialCards, newCard } = await API.createDemoGame();

            //reset of the variables
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
            setError("Error during demo restart");
        } finally {
            setLoading(false);
        }
    };

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
                    {loading ? <Spinner animation="border" size="sm" /> : "Start demo game"}
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
            <h2 className="my-4 " style={{ fontWeight: '700', color: '#E45341' }}>Demo game</h2>


            {newCard && <NewCardSection newCard={newCard} />}

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

            <PlayerHand initialCards={initialCards} handleInsertCard={handleInsertCardWrapper} />
        </Container>
    );
}

function FeedbackSection({ lastGuessCorrect, wasTimeout, lastGuessCard, lastHand, handleHomeButton, handleRestartDemo }) {
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
                    {lastGuessCorrect ? 
                        <Card.Subtitle className="fw-bold text-dark text-center">Misfortune: {lastGuessCard.misfortune}</Card.Subtitle>
                        :
                        <Card.Subtitle></Card.Subtitle>
                    }
                </Card.Body>
            </Card>

            <h5 className="mt-4">Your final hand:</h5>
            <Row className="justify-content-center">
                {[...lastHand]
                    .sort((a, b) => a.misfortune - b.misfortune)
                    .map((card) => (
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
                        </Fragment>
                    ))}
            </Row>

            <Button variant="primary" className="me-3" onClick={handleHomeButton}
                style={{
                    padding: "10px 26px",
                    fontSize: "1.25rem",
                    borderRadius: "10px",
                    backgroundColor: "#feb871",
                    borderColor: "#feb871",
                    boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
                    fontWeight: '700',
                }}>Home</Button>

            <Button variant="success" className="ms-3" onClick={handleRestartDemo}
                style={{
                    padding: "10px 26px",
                    fontSize: "1.25rem",
                    borderRadius: "10px",
                    backgroundColor: "#57b8d4",
                    borderColor: "#57b8d4",
                    boxShadow: '0 4px 8px rgb(23 162 184 / 0.4)',
                    fontWeight: '700',
                }}>New Demo</Button>
        </Container>
    );
}

function GameInstructions() { //not created as a separate component since it's slighty different from the GamePage one
    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>🃏 How the Game Works</Card.Title>
                <Card.Text>
                    You start with <strong>3 random misfortune cards</strong>.<br />
                    In this demo, you will play only <strong>1 round</strong>.<br />
                    You'll receive a <strong>new situation</strong> (image and title only).<br />
                    Your task is to <strong>guess where it fits</strong> among your current cards based on its hidden badness value (1–100).
                </Card.Text>
                <Card.Text>
                    <span className="text-success">✅ Correct guess</span>: you get the new card.<br />
                    <span className="text-danger">❌ Wrong guess or timeout</span>: you lose the round.
                </Card.Text>
            </Card.Body>
        </Card>
    );
}



export default DemoGame;