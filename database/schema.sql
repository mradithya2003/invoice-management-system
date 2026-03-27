-- Invoice Management System - Database Schema
-- MySQL 5.7+

CREATE DATABASE IF NOT EXISTS invoice_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE invoice_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150),
    phone      VARCHAR(30),
    company    VARCHAR(150),
    address    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    client_id      INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    status         ENUM('draft','sent','paid','overdue') DEFAULT 'draft',
    issue_date     DATE,
    due_date       DATE,
    tax_rate       DECIMAL(5,2) DEFAULT 0.00,
    discount       DECIMAL(10,2) DEFAULT 0.00,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id  INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;
