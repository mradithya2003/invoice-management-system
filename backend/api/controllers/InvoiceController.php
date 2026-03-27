<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Invoice.php';

class InvoiceController {

    private $db;
    private $invoice;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->invoice = new Invoice($this->db);
    }

    private function requireAuth() {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized.']);
            exit;
        }
        return $_SESSION['user_id'];
    }

    public function index() {
        $user_id = $this->requireAuth();
        $invoices = $this->invoice->getAll($user_id);
        echo json_encode(['invoices' => $invoices]);
    }

    public function show($id) {
        $user_id = $this->requireAuth();
        $invoice = $this->invoice->getById($id, $user_id);
        if ($invoice) {
            echo json_encode(['invoice' => $invoice]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found.']);
        }
    }

    public function store() {
        $user_id = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['client_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Client is required.']);
            return;
        }

        $this->invoice->user_id    = $user_id;
        $this->invoice->client_id  = $data['client_id'];
        $this->invoice->status     = $data['status'] ?? 'draft';
        $this->invoice->issue_date = $data['issue_date'] ?? date('Y-m-d');
        $this->invoice->due_date   = $data['due_date'] ?? null;
        $this->invoice->tax_rate   = $data['tax_rate'] ?? 0;
        $this->invoice->discount   = $data['discount'] ?? 0;
        $this->invoice->notes      = $data['notes'] ?? '';

        if ($this->invoice->create()) {
            $invoice_id = $this->invoice->id;

            if (!empty($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    if (!empty($item['description'])) {
                        $this->invoice->addItem(
                            $invoice_id,
                            $item['description'],
                            $item['quantity'] ?? 1,
                            $item['unit_price'] ?? 0
                        );
                    }
                }
            }

            http_response_code(201);
            echo json_encode(['message' => 'Invoice created.', 'id' => $invoice_id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create invoice.']);
        }
    }

    public function update($id) {
        $user_id = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $existing = $this->invoice->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found.']);
            return;
        }

        $this->invoice->id         = $id;
        $this->invoice->user_id    = $user_id;
        $this->invoice->client_id  = $data['client_id'] ?? $existing['client_id'];
        $this->invoice->status     = $data['status'] ?? $existing['status'];
        $this->invoice->issue_date = $data['issue_date'] ?? $existing['issue_date'];
        $this->invoice->due_date   = $data['due_date'] ?? $existing['due_date'];
        $this->invoice->tax_rate   = $data['tax_rate'] ?? $existing['tax_rate'];
        $this->invoice->discount   = $data['discount'] ?? $existing['discount'];
        $this->invoice->notes      = $data['notes'] ?? $existing['notes'];

        if ($this->invoice->update()) {
            echo json_encode(['message' => 'Invoice updated.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update invoice.']);
        }
    }

    public function destroy($id) {
        $user_id = $this->requireAuth();

        $existing = $this->invoice->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found.']);
            return;
        }

        if ($this->invoice->delete($id, $user_id)) {
            echo json_encode(['message' => 'Invoice deleted.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete invoice.']);
        }
    }

    public function addItem($id) {
        $user_id = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $existing = $this->invoice->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found.']);
            return;
        }

        if (empty($data['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Item description is required.']);
            return;
        }

        if ($this->invoice->addItem($id, $data['description'], $data['quantity'] ?? 1, $data['unit_price'] ?? 0)) {
            http_response_code(201);
            echo json_encode(['message' => 'Item added.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add item.']);
        }
    }

    public function deleteItem($id, $item_id) {
        $user_id = $this->requireAuth();

        $existing = $this->invoice->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found.']);
            return;
        }

        if ($this->invoice->deleteItem($item_id, $id)) {
            echo json_encode(['message' => 'Item deleted.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete item.']);
        }
    }

    public function stats() {
        $user_id = $this->requireAuth();
        $stats = $this->invoice->getStats($user_id);
        echo json_encode(['stats' => $stats]);
    }
}
