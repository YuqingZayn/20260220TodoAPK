# 测试指定账号登录
$baseUrl = "http://localhost:3000"
$loginBody = '{"email":"1961647257@qq.com","password":"abcd123456789"}'

Write-Host "Testing login with: 1961647257@qq.com" -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing

Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host "Response: $($response.Content)" -ForegroundColor Yellow
