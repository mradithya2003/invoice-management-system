<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Client.php';

class ClientController {

    private $db;
    private $client;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->client = new Client($this->db);
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
        $clients = $this->client->getAll($user_id);
        echo json_encode(['clients' => $clients]);
    }

    public function show($id) {
        $user_id = $this->requireAuth();
        $client = $this->client->getById($id, $user_id);
        if ($client) {
            echo json_encode(['client' => $client]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Client not found.']);
        }
    }

    public function store() {
        $user_id = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Client name is required.']);
            return;
        }

        $this->client->user_id = $user_id;
        $this->client->name    = $data['name'];
        $this->client->email   = $data['email'] ?? '';
        $this->client->phone   = $data['phone'] ?? '';
        $this->client->address = $data['address'] ?? '';
        $this->client->company = $data['company'] ?? '';

        if ($this->client->create()) {
            http_response_code(201);
            echo json_encode(['message' => 'Client created.', 'id' => $this->client->id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create client.']);
        }
    }

    public function update($id) {
        $user_id = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $existing = $this->client->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Client not found.']);
            return;
        }

        $this->client->id      = $id;
        $this->client->user_id = $user_id;
        $this->client->name    = $data['name'] ?? $existing['name'];
        $this->client->email   = $data['email'] ?? $existing['email'];
        $this->client->phone   = $data['phone'] ?? $existing['phone'];
        $this->client->address = $data['address'] ?? $existing['address'];
        $this->client->company = $data['company'] ?? $existing['company'];

        if ($this->client->update()) {
            echo json_encode(['message' => 'Client updated.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update client.']);
        }
    }

    public function destroy($id) {
        $user_id = $this->requireAuth();

        $existing = $this->client->getById($id, $user_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Client not found.']);
            return;
        }

        if ($this->client->delete($id, $user_id)) {
            echo json_encode(['message' => 'Client deleted.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete client.']);
        }
    }
}
