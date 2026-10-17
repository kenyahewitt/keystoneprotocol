// Keystone Paper Trade engine — PAPER ONLY. No wallets, keys, or real transactions.
(function (root) {
  var FEE = 0.0005, MAX_LEV = 100, START = 10000, MMR = 0.005; // maintenance margin 0.5%
  function fresh() { return { balance: START, positions: [], history: [], nextId: 1 }; }
  function liqPrice(side, entry, lev) {
    var m = 1 / lev - MMR; if (m < 0) m = 0;
    return side === 'long' ? entry * (1 - m) : entry * (1 + m);
  }
  function upnl(p, mark) { var d = (mark - p.entry) / p.entry; return (p.side === 'long' ? d : -d) * p.size; }
  function open(s, coin, side, margin, lev, price) {
    margin = +margin; lev = Math.round(+lev);
    if (!(price > 0)) throw new Error('No live price');
    if (side !== 'long' && side !== 'short') throw new Error('Bad side');
    if (!(lev >= 1 && lev <= MAX_LEV)) throw new Error('Leverage must be 1x–100x');
    if (!(margin > 0)) throw new Error('Margin must be > 0');
    var size = margin * lev, fee = size * FEE;
    if (margin + fee > s.balance + 1e-9) throw new Error('Insufficient paper balance');
    s.balance -= margin + fee;
    var p = { id: s.nextId++, coin: coin, side: side, margin: margin, lev: lev, size: size, entry: price,
      liq: liqPrice(side, price, lev), openFee: fee, openedAt: Date.now() };
    s.positions.push(p); return p;
  }
  function close(s, id, price, reason) {
    var i = s.positions.findIndex(function (p) { return p.id === id; }); if (i < 0) return null;
    var p = s.positions[i], pnl, fee = 0;
    if (reason === 'liquidated') { pnl = -p.margin; }
    else { pnl = upnl(p, price); fee = p.size * FEE; }
    var ret = Math.max(0, p.margin + pnl - fee);
    s.balance += ret; s.positions.splice(i, 1);
    var net = ret - p.margin - p.openFee;
    var h = { id: p.id, coin: p.coin, side: p.side, lev: p.lev, size: p.size, entry: p.entry,
      exit: reason === 'liquidated' ? p.liq : price, pnl: net, fees: p.openFee + fee,
      reason: reason || 'closed', closedAt: Date.now() };
    s.history.unshift(h); return h;
  }
  function checkLiqs(s, mids) {
    var out = [];
    s.positions.slice().forEach(function (p) {
      var m = mids[p.coin]; if (!(m > 0)) return;
      if ((p.side === 'long' && m <= p.liq) || (p.side === 'short' && m >= p.liq)) out.push(close(s, p.id, m, 'liquidated'));
    });
    return out;
  }
  function stats(s) {
    var n = s.history.length, w = s.history.filter(function (h) { return h.pnl > 0; }).length;
    var tot = s.history.reduce(function (a, h) { return a + h.pnl; }, 0);
    return { trades: n, wins: w, winRate: n ? w / n : 0, totalPnl: tot };
  }
  root.PaperEngine = { FEE: FEE, MAX_LEV: MAX_LEV, START: START, MMR: MMR, fresh: fresh, liqPrice: liqPrice,
    upnl: upnl, open: open, close: close, checkLiqs: checkLiqs, stats: stats };
  if (typeof module !== 'undefined') module.exports = root.PaperEngine;
})(typeof window !== 'undefined' ? window : globalThis);
