<?php

$hosts = ['127.0.0.1', 'localhost'];
$port = 5432;
$db = 'ContentFlow';
$user = 'contenflow';
$pass = 'Asd12345--';

echo "Testing connections...\n";

foreach ($hosts as $host) {
  echo "Trying $host...\n";
  try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass);
    echo "SUCCESS: Connected to $host\n";
  } catch (PDOException $e) {
    echo "FAILED: Could not connect to $host.\n";
    echo "Error: " . $e->getMessage() . "\n";
  }
  echo "-------------------\n";
}
