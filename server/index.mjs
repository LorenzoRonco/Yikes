// imports
import express from "express";
import morgan from "morgan";
import { check, validationResult } from "express-validator";
import {
  getCards,
  getCard,
  getRandomCardsForGame,
  listGamesByUserId,
  getGame,
  addGame,
  updateGameStatus,
  getGameCards,
  addGameCards,
  evaluateGuess,
  getUser,
} from "./dao.mjs";
import cors from "cors";

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";

// init express
const app = new express();
const port = 3001;

// middleware
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessState: 200,
  credentials: true,
};

app.use(cors(corsOptions));

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await getUser(username, password);
    if (!user) return cb(null, false, "Incorrect username or password.");

    return cb(null, user);
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Not authorized" });
};

app.use(
  session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.authenticate("session"));

/** ROUTES **/

// GET /api/games
app.get("/api/games", (req, res) => {
  listGamesByUserId(req.user.id)
    .then((games) => res.json(games))
    .catch(() => res.status(500).end());
});

// GET /api/games/:gameId
app.get("/api/games/:id", async (req, res) => {
  try {
    const game = await getGame(req.params.id);
    if (game.error) {
      res.status(404).json(game);
    } else {
      res.json(game);
    }
  } catch {
    res.status(500).end();
  }
});

//GET /api/games/:gameId/rounds
app.get("/api/games/:gameId/rounds", async (req, res) => {
  try {
    const gameCards = await getGameCards(req.params.gameId);
    if (gameCards.error) {
      res.status(404).json(gameCards);
    } else {
      res.json(gameCards);
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//POST /api/games
app.post(
  "/api/games",
  isLoggedIn,
  [
    check("userId").notEmpty(),
    check("startedAt").isDate({ format: "YYYY-MM-DD", strictMode: true }),
    check("correctGuesses").isNumeric(),
    check("status").isIn(["ongoing", "won", "lost"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const gameData = req.body;

    try {
      const gameId = await addGame(gameData);

      // extract 3 initial random cards
      const initialCards = getRandomCardsForGame(gameId, 3);

      // insert initial cards into GameCards
      await addGameCards(gameId, initialCards, 0); //round 0 is for initial cards

      // returns game + initial cards
      res.status(201).json({
        id: gameId,
        ...gameData, //expand game data into the response
        initialCards,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

//POST /api/games/:gameId/rounds
app.post("/api/games/:gameId/rounds", isLoggedIn, async (req, res) => {
  const gameId = req.params.gameId;
  try {
    // extract a new random card that has not been played yet
    const newCards = await getRandomCardsForGame(gameId, 1);
    if (!newCards || newCards.length === 0) {
      return res.status(404).json({ error: "No more cards available." });
    }

    // Insert new card into GameCards
    // newCards contains only one element, but is passed as an array for consistency
    await addGameCards(gameId, newCards, req.body.roundId);

    // return the new card
    res.status(201).json(newCards[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/games/:gameId/rounds/:roundId
app.patch(
  "/api/games/:gameId/rounds/:roundId",
  isLoggedIn,
  [
    check("insertIndex").optional({ nullable: true }).isInt({ min: 0 }), //optional per permettere di mettere un indice nullo
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { gameId, roundId } = req.params;
    const { insertIndex } = req.body;

    try {
      const result = await evaluateGuess(gameId, roundId, insertIndex);
      res.json(result); //{ correct: true/false }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

//PUT /api/games/:gameId
app.patch(
  "/api/games/:gameId",
  isLoggedIn,
  [check("status").isIn(["ongoing", "won", "lost"])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const gameId = req.params.gameId;

    try {
      const updatedGame = await updateGameStatus(gameId, status);
      res.json(updatedGame);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
