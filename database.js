const sql = require('mssql')

const DB_USER = 'app'
const DB_PWD = 'app'
const DB_NAME = 'spacex'

const sqlConfig = {
    user: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
    server: 'localhost',
    // port: 1433,
    port: 1434,
    options: {
        trustServerCertificate: true
    }
}

let pool = null

async function connect() {
    if (!pool) {
        try {
            pool = sql.connect(sqlConfig)
        } catch (err) {
            console.error('Nieudane połączenie z bazą danych', err)

            throw err
        }
    }

    return pool
}

async function request() {
    const pool = await connect();

    return new sql.Request(pool);
}

module.exports = {
    request
}