# Crawl all KOSPI and KOSDAQ stocks from NAVER Finance and generate
# the top-10 NOW-index rankings for the live site (docs/krx_rankings.json).
#
# This is a PowerShell fallback crawler for systems without Python.
# The canonical implementation is scripts/fetch_naver_data.py.

$ErrorActionPreference = "Stop"
$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    "Referer"    = "https://m.stock.naver.com/domestic/stock/005930"
}
$pageSize = 20
$allStocks = [System.Collections.Generic.List[object]]::new()

function Fetch-Market {
    param([string]$market)

$page = 1
    $total = 0
    do {
        $url = "https://m.stock.naver.com/api/stocks/marketValue/${market}?page=${page}&pageSize=${pageSize}"
        try {
            $r = Invoke-RestMethod -Uri $url -Headers $headers
        } catch {
            Write-Host "Error on page $page for ${market}: $($_.Exception.Message)"
            break
        }
        $total = $r.totalCount
        foreach ($item in $r.stocks) {
            $price = 0
            if ($item.closePriceRaw) { $price = [double]$item.closePriceRaw }
            $chgPct = 0
            if ($item.fluctuationsRatio) { $chgPct = [double]$item.fluctuationsRatio }
            $allStocks.Add([pscustomobject]@{
                ticker     = $item.itemCode
                name       = $item.stockName
                price      = $price
                change_pct = $chgPct
                market     = $market
            })
        }
        $page++
        Start-Sleep -Milliseconds 300
    } while (($page - 1) * $pageSize -lt $total)
Write-Host "Fetched ${market}: ${total} stocks"
}

Fetch-Market "KOSPI"
Fetch-Market "KOSDAQ"

Write-Host "Total stocks: $($allStocks.Count)"

# Compute NOW score = price / average price across the universe
$valid = @($allStocks | Where-Object { $_.price -gt 0 })
$avg = ($valid | Measure-Object -Property price -Average).Average
Write-Host "Average price: $avg"

$ranked = $valid |
    Select-Object ticker, name, price, change_pct,
        @{ Name = "score"; Expression = { [math]::Round($_.price / $avg, 4) } } |
    Sort-Object -Property score -Descending

$top10 = @($ranked | Select-Object -First 10)

$data = [ordered]@{
    index_value   = [math]::Round($avg, 0)
    date          = (Get-Date -Format "yyyy-MM-dd")
    universe_size = $valid.Count
    rankings      = $top10
}

$data | ConvertTo-Json -Depth 5 | Set-Content -Path "docs/krx_rankings.json" -Encoding UTF8
Write-Host "Wrote top 10 rankings to docs/krx_rankings.json"
