import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("mastery.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    name TEXT,
    count INTEGER,
    lastUpdated TEXT,
    createdAt TEXT,
    xp INTEGER,
    level INTEGER,
    totalMinutes INTEGER,
    hasTimer BOOLEAN,
    isCompleted BOOLEAN,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/skills", (req, res) => {
    const email = req.query.email as string || "anonymous";
    const skills = db.prepare("SELECT * FROM skills WHERE user_email = ?").all(email);
    res.json(skills.map(s => ({
      ...s,
      hasTimer: !!s.hasTimer,
      isCompleted: !!s.isCompleted
    })));
  });

  app.post("/api/skills/sync", (req, res) => {
    const { email, skills } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const transaction = db.transaction((userEmail, skillList) => {
      // Upsert user
      db.prepare("INSERT OR REPLACE INTO users (email, last_sync) VALUES (?, CURRENT_TIMESTAMP)").run(userEmail);
      
      // Clear existing skills for this user to perform a full sync
      // In a real app, we'd do delta updates, but for this simple sync, full replace is easier
      db.prepare("DELETE FROM skills WHERE user_email = ?").run(userEmail);

      const insert = db.prepare(`
        INSERT INTO skills (
          id, user_email, name, count, lastUpdated, createdAt, 
          xp, level, totalMinutes, hasTimer, isCompleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const skill of skillList) {
        insert.run(
          skill.id,
          userEmail,
          skill.name,
          skill.count,
          skill.lastUpdated,
          skill.createdAt,
          skill.xp,
          skill.level,
          skill.totalMinutes,
          skill.hasTimer ? 1 : 0,
          skill.isCompleted ? 1 : 0
        );
      }
    });

    try {
      transaction(email, skills);
      res.json({ status: "success" });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
