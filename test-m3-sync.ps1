# M3 同步接口测试脚本

$baseUrl = "http://localhost:3000"

# 1. 登录获取 token
Write-Host "=== 1. 登录获取 token ===" -ForegroundColor Cyan
$loginBody = '{"email":"1961647257@qq.com","password":"123456"}'

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.access_token
Write-Host "Token 获取成功" -ForegroundColor Green

# 2. 测试增量同步接口（无 since 参数）
Write-Host ""
Write-Host "=== 2. 测试 GET /todos/sync (无 since) ===" -ForegroundColor Cyan
$syncResponse = Invoke-WebRequest -Uri "$baseUrl/todos/sync" -Method GET -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

$syncData = $syncResponse.Content | ConvertFrom-Json
Write-Host "变更数量: $($syncData.data.Count)" -ForegroundColor Green

# 记录当前时间作为 since
$sinceTime = (Get-Date).ToUniversalTime().ToString("o")

# 3. 创建新待办
Write-Host ""
Write-Host "=== 3. 创建新待办 ===" -ForegroundColor Cyan
$newTodoBody = '{"title":"测试M3同步","priority":3}'

$createResponse = Invoke-WebRequest -Uri "$baseUrl/todos" -Method POST -ContentType "application/json" -Body $newTodoBody -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

$newTodo = $createResponse.Content | ConvertFrom-Json
Write-Host "创建成功: $($newTodo.data.title) ID: $($newTodo.data.id)" -ForegroundColor Green

# 4. 测试增量同步（带 since）
Start-Sleep -Seconds 1
Write-Host ""
Write-Host "=== 4. 测试 GET /todos/sync?since ===" -ForegroundColor Cyan
$encodedSince = [System.Uri]::EscapeDataString($sinceTime)
$syncUrl = "$baseUrl/todos/sync?since=$encodedSince"

$syncResponse2 = Invoke-WebRequest -Uri $syncUrl -Method GET -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

$syncData2 = $syncResponse2.Content | ConvertFrom-Json
Write-Host "增量变更数量: $($syncData2.data.Count)" -ForegroundColor Green

# 5. 测试更新操作 (LWW)
Write-Host ""
Write-Host "=== 5. 测试更新操作 (LWW) ===" -ForegroundColor Cyan
$todoId = $newTodo.data.id
$updateBody = '{"title":"测试M3-已更新","completed":true}'

$updateResponse = Invoke-WebRequest -Uri "$baseUrl/todos/$todoId" -Method PUT -ContentType "application/json" -Body $updateBody -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

Write-Host "更新成功" -ForegroundColor Green

# 6. 测试软删除
Write-Host ""
Write-Host "=== 6. 测试软删除 ===" -ForegroundColor Cyan
$deleteResponse = Invoke-WebRequest -Uri "$baseUrl/todos/$todoId" -Method DELETE -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

Write-Host "删除成功 (软删除)" -ForegroundColor Green

# 7. 验证删除后列表不包含该待办
Write-Host ""
Write-Host "=== 7. 验证删除不复活 ===" -ForegroundColor Cyan
$listResponse = Invoke-WebRequest -Uri "$baseUrl/todos" -Method GET -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing

$listData = $listResponse.Content | ConvertFrom-Json
$found = $listData.data | Where-Object { $_.id -eq $todoId }
if ($found) {
    Write-Host "FAIL: 删除的待办仍在列表中" -ForegroundColor Red
} else {
    Write-Host "PASS: 删除的待办不在列表中" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
