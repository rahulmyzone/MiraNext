import { Pool } from 'pg';
import appconfig from '../../app/app-config.js';

const pool = new Pool({
  connectionString: appconfig.local_DB_url
});

export default pool;