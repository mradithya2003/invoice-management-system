<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/User.php';

class AuthController {

    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, email, and password are required.']);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email address.']);
            return;
        }

        if (strlen($data['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters.']);
            return;
        }

        $this->user->email = $data['email'];
        if ($this->user->emailExists()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already in use.']);
            return;
        }

        $this->user->name     = $data['name'];
        $this->user->password = $data['password'];

        if ($this->user->register()) {
            $_SESSION['user_id'] = $this->db->lastInsertId();
            http_response_code(201);
            echo json_encode(['message' => 'Registration successful.', 'user_id' => $_SESSION['user_id']]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed.']);
        }
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required.']);
            return;
        }

        $this->user->email    = $data['email'];
        $this->user->password = $data['password'];

        if ($this->user->login()) {
            $_SESSION['user_id'] = $this->user->id;
            echo json_encode([
                'message' => 'Login successful.',
                'user' => [
                    'id'    => $this->user->id,
                    'name'  => $this->user->name,
                    'email' => $this->user->email,
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password.']);
        }
    }

    public function logout() {
        session_destroy();
        echo json_encode(['message' => 'Logged out successfully.']);
    }

    public function getUser() {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized.']);
            return;
        }

        $user = $this->user->getById($_SESSION['user_id']);
        if ($user) {
            echo json_encode(['user' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
        }
    }
}
