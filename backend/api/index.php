<?php

// Load environment variables from .env if available
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);
            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
            }
        }
    }
}

// CORS headers
$allowedOrigin = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$allowedOrigin}");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Parse URL
$requestUri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptDir     = dirname($_SERVER['SCRIPT_NAME']);
$path          = '/' . ltrim(str_replace($scriptDir, '', $requestUri), '/');
$method        = $_SERVER['REQUEST_METHOD'];
$queryParams   = $_GET;
$body          = json_decode(file_get_contents('php://input'), true) ?? [];

// Simple router
$segments = explode('/', trim($path, '/'));
$resource = $segments[0] ?? '';
$id       = $segments[1] ?? null;

require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/InvoiceController.php';

switch ($resource) {

    // ---- Auth ----
    case 'auth':
        $auth   = new AuthController();
        $action = $id; // register | login | logout | user
        if ($method === 'POST' && $action === 'register') {
            echo json_encode($auth->register($body));
        } elseif ($method === 'POST' && $action === 'login') {
            echo json_encode($auth->login($body));
        } elseif ($method === 'POST' && $action === 'logout') {
            echo json_encode($auth->logout());
        } elseif ($method === 'GET' && $action === 'user') {
            echo json_encode($auth->getUser());
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Auth endpoint not found.']);
        }
        break;

    // ---- Clients ----
    case 'clients':
        $ctrl = new ClientController();
        if ($method === 'GET' && !$id) {
            echo json_encode($ctrl->index());
        } elseif ($method === 'GET' && $id) {
            echo json_encode($ctrl->show($id));
        } elseif ($method === 'POST' && !$id) {
            echo json_encode($ctrl->store($body));
        } elseif ($method === 'PUT' && $id) {
            echo json_encode($ctrl->update($id, $body));
        } elseif ($method === 'DELETE' && $id) {
            echo json_encode($ctrl->destroy($id));
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed.']);
        }
        break;

    // ---- Invoices ----
    case 'invoices':
        $ctrl = new InvoiceController();

        if ($method === 'GET' && !$id) {
            echo json_encode($ctrl->index());
        } elseif ($method === 'GET' && $id === 'stats') {
            echo json_encode($ctrl->stats());
        } elseif ($method === 'GET' && $id) {
            echo json_encode($ctrl->show($id));
        } elseif ($method === 'POST' && !$id) {
            echo json_encode($ctrl->store($body));
        } elseif ($method === 'PUT' && $id) {
            echo json_encode($ctrl->update($id, $body));
        } elseif ($method === 'DELETE' && $id) {
            // Check if deleting an item
            if (isset($queryParams['item_id'])) {
                echo json_encode($ctrl->deleteItem($id, $queryParams['item_id']));
            } else {
                echo json_encode($ctrl->destroy($id));
            }
        } elseif ($method === 'POST' && $id && isset($queryParams['action']) && $queryParams['action'] === 'item') {
            echo json_encode($ctrl->addItem($id, $body));
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed.']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found.']);
}
