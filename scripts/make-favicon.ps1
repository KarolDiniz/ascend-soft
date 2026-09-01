Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class IconMaker {
  public static Color SampleBg(Bitmap bmp) {
    Color a = bmp.GetPixel(2, 2);
    Color b = bmp.GetPixel(bmp.Width - 3, 2);
    Color c = bmp.GetPixel(2, bmp.Height - 3);
    Color d = bmp.GetPixel(bmp.Width - 3, bmp.Height - 3);
    return Color.FromArgb(
      (a.R + b.R + c.R + d.R) / 4,
      (a.G + b.G + c.G + d.G) / 4,
      (a.B + b.B + c.B + d.B) / 4
    );
  }

  public static Rectangle FindBounds(Bitmap bmp, Color bg, int threshSq) {
    int minX = bmp.Width, minY = bmp.Height, maxX = 0, maxY = 0;
    bool found = false;
    for (int y = 0; y < bmp.Height; y++) {
      for (int x = 0; x < bmp.Width; x++) {
        Color p = bmp.GetPixel(x, y);
        int dr = p.R - bg.R, dg = p.G - bg.G, db = p.B - bg.B;
        if (dr * dr + dg * dg + db * db > threshSq) {
          found = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) return new Rectangle(0, 0, bmp.Width, bmp.Height);
    return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
  }

  public static Bitmap MakeSquare(Bitmap src, Rectangle bounds, Color bg, float padFrac) {
    int pad = Math.Max(8, (int)Math.Round(Math.Max(bounds.Width, bounds.Height) * padFrac));
    int side = Math.Max(bounds.Width, bounds.Height) + pad * 2;
    Bitmap square = new Bitmap(side, side, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(square)) {
      g.Clear(bg);
      g.InterpolationMode = InterpolationMode.NearestNeighbor;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      int dx = (side - bounds.Width) / 2;
      int dy = (side - bounds.Height) / 2;
      g.DrawImage(src, new Rectangle(dx, dy, bounds.Width, bounds.Height), bounds, GraphicsUnit.Pixel);
    }
    return square;
  }

  public static void SaveResized(Bitmap src, int size, string path) {
    Bitmap outBmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(outBmp)) {
      g.Clear(Color.White);
      g.CompositingQuality = CompositingQuality.HighQuality;
      g.InterpolationMode = size <= 48
        ? InterpolationMode.HighQualityBicubic
        : InterpolationMode.HighQualityBicubic;
      g.SmoothingMode = SmoothingMode.HighQuality;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      g.DrawImage(src, 0, 0, size, size);
    }
    outBmp.Save(path, ImageFormat.Png);
    outBmp.Dispose();
  }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$public = Join-Path $root "public"
$srcPath = Join-Path $public "icon-source.png"

$img = New-Object System.Drawing.Bitmap $srcPath
$bg = [IconMaker]::SampleBg($img)
$ratio = $img.Width / [double]$img.Height
$alreadySquare = [Math]::Abs($ratio - 1) -lt 0.08

if ($alreadySquare) {
  Write-Host ("fonte quadrada {0}x{1} bg #{2:X2}{3:X2}{4:X2}" -f $img.Width, $img.Height, $bg.R, $bg.G, $bg.B)
  $square = $img
} else {
  $bounds = [IconMaker]::FindBounds($img, $bg, 1800)
  Write-Host ("bg #{0:X2}{1:X2}{2:X2} bounds {3}" -f $bg.R, $bg.G, $bg.B, $bounds)
  $square = [IconMaker]::MakeSquare($img, $bounds, $bg, 0.10)
}

[IconMaker]::SaveResized($square, 32, (Join-Path $public "favicon-32.png"))
[IconMaker]::SaveResized($square, 48, (Join-Path $public "favicon-48.png"))
[IconMaker]::SaveResized($square, 180, (Join-Path $public "apple-touch-icon.png"))
[IconMaker]::SaveResized($square, 192, (Join-Path $public "favicon-192.png"))
[IconMaker]::SaveResized($square, 512, (Join-Path $public "og-image.png"))

if (-not [object]::ReferenceEquals($square, $img)) { $square.Dispose() }
$img.Dispose()

Write-Host "ícones gerados"
