import sqlite from "sqlite3";
import { Card, Game, GameCards } from "./GCModels.mjs";
import crypto from "crypto";

// open the database
const db = new sqlite.Database("db_games.sqlite", (err) => {
  if (err) throw err;
});

/* CARDS */
//get all the cards
export const getCards = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM cards";
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else {
        const cards = rows.map(
          (c) => new Card(c.id, c.title, c.imageUrl, c.misfortune)
        );
        resolve(cards);
      }
    });
  });
};

//get a card by its id
export const getCard = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM cards WHERE cards.id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve({ error: "Card not available, check the inserted id." });
      } else {
        resolve(
          new Question(row.id, row.text, row.email, row.authorId, row.date)
        );
      }
    });
  });
};

/**  GAMES **/
//get all the games of the user by its user id
export const listGamesByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM games WHERE user.Id = ?";
    db.get(sql, [userId], (err, rows) => {
      if (err) 
        reject(err);
      else {
        const games = rows.map(
          (g) =>
            new Game(g.id, g.userId, g.startedAt, g.correctGuesses, g.status)
        );
        resolve(games);
      }
    });
  });
};

//get a game by its id
export const getGame = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT games.* FROM games WHERE games.id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve({ error: "Game not available, check the inserted id." });
      } else {
        resolve(
          new Game(
            row.id,
            row.userId,
            row.startedAt,
            row.correctGuesses,
            rwo.status
          )
        );
      }
    });
  });
};

//add a new game
export const addGame = (game) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO games(id, userId, startedAt, correctGuesses, status) VALUES (?,?,?,?,?)";
    db.run(
      sql,
      [game.id, game.userId, game.startedAt, game.correctGuesses, game.status],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

/** GAMES CARDS **/
//TODO: implement functions for GamesCards
/** USERS **/
//get user
export const getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = { id: row.id, username: row.email, name: row.name };

        crypto.scrypt(password, row.salt, 16, function (err, hashedPassword) {
          if (err) reject(err);
          if (
            !crypto.timingSafeEqual(
              Buffer.from(row.password, "hex"),
              hashedPassword
            )
          )
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};
