-- Invoice Management System - Database Schema
-- MySQL 5.7+ / MariaDB 10.2+

CREATE DATABASE IF NOT EXISTS invoice_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE invoice_management;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120)  NOT NULL,
    email      VARCHAR(180)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED  NOT NULL,
    name       VARCHAR(120)  NOT NULL,
    email      VARCHAR(180)  NOT NULL,
    phone      VARCHAR(30)   DEFAULT NULL,
    address    TEXT          DEFAULT NULL,
    company    VARCHAR(150)  DEFAULT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED   NOT NULL,
    client_id      INT UNSIGNED   NOT NULL,
    invoice_number VARCHAR(50)    NOT NULL,
    status         ENUM('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft',
    issue_date     DATE           NOT NULL,
    due_date       DATE           DEFAULT NULL,
    subtotal       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    tax_rate       DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
    tax_amount     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    discount       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    total          DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    notes          TEXT           DEFAULT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invoice_number (user_id, invoice_number),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id  INT UNSIGNED   NOT NULL,
    description VARCHAR(255)   NOT NULL,
    quantity    DECIMAL(10,2)  NOT NULL DEFAULT 1.00,
    unit_price  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    amount      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
