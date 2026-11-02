Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
foreach ($size in @(180, 192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#3e5c49'))
    $graphics.ScaleTransform($size / 100.0, $size / 100.0)
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#f8f7f2'), 3)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($pen, 50, 73, 50, 44)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddBezier(50, 59, 30, 59, 26, 43, 30, 32)
    $path.AddBezier(30, 32, 46, 32, 54, 45, 50, 59)
    $graphics.DrawPath($pen, $path)
    $path.Dispose()
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddBezier(51, 48, 48, 31, 60, 23, 73, 26)
    $path.AddBezier(73, 26, 74, 40, 65, 49, 51, 48)
    $graphics.DrawPath($pen, $path)
    $filename = if ($size -eq 180) { 'apple-touch-icon.png' } else { "icon-$size.png" }
    $bitmap.Save((Join-Path $projectRoot "public/$filename"), [System.Drawing.Imaging.ImageFormat]::Png)
    $path.Dispose()
    $pen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
