import { useRef, useState } from 'react';
import { Clock3, Grip } from 'lucide-react';

function secondsSince(date) {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date.replace(' ', 'T')).getTime()) / 1000));
}
function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function TableShape({ table, editMode }) {
  const isOccupied = table.status === 'occupied';
  const shape = table.table_type;
  const isIsland = shape === 'island';
  return (
    <div className={`table-shape table-${shape} ${isOccupied ? 'is-occupied' : 'is-free'} ${editMode ? 'is-editing' : ''}`}>
      {shape === 'billiard' && <div className="pockets"><i/><i/><i/><i/><i/><i/></div>}
      {isIsland && <div className="island-chairs"><i/><i/><i/><i/></div>}
      <div className="table-shape-inner">
        <strong>{table.name}</strong>
        {isOccupied ? (
          isIsland
            ? <><span className="island-copy">Cuenta abierta</span><span className="table-total">Bs. {Number(table.running_total || 0).toFixed(2)}</span></>
            : <><span className="table-time"><Clock3 size={12}/>{fmtDuration(secondsSince(table.opened_at))}</span><span className="table-total">Bs. {Number(table.running_total || 0).toFixed(2)}</span></>
        ) : (
          <>
            <span className="table-free-copy">{isIsland ? 'Sin cuenta' : 'Libre'}</span>
            {!isIsland && table.billing_mode === 'hourly' && <span className="table-rate-copy">Bs. {Number(table.hourly_rate || 0).toFixed(0)}/h</span>}
          </>
        )}
      </div>
      {editMode && <span className="drag-hint"><Grip size={13}/></span>}
    </div>
  );
}

export default function TableMap({ tables, onSelect, editMode=false, onMove }) {
  const mapRef = useRef(null);
  const [drag, setDrag] = useState(null);

  function pointerDown(e, table) {
    if (!editMode) return;
    e.preventDefault();
    const rect = mapRef.current.getBoundingClientRect();
    setDrag({ id: table.id, startX:e.clientX, startY:e.clientY, x:Number(table.layout_x), y:Number(table.layout_y), rect });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e) {
    if (!drag || !editMode) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    const node = document.querySelector(`[data-table-id="${drag.id}"]`);
    if (node) {
      node.style.left = `${Math.max(0, Math.min(95, drag.x + dx))}%`;
      node.style.top = `${Math.max(0, Math.min(95, drag.y + dy))}%`;
    }
  }
  async function pointerUp(e, table) {
    if (!drag || drag.id !== table.id) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    const x = Math.max(0, Math.min(95, drag.x + dx));
    const y = Math.max(0, Math.min(95, drag.y + dy));
    setDrag(null);
    await onMove?.(table.id, { layout_x:x, layout_y:y });
  }

  return (
    <div className="floor-wrap">
      <div className="floor-toolbar-note">
        <span><i className="status-dot free"/>Libre</span>
        <span><i className="status-dot busy"/>Ocupada</span>
        <span><i className="status-dot island"/>Isla de consumo</span>
        {editMode && <span className="edit-note">Arrastra las mesas para acomodar el salón.</span>}
      </div>
      <div className="floor-plan" ref={mapRef} onPointerMove={pointerMove}>
        <div className="floor-grid"/>
        <div className="fixture reception"><span>RECEPCIÓN</span><small>Caja</small></div>
        <div className="fixture door"><span>PUERTA</span></div>
        <div className="fixture wall-label cacho-label">CACHO</div>
        <div className="fixture wall-label poker-label">POKER</div>

        {tables.map(table => (
          <button
            key={table.id}
            data-table-id={table.id}
            className={`map-table ${table.table_type === 'island' ? 'map-table-island' : ''}`}
            style={{ left:`${table.layout_x}%`, top:`${table.layout_y}%`, width:`${table.layout_w}%`, height:`${table.layout_h}%`, transform:`rotate(${table.rotation || 0}deg)`, '--counter-rotation': `${-(Number(table.rotation)||0)}deg` }}
            onClick={() => !editMode && onSelect(table)}
            onPointerDown={(e)=>pointerDown(e,table)}
            onPointerUp={(e)=>pointerUp(e,table)}
            aria-label={`${table.name} ${table.status === 'occupied' ? 'ocupada' : 'libre'}`}
          >
            <TableShape table={table} editMode={editMode}/>
          </button>
        ))}
        <div className="floor-caption">SALÓN PRINCIPAL</div>
      </div>
    </div>
  );
}
