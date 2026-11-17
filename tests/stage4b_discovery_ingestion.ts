import dotenv from 'dotenv';
import {
  normalizeCanonicalDoi,
  normalizeCanonicalOpenAlexId,
  literatureDiscoveryService
} from '../server/literatureDiscoveryService.js';
import {
  normalizeScholarlyText,
  computeSha256,
  findCodepointOffsets,
  extractByCodepointOffsets,
  verifyQuoteAtCodepointOffsets,
  TEXT_NORMALIZATION_VERSION,
  OFFSET_UNIT
} from '../server/textProvenanceUtils.js';
import { validateSafeHttpUrl } from '../server/ssrfValidator.js';
import { multiPaperIngestionService } from '../server/multiPaperIngestionService.js';

dotenv.config();

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('Anvīkṣā — Stage 4B Automated Discovery & Ingestion Test Suite');
  console.log('===============================================================');

  // 1. DOI and OpenAlex ID Normalization Tests
  console.log('\n[Group 1] Canonical Paper Identity & Deduplication...');
  const doi1 = normalizeCanonicalDoi('https://doi.org/10.1038/s41586-021-03819-2');
  const doi2 = normalizeCanonicalDoi('http://dx.doi.org/10.1038/S41586-021-03819-2');
  const doi3 = normalizeCanonicalDoi('doi:10.1038/s41586-021-03819-2 ');
  assert(doi1 === '10.1038/s41586-021-03819-2', `Normalized standard URL DOI: ${doi1}`);
  assert(doi2 === doi1, `Case and dx.doi.org protocol normalization matches: ${doi2}`);
  assert(doi3 === doi1, `Prefix 'doi:' normalization matches: ${doi3}`);

  const oaId1 = normalizeCanonicalOpenAlexId('https://openalex.org/w2963403868');
  const oaId2 = normalizeCanonicalOpenAlexId('W2963403868');
  assert(oaId1 === 'W2963403868', `Normalized OpenAlex URL ID: ${oaId1}`);
  assert(oaId2 === oaId1, `Case insensitive OpenAlex ID matches: ${oaId2}`);

  // 2. Unicode Code-Point Offsets & Text Normalization Tests
  console.log('\n[Group 2] Unicode Code-Point Offsets & Cryptographic Integrity...');
  // Construct a complex string with NFC/NFD variations and astral plane emoji (🚀 is 2 UTF-16 code units, 1 codepoint)
  const rawSample = 'Attention mechanism café \u0065\u0301 with 🚀 and multi-head projection.';
  const normalizedSample = normalizeScholarlyText(rawSample);
  assert(normalizedSample.includes('café é'), 'NFC normalization combined decomposed accents');

  const shaSource = computeSha256(normalizedSample);
  assert(shaSource.startsWith('sha256:'), `SHA-256 computed: ${shaSource.substring(0, 20)}...`);

  // Target quote with emoji in between
  const targetQuote = '🚀 and multi-head';
  const offsets = findCodepointOffsets(normalizedSample, targetQuote);
  assert(offsets !== null, 'Found codepoint offsets for substring across emoji boundary');
  if (offsets) {
    assert(offsets.offsetUnit === 'codepoints', `Offset unit is codepoints: ${offsets.offsetUnit}`);
    assert(offsets.normalizationVersion === 'v1.0-nfc-normalized', `Normalization version recorded: ${offsets.normalizationVersion}`);

    const extracted = extractByCodepointOffsets(normalizedSample, offsets.start, offsets.end);
    assert(extracted === targetQuote, `Extracted substring matches target quote exactly: '${extracted}'`);
    assert(verifyQuoteAtCodepointOffsets(normalizedSample, targetQuote, offsets.start, offsets.end), 'verifyQuoteAtCodepointOffsets evaluates true');
  }

  // 3. SSRF Perimeter Defense Tests
  console.log('\n[Group 3] SSRF Perimeter Defense Guard Tests...');
  const loopbackTest = await validateSafeHttpUrl('http://127.0.0.1:8080/secret');
  assert(!loopbackTest.valid, `Blocked IPv4 loopback (127.0.0.1): ${loopbackTest.reason}`);

  const metadataTest = await validateSafeHttpUrl('http://169.254.169.254/latest/meta-data/');
  assert(!metadataTest.valid, `Blocked cloud metadata IP (169.254.169.254): ${metadataTest.reason}`);

  const localhostTest = await validateSafeHttpUrl('http://localhost:3000/api');
  assert(!localhostTest.valid, `Blocked localhost hostname: ${localhostTest.reason}`);

  const badPortTest = await validateSafeHttpUrl('https://example.com:22/ssh');
  assert(!badPortTest.valid, `Blocked non-standard port 22: ${badPortTest.reason}`);

  const validHttpsTest = await validateSafeHttpUrl('https://arxiv.org/pdf/1706.03762.pdf');
  assert(validHttpsTest.valid, `Permitted legitimate arXiv public HTTPS endpoint: ${validHttpsTest.sanitizedUrl}`);

  // 4. Live Multi-Vector Literature Discovery Integration Test
  console.log('\n[Group 4] Multi-Vector Literature Discovery (Live OpenAlex)...');
  try {
    const discoveryRes = await literatureDiscoveryService.discoverCorpus({
      topicQuery: 'state space models selective scan',
      seedDoiOrOpenAlexId: '10.48550/arxiv.2312.00752', // Mamba paper
      maxCandidatesBudget: 25,
      perStrategyLimit: 5,
      targetBatchSize: 4,
      includeForwardCitations: true,
      includeBackwardCitations: true,
      includeCounterEvidence: true,
      includeConceptExpansion: true
    });

    assert(discoveryRes.candidates.length > 0, `Discovered candidate papers pool count: ${discoveryRes.candidates.length}`);
    assert(discoveryRes.selectedBatch.length >= 3 && discoveryRes.selectedBatch.length <= 12, `Selected batch size bounded (3 to 12): ${discoveryRes.selectedBatch.length}`);

    const metadata = discoveryRes.coverageMetadata;
    assert(metadata.executedStrategies.length >= 3, `Executed multiple discovery strategies: ${metadata.executedStrategies.join(', ')}`);
    assert(metadata.candidatesRetrievedCount >= metadata.candidatesSelectedCount, `Retrieved candidates >= selected candidates (${metadata.candidatesRetrievedCount} >= ${metadata.candidatesSelectedCount})`);
    assert(metadata.isExhaustive === false, 'Truthful coverage reporting: isExhaustive is false');
    assert(typeof metadata.coverageNote === 'string' && metadata.coverageNote.length > 0, `Coverage note provided: ${metadata.coverageNote}`);

    // Check strategy contribution logging
    const hasCounterStrategy = metadata.strategyContributions.some(s => s.strategy === 'counter_evidence');
    assert(hasCounterStrategy, 'Targeted counter-evidence strategy registered in strategy contributions');
  } catch (err: any) {
    assert(false, `Multi-vector discovery threw error: ${err.message}`);
  }

  // 5. Multi-Paper Batch Ingestion & Failure Isolation Test
  console.log('\n[Group 5] Multi-Paper Batch Ingestion & Failure Isolation...');
  try {
    const testBatchList = [
      '10.48550/arxiv.1706.03762', // Attention Is All You Need (Open Access arXiv)
      '10.9999/non.existent.doi.12345' // Deliberately invalid paper to test failure isolation
    ];

    const batchRes = await multiPaperIngestionService.ingestBatch(testBatchList, {
      concurrency: 2,
      persistToDatabase: true
    });

    assert(batchRes.requestedCount === 2, `Requested batch count: ${batchRes.requestedCount}`);
    assert(batchRes.items.length === 2, `Batch items returned: ${batchRes.items.length}`);

    // Verify paper 1 (valid)
    const validItem = batchRes.items.find(i => i.doi === '10.48550/arxiv.1706.03762');
    assert(validItem !== undefined, 'Found valid paper in batch results');
    if (validItem) {
      assert(
        validItem.retrievalStatus === 'FULL_TEXT_RETRIEVED' || validItem.retrievalStatus === 'ABSTRACT_ONLY',
        `Valid paper retrieval status: ${validItem.retrievalStatus}`
      );
      assert(validItem.extractedTextChecksum !== null, `Extracted text checksum generated: ${validItem.extractedTextChecksum?.substring(0, 20)}...`);
      assert(validItem.textNormalizationVersion === 'v1.0-nfc-normalized', `Normalization version verified: ${validItem.textNormalizationVersion}`);
      assert(validItem.offsetUnit === 'codepoints', `Offset unit verified: ${validItem.offsetUnit}`);
      if (validItem.chunks.length > 0) {
        assert(validItem.chunks[0].chunkChecksum.startsWith('sha256:'), `Chunk SHA-256 hash verified: ${validItem.chunks[0].chunkChecksum.substring(0, 20)}...`);
      }
    }

    // Verify paper 2 (invalid) - Failure isolation
    const failedItem = batchRes.items.find(i => i.doi === '10.9999/non.existent.doi.12345');
    assert(failedItem !== undefined, 'Found invalid paper in batch results');
    if (failedItem) {
      assert(failedItem.retrievalStatus === 'RETRIEVAL_FAILED', `Invalid paper failed safely with status: ${failedItem.retrievalStatus}`);
      assert(typeof failedItem.errorMessage === 'string', `Failure error message captured: ${failedItem.errorMessage}`);
    }

    assert(batchRes.succeededCount + batchRes.abstractOnlyCount + batchRes.failedCount === 2, 'Batch count partition adds up completely');
  } catch (err: any) {
    assert(false, `Batch ingestion threw error: ${err.message}`);
  }

  // 6. Stage 3 and Stage 4A Regression Check
  console.log('\n[Group 6] Stage 3 & Stage 4A Regression Safety Check...');
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;

  if (adminKey && supabaseUrl) {
    try {
      const regRes = await fetch(`${supabaseUrl}/rest/v1/rpc/insert_server_verified_analysis`, {
        method: 'POST',
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_doi: '10.1234/stage4b.regression',
          p_paper_title: 'Stage 4B Regression Test Paper',
          p_model_requested: 'gemma-4-26b-a4b-it',
          p_model_used: 'gemma-4-26b-a4b-it',
          p_is_fallback: false,
          p_fallback_reason: null,
          p_analysis_version: '4.1.0-REVISED',
          p_objective: 'Stage 4B regression audit',
          p_problem: 'Verify Stage 3 RPC security',
          p_methodology: 'Direct REST call',
          p_key_findings: [],
          p_author_stated_limitations: [],
          p_ai_inferred_limitations: [],
          p_potential_research_gaps: [],
          p_evidence_references: [],
          p_sections_analyzed: ['Methods'],
          p_chunks_used: 1,
          p_analysis_output: { regression: true },
          p_user_id: null,
          p_visibility: 'private'
        })
      });
      assert(regRes.status === 200, `Stage 3 RPC executes without regression (HTTP ${regRes.status})`);
      const analysisId = await regRes.json();
      await fetch(`${supabaseUrl}/rest/v1/paper_analyses?id=eq.${analysisId}`, {
        method: 'DELETE',
        headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` }
      });
    } catch (regErr: any) {
      assert(false, `Regression test error: ${regErr.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
