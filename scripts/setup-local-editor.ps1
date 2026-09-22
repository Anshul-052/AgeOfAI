$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$workspaceRoot = Split-Path $repoRoot -Parent
$portablePath = Join-Path $workspaceRoot 'Ollama\ollama.exe'
$env:OLLAMA_MODELS = Join-Path $workspaceRoot 'OllamaModels'

if (-not (Get-Command ollama -ErrorAction SilentlyContinue) -and -not (Test-Path -LiteralPath $portablePath)) {
  Write-Host 'Installing Ollama...'
  winget install --id Ollama.Ollama --exact --accept-source-agreements --accept-package-agreements --silent 2>$null
  $env:Path += ";$env:LOCALAPPDATA\Programs\Ollama"
}

$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
$ollamaPath = if ($ollamaCommand) { $ollamaCommand.Source } elseif (Test-Path -LiteralPath $portablePath) { $portablePath } else { $null }
if (-not $ollamaPath) { throw 'Ollama was installed but is not available yet. Open a new PowerShell window and run this script again.' }

try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null }
catch {
  Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

& $ollamaPath pull qwen3.5:4b
& $ollamaPath pull phi4-mini
Write-Host 'Local models are ready. Run npm run editor:local while reviewing stories.'
