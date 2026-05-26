CREATE TABLE IF NOT EXISTS leaderboard (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  player     TEXT    NOT NULL CHECK(length(player) BETWEEN 1 AND 30),
  score      INTEGER NOT NULL CHECK(score BETWEEN 0 AND 10000),
  moves      INTEGER NOT NULL CHECK(moves > 0),
  time_ms    INTEGER NOT NULL CHECK(time_ms > 0),
  difficulty TEXT    NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_leaderboard_difficulty_score
  ON leaderboard (difficulty, score DESC);
