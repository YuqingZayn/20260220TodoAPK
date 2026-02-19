$loginBody = @{
    email = "test5@example.com"
    password = "123456"
} | ConvertTo-Json -Compress

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).access_token

$headers = @{
    Authorization = "Bearer $token"
}

$todosResponse = Invoke-WebRequest -Uri "http://localhost:3000/todos" -Method GET -Headers $headers -UseBasicParsing
$todosResponse.Content
