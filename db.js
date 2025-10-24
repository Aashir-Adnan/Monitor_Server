const mysql = require("mysql2/promise");
const { config } = require("./config.js");

const queryDB = async () => {
  const connection = await mysql.createConnection(config.db);
  const results = {};

  try {
    const queries = [
      "SHOW VARIABLES LIKE '%buffer%';",
      "SHOW VARIABLES LIKE '%cache%';",
      "SHOW VARIABLES LIKE '%max_connections%';",
      "SHOW GLOBAL STATUS LIKE 'Threads_connected';",
      "SHOW GLOBAL STATUS LIKE 'Threads_running';",
      "SHOW FULL PROCESSLIST;"
    ];

    for (const q of queries) {
      const [rows] = await connection.execute(q);
      results[q] = rows;
    }
  } catch (err) {
    results.error = err.message;
  } finally {
    await connection.end();
  }

  return results;
};

module.exports = { queryDB };