$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MGZlMjg4ZS1kNTNhLTQ4NWEtYWMzNi1iOWM2NjVjNDU1ODIiLCJlbWFpbCI6InRlc3Q1QGV4YW1wbGUuY29tIiwiaWF0IjoxNzcxNTEyMDk2LCJleHAiOjE3NzIxMTY4OTZ9.vQA5-Y9Chaxcu3gJWiEBJzxAzTVUJ00ubqJKXXDMGmY"

$headers = @{
    Authorization = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/todos" -Method GET -Headers $headers -UseBasicParsing
$response.Content
