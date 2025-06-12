import { useEffect, useState } from "react";
import { Container, Card, Row, Col, ListGroup, Badge, Spinner } from "react-bootstrap";
import API from "../API/API.mjs"; // assicurati che il path sia corretto

function ProfilePage({ user }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Statistiche
    const [gameStats, setGameStats] = useState({
        gamesWon: 0,
        gamesLost: 0,
        totalGames: 0,
        roundsWon: 0,
        roundsLost: 0,
        totalRounds: 0,
    });

    useEffect(() => {
        if (!user?.id) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const history = await API.getGamesHistory(user.id);
                setGames(history);

                // Calcolo statistiche
                const gamesWon = history.filter(g => g.status === "won").length;
                const gamesLost = history.filter(g => g.status === "lost").length;
                const totalGames = history.length;

                let roundsWon = 0;
                let roundsLost = 0;

                history.forEach(game => {
                    game.rounds?.forEach(round => {
                        if (round.roundId !== 0 && round.roundId !== null) {
                            if (round.guessedCorrectly) {
                                roundsWon++;
                            } else {
                                roundsLost++;
                            }
                        }
                    });
                });

                const totalRounds = roundsWon + roundsLost;

                setGameStats({
                    gamesWon,
                    gamesLost,
                    totalGames,
                    roundsWon,
                    roundsLost,
                    totalRounds,
                });
            } catch (err) {
                console.log("errore:", err);
                setError("Failed to load game history");
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    return (
        <Container className="my-4">
            <Row>
                {/* Left side: Profile info + stats */}
                <Col md={4}>
                    <Card>
                        <Card.Header as="h4">User Profile</Card.Header>
                        <Card.Body>
                            <Card.Title>{user.name}</Card.Title>
                            <Card.Text>Welcome back, <strong>{user.name}</strong>!</Card.Text>
                        </Card.Body>
                    </Card>

                    {/* Statistiche */}
                    <Card className="mt-4">
                        <Card.Header as="h5">Statistics</Card.Header>
                        <Card.Body>
                            <p><strong>Games played:</strong> {gameStats.totalGames}</p>
                            <p><strong>Games won:</strong> <Badge bg="success">{gameStats.gamesWon}</Badge></p>
                            <p><strong>Games lost:</strong> <Badge bg="danger">{gameStats.gamesLost}</Badge></p>
                            <hr />
                            <p><strong>Rounds played:</strong> {gameStats.totalRounds}</p>
                            <p><strong>Rounds won:</strong> <Badge bg="success">{gameStats.roundsWon}</Badge></p>
                            <p><strong>Rounds lost:</strong> <Badge bg="secondary">{gameStats.roundsLost}</Badge></p>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right side: Game history */}
                <Col md={8}>
                    <Card>
                        <Card.Header as="h5">Game History</Card.Header>
                        <Card.Body>
                            {loading && <Spinner animation="border" />}
                            {error && <p className="text-danger">{error}</p>}
                            {!loading && !error && games.length === 0 && <p>No game history available yet.</p>}
                            {!loading && !error && games.length > 0 && (
                                <>
                                    {games.map((game) => {
                                        const startingHandCount = game.rounds?.filter(
                                            r => r.roundId === 0 || r.roundId === null
                                        ).length;

                                        const roundsWonCount = game.rounds?.filter(
                                            r => r.roundId !== 0 && r.roundId !== null && r.guessedCorrectly
                                        ).length;

                                        const totalCardsInHand = startingHandCount + roundsWonCount;

                                        return (
                                            <Card className="mb-3" key={game.id}>
                                                <Card.Header>
                                                    Game started at: {new Date(game.startedAt).toLocaleString()}
                                                    <Badge
                                                        bg={game.status === "won" ? "success" :
                                                            game.status === "lost" ? "danger" : "warning"}
                                                        className="ms-3"
                                                    >
                                                        {game.status.toUpperCase()}
                                                    </Badge>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Card.Text>
                                                        <strong>Total cards won:</strong> {roundsWonCount}
                                                    </Card.Text>
                                                    <Card.Text>
                                                        <strong>Total cards collected:</strong> {totalCardsInHand}
                                                    </Card.Text>
                                                    <ListGroup>
                                                        <ListGroup.Item>
                                                            <strong>Starting hand:</strong>{" "}
                                                            {game.rounds
                                                                .filter(r => r.roundId === 0 || r.roundId === null)
                                                                .map((r) => r.card.title)
                                                                .join(", ")}
                                                        </ListGroup.Item>
                                                        {game.rounds
                                                            .filter(r => r.roundId !== 0 && r.roundId !== null)
                                                            .sort((a, b) => a.roundId - b.roundId)
                                                            .map((r, idx) => (
                                                                <ListGroup.Item key={`round-${idx}`}>
                                                                    <strong>Round {r.roundId}:</strong> {r.card.title}{" "}
                                                                    {r.guessedCorrectly ? (
                                                                        <Badge bg="success">Won</Badge>
                                                                    ) : (
                                                                        <Badge bg="secondary">Not won</Badge>
                                                                    )}
                                                                </ListGroup.Item>
                                                            ))}
                                                    </ListGroup>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ProfilePage;
