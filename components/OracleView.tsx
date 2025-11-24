import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  Panel,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import dagre from 'dagre';
import { MindMapData, MindMapNode, MindMapEdge } from '../types';
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, Type, Palette, X } from 'lucide-react';
import html2canvas from 'html2canvas';

interface OracleViewProps {
  mindMapData: MindMapData;
  onClose: () => void;
  lang: 'ES' | 'EN' | 'DE' | 'FR';
}

// Custom Node Component - Estilo Cyberpunk/Mágico con handles para conexión
const MindMapNodeComponent = ({ data, selected }: any) => {
  const nodeTypeColors: Record<string, string> = {
    concept: '#6366f1', // indigo-600
    person: '#10b981', // emerald-600
    event: '#eab308', // yellow-600
    process: '#a855f7', // purple-600
    category: '#f43f5e', // rose-600
  };

  // Usar color personalizado si existe, sino el color por tipo
  const bgColor = data.customColor || nodeTypeColors[data.type] || '#6366f1';
  const fontSize = data.fontSize || 'text-sm';

  return (
    <div
      className={`border-4 border-black rounded-lg p-4 shadow-lg min-w-[150px] max-w-[250px] transition-all hover:scale-105 hover:shadow-2xl ${
        selected ? 'ring-4 ring-indigo-400' : ''
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Handle superior para conexiones entrantes */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-400 border-2 border-white"
        style={{ borderRadius: '50%' }}
      />
      
      <div className={`text-white font-bold ${fontSize} mb-2 text-center`}>
        {data.label}
      </div>
      {data.description && (
        <div className="text-xs text-gray-200 mt-2 bg-black/30 p-2 rounded border border-white/20">
          {data.description}
        </div>
      )}

      {/* Handle inferior para conexiones salientes */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-400 border-2 border-white"
        style={{ borderRadius: '50%' }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  mindmap: MindMapNodeComponent,
};

// Función para calcular layout automático con dagre
function getLayoutedElements(nodes: MindMapNode[], edges: MindMapEdge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

  // Convertir a formato dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Aplicar posiciones calculadas
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: nodeWithPosition.x - 100, y: nodeWithPosition.y - 50 },
      type: 'mindmap',
      data: {
        label: node.label,
        description: node.description,
        type: node.type || 'concept',
      },
    } as Node;
  });

  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    label: edge.label,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    labelStyle: { fill: '#818cf8', fontWeight: 600, fontSize: 12 },
  })) as Edge[];

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

const OracleView: React.FC<OracleViewProps> = ({ mindMapData, onClose, lang }) => {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(mindMapData.nodes, mindMapData.edges),
    [mindMapData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  
  // Estado para edición de nodos
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState('text-sm');
  const [nodeColor, setNodeColor] = useState('#6366f1'); // indigo-600 por defecto
  const [applyToAll, setApplyToAll] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      // Verificar que no exista ya esta conexión
      const edgeExists = edges.some(
        edge => edge.source === params.source && edge.target === params.target
      );
      if (!edgeExists) {
        setEdges((eds) => addEdge({
          ...params,
          id: `edge-${params.source}-${params.target}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          labelStyle: { fill: '#818cf8', fontWeight: 600, fontSize: 12 },
        }, eds));
      }
    },
    [setEdges, edges]
  );

  const onEdgeDelete = useCallback(
    (edgeIds: string[]) => {
      setEdges((eds) => eds.filter((edge) => !edgeIds.includes(edge.id)));
    },
    [setEdges]
  );

  const handleDownloadImage = async () => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    try {
      const canvas = await html2canvas(flowElement as HTMLElement, {
        backgroundColor: '#111827',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mindmap-${mindMapData.title || 'mapa'}-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Error descargando imagen:', error);
      alert(lang === 'ES' ? 'Error al descargar la imagen' : 'Error downloading image');
    }
  };

  const handleResetLayout = () => {
    const { nodes: resetNodes, edges: resetEdges } = getLayoutedElements(
      mindMapData.nodes,
      mindMapData.edges
    );
    setNodes(resetNodes);
    setEdges(resetEdges);
  };

  // Función para aplicar cambios de estilo a nodos
  const handleApplyNodeStyle = () => {
    if (applyToAll) {
      // Aplicar a todos los nodos
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            fontSize,
            customColor: nodeColor,
          },
        }))
      );
    } else if (selectedNodeId) {
      // Aplicar solo al nodo seleccionado
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  fontSize,
                  customColor: nodeColor,
                },
              }
            : node
        )
      );
    }
    setShowNodeEditor(false);
    setSelectedNodeId(null);
  };

  // Manejar selección de nodo
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setFontSize(node.data?.fontSize || 'text-sm');
    setNodeColor(node.data?.customColor || '#6366f1');
    setShowNodeEditor(true);
  };

  const translations = {
    ES: {
      title: '🔮 ORÁCULO VISUAL',
      subtitle: 'Mapa Mental Interactivo',
      download: 'Descargar Imagen',
      reset: 'Resetear Layout',
      close: 'Cerrar',
      editNode: 'Editar Nodo',
      fontSize: 'Tamaño de Fuente',
      nodeColor: 'Color del Nodo',
      applyToAll: 'Aplicar a Todos',
      apply: 'Aplicar',
      cancel: 'Cancelar',
    },
    EN: {
      title: '🔮 VISUAL ORACLE',
      subtitle: 'Interactive Mind Map',
      download: 'Download Image',
      reset: 'Reset Layout',
      close: 'Close',
      editNode: 'Edit Node',
      fontSize: 'Font Size',
      nodeColor: 'Node Color',
      applyToAll: 'Apply to All',
      apply: 'Apply',
      cancel: 'Cancel',
    },
    DE: {
      title: '🔮 VISUELLES ORACEL',
      subtitle: 'Interaktive Mindmap',
      download: 'Bild herunterladen',
      reset: 'Layout zurücksetzen',
      close: 'Schließen',
      editNode: 'Knoten bearbeiten',
      fontSize: 'Schriftgröße',
      nodeColor: 'Knotenfarbe',
      applyToAll: 'Auf alle anwenden',
      apply: 'Anwenden',
      cancel: 'Abbrechen',
    },
    FR: {
      title: '🔮 ORACLE VISUEL',
      subtitle: 'Carte Mentale Interactive',
      download: 'Télécharger Image',
      reset: 'Réinitialiser',
      close: 'Fermer',
      editNode: 'Modifier le nœud',
      fontSize: 'Taille de police',
      nodeColor: 'Couleur du nœud',
      applyToAll: 'Appliquer à tous',
      apply: 'Appliquer',
      cancel: 'Annuler',
    },
  };

  const t = translations[lang];

  return (
    <div className="w-full h-screen bg-[#111827] relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900/90 border-b-4 border-indigo-500 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400 pixel-font-header">{t.title}</h1>
          <p className="text-sm text-gray-400">{t.subtitle}</p>
          {mindMapData.title && (
            <p className="text-xs text-indigo-300 mt-1">{mindMapData.title}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            💡 {lang === 'ES' ? 'Arrastra desde un nodo a otro para conectar. Presiona Delete para eliminar conexiones.' : 
                lang === 'EN' ? 'Drag from one node to another to connect. Press Delete to remove connections.' :
                lang === 'DE' ? 'Ziehen Sie von einem Knoten zum anderen, um zu verbinden. Drücken Sie Löschen, um Verbindungen zu entfernen.' :
                'Glissez d\'un nœud à l\'autre pour connecter. Appuyez sur Supprimer pour supprimer les connexions.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNodeEditor(true)}
            className="px-4 py-2 bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold text-sm"
            title={t.editNode}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            {t.editNode}
          </button>
          <button
            onClick={handleResetLayout}
            className="px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold text-sm"
            title={t.reset}
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />
            {t.reset}
          </button>
          <button
            onClick={handleDownloadImage}
            className="px-4 py-2 bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold text-sm"
            title={t.download}
          >
            <Download className="w-4 h-4 inline mr-2" />
            {t.download}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-rose-600 text-white border-2 border-rose-500 hover:bg-rose-500 transition-colors font-bold text-sm"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Editor de Nodos - Panel Flotante */}
      {showNodeEditor && (
        <div className="absolute top-20 right-4 z-20 bg-gray-800 border-4 border-purple-500 p-4 rounded-lg shadow-2xl min-w-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-purple-400">{t.editNode}</h3>
            <button
              onClick={() => {
                setShowNodeEditor(false);
                setSelectedNodeId(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Tamaño de Fuente */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                <Type className="w-4 h-4 inline mr-2" />
                {t.fontSize}
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded px-3 py-2 font-bold"
              >
                <option value="text-xs">Muy Pequeño (xs)</option>
                <option value="text-sm">Pequeño (sm)</option>
                <option value="text-base">Mediano (base)</option>
                <option value="text-lg">Grande (lg)</option>
                <option value="text-xl">Muy Grande (xl)</option>
              </select>
            </div>

            {/* Color del Nodo */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                <Palette className="w-4 h-4 inline mr-2" />
                {t.nodeColor}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-16 h-10 border-2 border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="flex-1 bg-gray-700 text-white border-2 border-gray-600 rounded px-3 py-2 font-mono text-sm"
                  placeholder="#6366f1"
                />
              </div>
              {/* Colores predefinidos rápidos */}
              <div className="flex gap-2 mt-2">
                {['#6366f1', '#10b981', '#eab308', '#a855f7', '#f43f5e', '#3b82f6', '#f59e0b', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNodeColor(color)}
                    className="w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Aplicar a todos */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="applyToAll"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="applyToAll" className="text-sm text-gray-300">
                {t.applyToAll}
              </label>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyNodeStyle}
                className="flex-1 px-4 py-2 bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold"
              >
                {t.apply}
              </button>
              <button
                onClick={() => {
                  setShowNodeEditor(false);
                  setSelectedNodeId(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold"
              >
                {t.cancel}
              </button>
            </div>

            {selectedNodeId && (
              <p className="text-xs text-gray-400 text-center">
                {lang === 'ES' ? 'Nodo seleccionado: ' : lang === 'EN' ? 'Selected node: ' : lang === 'DE' ? 'Ausgewählter Knoten: ' : 'Nœud sélectionné: '}
                {nodes.find(n => n.id === selectedNodeId)?.data?.label}
              </p>
            )}
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="w-full h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgeDelete}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#111827]"
          connectionLineStyle={{ stroke: '#818cf8', strokeWidth: 2 }}
          connectionLineType="smoothstep"
          deleteKeyCode="Delete"
          nodesConnectable={true}
          nodesDraggable={true}
          elementsSelectable={true}
        >
          <Background
            color="#1f2937"
            gap={20}
            size={1}
            style={{ opacity: 0.3 }}
          />
          <Controls
            className="bg-gray-900 border-2 border-indigo-500"
            showInteractive={false}
          />
          <MiniMap
            className="bg-gray-900 border-2 border-indigo-500"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                concept: '#6366f1',
                person: '#10b981',
                event: '#eab308',
                process: '#a855f7',
                category: '#f43f5e',
              };
              return colors[node.data?.type] || '#6366f1';
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default OracleView;

