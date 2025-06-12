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
        resolve(new Card(row.id, row.title, row.imageUrl, row.misfortune));
      }
    });
  });
};

//select random cards (#cards generated = limit) that are not already been selected
export const getRandomCardsForGame = (gameId, limit) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM cards
      WHERE id NOT IN (
        SELECT cardId FROM gameCards WHERE gameId = ?
      )
      ORDER BY RANDOM() LIMIT ?`;
    db.all(sql, [gameId, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//select random cards NOT bounded to gameId (used for demo game)
export const getRandomCards = (limit) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM cards
      ORDER BY RANDOM() LIMIT ?`;
    db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

/**  GAMES **/
//get all the games of the user by its user id
export const listGamesByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM games WHERE user.Id = ?";
    db.get(sql, [userId], (err, rows) => {
      if (err) reject(err);
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
            row.status
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
      "INSERT INTO games(userId, startedAt, correctGuesses, status) VALUES (?,?,?,?)";
    db.run(
      sql,
      [game.userId, game.startedAt, game.correctGuesses, game.status],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

//update a game
export const updateGameStatus = (gameId) => {
  return new Promise((resolve, reject) => {
    //find the actual hand (starting cards + guessed cards)
    const sqlHand = `
      SELECT * FROM gameCards gc
      JOIN cards c ON gc.cardId = c.id
      WHERE gc.gameId = ? AND (gc.roundId = 0 OR gc.guessedCorrectly = 1)
      ORDER BY c.misfortune ASC
    `;

    //count #wrong guesses
    const sqlWrongGuesses = `
      SELECT COUNT(*) as wrongGuesses FROM gameCards
      WHERE gameId = ? AND guessedCorrectly = 0 AND roundId > 0
    `;

    db.all(sqlHand, [gameId], (err, handRows) => {
      if (err) return reject(err);

      db.get(sqlWrongGuesses, [gameId], (err2, countRow) => {
        if (err2) return reject(err2);

        const handSize = handRows.length;
        const wrongGuesses = countRow.wrongGuesses;

        //change status
        let newStatus = 'ongoing';
        if (handSize >= 6) {
          newStatus = 'won';
        } else if (wrongGuesses >= 3) {
          newStatus = 'lost';
        }

        //update game
        const sql = `UPDATE games SET status = ? WHERE id = ?`;
        db.run(sql, [newStatus, gameId], function (err3) {
          if (err3) return reject(err3);
          
          // return the updated game
          const getSql = `SELECT * FROM games WHERE id = ?`;
          db.get(getSql, [gameId], (err4, row) => {
            if (err4) return reject(err4);
            resolve(row);
          });
        });
      });
    });
  });
};

/** GAMES CARDS **/
export const getGameCards = (gameId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM gameCards WHERE gameCards.gameId = ?";
    db.all(sql, [gameId], (err, rows) => {
      if (err) {
        reject(err);
      } else if (rows.length === 0) {
        resolve({ error: "No rounds found for this game." });
      } else {
        const gameCards = rows.map(
          (gc) =>
            new GameCards(gc.gameId, gc.cardId, gc.roundId, gc.guessedCorrectly)
        );
        resolve(gameCards);
      }
    });
  });
};

//add a list of cards to GameCards table. They are inserted all with the same roundId
export const addGameCards = (gameId, cards, roundId) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO gameCards(gameId, cardId, roundId) VALUES (?, ?, ?)";
    const stmt = db.prepare(sql); //prepare-> prepares the SQL statement for execution
    //you can run stmt with .run, passing different parameters each time

    for (const card of cards) {
      stmt.run([gameId, card.id, roundId]);
    }

    //finalize closes stmt, after that it cannot be used anymore. It avoids memory leaks
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

//verifies if the guessed card is correct, updates GameCards and Game.correctGuesses
export const evaluateGuess = (gameId, roundId, insertIndex) => {
  return new Promise((resolve, reject) => {
    //find the guessed card
    const sqlGuessed = `
      SELECT * FROM gameCards gc
      JOIN cards c ON gc.cardId = c.id
      WHERE gc.gameId = ? AND gc.roundId = ?
    `;

    db.get(sqlGuessed, [gameId, roundId], (err, guessRow) => {
      if (err || !guessRow) return reject(err || "Guessed card not found");
      const guessCard = guessRow;

      //find the actual hand (starting cards + guessed cards)
      const sqlHand = `
        SELECT * FROM gameCards gc
        JOIN cards c ON gc.cardId = c.id
        WHERE gc.gameId = ? AND (gc.roundId = 0 OR gc.guessedCorrectly = 1)
        ORDER BY c.misfortune ASC
      `;

      db.all(sqlHand, [gameId], (err2, handRows) => {
        if (err2) return reject(err2);
        let hand = handRows;

        
        //if insertIndex==null or undefined, it means the user did not guess any card in time
        if (insertIndex === null || insertIndex === undefined) {
          const updateSQL = `UPDATE gameCards SET guessedCorrectly = 0 WHERE gameId = ? AND roundId = ?`;
          db.run(updateSQL, [gameId, roundId], function (err3) {
            if (err3) return reject(err3);
            resolve({ correct: false, hand: hand, guessCard: guessCard });
          });
          return;
        }

        //if insertIndex > 0, left = misfortune of prev card, else -Infinity
        const left = insertIndex > 0 ? hand[insertIndex - 1].misfortune : -Infinity;
        const right = insertIndex < hand.length ? hand[insertIndex].misfortune : Infinity;

        const correct = left <= guessCard.misfortune && guessCard.misfortune <= right;

        const updateGameCardSQL = `UPDATE gameCards SET guessedCorrectly = ? WHERE gameId = ? AND roundId = ?`;

        db.run(
          updateGameCardSQL,
          [correct ? 1 : 0, gameId, roundId],
          function (err3) {
            if (err3) return reject(err3);

            if (correct) {
              const updateCorrectSQL = `UPDATE games SET correctGuesses = correctGuesses + 1 WHERE id = ?`;
              db.run(updateCorrectSQL, [gameId], function (err4) {
                if (err4) return reject(err4);
                else {
                  hand.push(guessCard); //add guessed card to the hand
                  hand.sort((a, b) => a.misfortune - b.misfortune); //sort the hand by misfortune
                  resolve({ correct: true, hand: hand, guessCard: guessCard});
                }
              });
            } else {
              resolve({ correct: false, hand: hand, guessCard: guessCard });
            }
          }
        );
      });
    });
  });
};

/** USERS **/
//get user
export const getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
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
