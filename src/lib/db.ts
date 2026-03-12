import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
}

export async function getOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await pool.query<T>(text, params);
    return result.rows[0] || null;
}

export async function getMany<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await pool.query<T>(text, params);
    return result.rows;
}

export default pool;
