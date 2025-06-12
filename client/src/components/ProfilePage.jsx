import { Container, Row, Col, Card, ListGroup } from "react-bootstrap";

function ProfilePage({ user }) {
  return (
    <Container className="my-4">
      <Row>
        {/* Colonna sinistra: Profilo + Statistiche */}
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header as="h5">User Profile</Card.Header>
            <Card.Body>
              <Card.Title>{user.name}</Card.Title>
              <Card.Text>Welcome back!</Card.Text>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header as="h6">User Stats</Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>Total Games: <strong>0</strong></ListGroup.Item>
                <ListGroup.Item>Wins: <strong>0</strong></ListGroup.Item>
                <ListGroup.Item>Losses: <strong>0</strong></ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Colonna destra: Cronologia partite */}
        <Col md={8}>
          <Card>
            <Card.Header as="h5">Game History</Card.Header>
            <Card.Body>
              {/* Sostituibile con mappatura dinamica */}
              <p>No game history available yet.</p>

              {/*
              <ListGroup>
                {games.map(game => (
                  <ListGroup.Item key={game.id}>
                    Game #{game.id} - {game.date} - {game.result}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
