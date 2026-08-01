$shades = @(
  @("001", "red-wine"),
  @("002", "love-red"),
  @("003", "toffee"),
  @("004", "bean-red"),
  @("005", "cocoa"),
  @("006", "valentine-red"),
  @("007", "malt"),
  @("008", "peach-melody"),
  @("009", "tapioca-cream"),
  @("010", "speckletone-wine"),
  @("011", "milky-chocolate"),
  @("012", "rust"),
  @("013", "irish-cream"),
  @("014", "almond-joy"),
  @("015", "cranberry"),
  @("016", "moonshine"),
  @("017", "crimson-silk"),
  @("018", "candy-floss"),
  @("019", "guava-jelly"),
  @("020", "chilli-red"),
  @("021", "indian-red"),
  @("022", "brown-sugar"),
  @("023", "burgundy"),
  @("024", "bohemian-princess"),
  @("025", "pecan"),
  @("026", "rouge"),
  @("027", "dark-pink"),
  @("028", "chestnut"),
  @("029", "pine-cone"),
  @("030", "brick-red")
)

$results = @()
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

foreach ($s in $shades) {
  $num = $s[0]
  $slug = $s[1]
  $n = [int]$num
  $base = 2925 + ($n - 1) * 10
  $found = $null

  for ($delta = -12; $delta -le 12; $delta++) {
    if ($found) { break }
    $suffix = $base + $delta
    $barcode = "520692901{0:D4}" -f $suffix
    $urls = @(
      "https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-$num-$slug-4-5gr-$barcode/",
      "https://kpdhellas.gr/elixir-kissproof-lip-mat-$num-$slug-4-5gr-$barcode/"
    )
    foreach ($url in $urls) {
      try {
        $html = curl.exe -sL -A $ua $url 2>$null
        if ($html -match "Κωδικός:\s*(520692901\d{4})") {
          $code = $Matches[1]
          if ($code -eq $barcode -and ($html -match "#$num" -or $html -match " #$n ")) {
            $found = $code
            break
          }
        }
      } catch {}
    }
  }

  $results += [PSCustomObject]@{ num = $num; slug = $slug; barcode = $found }
  Write-Host "$num $slug -> $(if ($found) { $found } else { 'MISSING' })"
}

$results | ConvertTo-Json | Set-Content "scripts/_tmp-kplm-verified.json" -Encoding UTF8
