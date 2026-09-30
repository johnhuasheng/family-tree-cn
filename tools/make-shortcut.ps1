# 在桌面创建「家族辈分谱」快捷方式：直接调用启动脚本（不弹黑色窗口），用印章图标
$ErrorActionPreference = 'Stop'
$here   = Split-Path -Parent $PSScriptRoot
$desk   = [Environment]::GetFolderPath('Desktop')
$ps     = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$script = Join-Path $PSScriptRoot 'launch.ps1'
$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $desk '家族辈分谱.lnk'))
$lnk.TargetPath       = $ps
$lnk.Arguments        = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $script + '"'
$lnk.WorkingDirectory = $here
$lnk.IconLocation     = (Join-Path $PSScriptRoot 'family.ico') + ',0'
$lnk.WindowStyle      = 7
$lnk.Description      = '打开家族辈分谱'
$lnk.Save()
Write-Host '已在桌面创建（或更新）快捷方式：家族辈分谱'
