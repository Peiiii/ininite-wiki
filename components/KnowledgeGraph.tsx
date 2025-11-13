import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- CONFIGURATION ---
const WIDTH = 800;
const HEIGHT = 700;
const SIMULATION_ITERATIONS = 150; // How long the simulation runs to settle nodes
const REPULSION_STRENGTH = 5000;
const LINK_STRENGTH = 0.5;
const CENTER_FORCE_STRENGTH = 0.01;
const DAMPING = 0.95;

// --- INTERFACES ---
interface NodeData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface EdgeData {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  viewedTopics: string[];
  pageLinks: { [key: string]: string[] }; // Now we use this
  history: string[];
  onNodeClick: (topic: string) => void;
}

const colors = [
  '#22d3ee', '#a78bfa', '#f87171', '#4ade80', '#fbbf24', '#60a5fa',
];

// --- COMPONENT ---
export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ viewedTopics, pageLinks, history, onNodeClick }) => {
  const [nodes, setNodes] = useState<Map<string, NodeData>>(new Map());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const animationFrameId = useRef<number>();
  
  const currentTopic = history.length > 0 ? history[history.length - 1] : null;

  // Memoize edges based on pageLinks. This creates the "web" structure.
  const edges = useMemo<EdgeData[]>(() => {
    const newEdges: EdgeData[] = [];
    const viewedTopicsSet = new Set(viewedTopics.map(t => t.toLowerCase()));
    
    for (const sourceTopic in pageLinks) {
      if (viewedTopicsSet.has(sourceTopic)) {
        const links = pageLinks[sourceTopic];
        links.forEach(targetTopic => {
          if (viewedTopicsSet.has(targetTopic.toLowerCase())) {
            newEdges.push({ source: sourceTopic, target: targetTopic.toLowerCase() });
          }
        });
      }
    }
    return newEdges;
  }, [pageLinks, viewedTopics]);
  
  // Memoize which nodes are connected to the hovered node
  const connectedNodeIds = useMemo(() => {
    // FIX: Explicitly type the Set to avoid inferring Set<unknown>.
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set([hoveredNodeId.toLowerCase()]);
    edges.forEach(edge => {
      if (edge.source.toLowerCase() === hoveredNodeId.toLowerCase()) {
        connected.add(edge.target.toLowerCase());
      }
      if (edge.target.toLowerCase() === hoveredNodeId.toLowerCase()) {
        connected.add(edge.source.toLowerCase());
      }
    });
    return connected;
  }, [hoveredNodeId, edges]);


  // The Force-Directed Graph Simulation
  useEffect(() => {
    // FIX: Use `let` to allow updating the simulation state between frames.
    let tempNodes: Map<string, NodeData> = new Map();
    
    // Initialize nodes with random positions
    viewedTopics.forEach((topic, i) => {
      tempNodes.set(topic.toLowerCase(), {
        id: topic,
        x: WIDTH / 2 + (Math.random() - 0.5) * 100,
        y: HEIGHT / 2 + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        color: colors[i % colors.length]
      });
    });

    let iteration = 0;

    const runSimulation = () => {
      // FIX: Remove check that incorrectly resets nodes at the end of the simulation.
      if (iteration >= SIMULATION_ITERATIONS) {
        return;
      }
      
      // FIX: The simulation was not progressing because it always started from the initial `tempNodes`.
      // By making `tempNodes` a `let` and updating it below, we ensure the simulation progresses.
      const newNodes = new Map(tempNodes);

      // Calculate forces for each node
      newNodes.forEach((nodeA, keyA) => {
        let netForceX = 0;
        let netForceY = 0;

        // Repulsion from other nodes
        newNodes.forEach((nodeB, keyB) => {
          if (keyA === keyB) return;
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > 0) {
            const force = REPULSION_STRENGTH / distanceSq;
            netForceX += (dx / Math.sqrt(distanceSq)) * force;
            netForceY += (dy / Math.sqrt(distanceSq)) * force;
          }
        });
        
        // Center force
        netForceX += (WIDTH / 2 - nodeA.x) * CENTER_FORCE_STRENGTH;
        netForceY += (HEIGHT / 2 - nodeA.y) * CENTER_FORCE_STRENGTH;
        
        // Update velocity
        nodeA.vx = (nodeA.vx + netForceX) * DAMPING;
        nodeA.vy = (nodeA.vy + netForceY) * DAMPING;
      });

      // Link forces (edges pull nodes together)
      edges.forEach(edge => {
        const sourceNode = newNodes.get(edge.source.toLowerCase());
        const targetNode = newNodes.get(edge.target.toLowerCase());
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          sourceNode.vx += dx * LINK_STRENGTH;
          sourceNode.vy += dy * LINK_STRENGTH;
          targetNode.vx -= dx * LINK_STRENGTH;
          targetNode.vy -= dy * LINK_STRENGTH;
        }
      });
      
      // Update positions
      newNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
      });
      
      // FIX: Update tempNodes to carry the state to the next simulation frame.
      tempNodes = newNodes;

      iteration++;
      setNodes(new Map(newNodes));
      animationFrameId.current = requestAnimationFrame(runSimulation);
    };

    runSimulation();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [viewedTopics, edges]); // Rerun simulation when data changes
  
  const renderedNodes = Array.from(nodes.values());

  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-in">
        <svg width="100%" height="700" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
            {/* Edges */}
            {edges.map(edge => {
                const source = nodes.get(edge.source.toLowerCase());
                const target = nodes.get(edge.target.toLowerCase());
                if (!source || !target) return null;
                const isHighlighted = hoveredNodeId && (connectedNodeIds.has(source.id.toLowerCase()) && connectedNodeIds.has(target.id.toLowerCase()));

                return (
                    <line
                        key={`${edge.source}->${edge.target}`}
                        x1={source.x} y1={source.y}
                        x2={target.x} y2={target.y}
                        stroke={isHighlighted ? '#67e8f9' : '#4b5563'}
                        strokeWidth={isHighlighted ? 2 : 1}
                        className="transition-all duration-200"
                    />
                );
            })}
            {/* Nodes */}
            {/* FIX: Explicitly type `node` as `NodeData` to resolve TypeScript errors where properties were not found on type `unknown`. */}
            {renderedNodes.map((node: NodeData) => {
                const isCurrent = currentTopic?.toLowerCase() === node.id.toLowerCase();
                const isHovered = hoveredNodeId === node.id;
                const isConnected = hoveredNodeId && connectedNodeIds.has(node.id.toLowerCase());
                const isDimmed = hoveredNodeId && !isConnected;

                return (
                    <g 
                        key={node.id}
                        transform={`translate(${node.x},${node.y})`}
                        onClick={() => onNodeClick(node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className="cursor-pointer group"
                        style={{ transition: 'opacity 0.2s ease-in-out', opacity: isDimmed ? 0.3 : 1 }}
                    >
                        <circle 
                            r={isCurrent ? 20 : (isHovered || isConnected ? 15 : 10)}
                            fill={node.color}
                            stroke={isHovered || isConnected ? '#e5e7eb' : '#1f2937'}
                            strokeWidth="3"
                            className="transition-all duration-300"
                        />
                        <text 
                            textAnchor="middle" 
                            y={isCurrent ? 32 : (isHovered || isConnected ? 28 : 24)}
                            fontSize="12"
                            fill="#d1d5db"
                            className={`transition-opacity duration-300 font-semibold ${(isHovered || isConnected) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            style={{ pointerEvents: 'none', textShadow: '0 0 5px black' }}
                        >
                            {node.id}
                        </text>
                    </g>
                );
            })}
        </svg>
    </div>
  );
};
