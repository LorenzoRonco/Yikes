import express from "express";
import morgan from "morgan";
import { check, validationResult } from "express-validator";
import {
  getCard,
  getRandomCardsForGame,
  getRandomCards,
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

app.use("/static", express.static("public")); //for cards images
// you can access a file using http://localhost:3001/static/{filename}
// if the file is in a directory you have to specify the full path

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

const isNotLoggedIn = (req, res, next) => {
  //for demo game
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.status(403).json({ error: "Already logged in" });
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

//GET /api/cards/:cardId
app.get("/api/cards/:cardId", async (req, res) => {
  try {
    const card = await getCard(req.params.cardId);
    if (card.error) {
      res.status(404).json(card);
    } else {
      res.json(card);
    }
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/games
app.get("/api/games", isLoggedIn, async (req, res) => {
  try {
    const games = await listGamesByUserId(req.user.id);

    //add the rounds to the games
    const enrichedGames = await Promise.all(
      games.map(async (game) => {
        const rounds = await getGameCards(game.id);

        //add the card to each round
        const roundDetails = await Promise.all(
          rounds.map(async (r) => {
            const card = await getCard(r.cardId);
            if (card.error) {
              console.warn(`Card ${r.cardId} not found for round ${r.roundId}`);
              throw {
                status: 404,
                message: `Card with id ${r.cardId} not found.`,
              };
            }
            return {
              roundId: r.roundId,
              guessedCorrectly: r.guessedCorrectly,
              card: card,
            };
          })
        );

        return {
          id: game.id,
          startedAt: game.startedAt,
          correctGuesses: game.correctGuesses,
          status: game.status,
          rounds: roundDetails,
        };
      })
    );

    res.json(enrichedGames);
  } catch (error) {
    console.error("Error generating game history:", error);
    if (error.status === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

//POST /api/games/demo
app.post("/api/games/demo", isNotLoggedIn, async (req, res) => {
  try {
    // extract 4 random cards
    const cards = await getRandomCards(4);
    const initialCards = cards.slice(0, 3);
    const newCard = cards[3];

    // returns initial cards + guess card
    res.status(201).json({
      initialCards,
      newCard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//POST /api/games/demo/evaluate-guess
app.post(
  "/api/games/demo/evaluate-guess",
  isNotLoggedIn,
  [
    check("initialHand").isArray({ min: 3, max: 3 }), //ensure there are 3 cards in the hand
    check("guessCard").notEmpty(),
    check("index").optional({ nullable: true }).isInt({ min: 0 }), //optional so it recognize when user loses due to time
  ],
  (req, res) => {
    //no async because there are no await inside
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const guessCard = req.body.guessCard;
    const index = req.body.index;

    if (index === null) {
      //user looses due to timeout
      return res.json({ won: false });
    }

    const sortedHand = [...req.body.initialHand].sort(
      (a, b) => a.misfortune - b.misfortune
    ); //sort initial hand
    const handWithCard = [
      ...sortedHand.slice(0, index),
      guessCard,
      ...sortedHand.slice(index),
    ];
    const isCorrect = handWithCard.every(
      (card, i, arr) => i === 0 || arr[i - 1].misfortune <= card.misfortune
    );

    return res.json({ won: isCorrect });
  }
);

//POST /api/games
app.post(
  "/api/games",
  isLoggedIn,
  [
    check("userId").notEmpty(),
    check("startedAt").isISO8601(),
    check("correctGuesses").custom((value) => Number(value) === 0), //ensure correctGuesses is 0
    check("status").isIn(["ongoing"]), //a new game can not be already won or lost
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const gameData = req.body;

    try {
      //insert the new game
      const gameId = await addGame(gameData);

      // extract 3 initial random cards
      const initialCards = await getRandomCardsForGame(gameId, 3);

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
    let game = await getGame(gameId);
    if (game.error) {
      return res.status(404).json({ error: game.error });
    }
    // extract a new random card that has not been played yet
    const newCards = await getRandomCardsForGame(gameId, 1);
    if (!newCards || newCards.length === 0) {
      return res.status(404).json({ error: "No more cards available." });
    }

    // Insert new card into GameCards
    // newCards contains only one element, but is passed as an array for consistency
    await addGameCards(gameId, newCards, req.body.roundId);

    // return the new card
    // removes the misfortune before sending it to the client so client cannot cheat
    const { misfortune, ...safeCard } = newCards[0];
    res.status(201).json(safeCard);
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
    check("insertIndex").optional({ nullable: true }).isInt({ min: 0 }), //optional so I can insert a null index (for initial cards)
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { gameId, roundId } = req.params;
    const { insertIndex } = req.body;

    let game = await getGame(gameId);
    if (game.error) {
      return res.status(404).json({ error: game.error });
    }

    let gameCards = getGameCards(gameId);
    const found = gameCards.some(
      (gc) => gc.gameId === gameId && gc.roundId === targetRoundId
    );
    if (!found) {
      return res
        .status(404)
        .json({ error: "Round not available, check the inserted id." });
    }

    try {
      const result = await evaluateGuess(gameId, roundId, insertIndex);
      res.json(result); //{ correct: true/false, hand, cardGuessed}
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

//PUT /api/games/:gameId
app.patch("/api/games/:gameId", isLoggedIn, async (req, res) => {
  const gameId = req.params.gameId;

  try {
    let game = await getGame(gameId);
    if (game.error) {
      return res.status(404).json({ error: game.error });
    }
    const updatedGame = await updateGameStatus(gameId);
    res.json(updatedGame);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    res.status(204).end();
  });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
