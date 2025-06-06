// imports
import express from 'express';
import morgan from 'morgan';
import {check, validationResult} from 'express-validator';
import {getGamesByUserId, getUser} from './dao.mjs';
import cors from 'cors';

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

// init express
const app = new express();
const port = 3001;

// middleware
app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};

app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

/** ROUTES **/
//TODO: implement routes
// GET /api/games
app.get('/api/games', (req, res) => {
  listGamesByUserId(req.user.id)
  .then(games => res.json(games))
  .catch(() => res.status(500).end());
});

// GET /api/games/:gameId
app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await getGame(req.params.id);
    if(game.error) {
      res.status(404).json(game);
    } else {
      game.json(game);
    }
  }
  catch {
    res.status(500).end();
  }
});

//GET /api/games/:gameId/rounds
app.get('/api/games:gameId/rounds', (req, res) => {
  listGamesByUserId(req.user.id)
  .then(games => res.json(games))
  .catch(() => res.status(500).end());
});
//TODO: finish routes

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});