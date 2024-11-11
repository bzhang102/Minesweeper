// src/server/src/routes/index.ts
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.send(`
    <h1>Minesweeper Server</h1>
    <p>WebSocket server is running!</p>
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      socket.on('connect', () => {
        console.log('Connected to server');
      });
    </script>
  `);
});

router.get('/test', (req, res) => {
  res.json({ message: "Test endpoint working!" });
});

export default router;