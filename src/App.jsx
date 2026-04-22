import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── UTILS ──────────────────────────────────────────────────
function getWeekDates(offset = 0) {
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() + (dow === 0 ? -6 : 1) - dow + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d;
  });
}
const fmtMD  = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
const DAY_JP = ['月','火','水','木','金','土','日'];

// ── CONSTANTS ──────────────────────────────────────────────
const COLS = [
  { key:'todo',       label:'To Do',      accent:'#378ADD', light:'#E6F1FB' },
  { key:'inprogress', label:'In Progress', accent:'#BA7517', light:'#FAEEDA' },
];
const DONE_COL = { key:'done', label:'完了', accent:'#3B6D11', light:'#EAF3DE' };
const MEMO_COL = { key:'memo', label:'メモ', accent:'#7c3aed', light:'#f3eeff' };
const ALL_COLS = [...COLS, DONE_COL];
const PRIO = {
  high:   { label:'高', color:'#A32D2D' },
  medium: { label:'中', color:'#854F0B' },
  low:    { label:'低', color:'#3B6D11' },
};
const MEMO_COLORS = ['#fffde7','#e8f5e9','#e3f2fd','#fce4ec','#f3e5f5'];
const WS_COLORS   = ['#4a7aff','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899','#06b6d4'];
const WS_ICONS    = ['💼','🏠','🔬','🎨','📚','🏋️','🎮','✈️','🍀','⭐'];

// ── INITIAL DATA ────────────────────────────────────────────
const INIT_WORKSPACES = [
  { id:'ws-work',    name:'仕事',     icon:'💼', color:'#4a7aff' },
  { id:'ws-private', name:'プライベート', icon:'🏠', color:'#10b981' },
  { id:'ws-research',name:'研究',     icon:'🔬', color:'#8b5cf6' },
];
const INIT_PJJOBS = [
  { id:'pj1', pjJobNo:'017061-004', pjName:'MONOTARO登録データ作成2025（UCD88下期）', jobName:'インサイトシミュレーション' },
  { id:'pj2', pjJobNo:'016812-001', pjName:'R08OSW 大阪すくすくウォッチ5・6年生',    jobName:'結果提供出力処理' },
];
const INIT_TASKS = [
  { id:1, wsId:'ws-work', title:'MONOTARO登録データ作成', desc:'UCD88下期のインサイトシミュレーション',
    status:'todo', priority:'high', due:'2026-07-20',
    subtasks:[{id:1,text:'データ収集・整理',done:false},{id:2,text:'フォーマット確認',done:true}],
    pjJobId:'pj1', scheduledDate:'2026/07/20', notes:'', estimatedMinutes:0 },
  { id:2, wsId:'ws-work', title:'大阪すくすくウォッチ 結果出力', desc:'5・6年生の結果提供出力処理',
    status:'todo', priority:'medium', due:'2026-10-31', subtasks:[],
    pjJobId:'pj2', scheduledDate:'2026/10/31', notes:'', estimatedMinutes:0 },
];
const INIT_MEMOS = [{ id:1, wsId:'ws-work', text:'', color:'#fffde7' }];

// ── STYLE HELPERS ───────────────────────────────────────────
const inputSt = {
  background:'#ffffff', border:'1px solid #d0d3db', borderRadius:'6px',
  padding:'7px 11px', fontSize:'13px', color:'#1a1d23', width:'100%',
  boxSizing:'border-box', outline:'none', fontFamily:'inherit',
};
const labelSt = {
  fontSize:'11px', fontWeight:'600', color:'#5f6470',
  marginBottom:'4px', display:'block', letterSpacing:'0.03em',
};
const btnSt = (bg, color, border) => ({
  background:bg, border:border||'none', borderRadius:'6px',
  padding:'7px 16px', cursor:'pointer', fontSize:'13px', color,
  fontFamily:'inherit', fontWeight:'500',
});

// ── TASK CARD ───────────────────────────────────────────────
function TaskCard({ task, accent, pjJobs, onClick, onDragStart, onDragEnd, expanded, onToggleExpand }) {
  const [hov, setHov] = useState(false);
  const doneCnt = task.subtasks.filter(s=>s.status==='done'||s.done).length;
  const total   = task.subtasks.length;
  const p  = PRIO[task.priority] || PRIO.medium;
  const pj = pjJobs.find(j=>j.id===task.pjJobId);
  const hasSubtasks = total > 0;
  const showProgress = hasSubtasks && !expanded;

  const handleToggle = e => { e.stopPropagation(); onToggleExpand?.(); };

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'#ffffff', border:`1px solid ${hov?'#a0a8b8':'#e8eaed'}`,
        borderRadius:'8px', padding:'13px', marginBottom: expanded ? '0' : '8px',
        cursor:'pointer', transform:hov?'translateY(-1px)':'none', transition:'all 0.12s',
        boxShadow:hov?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
        <span onClick={onClick}
          style={{fontWeight:'500',fontSize:'13px',color:'#1a1d23',lineHeight:'1.45',flex:1,minWidth:0}}>
          {task.title}
        </span>
        <span onClick={onClick} style={{fontSize:'11px',fontWeight:'600',color:p.color,marginLeft:'8px',flexShrink:0,
          background:`${p.color}18`,padding:'2px 7px',borderRadius:'4px'}}>{p.label}</span>
      </div>
      {pj && (
        <div onClick={onClick} style={{fontSize:'11px',color:'#9095a0',marginBottom:'7px',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {pj.pjJobNo} · {pj.pjName}
        </div>
      )}
      {task.due && (
        <div onClick={onClick} style={{fontSize:'11px',color:'#9095a0',marginBottom: hasSubtasks ? '6px' : '0'}}>
          期限 {task.due}
        </div>
      )}
      {task.estimatedMinutes > 0 && (
        <div onClick={onClick} style={{fontSize:'11px',color:'#BA7517',marginTop:'4px'}}>
          ⏱ {Math.floor(task.estimatedMinutes/60)>0?`${Math.floor(task.estimatedMinutes/60)}時間`:''}
          {task.estimatedMinutes%60>0?`${task.estimatedMinutes%60}分`:''}
        </div>
      )}
      {hasSubtasks && onToggleExpand && (
        <div onClick={handleToggle}
          style={{marginTop:'8px',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',
            background: expanded ? '#f0f4ff' : '#f4f5f7',
            border:`1px solid ${expanded ? '#c5d5f5' : '#e8eaed'}`,
            transition:'background 0.15s,border 0.15s'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            fontSize:'11px',color:'#5f6470',marginBottom:'5px'}}>
            <span style={{display:'flex',alignItems:'center',gap:'4px',fontWeight:'500'}}>
              <span style={{fontSize:'8px'}}>{expanded?'▼':'▶'}</span>
              サブタスク
            </span>
            <span>{doneCnt}/{total}</span>
          </div>
          <div style={{background:'#d8dae0',borderRadius:'2px',height:'4px'}}>
            <div style={{background:accent,borderRadius:'2px',height:'4px',
              width:`${total?doneCnt/total*100:0}%`,transition:'width 0.3s'}} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBTASK TEXT ROW（To Do 展開表示用）───────────────────────
function SubtaskTextRow({ subtask, onDragStart, onDragEnd }) {
  const [hov, setHov] = useState(false);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex', alignItems:'center', gap:'8px',
        padding:'6px 10px', borderRadius:'6px', marginBottom:'3px',
        background: hov ? '#f0f2f5' : '#f7f8fa',
        cursor:'grab', transition:'all 0.12s',
        boxShadow: hov ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'}}>
      <span style={{width:'5px', height:'5px', borderRadius:'50%',
        background:'#c0c4cc', flexShrink:0}} />
      <span style={{fontSize:'12px', color:'#1a1d23', lineHeight:'1.4', flex:1}}>
        {subtask.text}
      </span>
    </div>
  );
}

// ── SUBTASK CARD（In Progress 表示用）────────────────────────
function SubtaskInProgressCard({ subtask, parentTask, onDragStart, onDragEnd, onOpenParent }) {
  const [hov, setHov] = useState(false);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'#ffffff', border:`1px solid ${hov?'#a0a8b8':'#e8eaed'}`,
        borderRadius:'8px', padding:'11px 13px', marginBottom:'3px', cursor:'grab',
        transform:hov?'translateY(-1px)':'none', transition:'all 0.12s',
        boxShadow:hov?'0 2px 8px rgba(0,0,0,0.08)':'none'}}>
      <div style={{fontSize:'13px', fontWeight:'500', color:'#1a1d23',
        lineHeight:'1.4', marginBottom:'5px'}}>
        {subtask.text}
      </div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'6px'}}>
        <div onClick={onOpenParent} style={{fontSize:'11px', color:'#9095a0',
          cursor:'pointer', display:'flex', alignItems:'center', gap:'3px', flex:1, minWidth:0}}>
          <span>↳</span>
          <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {parentTask.title}
          </span>
        </div>
        {subtask.estimatedMinutes > 0 && (
          <span style={{fontSize:'11px', color:'#BA7517', flexShrink:0}}>
            ⏱ {Math.floor(subtask.estimatedMinutes/60)>0?`${Math.floor(subtask.estimatedMinutes/60)}時間`:''}
            {subtask.estimatedMinutes%60>0?`${subtask.estimatedMinutes%60}分`:''}
          </span>
        )}
      </div>
    </div>
  );
}

// ── ESTIMATED TIME MODAL ─────────────────────────────────────
const EST_OPTIONS = [
  {label:'30分',      value:30},
  {label:'1時間',     value:60},
  {label:'1時間30分', value:90},
  {label:'2時間',     value:120},
  {label:'2時間30分', value:150},
  {label:'3時間',     value:180},
  {label:'3時間30分', value:210},
  {label:'4時間',     value:240},
  {label:'5時間',     value:300},
  {label:'6時間',     value:360},
  {label:'7時間',     value:420},
  {label:'8時間',     value:480},
];

function EstimatedTimeModal({ taskTitle, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(30);

  return (
    <div onClick={onCancel}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:250,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'360px',padding:'26px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
        <h2 style={{fontSize:'15px',fontWeight:'600',color:'#1a1d23',marginBottom:'6px'}}>
          想定完了時間を設定
        </h2>
        <div style={{fontSize:'13px',color:'#5f6470',marginBottom:'18px',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {taskTitle}
        </div>

        <select value={selected} onChange={e=>setSelected(Number(e.target.value))}
          style={{...inputSt, marginBottom:'24px'}}>
          {EST_OPTIONS.map(o=>(
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
          <button onClick={onCancel}
            style={{...btnSt('#f4f5f7','#1a1d23','1px solid #d0d3db')}}>
            キャンセル
          </button>
          <button onClick={()=>onConfirm(selected)} style={btnSt('#e8f0fe','#2c5fcc')}>
            設定して移動
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SCHEDULE MODAL ──────────────────────────────────────────
const LUNCH_START = 12 * 60; // 720
const LUNCH_END   = 13 * 60; // 780

function calcSchedule(rawItems) {
  const today   = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const fmtDT   = m => `${dateStr}T${String(Math.floor(m/60)).padStart(2,'0')}${String(m%60).padStart(2,'0')}00`;
  let startMins = 10 * 60;
  return rawItems.map(item => {
    if(startMins >= LUNCH_START && startMins < LUNCH_END) startMins = LUNCH_END;
    const duration = item.estimatedMinutes > 0 ? item.estimatedMinutes : 60;
    let endMins = startMins + duration;
    if(startMins < LUNCH_START && endMins > LUNCH_START) endMins += (LUNCH_END - LUNCH_START);
    const result = {
      ...item, startMins, endMins,
      url: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${fmtDT(startMins)}/${fmtDT(endMins)}`,
    };
    startMins = endMins;
    return result;
  });
}

function ScheduleModal({ rawItems, onClose }) {
  const [order, setOrder]       = useState(rawItems);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragIdx = useRef(null);
  const fmtTime = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const computed = useMemo(() => calcSchedule(order), [order]);

  const handleDrop = (targetIdx) => {
    if(dragIdx.current === null || dragIdx.current === targetIdx) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }
    setOrder(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx.current, 1);
      arr.splice(targetIdx, 0, item);
      return arr;
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:250,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'560px',padding:'28px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)',maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#1a1d23'}}>
            📅 本日のスケジュール（10:00 始業）
          </h2>
          <button onClick={onClose}
            style={{background:'none',border:'none',fontSize:'17px',cursor:'pointer',color:'#9095a0'}}>✕</button>
        </div>
        <div style={{fontSize:'11px',color:'#9095a0',marginBottom:'16px'}}>
          ドラッグで順番を変更できます　※ 12:00〜13:00 は昼休憩
        </div>
        <div style={{overflowY:'auto',flex:1,marginBottom:'16px'}}>
          {computed.map((item,i)=>(
            <div key={i}
              draggable
              onDragStart={()=>{ dragIdx.current=i; }}
              onDragOver={e=>{ e.preventDefault(); setDragOverIdx(i); }}
              onDragLeave={()=>setDragOverIdx(null)}
              onDrop={()=>handleDrop(i)}
              onDragEnd={()=>{ dragIdx.current=null; setDragOverIdx(null); }}
              style={{display:'flex',alignItems:'center',gap:'8px',
                padding:'10px 12px',borderRadius:'8px',marginBottom:'6px',cursor:'grab',
                background: dragOverIdx===i ? '#f0f4ff' : '#ffffff',
                border: `1px solid ${dragOverIdx===i ? '#378ADD' : '#e8eaed'}`,
                transition:'background 0.1s, border 0.1s'}}>
              {/* ハンドル */}
              <span style={{fontSize:'13px',color:'#c0c4cc',flexShrink:0,userSelect:'none'}}>⠿</span>
              {/* 時刻 */}
              <div style={{fontSize:'12px',color:'#BA7517',fontWeight:'600',flexShrink:0,minWidth:'116px'}}>
                {fmtTime(item.startMins)} 〜 {fmtTime(item.endMins)}
              </div>
              {/* タイトル */}
              <div style={{flex:1,fontSize:'13px',color:'#1a1d23',
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {item.title}
              </div>
              {/* 追加ボタン */}
              <a href={item.url} target="_blank" rel="noreferrer"
                onClick={e=>e.stopPropagation()}
                style={{...btnSt('#e8f0fe','#2c5fcc'),fontSize:'12px',padding:'5px 14px',
                  textDecoration:'none',flexShrink:0}}>
                追加
              </a>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center'}}>
          <button onClick={onClose}
            style={{...btnSt('#f4f5f7','#1a1d23','1px solid #d0d3db')}}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

// ── TASK MODAL ──────────────────────────────────────────────
function TaskModal({ task, tasks, pjJobs, apiKey, updateTask, addSubtask, toggleSubtask, removeSubtask, deleteTask, onClose }) {
  const [title, setTitle]         = useState(task.title);
  const [desc, setDesc]           = useState(task.desc||'');
  const [notes, setNotes]         = useState(task.notes||'');
  const [due, setDue]             = useState(task.due||'');
  const [priority, setPriority]   = useState(task.priority||'medium');
  const [status, setStatus]       = useState(task.status||'todo');
  const [pjJobId, setPjJobId]     = useState(task.pjJobId||'');
  const [schedDate, setSchedDate] = useState(task.scheduledDate||'');
  const [subInput, setSubInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg]         = useState('');
  const initEst = EST_OPTIONS.reduce((prev,cur) =>
    Math.abs(cur.value-(task.estimatedMinutes||60)) < Math.abs(prev.value-(task.estimatedMinutes||60)) ? cur : prev
  ).value;
  const [estMins, setEstMins] = useState(initEst);

  const current = tasks.find(t=>t.id===task.id) || task;
  const selPj   = pjJobs.find(j=>j.id===pjJobId);
  const showPj  = task.wsId !== 'ws-private' && task.wsId !== 'ws-research';

  const save = useCallback(() => {
    updateTask(task.id, { title, desc, notes, due, priority, status, pjJobId, scheduledDate:schedDate,
      estimatedMinutes: status==='inprogress' ? estMins : (task.estimatedMinutes||0) });
  }, [title,desc,notes,due,priority,status,pjJobId,schedDate,estMins]);

  const dragSubIdx    = useRef(null);
  const [dragOverSub, setDragOverSub] = useState(null);
  const [editSubId,   setEditSubId]   = useState(null);
  const [editSubText, setEditSubText] = useState('');

  const saveSubEdit = (subId) => {
    if(!editSubText.trim()) { setEditSubId(null); return; }
    const arr = current.subtasks.map(s=>s.id===subId?{...s,text:editSubText.trim()}:s);
    updateTask(task.id, { subtasks: arr });
    setEditSubId(null);
  };

  const handleClose  = () => { save(); onClose(); };
  const handleAddSub = () => { if(!subInput.trim())return; addSubtask(task.id,subInput.trim()); setSubInput(''); };

  const handleSubDrop = (targetIdx) => {
    if(dragSubIdx.current === null || dragSubIdx.current === targetIdx) {
      dragSubIdx.current = null; setDragOverSub(null); return;
    }
    const arr = [...current.subtasks];
    const [item] = arr.splice(dragSubIdx.current, 1);
    arr.splice(targetIdx, 0, item);
    updateTask(task.id, { subtasks: arr });
    dragSubIdx.current = null; setDragOverSub(null);
  };

  const aiDecompose = async () => {
    if(!apiKey) { setAiMsg('APIキーが未設定です（サイドバー下部で設定）'); return; }
    setAiLoading(true); setAiMsg('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
          messages:[{role:'user', content:
            `以下のタスクを実行可能な小タスクに分解してください（5〜7個）。JSON配列のみ返してください（例: ["タスク1", "タスク2"]）。\nタスク名: ${title}\n説明: ${desc||'なし'}`}]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c=>c.text||'').join('')||'';
      const m = text.match(/\[[\s\S]*?\]/);
      if(m){ const items=JSON.parse(m[0]); items.forEach(t=>addSubtask(task.id,t)); setAiMsg(`${items.length}件追加`); }
      else { setAiMsg('失敗しました'); }
    } catch(e){ setAiMsg('エラー'); }
    setAiLoading(false);
  };

  const sel = {...inputSt, width:'auto', padding:'6px 10px'};
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)handleClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,
        display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'32px 16px',overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'660px',padding:'28px',position:'relative',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>

        <button onClick={handleClose}
          style={{position:'absolute',top:'14px',right:'14px',background:'none',border:'none',
            fontSize:'17px',cursor:'pointer',color:'#9095a0',lineHeight:1}}>✕</button>

        <input value={title} onChange={e=>setTitle(e.target.value)}
          style={{...inputSt,fontSize:'17px',fontWeight:'500',background:'transparent',
            border:'none',borderBottom:'1px solid #d0d3db',borderRadius:0,marginBottom:'18px',padding:'4px 0'}} />

        <div style={{marginBottom:'14px'}}>
          <label style={labelSt}>期限日</label>
          <input type="date" value={due} onChange={e=>setDue(e.target.value)} style={sel}/>
        </div>

        {/* 想定完了時間（In Progress のとき表示） */}
        {status === 'inprogress' && (
          <div style={{marginBottom:'14px',background:'#FAEEDA',borderRadius:'8px',padding:'12px 14px',
            border:'1px solid #f0d49a'}}>
            <label style={{...labelSt,color:'#854F0B',marginBottom:'8px'}}>⏱ 想定完了時間</label>
            <select value={estMins} onChange={e=>setEstMins(Number(e.target.value))}
              style={{...inputSt,background:'#ffffff'}}>
              {EST_OPTIONS.map(o=>(
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{marginBottom:'16px'}}>
          <label style={labelSt}>説明</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
            style={{...inputSt,resize:'vertical',lineHeight:'1.6'}} />
        </div>

        {/* Subtasks */}
        <div style={{marginBottom:'18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <label style={{...labelSt,marginBottom:0}}>サブタスク ({current.subtasks.length})</label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              {aiMsg&&<span style={{fontSize:'11px',color:'#2d6a2d'}}>{aiMsg}</span>}
              <button onClick={aiDecompose} disabled={aiLoading}
                style={{...btnSt('#e8f0fe','#2c5fcc'),fontSize:'12px',padding:'4px 12px',opacity:aiLoading?0.6:1}}>
                {aiLoading?'分解中...':'✦ AI で分解'}
              </button>
            </div>
          </div>
          <div style={{marginBottom:'8px',maxHeight:'220px',overflowY:'auto'}}>
            {current.subtasks.map((sub,i)=>(
              <div key={sub.id}
                draggable
                onDragStart={()=>{ dragSubIdx.current=i; }}
                onDragOver={e=>{ e.preventDefault(); setDragOverSub(i); }}
                onDragLeave={()=>setDragOverSub(null)}
                onDrop={()=>handleSubDrop(i)}
                onDragEnd={()=>{ dragSubIdx.current=null; setDragOverSub(null); }}
                style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',
                  borderRadius:'6px',marginBottom:'3px',cursor:'grab',
                  background: dragOverSub===i ? '#f0f4ff' : '#f4f5f7',
                  border:`1px solid ${dragOverSub===i?'#378ADD':'transparent'}`,
                  transition:'background 0.1s,border 0.1s'}}>
                <span style={{color:'#b0b5bf',fontSize:'14px',flexShrink:0,userSelect:'none'}}>⠿</span>
                {editSubId===sub.id ? (
                  <input autoFocus value={editSubText}
                    onChange={e=>setEditSubText(e.target.value)}
                    onBlur={()=>saveSubEdit(sub.id)}
                    onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();saveSubEdit(sub.id);} if(e.key==='Escape')setEditSubId(null); }}
                    style={{...inputSt,flex:1,padding:'2px 6px',fontSize:'13px'}}/>
                ) : (
                  <span onClick={()=>{ setEditSubId(sub.id); setEditSubText(sub.text); }}
                    style={{flex:1,fontSize:'13px',color:'#1a1d23',cursor:'text'}}>{sub.text}</span>
                )}
                <button onClick={()=>removeSubtask(task.id,sub.id)}
                  style={{background:'none',border:'none',color:'#b91c1c',cursor:'pointer',fontSize:'13px',lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <input value={subInput} onChange={e=>setSubInput(e.target.value)}
              placeholder="サブタスクを追加... (Enterで確定)"
              onKeyDown={e=>{if(e.key==='Enter')handleAddSub();}}
              style={{...inputSt,flex:1}} />
            <button onClick={handleAddSub} style={btnSt('#e8f0fe','#2c5fcc')}>追加</button>
          </div>
        </div>

        {/* PJ/JOB 選択 */}
        {showPj && <div style={{padding:'14px',background:'#f4f5f7',borderRadius:'8px',border:'1px solid #e8eaed',marginBottom:'16px'}}>
          <label style={{...labelSt,marginBottom:'12px',fontSize:'12px'}}>プロジェクト / JOB 情報</label>
          <div style={{marginBottom:'10px'}}>
            <label style={labelSt}>PJ-JOBNo を選択</label>
            <select value={pjJobId} onChange={e=>setPjJobId(e.target.value)}
              style={{...inputSt,background:'#ffffff'}}>
              <option value="">── 未設定 ──</option>
              {pjJobs.map(j=>(
                <option key={j.id} value={j.id}>{j.pjJobNo}｜{j.pjName}</option>
              ))}
            </select>
          </div>
          {selPj && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
              <div>
                <label style={labelSt}>PJ名</label>
                <div style={{fontSize:'12px',color:'#5f6470',padding:'6px 10px',background:'#ffffff',borderRadius:'6px',border:'1px solid #e8eaed'}}>{selPj.pjName}</div>
              </div>
              <div>
                <label style={labelSt}>JOB名</label>
                <div style={{fontSize:'12px',color:'#5f6470',padding:'6px 10px',background:'#ffffff',borderRadius:'6px',border:'1px solid #e8eaed'}}>{selPj.jobName}</div>
              </div>
            </div>
          )}
          <div>
            <label style={labelSt}>計上予定日</label>
            <input value={schedDate} onChange={e=>setSchedDate(e.target.value)}
              style={{...inputSt,background:'#ffffff'}} placeholder="YYYY/MM/DD" />
          </div>
        </div>}

        <div style={{marginBottom:'22px'}}>
          <label style={labelSt}>メモ・備考</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
            style={{...inputSt,resize:'vertical',lineHeight:'1.6'}} placeholder="備考・メモを入力..."/>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button onClick={()=>{
            if(window.confirm(`「${title}」を削除しますか？`)){deleteTask(task.id);onClose();}
          }} style={btnSt('#fce8e8','#b91c1c')}>削除</button>
          <button onClick={handleClose} style={btnSt('#e8f0fe','#2c5fcc')}>保存して閉じる</button>
        </div>
      </div>
    </div>
  );
}

// ── ADD TASK MODAL ──────────────────────────────────────────
function AddTaskModal({ onClose, onAdd, initStatus, pjJobs, wsId }) {
  const [f, setF] = useState({
    title:'', desc:'', status:initStatus||'todo', priority:'medium',
    due:'', pjJobId:'', scheduledDate:'', notes:'', estimatedMinutes:0,
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSub, setNewSub]     = useState('');
  const upd    = k => e => setF(x=>({...x,[k]:e.target.value}));
  const sel    = {...inputSt, width:'auto', padding:'6px 10px'};
  const selPj  = pjJobs.find(j=>j.id===f.pjJobId);
  const showPj = wsId !== 'ws-private' && wsId !== 'ws-research';

  const addSub = () => {
    if(!newSub.trim()) return;
    setSubtasks(s=>[...s,{id:Date.now(),text:newSub.trim(),done:false,status:'todo',estimatedMinutes:0}]);
    setNewSub('');
  };
  const removeSub = id => setSubtasks(s=>s.filter(x=>x.id!==id));

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'520px',padding:'26px',maxHeight:'90vh',overflowY:'auto',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
        <h2 style={{fontSize:'16px',fontWeight:'600',color:'#1a1d23',marginBottom:'18px'}}>新しいタスク</h2>

        <div style={{marginBottom:'12px'}}>
          <label style={labelSt}>タスク名 *</label>
          <input value={f.title} onChange={upd('title')} style={inputSt} placeholder="タスク名を入力..."/>
        </div>
        <div style={{marginBottom:'12px'}}>
          <label style={labelSt}>説明</label>
          <textarea value={f.desc} onChange={upd('desc')} rows={2} style={{...inputSt,resize:'vertical'}}/>
        </div>
        <div style={{marginBottom:'12px'}}>
          <label style={labelSt}>期限日</label>
          <input type="date" value={f.due} onChange={upd('due')} style={sel}/>
        </div>

        {showPj && (
          <div style={{padding:'12px',background:'#f4f5f7',borderRadius:'8px',marginBottom:'14px'}}>
            <label style={{...labelSt,marginBottom:'10px'}}>プロジェクト / JOB</label>
            <select value={f.pjJobId} onChange={upd('pjJobId')}
              style={{...inputSt,background:'#ffffff',marginBottom:'8px'}}>
              <option value="">── 未設定 ──</option>
              {pjJobs.map(j=>(
                <option key={j.id} value={j.id}>{j.pjJobNo}｜{j.pjName}</option>
              ))}
            </select>
            {selPj && (
              <div style={{fontSize:'12px',color:'#5f6470',marginBottom:'8px'}}>JOB名: {selPj.jobName}</div>
            )}
            <label style={labelSt}>計上予定日</label>
            <input value={f.scheduledDate} onChange={upd('scheduledDate')}
              style={{...inputSt,background:'#ffffff'}} placeholder="YYYY/MM/DD"/>
          </div>
        )}

        <div style={{marginBottom:'14px'}}>
          <label style={labelSt}>サブタスク</label>
          {subtasks.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',
              padding:'6px 10px',background:'#f4f5f7',borderRadius:'6px',marginBottom:'6px'}}>
              <span style={{flex:1,fontSize:'13px',color:'#1a1d23'}}>{s.text}</span>
              <button onClick={()=>removeSub(s.id)}
                style={{background:'none',border:'none',cursor:'pointer',color:'#9aa0ad',fontSize:'16px',
                  lineHeight:1,padding:'0 2px'}}>×</button>
            </div>
          ))}
          <div style={{display:'flex',gap:'8px'}}>
            <input value={newSub} onChange={e=>setNewSub(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();addSub();} }}
              style={{...inputSt,flex:1}} placeholder="サブタスクを入力して Enter または追加"/>
            <button onClick={addSub}
              style={{...btnSt('#e8f0fe','#2c5fcc'),whiteSpace:'nowrap'}}>追加</button>
          </div>
        </div>

        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
          <button onClick={onClose}
            style={{...btnSt('#f4f5f7','#1a1d23','1px solid #d0d3db')}}>キャンセル</button>
          <button onClick={()=>{if(f.title.trim()){onAdd({...f,id:Date.now(),subtasks});onClose();}}}
            style={btnSt('#e8f0fe','#2c5fcc')}>作成</button>
        </div>
      </div>
    </div>
  );
}

// ── PJ/JOB MASTER MODAL ─────────────────────────────────────
function PjJobModal({ pjJobs, setPjJobs, onClose }) {
  const [form, setForm] = useState({ pjJobNo:'', pjName:'', jobName:'' });
  const [editId, setEditId] = useState(null);

  const startEdit = j => { setForm({pjJobNo:j.pjJobNo,pjName:j.pjName,jobName:j.jobName}); setEditId(j.id); };
  const cancelEdit = () => { setForm({pjJobNo:'',pjName:'',jobName:''}); setEditId(null); };

  const save = () => {
    if(!form.pjJobNo.trim()||!form.pjName.trim()) return;
    if(editId){
      setPjJobs(js=>js.map(j=>j.id===editId?{...j,...form}:j));
      setEditId(null);
    } else {
      setPjJobs(js=>[...js,{id:'pj'+Date.now(),...form}]);
    }
    setForm({pjJobNo:'',pjName:'',jobName:''});
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:300,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'720px',padding:'28px',maxHeight:'90vh',overflowY:'auto',
          boxShadow:'0 8px 32px rgba(0,0,0,0.14)'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h2 style={{fontSize:'16px',fontWeight:'600',color:'#1a1d23'}}>📋 PJ / JOB マスタ管理</h2>
          <button onClick={onClose}
            style={{background:'none',border:'none',fontSize:'17px',cursor:'pointer',color:'#9095a0'}}>✕</button>
        </div>

        {/* 登録フォーム */}
        <div style={{background:'#f4f5f7',borderRadius:'8px',padding:'16px',marginBottom:'20px',
          border:`2px solid ${editId?'#f59e0b':'#e8eaed'}`}}>
          <div style={{fontSize:'12px',fontWeight:'600',color:'#5f6470',marginBottom:'12px'}}>
            {editId ? '✏️ 編集中' : '＋ 新規登録'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'140px 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
            <div>
              <label style={labelSt}>PJ-JOBNo *</label>
              <input value={form.pjJobNo} onChange={e=>setForm(f=>({...f,pjJobNo:e.target.value}))}
                style={{...inputSt,background:'#ffffff'}} placeholder="000000-000"/>
            </div>
            <div>
              <label style={labelSt}>PJ名 *</label>
              <input value={form.pjName} onChange={e=>setForm(f=>({...f,pjName:e.target.value}))}
                style={{...inputSt,background:'#ffffff'}} placeholder="プロジェクト名"/>
            </div>
            <div>
              <label style={labelSt}>JOB名</label>
              <input value={form.jobName} onChange={e=>setForm(f=>({...f,jobName:e.target.value}))}
                style={{...inputSt,background:'#ffffff'}} placeholder="ジョブ名"/>
            </div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={save} style={btnSt('#e8f0fe','#2c5fcc')}>
              {editId ? '更新' : '登録'}
            </button>
            {editId && (
              <button onClick={cancelEdit}
                style={{...btnSt('#f4f5f7','#5f6470','1px solid #d0d3db')}}>キャンセル</button>
            )}
          </div>
        </div>

        {/* 一覧 */}
        {pjJobs.length === 0 ? (
          <div style={{textAlign:'center',color:'#9095a0',padding:'32px',fontSize:'13px'}}>
            まだ登録されていません
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
            <thead>
              <tr style={{background:'#f4f5f7'}}>
                {['PJ-JOBNo','PJ名','JOB名','操作'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontWeight:'600',
                    color:'#5f6470',borderBottom:'1px solid #e8eaed'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pjJobs.map((j,i)=>(
                <tr key={j.id}
                  style={{background:editId===j.id?'#fffbeb':i%2===0?'#ffffff':'#fafafa',
                    borderBottom:'1px solid #e8eaed'}}>
                  <td style={{padding:'9px 12px',fontWeight:'600',color:'#1a1d23',whiteSpace:'nowrap'}}>{j.pjJobNo}</td>
                  <td style={{padding:'9px 12px',color:'#5f6470',maxWidth:'220px',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                    title={j.pjName}>{j.pjName}</td>
                  <td style={{padding:'9px 12px',color:'#5f6470'}}>{j.jobName}</td>
                  <td style={{padding:'9px 12px',whiteSpace:'nowrap'}}>
                    <button onClick={()=>startEdit(j)}
                      style={{...btnSt('#e8f0fe','#2c5fcc'),fontSize:'11px',padding:'3px 10px',marginRight:'6px'}}>
                      編集
                    </button>
                    <button onClick={()=>{ if(window.confirm(`"${j.pjJobNo}" を削除しますか？`)) setPjJobs(js=>js.filter(x=>x.id!==j.id)); }}
                      style={{...btnSt('#fce8e8','#b91c1c'),fontSize:'11px',padding:'3px 10px'}}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── WORKSPACE MODAL ─────────────────────────────────────────
function WorkspaceModal({ workspaces, setWorkspaces, onClose }) {
  const [form, setForm] = useState({ name:'', icon:'⭐', color:'#4a7aff' });

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:300,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'#ffffff',borderRadius:'12px',border:'1px solid #e8eaed',
          width:'100%',maxWidth:'480px',padding:'28px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.14)'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h2 style={{fontSize:'16px',fontWeight:'600',color:'#1a1d23'}}>🗂 ワークスペース管理</h2>
          <button onClick={onClose}
            style={{background:'none',border:'none',fontSize:'17px',cursor:'pointer',color:'#9095a0'}}>✕</button>
        </div>

        {/* 現在の一覧 */}
        <div style={{marginBottom:'20px'}}>
          {workspaces.map(ws=>(
            <div key={ws.id}
              style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',
                borderRadius:'8px',marginBottom:'6px',background:'#f4f5f7',border:'1px solid #e8eaed'}}>
              <span style={{fontSize:'18px'}}>{ws.icon}</span>
              <div style={{flex:1,fontWeight:'500',fontSize:'13px',color:'#1a1d23'}}>{ws.name}</div>
              <div style={{width:'12px',height:'12px',borderRadius:'50%',background:ws.color,flexShrink:0}}/>
              {workspaces.length > 1 && (
                <button onClick={()=>{ if(window.confirm(`"${ws.name}" を削除しますか？`)) setWorkspaces(w=>w.filter(x=>x.id!==ws.id)); }}
                  style={{background:'none',border:'none',color:'#b91c1c',cursor:'pointer',fontSize:'15px',lineHeight:1}}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* 新規追加フォーム */}
        <div style={{background:'#f4f5f7',borderRadius:'8px',padding:'14px'}}>
          <div style={{fontSize:'12px',fontWeight:'600',color:'#5f6470',marginBottom:'12px'}}>＋ 新規追加</div>
          <div style={{marginBottom:'10px'}}>
            <label style={labelSt}>名前</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              style={{...inputSt,background:'#ffffff'}} placeholder="例: チームA"/>
          </div>
          <div style={{marginBottom:'10px'}}>
            <label style={labelSt}>アイコン</label>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {WS_ICONS.map(ic=>(
                <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))}
                  style={{fontSize:'18px',padding:'4px 6px',
                    border:`2px solid ${form.icon===ic?'#4a7aff':'transparent'}`,
                    borderRadius:'6px',cursor:'pointer',background:'#ffffff'}}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={labelSt}>カラー</label>
            <div style={{display:'flex',gap:'6px'}}>
              {WS_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  style={{width:'24px',height:'24px',borderRadius:'50%',background:c,
                    border:`3px solid ${form.color===c?'#1a1d23':'transparent'}`,cursor:'pointer'}}/>
              ))}
            </div>
          </div>
          <button onClick={()=>{
            if(!form.name.trim()) return;
            setWorkspaces(ws=>[...ws,{id:'ws'+Date.now(),...form}]);
            setForm({name:'',icon:'⭐',color:'#4a7aff'});
          }} style={btnSt('#e8f0fe','#2c5fcc')}>追加</button>
        </div>
      </div>
    </div>
  );
}

// ── APLEX VIEW ──────────────────────────────────────────────
function AplexView({ tasks, pjJobs, weekDates, timeData, setTime }) {
  const jobs = tasks.reduce((acc,t)=>{
    if(t.pjJobId && !acc.find(j=>j.pjJobId===t.pjJobId)){
      const pj = pjJobs.find(j=>j.id===t.pjJobId);
      if(pj) acc.push({...pj, pjJobId:t.pjJobId, scheduledDate:t.scheduledDate});
    }
    return acc;
  },[]);

  const thSt = (sat,sun) => ({
    padding:'6px 8px', textAlign:'center', fontWeight:'600', fontSize:'12px',
    background:sun?'#ffeaea':sat?'#dceeff':'#dde5f4', color:'#1a1d23', border:'1px solid #aab',
  });
  const tdSt = (sat,sun) => ({
    padding:'5px 6px', textAlign:'center', fontSize:'12px', border:'1px solid #c5cad8',
    background:sun?'#fff5f5':sat?'#f0f8ff':'#ffffff',
  });

  return (
    <div style={{maxWidth:'900px'}}>
      <div style={{background:'#ffffff',border:'1.5px solid #aab',borderRadius:'6px',marginBottom:'18px',overflow:'auto'}}>
        <div style={{background:'#dde5f4',padding:'8px 14px',borderBottom:'1px solid #aab',
          fontSize:'13px',fontWeight:'600',color:'#3a4a6b'}}>勤怠情報</div>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
          <thead>
            <tr>
              <th style={{...thSt(false,false),width:'100px'}}></th>
              {weekDates.map((d,i)=>(
                <th key={i} style={thSt(i===5,i===6)}>
                  {fmtMD(d)}<br/><span style={{fontWeight:'400',fontSize:'10px'}}>{DAY_JP[i]}</span>
                </th>
              ))}
              <th style={{...thSt(false,false),background:'#dde5f4'}}>合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{...tdSt(false,false),background:'#f0f3fb',fontWeight:'500',
                textAlign:'left',paddingLeft:'10px',fontSize:'11px'}}>入力合計</td>
              {weekDates.map((d,i)=>{
                const dk=`total_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
                return(
                  <td key={i} style={tdSt(i===5,i===6)}>
                    <input type="number" min="0" max="24" step="0.5"
                      value={timeData[dk]||''}
                      onChange={e=>setTime('total',dk,e.target.value)}
                      style={{width:'44px',border:'none',background:'transparent',textAlign:'center',fontSize:'12px',outline:'none'}}/>
                  </td>
                );
              })}
              <td style={{...tdSt(false,false),background:'#eef0f8',fontWeight:'500'}}>
                {weekDates.reduce((s,d)=>{
                  const dk=`total_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
                  return s+(parseFloat(timeData[dk])||0);
                },0).toFixed(1)}h
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{background:'#ffffff',border:'1.5px solid #aab',borderRadius:'6px',overflow:'auto'}}>
        <div style={{background:'#dde5f4',padding:'8px 14px',borderBottom:'1px solid #aab',
          fontSize:'13px',fontWeight:'600',color:'#3a4a6b'}}>JOB 内訳</div>
        {jobs.length === 0 ? (
          <div style={{padding:'24px',textAlign:'center',color:'#9095a0',fontSize:'13px'}}>
            タスクに PJ-JOBNo を設定すると自動反映されます
          </div>
        ) : jobs.map(job=>(
          <div key={job.pjJobId} style={{borderBottom:'1px solid #d0d5e0'}}>
            <div style={{display:'flex',fontSize:'12px',background:'#f4f6fb',borderBottom:'1px solid #d0d5e0'}}>
              <div style={{padding:'6px 10px',width:'110px',flexShrink:0,fontWeight:'600',color:'#3a4a6b'}}>{job.pjJobNo}</div>
              <div style={{padding:'6px 10px',flex:1,color:'#5f6470'}}>
                PJ: {job.pjName}　JOB: {job.jobName}　計上予定日: {job.scheduledDate||'—'}
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
              <tbody>
                <tr>
                  <td style={{...tdSt(false,false),background:'#f8f9ff',fontWeight:'500',
                    textAlign:'left',paddingLeft:'10px',width:'100px',fontSize:'11px'}}>☆データ処理</td>
                  {weekDates.map((d,i)=>{
                    const dk=`${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
                    return(
                      <td key={i} style={tdSt(i===5,i===6)}>
                        <input type="number" min="0" max="24" step="0.5"
                          value={(timeData[job.pjJobId]||{})[dk]||''}
                          onChange={e=>setTime(job.pjJobId,dk,e.target.value)}
                          style={{width:'44px',border:'none',background:'transparent',textAlign:'center',fontSize:'12px',outline:'none'}}/>
                      </td>
                    );
                  })}
                  <td style={{...tdSt(false,false),fontWeight:'500',background:'#eef0f8'}}>
                    {weekDates.reduce((s,d)=>{
                      const dk=`${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
                      return s+(parseFloat((timeData[job.pjJobId]||{})[dk])||0);
                    },0).toFixed(1)}h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
        <div style={{background:'#5b80c8',color:'white',padding:'10px 14px',fontSize:'12px',fontWeight:'600'}}>備考</div>
        <textarea rows={3} style={{width:'100%',border:'none',padding:'10px 14px',
          background:'#ffffff',color:'#1a1d23',resize:'vertical',outline:'none',
          height:'54px',fontFamily:'inherit'}} placeholder="備考を入力..."/>
      </div>
    </div>
  );
}

// ── MEMO CARD ───────────────────────────────────────────────
function MemoCard({ memo, onChange, onDelete }) {
  const [hov, setHov] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }, [memo.text]);

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{background: memo.color, borderRadius:'8px', padding:'11px 28px',
        marginBottom:'8px', position:'relative',
        boxShadow: hov ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.08)',
        transform: hov ? 'translateY(-1px)' : 'none', transition:'all 0.12s'}}>
      {hov && (
        <button onClick={onDelete}
          style={{position:'absolute', top:'6px', right:'7px', background:'rgba(0,0,0,0.12)',
            border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer',
            fontSize:'12px', color:'rgba(0,0,0,0.5)', lineHeight:1, display:'flex',
            alignItems:'center', justifyContent:'center', padding:0}}>×</button>
      )}
      <textarea ref={taRef} value={memo.text}
        onChange={e => onChange(e.target.value)}
        style={{width:'100%', height:'auto', minHeight:'40px', background:'transparent',
          border:'none', resize:'none', outline:'none', fontSize:'13px',
          lineHeight:'1.65', fontFamily:'inherit', display:'block', overflow:'hidden'}}
        placeholder="メモを入力..." />
    </div>
  );
}

// ── ADD MEMO MODAL ───────────────────────────────────────────
function AddMemoModal({ onClose, onAdd }) {
  const [text, setText]   = useState('');
  const [color, setColor] = useState(MEMO_COLORS[0]);
  const taRef = useRef(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({ id: Date.now(), text, color });
    onClose();
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200,
        display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
      <div onClick={e => e.stopPropagation()}
        style={{background:'#ffffff', borderRadius:'12px', border:'1px solid #e8eaed',
          width:'100%', maxWidth:'400px', padding:'26px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
        <h2 style={{fontSize:'16px', fontWeight:'600', color:'#1a1d23', marginBottom:'18px'}}>新しいメモ</h2>

        <div style={{marginBottom:'14px'}}>
          <label style={labelSt}>内容 *</label>
          <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)}
            rows={4} style={{...inputSt, resize:'vertical', lineHeight:'1.65'}}
            placeholder="メモを入力..."
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }} />
        </div>

        <div style={{marginBottom:'20px'}}>
          <label style={labelSt}>カラー</label>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            {MEMO_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{width:'28px', height:'28px', borderRadius:'6px', background:c, cursor:'pointer',
                  border: color === c ? '2px solid #1a1d23' : '2px solid transparent',
                  boxShadow: color === c ? '0 0 0 1px #1a1d23' : 'none'}} />
            ))}
          </div>
        </div>

        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
          <button onClick={onClose}
            style={{...btnSt('#f4f5f7','#1a1d23','1px solid #d0d3db')}}>キャンセル</button>
          <button onClick={handleAdd} style={btnSt('#e8f0fe','#2c5fcc')}>作成</button>
        </div>
      </div>
    </div>
  );
}

// ── MEMO BOARD COLUMN ───────────────────────────────────────
function MemoBoardColumn({ wsId, memos, setMemos }) {
  const [showAdd, setShowAdd] = useState(false);
  const wsMemos = memos.filter(m => m.wsId === wsId);
  return (
    <>
      <div style={{flex:1, minWidth:'250px', borderRadius:'8px', padding:'13px',
        background: MEMO_COL.light + '99', border:'2px solid transparent'}}>
        <div style={{display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px'}}>
          <span style={{background: MEMO_COL.accent, color:'white', borderRadius:'20px',
            padding:'1px 9px', fontSize:'11px', fontWeight:'600'}}>{wsMemos.length}</span>
          <span style={{fontWeight:'600', fontSize:'13px', color:'#1a1d23'}}>{MEMO_COL.label}</span>
        </div>
        {wsMemos.map(memo => (
          <MemoCard key={memo.id} memo={memo}
            onChange={text => setMemos(ms => ms.map(m => m.id === memo.id ? {...m, text} : m))}
            onDelete={() => setMemos(ms => ms.filter(m => m.id !== memo.id))} />
        ))}
        <div onClick={() => setShowAdd(true)}
          style={{padding:'7px', borderRadius:'6px', textAlign:'center', cursor:'pointer',
            color:'#9095a0', fontSize:'12px', border:'1px dashed #d0d3db', marginTop:'4px'}}>
          + 追加
        </div>
      </div>
      {showAdd && (
        <AddMemoModal
          onClose={() => setShowAdd(false)}
          onAdd={memo => setMemos(ms => [...ms, { ...memo, wsId }])} />
      )}
    </>
  );
}

// ── localStorage helpers（コンポーネント外）──────────────────
const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
};

// ── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [view, setView]             = useState('board');
  const [workspaces, setWorkspaces] = useState(()=>lsGet('tm-workspaces', INIT_WORKSPACES));
  const [activeWsId, setActiveWsId] = useState('ws-work');
  const [pjJobs, setPjJobs]         = useState(()=>lsGet('tm-pjjobs',    INIT_PJJOBS));
  const [tasks, setTasks]           = useState(()=>lsGet('tm-tasks',      INIT_TASKS));
  const [memos, setMemos]           = useState(()=>lsGet('tm-memos',      INIT_MEMOS));
  const [selTask, setSelTask]        = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [addStatus, setAddStatus]   = useState('todo');
  const [weekOff, setWeekOff]       = useState(0);
  const [timeData, setTimeData]     = useState(()=>lsGet('tm-time',       {}));
  const dragIdRef         = useRef(null);
  const dragSubInfoRef    = useRef(null);
  const dragOverTaskIdRef = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showPjMgr, setShowPjMgr]   = useState(false);
  const [showWsMgr, setShowWsMgr]   = useState(false);
  const [apiKey, setApiKey]         = useState(()=>localStorage.getItem('tm-apikey')||'');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDone, setShowDone]     = useState(false);
  const [pendingIP, setPendingIP]     = useState(null); // {taskId, title}
  const [scheduleItems, setScheduleItems] = useState(null); // ScheduleModal用

  // ── Save to localStorage on change ──
  useEffect(()=>{ lsSet('tm-workspaces', workspaces); },[workspaces]);
  useEffect(()=>{ lsSet('tm-pjjobs',     pjJobs);     },[pjJobs]);
  useEffect(()=>{ lsSet('tm-tasks',      tasks);      },[tasks]);
  useEffect(()=>{ lsSet('tm-memos',      memos);      },[memos]);
  useEffect(()=>{ lsSet('tm-time',       timeData);   },[timeData]);
  useEffect(()=>{ localStorage.setItem('tm-apikey', apiKey); },[apiKey]);

  const weekDates = getWeekDates(weekOff);
  const activeWs  = workspaces.find(w=>w.id===activeWsId) || workspaces[0];
  const wsTasks   = tasks.filter(t=>t.wsId===activeWsId);

  const updateTask    = useCallback((id, changes) => {
    setTasks(ts=>ts.map(t=>t.id===id?{...t,...changes}:t));
    setSelTask(s=>s?.id===id?{...s,...changes}:s);
  },[]);
  const addSubtask    = (taskId,text)  => setTasks(ts=>ts.map(t=>t.id===taskId?{...t,subtasks:[...t.subtasks,{id:Date.now(),text,done:false,status:'todo'}]}:t));
  const toggleSubtask = (taskId,subId) => setTasks(ts=>ts.map(t=>{
    if(t.id!==taskId) return t;
    const newSubs = t.subtasks.map(s=>s.id===subId?{...s,done:!s.done}:s);
    const allDone = newSubs.length>0 && newSubs.every(s=>s.status==='done'||s.done);
    return {...t, subtasks:newSubs, status: allDone?'done':t.status};
  }));
  const removeSubtask      = (taskId,subId) => setTasks(ts=>ts.map(t=>t.id===taskId?{...t,subtasks:t.subtasks.filter(s=>s.id!==subId)}:t));
  const updateSubtaskStatus = (taskId,subId,newStatus,estimatedMinutes) => setTasks(ts=>ts.map(t=>{
    if(t.id!==taskId) return t;
    const newSubs = t.subtasks.map(s=>s.id===subId
      ? {...s, status:newStatus, ...(estimatedMinutes!=null?{estimatedMinutes}:{})}
      : s);
    const allDone = newSubs.length>0 && newSubs.every(s=>s.status==='done'||s.done);
    return {...t, subtasks:newSubs, status: allDone?'done':t.status};
  }));
  const deleteTask    = id => setTasks(ts=>ts.filter(t=>t.id!==id));
  const reorderTask   = (draggedId, targetId) => setTasks(ts=>{
    const arr = [...ts];
    const from = arr.findIndex(t=>t.id===draggedId);
    const to   = arr.findIndex(t=>t.id===targetId);
    if(from===-1||to===-1||from===to) return ts;
    const [item] = arr.splice(from,1);
    arr.splice(to,0,item);
    return arr;
  });
  const toggleExpand  = id => setExpandedTasks(prev=>{
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const setTime = (key,dk,val) => setTimeData(prev=>({...prev,[key]:{...(prev[key]||{}),[dk]:val}}));

  const stats = ALL_COLS.map(c=>({...c, count:wsTasks.filter(t=>t.status===c.key).length}));

  // ── スケジュールモーダルを開く ──────────────────────────────
  const openScheduleModal = (ipTasks) => {
    const ipSubtasks = wsTasks.flatMap(t =>
      t.subtasks
        .filter(s => s.status === 'inprogress')
        .map(s => ({title:`${t.title}：${s.text}`, estimatedMinutes: s.estimatedMinutes || 0}))
    );
    const allItems = [
      ...ipTasks.map(t => ({title: t.title, estimatedMinutes: t.estimatedMinutes || 0})),
      ...ipSubtasks,
    ];
    if(allItems.length === 0) return;
    setScheduleItems(allItems);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body,input,textarea,select,button{font-family:'Noto Sans JP',sans-serif;}
        input[type=number]::-webkit-inner-spin-button{opacity:1;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#d0d3db;border-radius:3px;}
      `}</style>

      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#eaecf0'}}>

        {/* ── SIDEBAR ── */}
        <div style={{width:'216px',background:'#18202f',display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'18px 18px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{color:'white',fontSize:'15px',fontWeight:'700',letterSpacing:'-0.01em'}}>TaskFlow</div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginTop:'2px'}}>プロジェクト管理</div>
          </div>

          {/* Workspaces */}
          <div style={{padding:'12px 10px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'0 6px',marginBottom:'6px'}}>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:'600',
                textTransform:'uppercase',letterSpacing:'0.06em'}}>ワークスペース</span>
              <button onClick={()=>setShowWsMgr(true)}
                style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',
                  cursor:'pointer',fontSize:'14px',lineHeight:1,padding:'0 2px'}}
                title="ワークスペース管理">⚙</button>
            </div>
            {workspaces.map(ws=>{
              const active = activeWsId===ws.id;
              const openCount = tasks.filter(t=>t.wsId===ws.id&&t.status!=='done').length;
              return (
                <div key={ws.id} onClick={()=>{setActiveWsId(ws.id);setView('board');}}
                  style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',
                    borderRadius:'6px',cursor:'pointer',marginBottom:'2px',
                    background:active?`${ws.color}28`:'transparent',
                    borderLeft:`3px solid ${active?ws.color:'transparent'}`,
                    transition:'all 0.12s'}}>
                  <span style={{fontSize:'15px'}}>{ws.icon}</span>
                  <span style={{fontSize:'13px',flex:1,fontWeight:active?'600':'400',
                    color:active?'white':'rgba(255,255,255,0.5)'}}>{ws.name}</span>
                  {openCount>0 && (
                    <span style={{fontSize:'10px',fontWeight:'600',
                      color:active?ws.color:'rgba(255,255,255,0.25)',
                      background:active?`${ws.color}22`:'rgba(255,255,255,0.06)',
                      padding:'1px 6px',borderRadius:'10px'}}>{openCount}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Nav */}
          <div style={{padding:'10px 10px 0',borderTop:'1px solid rgba(255,255,255,0.07)',marginTop:'10px'}}>
            <div style={{padding:'0 6px',marginBottom:'6px',
              color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:'600',
              textTransform:'uppercase',letterSpacing:'0.06em'}}>ツール</div>
            {[
              {key:'board', label:'📋 ボード'},
              {key:'aplex', label:'⏱ 稼働時間'},
            ].map(v=>(
              <div key={v.key} onClick={()=>setView(v.key)}
                style={{padding:'8px 10px',cursor:'pointer',fontSize:'13px',borderRadius:'6px',
                  marginBottom:'2px',
                  color:view===v.key?'white':'rgba(255,255,255,0.5)',
                  background:view===v.key?'rgba(255,255,255,0.08)':'transparent',
                  fontWeight:view===v.key?'600':'400',transition:'all 0.12s'}}>
                {v.label}
              </div>
            ))}
            <div onClick={()=>setShowPjMgr(true)}
              style={{padding:'8px 10px',cursor:'pointer',fontSize:'13px',borderRadius:'6px',
                marginBottom:'2px',color:'rgba(255,255,255,0.5)',transition:'all 0.12s'}}>
              🗂 PJ/JOB 管理
            </div>
          </div>

          {/* Week selector */}
          {view==='aplex'&&(
            <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',marginTop:'8px'}}>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:'600',
                textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'6px'}}>週</div>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <button onClick={()=>setWeekOff(w=>w-1)}
                  style={{background:'rgba(255,255,255,0.1)',border:'none',color:'white',
                    borderRadius:'4px',padding:'3px 8px',cursor:'pointer',fontSize:'12px'}}>◀</button>
                <span style={{color:'rgba(255,255,255,0.65)',fontSize:'11px',flex:1,textAlign:'center'}}>
                  {fmtMD(weekDates[0])}〜{fmtMD(weekDates[6])}
                </span>
                <button onClick={()=>setWeekOff(w=>w+1)}
                  style={{background:'rgba(255,255,255,0.1)',border:'none',color:'white',
                    borderRadius:'4px',padding:'3px 8px',cursor:'pointer',fontSize:'12px'}}>▶</button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',marginTop:'auto'}}>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:'600',
              textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'6px'}}>
              {activeWs?.name} の状況
            </div>
            {stats.map(s=>(
              <div key={s.key} style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'3px 0',fontSize:'12px'}}>
                <span style={{display:'flex',alignItems:'center',gap:'6px',color:'rgba(255,255,255,0.45)'}}>
                  <span style={{width:'5px',height:'5px',borderRadius:'50%',
                    background:s.accent,display:'inline-block'}}/>
                  {s.label}
                </span>
                <span style={{fontWeight:'600',color:'rgba(255,255,255,0.75)'}}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* API Key */}
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:'600',
                textTransform:'uppercase',letterSpacing:'0.06em'}}>Anthropic API Key</span>
              <button onClick={()=>setShowApiKey(v=>!v)}
                style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',
                  cursor:'pointer',fontSize:'10px'}}>
                {showApiKey?'隠す':'表示'}
              </button>
            </div>
            <input
              type={showApiKey?'text':'password'}
              value={apiKey}
              onChange={e=>setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{width:'100%',background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',
                padding:'5px 8px',color:'white',fontSize:'11px',
                outline:'none',fontFamily:'monospace',boxSizing:'border-box'}}
            />
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',marginTop:'4px'}}>
              AIサブタスク分解に使用します
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <div style={{background:'#ffffff',borderBottom:'1px solid #e8eaed',
            padding:'13px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              {activeWs&&<span style={{fontSize:'18px'}}>{activeWs.icon}</span>}
              <span style={{fontSize:'15px',fontWeight:'600',color:'#1a1d23'}}>
                {activeWs?.name}
                <span style={{color:'#9095a0',fontWeight:'400',marginLeft:'8px'}}>
                  — {{'board':'タスクボード','aplex':'稼働時間管理（Aplex 転記用）'}[view]}
                </span>
              </span>
            </div>
            {view==='board'&&(
              <button onClick={()=>{setAddStatus('todo');setShowAdd(true);}}
                style={btnSt('#e8f0fe','#2c5fcc')}>+ タスクを追加</button>
            )}
          </div>

          <div style={{flex:1,overflow:'auto',padding:'18px 22px'}}>
            {view==='board'&&(
              <div style={{display:'flex',gap:'12px',height:'100%',alignItems:'flex-start'}}>
                {COLS.map(col=>{
                  const colTasks = wsTasks.filter(t=>t.status===col.key);
                  // In Progress列に表示するサブタスク（全wsTasksから）
                  const ipSubGroups = col.key==='inprogress'
                    ? wsTasks
                        .map(t=>({task:t, subs:t.subtasks.filter(s=>s.status==='inprogress')}))
                        .filter(({subs})=>subs.length>0)
                    : [];

                  // In Progress 合計想定時間（メインタスク＋サブタスク）
                  const totalIPMins = col.key==='inprogress'
                    ? colTasks.reduce((sum,t)=>sum+(t.estimatedMinutes||0),0)
                      + wsTasks.flatMap(t=>t.subtasks.filter(s=>s.status==='inprogress'))
                               .reduce((sum,s)=>sum+(s.estimatedMinutes||0),0)
                    : 0;
                  const totalIPH = Math.floor(totalIPMins/60);
                  const totalIPM = totalIPMins%60;

                  return(
                    <div key={col.key}
                      style={{flex:1,minWidth:'250px',borderRadius:'8px',padding:'13px',
                        border:`2px ${dragOver===col.key?'dashed':'solid'} ${dragOver===col.key?col.accent:'transparent'}`,
                        background:col.light+'99',transition:'border 0.15s',
                        display:'flex',flexDirection:'column'}}
                      onDragOver={e=>{e.preventDefault();setDragOver(col.key);}}
                      onDrop={e=>{
                        e.preventDefault();
                        const currentDragId  = dragIdRef.current;
                        const currentDragSub = dragSubInfoRef.current;
                        if(currentDragId){
                          const dragged  = tasks.find(t=>t.id===currentDragId);
                          const isParent = dragged?.subtasks?.length>0;
                          if(!(col.key==='inprogress' && isParent)){
                            if(col.key==='inprogress'){
                              if(dragged?.status==='inprogress'){
                                // 同列内の並び替え → モーダルなし
                                const targetId = dragOverTaskIdRef.current;
                                if(targetId && targetId!==currentDragId) reorderTask(currentDragId, targetId);
                              } else {
                                // 他列からの移動 → 想定時間モーダル表示
                                setPendingIP({taskId:currentDragId, title:dragged?.title||''});
                              }
                            } else {
                              updateTask(currentDragId,{status:col.key});
                            }
                          }
                          dragIdRef.current      = null;
                          dragOverTaskIdRef.current = null;
                        }
                        if(currentDragSub){
                          if(col.key==='inprogress'){
                            const parentTask = tasks.find(t=>t.id===currentDragSub.taskId);
                            const sub = parentTask?.subtasks.find(s=>s.id===currentDragSub.subId);
                            setPendingIP({taskId:currentDragSub.taskId, subId:currentDragSub.subId, title:sub?.text||'', isSub:true});
                          } else if(col.key==='todo'){
                            updateSubtaskStatus(currentDragSub.taskId, currentDragSub.subId, col.key);
                          }
                          dragSubInfoRef.current = null;
                        }
                        setDragOver(null);
                      }}
                      onDragLeave={()=>setDragOver(null)}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'12px'}}>
                        <span style={{background:col.accent,color:'white',borderRadius:'20px',
                          padding:'1px 9px',fontSize:'11px',fontWeight:'600'}}>{colTasks.length}</span>
                        <span style={{fontWeight:'600',fontSize:'13px',color:'#1a1d23'}}>{col.label}</span>
                      </div>

                      {/* タスクカード */}
                      <div style={{flex:1}}>
                        {colTasks.map(task=>{
                          const isParent  = task.subtasks.length>0;
                          const todoSubs  = task.subtasks.filter(s=>(s.status||'todo')==='todo');
                          const hasChildren = col.key==='todo' && isParent && todoSubs.length>0;
                          const isExpanded  = expandedTasks.has(task.id);
                          const canDragToIP = !isParent;
                          return (
                            <div key={task.id} style={{marginBottom:'8px'}}
                              onDragEnter={()=>{ dragOverTaskIdRef.current=task.id; }}>
                              <TaskCard task={task} accent={col.accent} pjJobs={pjJobs}
                                expanded={hasChildren && isExpanded}
                                onToggleExpand={hasChildren ? ()=>toggleExpand(task.id) : undefined}
                                onClick={()=>setSelTask({...task})}
                                onDragStart={()=>{ if(canDragToIP||col.key!=='todo') dragIdRef.current=task.id; }}
                                onDragEnd={()=>{ dragIdRef.current=null; }}/>
                              {/* To Do展開：テキストのみ表示 */}
                              {hasChildren && isExpanded && (
                                <div style={{marginLeft:'14px', paddingLeft:'12px',
                                  borderLeft:`2px solid ${col.accent}50`,
                                  paddingTop:'4px', paddingBottom:'1px'}}>
                                  {todoSubs.map(sub=>(
                                    <SubtaskTextRow key={sub.id} subtask={sub}
                                      onDragStart={()=>{ dragSubInfoRef.current={taskId:task.id, subId:sub.id}; }}
                                      onDragEnd={()=>{ dragSubInfoRef.current=null; }}/>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* In Progress列：サブタスクカード表示 */}
                        {ipSubGroups.map(({task,subs})=>(
                          subs.map(sub=>(
                            <SubtaskInProgressCard key={sub.id} subtask={sub} parentTask={task}
                              onDragStart={()=>{ dragSubInfoRef.current={taskId:task.id, subId:sub.id}; }}
                              onDragEnd={()=>{ dragSubInfoRef.current=null; }}
                              onOpenParent={()=>setSelTask({...task})}/>
                          ))
                        ))}
                      </div>

                      {/* In Progress フッター：合計想定時間 + Google カレンダー */}
                      {col.key==='inprogress' && (
                        <div style={{marginTop:'12px',paddingTop:'12px',
                          borderTop:'1px solid rgba(186,117,23,0.25)'}}>
                          <div style={{fontSize:'12px',color:'#854F0B',fontWeight:'500',
                            marginBottom:'8px',textAlign:'center'}}>
                            合計想定時間：
                            {totalIPMins === 0
                              ? '未設定'
                              : `${totalIPH>0?`${totalIPH}時間`:''}${totalIPM>0?`${totalIPM}分`:''}`
                            }
                          </div>
                          {(() => {
                            const hasIPSubs = wsTasks.some(t=>t.subtasks.some(s=>s.status==='inprogress'));
                            const disabled  = colTasks.length===0 && !hasIPSubs;
                            return (
                          <button
                            onClick={()=>openScheduleModal(colTasks)}
                            disabled={disabled}
                            style={{...btnSt('#fff8ee','#854F0B','1px solid #e0a830'),
                              width:'100%',fontSize:'12px',
                              opacity:disabled?0.4:1,
                              cursor:disabled?'default':'pointer'}}>
                            📅 Googleカレンダーに追加
                          </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* メモ列 */}
                <MemoBoardColumn wsId={activeWsId} memos={memos} setMemos={setMemos}/>

                {/* 完了列（折りたたみ） */}
                {(() => {
                  const col = DONE_COL;
                  const colTasks = wsTasks.filter(t=>t.status===col.key);
                  return (
                    <div style={{minWidth: showDone ? '250px' : 'auto', flexShrink:0}}>
                      <button onClick={()=>setShowDone(v=>!v)}
                        style={{display:'flex',alignItems:'center',gap:'6px',
                          background: col.light+'99', border:'none',borderRadius:'8px',
                          padding:'8px 13px',cursor:'pointer',width:'100%',marginBottom: showDone?'8px':'0',
                          fontFamily:'inherit'}}>
                        <span style={{background:col.accent,color:'white',borderRadius:'20px',
                          padding:'1px 9px',fontSize:'11px',fontWeight:'600'}}>{colTasks.length}</span>
                        <span style={{fontWeight:'600',fontSize:'13px',color:'#1a1d23'}}>{col.label}</span>
                        <span style={{fontSize:'10px',color:'#9095a0',marginLeft:'auto'}}>
                          {showDone?'▲':'▼'}
                        </span>
                      </button>
                      {showDone&&(
                        <div style={{borderRadius:'8px',padding:'13px',
                          border:`2px ${dragOver===col.key?'dashed':'solid'} ${dragOver===col.key?col.accent:'transparent'}`,
                          background:col.light+'99',transition:'border 0.15s',minWidth:'250px'}}
                          onDragOver={e=>{e.preventDefault();setDragOver(col.key);}}
                          onDrop={e=>{e.preventDefault();if(dragIdRef.current){updateTask(dragIdRef.current,{status:col.key});dragIdRef.current=null;}setDragOver(null);}}
                          onDragLeave={()=>setDragOver(null)}>
                          {colTasks.map(task=>(
                            <TaskCard key={task.id} task={task} accent={col.accent} pjJobs={pjJobs}
                              onClick={()=>setSelTask({...task})}
                              onDragStart={()=>{ dragIdRef.current=task.id; }}
                              onDragEnd={()=>{ dragIdRef.current=null; }}/>
                          ))}
                          <div onClick={()=>{setAddStatus(col.key);setShowAdd(true);}}
                            style={{padding:'7px',borderRadius:'6px',textAlign:'center',cursor:'pointer',
                              color:'#9095a0',fontSize:'12px',border:'1px dashed #d0d3db',marginTop:'4px'}}>
                            + 追加
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {view==='aplex'&&(
              <AplexView tasks={wsTasks} pjJobs={pjJobs} weekDates={weekDates} timeData={timeData} setTime={setTime}/>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {selTask&&(
        <TaskModal task={selTask} tasks={tasks} pjJobs={pjJobs} apiKey={apiKey}
          updateTask={updateTask} addSubtask={addSubtask}
          toggleSubtask={toggleSubtask} removeSubtask={removeSubtask}
          deleteTask={deleteTask} onClose={()=>setSelTask(null)}/>
      )}
      {showAdd&&(
        <AddTaskModal initStatus={addStatus} pjJobs={pjJobs} wsId={activeWsId}
          onClose={()=>setShowAdd(false)}
          onAdd={task=>setTasks(ts=>[...ts,{...task,wsId:activeWsId}])}/>
      )}
      {showPjMgr&&(
        <PjJobModal pjJobs={pjJobs} setPjJobs={setPjJobs} onClose={()=>setShowPjMgr(false)}/>
      )}
      {showWsMgr&&(
        <WorkspaceModal
          workspaces={workspaces}
          setWorkspaces={ws=>{ setWorkspaces(ws); if(!ws.find(w=>w.id===activeWsId)) setActiveWsId(ws[0]?.id); }}
          onClose={()=>setShowWsMgr(false)}/>
      )}
      {scheduleItems&&(
        <ScheduleModal rawItems={scheduleItems} onClose={()=>setScheduleItems(null)}/>
      )}
      {pendingIP&&(
        <EstimatedTimeModal
          taskTitle={pendingIP.title}
          onConfirm={mins=>{
            if(pendingIP.isSub){
              updateSubtaskStatus(pendingIP.taskId, pendingIP.subId, 'inprogress', mins);
            } else {
              updateTask(pendingIP.taskId, {status:'inprogress', estimatedMinutes:mins});
            }
            setPendingIP(null);
          }}
          onCancel={()=>setPendingIP(null)}
        />
      )}
    </>
  );
}
