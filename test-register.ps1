$body = @{
    email = "test5@example.com"
    password = "123456"
} | ConvertTo-Json -Compress

$response = Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content
