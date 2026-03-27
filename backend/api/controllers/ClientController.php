<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Client.php';

class ClientController {

    private $db;
    private $client;
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
        $this->client = new Client($this->db);
        $this->client->user_id = $this->user_id;
    }

    public function index() {
        $clients = $this->client->getAll();
        return $clients;
    }

    public function show($id) {
        $this->client->id = (int) $id;
        $client = $this->client->getById();
        if ($client) {
            return $client;
        }
        http_response_code(404);
        return ['error' => 'Client not found.'];
    }

    public function store($data) {
        if (empty($data['name']) || empty($data['email'])) {
            http_response_code(400);
            return ['error' => 'Name and email are required.'];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            return ['error' => 'Invalid email address.'];
        }

        $this->client->name    = $data['name'];
        $this->client->email   = $data['email'];
        $this->client->phone   = $data['phone'] ?? '';
        $this->client->address = $data['address'] ?? '';
        $this->client->company = $data['company'] ?? '';

        if ($this->client->create()) {
            http_response_code(201);
            return $this->client->getById();
        }
        http_response_code(500);
        return ['error' => 'Failed to create client.'];
    }

    public function update($id, $data) {
        $this->client->id = (int) $id;
        if (!$this->client->getById()) {
            http_response_code(404);
            return ['error' => 'Client not found.'];
        }

        $this->client->name    = $data['name'] ?? '';
        $this->client->email   = $data['email'] ?? '';
        $this->client->phone   = $data['phone'] ?? '';
        $this->client->address = $data['address'] ?? '';
        $this->client->company = $data['company'] ?? '';

        if ($this->client->update()) {
            return $this->client->getById();
        }
        http_response_code(500);
        return ['error' => 'Failed to update client.'];
    }

    public function destroy($id) {
        $this->client->id = (int) $id;
        if (!$this->client->getById()) {
            http_response_code(404);
            return ['error' => 'Client not found.'];
        }

        if ($this->client->delete()) {
            return ['message' => 'Client deleted successfully.'];
        }
        http_response_code(500);
        return ['error' => 'Failed to delete client.'];
    }
}
