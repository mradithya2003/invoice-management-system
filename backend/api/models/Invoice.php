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
    public $subtotal;
    public $tax_rate;
    public $tax_amount;
    public $discount;
    public $total;
    public $notes;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT i.*, c.name AS client_name
                  FROM {$this->table} i
                  LEFT JOIN clients c ON i.client_id = c.id
                  WHERE i.user_id = :user_id
                  ORDER BY i.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById() {
        $query = "SELECT i.*, c.name AS client_name, c.email AS client_email,
                         c.phone AS client_phone, c.address AS client_address, c.company AS client_company
                  FROM {$this->table} i
                  LEFT JOIN clients c ON i.client_id = c.id
                  WHERE i.id = :id AND i.user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        $invoice = $stmt->fetch();
        if ($invoice) {
            $invoice['items'] = $this->getItems($this->id);
        }
        return $invoice;
    }

    public function getItems($invoice_id) {
        $query = "SELECT * FROM {$this->items_table} WHERE invoice_id = :invoice_id ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':invoice_id', $invoice_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create() {
        $this->invoice_number = $this->generateInvoiceNumber();

        $query = "INSERT INTO {$this->table}
                    (user_id, client_id, invoice_number, status, issue_date, due_date,
                     subtotal, tax_rate, tax_amount, discount, total, notes)
                  VALUES
                    (:user_id, :client_id, :invoice_number, :status, :issue_date, :due_date,
                     :subtotal, :tax_rate, :tax_amount, :discount, :total, :notes)";
        $stmt = $this->conn->prepare($query);
        $this->bindInvoiceParams($stmt);
        $stmt->bindParam(':invoice_number', $this->invoice_number);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE {$this->table}
                  SET client_id = :client_id, status = :status, issue_date = :issue_date,
                      due_date = :due_date, subtotal = :subtotal, tax_rate = :tax_rate,
                      tax_amount = :tax_amount, discount = :discount, total = :total, notes = :notes
                  WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $this->bindInvoiceParams($stmt);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM {$this->table} WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function addItem($invoice_id, $description, $quantity, $unit_price) {
        $amount = $quantity * $unit_price;
        $query = "INSERT INTO {$this->items_table} (invoice_id, description, quantity, unit_price, amount)
                  VALUES (:invoice_id, :description, :quantity, :unit_price, :amount)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':invoice_id', $invoice_id, PDO::PARAM_INT);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':quantity', $quantity);
        $stmt->bindParam(':unit_price', $unit_price);
        $stmt->bindParam(':amount', $amount);
        return $stmt->execute();
    }

    public function deleteItem($item_id, $invoice_id) {
        $query = "DELETE FROM {$this->items_table} WHERE id = :id AND invoice_id = :invoice_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $item_id, PDO::PARAM_INT);
        $stmt->bindParam(':invoice_id', $invoice_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getStats() {
        $query = "SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
                    SUM(CASE WHEN status = 'pending' OR status = 'sent' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS total_paid,
                    COALESCE(SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END), 0) AS total_outstanding
                  FROM {$this->table}
                  WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    private function generateInvoiceNumber() {
        $prefix = 'INV-' . date('Y') . '-';
        $query = "SELECT MAX(CAST(SUBSTRING(invoice_number, LENGTH(:prefix) + 1) AS UNSIGNED)) AS max_num
                  FROM {$this->table} WHERE invoice_number LIKE :like_prefix AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $likePrefix = $prefix . '%';
        $stmt->bindParam(':prefix', $prefix);
        $stmt->bindParam(':like_prefix', $likePrefix);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        $nextNum = ($row['max_num'] ?? 0) + 1;
        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    private function bindInvoiceParams($stmt) {
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->bindParam(':client_id', $this->client_id, PDO::PARAM_INT);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':issue_date', $this->issue_date);
        $stmt->bindParam(':due_date', $this->due_date);
        $stmt->bindParam(':subtotal', $this->subtotal);
        $stmt->bindParam(':tax_rate', $this->tax_rate);
        $stmt->bindParam(':tax_amount', $this->tax_amount);
        $stmt->bindParam(':discount', $this->discount);
        $stmt->bindParam(':total', $this->total);
        $stmt->bindParam(':notes', $this->notes);
    }
}
