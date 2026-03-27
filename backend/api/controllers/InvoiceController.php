<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Invoice.php';

class InvoiceController {

    private $db;
    private $invoice;
    private $user_id;

    public function __construct() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Not authenticated.']);
            exit;
        }
        $this->user_id = $_SESSION['user_id'];

        $database = new Database();
        $this->db = $database->getConnection();
        $this->invoice = new Invoice($this->db);
        $this->invoice->user_id = $this->user_id;
    }

    public function index() {
        return $this->invoice->getAll();
    }

    public function show($id) {
        $this->invoice->id = (int) $id;
        $invoice = $this->invoice->getById();
        if ($invoice) {
            return $invoice;
        }
        http_response_code(404);
        return ['error' => 'Invoice not found.'];
    }

    public function store($data) {
        if (empty($data['client_id'])) {
            http_response_code(400);
            return ['error' => 'Client is required.'];
        }

        $this->invoice->client_id   = (int) $data['client_id'];
        $this->invoice->status      = $data['status'] ?? 'draft';
        $this->invoice->issue_date  = $data['issue_date'] ?? date('Y-m-d');
        $this->invoice->due_date    = $data['due_date'] ?? null;
        $this->invoice->subtotal    = (float) ($data['subtotal'] ?? 0);
        $this->invoice->tax_rate    = (float) ($data['tax_rate'] ?? 0);
        $this->invoice->tax_amount  = (float) ($data['tax_amount'] ?? 0);
        $this->invoice->discount    = (float) ($data['discount'] ?? 0);
        $this->invoice->total       = (float) ($data['total'] ?? 0);
        $this->invoice->notes       = $data['notes'] ?? '';

        if ($this->invoice->create()) {
            // Add items if provided
            if (!empty($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    if (!empty($item['description'])) {
                        $this->invoice->addItem(
                            $this->invoice->id,
                            $item['description'],
                            (float) ($item['quantity'] ?? 1),
                            (float) ($item['unit_price'] ?? 0)
                        );
                    }
                }
            }
            http_response_code(201);
            return $this->invoice->getById();
        }
        http_response_code(500);
        return ['error' => 'Failed to create invoice.'];
    }

    public function update($id, $data) {
        $this->invoice->id = (int) $id;
        if (!$this->invoice->getById()) {
            http_response_code(404);
            return ['error' => 'Invoice not found.'];
        }

        $this->invoice->client_id  = (int) ($data['client_id'] ?? 0);
        $this->invoice->status     = $data['status'] ?? 'draft';
        $this->invoice->issue_date = $data['issue_date'] ?? date('Y-m-d');
        $this->invoice->due_date   = $data['due_date'] ?? null;
        $this->invoice->subtotal   = (float) ($data['subtotal'] ?? 0);
        $this->invoice->tax_rate   = (float) ($data['tax_rate'] ?? 0);
        $this->invoice->tax_amount = (float) ($data['tax_amount'] ?? 0);
        $this->invoice->discount   = (float) ($data['discount'] ?? 0);
        $this->invoice->total      = (float) ($data['total'] ?? 0);
        $this->invoice->notes      = $data['notes'] ?? '';

        if ($this->invoice->update()) {
            return $this->invoice->getById();
        }
        http_response_code(500);
        return ['error' => 'Failed to update invoice.'];
    }

    public function destroy($id) {
        $this->invoice->id = (int) $id;
        if (!$this->invoice->getById()) {
            http_response_code(404);
            return ['error' => 'Invoice not found.'];
        }

        if ($this->invoice->delete()) {
            return ['message' => 'Invoice deleted successfully.'];
        }
        http_response_code(500);
        return ['error' => 'Failed to delete invoice.'];
    }

    public function addItem($id, $data) {
        $this->invoice->id = (int) $id;
        if (!$this->invoice->getById()) {
            http_response_code(404);
            return ['error' => 'Invoice not found.'];
        }

        if (empty($data['description'])) {
            http_response_code(400);
            return ['error' => 'Item description is required.'];
        }

        if ($this->invoice->addItem(
            (int) $id,
            $data['description'],
            (float) ($data['quantity'] ?? 1),
            (float) ($data['unit_price'] ?? 0)
        )) {
            http_response_code(201);
            return ['message' => 'Item added.'];
        }
        http_response_code(500);
        return ['error' => 'Failed to add item.'];
    }

    public function deleteItem($id, $item_id) {
        $this->invoice->id = (int) $id;
        if (!$this->invoice->getById()) {
            http_response_code(404);
            return ['error' => 'Invoice not found.'];
        }

        if ($this->invoice->deleteItem((int) $item_id, (int) $id)) {
            return ['message' => 'Item deleted.'];
        }
        http_response_code(500);
        return ['error' => 'Failed to delete item.'];
    }

    public function stats() {
        return $this->invoice->getStats();
    }
}
