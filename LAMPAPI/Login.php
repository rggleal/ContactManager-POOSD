<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'http://team15poosd.xyz',
];

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");

}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function getRequestInfo() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sendJson($obj, $status = 200) {
    http_response_code($status);
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== Main =====
$inData = getRequestInfo();

$login = $inData['login'] ?? '';
$password = $inData['password'] ?? '';

if ($login === '' || $password === '') {
    sendJson(['id'=>0,'firstName'=>'','lastName'=>'','error'=>'Missing login or password'], 400);
}

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
if ($conn->connect_error) {
    sendJson(['id'=>0,'firstName'=>'','lastName'=>'','error'=>$conn->connect_error], 500);
}

$conn->set_charset('utf8mb4');

$stmt = $conn->prepare("SELECT ID, firstName, lastName FROM Users WHERE Login = ? AND Password = ?");
$stmt->bind_param("ss", $login, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    sendJson(['id'=>(int)$row['ID'], 'firstName'=>$row['firstName'], 'lastName'=>$row['lastName'], 'error'=>'']);
} else {
    sendJson(['id'=>0,'firstName'=>'','lastName'=>'','error'=>'No Records Found'], 401);
}
