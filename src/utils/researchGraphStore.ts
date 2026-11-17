import { MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES, GraphNode, GraphEdge, Challenge, Contribution } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEY_GRAPH_NODES = 'openresearch_graph_nodes_v2';
const LOCAL_STORAGE_KEY_GRAPH_EDGES = 'openresearch_graph_edges_v2';

export function getStoredGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  try {
    const storedNodes = localStorage.getItem(LOCAL_STORAGE_KEY_GRAPH_NODES);
    const storedEdges = localStorage.getItem(LOCAL_STORAGE_KEY_GRAPH_EDGES);

    const nodes = storedNodes ? JSON.parse(storedNodes) : MOCK_GRAPH_NODES;
    const edges = storedEdges ? JSON.parse(storedEdges) : MOCK_GRAPH_EDGES;

    return { nodes, edges };
  } catch {
    return { nodes: MOCK_GRAPH_NODES, edges: MOCK_GRAPH_EDGES };
  }
}

export function saveStoredGraph(nodes: GraphNode[], edges: GraphEdge[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_GRAPH_NODES, JSON.stringify(nodes));
    localStorage.setItem(LOCAL_STORAGE_KEY_GRAPH_EDGES, JSON.stringify(edges));
  } catch {}
}

export async function syncGraphWithSupabase(currentEdges: GraphEdge[]): Promise<GraphEdge[]> {
  if (!isSupabaseConfigured || !supabase) return currentEdges;

  try {
    const { data, error } = await supabase.from('research_relationships').select('*');
    if (!error && data && data.length > 0) {
      const dbEdges: GraphEdge[] = data.map((r: any) => ({
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        relationship: r.relationship_type
      }));

      const edgeMap = new Map<string, GraphEdge>();
      currentEdges.forEach(e => edgeMap.set(e.id, e));
      dbEdges.forEach(e => edgeMap.set(e.id, e));
      return Array.from(edgeMap.values());
    }
  } catch (err) {
    console.warn('[ResearchGraph] Supabase relationship sync skipped:', err);
  }
  return currentEdges;
}

export function addLifecycleNodesToGraph(
  paperTitle: string,
  limitationText: string,
  challenge: Challenge,
  contribution: Contribution,
  experimentTitle?: string,
  outcomeStatus?: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const { nodes, edges } = getStoredGraph();

  const newChallengeNodeId = `graph-node-${challenge.id}`;
  const newContribNodeId = `graph-node-${contribution.id}`;
  const newExpNodeId = `graph-node-exp-${Date.now()}`;
  const newOutcomeNodeId = `graph-node-out-${Date.now()}`;

  const newNodes: GraphNode[] = [
    {
      id: newChallengeNodeId,
      label: `Challenge: ${challenge.title.slice(0, 24)}...`,
      type: 'challenge',
      field: challenge.category,
      metadata: {
        title: challenge.title,
        subtext: challenge.problemStatement,
        authorOrOrg: challenge.orgName,
        status: challenge.status,
        yearOrDate: challenge.createdAt
      },
      x: 180,
      y: 440
    },
    {
      id: newContribNodeId,
      label: `Proposal: ${contribution.title.slice(0, 24)}...`,
      type: 'contribution',
      field: challenge.category,
      metadata: {
        title: contribution.title,
        subtext: contribution.summary,
        authorOrOrg: contribution.contributorName,
        status: contribution.status,
        yearOrDate: contribution.createdAt
      },
      x: 180,
      y: 600
    },
    {
      id: newExpNodeId,
      label: `Experiment: ${experimentTitle || '512k Token H100 GPU Run'}`,
      type: 'experiment',
      field: challenge.category,
      metadata: {
        title: experimentTitle || 'Benchmarking Memory Allocation on 80GB H100',
        subtext: 'Empirical execution trial',
        authorOrOrg: contribution.contributorName,
        status: 'Completed',
        yearOrDate: 'Just now'
      },
      x: 180,
      y: 760
    },
    {
      id: newOutcomeNodeId,
      label: `Outcome: ${outcomeStatus || 'Independently Replicated'}`,
      type: 'outcome',
      field: challenge.category,
      metadata: {
        title: `Research Outcome: ${outcomeStatus || 'Independently Replicated'}`,
        subtext: 'Validated solution linked to science ledger',
        authorOrOrg: contribution.contributorName,
        status: outcomeStatus || 'Independently Replicated',
        yearOrDate: 'Just now'
      },
      x: 180,
      y: 920
    }
  ];

  const newEdges: GraphEdge[] = [
    { id: `edge-${Date.now()}-1`, source: 'lim-1', target: newChallengeNodeId, relationship: 'addresses' },
    { id: `edge-${Date.now()}-2`, source: newChallengeNodeId, target: newContribNodeId, relationship: 'addresses' },
    { id: `edge-${Date.now()}-3`, source: newContribNodeId, target: newExpNodeId, relationship: 'tests' },
    { id: `edge-${Date.now()}-4`, source: newExpNodeId, target: newOutcomeNodeId, relationship: 'replicates' }
  ];

  const updatedNodes = [...nodes, ...newNodes];
  const updatedEdges = [...edges, ...newEdges];

  saveStoredGraph(updatedNodes, updatedEdges);

  // Sync relationships to Supabase asynchronously
  if (isSupabaseConfigured && supabase) {
    const relationshipsPayload = newEdges.map(edge => ({
      source_type: 'node',
      source_id: edge.source,
      target_type: 'node',
      target_id: edge.target,
      relationship_type: edge.relationship,
      description: `Generated edge between ${edge.source} and ${edge.target}`
    }));

    (async () => {
      try {
        const { error } = await supabase.from('research_relationships').insert(relationshipsPayload);
        if (error) console.warn('[ResearchGraph] Failed to persist edges to Supabase:', error.message);
      } catch (e: any) {
        console.warn('[ResearchGraph] Error saving edges:', e);
      }
    })();
  }

  return { nodes: updatedNodes, edges: updatedEdges };
}
