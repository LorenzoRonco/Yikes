import { Card, Game, GameCards } from "../models/GCModels.mjs";

const SERVER_URL = "http://localhost:3001";

//GET /api/cards/:cardId
const getCard = async (cardId) => {
  const response = await fetch(SERVER_URL + `/api/cards/${cardId}`);
  if (response.ok) {
    const cardJson = await response.json();
    return new Card(
      cardJson.id,
      cardJson.title,
      cardJson.imageUrl,
      cardJson.misfortune
    );
  } else throw new Error("Internal server error");
};


//Get all games of logged user
//GET /api/games
export const getGamesHistory = async () => {
  const response = await fetch(SERVER_URL + `/api/games`, {
    credentials: "include",
  });
  if (response.ok) 
    return await response.json();
  else
    throw new Error("Failed to fetch game history");
};

/*
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
};*/

/*
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
};*/



//post /api/games/demo (per la partita demo dell’utente anonimo)
const createDemoGame = async () => {
  const response = await fetch(SERVER_URL + "/api/games/demo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (response.ok) {
    const responseJson = await response.json();
    return {
      initialCards: responseJson.initialCards.map((g) =>
        new Card(g.id, g.title, g.imageUrl, g.misfortune)
      ),
      newCard: new Card(
        responseJson.newCard.id,
        responseJson.newCard.title,
        responseJson.newCard.imageUrl
      )
    };
  } else throw new Error("Internal server error");
};

//POST /api/games/demo/evaluate-guess (for demo game of not logged user)
const evaluateDemoGame = async (initialHand, guessCard, index) => {
  const response = await fetch(SERVER_URL + "/api/games/demo/evaluate-guess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      initialHand,
      guessCard,
      index,
    }),
    credentials: "include",
  });
  if (response.ok) {
    const responseJson = await response.json();
    return responseJson.won;
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
//TODO: modifica API per validazione timer
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
  getCard,
  getGamesHistory,
  //getGame,
  //getRoundsOfGame,
  createGame,
  createRound,
  updateRound,
  updateGame,
  logIn,
  getUserInfo,
  logOut,
  createDemoGame,
  evaluateDemoGame,
  SERVER_URL, // Export the server URL if needed elsewhere
};
export default API;
