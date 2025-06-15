import { useEffect, useState } from "react";
import { Container, Card, Row, Col, ListGroup, Badge, Spinner } from "react-bootstrap";
import API from "../API/API.mjs";

function ProfilePage({ user }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [gameStats, setGameStats] = useState({
        gamesWon: 0,
        gamesLost: 0,
        totalGames: 0,
        roundsWon: 0,
        roundsLost: 0,
        totalRounds: 0,
    });

    const [sortAsc, setSortAsc] = useState(false); // false = most recent first (default)


    useEffect(() => {
        if (!user?.id) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const history = await API.getGamesHistory(user.id);
                setGames(history);

                const gamesWon = history.filter(g => g.status === "won").length;
                const gamesLost = history.filter(g => g.status === "lost").length;
                const totalGames = history.length;

                let roundsWon = 0, roundsLost = 0;
                history.forEach(game => {
                    game.rounds?.forEach(round => {
                        if (round.roundId !== 0 && round.roundId !== null) {
                            round.guessedCorrectly ? roundsWon++ : roundsLost++;
                        }
                    });
                });

                setGameStats({
                    gamesWon,
                    gamesLost,
                    totalGames,
                    roundsWon,
                    roundsLost,
                    totalRounds: roundsWon + roundsLost,
                });
            } catch (err) {
                setError("Failed to load game history");
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    const getStatusBadge = (status) => {
        const color = status === 'won' ? 'success' : status === 'lost' ? 'danger' : 'warning';
        return <Badge bg={color} className="ms-2">{status.toUpperCase()}</Badge>;
    };

    return (
        <Container className="my-5">
            <Row>
                {/* Profile and Stats */}
                <Col md={4}>
                    <Card className="shadow-sm rounded-4 mb-4">
                        <Card.Header className="fw-bold fs-5 text-white" style={{ backgroundColor: '#E45341' }}>
                            User Profile
                        </Card.Header>
                        <Card.Body>
                            <Card.Title className="mb-3">{user.name}</Card.Title>
                            <Card.Text>Welcome back, <strong>{user.name}</strong>!</Card.Text>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm rounded-4">
                        <Card.Header className="fw-bold fs-5 text-white" style={{ backgroundColor: '#feb871' }}>
                            Game Statistics
                        </Card.Header>
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

                {/* Game History */}
                <Col md={8}>
                    <Card className="shadow-sm rounded-4">
                        <Card.Header className="d-flex justify-content-between align-items-center text-white" style={{ backgroundColor: '#E45341' }}>
                            <span className="fw-bold fs-5">Game History</span>
                            <button
                                onClick={() => setSortAsc(prev => !prev)}
                                style={{
                                    cursor: 'pointer',
                                    border: '1px',
                                    backgroundColor:'#feb871',
                                    borderColor: '#feb871',
                                    borderRadius: '8px',
                                    fontSize: '0.90rem',
                                    fontWeight: '500',
                                    color: '#1a1a1d'
                                }}
                                title="Toggle sort order"
                            >
                                {sortAsc ? (
                                    <><i class="bi bi-sort-up-alt"></i> Oldest first</>
                                ) : (
                                    <><i class="bi bi-sort-down-alt"></i> Newest first</>)}
                            </button>
                        </Card.Header>
                        <Card.Body>
                            {loading && <Spinner animation="border" />}
                            {error && <p className="text-danger">{error}</p>}
                            {!loading && !error && games.length === 0 && <p>No game history available yet.</p>}
                            {!loading && !error && games.length > 0 && [...games]
                                .sort((a, b) => sortAsc
                                    ? new Date(a.startedAt) - new Date(b.startedAt)
                                    : new Date(b.startedAt) - new Date(a.startedAt)
                                )
                                .map((game) => {
                                    const startingHand = game.rounds?.filter(r => r.roundId === 0 || r.roundId === null);
                                    const roundsWon = game.rounds?.filter(r => r.roundId !== 0 && r.guessedCorrectly);
                                    const totalCards = (startingHand?.length || 0) + (roundsWon?.length || 0);

                                    return (
                                        <Card className="mb-4 shadow-sm rounded-4" key={game.id}>
                                            <Card.Header className="d-flex justify-content-between align-items-center">
                                                <span><strong>Started:</strong> {new Date(game.startedAt).toLocaleString()}</span>
                                                {getStatusBadge(game.status)}
                                            </Card.Header>
                                            <Card.Body>
                                                <Card.Text><strong>Cards won:</strong> {roundsWon?.length || 0}</Card.Text>
                                                <Card.Text><strong>Total cards collected:</strong> {totalCards}</Card.Text>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item>
                                                        <strong>Starting hand:</strong> {startingHand?.map(r => r.card.title).join(', ')}
                                                    </ListGroup.Item>
                                                    {game.rounds
                                                        ?.filter(r => r.roundId !== 0 && r.roundId !== null)
                                                        .sort((a, b) => a.roundId - b.roundId)
                                                        .map((r, idx) => (
                                                            <ListGroup.Item key={`round-${idx}`}>
                                                                <strong>Round {r.roundId}:</strong> {r.card.title}
                                                                {' '}
                                                                <Badge bg={r.guessedCorrectly ? "success" : "secondary"} className="ms-2">
                                                                    {r.guessedCorrectly ? "Won" : "Not won"}
                                                                </Badge>
                                                            </ListGroup.Item>
                                                        ))}
                                                </ListGroup>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                        </Card.Body>
                    </Card>
                </Col>

            </Row>
        </Container>
    );
}

export default ProfilePage;
