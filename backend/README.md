# FastAPI Backend

This minimal API implements a simple Fibbage-style game.

## Endpoints
- `POST /game` – create a new game and receive a join code.
- `POST /game/{code}/join` – join a game before it starts.
- `POST /game/{code}/start` – start the game and create round one.
- `GET /game/{code}/question` – fetch the current question and time remaining.
- `POST /game/{code}/answer` – submit an answer for the current round.
- `POST /game/{code}/vote` – vote for an answer once the round ends.
- `POST /game/{code}/next_round` – end the current round, update scores and begin the next one (after three rounds the highest scored player is eliminated).

Data is stored in a local SQLite database (`game.db`).
