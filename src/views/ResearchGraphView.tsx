import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  FileText,
  AlertTriangle,
  Target,
  GitPullRequest,
  Beaker,
  CheckCircle2,
  Award,
  Info,
  Maximize2,
  Layers,
  Table,
  Eye,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  Sparkles,
  Move
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../data/mockData';
import { getStoredGraph } from '../utils/researchGraphStore';

interface ResearchGraphViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ResearchGraphView: React.FC<ResearchGraphViewProps> = ({ onNavigateTab }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [viewMode, setViewMode] = useState<'canvas' | 'accessible-table'>('canvas');
  const [selectedField, setSelectedField] = useState<string>('All');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>(getStoredGraph());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = getStoredGraph();
    setGraphData(data);
    if (data.nodes.length > 0 && !selectedNode) {
      setSelectedNode(data.nodes[0]);
    }
  }, []);

  const nodeColors: Record<string, { bg: string; border: string; text: string; labelBg: string; name: string }> = {
    paper: { bg: '#FAEDCD', border: '#D4A373', text: '#342F27', labelBg: 'bg-[#E9EDC9] text-[#342F27] border border-[#DCD5BC]', name: 'Paper' },
    limitation: { bg: '#FEFAE0', border: '#B83A32', text: '#B83A32', labelBg: 'bg-[#FEFAE0] text-[#B83A32] border border-[#B83A32]/40', name: 'Limitation' },
    challenge: { bg: '#E9EDC9', border: '#8B5E34', text: '#342F27', labelBg: 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299]', name: 'Challenge' },
    contribution: { bg: '#FAEDCD', border: '#C59465', text: '#342F27', labelBg: 'bg-[#FAEDCD] text-[#342F27] border border-[#DCD5BC]', name: 'Proposal' },
    experiment: { bg: '#E9EDC9', border: '#CCD5AE', text: '#342F27', labelBg: 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299]', name: 'Experiment' },
    review: { bg: '#FEFAE0', border: '#D4A373', text: '#342F27', labelBg: 'bg-[#FAEDCD] text-[#342F27] border border-[#DCD5BC]', name: 'Peer Review' },
    outcome: { bg: '#CCD5AE', border: '#287A50', text: '#287A50', labelBg: 'bg-[#CCD5AE] text-[#287A50] border border-[#287A50]/40', name: 'Published Outcome' }
  };

  const fields = ['All', 'Artificial Intelligence', 'Quantum Physics', 'Genomics & Gene Editing'];

  const filteredNodes = graphData.nodes.filter((n) => {
    const matchesField = selectedField === 'All' || n.field === selectedField;
    const matchesType = selectedNodeType === 'all' || n.type === selectedNodeType;
    const matchesSearch =
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.metadata.authorOrOrg && n.metadata.authorOrOrg.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.field.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesField && matchesType && matchesSearch;
  });

  const getNodeCoordinates = (id: string) => {
    const node = graphData.nodes.find((n) => n.id === id);
    return { x: node?.x || 200, y: node?.y || 200 };
  };

  // Find incoming & outgoing edges
  const activeIncomingEdges = selectedNode ? graphData.edges.filter(e => e.target === selectedNode.id) : [];
  const activeOutgoingEdges = selectedNode ? graphData.edges.filter(e => e.source === selectedNode.id) : [];

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSelectAndFocus = (node: GraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Network className="w-5 h-5 text-[#8B5E34]" />
              <h1 className="text-xl font-bold text-[#342F27]">Connected Research Lifecycle Graph</h1>
            </div>
            <p className="text-xs text-[#6B6255] max-w-2xl leading-relaxed">
              Trace verified scientific lineage from published literature through author limitations, funded challenges, experimental proposals, independent reviews, and validated outcomes.
            </p>
          </div>

          {/* View Mode Toggle: Interactive Canvas vs Accessible Matrix */}
          <div className="flex items-center gap-1.5 bg-[#FEFAE0] p-1 rounded-xl border border-[#DCD5BC] shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] shadow-xs'
                  : 'text-[#6B6255] hover:text-[#342F27]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              onClick={() => setViewMode('accessible-table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'accessible-table'
                  ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] shadow-xs'
                  : 'text-[#6B6255] hover:text-[#342F27]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Accessible Matrix</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Canvas Controls & Field Filter */}
        <div className="mt-5 pt-4 border-t border-[#DCD5BC] flex flex-wrap items-center justify-between gap-4">
          
          {/* Search in Graph */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
            <input
              type="text"
              placeholder="Search graph nodes, DOIs, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs text-[#342F27] placeholder-[#6B6255] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
            />
          </div>

          {/* Discipline Lineage Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-semibold text-[#6B6255] mr-1 shrink-0">Lineage:</span>
            {fields.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedField(f)}
                className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  selectedField === f
                    ? 'bg-[#CCD5AE] text-[#342F27] font-bold border-[#B8C299] shadow-xs'
                    : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:text-[#342F27] hover:bg-[#E9EDC9]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Canvas Controls */}
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1 bg-[#FEFAE0] p-1 rounded-xl border border-[#DCD5BC] shrink-0">
              <button
                onClick={() => setZoom(Math.max(0.6, zoom - 0.15))}
                className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 font-bold text-[#342F27] min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(1.6, zoom + 0.15))}
                className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="px-2 py-1 text-[11px] font-semibold text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Reset View"
                aria-label="Reset zoom and position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Fit All</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills Bar */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-[#6B6255] mr-1 shrink-0">Filter Artifact:</span>
          {[
            { id: 'all', label: 'All Artifacts' },
            { id: 'paper', label: 'Papers' },
            { id: 'limitation', label: 'Limitations' },
            { id: 'challenge', label: 'Challenges' },
            { id: 'contribution', label: 'Proposals' },
            { id: 'experiment', label: 'Experiments' },
            { id: 'review', label: 'Reviews' },
            { id: 'outcome', label: 'Outcomes' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedNodeType(type.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                selectedNodeType === type.id
                  ? 'bg-[#CCD5AE] text-[#342F27] font-bold border-[#B8C299] shadow-xs'
                  : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:text-[#342F27] hover:bg-[#E9EDC9]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph Content Area: Split 2-Column with Matched Heights */}
      {viewMode === 'canvas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Interactive SVG Canvas */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`lg:col-span-2 bg-[#FEFAE0] rounded-2xl border border-[#DCD5BC] h-[640px] relative overflow-hidden flex items-center justify-center shadow-inner select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Background Grid Pattern */}
            <div
              className="w-full h-full relative transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              <svg
                viewBox="0 0 880 960"
                className="w-full h-full overflow-visible"
              >
                {/* Arrowhead marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8B5E34" />
                  </marker>
                  <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[#DCD5BC]/40" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#graph-grid)" />

                {/* Edges */}
                {graphData.edges.map((edge) => {
                  const sourcePos = getNodeCoordinates(edge.source);
                  const targetPos = getNodeCoordinates(edge.target);
                  const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

                  const midX = (sourcePos.x + targetPos.x) / 2;
                  const midY = (sourcePos.y + targetPos.y) / 2;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isHighlighted ? '#8B5E34' : '#C5B8A5'}
                        strokeWidth={isHighlighted ? '3.5' : '2'}
                        strokeDasharray={edge.relationship === 'tests' ? '4 4' : 'none'}
                        markerEnd="url(#arrowhead)"
                        className="transition-colors duration-150"
                      />
                      <rect
                        x={midX - 54}
                        y={midY - 11}
                        width="108"
                        height="22"
                        rx="6"
                        fill="#FAEDCD"
                        stroke={isHighlighted ? '#8B5E34' : '#DCD5BC'}
                        strokeWidth={isHighlighted ? '1.5' : '1'}
                      />
                      <text
                        x={midX}
                        y={midY + 2}
                        fill="#342F27"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {edge.relationship}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  const style = nodeColors[node.type] || nodeColors.paper;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x || 150}, ${node.y || 100})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndFocus(node);
                      }}
                      className="cursor-pointer group"
                      tabIndex={0}
                      role="button"
                      aria-label={`Node: ${node.label}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectAndFocus(node);
                        }
                      }}
                    >
                      <rect
                        x="-90"
                        y="-26"
                        width="180"
                        height="52"
                        rx="14"
                        fill={style.bg}
                        stroke={isSelected ? '#8B5E34' : style.border}
                        strokeWidth={isSelected ? '3.5' : '1.5'}
                        className="transition-all duration-150 group-hover:scale-105 shadow-xs"
                      />
                      <text
                        x="0"
                        y="-7"
                        fill={style.text}
                        fontSize="10"
                        fontWeight="800"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {nodeColors[node.type]?.name.toUpperCase() || node.type.toUpperCase()}
                      </text>
                      <text
                        x="0"
                        y="12"
                        fill="#342F27"
                        fontSize="9.5"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {node.label.length > 25 ? node.label.slice(0, 23) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Canvas Footer Status */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono bg-[#E9EDC9]/95 backdrop-blur-xs border border-[#DCD5BC] text-[#342F27] px-3 py-1.5 rounded-xl shadow-xs">
              <span className="flex items-center gap-1.5">
                <Move className="w-3 h-3 text-[#8B5E34]" />
                <span>Showing {filteredNodes.length} of {graphData.nodes.length} nodes · Drag canvas to pan · Click node to inspect</span>
              </span>
              <span className="hidden sm:inline text-[#6B6255]">Lineage zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] p-6 shadow-2xs flex flex-col justify-between text-xs text-[#342F27] h-[640px] overflow-y-auto">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded border ${nodeColors[selectedNode.type]?.labelBg}`}>
                    {nodeColors[selectedNode.type]?.name}
                  </span>
                  <span className="text-[10px] text-[#6B6255] font-mono">ID: {selectedNode.id}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#342F27] leading-snug">{selectedNode.metadata.title}</h3>
                  <p className="text-xs text-[#6B6255] mt-1">{selectedNode.metadata.subtext}</p>
                </div>

                <div className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6255]">Discipline:</span>
                    <span className="font-semibold text-[#342F27]">{selectedNode.field}</span>
                  </div>
                  {selectedNode.metadata.authorOrOrg && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6255]">Author / Org:</span>
                      <span className="font-semibold text-[#342F27]">{selectedNode.metadata.authorOrOrg}</span>
                    </div>
                  )}
                  {selectedNode.metadata.status && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6255]">Lifecycle Status:</span>
                      <span className="font-bold text-[#287A50] bg-[#E9EDC9] px-2 py-0.2 rounded border border-[#B8C299]">
                        {selectedNode.metadata.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lineage Relationships */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-[#342F27] uppercase text-[10px] tracking-wider">
                    Lineage Connections ({activeIncomingEdges.length + activeOutgoingEdges.length})
                  </h4>

                  {/* Upstream */}
                  {activeIncomingEdges.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#6B6255] font-semibold block">Origin / Upstream:</span>
                      {activeIncomingEdges.map(e => {
                        const sourceNode = graphData.nodes.find(n => n.id === e.source);
                        return (
                          <div
                            key={e.id}
                            onClick={() => sourceNode && handleSelectAndFocus(sourceNode)}
                            className="p-2.5 bg-[#FEFAE0] hover:bg-[#E9EDC9] rounded-xl border border-[#DCD5BC] flex items-center justify-between text-[11px] cursor-pointer transition-colors"
                          >
                            <span className="text-[#6B6255] font-mono truncate max-w-[140px]">← {sourceNode?.label || e.source}</span>
                            <span className="font-bold text-[#8B5E34] text-[10px]">{e.relationship}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Downstream */}
                  {activeOutgoingEdges.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#6B6255] font-semibold block">Downstream Impact:</span>
                      {activeOutgoingEdges.map(e => {
                        const targetNode = graphData.nodes.find(n => n.id === e.target);
                        return (
                          <div
                            key={e.id}
                            onClick={() => targetNode && handleSelectAndFocus(targetNode)}
                            className="p-2.5 bg-[#FEFAE0] hover:bg-[#E9EDC9] rounded-xl border border-[#DCD5BC] flex items-center justify-between text-[11px] cursor-pointer transition-colors"
                          >
                            <span className="font-bold text-[#8B5E34] text-[10px]">{e.relationship}</span>
                            <span className="text-[#6B6255] font-mono truncate max-w-[140px]">→ {targetNode?.label || e.target}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Workspace Navigation Link */}
                {onNavigateTab && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (selectedNode.type === 'paper') onNavigateTab('papers');
                        else if (selectedNode.type === 'challenge') onNavigateTab('challenges');
                        else if (selectedNode.type === 'contribution' || selectedNode.type === 'experiment') onNavigateTab('my-contributions');
                        else onNavigateTab('home');
                      }}
                      className="w-full py-2.5 px-4 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Explore {nodeColors[selectedNode.type]?.name} in Workspace</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-[#6B6255] my-auto">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#8B5E34]" />
                <p>Select any node in the graph to view complete lineage, provenance, and research artifacts.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Accessible Lineage Matrix View */
        <div className="bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] p-6 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-[#DCD5BC] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#342F27]">Accessible Research Lineage Matrix</h3>
              <p className="text-[11px] text-[#6B6255]">Accessible tabular view of all scientific lifecycle nodes, dependencies, and verification statuses.</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#8B5E34] bg-[#FEFAE0] px-3 py-1 rounded-lg border border-[#DCD5BC]">
              {filteredNodes.length} Artifacts Indexed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Research Lifecycle Artifacts Table">
              <thead>
                <tr className="border-b border-[#DCD5BC] text-[#6B6255] font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Node Label & Title</th>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3">Author / Org</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD5BC]/60">
                {filteredNodes.map((n) => {
                  const style = nodeColors[n.type] || nodeColors.paper;
                  return (
                    <tr key={n.id} className="hover:bg-[#FEFAE0]/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${style.labelBg}`}>
                          {style.name}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-[#342F27] block text-xs">{n.metadata.title}</strong>
                        <span className="text-[10px] text-[#6B6255] font-mono">{n.metadata.subtext}</span>
                      </td>
                      <td className="py-3 px-3 text-[#6B6255]">{n.field}</td>
                      <td className="py-3 px-3 text-[#342F27] font-medium">{n.metadata.authorOrOrg || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-[#287A50] bg-[#E9EDC9] px-2 py-0.5 rounded border border-[#B8C299]">
                          {n.metadata.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedNode(n);
                            setViewMode('canvas');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-[#342F27] bg-[#CCD5AE] hover:bg-[#D4A373] hover:text-white rounded-lg border border-[#B8C299] transition-colors cursor-pointer"
                        >
                          Focus in Graph
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
