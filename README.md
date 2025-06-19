[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #1: "Gioco Sfortuna"
## Student: s343512 RONCO LORENZO 

## React Client Application Routes

- Route `/`: home page, permette all' utente di loggarsi per iniziare una nuova partita e di accedere al proprio profilo. In alternativa può iniziare una partita demo da non loggato. 
- Route `/games/:gameId`: permette a un utente loggato di giocare una nuova partita. Nella stessa pagina vengono mostrate le regole, la schermata per ciascun round, il recap di fine round e di fine partita. Il gameId della nuova partita viene passata come parametro.
- Route `/games/demo`: permette a un utente non loggato di giocare una nuova partita demo. Il funzionamento è simile a quello di `/games/:gameId`, limitando però il numero di round a 1. Non sono passati parametri, in quanto la partita non sarà registrata nel database.
- Route `/profile`: permette ad utente di accedere al proprio profilo, dove egli può trovare la cronologia delle proprie partite e le proprie statistiche. In caso l'utente non sia loggato viene reindirizzato alla home page.
- Route `/login`: permette a un utente di eseguire il login, restituendo un errore in caso di credenziali errate. In caso l'utente sia già loggato viene reindirizzato alla home page.
- Route `*`: usata in caso di route non valida (NotFound)

## API Server
- GET `/api/cards/:cardId`
  -Prende una carta dato il suo Id
  - Request parameters: cardId
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 200:** {"id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl", "misfortune": 10}</br>
    **404 - Not Found:** {error: "Card not available, check the inserted id."}</br>
    **500 - Internal Server Error:** None</br>

- GET `/api/games`
  - Prende tutti i games di un utente loggato, ciascuno con relativi round e carte di ogni singolo round
  - Request parameters: not required
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 200:** [{"id": 1, "startedAt": "YYYY-MM-DDTHH:mm:ss.sssZ", "correctGuesses": 3, "status": "won", "rounds": [{"roundId": 0, "guessedCorrectly": true, "card": {"id": 5, "title": "cardTitle", "imageUrl": "cardImageUrl", "misfortune": 10}}, ...]}]</br>
    **401 - Unhautorized:** {error: "Not authorized"}</br>
    **404 - Not Found:** {error: "Card with id {cardId} not found."}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- POST `/api/games/demo`
  - Crea una partita demo per l'utente non loggato, restituisce le 3 carte iniziali + la carta da indovinare (senza indice misfortune)
  - Request parameters: not required
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 201:** {initialCards:[...], newCard: {"id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl"}}</br>
    **403 - Forbbiden:** {error: "Already logged in"}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- POST `/api/games/demo/evaluate-guess`
  - Valuta la risposta di un utente non loggato durante una partita demo, restituendo 'true' in caso abbia indovinato la posizione della carta
  - Request parameters: not required
  - Request body: {initialHand: [...], guessCard: {"id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl"}, index: 1}
  - Response body:</br>
    **SUCCESS - 200:** {won: true}</br>
    **403 - Forbbiden:** {error: "Already logged in"}</br>
    **422 - Unprocessable Entity:** (validazione con express non riuscita) {errors: [...]}</br>

- POST `/api/games`
  - Crea una partita per l'utente loggato, estrae 3 carte casuali (quelle iniziali), le inserisce in GameCards e ritorna le 3 carte insieme al Game
  - Request parameters: not required
  - Request body: {userId: 1, startedAt: "YYYY-MM-DDTHH:mm:ss.sssZ", correctGuesses: 0, status: "ongoing"}
  - Response body:</br>
    **SUCCESS - 201:** {id:1, userId: 1, startedAt: "YYYY-MM-DDTHH:mm:ss.sssZ", correctGuesses: 0, status: "ongoing"}, initialCards: [...]}</br
    **401 - Unhautorized:** {error: "Not authorized"}</br>
    **422 - Unprocessable Entity:** (validazione con express non riuscita) {errors: [...]}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- POST `/api/games/:gameId/rounds`
  - Estrae una nuova carta casuale, la inserisce in GameCards e poi la restituisce
  - Request parameters: gameId
  - Request body: {"roundId": 0}
  - Response body:</br>
    **SUCCESS - 201:** {"id": 1, "title": "cardTitle", "imageUrl": "cardImageUrl"}</br
    **401 - Unhautorized:** {error: "Not authorized"}</br>
    **404 - Not Found:** { error: "No more cards available." }/{error: "Game not available, check the inserted id."}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- PUT `/api/games/:gameId/rounds:roundId`
  - Verifica se la carta è stata indovinata, aggiorna GameCards e Game.correctGuesses, restituisce se la carta è corretta (true/false), la mano attuale e la carta che si è cercato di indovinare (completa di misfortune).
  - Request parameters: gameId, roundId
  - Request body: {"insertIndex: 1"}
  - Response body:</br>
    **SUCCESS - 200:** { correct: true, hand: [...], guessCard: {...}}</br
    **401 - Unhautorized:** { error: "Not authorized" }</br>
    **404 - Not Found:** { error: "Game not available, check the inserted id." }/{error: "Round not available, check the inserted id."}</br>
    **422 - Unprocessable Entity:** (validazione con express non riuscita) {errors: [...]}</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- PUT `/api/games/:gameId`
  - Aggiorna un game, calcola automaticamente lo stato della partita e restituisce il Game aggiornato
  - Request parameters: gameId
  - Request body: not required
  - Response body:</br>
    **SUCCESS - 200:** {id:1, userId: 1, startedAt: "YYYY-MM-DDTHH:mm:ss.sssZ", correctGuesses: 0, status: "ongoing"}</br
    **401 - Unhautorized:** { error: "Not authorized" }</br>
    **404 - Not Found:** { error: "Game not available, check the inserted id." }</br>
    **500 - Internal Server Error:** {error: "Internal server error"}</br>

- POST `/api/sessions`
  - Esegue il login dell'utente
  - Request parameters: not required
  - Request body: { "username": "user@email.com", "password": "userPassword" }
  - Response body: </br>
    **SUCCESS - 201:** { "id": 1, "username": "user@email.com", "name": "name" }</br>
    **401 - Unhautorized:** "Unauthorized"</br>
 
- GET `/api/sessions/current`
  - Verifica se utente è autenticato, restituisce i dati dell'utente
  - Request parameters: not required
  - Request body: not required
  - Response body: </br>
    **SUCCESS - 200:** { "id": 1, "username": "user@email.com", "name": "name" }</br>
    **401 - Unhautorized:** { error: "Not authenticated" }</br>
 
- DELETE `/api/sessions/current`
  - Verifica se utente è autenticato, restituisce i dati dell'utente
  - Request parameters: not required
  - Request body: not required
  - Response body: </br>
    **SUCCESS - 204:** None</br>

## Database Tables

- Table `users` - contiene le credenziali degli utenti registrati.
</br>Contiene le seguenti colonne: id, name email, password, salt. </br>
Primary key: id.
- Table `cards` - contiene le carte utilizzate per giocare.
</br>Contiene le seguenti colonne: id, title, imageUrl, misfortune.
</br>Primary key: id.
- Table `games` - contiene tutte le partite giocate da utenti loggati.
</br>Contiene le seguenti colonne: id, userId, startedAt, correctGuesses, status (won/ongoing/lost).
</br>Primary key: id.
</br>Foreign key: userId.
- Table `gameCards` - contiene tutte le carte associate ai vari round di ogni partita. Le carte iniziali sono indicate con roundId=0. La scelta della chiave primaria è stata fatta basandosi sul fatto che una carta non può uscire in più round della stessa partita.
</br>Contiene le seguenti colonne: gameId, cardId, roundId, guessedCorrectly (0=false, 1=true).
</br>Primary key: (gameId, cardId).
</br>Foreign key: cardId.
- Table `sqlite_sequence` - traccia l'id dell'ultima istanza creata nelle tabelle `games` e `cards` in modo da poter usare gli Id autoincrementali.
</br> Contiene le seguenti colonne: name, seq

## Main React Components

- `LoggedInHome` (in `Home.jsx`): contiene cosa mostrare nella home quando l'utente è loggato, ricevendo l'oggetto user nei props. Permette all'utente di iniziare una nuova partita, chiamando la relativa API e passando ciò che ritorna come state alla route `/games/:gameId`.
- `NotLoggedInHome` (in `Home.jsx`): contiene cosa mostrare nella home quando l'utente non è loggato. Permette all'utente di iniziare una nuova partita demo, chiamando la relativa API e passando ciò che ritorna come state alla route `/games/demo`.
- `DemoGame` (in `DemoGame.jsx`): gestisce la logica della partita demo, tra cui inizio della partita, inserimento della carta, timer e l'inizio di una seconda partita demo.
- `FeedbackSection` (in `DemoGame.jsx`): contiene la schermata di fine partita di demo. Permette di tornare alla home o iniziare una nuova partita.
- `GamePage` (in `GamePage.jsx`): gestisce la logica della partita, tra cui inizio della partita, inserimento della carta, timer, il passaggio a un nuovo round e l'inizio di una seconda partita demo. Riceve l'oggetto user come props.
- `FeedbackSection` (in `GamePage.jsx`): funzionamento quasi analogo a quello del corrispettivo componente in `DemoGame.jsx`, ma con una logica leggermente diversa per gestire la fine della partita.
- `PlayerHand` (in `GameComponents.jsx`): mostra la mano attuale del giocatore e i bottoni per inserire la carta da indovinare. E' usata sia durante le partite demo che durante le partire complete.
- `NewCardSection` (in `GameComponents.jsx`): mostra la carta da indovinare. E' usata sia durante le partite demo che durante le partire complete.
- `GameHistory` (in `ProfilePage.jsx`): mostra la cronologia delle partite, permettendo di ordinare per data crescente o decrescente.
- `LoginForm` (in `AuthComponents.jsx`): contiene il form per permettere all'utente di loggarsi. Contiene anche una validazione client-side dei dati inseriti, che verrà ripetuta anche server-side dopo la chiamata all'API.
- Sono stati omessi componenti minori come `Stats` in (in `ProfilePage.jsx), `NavHeader` (in `NavHeader.jsx),... il cui scopo è principalmente grafico.



## Screenshot

![game_page](./img/game_page.png)
![user_page](./img/user_page.png)

## Users Credentials

- email: user1@gmail.com </br>
password: password
</br>(has some games)
- email: user2@gmail.com </br>
password: password
</br>(doesn't have any games)
