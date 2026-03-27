<?php

// Load environment variables from .env
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = array_map('trim', explode('=', $line, 2));
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
        }
    }
}

// Start session
session_start();

// CORS Headers
header('Access-Control-Allow-Origin: ' . ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Require controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/InvoiceController.php';

// Simple router
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip base path (e.g. /api)
$base   = '/api';
if (strpos($uri, $base) === 0) {
    $uri = substr($uri, strlen($base));
}
$uri = rtrim($uri, '/') ?: '/';

$segments = array_filter(explode('/', $uri));
$segments = array_values($segments);

// Route: /auth/*
if (isset($segments[0]) && $segments[0] === 'auth') {
    $auth = new AuthController();
    $action = $segments[1] ?? '';

    switch ($action) {
        case 'register':
            if ($method === 'POST') $auth->register();
            break;
        case 'login':
            if ($method === 'POST') $auth->login();
            break;
        case 'logout':
            if ($method === 'POST') $auth->logout();
            break;
        case 'user':
            if ($method === 'GET') $auth->getUser();
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Auth endpoint not found.']);
    }

// Route: /clients/*
} elseif (isset($segments[0]) && $segments[0] === 'clients') {
    $ctrl = new ClientController();
    $id   = $segments[1] ?? null;

    if ($id === null) {
        if ($method === 'GET')  $ctrl->index();
        elseif ($method === 'POST') $ctrl->store();
        else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
    } else {
        if ($method === 'GET')    $ctrl->show($id);
        elseif ($method === 'PUT')    $ctrl->update($id);
        elseif ($method === 'DELETE') $ctrl->destroy($id);
        else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
    }

// Route: /invoices/*
} elseif (isset($segments[0]) && $segments[0] === 'invoices') {
    $ctrl    = new InvoiceController();
    $id      = $segments[1] ?? null;
    $action  = $_GET['action'] ?? null;
    $item_id = $_GET['item_id'] ?? null;

    if ($id === null) {
        if ($method === 'GET')  $ctrl->index();
        elseif ($method === 'POST') $ctrl->store();
        else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
    } elseif ($id === 'stats') {
        if ($method === 'GET') $ctrl->stats();
        else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
    } else {
        if ($action === 'item') {
            if ($method === 'POST')   $ctrl->addItem($id);
            elseif ($method === 'DELETE' && $item_id) $ctrl->deleteItem($id, $item_id);
            else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
        } else {
            if ($method === 'GET')    $ctrl->show($id);
            elseif ($method === 'PUT')    $ctrl->update($id);
            elseif ($method === 'DELETE') $ctrl->destroy($id);
            else { http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); }
        }
    }

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found.']);
}
