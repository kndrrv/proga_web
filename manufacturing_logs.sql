CREATE DATABASE IF NOT EXISTS manufacturing_logs;
USE manufacturing_logs;

CREATE TABLE IF NOT EXISTS tech_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    task VARCHAR(100) NOT NULL,
    subtask VARCHAR(100) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    comentario TEXT
);

USE manufacturing_logs;
SELECT * FROM manufacturing_logs.tech_logs;