import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.iwgrqhbfuwwtlhhjyzzc:YOR9nBvNlbEZF-H0rz8jBQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

export default pool;