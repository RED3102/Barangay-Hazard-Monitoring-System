const mysql = require('mysql2');
require('dotenv').config();

function runSetup() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:      { rejectUnauthorized: false },
    });

    connection.connect((err) => {
      if (err) {
        console.error('Setup: failed to connect to MySQL:', err.message);
        return reject(err);
      }
      console.log('Setup: connected to MySQL');

      const dbName = process.env.DB_NAME || 'hazard_system';

      // 1. Create database
      connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) { connection.end(); return reject(err); }
        console.log(`Setup: database '${dbName}' is ready`);

        // 2. Use database
        connection.query(`USE \`${dbName}\``, (err) => {
          if (err) { connection.end(); return reject(err); }

          // 3. sensor_readings
          const createSensorReadings = `
            CREATE TABLE IF NOT EXISTS sensor_readings (
              id          INT AUTO_INCREMENT PRIMARY KEY,
              node_id     VARCHAR(100)  NOT NULL,
              water       FLOAT         DEFAULT NULL,
              smoke       FLOAT         DEFAULT NULL,
              distance    FLOAT         DEFAULT NULL,
              vibration   FLOAT         DEFAULT NULL,
              temperature FLOAT         DEFAULT NULL,
              created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
            )
          `;
          connection.query(createSensorReadings, (err) => {
            if (err) { connection.end(); return reject(err); }
            console.log('Setup: sensor_readings table is ready');

            // 4. alerts
            const createAlerts = `
              CREATE TABLE IF NOT EXISTS alerts (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                node_id     VARCHAR(100)  NOT NULL,
                hazard_type VARCHAR(100)  NOT NULL,
                severity    VARCHAR(50)   NOT NULL,
                status      VARCHAR(50)   DEFAULT 'active',
                created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
              )
            `;
            connection.query(createAlerts, (err) => {
              if (err) { connection.end(); return reject(err); }
              console.log('Setup: alerts table is ready');

              // 5. residents
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
                if (err) { connection.end(); return reject(err); }
                console.log('Setup: residents table is ready');

                // 6. reports
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
                  if (err) { connection.end(); return reject(err); }
                  console.log('Setup: reports table is ready');

                  // 7. node_profiles
                  const createNodeProfiles = `
                    CREATE TABLE IF NOT EXISTS node_profiles (
                      id         INT AUTO_INCREMENT PRIMARY KEY,
                      node_id    VARCHAR(100) NOT NULL UNIQUE,
                      owner_name VARCHAR(255) NOT NULL,
                      address    VARCHAR(255) NOT NULL,
                      node_type  VARCHAR(50)  NOT NULL DEFAULT 'fire',
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                  `;
                  connection.query(createNodeProfiles, (err) => {
                    connection.end();
                    if (err) { return reject(err); }
                    console.log('Setup: node_profiles table is ready');
                    console.log('Setup: database initialisation complete');
                    resolve();
                  });

                });
              });
            });
          });
        });
      });
    });
  });
}

module.exports = runSetup;

runSetup().catch(console.error);