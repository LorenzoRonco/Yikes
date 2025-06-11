import { Card, Game, GameCards } from "../models/GCModels.mjs";

const SERVER_URL = "http://localhost:3001";

//TODO: aggiorna API per adattarle a frontend

//Get all games
//GET /api/games
const getGames = async () => {
  const response = await fetch(SERVER_URL + "/api/games");
  if (response.ok) {
    const gamesJson = await response.json();
    return gamesJson.map(
      (g) => new Game(g.id, g.userId, g.startedAt, g.correctGuesses, g.status)
    );
  } else throw new Error("Internal server error");
};

//Get single game
//GET /api/games/:gameId
const getGame = async (gameId) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}`);
  if (response.ok) {
    const gameJson = await response.json();
    return new Game(
      gameJson.id,
      gameJson.userId,
      gameJson.startedAt,
      gameJson.correctGuesses,
      gameJson.status
    );
  } else throw new Error("Internal server error");
};

//Get all rounds of a game
//GET /api/games/:gameId/rounds
const getRoundsOfGame = async (gameId) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/rounds`);
  if (response.ok) {
    const gameCardsJson = await response.json();
    return gameCardsJson.map(
      (gc) =>
        new GameCards(gc.gameId, gc.cardId, gc.roundId, gc.guessedCorrectly)
    );
  } else throw new Error("Internal server error");
};

//Create game, extract 3 initial random cards, insert them into GameCards, return the 3 cards + game
//POST /api/games
const createGame = async (game) => {
  const response = await fetch(SERVER_URL + "/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: game.userId,
      startedAt: game.startedAt,
      correctGuesses: 0,
      status: game.status,
    }),
    credentials: "include",
  });

  if (response.ok) {
    const gameJson = await response.json();
    return {
      game: new Game(
        gameJson.id,
        gameJson.userId,
        gameJson.startedAt,
        gameJson.correctGuesses,
        gameJson.status
      ),
      initialCards: gameJson.initialCards.map((g) =>
        new Card(g.id, g.title, g.imageUrl, g.misfortune)
      ), //return also initial cards
    };
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

//extract a new random card, insert it into GameCards, return the new card
//POST /api/games/:gameId/rounds
const createRound = async (gameId, round) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/rounds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(round),
  });
  if (response.ok) {
    const cardJson = await response.json();
    return new Card(
      cardJson.id,
      cardJson.title,
      cardJson.imageUrl,
    );
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};
//TODO: aggiungi una API per controllare se utente ha vinto o perso il GIOCO, oppure modifica updateGame per farlo
//verifies if the guessed card is correct, updates GameCards and Game.correctGuesses
//PUT /api/games/:gameId/rounds/:roundId
export const updateRound = async (gameId, roundId, insertIndex) => {
  const response = await fetch(
    `${SERVER_URL}/api/games/${gameId}/rounds/${roundId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ insertIndex }), //where the card was guessed
    }
  );

  if (response.ok) {
    return await response.json(); //{ correct: true/false, hand, cardGuessed}
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

//update a game, it automatically computes the status of the game and returns it
//PUT /api/games/:gameId
const updateGame = async (gameId) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  });
  if (response.ok) {
    const gameJson = await response.json();
    return new Game(
      gameJson.id,
      gameJson.userId,
      gameJson.startedAt,
      gameJson.correctGuesses,
      gameJson.status
    );
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

/** LOGIN / GETUSERINFO / LOGOUT **/

const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + "/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + "/api/sessions/current", {
    credentials: "include",
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user; // an object with the error coming from the server
  }
};

const logOut = async () => {
  const response = await fetch(SERVER_URL + "/api/sessions/current", {
    method: "DELETE",
    credentials: "include",
  });
  if (response.ok) return null;
};

const API = {
  getGames,
  getGame,
  getRoundsOfGame,
  createGame,
  createRound,
  updateRound,
  updateGame,
  logIn,
  getUserInfo,
  logOut,
  SERVER_URL, // Export the server URL if needed elsewhere
};
export default API;
