from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import string
import time

from .database import get_db, init_db

app = FastAPI(title="Fibbage Style Game")

# simple list of demo questions
QUESTIONS = [
    "What is the capital of France?",
    "Name a programming language that starts with P.",
    "What year did the first moon landing occur?",
]


class JoinRequest(BaseModel):
    name: str


class AnswerRequest(BaseModel):
    player_id: int
    text: str


class VoteRequest(BaseModel):
    player_id: int
    answer_id: int


@app.on_event("startup")
def startup():
    init_db()


def generate_code(length: int = 4) -> str:
    return ''.join(random.choice(string.ascii_uppercase) for _ in range(length))


@app.post("/game")
def create_game():
    code = generate_code()
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO games (code) VALUES (?)", (code,))
    conn.commit()
    conn.close()
    return {"code": code}


@app.post("/game/{code}/join")
def join_game(code: str, req: JoinRequest):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, started FROM games WHERE code = ?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["started"]:
        raise HTTPException(status_code=400, detail="Game already started")
    c.execute(
        "INSERT INTO players (game_id, name) VALUES (?, ?)",
        (game["id"], req.name),
    )
    player_id = c.lastrowid
    conn.commit()
    conn.close()
    return {"player_id": player_id}


@app.post("/game/{code}/start")
def start_game(code: str):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, started FROM games WHERE code = ?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["started"]:
        raise HTTPException(status_code=400, detail="Game already started")
    question = QUESTIONS[0]
    start_time = int(time.time())
    c.execute(
        "UPDATE games SET started = 1, current_round = 1 WHERE id = ?",
        (game["id"],),
    )
    c.execute(
        "INSERT INTO rounds (game_id, number, question, start_time) VALUES (?, 1, ?, ?)",
        (game["id"], question, start_time),
    )
    conn.commit()
    conn.close()
    return {"question": question}


@app.get("/game/{code}/question")
def get_question(code: str):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, current_round FROM games WHERE code = ?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    round_row = c.execute(
        "SELECT id, question, start_time, ended FROM rounds WHERE game_id=? AND number=?",
        (game["id"], game["current_round"]),
    ).fetchone()
    if not round_row:
        raise HTTPException(status_code=404, detail="Round not found")
    remaining = max(0, 60 - (int(time.time()) - round_row["start_time"]))
    if remaining == 0 and not round_row["ended"]:
        c.execute("UPDATE rounds SET ended=1 WHERE id=?", (round_row["id"],))
        conn.commit()
    conn.close()
    return {"question": round_row["question"], "time_left": remaining}


@app.post("/game/{code}/answer")
def submit_answer(code: str, req: AnswerRequest):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, current_round FROM games WHERE code=?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    round_row = c.execute(
        "SELECT id, ended FROM rounds WHERE game_id=? AND number=?",
        (game["id"], game["current_round"]),
    ).fetchone()
    if round_row["ended"]:
        raise HTTPException(status_code=400, detail="Round ended")
    c.execute(
        "INSERT INTO answers (round_id, player_id, text) VALUES (?, ?, ?)",
        (round_row["id"], req.player_id, req.text),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.post("/game/{code}/vote")
def vote(code: str, req: VoteRequest):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, current_round FROM games WHERE code=?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    round_row = c.execute(
        "SELECT id, ended FROM rounds WHERE game_id=? AND number=?",
        (game["id"], game["current_round"]),
    ).fetchone()
    if not round_row["ended"]:
        raise HTTPException(status_code=400, detail="Round still active")
    c.execute(
        "INSERT INTO votes (round_id, voter_id, answer_id) VALUES (?, ?, ?)",
        (round_row["id"], req.player_id, req.answer_id),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


def finalize_round(conn, game_id, round_number):
    c = conn.cursor()
    round_row = c.execute(
        "SELECT id FROM rounds WHERE game_id=? AND number=?",
        (game_id, round_number),
    ).fetchone()
    if not round_row:
        return
    votes = c.execute(
        "SELECT answers.player_id, COUNT(votes.id) as v FROM votes JOIN answers ON votes.answer_id = answers.id WHERE answers.round_id=? GROUP BY answers.player_id",
        (round_row["id"],),
    ).fetchall()
    for row in votes:
        c.execute(
            "UPDATE players SET votes = votes + ? WHERE id=?",
            (row["v"], row["player_id"]),
        )
    c.execute("UPDATE rounds SET ended=1 WHERE id=?", (round_row["id"],))


@app.post("/game/{code}/next_round")
def next_round(code: str):
    conn = get_db()
    c = conn.cursor()
    game = c.execute("SELECT id, current_round FROM games WHERE code=?", (code,)).fetchone()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    finalize_round(conn, game["id"], game["current_round"])
    next_num = game["current_round"] + 1
    if next_num > 3:
        # eliminate player
        player = c.execute(
            "SELECT id FROM players WHERE game_id=? ORDER BY votes DESC LIMIT 1",
            (game["id"],),
        ).fetchone()
        if player:
            c.execute("UPDATE players SET eliminated=1 WHERE id=?", (player["id"],))
        conn.commit()
        conn.close()
        return {"status": "game_over"}
    question = QUESTIONS[(next_num - 1) % len(QUESTIONS)]
    start_time = int(time.time())
    c.execute(
        "UPDATE games SET current_round=? WHERE id=?",
        (next_num, game["id"]),
    )
    c.execute(
        "INSERT INTO rounds (game_id, number, question, start_time) VALUES (?, ?, ?, ?)",
        (game["id"], next_num, question, start_time),
    )
    conn.commit()
    conn.close()
    return {"round": next_num, "question": question}

