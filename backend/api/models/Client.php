<?php

class Client {
    private $conn;
    private $table = 'clients';

    public $id;
    public $user_id;
    public $name;
    public $email;
    public $phone;
    public $address;
    public $company;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById() {
        $query = "SELECT * FROM {$this->table} WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create() {
        $query = "INSERT INTO {$this->table} (user_id, name, email, phone, address, company)
                  VALUES (:user_id, :name, :email, :phone, :address, :company)";
        $stmt = $this->conn->prepare($query);

        $this->sanitize();

        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':company', $this->company);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE {$this->table}
                  SET name = :name, email = :email, phone = :phone, address = :address, company = :company
                  WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);

        $this->sanitize();

        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':company', $this->company);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM {$this->table} WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    private function sanitize() {
        $this->name    = htmlspecialchars(strip_tags($this->name));
        $this->email   = htmlspecialchars(strip_tags($this->email));
        $this->phone   = htmlspecialchars(strip_tags($this->phone ?? ''));
        $this->address = htmlspecialchars(strip_tags($this->address ?? ''));
        $this->company = htmlspecialchars(strip_tags($this->company ?? ''));
    }
}
