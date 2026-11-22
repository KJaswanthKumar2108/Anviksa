$ErrorActionPreference = "Stop"

$suites = @(
    "tests/stage4a_database_security.ts",
    "tests/stage4b_discovery_ingestion.ts",
    "tests/stage4c_extraction_verification.ts",
    "tests/stage4d_validation_verification.ts",
    "tests/stage4d_1_adversarial_verification.ts",
    "tests/stage4e_opportunity_intelligence.ts",
    "tests/stage4e_hypothesis_engine.ts",
    "tests/stage4e_experiment_protocol.ts",
    "tests/stage4e_e2e_workflow.ts"
)

$totalSuites = $suites.Count
$passedSuites = 0

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Anvīkṣā — Full Platform Regression & Stage 4E-IMP-03 Acceptance Suite" -ForegroundColor Cyan
Write-Host "Total Suites to Execute: $totalSuites" -ForegroundColor Cyan
Write-Host "========================================================================`n" -ForegroundColor Cyan

foreach ($suite in $suites) {
    Write-Host ">>> Running Suite: $suite ..." -ForegroundColor Yellow
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    
    npx tsx $suite
    $exitCode = $LASTEXITCODE
    $sw.Stop()
    
    if ($exitCode -ne 0) {
        Write-Host ">>> FAILED: $suite (Exit code: $exitCode, Elapsed: $($sw.Elapsed.TotalSeconds.ToString('F1'))s)" -ForegroundColor Red
        exit 1
    } else {
        $passedSuites++
        Write-Host ">>> PASSED: $suite (Elapsed: $($sw.Elapsed.TotalSeconds.ToString('F1'))s)`n" -ForegroundColor Green
    }
}

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "ALL $passedSuites / $totalSuites TEST SUITES PASSED CLEANLY (EXIT CODE 0)" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
