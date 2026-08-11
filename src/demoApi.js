const STATE_KEY = 'billar_control_vercel_demo_v6';
const TOKEN_PREFIX = 'billar-demo-user-';
const DEMO_DELAY = 90;

class DemoApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'DemoApiError';
    this.status = status;
  }
}

const n = value => Number(value || 0);
const money = value => Math.round((n(value) + Number.EPSILON) * 100) / 100;

function pad(value) {
  return String(value).padStart(2, '0');
}

function sqlDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function dateOnly(value = new Date()) {
  const d = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ago({ days = 0, hours = 0, minutes = 0 } = {}) {
  return new Date(Date.now() - days * 86400000 - hours * 3600000 - minutes * 60000);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialState() {
  const users = [
    {
      id: 1,
      name: 'Administrador',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      role_label: 'Administrador',
      active: 1,
      last_login_at: sqlDate(ago({ minutes: 18 })),
      created_at: sqlDate(ago({ days: 120 })),
    },
    {
      id: 2,
      name: 'Caja Principal',
      username: 'caja',
      password: 'caja123',
      role: 'cashier',
      role_label: 'Cajero',
      active: 1,
      last_login_at: sqlDate(ago({ hours: 1, minutes: 12 })),
      created_at: sqlDate(ago({ days: 95 })),
    },
    {
      id: 3,
      name: 'María Rojas',
      username: 'maria',
      password: 'demo123',
      role: 'cashier',
      role_label: 'Cajero',
      active: 1,
      last_login_at: sqlDate(ago({ days: 1, hours: 4 })),
      created_at: sqlDate(ago({ days: 62 })),
    },
  ];

  const categories = [
    { id: 1, name: 'Cervezas', active: 1, sort_order: 1 },
    { id: 2, name: 'Gaseosas', active: 1, sort_order: 2 },
    { id: 3, name: 'Agua', active: 1, sort_order: 3 },
    { id: 4, name: 'Snacks', active: 1, sort_order: 4 },
    { id: 5, name: 'Otros', active: 1, sort_order: 5 },
  ];

  const products = [
    { id: 1, category_id: 1, sku: 'CER-001', name: 'Cerveza Paceña', sale_price: 18, cost_price: 11, stock: 46, minimum_stock: 12, unit: 'botella', active: 1 },
    { id: 2, category_id: 1, sku: 'CER-002', name: 'Cerveza Huari', sale_price: 20, cost_price: 13, stock: 31, minimum_stock: 10, unit: 'botella', active: 1 },
    { id: 3, category_id: 2, sku: 'GAS-001', name: 'Coca-Cola', sale_price: 10, cost_price: 6, stock: 27, minimum_stock: 8, unit: 'botella', active: 1 },
    { id: 4, category_id: 2, sku: 'GAS-002', name: 'Sprite', sale_price: 10, cost_price: 6, stock: 19, minimum_stock: 8, unit: 'botella', active: 1 },
    { id: 5, category_id: 3, sku: 'AGU-001', name: 'Agua', sale_price: 8, cost_price: 4, stock: 22, minimum_stock: 6, unit: 'botella', active: 1 },
    { id: 6, category_id: 4, sku: 'SNK-001', name: 'Papas fritas', sale_price: 12, cost_price: 7, stock: 14, minimum_stock: 5, unit: 'unidad', active: 1 },
    { id: 7, category_id: 4, sku: 'SNK-002', name: 'Maní salado', sale_price: 10, cost_price: 5, stock: 8, minimum_stock: 8, unit: 'unidad', active: 1 },
    { id: 8, category_id: 5, sku: 'OTR-001', name: 'Energizante', sale_price: 16, cost_price: 9, stock: 6, minimum_stock: 6, unit: 'lata', active: 1 },
  ];

  const tables = [
    { id: 1, name: 'Mesa 1', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 22, layout_y: 38, layout_w: 18, layout_h: 11, rotation: 90, sort_order: 1, active: 1 },
    { id: 2, name: 'Mesa 2', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 27, layout_y: 10, layout_w: 18, layout_h: 11, rotation: 90, sort_order: 2, active: 1 },
    { id: 3, name: 'Mesa 3', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 50, layout_y: 11, layout_w: 13, layout_h: 9, rotation: 90, sort_order: 3, active: 1 },
    { id: 4, name: 'Mesa 4', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 45, layout_y: 40, layout_w: 14, layout_h: 9, rotation: 90, sort_order: 4, active: 1 },
    { id: 5, name: 'Mesa 5', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 66, layout_y: 11, layout_w: 13, layout_h: 9, rotation: 90, sort_order: 5, active: 1 },
    { id: 6, name: 'Mesa 6', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 69, layout_y: 61, layout_w: 13, layout_h: 9, rotation: 90, sort_order: 6, active: 1 },
    { id: 7, name: 'Mesa 7', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 84, layout_y: 58, layout_w: 14, layout_h: 10, rotation: 90, sort_order: 7, active: 1 },
    { id: 8, name: 'Mesa 8', table_type: 'billiard', billing_mode: 'hourly', hourly_rate: 30, layout_x: 84, layout_y: 12, layout_w: 13, layout_h: 9, rotation: 90, sort_order: 8, active: 1 },
    { id: 12, name: 'Isla 1', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 1, layout_x: 15, layout_y: 30, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 12, active: 1 },
    { id: 13, name: 'Isla 2', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 2, layout_x: 18, layout_y: 14, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 13, active: 1 },
    { id: 14, name: 'Isla 3', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 3, layout_x: 43, layout_y: 27, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 14, active: 1 },
    { id: 15, name: 'Isla 4', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 4, layout_x: 36, layout_y: 52, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 15, active: 1 },
    { id: 16, name: 'Isla 5', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 5, layout_x: 62, layout_y: 28, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 16, active: 1 },
    { id: 17, name: 'Isla 6', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 6, layout_x: 61, layout_y: 70, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 17, active: 1 },
    { id: 18, name: 'Isla 7', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 7, layout_x: 85, layout_y: 73, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 18, active: 1 },
    { id: 19, name: 'Isla 8', table_type: 'island', billing_mode: 'manual', hourly_rate: 0, associated_table_id: 8, layout_x: 84, layout_y: 31, layout_w: 6, layout_h: 7, rotation: 0, sort_order: 19, active: 1 },
    { id: 9, name: 'Cacho 1', table_type: 'cacho', billing_mode: 'hourly', hourly_rate: 10, layout_x: 5, layout_y: 7, layout_w: 9, layout_h: 9, rotation: 0, sort_order: 20, active: 1 },
    { id: 10, name: 'Cacho 2', table_type: 'cacho', billing_mode: 'hourly', hourly_rate: 10, layout_x: 13, layout_y: 7, layout_w: 9, layout_h: 9, rotation: 0, sort_order: 21, active: 1 },
    { id: 11, name: 'Poker', table_type: 'poker', billing_mode: 'hourly', hourly_rate: 20, layout_x: 6, layout_y: 68, layout_w: 18, layout_h: 12, rotation: 0, sort_order: 22, active: 1 },
  ];

  const tableSessions = [
    {
      id: 1,
      game_table_id: 2,
      opened_by: 2,
      opened_at: sqlDate(ago({ hours: 1, minutes: 24 })),
      hourly_rate_snapshot: 30,
      manual_game_charge: 0,
      status: 'open',
      items: [
        { id: 1, product_id: 1, added_by: 2, quantity: 2, unit_price: 18, line_total: 36 },
        { id: 2, product_id: 3, added_by: 2, quantity: 1, unit_price: 10, line_total: 10 },
      ],
    },
    {
      id: 2,
      game_table_id: 6,
      opened_by: 1,
      opened_at: sqlDate(ago({ minutes: 47 })),
      hourly_rate_snapshot: 30,
      manual_game_charge: 0,
      status: 'open',
      items: [
        { id: 3, product_id: 2, added_by: 1, quantity: 1, unit_price: 20, line_total: 20 },
        { id: 4, product_id: 6, added_by: 1, quantity: 1, unit_price: 12, line_total: 12 },
      ],
    },
    {
      id: 3,
      game_table_id: 9,
      opened_by: 1,
      opened_at: sqlDate(ago({ minutes: 32 })),
      hourly_rate_snapshot: 10,
      manual_game_charge: 0,
      status: 'open',
      items: [{ id: 5, product_id: 5, added_by: 1, quantity: 2, unit_price: 8, line_total: 16 }],
    },
  ];

  const cashSessions = [
    { id: 1, user_id: 1, opened_at: sqlDate(ago({ hours: 5 })), opening_amount: 500, closed_at: null, declared_amount: null, expected_amount: null, difference_amount: null, status: 'open' },
    { id: 2, user_id: 2, opened_at: sqlDate(ago({ hours: 4, minutes: 30 })), opening_amount: 350, closed_at: null, declared_amount: null, expected_amount: null, difference_amount: null, status: 'open' },
    { id: 3, user_id: 3, opened_at: sqlDate(ago({ days: 1, hours: 8 })), opening_amount: 300, closed_at: sqlDate(ago({ days: 1, hours: 1 })), declared_amount: 1475, expected_amount: 1468, difference_amount: 7, status: 'closed' },
    { id: 4, user_id: 1, opened_at: sqlDate(ago({ days: 2, hours: 9 })), opening_amount: 500, closed_at: sqlDate(ago({ days: 2, hours: 2 })), declared_amount: 2380, expected_amount: 2380, difference_amount: 0, status: 'closed' },
    { id: 5, user_id: 2, opened_at: sqlDate(ago({ days: 3, hours: 9 })), opening_amount: 350, closed_at: sqlDate(ago({ days: 3, hours: 1 })), declared_amount: 1710, expected_amount: 1705, difference_amount: 5, status: 'closed' },
    { id: 6, user_id: 1, opened_at: sqlDate(ago({ days: 4, hours: 9 })), opening_amount: 500, closed_at: sqlDate(ago({ days: 4, hours: 1 })), declared_amount: 1925, expected_amount: 1925, difference_amount: 0, status: 'closed' },
    { id: 7, user_id: 3, opened_at: sqlDate(ago({ days: 5, hours: 9 })), opening_amount: 300, closed_at: sqlDate(ago({ days: 5, hours: 1 })), declared_amount: 1510, expected_amount: 1508, difference_amount: 2, status: 'closed' },
    { id: 8, user_id: 2, opened_at: sqlDate(ago({ days: 6, hours: 9 })), opening_amount: 350, closed_at: sqlDate(ago({ days: 6, hours: 1 })), declared_amount: 1370, expected_amount: 1370, difference_amount: 0, status: 'closed' },
  ];

  const saleSeed = [
    { days: 0, hours: 1, cashier_id: 1, cash_session_id: 1, sale_type: 'pos', products_total: 74, game_total: 0, payment_method: 'qr', items: [[1,2],[3,2],[6,1]] },
    { days: 0, hours: 2, cashier_id: 2, cash_session_id: 2, sale_type: 'table', products_total: 56, game_total: 42, payment_method: 'cash', table_name: 'Mesa 4', items: [[1,2],[3,2]] },
    { days: 0, hours: 3, cashier_id: 1, cash_session_id: 1, sale_type: 'table', products_total: 40, game_total: 35, payment_method: 'cash', table_name: 'Mesa 1', items: [[2,2]] },
    { days: 0, hours: 4, cashier_id: 2, cash_session_id: 2, sale_type: 'pos', products_total: 46, game_total: 0, payment_method: 'cash', items: [[1,1],[3,1],[5,1],[6,1]] },
    { days: 1, hours: 3, cashier_id: 3, cash_session_id: 3, sale_type: 'table', products_total: 92, game_total: 61, payment_method: 'cash', table_name: 'Mesa 7', items: [[1,3],[2,1],[5,1],[6,1]] },
    { days: 1, hours: 5, cashier_id: 3, cash_session_id: 3, sale_type: 'pos', products_total: 58, game_total: 0, payment_method: 'qr', items: [[2,1],[3,1],[5,2],[6,1]] },
    { days: 1, hours: 7, cashier_id: 3, cash_session_id: 3, sale_type: 'table', products_total: 74, game_total: 48, payment_method: 'cash', table_name: 'Mesa 3', items: [[1,2],[4,1],[5,2],[6,1]] },
    { days: 2, hours: 4, cashier_id: 1, cash_session_id: 4, sale_type: 'table', products_total: 112, game_total: 72, payment_method: 'cash', table_name: 'Mesa 2', items: [[1,3],[2,2],[3,1],[5,1]] },
    { days: 2, hours: 6, cashier_id: 1, cash_session_id: 4, sale_type: 'pos', products_total: 70, game_total: 0, payment_method: 'card', items: [[2,2],[3,1],[4,1],[6,1]] },
    { days: 2, hours: 7, cashier_id: 1, cash_session_id: 4, sale_type: 'table', products_total: 68, game_total: 55, payment_method: 'qr', table_name: 'Mesa 8', items: [[1,2],[3,2],[6,1]] },
    { days: 3, hours: 4, cashier_id: 2, cash_session_id: 5, sale_type: 'table', products_total: 84, game_total: 50, payment_method: 'cash', table_name: 'Mesa 5', items: [[1,3],[3,1],[2,1]] },
    { days: 3, hours: 6, cashier_id: 2, cash_session_id: 5, sale_type: 'pos', products_total: 54, game_total: 0, payment_method: 'qr', items: [[1,2],[5,1],[6,1]] },
    { days: 4, hours: 3, cashier_id: 1, cash_session_id: 6, sale_type: 'table', products_total: 90, game_total: 67, payment_method: 'cash', table_name: 'Mesa 6', items: [[2,3],[3,1],[4,2]] },
    { days: 5, hours: 5, cashier_id: 3, cash_session_id: 7, sale_type: 'table', products_total: 76, game_total: 44, payment_method: 'cash', table_name: 'Mesa 1', items: [[1,2],[2,1],[3,2]] },
    { days: 6, hours: 4, cashier_id: 2, cash_session_id: 8, sale_type: 'pos', products_total: 62, game_total: 0, payment_method: 'qr', items: [[1,1],[2,1],[6,2]] },
  ];

  const sales = saleSeed.map((seed, index) => {
    const id = index + 1;
    const items = seed.items.map(([productId, quantity], itemIndex) => {
      const product = products.find(p => p.id === productId);
      return {
        id: id * 10 + itemIndex,
        product_id: productId,
        quantity,
        unit_price: product.sale_price,
        line_total: money(product.sale_price * quantity),
      };
    });
    return {
      id,
      sale_number: `V-${String(280 + id).padStart(6, '0')}`,
      cashier_id: seed.cashier_id,
      cash_session_id: seed.cash_session_id,
      table_session_id: null,
      sale_type: seed.sale_type,
      products_total: seed.products_total,
      game_total: seed.game_total,
      total: money(seed.products_total + seed.game_total),
      status: 'completed',
      created_at: sqlDate(ago({ days: seed.days, hours: seed.hours })),
      payment_method: seed.payment_method,
      table_name: seed.table_name || null,
      items,
    };
  });

  const cashMovements = [
    { id: 1, cash_session_id: 1, user_id: 1, movement_type: 'expense', amount: 80, concept: 'Compra de hielo', note: '', created_at: sqlDate(ago({ hours: 2, minutes: 20 })) },
    { id: 2, cash_session_id: 2, user_id: 2, movement_type: 'expense', amount: 45, concept: 'Cambio para caja', note: '', created_at: sqlDate(ago({ hours: 2 })) },
    { id: 3, cash_session_id: 1, user_id: 1, movement_type: 'income', amount: 100, concept: 'Reposición fondo', note: '', created_at: sqlDate(ago({ hours: 3 })) },
  ];

  const auditLogs = [
    ['login', 1, 'user', 1, ago({ minutes: 18 })],
    ['open_table', 1, 'table_session', 3, ago({ minutes: 32 })],
    ['add_table_item', 1, 'table_session', 3, ago({ minutes: 29 })],
    ['open_table', 1, 'table_session', 2, ago({ minutes: 47 })],
    ['add_table_item', 1, 'table_session', 2, ago({ minutes: 43 })],
    ['open_table', 2, 'table_session', 1, ago({ hours: 1, minutes: 24 })],
    ['pos_sale', 1, 'sale', 1, ago({ hours: 1 })],
    ['cash_movement', 1, 'cash_session', 1, ago({ hours: 2, minutes: 20 })],
    ['login', 2, 'user', 2, ago({ hours: 1, minutes: 12 })],
    ['update_product', 1, 'product', 1, ago({ days: 1, hours: 2 })],
    ['adjust_stock', 1, 'product', 2, ago({ days: 1, hours: 4 })],
  ].map((row, index) => ({
    id: index + 1,
    action: row[0],
    user_id: row[1],
    entity_type: row[2],
    entity_id: row[3],
    details_json: null,
    created_at: sqlDate(row[4]),
  }));

  return {
    version: 6,
    users,
    categories,
    products,
    tables,
    tableSessions,
    cashSessions,
    cashMovements,
    sales,
    inventoryMovements: [],
    auditLogs,
    counters: {
      user: 4,
      product: 9,
      tableSession: 4,
      tableItem: 6,
      cashSession: 9,
      cashMovement: 4,
      sale: sales.length + 1,
      audit: auditLogs.length + 1,
      inventoryMovement: 1,
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 6) return parsed;
    }
  } catch {}
  const fresh = initialState();
  localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return clone(rest);
}

function currentUser(state) {
  const token = localStorage.getItem('billar_token') || '';
  if (!token.startsWith(TOKEN_PREFIX)) throw new DemoApiError('No autorizado.', 401);
  const id = Number(token.slice(TOKEN_PREFIX.length));
  const user = state.users.find(item => item.id === id && Number(item.active));
  if (!user) throw new DemoApiError('No autorizado.', 401);
  return user;
}

function requireAdmin(state) {
  const user = currentUser(state);
  if (user.role !== 'admin') throw new DemoApiError('No tienes permisos para esta operación.', 403);
  return user;
}

function openCashFor(state, userId) {
  return state.cashSessions.find(item => item.user_id === userId && item.status === 'open') || null;
}

function requireOpenCash(state, userId) {
  const cash = openCashFor(state, userId);
  if (!cash) throw new DemoApiError('Debes abrir tu caja antes de vender o abrir una mesa.', 409);
  return cash;
}

function categoryName(state, categoryId) {
  return state.categories.find(item => Number(item.id) === Number(categoryId))?.name || null;
}

function productView(state, product, user) {
  const row = {
    ...clone(product),
    category_name: categoryName(state, product.category_id),
    stock_status: n(product.stock) <= 0 ? 'out' : n(product.stock) <= n(product.minimum_stock) ? 'low' : 'ok',
  };
  if (user.role !== 'admin') delete row.cost_price;
  return row;
}

function liveGameCharge(session, table) {
  if (!session) return 0;
  if ((table?.billing_mode || session.billing_mode) === 'manual') return money(session.manual_game_charge || 0);
  const opened = new Date(String(session.opened_at).replace(' ', 'T')).getTime();
  const seconds = Math.max(0, (Date.now() - opened) / 1000);
  return money((n(session.hourly_rate_snapshot || table?.hourly_rate) / 3600) * seconds);
}

function sessionProductsTotal(session) {
  return money((session.items || []).reduce((sum, item) => sum + n(item.line_total), 0));
}

function sessionView(state, session) {
  const table = state.tables.find(item => item.id === session.game_table_id);
  const sourceTable = session.source_table_id ? state.tables.find(item => item.id === session.source_table_id) : null;
  const user = state.users.find(item => item.id === session.opened_by);
  const items = (session.items || []).map(item => {
    const product = state.products.find(p => p.id === item.product_id);
    return {
      ...clone(item),
      product_name: product?.name || 'Producto',
      current_stock: product?.stock ?? 0,
    };
  }).sort((a, b) => b.id - a.id);
  const productsTotal = sessionProductsTotal(session);
  const gameCharge = liveGameCharge(session, table);
  return {
    ...clone(session),
    table_name: table?.name,
    table_type: table?.table_type,
    billing_mode: table?.billing_mode,
    associated_table_id: table?.associated_table_id || null,
    source_table_id: session.source_table_id || null,
    source_table_name: sourceTable?.name || null,
    transferred_to_island_at: session.transferred_to_island_at || null,
    opened_by_name: user?.name,
    items,
    products_total: productsTotal,
    game_charge: gameCharge,
    total: money(productsTotal + gameCharge),
  };
}

function tableViews(state) {
  return state.tables
    .filter(table => Number(table.active))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map(table => {
      const session = state.tableSessions.find(item => item.game_table_id === table.id && item.status === 'open');
      const productsTotal = session ? sessionProductsTotal(session) : 0;
      const gameCharge = session ? liveGameCharge(session, table) : 0;
      const opener = session ? state.users.find(item => item.id === session.opened_by) : null;
      return {
        ...clone(table),
        session_id: session?.id || null,
        opened_at: session?.opened_at || null,
        hourly_rate_snapshot: session?.hourly_rate_snapshot ?? null,
        manual_game_charge: session?.manual_game_charge ?? null,
        opened_by: session?.opened_by ?? null,
        opened_by_name: opener?.name || null,
        products_total: productsTotal,
        status: session ? 'occupied' : 'free',
        game_charge: gameCharge,
        running_total: money(productsTotal + gameCharge),
      };
    });
}

function addAudit(state, userId, action, entityType, entityId, details = null) {
  state.auditLogs.push({
    id: state.counters.audit++,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId == null ? null : String(entityId),
    details_json: details,
    created_at: sqlDate(),
  });
}

function saleNumber(state) {
  return `V-${String(280 + state.counters.sale).padStart(6, '0')}`;
}

function cashSummary(state, cashId) {
  const cash = state.cashSessions.find(item => item.id === cashId);
  if (!cash) return null;
  const sales = state.sales.filter(item => item.cash_session_id === cashId && item.status === 'completed');
  const movements = state.cashMovements.filter(item => item.cash_session_id === cashId);
  const cashSales = sales.filter(item => item.payment_method === 'cash').reduce((sum, item) => sum + n(item.total), 0);
  const salesTotal = sales.reduce((sum, item) => sum + n(item.total), 0);
  const income = movements.filter(item => item.movement_type === 'income').reduce((sum, item) => sum + n(item.amount), 0);
  const expenses = movements.filter(item => item.movement_type === 'expense').reduce((sum, item) => sum + n(item.amount), 0);
  return {
    opening_amount: money(cash.opening_amount),
    sales_total: money(salesTotal),
    sales_count: sales.length,
    cash_sales: money(cashSales),
    other_income: money(income),
    expenses: money(expenses),
    expected_cash: money(n(cash.opening_amount) + cashSales + income - expenses),
  };
}

function cashSessionView(state, session) {
  const summary = cashSummary(state, session.id);
  const user = state.users.find(item => item.id === session.user_id);
  return {
    ...clone(session),
    user_name: user?.name || 'Usuario',
    sales_total: summary?.sales_total || 0,
    cash_sales: summary?.cash_sales || 0,
    other_income: summary?.other_income || 0,
    expenses: summary?.expenses || 0,
    live_expected_amount: summary?.expected_cash || 0,
  };
}

function saleItemsWithNames(state, sale) {
  return (sale.items || []).map(item => ({
    ...item,
    product_name: state.products.find(product => product.id === item.product_id)?.name || 'Producto',
  }));
}

function dashboard(state, user) {
  const today = dateOnly();
  const sales = state.sales.filter(item => item.status === 'completed' && dateOnly(item.created_at) === today && (user.role === 'admin' || item.cashier_id === user.id));
  const expenses = state.cashMovements
    .filter(item => dateOnly(item.created_at) === today && item.movement_type === 'expense' && (user.role === 'admin' || item.user_id === user.id))
    .reduce((sum, item) => sum + n(item.amount), 0);
  const recent = state.sales
    .filter(item => item.status === 'completed' && (user.role === 'admin' || item.cashier_id === user.id))
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 8)
    .map(sale => ({
      sale_number: sale.sale_number,
      total: sale.total,
      sale_type: sale.sale_type,
      created_at: sale.created_at,
      cashier_name: state.users.find(item => item.id === sale.cashier_id)?.name || 'Cajero',
      table_name: sale.table_name,
      payment_method: sale.payment_method,
    }));
  return {
    summary: {
      sales_total: money(sales.reduce((sum, item) => sum + n(item.total), 0)),
      products_total: money(sales.reduce((sum, item) => sum + n(item.products_total), 0)),
      game_total: money(sales.reduce((sum, item) => sum + n(item.game_total), 0)),
      sales_count: sales.length,
      occupied_tables: state.tableSessions.filter(item => {
        if (item.status !== 'open') return false;
        const table = state.tables.find(table => table.id === item.game_table_id);
        return table?.table_type !== 'island';
      }).length,
      active_tables: state.tables.filter(item => Number(item.active) && item.table_type !== 'island').length,
      low_stock: state.products.filter(item => Number(item.active) && n(item.stock) <= n(item.minimum_stock)).length,
      expenses: money(expenses),
    },
    recent_sales: recent,
  };
}


function ownerControl(state) {
  const liveTables = tableViews(state);
  const openSessions = state.tableSessions
    .filter(item => item.status === 'open')
    .map(session => {
      const view = sessionView(state, session);
      const table = state.tables.find(item => item.id === session.game_table_id);
      return {
        ...view,
        table_id: table?.id || null,
        table_name: table?.name || view.table_name,
        table_type: table?.table_type || view.table_type,
        opened_by_name: state.users.find(item => item.id === session.opened_by)?.name || 'Cajero',
        item_count: (session.items || []).reduce((sum, item) => sum + n(item.quantity), 0),
      };
    })
    .sort((a, b) => String(a.table_name || '').localeCompare(String(b.table_name || ''), 'es'));

  const openCash = state.cashSessions
    .filter(item => item.status === 'open')
    .map(item => {
      const summary = cashSummary(state, item.id) || {};
      return {
        id: item.id,
        user_id: item.user_id,
        user_name: state.users.find(user => user.id === item.user_id)?.name || 'Cajero',
        opened_at: item.opened_at,
        opening_amount: summary.opening_amount || item.opening_amount,
        sales_total: summary.sales_total || 0,
        sales_count: summary.sales_count || 0,
        cash_sales: summary.cash_sales || 0,
        other_income: summary.other_income || 0,
        expenses: summary.expenses || 0,
        live_expected_amount: summary.expected_cash || 0,
      };
    });

  const sensitiveActions = new Set([
    'add_table_item',
    'remove_table_item',
    'adjust_stock',
    'transfer_table_session',
    'move_table_to_island',
    'close_table',
    'pos_sale',
    'open_table',
    'cash_movement',
    'close_cash',
    'create_product',
    'update_product',
  ]);

  const recentActivity = state.auditLogs
    .filter(item => sensitiveActions.has(item.action))
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 18)
    .map(item => ({
      ...clone(item),
      user_name: state.users.find(user => user.id === item.user_id)?.name || 'Sistema',
    }));

  const lowStock = state.products
    .filter(item => Number(item.active) && n(item.stock) <= n(item.minimum_stock))
    .sort((a, b) => n(a.stock) - n(b.stock))
    .map(item => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      minimum_stock: item.minimum_stock,
      unit: item.unit,
    }));

  return {
    generated_at: sqlDate(),
    summary: {
      occupied_game_tables: liveTables.filter(item => item.table_type !== 'island' && item.status === 'occupied').length,
      active_game_tables: liveTables.filter(item => item.table_type !== 'island').length,
      open_islands: liveTables.filter(item => item.table_type === 'island' && item.status === 'occupied').length,
      active_accounts: openSessions.length,
      active_products_total: money(openSessions.reduce((sum, item) => sum + n(item.products_total), 0)),
      active_running_total: money(openSessions.reduce((sum, item) => sum + n(item.total), 0)),
      low_stock: lowStock.length,
      open_cash_registers: openCash.length,
    },
    sessions: openSessions,
    cash_sessions: openCash,
    low_stock: lowStock,
    recent_activity: recentActivity,
  };
}

function reports(state, from, to) {
  const filtered = state.sales.filter(sale => sale.status === 'completed' && dateOnly(sale.created_at) >= from && dateOnly(sale.created_at) <= to);
  const dayMap = new Map();
  filtered.forEach(sale => {
    const day = dateOnly(sale.created_at);
    const row = dayMap.get(day) || { day, sales_count: 0, total: 0, products_total: 0, game_total: 0 };
    row.sales_count += 1;
    row.total = money(row.total + n(sale.total));
    row.products_total = money(row.products_total + n(sale.products_total));
    row.game_total = money(row.game_total + n(sale.game_total));
    dayMap.set(day, row);
  });

  const cashierMap = new Map();
  filtered.forEach(sale => {
    const user = state.users.find(item => item.id === sale.cashier_id);
    const key = user?.name || 'Cajero';
    const row = cashierMap.get(key) || { cashier_name: key, sales_count: 0, total: 0 };
    row.sales_count += 1;
    row.total = money(row.total + n(sale.total));
    cashierMap.set(key, row);
  });

  const productMap = new Map();
  filtered.forEach(sale => {
    saleItemsWithNames(state, sale).forEach(item => {
      const key = item.product_name;
      const row = productMap.get(key) || { product_name: key, quantity: 0, total: 0 };
      row.quantity = money(row.quantity + n(item.quantity));
      row.total = money(row.total + n(item.line_total));
      productMap.set(key, row);
    });
  });

  return {
    from,
    to,
    daily: [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day)),
    cashiers: [...cashierMap.values()].sort((a, b) => b.total - a.total),
    products: [...productMap.values()].sort((a, b) => b.total - a.total).slice(0, 20),
  };
}

function parseBody(options) {
  if (!options?.body) return {};
  if (typeof options.body === 'string') {
    try { return JSON.parse(options.body); } catch { return {}; }
  }
  return options.body;
}

function match(pathname, pattern) {
  const names = [];
  const source = pattern.replace(/:[^/]+/g, part => {
    names.push(part.slice(1));
    return '([^/]+)';
  });
  const found = pathname.match(new RegExp(`^${source}$`));
  if (!found) return null;
  return names.reduce((params, name, index) => ({ ...params, [name]: decodeURIComponent(found[index + 1]) }), {});
}

function successfulMutation(state, payload) {
  saveState(state);
  return payload;
}

export function resetDemoData() {
  const fresh = initialState();
  saveState(fresh);
  localStorage.removeItem('billar_token');
  return fresh;
}

export async function demoApi(path, options = {}) {
  await new Promise(resolve => setTimeout(resolve, DEMO_DELAY));
  const state = loadState();
  const method = String(options.method || 'GET').toUpperCase();
  const body = parseBody(options);
  const url = new URL(path, 'https://demo.local');
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  if (method === 'POST' && pathname === '/login') {
    const user = state.users.find(item => item.username === String(body.username || '').trim());
    if (!user || !Number(user.active) || user.password !== body.password) {
      throw new DemoApiError('Usuario o contraseña incorrectos.', 401);
    }
    user.last_login_at = sqlDate();
    addAudit(state, user.id, 'login', 'user', user.id);
    saveState(state);
    return { token: `${TOKEN_PREFIX}${user.id}`, user: publicUser(user), demo: true };
  }

  const user = currentUser(state);

  if (method === 'GET' && pathname === '/me') return { user: publicUser(user), demo: true };
  if (method === 'POST' && pathname === '/logout') {
    addAudit(state, user.id, 'logout', 'user', user.id);
    return successfulMutation(state, { message: 'Sesión cerrada.' });
  }
  if (method === 'GET' && pathname === '/dashboard') return dashboard(state, user);
  if (method === 'GET' && pathname === '/control/live') {
    requireAdmin(state);
    return ownerControl(state);
  }

  if (method === 'GET' && pathname === '/tables') return { tables: tableViews(state) };

  let params = match(pathname, '/tables/:id/position');
  if (method === 'PUT' && params) {
    requireAdmin(state);
    const table = state.tables.find(item => item.id === Number(params.id));
    if (!table) throw new DemoApiError('Mesa no encontrada.', 404);
    ['layout_x', 'layout_y', 'layout_w', 'layout_h', 'rotation'].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(body, key)) table[key] = Number(body[key]);
    });
    addAudit(state, user.id, 'move_table', 'game_table', table.id, body);
    return successfulMutation(state, { message: 'Posición guardada.' });
  }

  params = match(pathname, '/tables/:id/open');
  if (method === 'POST' && params) {
    requireOpenCash(state, user.id);
    const table = state.tables.find(item => item.id === Number(params.id) && Number(item.active));
    if (!table) throw new DemoApiError('Mesa no encontrada.', 404);
    if (state.tableSessions.some(item => item.game_table_id === table.id && item.status === 'open')) {
      throw new DemoApiError('La mesa ya está ocupada.', 409);
    }
    const session = {
      id: state.counters.tableSession++,
      game_table_id: table.id,
      opened_by: user.id,
      opened_at: sqlDate(),
      hourly_rate_snapshot: n(table.hourly_rate),
      manual_game_charge: Math.max(0, n(body.manual_game_charge)),
      status: 'open',
      notes: body.notes || null,
      items: [],
    };
    state.tableSessions.push(session);
    addAudit(state, user.id, 'open_table', 'table_session', session.id, { table: table.name });
    return successfulMutation(state, { session: sessionView(state, session) });
  }

  params = match(pathname, '/table-sessions/:id');
  if (method === 'GET' && params) {
    const session = state.tableSessions.find(item => item.id === Number(params.id));
    if (!session) throw new DemoApiError('Sesión de mesa no encontrada.', 404);
    return { session: sessionView(state, session) };
  }

  params = match(pathname, '/table-sessions/:id/items');
  if (method === 'POST' && params) {
    requireOpenCash(state, user.id);
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La sesión de mesa ya no está abierta.', 409);
    const product = state.products.find(item => item.id === Number(body.product_id) && Number(item.active));
    const qty = n(body.quantity);
    if (!product) throw new DemoApiError('Producto no encontrado.', 404);
    if (qty <= 0) throw new DemoApiError('La cantidad debe ser mayor a cero.', 422);
    if (n(product.stock) < qty) throw new DemoApiError('No hay stock suficiente.', 409);
    const before = n(product.stock);
    product.stock = money(before - qty);
    const item = {
      id: state.counters.tableItem++,
      product_id: product.id,
      added_by: user.id,
      quantity: qty,
      unit_price: n(product.sale_price),
      line_total: money(n(product.sale_price) * qty),
      created_at: sqlDate(),
    };
    session.items.push(item);
    state.inventoryMovements.push({ id: state.counters.inventoryMovement++, product_id: product.id, user_id: user.id, movement_type: 'sale', quantity: -qty, stock_before: before, stock_after: product.stock, note: 'Consumo agregado a mesa', created_at: sqlDate() });
    addAudit(state, user.id, 'add_table_item', 'table_session', session.id, { product: product.name, quantity: qty });
    return successfulMutation(state, { session: sessionView(state, session) });
  }

  params = match(pathname, '/table-sessions/:id/items/:itemId');
  if (method === 'DELETE' && params) {
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La sesión de mesa ya no está abierta.', 409);
    const index = session.items.findIndex(item => item.id === Number(params.itemId));
    if (index < 0) throw new DemoApiError('El consumo no existe.', 404);
    const [item] = session.items.splice(index, 1);
    const product = state.products.find(p => p.id === item.product_id);
    if (product) product.stock = money(n(product.stock) + n(item.quantity));
    addAudit(state, user.id, 'remove_table_item', 'table_session', session.id, {
      product: product?.name || 'Producto',
      quantity: n(item.quantity),
      reason: String(body.reason || '').trim() || 'Sin motivo especificado',
    });
    return successfulMutation(state, { session: sessionView(state, session) });
  }

  params = match(pathname, '/table-sessions/:id/manual-charge');
  if (method === 'PUT' && params) {
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La sesión de mesa ya no está abierta.', 409);
    const table = state.tables.find(item => item.id === session.game_table_id);
    if (table?.billing_mode !== 'manual') throw new DemoApiError('Esta mesa no admite cobro manual.', 409);
    session.manual_game_charge = Math.max(0, n(body.amount));
    addAudit(state, user.id, 'update_manual_charge', 'table_session', session.id, { amount: session.manual_game_charge });
    return successfulMutation(state, { session: sessionView(state, session) });
  }

  params = match(pathname, '/table-sessions/:id/transfer');
  if (method === 'POST' && params) {
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La sesión de mesa ya no está abierta.', 409);

    const sourceTable = state.tables.find(item => item.id === session.game_table_id && Number(item.active));
    if (!sourceTable || sourceTable.table_type === 'island') {
      throw new DemoApiError('Solo se pueden traspasar sesiones de mesas de juego.', 409);
    }

    const targetTable = state.tables.find(item => item.id === Number(body.target_table_id) && Number(item.active));
    if (!targetTable || targetTable.table_type === 'island') {
      throw new DemoApiError('Selecciona una mesa de destino válida.', 404);
    }
    if (targetTable.id === sourceTable.id) {
      throw new DemoApiError('La mesa de destino debe ser diferente.', 409);
    }
    if (targetTable.table_type !== sourceTable.table_type) {
      throw new DemoApiError('El traspaso debe hacerse a una mesa del mismo tipo de juego.', 409);
    }
    if (targetTable.billing_mode !== sourceTable.billing_mode) {
      throw new DemoApiError('La mesa de destino debe usar el mismo modo de cobro.', 409);
    }
    if (state.tableSessions.some(item => item.game_table_id === targetTable.id && item.status === 'open')) {
      throw new DemoApiError(`${targetTable.name} está ocupada. Selecciona otra mesa disponible.`, 409);
    }

    const fromTableId = sourceTable.id;
    session.game_table_id = targetTable.id;
    session.transfer_history = Array.isArray(session.transfer_history) ? session.transfer_history : [];
    session.transfer_history.push({
      from_table_id: fromTableId,
      from_table_name: sourceTable.name,
      to_table_id: targetTable.id,
      to_table_name: targetTable.name,
      transferred_by: user.id,
      transferred_at: sqlDate(),
    });

    addAudit(state, user.id, 'transfer_table_session', 'table_session', session.id, {
      from: sourceTable.name,
      to: targetTable.name,
      opened_at: session.opened_at,
      hourly_rate_snapshot: session.hourly_rate_snapshot,
    });

    return successfulMutation(state, {
      message: `Sesión traspasada de ${sourceTable.name} a ${targetTable.name}. El tiempo y los consumos continúan sin reiniciarse.`,
      table: clone(targetTable),
      session: sessionView(state, session),
    });
  }

  params = match(pathname, '/table-sessions/:id/move-to-island');
  if (method === 'POST' && params) {
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La sesión de mesa ya no está abierta.', 409);
    const sourceTable = state.tables.find(item => item.id === session.game_table_id);
    if (!sourceTable || sourceTable.table_type !== 'billiard') throw new DemoApiError('Solo una mesa de billar puede pasar su cuenta a una isla.', 409);
    const island = state.tables.find(item => item.table_type === 'island' && Number(item.associated_table_id) === Number(sourceTable.id) && Number(item.active));
    if (!island) throw new DemoApiError('No hay una isla asociada a esta mesa.', 404);
    if (state.tableSessions.some(item => item.game_table_id === island.id && item.status === 'open')) {
      throw new DemoApiError(`${island.name} ya tiene una cuenta abierta.`, 409);
    }
    const frozenGameCharge = liveGameCharge(session, sourceTable);
    session.source_table_id = sourceTable.id;
    session.game_table_id = island.id;
    session.manual_game_charge = frozenGameCharge;
    session.transferred_to_island_at = sqlDate();
    addAudit(state, user.id, 'move_table_to_island', 'table_session', session.id, {
      from: sourceTable.name,
      to: island.name,
      game_charge: frozenGameCharge,
    });
    return successfulMutation(state, {
      message: `Tiempo de ${sourceTable.name} cerrado. La cuenta continúa en ${island.name}.`,
      island: clone(island),
      session: sessionView(state, session),
    });
  }

  params = match(pathname, '/table-sessions/:id/close');
  if (method === 'POST' && params) {
    const cash = requireOpenCash(state, user.id);
    const session = state.tableSessions.find(item => item.id === Number(params.id) && item.status === 'open');
    if (!session) throw new DemoApiError('La mesa ya fue cerrada o no existe.', 409);
    const table = state.tables.find(item => item.id === session.game_table_id);
    const productsTotal = sessionProductsTotal(session);
    const gameTotal = liveGameCharge(session, table);
    const total = money(productsTotal + gameTotal);
    const saleId = state.counters.sale++;
    const saleNo = saleNumber({ ...state, counters: { ...state.counters, sale: saleId } });
    const sale = {
      id: saleId,
      sale_number: saleNo,
      cashier_id: user.id,
      cash_session_id: cash.id,
      table_session_id: session.id,
      sale_type: 'table',
      products_total: productsTotal,
      game_total: gameTotal,
      total,
      status: 'completed',
      created_at: sqlDate(),
      payment_method: body.payment_method || 'cash',
      table_name: table?.name || null,
      source_table_name: session.source_table_id ? state.tables.find(item => item.id === session.source_table_id)?.name || null : null,
      items: clone(session.items),
    };
    state.sales.push(sale);
    session.status = 'closed';
    session.closed_at = sqlDate();
    session.closed_by = user.id;
    addAudit(state, user.id, 'close_table', 'table_session', session.id, { sale_number: saleNo, total, method: sale.payment_method });
    return successfulMutation(state, { message: 'Mesa cobrada y liberada.', sale_number: saleNo, total });
  }

  if (method === 'GET' && pathname === '/products') {
    const query = String(url.searchParams.get('q') || '').toLowerCase().trim();
    const products = state.products
      .filter(item => Number(item.active) && (!query || item.name.toLowerCase().includes(query) || String(item.sku || '').toLowerCase().includes(query)))
      .sort((a, b) => (categoryName(state, a.category_id) || '').localeCompare(categoryName(state, b.category_id) || '') || a.name.localeCompare(b.name))
      .map(item => productView(state, item, user));
    return { products };
  }

  if (method === 'GET' && pathname === '/categories') {
    return { categories: clone(state.categories.filter(item => Number(item.active)).sort((a, b) => a.sort_order - b.sort_order)) };
  }

  if (method === 'POST' && pathname === '/products') {
    requireAdmin(state);
    if (!String(body.name || '').trim() || n(body.sale_price) < 0) throw new DemoApiError('Completa los datos del producto.', 422);
    const product = {
      id: state.counters.product++,
      category_id: body.category_id ? Number(body.category_id) : null,
      sku: String(body.sku || '').trim() || null,
      name: String(body.name).trim(),
      sale_price: n(body.sale_price),
      cost_price: n(body.cost_price),
      stock: n(body.stock),
      minimum_stock: n(body.minimum_stock),
      unit: String(body.unit || 'unidad').trim() || 'unidad',
      active: 1,
    };
    state.products.push(product);
    addAudit(state, user.id, 'create_product', 'product', product.id, body);
    return successfulMutation(state, { message: 'Producto creado.', id: product.id });
  }

  params = match(pathname, '/products/:id/stock');
  if (method === 'POST' && params) {
    requireAdmin(state);
    const product = state.products.find(item => item.id === Number(params.id));
    if (!product) throw new DemoApiError('Producto no encontrado.', 404);
    const qty = n(body.quantity);
    const after = money(n(product.stock) + qty);
    if (!qty) throw new DemoApiError('El ajuste no puede ser cero.', 422);
    if (after < 0) throw new DemoApiError('El ajuste dejaría el stock en negativo.', 422);
    const before = n(product.stock);
    product.stock = after;
    state.inventoryMovements.push({ id: state.counters.inventoryMovement++, product_id: product.id, user_id: user.id, movement_type: qty > 0 ? 'restock' : 'adjustment', quantity: qty, stock_before: before, stock_after: after, note: body.note || 'Ajuste manual', created_at: sqlDate() });
    addAudit(state, user.id, 'adjust_stock', 'product', product.id, { quantity: qty, before, after, note: body.note });
    return successfulMutation(state, { message: 'Inventario actualizado.', stock: after });
  }

  params = match(pathname, '/products/:id');
  if (method === 'PUT' && params) {
    requireAdmin(state);
    const product = state.products.find(item => item.id === Number(params.id));
    if (!product) throw new DemoApiError('Producto no encontrado.', 404);
    ['name', 'sku', 'unit'].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(body, key)) product[key] = body[key];
    });
    ['category_id', 'sale_price', 'cost_price', 'minimum_stock'].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(body, key)) product[key] = body[key] === '' ? null : Number(body[key]);
    });
    if (Object.prototype.hasOwnProperty.call(body, 'active')) product.active = body.active ? 1 : 0;
    addAudit(state, user.id, 'update_product', 'product', product.id, body);
    return successfulMutation(state, { message: 'Producto actualizado.' });
  }

  if (method === 'GET' && pathname === '/inventory/movements') {
    requireAdmin(state);
    const movements = state.inventoryMovements.slice().reverse().map(item => ({
      ...clone(item),
      product_name: state.products.find(p => p.id === item.product_id)?.name || 'Producto',
      user_name: state.users.find(u => u.id === item.user_id)?.name || 'Usuario',
    }));
    return { movements };
  }

  if (method === 'GET' && pathname === '/cash/current') {
    const session = openCashFor(state, user.id);
    if (!session) return { session: null };
    return { session: { ...cashSessionView(state, session), summary: cashSummary(state, session.id) } };
  }

  if (method === 'POST' && pathname === '/cash/open') {
    if (openCashFor(state, user.id)) throw new DemoApiError('Ya tienes una caja abierta.', 409);
    const session = {
      id: state.counters.cashSession++,
      user_id: user.id,
      opened_at: sqlDate(),
      opening_amount: Math.max(0, n(body.opening_amount)),
      closed_at: null,
      declared_amount: null,
      expected_amount: null,
      difference_amount: null,
      status: 'open',
    };
    state.cashSessions.push(session);
    addAudit(state, user.id, 'open_cash', 'cash_session', session.id, { opening_amount: session.opening_amount });
    return successfulMutation(state, { session: { ...cashSessionView(state, session), summary: cashSummary(state, session.id) } });
  }

  if (method === 'POST' && pathname === '/cash/movement') {
    const cash = requireOpenCash(state, user.id);
    if (!['income', 'expense'].includes(body.movement_type)) throw new DemoApiError('Tipo de movimiento inválido.', 422);
    if (n(body.amount) <= 0) throw new DemoApiError('El monto debe ser mayor a cero.', 422);
    const movement = {
      id: state.counters.cashMovement++,
      cash_session_id: cash.id,
      user_id: user.id,
      movement_type: body.movement_type,
      amount: n(body.amount),
      concept: String(body.concept || '').trim(),
      note: String(body.note || '').trim(),
      created_at: sqlDate(),
    };
    if (!movement.concept) throw new DemoApiError('Indica el concepto del movimiento.', 422);
    state.cashMovements.push(movement);
    addAudit(state, user.id, 'cash_movement', 'cash_session', cash.id, body);
    return successfulMutation(state, { session: { ...cashSessionView(state, cash), summary: cashSummary(state, cash.id) } });
  }

  if (method === 'POST' && pathname === '/cash/close') {
    const cash = requireOpenCash(state, user.id);
    const summary = cashSummary(state, cash.id);
    const declared = n(body.declared_amount);
    cash.status = 'closed';
    cash.closed_at = sqlDate();
    cash.declared_amount = declared;
    cash.expected_amount = summary.expected_cash;
    cash.difference_amount = money(declared - summary.expected_cash);
    addAudit(state, user.id, 'close_cash', 'cash_session', cash.id, { declared, expected: cash.expected_amount, difference: cash.difference_amount });
    return successfulMutation(state, { message: 'Caja cerrada.', expected_amount: cash.expected_amount, declared_amount: declared, difference_amount: cash.difference_amount });
  }

  if (method === 'GET' && pathname === '/cash/sessions') {
    const sessions = state.cashSessions
      .filter(item => user.role === 'admin' || item.user_id === user.id)
      .slice()
      .sort((a, b) => b.id - a.id)
      .map(item => cashSessionView(state, item));
    return { sessions };
  }

  if (method === 'POST' && pathname === '/sales/pos') {
    const cash = requireOpenCash(state, user.id);
    const rows = Array.isArray(body.items) ? body.items : [];
    if (!rows.length) throw new DemoApiError('Agrega al menos un producto.', 422);
    const prepared = rows.map(row => {
      const product = state.products.find(item => item.id === Number(row.product_id) && Number(item.active));
      const qty = n(row.quantity);
      if (!product || qty <= 0) throw new DemoApiError('Hay un producto inválido en la venta.', 422);
      if (n(product.stock) < qty) throw new DemoApiError(`Stock insuficiente para ${product.name}.`, 409);
      return { product, qty };
    });
    const saleId = state.counters.sale++;
    const items = prepared.map((row, index) => {
      const before = n(row.product.stock);
      row.product.stock = money(before - row.qty);
      state.inventoryMovements.push({ id: state.counters.inventoryMovement++, product_id: row.product.id, user_id: user.id, movement_type: 'sale', quantity: -row.qty, stock_before: before, stock_after: row.product.stock, note: 'Venta POS', created_at: sqlDate() });
      return {
        id: saleId * 100 + index,
        product_id: row.product.id,
        quantity: row.qty,
        unit_price: n(row.product.sale_price),
        line_total: money(n(row.product.sale_price) * row.qty),
      };
    });
    const total = money(items.reduce((sum, item) => sum + n(item.line_total), 0));
    const saleNo = `V-${String(280 + saleId).padStart(6, '0')}`;
    state.sales.push({
      id: saleId,
      sale_number: saleNo,
      cashier_id: user.id,
      cash_session_id: cash.id,
      table_session_id: null,
      sale_type: 'pos',
      products_total: total,
      game_total: 0,
      total,
      status: 'completed',
      created_at: sqlDate(),
      payment_method: body.payment_method || 'cash',
      table_name: null,
      items,
    });
    addAudit(state, user.id, 'pos_sale', 'sale', saleId, { sale_number: saleNo, total, method: body.payment_method });
    return successfulMutation(state, { message: 'Venta registrada.', sale_number: saleNo, total });
  }

  if (method === 'GET' && pathname === '/sales') {
    const targetDate = url.searchParams.get('date') || dateOnly();
    const sales = state.sales.filter(item => dateOnly(item.created_at) === targetDate && (user.role === 'admin' || item.cashier_id === user.id));
    return { sales: clone(sales) };
  }

  if (method === 'GET' && pathname === '/reports/daily') {
    requireAdmin(state);
    const from = url.searchParams.get('from') || `${dateOnly().slice(0, 8)}01`;
    const to = url.searchParams.get('to') || dateOnly();
    return reports(state, from, to);
  }

  if (method === 'GET' && pathname === '/reports/audit') {
    requireAdmin(state);
    const logs = state.auditLogs
      .slice()
      .sort((a, b) => b.id - a.id)
      .slice(0, 150)
      .map(item => ({ ...clone(item), user_name: state.users.find(userRow => userRow.id === item.user_id)?.name || null }));
    return { logs };
  }

  if (method === 'GET' && pathname === '/users') {
    requireAdmin(state);
    return { users: state.users.slice().sort((a, b) => a.name.localeCompare(b.name)).map(publicUser) };
  }

  if (method === 'POST' && pathname === '/users') {
    requireAdmin(state);
    if (!String(body.name || '').trim() || !String(body.username || '').trim() || String(body.password || '').length < 6) {
      throw new DemoApiError('Completa los datos. La contraseña debe tener al menos 6 caracteres.', 422);
    }
    if (state.users.some(item => item.username === String(body.username).trim())) throw new DemoApiError('Ese nombre de usuario ya existe.', 409);
    const role = body.role === 'admin' ? 'admin' : 'cashier';
    const newUser = {
      id: state.counters.user++,
      name: String(body.name).trim(),
      username: String(body.username).trim(),
      password: String(body.password),
      role,
      role_label: role === 'admin' ? 'Administrador' : 'Cajero',
      active: 1,
      last_login_at: null,
      created_at: sqlDate(),
    };
    state.users.push(newUser);
    addAudit(state, user.id, 'create_user', 'user', newUser.id, { name: newUser.name, role });
    return successfulMutation(state, { message: 'Usuario creado.', id: newUser.id });
  }

  params = match(pathname, '/users/:id');
  if (method === 'PUT' && params) {
    requireAdmin(state);
    const target = state.users.find(item => item.id === Number(params.id));
    if (!target) throw new DemoApiError('Usuario no encontrado.', 404);
    if (Object.prototype.hasOwnProperty.call(body, 'name')) target.name = String(body.name || '').trim();
    if (Object.prototype.hasOwnProperty.call(body, 'active')) target.active = body.active ? 1 : 0;
    if (body.password) target.password = String(body.password);
    if (body.role) {
      target.role = body.role === 'admin' ? 'admin' : 'cashier';
      target.role_label = target.role === 'admin' ? 'Administrador' : 'Cajero';
    }
    addAudit(state, user.id, 'update_user', 'user', target.id, body);
    return successfulMutation(state, { message: 'Usuario actualizado.' });
  }

  if (method === 'GET' && pathname === '/settings') {
    return { settings: { business_name: 'Billar Central', currency: 'Bs.', timezone: 'America/La_Paz' } };
  }

  if (method === 'GET' && pathname === '/settings/tables') {
    requireAdmin(state);
    return { tables: clone(state.tables.slice().sort((a, b) => a.sort_order - b.sort_order)) };
  }

  params = match(pathname, '/settings/tables/:id');
  if (method === 'PUT' && params) {
    requireAdmin(state);
    const table = state.tables.find(item => item.id === Number(params.id));
    if (!table) throw new DemoApiError('Mesa no encontrada.', 404);
    if (Object.prototype.hasOwnProperty.call(body, 'name')) table.name = String(body.name || '').trim();
    if (Object.prototype.hasOwnProperty.call(body, 'table_type')) table.table_type = body.table_type;
    if (Object.prototype.hasOwnProperty.call(body, 'billing_mode')) table.billing_mode = body.billing_mode;
    if (Object.prototype.hasOwnProperty.call(body, 'hourly_rate')) table.hourly_rate = n(body.hourly_rate);
    if (Object.prototype.hasOwnProperty.call(body, 'active')) table.active = body.active ? 1 : 0;
    addAudit(state, user.id, 'update_table', 'game_table', table.id, body);
    return successfulMutation(state, { message: 'Mesa actualizada.' });
  }

  throw new DemoApiError(`Ruta demo no implementada: ${method} ${pathname}`, 404);
}

export { DemoApiError };
