# 家族辈分谱启动器：用 Edge / Chrome 的「应用窗口」打开网页（像一个独立软件）；
# 两个都找不到时，用系统默认浏览器打开。出错会弹窗说明原因。
$ErrorActionPreference = 'Stop'

function Get-AppPath([string]$exe) {
  foreach ($hive in 'HKCU:', 'HKLM:') {
    $key = "$hive\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$exe"
    $item = Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue
    if ($item -and $item.'(default)') { return $item.'(default)'.Trim('"') }
  }
  return $null
}

try {
  $root = Split-Path -Parent $PSScriptRoot
  $page = Join-Path $root '家族辈分谱.html'
  if (-not (Test-Path -LiteralPath $page)) { throw "找不到网页文件：$page" }
  $url = ([System.Uri]$page).AbsoluteUri

  $candidates = @(
    (Get-AppPath 'msedge.exe'),
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    (Get-AppPath 'chrome.exe'),
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  $browser = $candidates | Select-Object -First 1
  if ($browser) {
    Start-Process -FilePath $browser -ArgumentList @("--app=$url", '--window-size=1440,960')
  } else {
    Start-Process -FilePath $page
  }
}
catch {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show("家族辈分谱没能打开。`n`n原因：$($_.Exception.Message)`n`n可以直接双击文件夹里的「家族辈分谱.html」打开。", '家族辈分谱') | Out-Null
}
