const mysql = require("mysql2/promise");

const connectionConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
}

async function createConnection(){
    try {
        console.log("\nConectando ao banco de dados...");
        const connection = await mysql.createConnection
        (connectionConfig);
        console.log("---> Conectado.\n");
        return connection;
    } catch(err) {
        console.error("\nHouve um erro ao conectar ao banco de dados: ", err, "\n");       
        throw err;
    }
}

module.exports = createConnection;