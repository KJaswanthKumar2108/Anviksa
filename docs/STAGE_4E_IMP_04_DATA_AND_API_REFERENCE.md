# Anvīkṣā — Stage 4E-IMP-04 Data and API Reference
## Resource Inventory, Suitability Assessment, and Strategic Recommendations

**Work Package:** Stage 4E-IMP-04  
**Document Version:** 1.0.0-STAGE4E-IMP04-API  

---

## 1. Database Schema Reference

### 1.1 `public.researcher_resources`
Granular resource inventory items registered by researchers:
- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to `auth.users(id) ON DELETE CASCADE`)
- `resource_category` (TEXT, Check: `COMPUTE_HARDWARE`, `SOFTWARE_FRAMEWORK`, `DATASET_ACCESS`, `LAB_EQUIPMENT`, `FINANCIAL_BUDGET`, `HUMAN_EXPERTISE`, `COLLABORATOR_ACCESS`, `TIME_AVAILABILITY`, `EXTERNAL_SERVICE`)
- `resource_name` (TEXT, Not Null)
- `description` (TEXT)
- `specifications` (JSONB, Default: `{}`)
- `evidence_state` (TEXT, Check: `VERIFIED_AVAILABLE`, `DECLARED_AVAILABLE`, `VERIFIED_UNAVAILABLE`, `UNKNOWN`, `EXPIRED_EVIDENCE`)
- `evidence_source` (TEXT, Check: `CLOUD_PROVIDER_API`, `INSTITUTIONAL_SSO`, `BENCHMARK_PROBE`, `CRYPTO_ATTESTATION`, `PEER_CONFIRMED`, `USER_SELF_DECLARATION`, `NONE`)
- `verification_source_ref` (TEXT)
- `verification_timestamp` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ)
- `evidence_freshness_ttl_days` (INTEGER, Default: 90)
- `confidence_level` (TEXT, Check: `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`)
- `researcher_override_flag` (BOOLEAN, Default: `false`)
- `override_justification` (TEXT)

### 1.2 `public.research_strategic_recommendations`
Traceable evaluation outcomes mapping an opportunity into the 2D matrix:
- `id` (UUID, Primary Key)
- `opportunity_id` (UUID, FK to `public.research_opportunities(id) ON DELETE RESTRICT`)
- `experiment_id` (UUID, FK to `public.research_experiments(id) ON DELETE SET NULL`)
- `user_id` (UUID, FK to `auth.users(id) ON DELETE CASCADE`)
- `intrinsic_scientific_value` (NUMERIC(4,2), in `[0.00, 10.00]`)
- `execution_suitability` (NUMERIC(4,2), Nullable, in `[0.00, 10.00]`)
- `suitability_status` (TEXT, Check: `SUITABILITY_EVALUATED`, `SUITABILITY_UNDETERMINED`, `RESOURCE_BLOCKED`)
- `strategic_quadrant` (TEXT, Check: `IMMEDIATE_HIGH_PRIORITY`, `GRANT_OR_COLLABORATION_TARGET`, `FEASIBLE_RESEARCH_OPPORTUNITY`, `DEPRIORITIZED`, `SUITABILITY_UNDETERMINED`)
- `suitability_breakdown` (JSONB)
- `unmatched_requirements` (JSONB)
- `resource_recommendations` (JSONB)
- `evidence_basis` (JSONB)
- `is_stale` (BOOLEAN, Default: `false`)

---

## 2. Authenticated REST API Endpoints

### 2.1 `GET /api/research/resources`
- **Auth:** Bearer JWT required.
- **Response:** `{ success: true, resources: ResearcherResourceItem[] }`

### 2.2 `POST /api/research/resources`
- **Auth:** Bearer JWT required. Derives user from verified token; rejects impersonating `userId` in body.
- **Payload:** Partial `ResearcherResourceItem`.
- **Response:** `201 Created` with `{ success: true, resourceId: string }`.

### 2.3 `POST /api/research/suitability/evaluate`
- **Auth:** Bearer JWT required.
- **Payload:**
  ```json
  {
    "opportunityId": "uuid",
    "experimentId": "uuid (optional)",
    "persist": true
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "assessment": {
      "opportunityId": "uuid",
      "intrinsicScientificValue": 8.50,
      "executionSuitability": 7.40,
      "suitabilityStatus": "SUITABILITY_EVALUATED",
      "strategicQuadrant": "IMMEDIATE_HIGH_PRIORITY",
      "suitabilityBreakdown": { ... },
      "recommendations": [ ... ]
    },
    "persistedId": "uuid"
  }
  ```

### 2.4 `GET /api/research/recommendations`
- **Auth:** Bearer JWT required.
- **Response:** `{ success: true, recommendations: StrategicRecommendation[] }`
