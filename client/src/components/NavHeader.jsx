import { useEffect, useState } from 'react';
import { Button, Container, Navbar, Dropdown } from 'react-bootstrap';
import { Link, useMatch } from "react-router";
import 'bootstrap-icons/font/bootstrap-icons.css';
import './NavHeader.css'

function NavHeader(props) {
  const [darkMode, setDarkMode] = useState(false);
  const match = useMatch("/games/:gameId");

  useEffect(() => {
    if (darkMode)
      document.documentElement.setAttribute("data-bs-theme", "dark");
    else
      document.documentElement.removeAttribute("data-bs-theme");
  }, [darkMode]);

  return (
    <Navbar bg='primary' data-bs-theme='dark'>
      <Container fluid>
        {match ? (
          <Link to="/" className="navbar-brand" onClick={(e) => e.preventDefault()}>Yikes!</Link>
        ) : (
          <Link to="/" className="navbar-brand">Yikes!</Link>
        )}

        <div className="d-flex align-items-center gap-2">
          <Button onClick={() => setDarkMode(oldMode => !oldMode)}>
            {darkMode ? <i className="bi bi-sun-fill" /> : <i className="bi bi-moon-fill" />}
          </Button>

          {!match && props.loggedIn ? (
            <Dropdown align="end">
              <Dropdown.Toggle
                as="div"
                id="user-dropdown"
                className="d-flex align-items-center text-light gap-2 px-2 py-1"
                style={{
                  cursor: 'pointer',
                  border: '1px solid white',
                  borderRadius: '8px'
                }}
              >
                <i className="bi bi-person-circle fs-4" />
                <span>{props.user?.name || "Utente"}</span>
              </Dropdown.Toggle>


              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">Profilo</Dropdown.Item>
                <Dropdown.Item onClick={props.handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : !match && (
            <Link to='/login' className='btn btn-outline-light'>Login</Link>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavHeader;
