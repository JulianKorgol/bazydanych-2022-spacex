<?php
require_once "sql.php";

$username = $password = $confirm_password = "";
$username_err = $password_err = $confirm_password_err = "";


?>
<!DOCTYPE html>
<html lang = "pl">
<head>
    <meta charset = "UTF-8">
    <meta http-equiv = "X-UA-Compatible" content = "IE=edge">
    <link rel = "stylesheet" type = "text/css" href = "./CSS/reset.css">
    <link rel = "stylesheet" type = "text/css" href = "./CSS/style.css">
    <meta name = "viewport" content = "width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body>
<div class = "Login">
    <form>
        <input type = "text" placeholder = "Login...">
        <input type = "password" placeholder = "Password...">
        <a href = "main.html">Click</a>
    </form>
</div>
<script src="script.js"></script>
</body>
</html>