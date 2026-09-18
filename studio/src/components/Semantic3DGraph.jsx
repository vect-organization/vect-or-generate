// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// React Component for Interactive 10-Layer Semantic 3D Force Graph

import React, { useEffect, useRef, useState } from 'react';

export const LAYER_PALETTE = {
  0: { name: 'L0 Raw', color: '#64748b' },
  1: { name: 'L1 Lemma', color: '#10b981' },
  2: { name: 'L2 Morph', color: '#06b6d4' },
  3: { name: 'L3 Syntax', color: '#14b8a6' },
  4: { name: 'L4 Semantic', color: '#3b82f6' },
  5: { name: 'L5 Pragmatic', color: '#f59e0b' },
  6: { name: 'L6 Vector', color: '#ec4899' },
  7: { name: 'L7 Linter', color: '#ef4444' },
  8: { name: 'L8 Logic', color: '#8b5cf6' },
  9: { name: 'L9 Skeleton', color: '#eab308' },
};

export default function Semantic3DGraph({ entities = [], currentEntity = null, onSelectEntity = null }) {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let graphInstance = null;

    // Load 3d-force-graph dynamically from CDN if not present
    const scriptId = '3d-force-graph-cdn';
    const initGraph = () => {
      if (!window.ForceGraph3D || !containerRef.current) return;

      const nodes = [];
      const links = [];
      const nodeMap = new Set();

      const addNode = (n) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.add(n.id);
          nodes.push(n);
        }
      };

      const targetList = (entities && entities.length > 0) ? entities : (currentEntity ? [currentEntity] : []);

      targetList.forEach((item, idx) => {
        const centerId = `ent_${item.id || idx}`;
        const isSelected = currentEntity && (currentEntity.id === item.id || currentEntity.name === item.name);

        addNode({
          id: centerId,
          name: item.name || `Entity ${idx + 1}`,
          layer: 4,
          layerName: 'L4 Semantic',
          color: isSelected ? '#38bdf8' : '#3b82f6',
          val: isSelected ? 16 : 10,
          category: item.category,
          definition: item.definition,
          code: item.code,
          raw: item
        });

        if (item.reading) {
          const rId = `${centerId}_reading`;
          addNode({ id: rId, name: `よみ: ${item.reading}`, layer: 1, color: '#10b981', val: 5 });
          links.push({ source: centerId, target: rId, color: '#10b981' });
        }
        if (item.category) {
          const cId = `cat_${item.category}`;
          addNode({ id: cId, name: `分類: ${item.category}`, layer: 2, color: '#06b6d4', val: 6 });
          links.push({ source: centerId, target: cId, color: '#06b6d4' });
        }
        if (Array.isArray(item.synonyms)) {
          item.synonyms.forEach((syn, sIdx) => {
            const sId = `${centerId}_syn_${sIdx}`;
            addNode({ id: sId, name: `類語: ${syn}`, layer: 3, color: '#14b8a6', val: 5 });
            links.push({ source: centerId, target: sId, color: '#14b8a6' });
          });
        }
      });

      containerRef.current.innerHTML = '';
      graphInstance = window.ForceGraph3D()(containerRef.current)
        .graphData({ nodes, links })
        .backgroundColor('#030611')
        .nodeLabel('name')
        .nodeColor(node => node.color || '#3b82f6')
        .nodeVal(node => node.val || 5)
        .linkColor(link => link.color || 'rgba(255,255,255,0.2)')
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(0.006)
        .onNodeClick(node => {
          const distance = 80;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          graphInstance.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            2000
          );
          setSelectedNode(node);
          if (node.raw && onSelectEntity) {
            onSelectEntity(node.raw);
          }
        });

      setLoading(false);
    };

    if (!window.ForceGraph3D) {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/3d-force-graph';
        script.async = true;
        script.onload = initGraph;
        document.body.appendChild(script);
      } else {
        const existing = document.getElementById(scriptId);
        existing.addEventListener('load', initGraph);
      }
    } else {
      initGraph();
    }

    return () => {
      if (graphInstance && typeof graphInstance._destructor === 'function') {
        graphInstance._destructor();
      }
    };
  }, [entities, currentEntity]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-slate-800 bg-[#030611]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-cyan-400 bg-slate-950/80 z-20">
          Loading 3D Celestial Engine...
        </div>
      )}
      
      {/* 3D Viewport */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Node Inspector */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-72 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-2xl z-30 text-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold" style={{ background: `${selectedNode.color}22`, color: selectedNode.color, border: `1px solid ${selectedNode.color}` }}>
              Layer {selectedNode.layer}
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white font-bold">×</button>
          </div>
          <h4 className="font-bold text-sm text-white mb-2">{selectedNode.name}</h4>
          {selectedNode.category && <div className="text-slate-300 mt-1">分類: {selectedNode.category}</div>}
          {selectedNode.definition && <div className="text-slate-400 mt-1 line-clamp-3">{selectedNode.definition}</div>}
        </div>
      )}
    </div>
  );
}
