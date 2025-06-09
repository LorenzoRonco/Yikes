import { useEffect, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { Link, useMatch } from "react-router";
import { LogoutButton } from './AuthComponents';
import 'bootstrap-icons/font/bootstrap-icons.css';

function NavHeader(props) {
  const [darkMode, setDarkMode] = useState(false);

  //it will disable the link on Yikes! to homepage during game
  const match = useMatch("/games/:gameId");

  useEffect(() => {
    // se darkMode === true, aggiungiamo data-bs-theme al tag htmlF
    if (darkMode)
      document.documentElement.setAttribute("data-bs-theme", "dark");
    // altrimenti, rimuoviamo data-bs-theme
    else
      document.documentElement.removeAttribute("data-bs-theme");
  }, [darkMode]);

  return (
    <Navbar bg='primary' data-bs-theme='dark'>
      <Container fluid>
        {match ? (//if in game page the link is disabled
          <Link to="/" className="navbar-brand" onClick={(e) => e.preventDefault()}>Yikes!</Link>
        ) : (
          <Link to="/" className="navbar-brand">Yikes!</Link>
        )
        }

        <Button onClick={() => setDarkMode(oldMode => !oldMode)}>
          {darkMode ? <i className="bi bi-sun-fill" /> : <i className="bi bi-moon-fill" />}
        </Button>
        {!match && (
          props.loggedIn ?
            <LogoutButton logout={props.handleLogout} /> :
            <Link to='/login' className='btn btn-outline-light'>Login</Link>
        )}
      </Container>
    </Navbar>
  );
}

export default NavHeader;