// Keystone Agent Desk — PAPER ONLY. Reads public agents.json; signal trades are paper positions in localStorage.
(function(){
var $=function(i){return document.getElementById(i)},AKEY='keystone.agentdesk.v1',MARGIN=50,LEV=5;
var A;try{A=JSON.parse(localStorage.getItem(AKEY))||{}}catch(e){A={}}A.last=A.last||{};
function saveA(){localStorage.setItem(AKEY,JSON.stringify(A))}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';'})}
function t(x){if(!x)return'';var d=new Date(typeof x==='number'?x*1000:x);return isNaN(d)?esc(x):d.toLocaleString()}
function c(n){return n>0?'pos':n<0?'neg':''}
function stat(l,v,k){return '<div class="stat" style="flex:1">'+esc(l)+'<b class="'+(k||'')+'">'+esc(v)+'</b></div>'}
function log(m){$('ad-log').textContent=new Date().toLocaleTimeString()+' — '+m}
async function loadAgents(){try{var r=await fetch('agents.json?ts='+Date.now());var d=await r.json();
 $('ad-gen').textContent='Agent telemetry updated '+t(d.generated)+' · '+(d.note||'');
 var s=d.sol_sniper||{};
 $('ad-sn-stats').innerHTML=s.error?'<span class="muted">'+esc(s.error)+'</span>':stat('Closed trades',s.closed_trades)+stat('Win rate',((s.win_rate||0)*100).toFixed(1)+'%')+stat('Net SOL (all)',(s.net_sol||0).toFixed(4),c(s.net_sol))+stat('Net SOL 24h',(s.net_sol_24h||0).toFixed(4),c(s.net_sol_24h))+stat('Open positions',(s.open_positions||[]).length?(s.open_positions||[]).map(function(p){return p.symbol}).join(', '):'0');
 $('ad-sn').innerHTML=(s.recent||[]).map(function(x){return '<tr><td>'+t(x.time)+'</td><td>'+esc(x.symbol)+'</td><td class="'+(x.side==='buy'?'pos':'neg')+'">'+esc((x.side||'').toUpperCase())+'</td><td>'+esc(x.reason)+(x.source?' ['+esc(x.source)+']':'')+'</td><td class="'+c(x.pnl_pct)+'">'+(x.pnl_pct==null?'':x.pnl_pct.toFixed(2)+'%')+'</td><td class="'+c(x.net_sol)+'">'+(x.net_sol==null?'':x.net_sol.toFixed(4))+'</td><td class="mono"><a href="https://solscan.io/token/'+esc(x.mint)+'" target="_blank" rel="noopener">'+esc((x.mint||'').slice(0,6))+'…</a></td></tr>'}).join('')||'<tr><td colspan="7" class="muted">No trades.</td></tr>';
 var p=d.polly||{},pd=p.paper_desk||{};
 $('ad-po-stats').innerHTML=stat('Paper equity',pd.equity!=null?'$'+(+pd.equity).toFixed(2):'—')+stat('Realized PnL',pd.realizedPnl!=null?'$'+(+pd.realizedPnl).toFixed(2):'—',c(pd.realizedPnl))+stat('W / L',(pd.wins||0)+' / '+(pd.losses||0))+stat('Mode',pd.mode||'—')+stat('Position',pd.position&&pd.position.symbol||'none');
 $('ad-po').innerHTML=(p.signals||[]).map(function(x){return '<tr><td>'+t(x.time)+'</td><td>'+esc(x.symbol)+'</td><td>'+esc((x.side||'').toUpperCase())+'</td><td>'+esc(x.confidence)+'</td><td>'+esc(x.reason)+'</td></tr>'}).join('')||'<tr><td colspan="5" class="muted">No signals.</td></tr>';
 var pc=d.polycopy||{},ps=pc.summary||{};
 $('ad-pc-stats').innerHTML=pc.error?'<span class="muted">'+esc(pc.error)+'</span>':stat('Paper trades',ps.trades)+stat('Open',ps.open)+stat('W / L',(ps.wins||0)+' / '+(ps.losses||0))+stat('Realized PnL','$'+(+ps.realized_pnl||0).toFixed(2),c(ps.realized_pnl))+stat('Open cost','$'+(+ps.open_cost||0).toFixed(2))+stat('Updated',ps.updated||'—');
 $('ad-pc').innerHTML=(pc.events||[]).map(function(x){return '<tr><td>'+esc(x.ts)+'</td><td>'+esc(x.ev)+'</td><td>'+esc(x.title)+'</td><td>'+esc(x.outcome)+'</td><td>'+esc(x.px)+'</td><td>'+esc(x.size)+'</td></tr>'}).join('')||'<tr><td colspan="6" class="muted">No events.</td></tr>';
}catch(e){$('ad-gen').textContent='agents.json unavailable ('+e.message+')'}}
function ema(a,n){var k=2/(n+1),e=a[0];for(var i=1;i<a.length;i++)e=a[i]*k+e*(1-k);return e}
var SIG={};
async function signal(coin){var now=Date.now();var r=await fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'candleSnapshot',req:{coin:coin,interval:'1h',startTime:now-80*3600e3,endTime:now}})});
 var k=await r.json();var cl=k.map(function(x){return +x.c});if(cl.length<25)throw new Error('few candles');
 var e9=ema(cl,9),e21=ema(cl,21),last=cl[cl.length-1],prev=cl[cl.length-2],mom=(last-prev)/prev;
 var s=e9>e21&&mom>0?'long':e9<e21&&mom<0?'short':'flat';return{coin:coin,sig:s,e9:e9,e21:e21,mom:mom}}
function agentPos(coin){var P=window.KSPaper;return P?P.S.positions.filter(function(p){return p.coin===coin&&p.agent}):[]}
function follow(coin,side){var P=window.KSPaper,m=P&&P.mids()[coin];if(!m){log('No live price for '+coin);return false}
 agentPos(coin).forEach(function(p){PaperEngine.close(P.S,p.id,m,'agent flip')});
 if(side==='long'||side==='short'){try{var p=PaperEngine.open(P.S,coin,side,MARGIN,LEV,m);p.agent=true;log('Paper '+side.toUpperCase()+' '+coin+' @ '+m.toFixed(2)+' (50 USDC × 5x)')}catch(e){log(e.message);P.save();P.render();return false}}
 else log('Closed agent '+coin+' positions (signal flat)');
 P.save();P.render();return true}
async function runSignals(){var rows=[];for(var coin of['BTC','ETH']){try{SIG[coin]=await signal(coin)}catch(e){SIG[coin]={coin:coin,err:e.message}}}
 $('ad-sig').innerHTML=['BTC','ETH'].map(function(coin){var s=SIG[coin];if(s.err)return '<tr><td>'+coin+'</td><td colspan="5" class="muted">'+esc(s.err)+'</td></tr>';
  return '<tr><td>'+coin+'-PERP</td><td><span class="sig '+s.sig+'">'+s.sig.toUpperCase()+'</span></td><td>'+s.e9.toFixed(2)+'</td><td>'+s.e21.toFixed(2)+'</td><td class="'+c(s.mom)+'">'+(s.mom*100).toFixed(2)+'%</td><td><button class="btn ghost" data-follow="'+coin+'"'+(s.sig==='flat'?' disabled':'')+'>Follow signal</button></td></tr>'}).join('');
 if(A.auto){['BTC','ETH'].forEach(function(coin){var s=SIG[coin];if(!s||s.err)return;var have=agentPos(coin),cur=have[0]&&have[0].side;
  if(s.sig!==A.last[coin]||(s.sig!=='flat'&&cur!==s.sig)||(s.sig==='flat'&&have.length)){if(follow(coin,s.sig))A.last[coin]=s.sig}})}
 else ['BTC','ETH'].forEach(function(coin){if(SIG[coin]&&!SIG[coin].err)A.last[coin]=SIG[coin].sig});saveA()}
$('ad-sig').onclick=function(e){var coin=e.target.getAttribute('data-follow');if(!coin||!SIG[coin])return;follow(coin,SIG[coin].sig)};
$('ad-auto').checked=!!A.auto;$('ad-auto').onchange=function(){A.auto=this.checked;saveA();log('Auto-follow '+(A.auto?'ON':'OFF'));if(A.auto)setTimeout(runSignals,500)};
loadAgents();setInterval(loadAgents,60000);setTimeout(runSignals,1500);setInterval(runSignals,60000);
})();
