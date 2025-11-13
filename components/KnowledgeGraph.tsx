import React, { useMemo } from 'react';

interface KnowledgeGraphProps {
  viewedTopics: string[];
  history: string[];
  onNodeClick: (topic: string) => void;
}

// FIX: Define interfaces for graph nodes and edges to provide strong typing.
interface GraphNode {
  id: string;
  x: number;
  y: number;
  color: string;
}

// FIX: Define interfaces for graph nodes and edges to provide strong typing.
interface GraphEdge {
  id: string;
  source: GraphNode;
  target: GraphNode;
}

const colors = [
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
  '#4ade80', // green-400
  '#fbbf24', // amber-400
  '#60a5fa', // blue-400
];

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ viewedTopics, history, onNodeClick }) => {

  const { nodes, edges } = useMemo(() => {
    if (viewedTopics.length === 0) return { nodes: [], edges: [] };

    const graphNodes: GraphNode[] = viewedTopics.map((topic, i) => {
      const angle = (i / viewedTopics.length) * 2 * Math.PI;
      const radius = Math.min(300, 40 * viewedTopics.length);
      return {
        id: topic,
        x: Math.cos(angle) * radius + 400,
        y: Math.sin(angle) * radius + 350,
        color: colors[i % colors.length]
      };
    });

    const nodeMap = new Map<string, GraphNode>(graphNodes.map(n => [n.id.toLowerCase(), n]));

    const graphEdges: GraphEdge[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const sourceNode = nodeMap.get(history[i].toLowerCase());
      const targetNode = nodeMap.get(history[i+1].toLowerCase());
      if (sourceNode && targetNode) {
        graphEdges.push({
          id: `${sourceNode.id}->${targetNode.id}`,
          source: sourceNode,
          target: targetNode
        });
      }
    }
    
    return { nodes: graphNodes, edges: graphEdges };
  }, [viewedTopics, history]);
  
  const currentTopic = history[history.length - 1];

  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-in">
        <svg width="100%" height="700" viewBox="0 0 800 700">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
            </defs>
            {/* Edges */}
            {edges.map(edge => (
                <line
                    key={edge.id}
                    x1={edge.source.x}
                    y1={edge.source.y}
                    x2={edge.target.x}
                    y2={edge.target.y}
                    stroke="#4b5563"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
            ))}
            {/* Nodes */}
            {nodes.map(node => (
                <g 
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onClick={() => onNodeClick(node.id)}
                    className="cursor-pointer group"
                >
                    <circle 
                        r={currentTopic.toLowerCase() === node.id.toLowerCase() ? 18 : 12}
                        fill={node.color}
                        stroke="#1f2937"
                        strokeWidth="3"
                        className="transition-all duration-300 group-hover:r-20"
                    />
                    <text 
                        textAnchor="middle" 
                        y="35"
                        fontSize="12"
                        fill="#d1d5db"
                        className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 font-semibold"
                        style={{ pointerEvents: 'none' }}
                    >
                        {node.id}
                    </text>
                </g>
            ))}
        </svg>
    </div>
  );
};
