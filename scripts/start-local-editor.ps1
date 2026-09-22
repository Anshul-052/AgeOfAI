$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$workspaceRoot = Split-Path $repoRoot -Parent
$env:OLLAMA_MODELS = Join-Path $workspaceRoot 'OllamaModels'
$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
$ollamaPath = if ($ollamaCommand) { $ollamaCommand.Source } else { $null }
if (-not $ollamaPath) {
  $installedCandidate = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
  $portableCandidate = Join-Path $workspaceRoot 'Ollama\ollama.exe'
  if (Test-Path -LiteralPath $installedCandidate) { $ollamaPath = $installedCandidate }
  elseif (Test-Path -LiteralPath $portableCandidate) { $ollamaPath = $portableCandidate }
}
if (-not $ollamaPath) { throw 'Ollama is not installed. Run scripts\setup-local-editor.ps1 first.' }

try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null }
catch {
  Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

Set-Location -LiteralPath $repoRoot
npm run editor:local
