import { Button, Container, Navbar, Dropdown } from 'react-bootstrap';
import { Link, useMatch } from "react-router";
import { useContext } from 'react';
import { DarkModeContext } from './darkModeContext';
import './NavHeader.css'
import 'bootstrap-icons/font/bootstrap-icons.css';

function NavHeader(props) {
  const match = useMatch("/games/:gameId");
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  return (
    <Navbar style={{ backgroundColor: darkMode ? '#370617' : '#FFDD99', height: '60px' }}>
      <Container fluid>
        {match ? ( //avoid it to be clickable during games
          <Link to="/" className="navbar-brand" style={{ color: darkMode ? '#fee440' : '#E45341' }} onClick={(e) => e.preventDefault()}>Yikes!</Link>
        ) : (
          <Link to="/" className="navbar-brand" style={{ color: darkMode ? '#fee440' : '#E45341' }}>Yikes!</Link>
        )}

        <div className="d-flex align-items-center gap-2">
          <Button onClick={toggleDarkMode}
            style={{
              backgroundColor: darkMode ? '#370617' : '#FFDD99',
              borderColor: darkMode ? '#370617' : '#FFDD99',
              boxShadow: 'none'
            }}
            variant="outline-none"
          >
            {darkMode ? <i className="bi bi-sun-fill" style={{ color: '#FFF6EB' }} /> : <i className="bi bi-moon-fill" style={{ color: '#1a1a1d' }} />}
          </Button>

          {!match && props.loggedIn ? (
            <Dropdown align="end">
              <Dropdown.Toggle
                as="div"
                id="user-dropdown"
                className="d-flex align-items-center text-light gap-2 px-2 py-1"
                style={{
                  cursor: 'pointer',
                  border: '1px',
                  backgroundColor: darkMode ? '#B2B2B2' : '#feb871',
                  borderColor: darkMode ? '#B2B2B2' : '#feb871',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '450',
                  color: '#1a1a1d'
                }}
              >
                <i className="bi bi-person-circle fs-4" style={{ color: '#1a1a1d' }} />
                <span style={{ color: '#1a1a1d' }}>{props.user?.name || "Utente"}</span>
              </Dropdown.Toggle>


              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">Profilo</Dropdown.Item>
                <Dropdown.Item onClick={props.handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : !match && (
            <Link to='/login' className='btn btn-outline-light'
              style={{ backgroundColor: darkMode ? '#B2B2B2' : '#feb871', borderColor: darkMode ? '#B2B2B2' : '#feb871', color: '#1a1a1d', fontSize: '1.1rem', fontWeight: '450' }}
            >Login</Link>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavHeader;
