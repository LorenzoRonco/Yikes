import { useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { Link } from "react-router";

function LoginForm({ handleLogin, message, setMessage }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError(null);
    setMessage(null); // reset global message
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username").trim(); //is the mail, it using 'username' as name 'cause passport requires it
    const password = formData.get("password").trim();

    // validation client-side
    if (!username || !password) {
      setLocalError("Both email and password are required.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(username)){
      setLocalError("Insert a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // try login
    try {
      await handleLogin({ username, password });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
      <Card style={{ maxWidth: "400px", width: "100%" }} className="p-4 shadow-sm border border-secondary rounded">
        <h3 className="mb-4 text-center">Login</h3>

        {loading && (
          <Alert variant="info" className="text-center">
            Please, wait for the server's response...
          </Alert>
        )}

        {(localError || (message && message.msg)) && (
          <Alert variant="danger" className="text-center">
            {localError || message.msg}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="username"
              placeholder="Enter your email"
              required
              autoComplete="username"
              disabled={loading}
            />
          </Form.Group>

          <Form.Group controlId="password" className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter your password"
              required
              minLength={6}
              autoComplete="current-password"
              disabled={loading}
            />
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center">
            <Link to="/" className="btn btn-outline-danger" tabIndex={loading ? -1 : 0} aria-disabled={loading}>
              Cancel
            </Link>
            <Button type="submit" disabled={loading} variant="primary">
              Login
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}



function LogoutButton(props) {
  return (
    <Button variant="outline-light" onClick={props.logout}>
      Logout
    </Button>
  );
}

export { LoginForm, LogoutButton };
