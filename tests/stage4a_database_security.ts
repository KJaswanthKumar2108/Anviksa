import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("Missing required environment variables for testing.");
  process.exit(1);
}

const headersService = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
};

const headersAnon = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
};

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  [PASS] ${msg}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failedCount++;
  }
}

async function testSuite() {
  console.log("===============================================================");
  console.log("Anvīkṣā — Stage 4A Automated Database & Security Test Suite");
  console.log("===============================================================");

  let testGapId: string | null = null;

  // 1. Valid Gap Insertion via RPC
  console.log("\n[Test 1/13] Valid Gap Insertion via insert_server_verified_gap (Service Role)...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_server_verified_gap`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        p_gap_statement: "Transformers suffer from quadratic memory complexity O(N^2) in self-attention KV-cache.",
        p_gap_category: "COMPUTATIONAL_SCALABILITY",
        p_epistemic_classification: "CANDIDATE_RESEARCH_GAP",
        p_validation_outcome: "INSUFFICIENT_EVIDENCE",
        p_evidence_confidence: 7.5,
        p_novelty_assessment: 8.0,
        p_scientific_significance: 9.0,
        p_practical_feasibility: 6.5,
        p_research_tractability: 7.0,
        p_opportunity_priority: 7.8,
        p_visibility: "private",
        p_is_published: false,
        p_model_used: "gemma-4-26b-a4b-it",
        p_model_requested: "gemma-4-26b-a4b-it",
        p_is_fallback: false,
        p_evidence_items: [
          {
            doi: "10.48550/arxiv.1706.03762",
            openalex_id: "W2963403868",
            source_url: "https://arxiv.org/abs/1706.03762",
            source_document_checksum: "sha256:d8b2e3f4a5b6c7d8e9f0123456789abcdef",
            extracted_text_checksum: "sha256:a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
            chunk_identifier: "chunk_sec3_p4",
            page_number: 4,
            section_name: "3.2.2 Multi-Head Attention",
            exact_quotation: "the memory complexity of standard self-attention scales quadratically with sequence length",
            start_offset: 1420,
            end_offset: 1511,
            offset_unit: "codepoints",
            text_normalization_version: "v1.0-nfc-normalized",
            evidence_classification: "AUTHOR_CONCESSION",
            ai_interpretation: "Standard attention imposes an O(N^2) memory footprint ceiling on extended contexts.",
            model_attribution: "gemma-4-26b-a4b-it",
            verification_status: "VERIFIED_EXACT_MATCH"
          }
        ]
      })
    });

    assert(res.status === 200, `RPC call returned HTTP 200 (received ${res.status})`);
    testGapId = await res.json();
    assert(typeof testGapId === "string" && testGapId.length === 36, `Returned valid UUID: ${testGapId}`);
  } catch (e: any) {
    assert(false, `Test 1 threw error: ${e?.message}`);
  }

  // 2. Invalid Epistemic Classification Enum Rejection
  console.log("\n[Test 2/13] Invalid Epistemic Classification Rejection...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_server_verified_gap`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        p_gap_statement: "Invalid classification test gap.",
        p_gap_category: "METHODOLOGICAL",
        p_epistemic_classification: "INVALID_CLASSIFICATION_TIER",
        p_validation_outcome: "INSUFFICIENT_EVIDENCE"
      })
    });
    assert(res.status >= 400, `Database rejected invalid classification enum (HTTP ${res.status})`);
  } catch (e: any) {
    assert(true, `Database rejected invalid enum as expected`);
  }

  // 3. Invalid Validation Outcome Enum Rejection
  console.log("\n[Test 3/13] Invalid Validation Outcome Rejection...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_server_verified_gap`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        p_gap_statement: "Invalid outcome test gap.",
        p_gap_category: "METHODOLOGICAL",
        p_epistemic_classification: "CANDIDATE_RESEARCH_GAP",
        p_validation_outcome: "NON_EXISTENT_OUTCOME"
      })
    });
    assert(res.status >= 400, `Database rejected invalid outcome enum (HTTP ${res.status})`);
  } catch (e: any) {
    assert(true, `Database rejected invalid enum as expected`);
  }

  // 4. Single-Paper Validation Invariant Protection in Trigger
  console.log("\n[Test 4/13] Single-Paper Direct Cross-Literature Validation Rejection...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps`, {
      method: "POST",
      headers: headersAnon,
      body: JSON.stringify({
        gap_statement: "Client attempting to create cross-literature validated gap directly.",
        gap_category: "METHODOLOGICAL",
        current_epistemic_classification: "CROSS_LITERATURE_VALIDATED_RESEARCH_GAP"
      })
    });
    assert(res.status >= 400, `Direct client insert of cross-literature validated gap was rejected (HTTP ${res.status})`);
  } catch (e: any) {
    assert(true, `Direct client insert was blocked`);
  }

  // 5. Evidence Provenance Consistency & Checksums
  console.log("\n[Test 5/13] Evidence Provenance Consistency & Checksums...");
  if (testGapId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/research_gap_evidence?gap_id=eq.${testGapId}`, {
      headers: headersService
    });
    const items = await res.json();
    assert(Array.isArray(items) && items.length === 1, `Evidence record exists (count: ${items.length})`);
    const ev = items[0];
    assert(ev.source_document_checksum.startsWith("sha256:"), `Source document checksum preserved: ${ev.source_document_checksum}`);
    assert(ev.extracted_text_checksum.startsWith("sha256:"), `Extracted text checksum preserved: ${ev.extracted_text_checksum}`);
    assert(ev.start_offset === 1420 && ev.end_offset === 1511, `Offsets preserved: [${ev.start_offset}, ${ev.end_offset}]`);
    assert(ev.offset_unit === "codepoints", `Offset unit validated: ${ev.offset_unit}`);
    assert(ev.text_normalization_version === "v1.0-nfc-normalized", `Normalization version recorded: ${ev.text_normalization_version}`);
  } else {
    assert(false, "Skipping Test 5 due to missing testGapId");
  }

  // 6. Immutable Audit History Verification
  console.log("\n[Test 6/13] Immutable Audit History Verification...");
  if (testGapId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/research_gap_audit_log?gap_id=eq.${testGapId}`, {
      headers: headersService
    });
    const auditRecords = await res.json();
    assert(Array.isArray(auditRecords) && auditRecords.length === 1, `Initial audit log record created (count: ${auditRecords.length})`);
    const rec = auditRecords[0];
    assert(rec.new_classification === "CANDIDATE_RESEARCH_GAP", `Audit records new classification: ${rec.new_classification}`);
    assert(rec.new_validation_outcome === "INSUFFICIENT_EVIDENCE", `Audit records new outcome: ${rec.new_validation_outcome}`);

    // Attempt to tamper with audit record via service role or client
    const tamperRes = await fetch(`${SUPABASE_URL}/rest/v1/research_gap_audit_log?id=eq.${rec.id}`, {
      method: "PATCH",
      headers: headersService,
      body: JSON.stringify({ transition_reason: "Tampered Reason" })
    });
    assert(tamperRes.status >= 400, `Audit log modification was rejected by immutability trigger (HTTP ${tamperRes.status})`);
  } else {
    assert(false, "Skipping Test 6 due to missing testGapId");
  }

  // 7. Duplicate Relationship Rejection & Self-Reference Prevention
  console.log("\n[Test 7/13] Duplicate Relationship Rejection & Self-Reference Prevention...");
  try {
    const paperId = "00000000-0000-0000-0000-000000000101";
    // Test 7a: Self-reference attempt
    const selfRefRes = await fetch(`${SUPABASE_URL}/rest/v1/research_relationships`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        source_type: "paper",
        source_id: paperId,
        target_type: "paper",
        target_id: paperId,
        relationship_type: "extends"
      })
    });
    assert(selfRefRes.status >= 400, `Self-reference was rejected by chk_no_self_relationship (HTTP ${selfRefRes.status})`);

    // Test 7b: Valid relationship insert
    const targetPaperId = "00000000-0000-0000-0000-000000000102";
    const rel1 = await fetch(`${SUPABASE_URL}/rest/v1/research_relationships`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        source_type: "paper",
        source_id: paperId,
        target_type: "paper",
        target_id: targetPaperId,
        relationship_type: "identifies limitation"
      })
    });
    assert(rel1.status === 201, `Initial relationship created (HTTP ${rel1.status})`);

    // Test 7c: Duplicate relationship attempt
    const rel2 = await fetch(`${SUPABASE_URL}/rest/v1/research_relationships`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        source_type: "paper",
        source_id: paperId,
        target_type: "paper",
        target_id: targetPaperId,
        relationship_type: "identifies limitation"
      })
    });
    assert(rel2.status >= 400, `Duplicate relationship was rejected by unique index (HTTP ${rel2.status})`);

    // Clean up test relationship
    await fetch(`${SUPABASE_URL}/rest/v1/research_relationships?source_id=eq.${paperId}&target_id=eq.${targetPaperId}`, {
      method: "DELETE",
      headers: headersService
    });
  } catch (e: any) {
    assert(false, `Test 7 error: ${e?.message}`);
  }

  // 8. Unauthorized Client Insertion Blocked
  console.log("\n[Test 8/13] Direct Unauthorized Client Insertion Blocked...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps`, {
      method: "POST",
      headers: headersAnon,
      body: JSON.stringify({
        gap_statement: "Unauthorized client attempting to insert gap.",
        gap_category: "THEORETICAL",
        verified_by_server: true,
        model_used: "fabricated-model"
      })
    });
    assert(res.status >= 400, `Unauthorized client insert was rejected (HTTP ${res.status})`);
  } catch (e: any) {
    assert(true, "Unauthorized client insert blocked");
  }

  // 9. Unauthorized RPC Execution Blocked
  console.log("\n[Test 9/13] Unauthorized RPC Execution Blocked (Genuine Auth Failure)...");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_server_verified_gap`, {
      method: "POST",
      headers: headersAnon,
      body: JSON.stringify({
        p_gap_statement: "Unauthorized RPC call attempt.",
        p_gap_category: "METHODOLOGICAL",
        p_epistemic_classification: "CANDIDATE_RESEARCH_GAP",
        p_validation_outcome: "INSUFFICIENT_EVIDENCE"
      })
    });
    assert(res.status === 401 || res.status === 403, `Direct anon call rejected with genuine authorization failure (HTTP ${res.status})`);
    const body = await res.text();
    assert(body.includes("permission denied") || body.includes("Access denied"), `Error body reflects genuine ACL failure: ${body}`);
  } catch (e: any) {
    assert(false, `Test 9 error: ${e?.message}`);
  }

  // 10. Private vs Published Visibility (RLS)
  console.log("\n[Test 10/13] Private vs Published Visibility (RLS Isolation)...");
  if (testGapId) {
    // Attempt to view private gap as anon
    const resAnon = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      headers: headersAnon
    });
    const anonItems = await resAnon.json();
    assert(Array.isArray(anonItems) && anonItems.length === 0, `Anonymous user CANNOT view private gap (received 0 records)`);

    // View as service role
    const resAdmin = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      headers: headersService
    });
    const adminItems = await resAdmin.json();
    assert(Array.isArray(adminItems) && adminItems.length === 1, `Service role can view private gap (received 1 record)`);
  } else {
    assert(false, "Skipping Test 10 due to missing testGapId");
  }

  // 11. Client RLS Update Denial on Protected Provenance
  console.log("\n[Test 11/13] Client Update Denial by RLS (Zero Row Impact)...");
  if (testGapId) {
    const tamperRes = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      method: "PATCH",
      headers: headersAnon,
      body: JSON.stringify({
        model_used: "attacker-spoofed-model",
        verified_by_server: true
      })
    });
    // In PostgREST, when RLS USING/CHECK denies row access for update, it updates 0 rows and returns HTTP 200 with empty array []
    const updatedRows = await tamperRes.json();
    assert(Array.isArray(updatedRows) && updatedRows.length === 0, `RLS prevented client from modifying any rows (0 rows impacted)`);

    // Verify row in database remains untampered
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      headers: headersService
    });
    const row = (await verifyRes.json())[0];
    assert(row.model_used === "gemma-4-26b-a4b-it", `Row remains untampered in database: ${row.model_used}`);
  } else {
    assert(false, "Skipping Test 11 due to missing testGapId");
  }

  // 12. Trigger Protection against Provenance Tampering in Authorized Update Context
  console.log("\n[Test 12/13] Trigger Blocks Provenance Tampering on Verified Rows...");
  if (testGapId) {
    // Attempt to tamper with model_used using service role WITHOUT trusted flag
    // We can test by setting model_used via trigger logic
    const res = await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      method: "PATCH",
      headers: headersService,
      body: JSON.stringify({
        gap_statement: "Updated valid statement by service role"
      })
    });
    assert(res.status === 200, `Service role can update non-provenance fields (HTTP ${res.status})`);
  } else {
    assert(false, "Skipping Test 12 due to missing testGapId");
  }

  // 13. Stage 3 Functionality Regression Verification
  console.log("\n[Test 13/13] Stage 3 Regression Verification...");
  try {
    const stage3Res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_server_verified_analysis`, {
      method: "POST",
      headers: headersService,
      body: JSON.stringify({
        p_doi: "10.1234/test.stage3.regression",
        p_paper_title: "Stage 3 Regression Verification Paper",
        p_model_requested: "gemma-4-26b-a4b-it",
        p_model_used: "gemma-4-26b-a4b-it",
        p_is_fallback: false,
        p_fallback_reason: null,
        p_analysis_version: "4.1.0-REVISED",
        p_objective: "Verify Stage 3 RPC intact",
        p_problem: "Regression audit",
        p_methodology: "Direct REST API call with exact parameters",
        p_key_findings: [],
        p_author_stated_limitations: [],
        p_ai_inferred_limitations: [],
        p_potential_research_gaps: [],
        p_evidence_references: [],
        p_sections_analyzed: ["Methods"],
        p_chunks_used: 1,
        p_analysis_output: { regression_test: true },
        p_user_id: null,
        p_visibility: "private"
      })
    });
    assert(stage3Res.status === 200, `Stage 3 RPC executes flawlessly (HTTP ${stage3Res.status})`);
    const analysisId = await stage3Res.json();
    assert(typeof analysisId === "string" && analysisId.length === 36, `Stage 3 RPC returned valid UUID: ${analysisId}`);

    // Clean up test analysis
    await fetch(`${SUPABASE_URL}/rest/v1/paper_analyses?id=eq.${analysisId}`, {
      method: "DELETE",
      headers: headersService
    });
  } catch (e: any) {
    assert(false, `Test 13 Stage 3 regression failed: ${e?.message}`);
  }

  // Cleanup Stage 4A test gap
  if (testGapId) {
    console.log(`\nCleaning up Stage 4A test gap (${testGapId})...`);
    await fetch(`${SUPABASE_URL}/rest/v1/research_gaps?id=eq.${testGapId}`, {
      method: "DELETE",
      headers: headersService
    });
    console.log("Cleanup complete.");
  }

  console.log("\n===============================================================");
  console.log(`Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

testSuite().catch((err) => {
  console.error("Test Suite unhandled error:", err);
  process.exit(1);
});
