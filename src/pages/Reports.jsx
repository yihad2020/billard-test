import { useEffect, useMemo, useState } from 'react';
import { get } from '../api';

const money = value => `Bs. ${Number(value || 0).toFixed(2)}`;
const numberValue = value => Number(value || 0);

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  qr: 'QR',
  card: 'Tarjeta',
  other: 'Otro',
};

const SALE_TYPE_LABELS = {
  table: 'Mesa',
  pos: 'Venta directa',
};

const WEEKDAY_LABELS = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const TABLE_TYPE_LABELS = {
  billiard: 'Billar',
  cacho: 'Cacho',
  poker: 'Póker',
  island: 'Isla',
};

const RANGE_LABELS = {
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  '1y': 'Último año',
  custom: 'Rango personalizado',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDateISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDateTimeParam(date) {
  return `${localDateISO(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function resolvePreset(key) {
  const now = new Date();
  if (key === '24h') return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
  if (key === '7d') return { start: startOfDay(addDays(now, -6)), end: now };
  if (key === '30d') return { start: startOfDay(addDays(now, -29)), end: now };
  if (key === '90d') return { start: startOfDay(addDays(now, -89)), end: now };
  if (key === '1y') {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return { start: startOfDay(start), end: now };
  }
  return { start: startOfDay(now), end: now };
}

function safeFilePart(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function parseLocalDate(value) {
  if (!value) return null;
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = parseLocalDate(value);
  if (!date) return value || '';
  return date.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function humanAction(action) {
  return ({
    login: 'inició sesión',
    logout: 'cerró sesión',
    open_table: 'abrió una mesa',
    close_table: 'cerró y cobró una mesa',
    add_table_item: 'agregó un consumo',
    remove_table_item: 'quitó un consumo',
    adjust_stock: 'ajustó inventario',
    pos_sale: 'registró una venta directa',
    cash_movement: 'registró movimiento de caja',
    open_cash: 'abrió caja',
    close_cash: 'cerró caja',
    create_product: 'creó un producto',
    update_product: 'actualizó un producto',
    move_table: 'movió una mesa',
    transfer_table_session: 'traspasó una sesión de mesa',
    move_table_to_island: 'cortó el tiempo y pasó la cuenta a una isla',
    update_manual_charge: 'actualizó un cobro manual',
    create_user: 'creó un usuario',
    update_user: 'actualizó un usuario',
    update_table: 'actualizó una mesa',
  })[action] || action;
}

function searchableValue(row, fields) {
  return fields
    .map(field => (typeof field === 'function' ? field(row) : row?.[field]))
    .filter(value => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();
}

function ReportTable({
  eyebrow,
  title,
  description,
  rows = [],
  columns = [],
  searchFields = [],
  searchPlaceholder = 'Buscar…',
  filters = [],
  initialPageSize = 10,
  emptyText = 'No hay registros para este período.',
}) {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState(() => Object.fromEntries(filters.map(filter => [filter.key, 'all'])));

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(row => {
      if (term && searchFields.length && !searchableValue(row, searchFields).includes(term)) return false;
      return filters.every(filter => {
        const selected = filterValues[filter.key] || 'all';
        if (selected === 'all') return true;
        const value = typeof filter.value === 'function' ? filter.value(row) : row?.[filter.key];
        return String(value ?? '') === String(selected);
      });
    });
  }, [rows, query, searchFields, filters, filterValues]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize, filterValues, rows]);

  function setFilter(key, value) {
    setFilterValues(current => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel flat report-data-panel">
      <div className="panel-head report-data-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <span className="report-count">{filteredRows.length} registro{filteredRows.length === 1 ? '' : 's'}</span>
      </div>

      <div className="report-table-toolbar">
        <label className="report-search-field">
          <span>Buscar</span>
          <input
            className="input"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>

        {filters.map(filter => (
          <label className="report-filter-field" key={filter.key}>
            <span>{filter.label}</span>
            <select className="input" value={filterValues[filter.key] || 'all'} onChange={event => setFilter(filter.key, event.target.value)}>
              <option value="all">Todos</option>
              {filter.options.map(option => (
                <option key={String(option.value)} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}

        <label className="report-page-size">
          <span>Filas</span>
          <select className="input" value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>
            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div className="responsive-table report-responsive-table">
        <table>
          <thead>
            <tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.id ?? row.sale_number ?? row.cashier_id ?? row.day ?? row.product_name ?? row.table_name ?? `${safePage}-${index}`}>
                {columns.map(column => (
                  <td key={column.key}>{column.render ? column.render(row) : row?.[column.key]}</td>
                ))}
              </tr>
            ))}
            {!visibleRows.length && (
              <tr><td className="report-table-empty" colSpan={Math.max(columns.length, 1)}>{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="report-pagination">
        <span>
          {filteredRows.length
            ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredRows.length)} de ${filteredRows.length}`
            : '0 registros'}
        </span>
        <div>
          <button className="secondary-button report-page-button" disabled={safePage <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Anterior</button>
          <span className="report-page-indicator">Página {safePage} de {pageCount}</span>
          <button className="secondary-button report-page-button" disabled={safePage >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>Siguiente</button>
        </div>
      </div>
    </section>
  );
}

export default function Reports() {
  const defaultRange = resolvePreset('7d');
  const [rangeKey, setRangeKey] = useState('7d');
  const [from, setFrom] = useState(localDateISO(defaultRange.start));
  const [to, setTo] = useState(localDateISO(defaultRange.end));
  const [fromAt, setFromAt] = useState(localDateTimeParam(defaultRange.start));
  const [toAt, setToAt] = useState(localDateTimeParam(defaultRange.end));
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  async function loadRange(start, end, key, customFrom = null, customTo = null) {
    const startParam = localDateTimeParam(start);
    const endParam = localDateTimeParam(end);
    const startDate = customFrom || localDateISO(start);
    const endDate = customTo || localDateISO(end);

    setRangeKey(key);
    setFrom(startDate);
    setTo(endDate);
    setFromAt(startParam);
    setToAt(endParam);
    setError('');
    setLoading(true);

    try {
      const query = `from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}&from_at=${encodeURIComponent(startParam)}&to_at=${encodeURIComponent(endParam)}`;
      const [report, auditResponse] = await Promise.all([
        get(`/reports/daily?${query}`),
        get(`/reports/audit?from_at=${encodeURIComponent(startParam)}&to_at=${encodeURIComponent(endParam)}`),
      ]);
      setData(report);
      setAudit(auditResponse.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(key) {
    const range = resolvePreset(key);
    loadRange(range.start, range.end, key);
  }

  function applyCustomRange() {
    if (!from || !to) return;
    const start = startOfDay(new Date(`${from}T12:00:00`));
    const end = endOfDay(new Date(`${to}T12:00:00`));
    if (start.getTime() > end.getTime()) {
      setError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    loadRange(start, end, 'custom', from, to);
  }

  useEffect(() => {
    loadRange(defaultRange.start, defaultRange.end, '7d');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary || {
    total: 0,
    sales_count: 0,
    products_total: 0,
    game_total: 0,
    average_ticket: 0,
    table_sales: 0,
    pos_sales: 0,
    top_seller: null,
    top_product: null,
    best_day: null,
    top_payment: null,
  };

  const sellers = data?.cashiers || [];
  const products = data?.products || [];
  const daily = data?.daily || [];
  const sales = data?.sales || [];
  const payments = data?.payments || [];
  const tables = data?.tables || [];
  const canExport = Boolean(data && !loading);

  const sellerOptions = sellers.map(item => ({ value: item.cashier_id, label: item.cashier_name }));
  const paymentOptions = [...new Map(sales.map(item => [item.payment_method, { value: item.payment_method, label: PAYMENT_LABELS[item.payment_method] || item.payment_method }])).values()];
  const saleTypeOptions = [...new Map(sales.map(item => [item.sale_type, { value: item.sale_type, label: SALE_TYPE_LABELS[item.sale_type] || item.sale_type }])).values()];
  const auditActionOptions = [...new Set(audit.map(item => item.action))].sort().map(action => ({ value: action, label: humanAction(action) }));
  const sellerRoleOptions = [...new Map(sellers.map(item => [item.role, { value: item.role, label: item.role_label || item.role }])).values()];
  const weekdayOptions = [...new Set(daily.map(item => item.weekday))]
    .sort((a, b) => a - b)
    .map(value => ({ value, label: WEEKDAY_LABELS[value] || String(value) }));
  const productCategoryOptions = [...new Map(products.map(item => [item.category_id, { value: item.category_id, label: item.category_name || 'Sin categoría' }])).values()];
  const tableTypeOptions = [...new Map(tables.map(item => [item.table_type, { value: item.table_type, label: TABLE_TYPE_LABELS[item.table_type] || item.table_type }])).values()];

  const rangeDisplay = `${formatDateTime(fromAt)} — ${formatDateTime(toAt)}`;

  async function exportExcel() {
    if (!data || exporting) return;
    setExporting('excel');
    setError('');

    try {
      const excelModule = await import('exceljs');
      const ExcelJS = excelModule.default || excelModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Billar Control';
      workbook.created = new Date();

      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173020' } },
        alignment: { vertical: 'middle' },
      };

      function styleTable(sheet, headerRow = 1) {
        const row = sheet.getRow(headerRow);
        row.eachCell(cell => { cell.style = headerStyle; });
        row.height = 22;
        sheet.views = [{ state: 'frozen', ySplit: headerRow }];
        sheet.columns.forEach(column => {
          let longest = 12;
          column.eachCell({ includeEmpty: false }, cell => {
            longest = Math.max(longest, String(cell.value ?? '').length + 2);
          });
          column.width = Math.min(Math.max(longest, 12), 34);
        });
      }

      const summarySheet = workbook.addWorksheet('Resumen');
      summarySheet.mergeCells('A1:C1');
      summarySheet.getCell('A1').value = 'BILLAR CENTRAL - Reporte de gestión';
      summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF173020' } };
      summarySheet.addRow(['Período', RANGE_LABELS[rangeKey] || RANGE_LABELS.custom]);
      summarySheet.addRow(['Desde', formatDateTime(fromAt)]);
      summarySheet.addRow(['Hasta', formatDateTime(toAt)]);
      summarySheet.addRow([]);
      summarySheet.addRow(['Métrica', 'Valor', 'Detalle']);
      summarySheet.addRow(['Facturación', numberValue(summary.total), `${summary.sales_count} ventas`]);
      summarySheet.addRow(['Ticket promedio', numberValue(summary.average_ticket), 'Promedio por venta']);
      summarySheet.addRow(['Ingreso por mesas', numberValue(summary.game_total), `${summary.table_sales} ventas con mesa`]);
      summarySheet.addRow(['Productos', numberValue(summary.products_total), `${summary.pos_sales} ventas directas`]);
      summarySheet.addRow(['Mejor vendedor', summary.top_seller?.cashier_name || 'Sin datos', summary.top_seller ? `${summary.top_seller.sales_count} ventas · ${money(summary.top_seller.total)}` : '']);
      summarySheet.addRow(['Producto líder', summary.top_product?.product_name || 'Sin datos', summary.top_product ? `${summary.top_product.quantity} unidades · ${money(summary.top_product.total)}` : '']);
      styleTable(summarySheet, 6);
      summarySheet.getColumn(2).numFmt = '#,##0.00';

      const sellersSheet = workbook.addWorksheet('Ventas por vendedor');
      sellersSheet.addRow(['Vendedor', 'Perfil', 'Ventas', 'Mesas', 'Directas', 'Productos', 'Juego', 'Ticket promedio', 'Total']);
      sellers.forEach(item => sellersSheet.addRow([
        item.cashier_name,
        item.role_label || item.role,
        numberValue(item.sales_count),
        numberValue(item.table_sales),
        numberValue(item.pos_sales),
        numberValue(item.products_total),
        numberValue(item.game_total),
        numberValue(item.average_ticket),
        numberValue(item.total),
      ]));
      styleTable(sellersSheet);
      [6, 7, 8, 9].forEach(index => { sellersSheet.getColumn(index).numFmt = '"Bs. "#,##0.00'; });

      const dailySheet = workbook.addWorksheet('Ventas por día');
      dailySheet.addRow(['Fecha', 'Día', 'Ventas', 'Mesas', 'Productos', 'Ticket promedio', 'Total']);
      daily.forEach(item => dailySheet.addRow([
        item.day,
        WEEKDAY_LABELS[item.weekday] || '',
        numberValue(item.sales_count),
        numberValue(item.game_total),
        numberValue(item.products_total),
        numberValue(item.average_ticket),
        numberValue(item.total),
      ]));
      styleTable(dailySheet);
      [4, 5, 6, 7].forEach(index => { dailySheet.getColumn(index).numFmt = '"Bs. "#,##0.00'; });

      const salesSheet = workbook.addWorksheet('Detalle de ventas');
      salesSheet.addRow(['Fecha y hora', 'Venta', 'Vendedor', 'Origen', 'Mesa', 'Pago', 'Unidades', 'Productos', 'Juego', 'Total']);
      sales.forEach(item => salesSheet.addRow([
        formatDateTime(item.created_at),
        item.sale_number,
        item.cashier_name,
        SALE_TYPE_LABELS[item.sale_type] || item.sale_type,
        item.table_name || '—',
        PAYMENT_LABELS[item.payment_method] || item.payment_method,
        numberValue(item.product_units),
        numberValue(item.products_total),
        numberValue(item.game_total),
        numberValue(item.total),
      ]));
      styleTable(salesSheet);
      [8, 9, 10].forEach(index => { salesSheet.getColumn(index).numFmt = '"Bs. "#,##0.00'; });

      const productsSheet = workbook.addWorksheet('Productos');
      productsSheet.addRow(['Producto', 'Categoría', 'Unidades', 'Ventas con producto', 'Total']);
      products.forEach(item => productsSheet.addRow([item.product_name, item.category_name, numberValue(item.quantity), numberValue(item.transactions), numberValue(item.total)]));
      styleTable(productsSheet);
      productsSheet.getColumn(5).numFmt = '"Bs. "#,##0.00';

      const tablesSheet = workbook.addWorksheet('Mesas');
      tablesSheet.addRow(['Mesa', 'Tipo', 'Sesiones', 'Productos', 'Juego', 'Ticket promedio', 'Total']);
      tables.forEach(item => tablesSheet.addRow([
        item.table_name,
        TABLE_TYPE_LABELS[item.table_type] || item.table_type,
        numberValue(item.sessions),
        numberValue(item.products_total),
        numberValue(item.game_total),
        numberValue(item.average_ticket),
        numberValue(item.total),
      ]));
      styleTable(tablesSheet);
      [4, 5, 6, 7].forEach(index => { tablesSheet.getColumn(index).numFmt = '"Bs. "#,##0.00'; });

      const paymentsSheet = workbook.addWorksheet('Métodos de pago');
      paymentsSheet.addRow(['Método', 'Ventas', 'Participación', 'Total']);
      payments.forEach(item => paymentsSheet.addRow([
        PAYMENT_LABELS[item.payment_method] || item.payment_method,
        numberValue(item.sales_count),
        numberValue(item.percentage) / 100,
        numberValue(item.total),
      ]));
      styleTable(paymentsSheet);
      paymentsSheet.getColumn(3).numFmt = '0.0%';
      paymentsSheet.getColumn(4).numFmt = '"Bs. "#,##0.00';

      const auditSheet = workbook.addWorksheet('Auditoría');
      auditSheet.addRow(['Fecha y hora', 'Usuario', 'Acción', 'Entidad', 'ID']);
      audit.forEach(item => auditSheet.addRow([
        formatDateTime(item.created_at),
        item.user_name || 'Sistema',
        humanAction(item.action),
        item.entity_type || '',
        item.entity_id || '',
      ]));
      styleTable(auditSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `reporte-billar-${safeFilePart(rangeKey)}-${safeFilePart(from)}-a-${safeFilePart(to)}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el archivo Excel.');
    } finally {
      setExporting('');
    }
  }

  async function exportPdf() {
    if (!data || exporting) return;
    setExporting('pdf');
    setError('');

    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text('BILLAR CENTRAL', 14, 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(95);
      doc.text(`${RANGE_LABELS[rangeKey] || RANGE_LABELS.custom} · ${formatDateTime(fromAt)} — ${formatDateTime(toAt)}`, 14, 24);
      doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, pageWidth - 14, 24, { align: 'right' });

      autoTable(doc, {
        startY: 31,
        head: [['Resumen', 'Valor', 'Detalle']],
        body: [
          ['Facturación', money(summary.total), `${summary.sales_count} ventas`],
          ['Ticket promedio', money(summary.average_ticket), 'Promedio por venta'],
          ['Mesas / juego', money(summary.game_total), `${summary.table_sales} ventas con mesa`],
          ['Productos', money(summary.products_total), `${summary.pos_sales} ventas directas`],
          ['Mejor vendedor', summary.top_seller?.cashier_name || 'Sin datos', summary.top_seller ? `${summary.top_seller.sales_count} ventas · ${money(summary.top_seller.total)}` : ''],
        ],
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.3 },
        headStyles: { fillColor: [23, 48, 32], textColor: 255 },
      });

      function appendTable(title, head, body, options = {}) {
        let startY = (doc.lastAutoTable?.finalY || 30) + 8;
        if (startY > 260) {
          doc.addPage();
          startY = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.text(title, 14, startY);
        autoTable(doc, {
          startY: startY + 4,
          head: [head],
          body,
          theme: options.theme || 'striped',
          styles: { fontSize: options.fontSize || 7.7, cellPadding: 1.8, overflow: 'linebreak' },
          headStyles: { fillColor: [31, 37, 32], textColor: 255 },
          ...options,
        });
      }

      appendTable('Ventas por vendedor', ['Vendedor', 'Perfil', 'Ventas', 'Mesas', 'Directas', 'Total'], sellers.map(item => [
        item.cashier_name,
        item.role_label || item.role,
        String(item.sales_count),
        String(item.table_sales),
        String(item.pos_sales),
        money(item.total),
      ]));

      appendTable('Ventas por día', ['Fecha', 'Día', 'Ventas', 'Mesas', 'Productos', 'Total'], daily.map(item => [
        formatDay(item.day),
        WEEKDAY_LABELS[item.weekday] || '',
        String(item.sales_count),
        money(item.game_total),
        money(item.products_total),
        money(item.total),
      ]));

      appendTable('Detalle de ventas', ['Fecha', 'Venta', 'Vendedor', 'Origen', 'Pago', 'Total'], sales.map(item => [
        formatDateTime(item.created_at),
        item.sale_number,
        item.cashier_name,
        item.table_name || SALE_TYPE_LABELS[item.sale_type] || item.sale_type,
        PAYMENT_LABELS[item.payment_method] || item.payment_method,
        money(item.total),
      ]), { fontSize: 7.1 });

      appendTable('Productos más vendidos', ['Producto', 'Categoría', 'Unidades', 'Ventas', 'Total'], products.map(item => [
        item.product_name,
        item.category_name,
        String(item.quantity),
        String(item.transactions),
        money(item.total),
      ]));

      appendTable('Rendimiento por mesa', ['Mesa', 'Tipo', 'Sesiones', 'Juego', 'Promedio', 'Total'], tables.map(item => [
        item.table_name,
        TABLE_TYPE_LABELS[item.table_type] || item.table_type,
        String(item.sessions),
        money(item.game_total),
        money(item.average_ticket),
        money(item.total),
      ]));

      appendTable('Métodos de pago', ['Método', 'Ventas', 'Participación', 'Total'], payments.map(item => [
        PAYMENT_LABELS[item.payment_method] || item.payment_method,
        String(item.sales_count),
        `${numberValue(item.percentage).toFixed(1)}%`,
        money(item.total),
      ]));

      appendTable('Auditoría', ['Fecha', 'Usuario', 'Acción', 'Entidad'], audit.map(item => [
        formatDateTime(item.created_at),
        item.user_name || 'Sistema',
        humanAction(item.action),
        `${item.entity_type || ''}${item.entity_id ? ` #${item.entity_id}` : ''}`,
      ]), { fontSize: 6.8 });

      addPageNumbers(doc);
      doc.save(`reporte-billar-${safeFilePart(rangeKey)}-${safeFilePart(from)}-a-${safeFilePart(to)}.pdf`);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el PDF.');
    } finally {
      setExporting('');
    }
  }

  function addPageNumbers(pdf) {
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(125);
      pdf.text(`Billar Control · Página ${page} de ${pages}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 7, { align: 'center' });
    }
  }

  return (
    <div className="page-stack report-page">
      <section className="panel report-filter-panel">
        <div className="report-filter-copy">
          <span className="eyebrow">ANÁLISIS DE VENTAS</span>
          <h2>Reportes detallados</h2>
          <p>Consulta rendimiento por vendedor, día, mesa, producto y método de pago sin perder detalle.</p>
          <span className="report-period-label">{RANGE_LABELS[rangeKey]} · {rangeDisplay}</span>
        </div>

        <div className="report-range-presets" aria-label="Períodos rápidos">
          {['24h', '7d', '30d', '90d', '1y'].map(key => (
            <button
              key={key}
              type="button"
              className={`report-range-button ${rangeKey === key ? 'active' : ''}`}
              onClick={() => applyPreset(key)}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
          <button type="button" className={`report-range-button ${rangeKey === 'custom' ? 'active' : ''}`} onClick={() => setRangeKey('custom')}>
            Personalizado
          </button>
        </div>

        <div className={`report-custom-range ${rangeKey === 'custom' ? 'is-visible' : ''}`}>
          <label>
            Desde
            <input className="input report-date-input" type="date" value={from} max={to} onChange={event => setFrom(event.target.value)} />
          </label>
          <span className="report-date-separator">a</span>
          <label>
            Hasta
            <input className="input report-date-input" type="date" value={to} min={from} onChange={event => setTo(event.target.value)} />
          </label>
          <button className="secondary-button" onClick={applyCustomRange}>Aplicar</button>
        </div>

        <div className="report-export-actions">
          <button className="secondary-button export-button" disabled={!canExport || Boolean(exporting)} onClick={exportExcel}>
            {exporting === 'excel' ? 'Generando Excel…' : 'Exportar Excel'}
          </button>
          <button className="primary-button export-button" disabled={!canExport || Boolean(exporting)} onClick={exportPdf}>
            {exporting === 'pdf' ? 'Generando PDF…' : 'Exportar PDF'}
          </button>
        </div>
      </section>

      {error && <div className="inline-alert danger">{error}</div>}
      {loading && <div className="skeleton-block report-loading" />}

      {!loading && data && (
        <>
          <section className="stats-grid report-stats detailed">
            <article className="stat-card primary">
              <span>Facturación</span>
              <strong>{money(summary.total)}</strong>
              <small>{summary.sales_count} ventas en el período</small>
            </article>
            <article className="stat-card">
              <span>Total de ventas</span>
              <strong>{summary.sales_count}</strong>
              <small>{summary.table_sales} con mesa · {summary.pos_sales} directas</small>
            </article>
            <article className="stat-card">
              <span>Ticket promedio</span>
              <strong>{money(summary.average_ticket)}</strong>
              <small>promedio por operación</small>
            </article>
            <article className="stat-card">
              <span>Ingreso por juego</span>
              <strong>{money(summary.game_total)}</strong>
              <small>billiar, cacho y póker</small>
            </article>
            <article className="stat-card">
              <span>Productos vendidos</span>
              <strong>{money(summary.products_total)}</strong>
              <small>{summary.top_product ? `${summary.top_product.product_name}: ${summary.top_product.quantity} u.` : 'sin ventas de productos'}</small>
            </article>
            <article className="stat-card report-stat-text">
              <span>Mejor vendedor</span>
              <strong>{summary.top_seller?.cashier_name || 'Sin datos'}</strong>
              <small>{summary.top_seller ? `${summary.top_seller.sales_count} ventas · ${money(summary.top_seller.total)}` : 'sin ventas en el período'}</small>
            </article>
          </section>

          <div className="report-insight-grid">
            <section className="panel report-insight-card">
              <span className="eyebrow">RENDIMIENTO</span>
              <h3>Lo más relevante del período</h3>
              <div className="report-insight-list">
                <div><span>Día con mayor facturación</span><strong>{summary.best_day ? `${formatDay(summary.best_day.day)} · ${money(summary.best_day.total)}` : 'Sin datos'}</strong></div>
                <div><span>Producto líder</span><strong>{summary.top_product ? `${summary.top_product.product_name} · ${summary.top_product.quantity} u.` : 'Sin datos'}</strong></div>
                <div><span>Método de pago principal</span><strong>{summary.top_payment ? `${PAYMENT_LABELS[summary.top_payment.payment_method] || summary.top_payment.payment_method} · ${numberValue(summary.top_payment.percentage).toFixed(1)}%` : 'Sin datos'}</strong></div>
              </div>
            </section>

            <section className="panel report-insight-card">
              <span className="eyebrow">COBROS</span>
              <h3>Métodos de pago</h3>
              <div className="report-payment-list">
                {payments.map(item => (
                  <div key={item.payment_method}>
                    <div><span>{PAYMENT_LABELS[item.payment_method] || item.payment_method}</span><strong>{money(item.total)}</strong></div>
                    <div className="report-payment-track"><span style={{ width: `${Math.min(100, numberValue(item.percentage))}%` }} /></div>
                    <small>{item.sales_count} ventas · {numberValue(item.percentage).toFixed(1)}%</small>
                  </div>
                ))}
                {!payments.length && <div className="empty-line">Sin pagos en este período.</div>}
              </div>
            </section>
          </div>

          <ReportTable
            eyebrow="VENDEDORES"
            title="Ventas por vendedor"
            description="Compara cantidad de ventas, ventas de mesa, ventas directas, ticket promedio e ingresos generados."
            rows={sellers}
            searchFields={['cashier_name', 'role_label']}
            searchPlaceholder="Buscar vendedor…"
            filters={[{ key: 'role', label: 'Tipo de usuario', options: sellerRoleOptions }]}
            columns={[
              { key: 'cashier_name', label: 'Vendedor', render: row => <strong>{row.cashier_name}</strong> },
              { key: 'sales_count', label: 'Ventas' },
              { key: 'table_sales', label: 'Mesas' },
              { key: 'pos_sales', label: 'Directas' },
              { key: 'products_total', label: 'Productos', render: row => money(row.products_total) },
              { key: 'game_total', label: 'Juego', render: row => money(row.game_total) },
              { key: 'average_ticket', label: 'Ticket prom.', render: row => money(row.average_ticket) },
              { key: 'total', label: 'Total', render: row => <strong>{money(row.total)}</strong> },
            ]}
          />

          <ReportTable
            eyebrow="TENDENCIA"
            title="Ventas por día"
            description="Resumen diario del período seleccionado, incluyendo composición entre juego y productos."
            rows={daily}
            searchFields={['day', row => WEEKDAY_LABELS[row.weekday]]}
            searchPlaceholder="Buscar fecha o día…"
            filters={[{ key: 'weekday', label: 'Día', options: weekdayOptions }]}
            columns={[
              { key: 'day', label: 'Fecha', render: row => <><strong>{formatDay(row.day)}</strong><small>{WEEKDAY_LABELS[row.weekday]}</small></> },
              { key: 'sales_count', label: 'Ventas' },
              { key: 'game_total', label: 'Mesas', render: row => money(row.game_total) },
              { key: 'products_total', label: 'Productos', render: row => money(row.products_total) },
              { key: 'average_ticket', label: 'Ticket prom.', render: row => money(row.average_ticket) },
              { key: 'total', label: 'Total', render: row => <strong>{money(row.total)}</strong> },
            ]}
          />

          <ReportTable
            eyebrow="TRANSACCIONES"
            title="Detalle de ventas"
            description="Cada operación realizada, con vendedor, origen, método de pago y composición del total."
            rows={sales}
            searchFields={['sale_number', 'cashier_name', 'table_name', 'payment_method', 'sale_type']}
            searchPlaceholder="Buscar venta, vendedor o mesa…"
            filters={[
              { key: 'cashier_id', label: 'Vendedor', options: sellerOptions },
              { key: 'payment_method', label: 'Pago', options: paymentOptions },
              { key: 'sale_type', label: 'Origen', options: saleTypeOptions },
            ]}
            columns={[
              { key: 'created_at', label: 'Fecha / hora', render: row => formatDateTime(row.created_at) },
              { key: 'sale_number', label: 'Venta', render: row => <strong>{row.sale_number}</strong> },
              { key: 'cashier_name', label: 'Vendedor' },
              { key: 'origin', label: 'Origen', render: row => row.table_name || SALE_TYPE_LABELS[row.sale_type] || row.sale_type },
              { key: 'payment_method', label: 'Pago', render: row => PAYMENT_LABELS[row.payment_method] || row.payment_method },
              { key: 'product_units', label: 'Unidades' },
              { key: 'products_total', label: 'Productos', render: row => money(row.products_total) },
              { key: 'game_total', label: 'Juego', render: row => money(row.game_total) },
              { key: 'total', label: 'Total', render: row => <strong>{money(row.total)}</strong> },
            ]}
          />

          <div className="report-table-grid">
            <ReportTable
              eyebrow="PRODUCTOS"
              title="Productos más vendidos"
              description="Unidades y facturación por producto."
              rows={products}
              searchFields={['product_name', 'category_name']}
              searchPlaceholder="Buscar producto…"
              filters={[{ key: 'category_id', label: 'Categoría', options: productCategoryOptions }]}
              initialPageSize={5}
              columns={[
                { key: 'product_name', label: 'Producto', render: row => <><strong>{row.product_name}</strong><small>{row.category_name}</small></> },
                { key: 'quantity', label: 'Unidades' },
                { key: 'transactions', label: 'Ventas' },
                { key: 'total', label: 'Total', render: row => <strong>{money(row.total)}</strong> },
              ]}
            />

            <ReportTable
              eyebrow="MESAS"
              title="Rendimiento por mesa"
              description="Qué mesas generan más sesiones e ingresos."
              rows={tables}
              searchFields={['table_name', row => TABLE_TYPE_LABELS[row.table_type]]}
              searchPlaceholder="Buscar mesa…"
              filters={[{ key: 'table_type', label: 'Tipo', options: tableTypeOptions }]}
              initialPageSize={5}
              columns={[
                { key: 'table_name', label: 'Mesa', render: row => <><strong>{row.table_name}</strong><small>{TABLE_TYPE_LABELS[row.table_type] || row.table_type}</small></> },
                { key: 'sessions', label: 'Sesiones' },
                { key: 'game_total', label: 'Juego', render: row => money(row.game_total) },
                { key: 'average_ticket', label: 'Prom.', render: row => money(row.average_ticket) },
                { key: 'total', label: 'Total', render: row => <strong>{money(row.total)}</strong> },
              ]}
            />
          </div>

          <div className="report-audit-link-note">La auditoría completa ahora se encuentra en la sección <strong>Auditoría</strong> del menú de administración. Las exportaciones de reportes continúan incluyendo la hoja de auditoría.</div>
        </>
      )}
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
