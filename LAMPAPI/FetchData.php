<?php


$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");

if ($conn->connect_error){
	die("Connection failed" . $conn->connect_error);

}




if ($_SERVER['REQUEST_METHOD'] === 'GET') {
   $userId = $_GET['userId']; 
   $sql = "SELECT ID, UserID, FirstName, LastName, Phone, Email FROM Contacts WHERE UserID = $userId";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        
        $data = $result->fetch_all(MYSQLI_ASSOC);

        
	header('Content-Type: application/json');
        echo json_encode($data);
    } else {
        
        header('Content-Type: application/json');
        echo json_encode(["message" => "No records found"]);
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(["error" => "Invalid request method"]);
}

$conn->close();
?>
