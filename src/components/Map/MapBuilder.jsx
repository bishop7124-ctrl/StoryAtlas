import { useState, useRef, useEffect, useCallback } from "react";

const loadPref = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
};

const TERRAINS = [
  { id: 'water', label: 'Deep Sea', color: '#075985', emoji: '🌊' },
  { id: 'grass', label: 'Plains',   color: '#2d5a27', emoji: '🌿' },
  { id: 'dirt',  label: 'Desert',   color: '#d4a373', emoji: '🏜️' },
  { id: 'snow',  label: 'Tundra',   color: '#e2e8f0', emoji: '❄️' },
  { id: 'mount', label: 'Mountain', color: '#4a4a4a', emoji: '⛰️' },
];

// Image icons that can be placed on the map
const MAP_ICONS = [
  { id: 'mountain', label: 'Mountain', emoji: '⛰️', svg: 'M50 80 L20 100 L80 100 Z' },
  { id: 'forest', label: 'Forest', emoji: '🌲', svg: 'M50 20 L30 60 L70 60 Z M50 10 L25 50 L75 50 Z' },
  { id: 'tree', label: 'Tree', emoji: '🌳', svg: 'M50 30 L30 70 L70 70 Z M50 20 L40 50 L60 50 Z' },
  { id: 'hill', label: 'Hill', emoji: '🏔️', svg: 'M20 80 Q50 30 80 80 Z' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', svg: 'M10 60 Q25 50 40 60 Q55 70 70 60 Q85 50 100 60 L100 100 L10 100 Z' },
  { id: 'castle', label: 'Castle', emoji: '🏰', svg: 'M20 100 L20 60 L30 60 L30 40 L40 40 L40 60 L50 60 L50 30 L60 30 L60 60 L70 60 L70 40 L80 40 L80 60 L90 60 L90 100 Z' },
  { id: 'village', label: 'Village', emoji: '🏘️', svg: 'M20 100 L20 60 L40 60 L40 40 L60 40 L60 60 L80 60 L80 100 Z M30 60 L30 50 L50 50 L50 60 Z' },
  { id: 'city', label: 'City', emoji: '🏙️', svg: 'M10 100 L10 40 L25 40 L25 20 L40 20 L40 50 L50 50 L50 10 L65 10 L65 50 L75 50 L75 30 L90 30 L90 100 Z' },
  { id: 'ruins', label: 'Ruins', emoji: '🗿', svg: 'M20 100 L25 70 L30 75 L35 65 L40 80 L45 70 L50 85 L55 70 L60 80 L65 65 L70 75 L75 70 L80 100 Z' },
  { id: 'temple', label: 'Temple', emoji: '🛕', svg: 'M50 20 L20 80 L80 80 Z M50 10 L30 50 L70 50 Z' },
  { id: 'tower', label: 'Tower', emoji: '🗼', svg: 'M40 100 L40 30 L45 25 L50 30 L55 25 L60 30 L60 100 Z' },
  { id: 'ship', label: 'Ship', emoji: '⛵', svg: 'M50 30 L30 60 L40 60 L40 80 L60 80 L60 60 L70 60 Z M50 20 L50 30 M40 40 L60 40' },
  { id: 'bridge', label: 'Bridge', emoji: '🌉', svg: 'M10 60 L90 60 L90 70 L10 70 Z M20 60 L20 40 L30 40 L30 60 M70 60 L70 40 L80 40 L80 60' },
  { id: 'cave', label: 'Cave', emoji: '🕳️', svg: 'M20 80 Q50 30 80 80 Z M35 70 Q50 50 65 70 Z' },
  { id: 'volcano', label: 'Volcano', emoji: '🌋', svg: 'M20 90 L40 40 L50 30 L60 40 L80 90 Z M45 35 L50 20 L55 35 Z' },
];

const PIN_COLORS = ['#ef4444','#f97316','#eab308','#189847','#3b82f6','#8b5cf6','#ec4899','#e2e8f0'];

const TOOL_BTN = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${active
    ? 'bg-[var(--accent)] text-[var(--bg-main)] shadow-lg shadow-[var(--accent)]/30'
    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`;

export default function MapBuilder({ store }) {
  const [viewMode, setViewMode] = useState('view');
  const [tool, setTool] = useState('pan');
  const [brush, setBrush] = useState(TERRAINS[1]);
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [regionMode, setRegionMode] = useState('polygon');
  const [editingColorId, setEditingColorId] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);

  const [markers, setMarkers] = useState(() => loadPref("nf_map_markers", []));
  const [regions, setRegions] = useState(() => loadPref("nf_map_regions", []));
  const [mapIcons, setMapIcons] = useState(() => loadPref("nf_map_icons", []));
  const [tempPoints, setTempPoints] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const containerRef = useRef(null);
  const tempPointsRef = useRef([]);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  // Keep refs in sync with state for use in non-reactive callbacks
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 2000;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    ctx.fillStyle = TERRAINS[0].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const savedMap = localStorage.getItem("nf_painted_map");
    if (savedMap) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = savedMap;
    }
  }, []);

  const saveAll = (nextMarkers = markers, nextRegions = regions, nextIcons = mapIcons) => {
    if (!canvasRef.current) return;
    localStorage.setItem("nf_painted_map", canvasRef.current.toDataURL());
    localStorage.setItem("nf_map_markers", JSON.stringify(nextMarkers));
    localStorage.setItem("nf_map_regions", JSON.stringify(nextRegions));
    localStorage.setItem("nf_map_icons", JSON.stringify(nextIcons));
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
      px: ((e.clientX - rect.left) / rect.width) * 100,
      py: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const paintTexture = (x, y) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const bs = brushSize;

    const rndColor = (hex, variance) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const v = () => Math.floor((Math.random() - 0.5) * variance * 2);
      const cl = n => Math.max(0, Math.min(255, n));
      return `rgb(${cl(r + v())},${cl(g + v())},${cl(b + v())})`;
    };

    if (brush.id === 'grass') {
      // Varied oval clumps
      for (let i = 0; i < 10; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.4 + 0.25) * (bs / 2);
        ctx.fillStyle = rndColor(brush.color, 22);
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, sz * 0.55, sz, Math.random() * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Grass blade strokes
      for (let i = 0; i < 6; i++) {
        const ox = (Math.random() - 0.5) * bs * 0.8;
        const oy = (Math.random() - 0.5) * bs * 0.8;
        const h = bs * (0.25 + Math.random() * 0.3);
        ctx.strokeStyle = rndColor('#3d7a30', 18);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.quadraticCurveTo(
          x + ox + (Math.random() - 0.5) * 6,
          y + oy - h * 0.5,
          x + ox + (Math.random() - 0.5) * 4,
          y + oy - h
        );
        ctx.stroke();
      }

    } else if (brush.id === 'mount') {
      // Angular rocky polygons
      for (let i = 0; i < 6; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.45 + 0.3) * (bs / 2);
        ctx.fillStyle = rndColor(brush.color, 28);
        const sides = 5 + Math.floor(Math.random() * 3);
        ctx.beginPath();
        for (let s = 0; s < sides; s++) {
          const angle = (s / sides) * Math.PI * 2 + Math.random() * 0.6;
          const r = sz * (0.55 + Math.random() * 0.45);
          const px = x + ox + Math.cos(angle) * r;
          const py = y + oy + Math.sin(angle) * r * 0.65;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        // Subtle highlight edge
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

    } else if (brush.id === 'dirt') {
      // Sandy stipple — lots of small varied dots
      for (let i = 0; i < 22; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.35 + 0.1) * (bs / 3);
        ctx.fillStyle = rndColor(brush.color, 32);
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, sz, sz * (0.7 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      // Occasional pebble
      for (let i = 0; i < 3; i++) {
        const ox = (Math.random() - 0.5) * bs * 0.7;
        const oy = (Math.random() - 0.5) * bs * 0.7;
        const sz = (Math.random() * 0.2 + 0.15) * (bs / 2.5);
        ctx.fillStyle = rndColor('#b08850', 20);
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, sz, sz * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (brush.id === 'snow') {
      // Soft white blobs
      for (let i = 0; i < 12; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.4 + 0.2) * (bs / 2.5);
        ctx.fillStyle = rndColor(brush.color, 14);
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      // Snowflake crosses
      for (let i = 0; i < 3; i++) {
        const ox = (Math.random() - 0.5) * bs * 0.7;
        const oy = (Math.random() - 0.5) * bs * 0.7;
        const len = bs * 0.14;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        for (let a = 0; a < 3; a++) {
          const angle = (a / 3) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(x + ox - Math.cos(angle) * len, y + oy - Math.sin(angle) * len);
          ctx.lineTo(x + ox + Math.cos(angle) * len, y + oy + Math.sin(angle) * len);
          ctx.stroke();
        }
      }

    } else if (brush.id === 'water') {
      // Smooth oval sweeps
      for (let i = 0; i < 7; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.5 + 0.35) * (bs / 2);
        ctx.fillStyle = rndColor(brush.color, 14);
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, sz, sz * 0.55, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Wave shimmer strokes
      for (let i = 0; i < 4; i++) {
        const ox = (Math.random() - 0.5) * bs * 0.8;
        const oy = (Math.random() - 0.5) * bs * 0.8;
        const ww = bs * (0.18 + Math.random() * 0.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + ox - ww / 2, y + oy);
        ctx.quadraticCurveTo(x + ox, y + oy - 4, x + ox + ww / 2, y + oy);
        ctx.stroke();
      }

    } else {
      // Fallback — plain blobs
      ctx.fillStyle = brush.color;
      for (let i = 0; i < 8; i++) {
        const ox = (Math.random() - 0.5) * bs;
        const oy = (Math.random() - 0.5) * bs;
        const sz = (Math.random() * 0.5 + 0.5) * (bs / 2);
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, sz, sz * 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const fitMap = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const newZoom = Math.min((clientWidth - 40) / 2000, (clientHeight - 40) / 1200);
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  // Center map on mount
  useEffect(() => {
    fitMap();
  }, [fitMap]);

  // Zoom with cursor focus — uses refs so handler never goes stale
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const delta = e.deltaY * 0.001;
      const newZoom = Math.min(3, Math.max(0.15, +(currentZoom - delta).toFixed(3)));
      const zoomRatio = newZoom / currentZoom;
      // Map is centered in the container, so correct origin is container centre
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const newPanX = currentPan.x * zoomRatio + (mouseX - cx) * (1 - zoomRatio);
      const newPanY = currentPan.y * zoomRatio + (mouseY - cy) * (1 - zoomRatio);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Escape') {
        setViewMode('view');
        clearTempPoints();
        setIsDrawing(false);
      } else if (e.key === 'v') {
        setViewMode('view');
      } else if (e.key === 'e') {
        setViewMode('edit');
      } else if (e.key === 'f') {
        fitMap();
      } else if (e.key === 'b') {
        setViewMode('edit');
        setTool('paint');
      } else if (e.key === 'm') {
        setViewMode('edit');
        setTool('marker');
      } else if (e.key === 'r') {
        setViewMode('edit');
        setTool('region');
      } else if (e.key === 'i' && viewMode === 'edit') {
        setTool('icon');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setShowSidebar(s => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, fitMap]);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const clearTempPoints = () => {
    tempPointsRef.current = [];
    setTempPoints([]);
  };

  const finishRegion = () => {
    const pts = tempPointsRef.current;
    if (pts.length < 3) { clearTempPoints(); return; }
    const name = prompt("Name this region:", "New Kingdom");
    if (name) {
      const newLoc = store.saveLocation({ name, category: 'Kingdom/Region', description: '' });
      const next = [...regions, { id: Date.now(), locationId: newLoc.id, points: pts, label: name }];
      setRegions(next);
      saveAll(markers, next, mapIcons);
    }
    clearTempPoints();
  };

  const handleEditMouseDown = (e) => {
    const c = getCoords(e);
    if (tool === 'paint') {
      setIsDrawing(true);
      paintTexture(c.x, c.y);
      saveAll();
    } else if (tool === 'marker') {
      const name = prompt("Name this place:", "New Town");
      if (name) {
        const newLoc = store.saveLocation({ name, category: 'Town', description: '' });
        const next = [...markers, { id: Date.now(), locationId: newLoc.id, x: c.px, y: c.py, label: name, color: '#ef4444' }];
        setMarkers(next);
        saveAll(next, regions, mapIcons);
      }
    } else if (tool === 'icon') {
      if (selectedIcon) {
        const name = prompt(`Name this ${selectedIcon.label}:`, `New ${selectedIcon.label}`);
        if (name) {
          const newLoc = store.saveLocation({ name, category: selectedIcon.label, description: '' });
          const next = [...mapIcons, { id: Date.now(), locationId: newLoc.id, x: c.px, y: c.py, label: name, iconId: selectedIcon.id }];
          setMapIcons(next);
          saveAll(markers, regions, next);
        }
      }
    } else if (tool === 'region') {
      if (regionMode === 'polygon') {
        const newPts = [...tempPointsRef.current, { x: c.px, y: c.py }];
        tempPointsRef.current = newPts;
        setTempPoints(newPts);
      } else {
        tempPointsRef.current = [{ x: c.px, y: c.py }];
        setTempPoints([{ x: c.px, y: c.py }]);
        setIsDrawing(true);
      }
    }
  };

  const handleEditMouseMove = (e) => {
    if (!isDrawing) return;
    const c = getCoords(e);
    if (tool === 'paint') {
      paintTexture(c.x, c.y);
    } else if (tool === 'region' && regionMode === 'brush') {
      const last = tempPointsRef.current[tempPointsRef.current.length - 1];
      if (last && Math.hypot(c.px - last.x, c.py - last.y) < 0.3) return;
      const newPts = [...tempPointsRef.current, { x: c.px, y: c.py }];
      tempPointsRef.current = newPts;
      setTempPoints(newPts);
    }
  };

  const handleEditMouseUp = () => {
    if (tool === 'region' && regionMode === 'brush' && isDrawing) {
      setIsDrawing(false);
      finishRegion();
    } else {
      setIsDrawing(false);
      if (tool === 'paint') saveAll();
    }
  };

  const handleEditMouseLeave = () => {
    if (tool === 'region' && regionMode === 'brush' && isDrawing) {
      setIsDrawing(false);
      finishRegion();
    } else {
      setIsDrawing(false);
    }
  };

  const handleContainerMouseDown = (e) => {
    if (viewMode === 'view' || tool === 'pan') {
      if (e.target === e.currentTarget || e.target === canvasRef.current) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleContainerMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);
  };

  const handleReset = () => {
    if (!confirm("Reset the entire map? This cannot be undone.")) return;
    ctxRef.current.fillStyle = TERRAINS[0].color;
    ctxRef.current.fillRect(0, 0, 2000, 1200);
    setMarkers([]);
    setRegions([]);
    setMapIcons([]);
    saveAll([], [], []);
  };

  const teleportToLocation = (locationId) => {
    store.setSelectedLocationId?.(locationId);
    window.dispatchEvent(new CustomEvent('switch-section', { detail: { section: 'locations' } }));
    setActivePopup(null);
  };

  const updateMarkerColor = (id, color) => {
    const next = markers.map(m => m.id === id ? { ...m, color } : m);
    setMarkers(next);
    saveAll(next, regions, mapIcons);
    setEditingColorId(null);
  };

  const canvasCursor = viewMode === 'edit'
    ? tool === 'pan' ? 'grab'
    : tool === 'paint' || (tool === 'region' && regionMode === 'brush') ? 'crosshair'
    : tool === 'icon' ? 'copy'
    : 'cell'
    : 'grab';

  const mapW = 2000 * zoom;
  const mapH = 1200 * zoom;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] overflow-hidden relative">
      
      {/* ── FLOATING TOOLBAR (top center) ── */}
      {showToolbar && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-2xl">
          {/* View/Edit toggle */}
          <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => { setViewMode('view'); clearTempPoints(); setIsDrawing(false); setTool('pan'); }}
              className={TOOL_BTN(viewMode === 'view')}
            >👁 View</button>
            <button onClick={() => setViewMode('edit')} className={TOOL_BTN(viewMode === 'edit')}>
              ✏️ Edit
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--border)]" />

          {/* Zoom controls */}
          <div className="flex items-center bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setZoom(z => Math.max(0.15, +(z - 0.1).toFixed(2)))}
              className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              title="Zoom out"
            >−</button>
            <button
              onClick={fitMap}
              className="px-2 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors min-w-[3rem] text-center"
              title="Fit to screen (F)"
            >{Math.round(zoom * 100)}%</button>
            <button
              onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              title="Zoom in"
            >+</button>
          </div>

          {/* Edit tools */}
          {viewMode === 'edit' && (
            <>
              <div className="w-px h-6 bg-[var(--border)]" />

              <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border)]">
                <button onClick={() => setTool('pan')} className={TOOL_BTN(tool === 'pan')} title="Pan (P)">✋</button>
                <button onClick={() => setTool('paint')} className={TOOL_BTN(tool === 'paint')} title="Paint (B)">🖌️</button>
                <button onClick={() => setTool('marker')} className={TOOL_BTN(tool === 'marker')} title="Marker (M)">📍</button>
                <button onClick={() => setTool('icon')} className={TOOL_BTN(tool === 'icon')} title="Icon (I)">🖼️</button>
                <button onClick={() => setTool('region')} className={TOOL_BTN(tool === 'region')} title="Region (R)">⬢</button>
              </div>

              {/* Paint options */}
              {tool === 'paint' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border)]">
                  {TERRAINS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setBrush(t)}
                      title={t.label}
                      className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-sm ${brush.id === t.id ? 'border-[var(--accent)] scale-110 shadow-lg shadow-[var(--accent)]/30' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: t.color }}
                    >{t.emoji}</button>
                  ))}
                  <input
                    type="range" min="10" max="150" value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value))}
                    className="w-20 ml-1"
                    title={`Brush size: ${brushSize}px`}
                  />
                </div>
              )}

              {/* Icon picker */}
              {tool === 'icon' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border)] max-w-48 overflow-x-auto">
                  {MAP_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      onClick={() => setSelectedIcon(selectedIcon?.id === icon.id ? null : icon)}
                      title={icon.label}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${selectedIcon?.id === icon.id ? 'bg-[var(--accent)] text-[var(--bg-main)] scale-110' : 'hover:bg-[var(--bg-hover)]'}`}
                    >{icon.emoji}</button>
                  ))}
                </div>
              )}

              {/* Region options */}
              {tool === 'region' && (
                <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border)]">
                  <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border)]">
                    <button
                      onClick={() => { setRegionMode('polygon'); clearTempPoints(); }}
                      className={TOOL_BTN(regionMode === 'polygon')}
                    >⬡ Click</button>
                    <button
                      onClick={() => { setRegionMode('brush'); clearTempPoints(); }}
                      className={TOOL_BTN(regionMode === 'brush')}
                    >✏ Draw</button>
                  </div>
                  {regionMode === 'polygon' && tempPoints.length > 0 && (
                    <button
                      onClick={finishRegion}
                      className="text-xs bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >✓ Finish ({tempPoints.length})</button>
                  )}
                </div>
              )}

              <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-400 transition-colors px-2">
                Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* ── FLOATING ZOOM CONTROLS (bottom right) ── */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg text-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-nav)] transition-all"
          title="Zoom in"
        >+</button>
        <button
          onClick={fitMap}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-nav)] transition-all"
          title="Fit to screen"
        >Fit</button>
        <button
          onClick={() => setZoom(z => Math.max(0.15, +(z - 0.1).toFixed(2)))}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg text-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-nav)] transition-all"
          title="Zoom out"
        >−</button>
      </div>

      {/* ── TOGGLE SIDEBAR BUTTON (right side) ── */}
      <button
        onClick={() => setShowSidebar(s => !s)}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg text-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-nav)] transition-all"
        title="Toggle sidebar (Tab)"
      >☰</button>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Map Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-[var(--bg-main)] relative"
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          onClick={() => { if (viewMode === 'view') setActivePopup(null); setEditingColorId(null); }}
          style={{ cursor: isPanning ? 'grabbing' : canvasCursor }}
        >
          {/* Grid background for better visibility */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ 
              backgroundImage: 'radial-gradient(circle, var(--text-muted) 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          />

          <div
            className="absolute"
            style={{ 
              width: `${mapW}px`, 
              height: `${mapH}px`, 
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              left: '50%',
              top: '50%',
              marginLeft: `-${mapW / 2}px`,
              marginTop: `-${mapH / 2}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={viewMode === 'edit' && tool !== 'pan' ? handleEditMouseDown : undefined}
              onMouseMove={viewMode === 'edit' ? handleEditMouseMove : undefined}
              onMouseUp={viewMode === 'edit' ? handleEditMouseUp : undefined}
              onMouseLeave={viewMode === 'edit' ? handleEditMouseLeave : undefined}
              style={{ width: `${mapW}px`, height: `${mapH}px`, display: 'block', borderRadius: '8px' }}
            />

            {/* SVG overlay for markers, icons & regions */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: `${mapW}px`, height: `${mapH}px` }}
              viewBox="0 0 2000 1200"
            >
              {/* Regions */}
              {regions.map(reg => {
                const cx = reg.points.reduce((s, p) => s + p.x * 20, 0) / reg.points.length;
                const cy = reg.points.reduce((s, p) => s + p.y * 12, 0) / reg.points.length;
                const isActive = activePopup?.id === reg.id;
                return (
                  <g
                    key={reg.id}
                    style={{ pointerEvents: viewMode === 'view' ? 'all' : 'none', cursor: viewMode === 'view' ? 'pointer' : 'default' }}
                    onClick={e => {
                      e.stopPropagation();
                      if (viewMode === 'view') setActivePopup(isActive ? null : {
                        type: 'region', id: reg.id, label: reg.label,
                        locationId: reg.locationId, svgX: cx, svgY: cy,
                      });
                    }}
                  >
                    <polygon
                      points={reg.points.map(p => `${p.x * 20},${p.y * 12}`).join(' ')}
                      fill={isActive ? 'var(--accent-fade)' : 'rgba(245,158,11,0.15)'}
                      stroke="var(--accent)"
                      strokeWidth={isActive ? 3 : 2}
                      strokeDasharray={viewMode === 'edit' ? '6 3' : 'none'}
                    />
                    <text x={cx} y={cy} textAnchor="middle" fill="var(--accent)"
                      fontSize="16" fontWeight="700" fontFamily="system-ui"
                      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: '4px' }}>
                      {reg.label}
                    </text>
                  </g>
                );
              })}

              {/* Temporary polygon while drawing */}
              {tempPoints.length > 0 && (
                <polyline
                  points={tempPoints.map(p => `${p.x * 20},${p.y * 12}`).join(' ')}
                  fill="none" stroke="white" strokeDasharray="5 5" strokeWidth="2"
                />
              )}

              {/* Map Icons */}
              {mapIcons.map(icon => {
                const iconData = MAP_ICONS.find(i => i.id === icon.iconId);
                const isActive = activePopup?.id === icon.id;
                return (
                  <g
                    key={icon.id}
                    transform={`translate(${icon.x * 20}, ${icon.y * 12})`}
                    style={{ pointerEvents: viewMode === 'view' ? 'all' : 'none', cursor: viewMode === 'view' ? 'pointer' : 'default' }}
                    onClick={e => {
                      e.stopPropagation();
                      if (viewMode === 'view') setActivePopup(isActive ? null : {
                        type: 'icon', id: icon.id, label: icon.label,
                        locationId: icon.locationId, svgX: icon.x * 20, svgY: icon.y * 12, iconId: icon.iconId,
                      });
                    }}
                  >
                    <circle r="20" fill="transparent" />
                    {/* Icon background */}
                    <circle r="16" fill={isActive ? 'var(--accent)' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2" />
                    {/* Icon emoji rendered as text */}
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fontSize="18"
                      fill="white"
                    >
                      {iconData?.emoji || '🖼️'}
                    </text>
                    <text y="-22" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="system-ui"
                      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.7)', strokeWidth: '3px' }}>
                      {icon.label}
                    </text>
                  </g>
                );
              })}

              {/* Markers */}
              {markers.map(m => {
                const isActive = activePopup?.id === m.id;
                const pinColor = m.color || '#ef4444';
                return (
                  <g
                    key={m.id}
                    transform={`translate(${m.x * 20}, ${m.y * 12})`}
                    style={{ pointerEvents: viewMode === 'view' ? 'all' : 'none', cursor: viewMode === 'view' ? 'pointer' : 'default' }}
                    onClick={e => {
                      e.stopPropagation();
                      if (viewMode === 'view') setActivePopup(isActive ? null : {
                        type: 'marker', id: m.id, label: m.label,
                        locationId: m.locationId, svgX: m.x * 20, svgY: m.y * 12,
                      });
                    }}
                  >
                    <circle r="12" fill="transparent" />
                    <circle r="7" fill={isActive ? 'var(--accent)' : pinColor} stroke="white" strokeWidth="2" />
                    <text y="-16" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="system-ui"
                      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.7)', strokeWidth: '4px' }}>
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* View mode: location popup */}
            {viewMode === 'view' && activePopup && (() => {
              const loc = store.locations?.find(l => l.id === activePopup.locationId);
              const icon = activePopup.type === 'region' ? '⬢' : activePopup.type === 'icon' ? (MAP_ICONS.find(i => i.id === activePopup.iconId)?.emoji || '🖼️') : '📍';
              const left = Math.min(activePopup.svgX * zoom + 20, mapW - 250);
              const top  = Math.max(activePopup.svgY * zoom - 100, 8);
              return (
                <div
                  className="absolute z-30 bg-[var(--bg-nav)]/95 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-2xl p-4 w-60"
                  style={{ left, top, pointerEvents: 'all' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-[var(--text-main)]">{icon} {activePopup.label}</span>
                    <button onClick={() => setActivePopup(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg leading-none flex-shrink-0">✕</button>
                  </div>
                  {loc?.category && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-fade)] px-2.5 py-1 rounded-lg mb-3">{loc.category}</span>
                  )}
                  {loc?.description && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3 line-clamp-3">{loc.description}</p>
                  )}
                  {loc ? (
                    <button
                      onClick={() => teleportToLocation(loc.id)}
                      className="w-full text-xs font-semibold bg-[var(--accent-fade)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--bg-main)] border border-[var(--accent)]/30 px-4 py-2 rounded-xl transition-all"
                    >Open in Atlas →</button>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] italic">No location record found.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── COLLAPSIBLE SIDEBAR (right side) ── */}
        {showSidebar && (
          <div className="w-56 bg-[var(--bg-nav)]/80 backdrop-blur-sm border-l border-[var(--border)] flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-widest">World Atlas</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {markers.length === 0 && regions.length === 0 && mapIcons.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] italic px-2 pt-2">
                  {viewMode === 'edit'
                    ? 'Use tools to add locations.'
                    : 'No locations yet.'}
                </p>
              )}

              {/* Markers */}
              {markers.map(m => {
                const pinColor = m.color || '#ef4444';
                return (
                  <div key={m.id} className="relative group">
                    <div
                      onClick={() => {
                        if (viewMode === 'view') {
                          setActivePopup(activePopup?.id === m.id ? null : {
                            type: 'marker', id: m.id, label: m.label,
                            locationId: m.locationId, svgX: m.x * 20, svgY: m.y * 12,
                          });
                        } else {
                          setEditingColorId(editingColorId === m.id ? null : m.id);
                        }
                      }}
                      className={`text-xs p-2.5 rounded-lg flex justify-between items-center transition-all cursor-pointer
                        ${activePopup?.id === m.id
                          ? 'bg-[var(--accent-fade)] text-[var(--accent)]'
                          : 'text-[var(--text-main)] bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]/80'}`}
                    >
                      <span className="truncate flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0"
                          style={{ backgroundColor: pinColor }}
                        />
                        {m.label}
                      </span>
                      {viewMode === 'edit' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const next = markers.filter(x => x.id !== m.id);
                            setMarkers(next);
                            saveAll(next, regions, mapIcons);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 ml-1 flex-shrink-0"
                        >×</button>
                      )}
                    </div>

                    {viewMode === 'edit' && editingColorId === m.id && (
                      <div
                        className="absolute left-0 right-0 z-10 bg-[var(--bg-nav)] border border-[var(--border)] rounded-lg p-2 flex flex-wrap gap-1.5 shadow-xl"
                        style={{ top: '100%', marginTop: '4px' }}
                      >
                        {PIN_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => updateMarkerColor(m.id, c)}
                            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125"
                            style={{ backgroundColor: c, borderColor: pinColor === c ? 'white' : 'transparent' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Map Icons */}
              {mapIcons.map(icon => {
                const iconData = MAP_ICONS.find(i => i.id === icon.iconId);
                return (
                  <div
                    key={icon.id}
                    onClick={() => viewMode === 'view' && setActivePopup(
                      activePopup?.id === icon.id ? null :
                      { type: 'icon', id: icon.id, label: icon.label, locationId: icon.locationId, svgX: icon.x * 20, svgY: icon.y * 12, iconId: icon.iconId }
                    )}
                    className={`text-xs p-2.5 rounded-lg flex justify-between items-center transition-all group
                      ${viewMode === 'view' ? 'cursor-pointer hover:bg-[var(--bg-hover)]/80' : ''}
                      ${activePopup?.id === icon.id
                        ? 'bg-[var(--accent-fade)] text-[var(--accent)]'
                        : 'text-[var(--text-main)] bg-[var(--bg-hover)]'}`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span className="text-base">{iconData?.emoji || '🖼️'}</span>
                      {icon.label}
                    </span>
                    {viewMode === 'edit' && (
                      <button
                        onClick={() => { const next = mapIcons.filter(x => x.id !== icon.id); setMapIcons(next); saveAll(markers, regions, next); }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 ml-1 flex-shrink-0"
                      >×</button>
                    )}
                  </div>
                );
              })}

              {/* Regions */}
              {regions.map(r => {
                const cx = r.points.reduce((s, p) => s + p.x * 20, 0) / r.points.length;
                const cy = r.points.reduce((s, p) => s + p.y * 12, 0) / r.points.length;
                return (
                  <div
                    key={r.id}
                    onClick={() => viewMode === 'view' && setActivePopup(
                      activePopup?.id === r.id ? null :
                      { type: 'region', id: r.id, label: r.label, locationId: r.locationId, svgX: cx, svgY: cy }
                    )}
                    className={`text-xs p-2.5 rounded-lg flex justify-between items-center transition-all group
                      ${viewMode === 'view' ? 'cursor-pointer hover:bg-[var(--bg-hover)]/80' : ''}
                      ${activePopup?.id === r.id
                        ? 'bg-[var(--accent-fade)] text-[var(--accent)]'
                        : 'text-[var(--text-main)] bg-[var(--bg-hover)]'}`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span>⬢</span>
                      {r.label}
                    </span>
                    {viewMode === 'edit' && (
                      <button
                        onClick={() => { const next = regions.filter(x => x.id !== r.id); setRegions(next); saveAll(markers, next, mapIcons); }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 ml-1 flex-shrink-0"
                      >×</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── KEYBOARD SHORTCUTS HINT ── */}
      <div className="absolute bottom-4 left-4 z-40 text-[10px] text-[var(--text-muted)]/50 flex gap-3">
        <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-nav)]/50 rounded border border-[var(--border)]">V</kbd> View</span>
        <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-nav)]/50 rounded border border-[var(--border)]">E</kbd> Edit</span>
        <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-nav)]/50 rounded border border-[var(--border)]">F</kbd> Fit</span>
        <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-nav)]/50 rounded border border-[var(--border)]">Tab</kbd> Atlas</span>
      </div>
    </div>
  );
}