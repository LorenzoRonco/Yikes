import dayjs from 'dayjs';

function Card(id, title, imageUrl, misfortune) {
  this.id = id;
  this.title = title;
  this.imageUrl = imageUrl;
  this.misfortune = misfortune;
}

function Game(id, userId, startedAt, correctGuesses, status) {
  this.id = id;
  this.userId = userId;
  this.startedAt = dayjs(startedAt);
  this.correctGuesses = correctGuesses;
  this.status = status;
  this.gameCards=[];

  this.getGameCards = () => {
    return [...this.gameCards];
  }
}

function GameCards(gameId, cardId, roundId, guessedCorrectly){
    this.gameId = gameId;
    this.cardId = cardId;
    this.roundId = roundId;
    this.guessedCorrectly = guessedCorrectly;
}

export { Card, Game, GameCards };