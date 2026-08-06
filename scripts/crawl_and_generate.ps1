<#
.SYNOPSIS
    Crawl all KOSPI/KOSDAQ stocks from NAVER and generate docs/krx_rankings.json
.DESCRIPTION
    LEGACY FALLBACK (Windows without Python).
    Fetches ALL stocks from KOSPI and KOSDAQ via NAVER's mobile API,
    computes a simple NOW score (price/avg_price), and writes the full ranked
    universe to the site data file.

    NOTE: This does NOT run the full multi-factor scoring engine
    (scripts/scoring.py). For the complete methodology use the Python pipeline:
        python scripts/fetch_full_data.py
        python scripts/generate_site_data.py
#>

$ErrorActionPreference = "Continue"
$pageSize = 20
$headers = @{
    "User-Agent" = "Mozilla/5.0"
    "Referer"    = "https://m.stock.naver.com/domestic/stock/005930"
}

$allStocks = [System.Collections.ArrayList]::new()

function Fetch-Market {
    param([string]$market)

    $page = 1
    $fetched = $true
    while ($fetched) {
        $url = "https://m.stock.naver.com/api/stocks/marketValue/${market}?page=${page}&pageSize=${pageSize}"
        try {
            $resp = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction Stop
        } catch {
            Write-Host "  [WARN] Failed page $page for ${market}: $($_.Exception.Message)"
            break
        }
        $totalCount = $resp.totalCount
        $stocks = $resp.stocks
        if (-not $stocks -or $stocks.Count -eq 0) { break }

        foreach ($item in $stocks) {
            $null = $allStocks.Add(@{
                ticker     = $item.itemCode
                name       = $item.stockName
                price      = if ($item.closePriceRaw) { [double]$item.closePriceRaw } else { 0 }
                change_pct = if ($item.fluctuationsRatio) { [double]$item.fluctuationsRatio } else { 0 }
                market     = $market
            })
        }

        Write-Host "  ${market} page ${page}: got $($stocks.Count) stocks (total: $totalCount)"
        $page++
        if (($page - 1) * $pageSize -ge $totalCount) { break }
        Start-Sleep -Milliseconds 350
    }
    Write-Host "  Done fetching ${market}. Total so far: $($allStocks.Count)"
}

Write-Host "Fetching KOSPI stocks..."
Fetch-Market "KOSPI"
Write-Host "Fetching KOSDAQ stocks..."
Fetch-Market "KOSDAQ"

Write-Host "`nTotal stocks fetched: $($allStocks.Count)"

$valid = $allStocks | Where-Object { $_.price -gt 0 }
$validCount = $valid.Count
Write-Host "Stocks with price > 0: $validCount"

$avgPrice = ($valid | Measure-Object -Property price -Average).Average
Write-Host "Average price across universe: $([math]::Round($avgPrice, 2))"

$ranked = $valid |
    Select-Object ticker, name, price, change_pct,
        @{ N="score"; E={ [math]::Round($_.price / $avgPrice, 4) } } |
    Sort-Object score -Descending

# Build the FULL ranked universe (not just top 10) for the live site.
$output = [System.Collections.ArrayList]::new()
foreach ($s in $ranked) {
    $null = $output.Add([PSCustomObject]@{
        ticker     = $s.ticker
        name       = $s.name
        price      = $s.price
        change_pct = $s.change_pct
        score      = $s.score
    })
}

$siteData = [PSCustomObject]@{
    index_value   = [math]::Round($avgPrice, 0)
    date          = (Get-Date -Format "yyyy-MM-dd")
    universe_size = $validCount
    source        = "naver_stock_data (legacy PowerShell fallback)"
    rankings      = $output
}

$json = $siteData | ConvertTo-Json -Depth 5
Write-Host "`nGenerated JSON:"
Write-Host $json

$json | Set-Content -Path "docs/krx_rankings.json" -Encoding UTF8
Write-Host "`nWrote $($output.Count) rankings to docs/krx_rankings.json"

# Echo the top 10 for quick verification
Write-Host "`n=== TOP 10 STOCKS BY NOW SCORE ==="
$output | Select-Object -First 10 | Format-Table ticker, name, @{N="price";E={$_.price.ToString("N0")}}, change_pct, score -AutoSize
