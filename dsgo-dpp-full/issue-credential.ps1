param(
  [string]$TemplateId = "iShare",
  [string]$ApiKey = $env:CREDENCO_API_KEY,
  [string]$BaseUrl = "https://wallet.acc.credenco.com",
  [string]$CallbackUrl = "https://example.com/callback/status"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw "Missing API key. Set CREDENCO_API_KEY or pass -ApiKey."
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$uri = "$BaseUrl/api/v2/credential/issue"
$headers = @{
  "Content-Type" = "application/json"
  "Accept" = "*/*"
  "x-api-key" = $ApiKey
}

$body = @{
  claims = @{
    testcred = $true
  }
  callback = @{
    status = "issue_completed,error"
    url = $CallbackUrl
  }
  correlation_id = ""
  template_id = $TemplateId
  request_uri_base = "https://wallet.credenco.com"
  qr_code = @{
    size = 400
    color_dark = "#000000"
    color_light = "#ffffff"
    padding = 16
    logo_uri = "https://example.com/logo.png"
    logo_size = 20
    marker_color = "The same value of color_dark"
  }
}

$json = $body | ConvertTo-Json -Depth 10
$response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $json

$response | ConvertTo-Json -Depth 20
