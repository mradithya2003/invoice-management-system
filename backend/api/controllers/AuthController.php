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

    public function register($data) {
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            return ['error' => 'Name, email, and password are required.'];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            return ['error' => 'Invalid email address.'];
        }

        if (strlen($data['password']) < 6) {
            http_response_code(400);
            return ['error' => 'Password must be at least 6 characters.'];
        }

        $this->user->email = $data['email'];
        if ($this->user->emailExists()) {
            http_response_code(409);
            return ['error' => 'Email already registered.'];
        }

        $this->user->name     = $data['name'];
        $this->user->password = $data['password'];

        if ($this->user->register()) {
            session_start();
            $_SESSION['user_id'] = $this->user->id;
            http_response_code(201);
            return [
                'message' => 'User registered successfully.',
                'user' => [
                    'id'    => $this->user->id,
                    'name'  => $this->user->name,
                    'email' => $this->user->email,
                ],
            ];
        }

        http_response_code(500);
        return ['error' => 'Registration failed.'];
    }

    public function login($data) {
        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            return ['error' => 'Email and password are required.'];
        }

        $this->user->email    = $data['email'];
        $this->user->password = $data['password'];

        if ($this->user->login()) {
            session_start();
            $_SESSION['user_id'] = $this->user->id;
            return [
                'message' => 'Login successful.',
                'user' => [
                    'id'    => $this->user->id,
                    'name'  => $this->user->name,
                    'email' => $this->user->email,
                ],
            ];
        }

        http_response_code(401);
        return ['error' => 'Invalid email or password.'];
    }

    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_destroy();
        return ['message' => 'Logged out successfully.'];
    }

    public function getUser() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['user_id'])) {
            http_response_code(401);
            return ['error' => 'Not authenticated.'];
        }

        $userData = $this->user->getById($_SESSION['user_id']);
        if ($userData) {
            return ['user' => $userData];
        }

        http_response_code(404);
        return ['error' => 'User not found.'];
    }
}
