[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #1: "Gioco Sfortuna"
## Student: s343512 RONCO LORENZO 

## React Client Application Routes

- Route `/`: home page, permette ad utente di loggarsi per iniziare una nuova partita e di accedere al proprio profilo. In alternativa può iniziare una partita demo da non loggato. 
- Route `/games/:gameId`: permette a un utente loggato di giocare una nuova partita. Nella stessa pagina vengono mostrate le regole, ciascun round, il recap di fine round e di fine partita. Il gameId della nuova partita viene passata come parametro.
- Route `/games/demo`: permette a un utente non loggato di giocare una nuova partita demo. Il funzionamento è simile a quello di `/games/:gameId`, limitando però il numero di round a 1. Non sono passati parametri, in quanto la partita non sarà registrata nel database.
- Route `/profile`: permette ad utente di accedere al proprio profilo, dove egli può trovare la cronologia delle proprie partite e le proprie statistiche. In caso l'utente non sia loggato viene reindirizzato alla home page.
- Route `/login`: permette a un utente di eseguire il login, restituendo un errore in caso di credenziali errate. In caso l'utente sia già loggato viene reindirizzato alla home page.
- Route `*`: usata in caso di route non valida

## API Server
- GET `/api/cards/:cardId`
  -Prende una carta dato il suo Id
  - Request parameters: cardId,
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 200:** {"id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl", "misfortune": 10}</br>
    **404 - Not Found:** {error: "Card not available, check the inserted id."}</br>
    **500 - Internal Server Error:** None</br>
- GET `/api/games`
  - Prende tutti i games di un utente loggato, ciascuno con relativi round e carte di ogni singolo round
  - Request parameters: not required,
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 200:** [{"id": 1, "startedAt": "YYYY-MM-DDT10:30:00.000Z", "correctGuesses": 3, "status": "won", "rounds": [{"roundId": 0, "guessedCorrectly": true, "card": {"id": 5, "title": "cardTitle", "imageUrl": "cardImageUrl", "misfortune": 10}}, ...]}]</br>
    **404 - Not Found:** {error: "Card with id {cardId} not found."}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>
- POST `/api/games/demo`
  - Crea una partita demo per l'utente non loggato, restituisce le 3 carte iniziali + la carta da indovinare
  - Request parameters: not required,
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 201:** {initialCards:[...], newCard: "id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl", "misfortune": 10}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>
- ...

## Database Tables

- Table `users` - contains xx yy zz
- Table `cards` - contains ww qq ss
- Table `game` - contains ww qq ss
- Table `gameCards` - contains ww qq ss
- ...

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username, password (plus any other requested info)
- username, password (plus any other requested info)
