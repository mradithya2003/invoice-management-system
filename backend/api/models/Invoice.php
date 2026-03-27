<?php

class Invoice {
    private $conn;
    private $table = 'invoices';
    private $items_table = 'invoice_items';

    public $id;
    public $user_id;
    public $client_id;
    public $invoice_number;
    public $status;
    public $issue_date;
    public $due_date;
    public $tax_rate;
    public $discount;
    public $notes;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($user_id) {
        $query = "SELECT i.*, c.name AS client_name, c.email AS client_email
                  FROM " . $this->table . " i
                  LEFT JOIN clients c ON i.client_id = c.id
                  WHERE i.user_id = :user_id
                  ORDER BY i.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id, $user_id) {
        $query = "SELECT i.*, c.name AS client_name, c.email AS client_email,
                         c.phone AS client_phone, c.address AS client_address, c.company AS client_company
                  FROM " . $this->table . " i
                  LEFT JOIN clients c ON i.client_id = c.id
                  WHERE i.id = :id AND i.user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($invoice) {
            $invoice['items'] = $this->getItems($id);
        }
        return $invoice;
    }

    public function getItems($invoice_id) {
        $query = "SELECT * FROM " . $this->items_table . " WHERE invoice_id = :invoice_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':invoice_id', $invoice_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create() {
        $this->invoice_number = $this->generateInvoiceNumber();

        $query = "INSERT INTO " . $this->table . "
                  (user_id, client_id, invoice_number, status, issue_date, due_date, tax_rate, discount, notes)
                  VALUES (:user_id, :client_id, :invoice_number, :status, :issue_date, :due_date, :tax_rate, :discount, :notes)";
        $stmt = $this->conn->prepare($query);

        $this->sanitize();

        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':client_id', $this->client_id);
        $stmt->bindParam(':invoice_number', $this->invoice_number);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':issue_date', $this->issue_date);
        $stmt->bindParam(':due_date', $this->due_date);
        $stmt->bindParam(':tax_rate', $this->tax_rate);
        $stmt->bindParam(':discount', $this->discount);
        $stmt->bindParam(':notes', $this->notes);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET client_id = :client_id, status = :status, issue_date = :issue_date,
                      due_date = :due_date, tax_rate = :tax_rate, discount = :discount, notes = :notes
                  WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);

        $this->sanitize();

        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':client_id', $this->client_id);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':issue_date', $this->issue_date);
        $stmt->bindParam(':due_date', $this->due_date);
        $stmt->bindParam(':tax_rate', $this->tax_rate);
        $stmt->bindParam(':discount', $this->discount);
        $stmt->bindParam(':notes', $this->notes);

        return $stmt->execute();
    }

    public function delete($id, $user_id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $user_id);
        return $stmt->execute();
    }

    public function addItem($invoice_id, $description, $quantity, $unit_price) {
        $query = "INSERT INTO " . $this->items_table . " (invoice_id, description, quantity, unit_price)
                  VALUES (:invoice_id, :description, :quantity, :unit_price)";
        $stmt = $this->conn->prepare($query);

        $description = htmlspecialchars(strip_tags($description));
        $quantity    = floatval($quantity);
        $unit_price  = floatval($unit_price);

        $stmt->bindParam(':invoice_id', $invoice_id);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':quantity', $quantity);
        $stmt->bindParam(':unit_price', $unit_price);

        return $stmt->execute();
    }

    public function deleteItem($item_id, $invoice_id) {
        $query = "DELETE FROM " . $this->items_table . " WHERE id = :item_id AND invoice_id = :invoice_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':item_id', $item_id);
        $stmt->bindParam(':invoice_id', $invoice_id);
        return $stmt->execute();
    }

    public function getStats($user_id) {
        $query = "SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
                    SUM(CASE WHEN status = 'pending' OR status = 'sent' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft
                  FROM " . $this->table . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function generateInvoiceNumber() {
        return 'INV-' . strtoupper(uniqid());
    }

    private function sanitize() {
        $this->status   = htmlspecialchars(strip_tags($this->status));
        $this->notes    = htmlspecialchars(strip_tags($this->notes));
        $this->tax_rate = floatval($this->tax_rate);
        $this->discount = floatval($this->discount);
    }
}
