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
    "tests/stage4e_resource_suitability.ts",
    "tests/stage4e_scientific_evaluation.ts",
    "tests/stage4e_e2e_workflow.ts"
)

$totalSuites = $suites.Count
$passedSuites = 0

Write-Host "========================================================================"
Write-Host "Anviksa - Full Platform Regression and Stage 4E-IMP-05 Acceptance Suite"
Write-Host "Total Suites to Execute: $totalSuites"
Write-Host "========================================================================`n"

foreach ($suite in $suites) {
    Write-Host "[RUNNING] Suite: $suite ..."
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    
    npx tsx $suite
    $exitCode = $LASTEXITCODE
    $sw.Stop()
    
    if ($exitCode -ne 0) {
        Write-Host "[FAILED] $suite (Exit code: $exitCode, Elapsed: $($sw.Elapsed.TotalSeconds.ToString('F1'))s)"
        exit 1
    } else {
        $passedSuites++
        Write-Host "[PASSED] $suite (Elapsed: $($sw.Elapsed.TotalSeconds.ToString('F1'))s)`n"
    }
}

Write-Host "========================================================================"
Write-Host "ALL $passedSuites / $totalSuites TEST SUITES PASSED CLEANLY (EXIT CODE 0)"
Write-Host "========================================================================`n"

Write-Host "[RUNNING] TypeScript strict typecheck (npx tsc --noEmit)..."
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAILED] TypeScript typecheck failed (Exit code: $LASTEXITCODE)"
    exit 1
}
Write-Host "[PASSED] TypeScript strict typecheck passed cleanly.`n"

Write-Host "[RUNNING] Production build (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAILED] Production build failed (Exit code: $LASTEXITCODE)"
    exit 1
}
Write-Host "`n========================================================================"
Write-Host "COMPLETE VERIFICATION SUITE & PRODUCTION BUILD SUCCEEDED (EXIT CODE 0)"
Write-Host "========================================================================"
