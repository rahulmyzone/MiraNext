import express from 'express';
import next from 'next';
import cors from "cors";
import DBService from "./app/db/DBService.js";
import {fetchExternal} from './app/services/UtilityServices.js';
import appconfig from './app/app-config.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(cors());
  server.use(express.json()); // Enable JSON body parsing

  server.get('/hello', (req, res) => {
    res.send('Hello from Express!');
  });

  // Create a router for /api/v1
  const apiRouter = express.Router();
  const dataRouter = express.Router();
  const appsScriptRouter = express.Router();

  // Generic CRUD routes for any entity
  // Read all
  apiRouter.get('/db/:entity', async (req, res) => {
    const { entity } = req.params;
    try {
      const result = await DBService.findDataFromDB({}, entity);
      if (result.stat === "Ok") {
        if (entity === 'broker') {
          result.Items.map(item => { item.balance = 1000000; item.status = 'connected'; return item; });
        }
        res.json(result.Items);
      } else {
        res.status(400).json({ error: 'Query failed' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Read one
  apiRouter.get('/db/:entity/:id', async (req, res) => {
    const { entity, id } = req.params;
    try {
      const result = await DBService.findDataFromDB({ id }, entity);
      if (result.stat === "Ok" && result.Items.length > 0) {
        res.json(result.Items[0]);
      } else {
        res.status(404).json({ error: `${entity} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  apiRouter.post('/db/:entity', async (req, res) => {
    const { entity } = req.params;
    try {
      const result = await DBService.createDataInDB(req.body, entity);
      if (result.stat === "Ok") {
        res.status(201).json(result.Item);
      } else {
        res.status(400).json({ error: `Failed to create ${entity}` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk create: POST /:entity/bulk
  apiRouter.post('/db/:entity/bulk', async (req, res) => {
    const { entity } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Request body must be an array' });
    }
    try {
      const results = [];
      for (const item of items) {
        const result = await DBService.createDataInDB(item, entity);
        if (result.stat === "Ok") {
          results.push(result.Item);
        } else {
          results.push({ error: `Failed to create ${entity}`, item });
        }
      }
      res.status(201).json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update
  apiRouter.put('/db/:entity/:id', async (req, res) => {
    const { entity, id } = req.params;
    try {
      const result = await DBService.updateDataInDB(id, req.body, entity);
      if (result.stat === "Ok") {
        res.json(result.Item);
      } else {
        res.status(400).json({ error: `Failed to update ${entity}` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete
  apiRouter.delete('/db/:entity/:id', async (req, res) => {
    const { entity, id } = req.params;
    try {
      const result = await DBService.deleteDataFromDB(id, entity);
      if (result.stat === "Ok") {
        res.json({ message: `${entity} deleted` });
      } else {
        res.status(400).json({ error: `Failed to delete ${entity}` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export table structure: GET /:entity/structure
  dataRouter.get('/:entity/structure', async (req, res) => {
    const { entity } = req.params;
    try {
      const result = await DBService.exportTableStructure(entity);
      if (result.stat === "Ok") {
        res.json(result.Items);
      } else {
        res.status(400).json({ error: result.error || 'Failed to export table structure' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/load/:entity', async (req, res) => {
    const { entity } = req.params;
    try {
      const result = await fetchExternal(`${appconfig.apps_script_url}?sheetName=${entity}&source=MIRA&reqType=fetch`);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Use the router for /api/v1
  server.use('/api/v1', apiRouter);
  server.use('/api/gen',dataRouter);
  server.use('/appsscript', appsScriptRouter);

  // Let Next.js handle everything else
  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
