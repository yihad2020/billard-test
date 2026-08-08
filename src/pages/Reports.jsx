import { useEffect, useMemo, useState } from 'react';
import { get } from '../api';

const money = value => `Bs. ${Number(value || 0).toFixed(2)}`;
const numberValue = value => Number(value || 0);

function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function today() {
  return localDateISO();
}

function safeFilePart(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function formatAuditDate(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Reports() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  async function load() {
    setError('');
    try {
      const [report, auditResponse] = await Promise.all([
        get(`/reports/daily?from=${from}&to=${to}`),
        get('/reports/audit'),
      ]);
      setData(report);
      setAudit(auditResponse.logs || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // The initial report should use the default date range only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return (data?.daily || []).reduce(
      (acc, day) => ({
        total: acc.total + numberValue(day.total),
        products: acc.products + numberValue(day.products_total),
        games: acc.games + numberValue(day.game_total),
        count: acc.count + numberValue(day.sales_count),
      }),
      { total: 0, products: 0, games: 0, count: 0 },
    );
  }, [data]);

  const average = totals.count ? totals.total / totals.count : 0;
  const canExport = Boolean(data);

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

      const titleStyle = {
        font: { bold: true, size: 16, color: { argb: 'FF173020' } },
      };

      function styleTable(sheet, headerRow = 1) {
        const row = sheet.getRow(headerRow);
        row.eachCell(cell => {
          cell.style = headerStyle;
        });
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

      const summary = workbook.addWorksheet('Resumen');
      summary.mergeCells('A1:C1');
      summary.getCell('A1').value = 'BILLAR CENTRAL - Reporte';
      summary.getCell('A1').style = titleStyle;
      summary.getCell('A2').value = 'Desde';
      summary.getCell('B2').value = from;
      summary.getCell('A3').value = 'Hasta';
      summary.getCell('B3').value = to;
      summary.addRow([]);
      summary.addRow(['Métrica', 'Valor', 'Detalle']);
      summary.addRow(['Facturación', totals.total, `${totals.count} ventas`]);
      summary.addRow(['Mesas', totals.games, 'Ingreso por juego']);
      summary.addRow(['Productos', totals.products, 'Consumos vendidos']);
      summary.addRow(['Promedio por venta', average, 'Promedio del período']);
      styleTable(summary, 5);
      summary.getColumn(2).numFmt = '"Bs. "#,##0.00';

      const cashiers = workbook.addWorksheet('Por cajero');
      cashiers.addRow(['Cajero', 'Ventas', 'Total']);
      (data.cashiers || []).forEach(item => {
        cashiers.addRow([item.cashier_name, numberValue(item.sales_count), numberValue(item.total)]);
      });
      styleTable(cashiers);
      cashiers.getColumn(3).numFmt = '"Bs. "#,##0.00';

      const products = workbook.addWorksheet('Productos');
      products.addRow(['Producto', 'Unidades', 'Total']);
      (data.products || []).forEach(item => {
        products.addRow([item.product_name, numberValue(item.quantity), numberValue(item.total)]);
      });
      styleTable(products);
      products.getColumn(3).numFmt = '"Bs. "#,##0.00';

      const daily = workbook.addWorksheet('Ventas por día');
      daily.addRow(['Fecha', 'Ventas', 'Mesas', 'Productos', 'Total']);
      (data.daily || []).forEach(item => {
        daily.addRow([
          item.day,
          numberValue(item.sales_count),
          numberValue(item.game_total),
          numberValue(item.products_total),
          numberValue(item.total),
        ]);
      });
      styleTable(daily);
      [3, 4, 5].forEach(index => {
        daily.getColumn(index).numFmt = '"Bs. "#,##0.00';
      });

      const auditSheet = workbook.addWorksheet('Auditoría');
      auditSheet.addRow(['Fecha y hora', 'Usuario', 'Acción', 'Entidad', 'ID']);
      audit.forEach(item => {
        auditSheet.addRow([
          formatAuditDate(item.created_at),
          item.user_name || 'Sistema',
          humanAction(item.action),
          item.entity_type || '',
          item.entity_id || '',
        ]);
      });
      styleTable(auditSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `reporte-billar-${safeFilePart(from)}-a-${safeFilePart(to)}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el archivo Excel. Revisa que las dependencias estén instaladas.');
    } finally {
      setExporting('');
    }
  }

  async function exportPdf() {
    if (!data || exporting) return;
    setExporting('pdf');
    setError('');

    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 17;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text('BILLAR CENTRAL', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Reporte del ${from} al ${to}`, 14, y);
      doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, pageWidth - 14, y, { align: 'right' });
      y += 10;

      const summaryRows = [
        ['Facturación', money(totals.total), `${totals.count} ventas`],
        ['Mesas', money(totals.games), 'Ingreso por juego'],
        ['Productos', money(totals.products), 'Consumos vendidos'],
        ['Promedio', money(average), 'Por venta'],
      ];

      autoTable(doc, {
        startY: y,
        head: [['Resumen', 'Monto', 'Detalle']],
        body: summaryRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [23, 48, 32], textColor: 255 },
      });

      y = doc.lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: y,
        head: [['Cajero', 'Ventas', 'Total']],
        body: (data.cashiers || []).map(item => [
          item.cashier_name,
          String(numberValue(item.sales_count)),
          money(item.total),
        ]),
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 2.3 },
        headStyles: { fillColor: [31, 37, 32], textColor: 255 },
      });

      y = doc.lastAutoTable.finalY + 8;
      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Unidades', 'Total']],
        body: (data.products || []).map(item => [
          item.product_name,
          String(numberValue(item.quantity)),
          money(item.total),
        ]),
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 2.3 },
        headStyles: { fillColor: [31, 37, 32], textColor: 255 },
      });

      y = doc.lastAutoTable.finalY + 8;
      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Ventas', 'Mesas', 'Productos', 'Total']],
        body: (data.daily || []).map(item => [
          item.day,
          String(numberValue(item.sales_count)),
          money(item.game_total),
          money(item.products_total),
          money(item.total),
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.1 },
        headStyles: { fillColor: [23, 48, 32], textColor: 255 },
      });

      if (audit.length) {
        y = doc.lastAutoTable.finalY + 8;
        autoTable(doc, {
          startY: y,
          head: [['Fecha', 'Usuario', 'Acción', 'Entidad']],
          body: audit.map(item => [
            formatAuditDate(item.created_at),
            item.user_name || 'Sistema',
            humanAction(item.action),
            `${item.entity_type || ''}${item.entity_id ? ` #${item.entity_id}` : ''}`,
          ]),
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [31, 37, 32], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 33 },
            1: { cellWidth: 38 },
            2: { cellWidth: 58 },
          },
          });
      }

      // Footer on the first page too, even when a table does not trigger the callback there.
      addPageNumbers(doc);
      doc.save(`reporte-billar-${safeFilePart(from)}-a-${safeFilePart(to)}.pdf`);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el PDF. Revisa que las dependencias estén instaladas.');
    } finally {
      setExporting('');
    }


    function addPageNumbers(pdf) {
      const pages = pdf.getNumberOfPages();
      for (let page = 1; page <= pages; page += 1) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(125);
        pdf.text(
          `Billar Control · Página ${page} de ${pages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 8,
          { align: 'center' },
        );
      }
    }
  }

  return (
    <div className="page-stack report-page">
      <section className="page-intro report-intro">
        <div className="report-copy">
          <p>Resultados por rango de fechas, cajeros, productos y actividad administrativa.</p>
        </div>

        <div className="report-controls">
          <div className="date-filter" aria-label="Rango de fechas">
            <input
              className="input"
              type="date"
              value={from}
              max={to}
              onChange={event => setFrom(event.target.value)}
            />
            <span>a</span>
            <input
              className="input"
              type="date"
              value={to}
              min={from}
              onChange={event => setTo(event.target.value)}
            />
            <button className="secondary-button" onClick={load}>Aplicar</button>
          </div>

          <div className="report-export-actions">
            <button
              className="secondary-button export-button"
              disabled={!canExport || Boolean(exporting)}
              onClick={exportExcel}
            >
              {exporting === 'excel' ? 'Generando Excel…' : 'Exportar Excel'}
            </button>
            <button
              className="primary-button export-button"
              disabled={!canExport || Boolean(exporting)}
              onClick={exportPdf}
            >
              {exporting === 'pdf' ? 'Generando PDF…' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </section>

      {error && <div className="inline-alert danger">{error}</div>}

      {data && (
        <>
          <section className="stats-grid four report-stats">
            <article className="stat-card primary">
              <span>Facturación</span>
              <strong>{money(totals.total)}</strong>
              <small>{totals.count} ventas</small>
            </article>
            <article className="stat-card">
              <span>Mesas</span>
              <strong>{money(totals.games)}</strong>
              <small>ingreso por juego</small>
            </article>
            <article className="stat-card">
              <span>Productos</span>
              <strong>{money(totals.products)}</strong>
              <small>consumos vendidos</small>
            </article>
            <article className="stat-card">
              <span>Promedio</span>
              <strong>{money(average)}</strong>
              <small>por venta</small>
            </article>
          </section>

          <div className="two-panels report-panels">
            <section className="panel">
              <div className="panel-head"><h3>Por cajero</h3></div>
              <div className="data-list compact-list">
                {(data.cashiers || []).length ? data.cashiers.map(cashier => (
                  <div className="data-row" key={cashier.cashier_name}>
                    <div>
                      <strong>{cashier.cashier_name}</strong>
                      <span>{cashier.sales_count} ventas</span>
                    </div>
                    <strong>{money(cashier.total)}</strong>
                  </div>
                )) : <div className="empty-line">Sin ventas de cajeros en este período.</div>}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h3>Productos más vendidos</h3></div>
              <div className="data-list compact-list">
                {(data.products || []).slice(0, 8).length ? data.products.slice(0, 8).map(product => (
                  <div className="data-row" key={product.product_name}>
                    <div>
                      <strong>{product.product_name}</strong>
                      <span>{numberValue(product.quantity)} unidades</span>
                    </div>
                    <strong>{money(product.total)}</strong>
                  </div>
                )) : <div className="empty-line">Sin productos vendidos en este período.</div>}
              </div>
            </section>
          </div>

          <section className="panel flat report-table-panel">
            <div className="panel-head"><h3>Ventas por día</h3></div>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ventas</th>
                    <th>Mesas</th>
                    <th>Productos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.daily || []).map(day => (
                    <tr key={day.day}>
                      <td>{day.day}</td>
                      <td>{day.sales_count}</td>
                      <td>{money(day.game_total)}</td>
                      <td>{money(day.products_total)}</td>
                      <td><strong>{money(day.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="panel flat report-audit-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AUDITORÍA</span>
            <h3>Actividad reciente</h3>
          </div>
        </div>
        <div className="audit-list">
          {audit.slice(0, 40).map(item => (
            <div className="audit-row" key={item.id}>
              <span className="audit-time">{formatAuditDate(item.created_at)}</span>
              <div className="audit-copy">
                <strong>{item.user_name || 'Sistema'}</strong>
                <span>{humanAction(item.action)}{item.entity_type ? ` · ${item.entity_type}` : ''}{item.entity_id ? ` ${item.entity_id}` : ''}</span>
              </div>
            </div>
          ))}
          {!audit.length && <div className="empty-line report-empty">Sin actividad reciente.</div>}
        </div>
      </section>
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

function humanAction(action) {
  return ({
    login: 'inició sesión',
    logout: 'cerró sesión',
    open_table: 'abrió una mesa',
    close_table: 'cerró y cobró una mesa',
    add_table_item: 'agregó un consumo',
    remove_table_item: 'quitó un consumo',
    adjust_stock: 'ajustó inventario',
    pos_sale: 'registró una venta',
    cash_movement: 'registró movimiento de caja',
    open_cash: 'abrió caja',
    close_cash: 'cerró caja',
    create_product: 'creó un producto',
    update_product: 'actualizó un producto',
    move_table: 'movió una mesa',
    create_user: 'creó un usuario',
    update_user: 'actualizó un usuario',
  })[action] || action;
}
