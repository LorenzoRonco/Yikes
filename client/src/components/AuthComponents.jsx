import { useActionState } from "react";
import { Form, Button, Row, Col, Alert, Card } from "react-bootstrap";
import { Link } from "react-router";

function LoginForm(props) {
  const [state, formAction, isPending] = useActionState(loginFunction, {
    username: "",
    password: "",
  });

  async function loginFunction(prevState, formData) {
    const credentials = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      await props.handleLogin(credentials);
      return { success: true };
    } catch {
      return { error: "Login failed. Check your credentials." };
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <Card
        style={{ maxWidth: "400px", width: "100%" }}
        className="p-4 shadow-sm border border-secondary rounded"
      >
        <h3 className="mb-4 text-center">Login</h3>

        {isPending && (
          <Alert variant="info" className="text-center">
            Please, wait for the server's response...
          </Alert>
        )}

        {state.error && (
          <Alert variant="danger" className="text-center">
            {state.error}
          </Alert>
        )}

        <Form action={formAction} noValidate>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="username"
              placeholder="Enter your email"
              required
              autoComplete="username"
              disabled={isPending}
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
              disabled={isPending}
            />
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center">
            <Link
              to="/"
              className="btn btn-outline-danger"
              tabIndex={isPending ? -1 : 0}
              aria-disabled={isPending}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={isPending} variant="primary">
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
