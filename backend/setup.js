const mysql = require('mysql2');
require('dotenv').config();

function runSetup() {
  return new Promise((resolve, reject) => {
    // Connect WITHOUT specifying a database so we can create it if needed
    const connection = mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      });

    connection.connect((err) => {
      if (err) {
        console.error('Setup: failed to connect to MySQL:', err.message);
        return reject(err);
      }
      console.log('Setup: connected to MySQL');

      const dbName = process.env.DB_NAME || 'hazard_system';

      // 1. Create database if it doesn't exist
      connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
        (err) => {
          if (err) {
            console.error('Setup: failed to create database:', err.message);
            connection.end();
            return reject(err);
          }
          console.log(`Setup: database '${dbName}' is ready`);

          // 2. Switch to the target database
          connection.query(`USE \`${dbName}\``, (err) => {
            if (err) {
              console.error('Setup: failed to select database:', err.message);
              connection.end();
              return reject(err);
            }

            // 3. Create sensor_readings table if it doesn't exist
            const createSensorReadings = `
              CREATE TABLE IF NOT EXISTS sensor_readings (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                node_id     VARCHAR(100)   NOT NULL,
                water       FLOAT          DEFAULT NULL,
                smoke       FLOAT          DEFAULT NULL,
                distance    FLOAT          DEFAULT NULL,
                vibration   FLOAT          DEFAULT NULL,
                temperature FLOAT          DEFAULT NULL,
                created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
              )
            `;

            connection.query(createSensorReadings, (err) => {
              if (err) {
                console.error('Setup: failed to create sensor_readings table:', err.message);
                connection.end();
                return reject(err);
              }
              console.log('Setup: sensor_readings table is ready');

              // 4. Create alerts table if it doesn't exist
              const createAlerts = `
                CREATE TABLE IF NOT EXISTS alerts (
                  id          INT AUTO_INCREMENT PRIMARY KEY,
                  node_id     VARCHAR(100)   NOT NULL,
                  hazard_type VARCHAR(100)   NOT NULL,
                  severity    VARCHAR(50)    NOT NULL,
                  status      VARCHAR(50)    DEFAULT 'pending',
                  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
                )
              `;

              connection.query(createAlerts, (err) => {
                if (err) {
                  console.error('Setup: failed to create alerts table:', err.message);
                  connection.end();
                  return reject(err);
                }
                console.log('Setup: alerts table is ready');

                // 5. Create residents table
                const createResidents = `
                  CREATE TABLE IF NOT EXISTS residents (
                    id            INT AUTO_INCREMENT PRIMARY KEY,
                    full_name     VARCHAR(255) NOT NULL,
                    phone         VARCHAR(20)  NOT NULL UNIQUE,
                    address       VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
                    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `;

                connection.query(createResidents, (err) => {
                  if (err) {
                    console.error('Setup: failed to create residents table:', err.message);
                    connection.end();
                    return reject(err);
                  }
                  console.log('Setup: residents table is ready');

                  // 6. Create reports table
                  const createReports = `
                    CREATE TABLE IF NOT EXISTS reports (
                      id          INT AUTO_INCREMENT PRIMARY KEY,
                      hazard_type VARCHAR(100)  NOT NULL,
                      location    VARCHAR(255)  NOT NULL,
                      description TEXT,
                      photo_url   VARCHAR(500)  DEFAULT NULL,
                      source      VARCHAR(50)   DEFAULT 'resident_report',
                      status      ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
                      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
                    )
                  `;

                  connection.query(createReports, (err) => {
                    connection.end();
                    if (err) {
                      console.error('Setup: failed to create reports table:', err.message);
                      return reject(err);
                    }
                    console.log('Setup: reports table is ready');
                    console.log('Setup: database initialisation complete');
                    resolve();
                  });
                });
              });
            });
          });
        }
      );
    });
  });
}

module.exports = runSetup;

runSetup().catch(console.error);