import express from 'express';
import next from 'next';
import cors from "cors";
import DBService from "./app/db/DBService.js";

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(cors());
  server.get('/hello', (req, res) => {
    res.send('Hello from Express!');
  });

  // Example route using PostgreSQL
  server.get('/api/v1/brokers', async (req, res) => {
    try {
      const result = await DBService.findDataFromDB({}, 'broker');
      if(result.stat == "Ok") {
        //return res.status(500).json({ error: 'Database query failed' });
        result.Items.map(item => {item.balance = 1000000; item.status = 'connected'; return item;});
        res.json(result.Items);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Let Next.js handle everything else
  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
