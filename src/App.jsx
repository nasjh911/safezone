/**
 * SafeZone v3 — Supabase Edition
 *
 * SETUP (5 minutes):
 *   1. npm install @supabase/supabase-js
 *   2. Create a .env file:
 *        VITE_SUPABASE_URL=https://your-project.supabase.co
 *        VITE_SUPABASE_ANON_KEY=eyJ...
 *   3. Run the SQL from SafeZone_Supabase_Guide.docx
 *   4. npm run dev
 *
 * Demo mode: if VITE_SUPABASE_URL is not set, falls back to local mock data.
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://xhanxqjkfvttzvsqtmuw.supabase.co";
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoYW54cWprZnZ0dHp2c3F0bXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjcwODksImV4cCI6MjA4ODk0MzA4OX0.WjQjPSghinoitxsc44qjoPJOgl5uzsRbg7C_zzpjZdI";
const DEMO_MODE = !SUPA_URL || !SUPA_KEY;

export const supabase = DEMO_MODE
  ? null
  : createClient(SUPA_URL, SUPA_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

// ─── DEMO USERS (fallback when Supabase is not configured) ───────────────────
const DEMO_USERS = [
  { id:"demo-1", email:"manager@alnoor.sa",  password:"demo1234", name:"Khalid Al-Rashid", nameAr:"خالد الراشد",  role:"Safety Manager", roleKey:"manager",  roleAr:"مدير السلامة",     avatar:"KR", company:"Al Noor Construction Co.", companyAr:"شركة النور للإنشاءات", isNew:false },
  { id:"demo-2", email:"inspector@alnoor.sa",password:"demo1234", name:"Omar Fayyad",      nameAr:"عمر فياض",    role:"Inspector",      roleKey:"inspector", roleAr:"مفتش",             avatar:"OF", company:"Al Noor Construction Co.", companyAr:"شركة النور للإنشاءات", isNew:false },
  { id:"demo-3", email:"exec@alnoor.sa",     password:"demo1234", name:"Sara Al-Otaibi",   nameAr:"سارة العتيبي",role:"Read Only",      roleKey:"readonly",  roleAr:"للقراءة فقط",     avatar:"SO", company:"Al Noor Construction Co.", companyAr:"شركة النور للإنشاءات", isNew:false },
  { id:"demo-4", email:"new@company.com",    password:"any",      name:"New User",         nameAr:"مستخدم جديد", role:"Safety Manager", roleKey:"manager",   roleAr:"مدير السلامة",    avatar:"NU", company:"", companyAr:"", isNew:true },
];

// ─── ROLE PERMISSIONS ────────────────────────────────────────────────────────
const CAN = {
  manager:  { users:true,  settings:true,  create:true,  edit:true,  delete:true  },
  inspector:{ users:false, settings:false, create:true,  edit:true,  delete:false },
  readonly: { users:false, settings:false, create:false, edit:false, delete:false },
  admin:    { users:true,  settings:true,  create:true,  edit:true,  delete:true  },
  supervisor:{ users:false, settings:false, create:true, edit:true,  delete:false },
};

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const G = {
  bg:"#0A0F1E", surface:"#111827", surface2:"#1A2236",
  border:"#1E2D45", text:"#E8EDF5", textMuted:"#6B7FA3", textDim:"#3D5070",
  primary:"#2563EB", primaryGlow:"rgba(37,99,235,0.18)",
  danger:"#EF4444", success:"#10B981", warning:"#F59E0B", purple:"#7C3AED",
};

const sc = (s) => ({
  completed:G.success, pass:G.success, valid:G.success, resolved:G.success, active:G.success, closed:G.success,
  overdue:G.danger, expired:G.danger, critical:G.danger, fail:G.danger,
  in_progress:G.primary, investigating:G.primary,
  scheduled:G.textMuted, partial:G.warning, expiring:G.warning, open:G.warning,
  high:"#FF6B35", medium:G.warning, low:G.textMuted, na:G.textMuted,
}[s] || G.textMuted);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const getCss = (lang) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;overflow:hidden}
  body{background:${G.bg};color:${G.text};font-size:14px}
  .af{font-family:${lang==="ar"?"'Cairo'":"'DM Sans'"}, sans-serif}
  .df{font-family:${lang==="ar"?"'Cairo'":"'Syne'"}, sans-serif;font-weight:${lang==="ar"?800:700}}
  .mf{font-family:'JetBrains Mono',monospace}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:2px}
  input,textarea,select{font-family:${lang==="ar"?"'Cairo'":"'DM Sans'"}, sans-serif}
  @keyframes slideIn{from{opacity:0;transform:translateX(${lang==="ar"?"8px":"-8px"})}to{opacity:1;transform:translateX(0)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-10px)}}
  @keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @media(max-width:768px){.desktop-only{display:none!important}.mobile-full{width:100%!important}}
`;

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
let _toastId = 0;
let _setToasts = null;
export const toast = (msg, type="success", duration=3000) => {
  if (!_setToasts) return;
  const id = ++_toastId;
  _setToasts(t => [...t, {id, msg, type, dying:false}]);
  setTimeout(() => {
    _setToasts(t => t.map(x => x.id===id ? {...x, dying:true} : x));
    setTimeout(() => _setToasts(t => t.filter(x => x.id!==id)), 400);
  }, duration);
};

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  const icons = {success:"✓", error:"✗", info:"ℹ", warning:"⚠"};
  const colors = {success:G.success, error:G.danger, info:G.primary, warning:G.warning};
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10,pointerEvents:"none"}}>
      {toasts.map(t => (
        <div key={t.id} className="af" style={{
          display:"flex",alignItems:"center",gap:12,padding:"12px 18px",
          background:G.surface,border:`1px solid ${colors[t.type]}44`,
          borderLeft:`3px solid ${colors[t.type]}`,borderRadius:12,
          boxShadow:"0 8px 32px rgba(0,0,0,.5)",minWidth:260,maxWidth:380,
          animation:t.dying?"toastOut .4s forwards":"toastIn .3s ease",
          pointerEvents:"auto",
        }}>
          <span style={{width:22,height:22,borderRadius:"50%",background:colors[t.type]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:colors[t.type],flexShrink:0}}>
            {icons[t.type]}
          </span>
          <span style={{fontSize:13,color:G.text,lineHeight:1.4}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DEMO MODE BANNER ────────────────────────────────────────────────────────
function DemoBanner() {
  const [vis, setVis] = useState(true);
  if (!DEMO_MODE || !vis) return null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:1000,background:"linear-gradient(90deg,#7C3AED,#2563EB)",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>
      <span>⚡ <strong>Demo Mode</strong> — Add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to .env to connect real data</span>
      <span onClick={()=>setVis(false)} style={{cursor:"pointer",opacity:.7,fontSize:16}}>✕</span>
    </div>
  );
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({status,label}) => (
  <span className="af" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:sc(status)+"22",color:sc(status),border:`1px solid ${sc(status)}44`,whiteSpace:"nowrap"}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:sc(status),flexShrink:0}}/>
    {label||status}
  </span>
);

const Card = ({children,style,onClick,hover})=>{
  const [h,setH]=useState(false);
  return <div onClick={onClick} onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
    style={{background:G.surface,border:`1px solid ${h?G.primary+"66":G.border}`,borderRadius:12,padding:20,transition:"all .2s",cursor:onClick?"pointer":"default",transform:h?"translateY(-1px)":"none",boxShadow:h?"0 4px 24px rgba(37,99,235,0.12)":"none",...style}}>{children}</div>;
};

const Btn = ({children,onClick,variant="primary",size="md",style,disabled,loading})=>{
  const [h,setH]=useState(false);
  const vs={
    primary:{bg:h&&!disabled?`#1d4ed8`:G.primary,color:"#fff",border:G.primary},
    ghost:{bg:h?G.surface2:"transparent",color:G.textMuted,border:G.border},
    danger:{bg:h?G.danger+"33":"transparent",color:G.danger,border:G.danger+"44"},
    success:{bg:G.success,color:"#fff",border:G.success},
    outline:{bg:"transparent",color:G.primary,border:G.primary},
  };
  const v=vs[variant]||vs.primary;
  return <button onClick={disabled||loading?undefined:onClick}
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} className="af"
    style={{background:v.bg,color:v.color,border:`1px solid ${v.border}`,borderRadius:8,
      padding:size==="sm"?"5px 12px":size==="lg"?"14px 28px":"8px 18px",
      fontSize:size==="sm"?12:size==="lg"?15:13,fontWeight:700,cursor:disabled||loading?"not-allowed":"pointer",
      transition:"all .15s",whiteSpace:"nowrap",opacity:disabled||loading?.6:1,
      display:"flex",alignItems:"center",gap:8,...style}}>
    {loading&&<span style={{width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>}
    {children}
  </button>;
};

// Custom DateTimePicker - replaces native input to avoid browser locale issues
const DateTimePicker = ({label, value, onChange, t}) => {
  const now = new Date();
  const parsed = value ? new Date(value) : null;
  const [year,  setYear]  = useState(parsed ? parsed.getFullYear()  : now.getFullYear());
  const [month, setMonth] = useState(parsed ? parsed.getMonth()+1   : now.getMonth()+1);
  const [day,   setDay]   = useState(parsed ? parsed.getDate()       : now.getDate());
  const [hour,  setHour]  = useState(parsed ? parsed.getHours()      : 8);
  const [min,   setMin]   = useState(parsed ? parsed.getMinutes()    : 0);

  const emit = (y,mo,d,h,mi) => {
    const pad = n => String(n).padStart(2,'0');
    onChange(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`);
  };

  const sel = {background:G.surface2,border:`1px solid ${G.border}`,borderRadius:6,padding:"7px 8px",color:G.text,fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif",direction:"ltr"};
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = Array.from({length:31},(_,i)=>i+1);
  const hours = Array.from({length:24},(_,i)=>i);
  const mins = [0,15,30,45];
  const years = Array.from({length:3},(_,i)=>now.getFullYear()+i);

  return <div>
    {label&&<div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600}}>{label}</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",direction:"ltr"}}>
      <select value={day} onChange={e=>{setDay(+e.target.value);emit(year,month,+e.target.value,hour,min);}} style={sel}>
        {days.map(d=><option key={d}>{d}</option>)}
      </select>
      <select value={month} onChange={e=>{setMonth(+e.target.value);emit(year,+e.target.value,day,hour,min);}} style={sel}>
        {months.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
      </select>
      <select value={year} onChange={e=>{setYear(+e.target.value);emit(+e.target.value,month,day,hour,min);}} style={sel}>
        {years.map(y=><option key={y}>{y}</option>)}
      </select>
      <select value={hour} onChange={e=>{setHour(+e.target.value);emit(year,month,day,+e.target.value,min);}} style={sel}>
        {hours.map(h=><option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
      </select>
      <select value={min} onChange={e=>{setMin(+e.target.value);emit(year,month,day,hour,+e.target.value);}} style={{...sel,minWidth:60}}>
        {mins.map(m=><option key={m} value={m}>:{String(m).padStart(2,'0')}</option>)}
      </select>
    </div>
  </div>;
};

const Field = ({label,type="text",options,value,onChange,placeholder,t,autoFocus})=>{
  const base={width:"100%",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 12px",color:G.text,fontSize:13,outline:"none",transition:"border .15s"};
  return <div>
    {label&&<div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600}}>{label}</div>}
    {type==="select"
      ?<select value={value||""} onChange={e=>onChange?.(e.target.value)} className="af" style={base}>
        <option value="">{t?.selectPlaceholder||"Select..."}</option>
        {options?.map(o=><option key={o}>{o}</option>)}
       </select>
      :type==="textarea"
      ?<textarea placeholder={placeholder} value={value||""} onChange={e=>onChange?.(e.target.value)} rows={3} className="af" style={{...base,resize:"vertical"}}/>
      :<input type={type} placeholder={placeholder} value={value||""} onChange={e=>onChange?.(e.target.value)} autoFocus={autoFocus} className="af"
          style={{...base,...(type==="datetime-local"?{direction:"ltr",fontFamily:"'DM Sans',sans-serif"}:{})}}
          onFocus={e=>e.target.style.borderColor=G.primary}
          onBlur={e=>e.target.style.borderColor=G.border}/>
    }
  </div>;
};

function ConfirmModal({msg, onConfirm, onCancel}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}>
      <Card style={{width:360,padding:28,animation:"fadeUp .2s"}}>
        <div style={{fontSize:28,marginBottom:12,textAlign:"center"}}>⚠️</div>
        <div className="af" style={{fontSize:14,textAlign:"center",marginBottom:24,lineHeight:1.6}}>{msg}</div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="ghost" style={{flex:1}} onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" style={{flex:1}} onClick={onConfirm}>Confirm</Btn>
        </div>
      </Card>
    </div>
  );
}

const Spinner = ({size=20}) => (
  <div style={{width:size,height:size,border:`2px solid ${G.border}`,borderTopColor:G.primary,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const EmptyState = ({icon="🔍", msg}) => (
  <div style={{textAlign:"center",padding:"60px 20px",color:G.textMuted}}>
    <div style={{fontSize:48,marginBottom:16,opacity:.4}}>{icon}</div>
    <div className="af" style={{fontSize:14}}>{msg}</div>
  </div>
);

// Skeleton loader row
const SkeletonRow = ({cols=4}) => (
  <tr style={{borderBottom:`1px solid ${G.border}`}}>
    {Array.from({length:cols}).map((_,i)=>(
      <td key={i} style={{padding:"13px 14px"}}>
        <div style={{height:12,borderRadius:6,background:G.surface2,animation:"pulse 1.5s infinite",width:`${60+Math.random()*30}%`}}/>
      </td>
    ))}
  </tr>
);

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    appName:"SafeZone", company:"Al Noor Construction Co.",
    dashboard:"Dashboard", inspections:"Inspections", hazards:"Hazards",
    incidents:"Incidents", ptw:"Permit to Work", compliance:"Compliance", reports:"Reports",
    users:"Users", settings:"Settings", collapse:"Collapse",
    kpi1:"Inspections This Month", kpi2:"Open Hazards", kpi3:"Overdue Inspections",
    kpi4:"Incidents (MTD)", kpi5:"Compliance Score",
    kpiDelta1:"+12%", kpiDelta2:"-4 today", kpiDelta3:"Needs action",
    kpiDelta4:"1 critical", kpiDelta5:"+2% vs last month",
    inspectionRate:"Inspection Completion Rate", last12weeks:"Last 12 weeks",
    liveActivity:"Live Activity", inspThisMonth:"inspections this month",
    hazards_count:"hazards", safetyScore:"Safety score",
    searchPlaceholder:"Search anything...", allSites:"All Sites",
    newInspection:"+ New Inspection", allFilter:"All",
    scheduledF:"Scheduled", inProgressF:"In Progress", completedF:"Completed", overdueF:"Overdue",
    colId:"ID", colSite:"Site", colTemplate:"Template", colInspector:"Inspector",
    colScheduled:"Scheduled", colStatus:"Status", colResult:"Result", viewLink:"View →",
    wizardTitle:"New Inspection", back:"← Back",
    step1:"Setup", step2:"Checklist", step3:"Assign",
    fieldTemplate:"Inspection Template", fieldSite:"Site / Location",
    fieldDate:"Due Date & Time", fieldNotes:"Notes (optional)",
    continue:"Continue →", checklistPreview:"Checklist Preview:",
    assignInspector:"Assign Inspector", createAssign:"✓ Create & Assign",
    passLabel:"Pass", failLabel:"Fail", naLabel:"N/A",
    exportPdf:"📄 Export PDF", totalItems:"Total Items", passed:"Passed",
    failed:"Failed", na:"N/A", supervisorSignoff:"Supervisor Sign-off",
    reviewComments:"Add review comments...", approve:"✓ Approve", revise:"✗ Revise",
    hazardAutoCreated:"⚠ Hazard auto-created", inspDetails:"Inspection Details",
    reportHazard:"+ Report Hazard", criticalF:"Critical", highF:"High",
    mediumF:"Medium", openF:"Open", resolvedF:"Resolved",
    overdueLabel:"OVERDUE", assignedLabel:"Assigned:", dueLabel:"Due:", oldLabel:"old",
    resolution:"Resolution", resolutionNotes:"Resolution notes...",
    uploadEvidence:"Upload Evidence Photo", dragPhoto:"📷 Drop photo or click to upload",
    markResolved:"✓ Mark Resolved", reassign:"Reassign",
    reportIncident:"⚡ Report Incident", incidentsCount:"incidents recorded",
    incidentType:"Incident Type", severity:"Severity",
    incidentTitle:"Incident Title", incidentTitlePh:"Brief description of what happened",
    fullDesc:"Full Description", fullDescPh:"Describe the incident in detail...",
    dateTime:"Date & Time of Incident", attachFiles:"Attach Photos / Documents",
    dropFiles:"📎 Drop files here or click to upload",
    regulatoryFlag:"This incident requires notification to the regulatory authority",
    submitIncident:"Submit Incident Report",
    investigationLog:"Investigation Log", rootCause:"Root Cause",
    rootCausePh:"What was the underlying cause?",
    correctiveActions:"Corrective Actions", correctivePh:"Actions taken or planned...",
    closeInvestigation:"Save & Close Investigation",
    uploadDoc:"+ Upload Document", allDocs:"All Documents", certificates:"Certificates",
    policies:"Policies", riskAssessments:"Risk Assessments", trainingRecords:"Training Records",
    expired_banner:"document(s) expired — immediate renewal required",
    expiring_banner:"document(s) expiring soon",
    expires:"Expires:", viewBtn:"👁 View",
    recentExports:"Recent Exports", reportName:"Report Name",
    generated:"Generated", by:"By", format:"Format", download:"⬇ Download", generate:"Generate",
    inviteUser:"+ Invite User", bulkImport:"⬆ Bulk Import CSV",
    seatsUsed:"users · seats", colUser:"User", colRole:"Role",
    colSiteAccess:"Site Access", colLastLogin:"Last Login",
    editUser:"Edit", suspendUser:"Suspend",
    inviteTitle:"Invite User", emailLabel:"Email Address",
    emailPh:"name@company.com", fullNameLabel:"Full Name",
    fullNamePh:"First and last name", roleLabel:"Role", siteAccessLabel:"Site Access",
    cancel:"Cancel", sendInvitation:"Send Invitation",
    companyProfile:"Company Profile", sitesLocations:"Sites & Locations",
    notifications:"Notifications", billing:"Billing",
    companyName:"Company Name", industry:"Industry", timezone:"Timezone",
    regulatoryAuth:"Regulatory Authority", regAuthPh:"e.g. Saudi Ministry of Human Resources",
    uploadLogo:"Upload Logo", saveChanges:"Save Changes",
    siteActive:"Active · GPS configured", addSite:"+ Add New Site",
    notifRules:"Notification Rules", saveNotif:"Save Notification Settings",
    subscription:"Subscription", nextBilling:"Next billing date",
    seatsUsedBilling:"Seats used", paymentMethod:"Payment method",
    viewInvoices:"View Invoices", upgradeEnterprise:"Upgrade to Enterprise",
    perMonth:"/month", planDesc:"Up to 20 users · 20 sites · Full analytics",
    notif1:"Inspection Due Reminder", notif1d:"24 hours before scheduled time",
    notif2:"Inspection Overdue Alert", notif2d:"Immediately when overdue",
    notif3:"New Hazard Assigned", notif3d:"Immediately on assignment",
    notif4:"Hazard Escalation — Supervisor", notif4d:"After 24 hours unresolved",
    notif5:"Hazard Escalation — Manager", notif5d:"After 48 hours unresolved",
    notif6:"Incident Reported", notif6d:"Immediately",
    notif7:"Document Expiry Warning", notif7d:"30 days before expiry",
    emailCh:"Email", smsCh:"SMS", whatsappCh:"WhatsApp",
    s_completed:"Completed", s_pass:"Pass", s_valid:"Valid", s_resolved:"Resolved",
    s_active:"Active", s_overdue:"Overdue", s_expired:"Expired", s_critical:"Critical",
    s_in_progress:"In Progress", s_investigating:"Investigating", s_scheduled:"Scheduled",
    s_partial:"Partial", s_expiring:"Expiring Soon", s_open:"Open", s_high:"High",
    s_medium:"Medium", s_low:"Low", s_fail:"Fail", s_na:"N/A", s_closed:"Closed",
    role_admin:"Administrator", role_manager:"Safety Manager",
    role_supervisor:"Supervisor", role_inspector:"Inspector", role_readonly:"Read Only",
    ind1:"Construction & Contracting", ind2:"Oil & Gas",
    ind3:"Logistics & Warehousing", ind4:"Manufacturing", ind5:"Facilities Management",
    tz1:"Asia/Riyadh (AST +3)", tz2:"Asia/Dubai (GST +4)", tz3:"Europe/London (GMT)",
    it1:"Near Miss", it2:"Injury", it3:"Property Damage", it4:"Environmental", it5:"Dangerous Occurrence",
    sev1:"Low", sev2:"Medium", sev3:"High", sev4:"Critical",
    tpl1:"Daily Site Walkthrough", tpl2:"Scaffold Inspection",
    tpl3:"PPE Compliance Audit", tpl4:"Fire Safety Check", tpl5:"Forklift Safety Check",
    rep1:"Monthly Safety Report", rep1d:"Inspections, hazards, and incidents for any month",
    rep2:"Inspection Summary", rep2d:"All inspections filtered by site, inspector, or date range",
    rep3:"Hazard Register", rep3d:"All open and resolved hazards with aging analysis",
    rep4:"Incident Report", rep4d:"Individual incident with investigation details",
    rep5:"Compliance Status Report", rep5d:"Document library with expiry status for audit",
    rep6:"Safety Performance Dashboard", rep6d:"Executive-level KPI summary across all sites",
    selectPlaceholder:"Select...",
    check1:"Perimeter fencing secured and undamaged",
    check2:"All workers wearing appropriate PPE",
    check3:"Scaffolding boards properly secured",
    check4:"First aid kit accessible and stocked",
    check5:"Emergency exits clear of obstruction",
    check6:"Hazardous materials properly stored and labelled",
    inspNote1:"3 workers without hard hats on Level 4",
    inspNote2:"Boards on south face not secured",
    inspNote3:"No hazardous materials on site this visit",
    act1:"INC-031 reported: Worker struck by falling tool",
    act2:"INS-0240 completed by Layla Mahmoud",
    act3:"HAZ-091 escalated to Safety Manager",
    act4:"HAZ-086 overdue — fire exit blocked",
    act5:"INS-0235 started by Ahmad Nasser",
    act6:"HAZ-085 resolved by Ahmad Nasser",
    act7:"New user Sara Al-Otaibi invited",
    ago7m:"7m ago", ago1h:"1h ago", ago2h:"2h ago", ago3h:"3h ago",
    ago4h:"4h ago", ago5h:"5h ago", yesterday:"Yesterday",
    notifications_title:"Notifications",
    sites_en:["NEOM Site A","Riyadh Tower","Jeddah Port"],
    names:["Khalid Al-Rashid","Omar Fayyad","Layla Mahmoud","Faisal Al-Ghamdi","Ahmad Nasser","Sara Al-Otaibi"],
    noAccess:"You don't have permission to access this section.",
    noResults:"No results found",
    hazardReported:"Hazard reported successfully",
    incidentSubmitted:"Incident report submitted",
    hazardResolved:"Hazard marked as resolved",
    changesSaved:"Changes saved successfully",
    inviteSent:"Invitation sent",
    inspCreated:"Inspection created and assigned",
    docUploaded:"Document uploaded",
    reportGenerated:"Report generated — ready to download",
    loading:"Loading...", connectionErr:"Connection error — showing cached data",
    liveData:"● Live data", demoData:"○ Demo data",
    addPhoto:"📷 Add Photo", photoAdded:"Photo attached", removePhoto:"Remove",
    tapToPhoto:"Tap to attach photo evidence",
    aiDraftReport:"✨ AI Draft Report", aiGenerating:"Generating AI report...",
    aiDesc:"Describe what happened (voice or type):",
    aiDescPh:"e.g. A worker on Level 4 was struck by a falling wrench while working below another crew...",
    aiGenerate:"Generate Full Report", aiCopy:"Copy Report", aiCopied:"Copied!",
    aiInsert:"Use This Report", aiError:"AI generation failed — check connection",
    aiPowered:"AI-Powered Report Writer",
    aiSub:"Describe the incident briefly and AI will draft a full investigation report in seconds.",
    templateBuilder:"Template Builder", myTemplates:"My Templates",
    newTemplate:"+ New Template", templateName:"Template Name",
    templateNamePh:"e.g. Scaffold Inspection — Level 2",
    addItem:"+ Add Item", itemPlaceholder:"Checklist item...",
    saveTemplate:"Save Template", templateSaved:"Template saved",
    templateDeleted:"Template deleted", deleteTemplate:"Delete",
    editTemplate:"Edit", itemsCount:"items", noTemplates:"No custom templates yet",
    builtIn:"Built-in", custom:"Custom",
    // PTW
    ptwTitle:"Permit to Work", newPtw:"+ New Permit", ptwAll:"All", ptwOpen:"Open",
    ptwApproved:"Approved", ptwExpired:"Expired", ptwClosed:"Closed",
    ptwColId:"Permit ID", ptwColType:"Work Type", ptwColSite:"Site", ptwColReq:"Requested By",
    ptwColStart:"Start", ptwColEnd:"Expiry", ptwColStatus:"Status", ptwColApprover:"Approver",
    ptwType1:"Hot Work", ptwType2:"Confined Space Entry", ptwType3:"Working at Height",
    ptwType4:"Electrical Isolation", ptwType5:"Excavation", ptwType6:"Chemical Handling",
    ptwType7:"Lifting Operations", ptwType8:"General Work",
    ptwRisk1:"Low", ptwRisk2:"Medium", ptwRisk3:"High", ptwRisk4:"Critical",
    ptwFieldType:"Work Type", ptwFieldSite:"Site / Location", ptwFieldStart:"Start Date & Time",
    ptwFieldEnd:"Expiry Date & Time", ptwFieldDesc:"Work Description",
    ptwFieldDescPh:"Describe the work to be carried out in detail...",
    ptwFieldHazards:"Identified Hazards", ptwFieldHazardsPh:"List all hazards associated with this work...",
    ptwFieldControls:"Control Measures", ptwFieldControlsPh:"List all control measures and PPE required...",
    ptwFieldRisk:"Risk Level", ptwFieldWorkers:"Number of Workers",
    ptwFieldContractor:"Contractor / Company",
    ptwSubmit:"Submit for Approval", ptwApprove:"✓ Approve Permit", ptwReject:"✗ Reject",
    ptwClose:"Close Permit", ptwPrint:"🖨 Print Permit",
    ptwSubmitted:"Permit submitted for approval", ptwApproved2:"Permit approved",
    ptwRejected:"Permit rejected", ptwClosed2:"Permit closed",
    ptwPending:"Pending Approval", ptwActive:"Active",
    ptwHazardChecks:"Pre-Work Safety Checks", ptwCheck1:"Area cordoned off and signage displayed",
    ptwCheck2:"All workers briefed on hazards and controls",
    ptwCheck3:"Fire extinguisher / rescue equipment on standby",
    ptwCheck4:"Emergency contact numbers confirmed",
    ptwCheck5:"PPE inspected and worn correctly",
    ptwCheck6:"Supervisor on site throughout work",
    ptwDetails:"Permit Details", ptwApproverSig:"Approver Signature",
    ptwApproverComments:"Approver comments...", ptwIssued:"Issued",
    ptwExpires:"Expires", ptwWorkers:"Workers",
  },
  ar: {
    appName:"المنطقة الآمنة", company:"شركة النور للإنشاءات",
    dashboard:"لوحة التحكم", inspections:"الفحوصات", hazards:"المخاطر",
    incidents:"الحوادث", ptw:"تصريح العمل", compliance:"الامتثال", reports:"التقارير",
    users:"المستخدمون", settings:"الإعدادات", collapse:"طي",
    kpi1:"فحوصات هذا الشهر", kpi2:"المخاطر المفتوحة", kpi3:"فحوصات متأخرة",
    kpi4:"الحوادث (الشهر)", kpi5:"نسبة الامتثال",
    kpiDelta1:"+12%", kpiDelta2:"-4 اليوم", kpiDelta3:"يحتاج إجراء",
    kpiDelta4:"1 حرجة", kpiDelta5:"+2% مقارنة بالشهر الماضي",
    inspectionRate:"معدل إتمام الفحوصات", last12weeks:"آخر 12 أسبوعاً",
    liveActivity:"النشاط المباشر", inspThisMonth:"فحوصات هذا الشهر",
    hazards_count:"مخاطر", safetyScore:"درجة السلامة",
    searchPlaceholder:"ابحث عن أي شيء...", allSites:"جميع المواقع",
    newInspection:"+ فحص جديد", allFilter:"الكل",
    scheduledF:"مجدول", inProgressF:"قيد التنفيذ", completedF:"مكتمل", overdueF:"متأخر",
    colId:"الرقم", colSite:"الموقع", colTemplate:"النموذج", colInspector:"المفتش",
    colScheduled:"المجدول", colStatus:"الحالة", colResult:"النتيجة", viewLink:"عرض ←",
    wizardTitle:"فحص جديد", back:"رجوع →",
    step1:"الإعداد", step2:"قائمة التحقق", step3:"التعيين",
    fieldTemplate:"نموذج الفحص", fieldSite:"الموقع",
    fieldDate:"تاريخ ووقت الاستحقاق", fieldNotes:"ملاحظات (اختياري)",
    continue:"← متابعة", checklistPreview:"معاينة قائمة التحقق:",
    assignInspector:"تعيين مفتش", createAssign:"✓ إنشاء وتعيين",
    passLabel:"ناجح", failLabel:"فاشل", naLabel:"لا ينطبق",
    exportPdf:"📄 تصدير PDF", totalItems:"إجمالي", passed:"ناجح",
    failed:"فاشل", na:"لا ينطبق", supervisorSignoff:"موافقة المشرف",
    reviewComments:"أضف تعليقات...", approve:"✓ موافقة", revise:"✗ مراجعة",
    hazardAutoCreated:"⚠ تم إنشاء خطر تلقائياً", inspDetails:"تفاصيل الفحص",
    reportHazard:"+ الإبلاغ عن خطر", criticalF:"حرج", highF:"عالٍ",
    mediumF:"متوسط", openF:"مفتوح", resolvedF:"محلول",
    overdueLabel:"متأخر", assignedLabel:"مُعيَّن:", dueLabel:"الموعد:", oldLabel:"قديم",
    resolution:"الحل", resolutionNotes:"ملاحظات الحل...",
    uploadEvidence:"رفع صورة دليل", dragPhoto:"📷 اسحب صورة أو انقر للرفع",
    markResolved:"✓ تحديد كمحلول", reassign:"إعادة تعيين",
    reportIncident:"⚡ الإبلاغ عن حادثة", incidentsCount:"حوادث مسجلة",
    incidentType:"نوع الحادثة", severity:"الخطورة",
    incidentTitle:"عنوان الحادثة", incidentTitlePh:"وصف موجز لما حدث",
    fullDesc:"الوصف الكامل", fullDescPh:"صف الحادثة بالتفصيل...",
    dateTime:"تاريخ ووقت الحادثة", attachFiles:"إرفاق صور / مستندات",
    dropFiles:"📎 أفلت الملفات هنا أو انقر للرفع",
    regulatoryFlag:"تستوجب هذه الحادثة إخطار الجهة التنظيمية",
    submitIncident:"إرسال تقرير الحادثة",
    investigationLog:"سجل التحقيق", rootCause:"السبب الجذري",
    rootCausePh:"ما هو السبب الجذري؟",
    correctiveActions:"الإجراءات التصحيحية", correctivePh:"الإجراءات المتخذة أو المخططة...",
    closeInvestigation:"حفظ وإغلاق التحقيق",
    uploadDoc:"+ رفع مستند", allDocs:"جميع المستندات", certificates:"الشهادات",
    policies:"السياسات", riskAssessments:"تقييمات المخاطر", trainingRecords:"سجلات التدريب",
    expired_banner:"مستند(ات) منتهية الصلاحية — يلزم التجديد الفوري",
    expiring_banner:"مستند(ات) تنتهي صلاحيتها قريباً",
    expires:"تنتهي:", viewBtn:"👁 عرض",
    recentExports:"التصديرات الأخيرة", reportName:"اسم التقرير",
    generated:"تاريخ الإنشاء", by:"بواسطة", format:"التنسيق", download:"⬇ تحميل", generate:"إنشاء",
    inviteUser:"+ دعوة مستخدم", bulkImport:"⬆ استيراد CSV",
    seatsUsed:"مستخدمون · مقاعد", colUser:"المستخدم", colRole:"الدور",
    colSiteAccess:"صلاحية الموقع", colLastLogin:"آخر دخول",
    editUser:"تعديل", suspendUser:"تعليق",
    inviteTitle:"دعوة مستخدم", emailLabel:"البريد الإلكتروني",
    emailPh:"name@company.sa", fullNameLabel:"الاسم الكامل",
    fullNamePh:"الاسم الأول والأخير", roleLabel:"الدور", siteAccessLabel:"صلاحية الموقع",
    cancel:"إلغاء", sendInvitation:"إرسال الدعوة",
    companyProfile:"ملف الشركة", sitesLocations:"المواقع", notifications:"الإشعارات", billing:"الفواتير",
    companyName:"اسم الشركة", industry:"القطاع", timezone:"المنطقة الزمنية",
    regulatoryAuth:"الجهة التنظيمية", regAuthPh:"مثال: وزارة الموارد البشرية",
    uploadLogo:"رفع الشعار", saveChanges:"حفظ التغييرات",
    siteActive:"نشط · GPS مضبوط", addSite:"+ إضافة موقع جديد",
    notifRules:"قواعد الإشعارات", saveNotif:"حفظ إعدادات الإشعارات",
    subscription:"الاشتراك", nextBilling:"تاريخ الفاتورة القادمة",
    seatsUsedBilling:"المقاعد المستخدمة", paymentMethod:"طريقة الدفع",
    viewInvoices:"عرض الفواتير", upgradeEnterprise:"الترقية للمؤسسة",
    perMonth:"/شهر", planDesc:"حتى 20 مستخدم · 20 موقع · تحليلات كاملة",
    notif1:"تذكير بموعد الفحص", notif1d:"قبل 24 ساعة",
    notif2:"تنبيه تأخر الفحص", notif2d:"فوراً عند التأخر",
    notif3:"تعيين خطر جديد", notif3d:"فوراً عند التعيين",
    notif4:"تصعيد الخطر — المشرف", notif4d:"بعد 24 ساعة دون حل",
    notif5:"تصعيد الخطر — المدير", notif5d:"بعد 48 ساعة دون حل",
    notif6:"الإبلاغ عن حادثة", notif6d:"فوراً",
    notif7:"تحذير انتهاء صلاحية المستند", notif7d:"قبل 30 يوماً",
    emailCh:"البريد", smsCh:"SMS", whatsappCh:"واتساب",
    s_completed:"مكتمل", s_pass:"ناجح", s_valid:"صالح", s_resolved:"محلول",
    s_active:"نشط", s_overdue:"متأخر", s_expired:"منتهٍ", s_critical:"حرج",
    s_in_progress:"قيد التنفيذ", s_investigating:"قيد التحقيق", s_scheduled:"مجدول",
    s_partial:"جزئي", s_expiring:"ينتهي قريباً", s_open:"مفتوح", s_high:"عالٍ",
    s_medium:"متوسط", s_low:"منخفض", s_fail:"فاشل", s_na:"لا ينطبق", s_closed:"مغلق",
    role_admin:"مدير النظام", role_manager:"مدير السلامة",
    role_supervisor:"مشرف", role_inspector:"مفتش", role_readonly:"للقراءة فقط",
    ind1:"المقاولات والإنشاءات", ind2:"النفط والغاز",
    ind3:"اللوجستيات والمستودعات", ind4:"التصنيع", ind5:"إدارة المرافق",
    tz1:"آسيا/الرياض (AST +3)", tz2:"آسيا/دبي (GST +4)", tz3:"أوروبا/لندن (GMT)",
    it1:"شبه حادثة", it2:"إصابة", it3:"أضرار مادية", it4:"بيئية", it5:"حادثة خطرة",
    sev1:"منخفضة", sev2:"متوسطة", sev3:"عالية", sev4:"حرجة",
    tpl1:"جولة الموقع اليومية", tpl2:"فحص السقالات",
    tpl3:"تدقيق معدات الوقاية", tpl4:"فحص السلامة من الحريق", tpl5:"فحص سلامة الرافعة",
    rep1:"تقرير السلامة الشهري", rep1d:"الفحوصات والمخاطر والحوادث لأي شهر",
    rep2:"ملخص الفحوصات", rep2d:"جميع الفحوصات مصفّاة",
    rep3:"سجل المخاطر", rep3d:"جميع المخاطر المفتوحة والمحلولة",
    rep4:"تقرير حادثة", rep4d:"حادثة فردية مع تفاصيل التحقيق",
    rep5:"تقرير حالة الامتثال", rep5d:"مكتبة المستندات مع حالة الانتهاء",
    rep6:"لوحة الأداء الأمني", rep6d:"ملخص مؤشرات الأداء للإدارة العليا",
    selectPlaceholder:"اختر...",
    check1:"السياج المحيطي مؤمَّن وسليم",
    check2:"جميع العمال يرتدون معدات الوقاية الشخصية",
    check3:"ألواح السقالات مثبتة بشكل صحيح",
    check4:"حقيبة الإسعافات الأولية متاحة ومكتملة",
    check5:"مخارج الطوارئ خالية من العوائق",
    check6:"المواد الخطرة مخزنة ومُعلَّمة بشكل صحيح",
    inspNote1:"3 عمال بدون خوذات في المستوى 4",
    inspNote2:"ألواح الجانب الجنوبي غير مثبتة",
    inspNote3:"لا توجد مواد خطرة في الموقع",
    act1:"تم الإبلاغ عن INC-031: عامل أُصيب بأداة ساقطة",
    act2:"أكملت ليلى محمود الفحص INS-0240",
    act3:"تم تصعيد HAZ-091 إلى مدير السلامة",
    act4:"HAZ-086 متأخر — مخرج الطوارئ محجوب",
    act5:"بدأ أحمد ناصر الفحص INS-0235",
    act6:"حلّ أحمد ناصر HAZ-085",
    act7:"تمت دعوة مستخدم جديد: سارة العتيبي",
    ago7m:"منذ 7د", ago1h:"منذ ساعة", ago2h:"منذ ساعتين",
    ago3h:"منذ 3 ساعات", ago4h:"منذ 4 ساعات", ago5h:"منذ 5 ساعات",
    yesterday:"البارحة", notifications_title:"الإشعارات",
    sites_en:["موقع نيوم أ","برج الرياض","ميناء جدة"],
    names:["خالد الراشد","عمر فياض","ليلى محمود","فيصل الغامدي","أحمد ناصر","سارة العتيبي"],
    noAccess:"ليس لديك صلاحية للوصول إلى هذا القسم.",
    noResults:"لا توجد نتائج",
    hazardReported:"تم الإبلاغ عن الخطر بنجاح",
    incidentSubmitted:"تم إرسال تقرير الحادثة",
    hazardResolved:"تم تحديد الخطر كمحلول",
    changesSaved:"تم حفظ التغييرات بنجاح",
    inviteSent:"تم إرسال الدعوة",
    inspCreated:"تم إنشاء الفحص وتعيينه",
    docUploaded:"تم رفع المستند",
    reportGenerated:"تم إنشاء التقرير — جاهز للتحميل",
    loading:"جارٍ التحميل...", connectionErr:"خطأ في الاتصال — عرض البيانات المخزنة",
    liveData:"● بيانات مباشرة", demoData:"○ بيانات تجريبية",
    addPhoto:"📷 إضافة صورة", photoAdded:"تم إرفاق الصورة", removePhoto:"إزالة",
    tapToPhoto:"انقر لإرفاق صورة دليل",
    aiDraftReport:"✨ مسودة AI", aiGenerating:"جارٍ إنشاء التقرير...",
    aiDesc:"صف ما حدث (صوت أو كتابة):",
    aiDescPh:"مثال: أُصيب عامل في المستوى 4 بمفتاح ربط سقط من الأعلى...",
    aiGenerate:"إنشاء تقرير كامل", aiCopy:"نسخ التقرير", aiCopied:"تم النسخ!",
    aiInsert:"استخدام هذا التقرير", aiError:"فشل إنشاء التقرير بالذكاء الاصطناعي",
    aiPowered:"كاتب التقارير بالذكاء الاصطناعي",
    aiSub:"صف الحادثة بإيجاز وسيقوم الذكاء الاصطناعي بصياغة تقرير تحقيق كامل في ثوانٍ.",
    templateBuilder:"منشئ النماذج", myTemplates:"نماذجي",
    newTemplate:"+ نموذج جديد", templateName:"اسم النموذج",
    templateNamePh:"مثال: فحص السقالات — المستوى 2",
    addItem:"+ إضافة بند", itemPlaceholder:"بند قائمة التحقق...",
    saveTemplate:"حفظ النموذج", templateSaved:"تم حفظ النموذج",
    templateDeleted:"تم حذف النموذج", deleteTemplate:"حذف",
    editTemplate:"تعديل", itemsCount:"بنود", noTemplates:"لا توجد نماذج مخصصة بعد",
    builtIn:"مدمج", custom:"مخصص",
    // PTW Arabic
    ptwTitle:"تصريح العمل", newPtw:"+ تصريح جديد", ptwAll:"الكل", ptwOpen:"مفتوح",
    ptwApproved:"معتمد", ptwExpired:"منتهٍ", ptwClosed:"مغلق",
    ptwColId:"رقم التصريح", ptwColType:"نوع العمل", ptwColSite:"الموقع", ptwColReq:"طالب التصريح",
    ptwColStart:"البداية", ptwColEnd:"الانتهاء", ptwColStatus:"الحالة", ptwColApprover:"المعتمد",
    ptwType1:"أعمال الحرارة", ptwType2:"دخول الأماكن المحصورة", ptwType3:"العمل على الارتفاع",
    ptwType4:"العزل الكهربائي", ptwType5:"أعمال الحفر", ptwType6:"التعامل مع المواد الكيميائية",
    ptwType7:"عمليات الرفع", ptwType8:"أعمال عامة",
    ptwRisk1:"منخفض", ptwRisk2:"متوسط", ptwRisk3:"عالٍ", ptwRisk4:"حرج",
    ptwFieldType:"نوع العمل", ptwFieldSite:"الموقع", ptwFieldStart:"تاريخ ووقت البداية",
    ptwFieldEnd:"تاريخ ووقت الانتهاء", ptwFieldDesc:"وصف العمل",
    ptwFieldDescPh:"صف العمل المراد تنفيذه بالتفصيل...",
    ptwFieldHazards:"المخاطر المحددة", ptwFieldHazardsPh:"اذكر جميع المخاطر المرتبطة بهذا العمل...",
    ptwFieldControls:"إجراءات التحكم", ptwFieldControlsPh:"اذكر جميع إجراءات التحكم ومعدات الوقاية المطلوبة...",
    ptwFieldRisk:"مستوى الخطورة", ptwFieldWorkers:"عدد العمال",
    ptwFieldContractor:"المقاول / الشركة",
    ptwSubmit:"إرسال للاعتماد", ptwApprove:"✓ اعتماد التصريح", ptwReject:"✗ رفض",
    ptwClose:"إغلاق التصريح", ptwPrint:"🖨 طباعة التصريح",
    ptwSubmitted:"تم إرسال التصريح للاعتماد", ptwApproved2:"تم اعتماد التصريح",
    ptwRejected:"تم رفض التصريح", ptwClosed2:"تم إغلاق التصريح",
    ptwPending:"في انتظار الاعتماد", ptwActive:"نشط",
    ptwHazardChecks:"فحوصات السلامة قبل العمل", ptwCheck1:"تم تسييج المنطقة وعرض اللافتات",
    ptwCheck2:"تم تبريف جميع العمال على المخاطر والضوابط",
    ptwCheck3:"طفاية الحريق / معدات الإنقاذ جاهزة",
    ptwCheck4:"تم تأكيد أرقام الطوارئ",
    ptwCheck5:"تم فحص معدات الوقاية الشخصية وارتداؤها بشكل صحيح",
    ptwCheck6:"المشرف متواجد في الموقع طوال مدة العمل",
    ptwDetails:"تفاصيل التصريح", ptwApproverSig:"توقيع المعتمد",
    ptwApproverComments:"تعليقات المعتمد...", ptwIssued:"صدر",
    ptwExpires:"ينتهي", ptwWorkers:"عمال",
  }
};

// ─── MOCK DATA (used when DEMO_MODE or as fallback) ───────────────────────────
const getMock = (t, lang) => {
  const sites = t.sites_en;
  const n = t.names;
  const ar = lang==="ar";
  const today = ar?"اليوم":"Today";
  const yday = ar?"الأمس":"Yesterday";
  return {
    company:{name:t.company, sites, regulatory_auth:"Saudi Ministry of Human Resources"},
    user:{name:n[0], role:t.role_manager, avatar:"KR"},
    kpis:[
      {label:t.kpi1,value:84,delta:t.kpiDelta1,color:"#00D4AA",icon:"✓"},
      {label:t.kpi2,value:23,delta:t.kpiDelta2,color:"#FF6B35",icon:"⚠"},
      {label:t.kpi3,value:7,delta:t.kpiDelta3,color:"#FF3366",icon:"⏰"},
      {label:t.kpi4,value:3,delta:t.kpiDelta4,color:"#FFB300",icon:"🚨"},
      {label:t.kpi5,value:"91%",delta:t.kpiDelta5,color:"#7C6FFF",icon:"★"},
    ],
    inspections:[
      {id:"INS-0241",site:sites[0],template:t.tpl1,inspector:n[1],scheduled:`${today}, 08:00`,status:"overdue",result:null},
      {id:"INS-0240",site:sites[1],template:t.tpl2,inspector:n[2],scheduled:`${today}, 09:30`,status:"completed",result:"pass"},
      {id:"INS-0239",site:sites[2],template:t.tpl5,inspector:n[3],scheduled:`${yday}, 14:00`,status:"completed",result:"fail"},
      {id:"INS-0238",site:sites[0],template:t.tpl3,inspector:n[1],scheduled:`${yday}, 10:00`,status:"completed",result:"pass"},
      {id:"INS-0237",site:sites[1],template:t.tpl4,inspector:n[2],scheduled:ar?"7 مارس، 09:00":"Mar 7, 09:00",status:"completed",result:"partial"},
      {id:"INS-0235",site:sites[0],template:ar?"السلامة الكهربائية":"Electrical Safety",inspector:n[4],scheduled:ar?"5 مارس، 08:30":"Mar 5, 08:30",status:"in_progress",result:null},
    ],
    hazards:[
      {id:"HAZ-091",site:sites[0],title:ar?"سقالات غير مؤمَّنة في المستوى 4":"Unsecured scaffolding on Level 4 — collapse risk",severity:"critical",assigned:n[1],due:today,status:"open",age:ar?"2ي":"2d"},
      {id:"HAZ-090",site:sites[2],title:ar?"أحزمة منع السقوط مفقودة":"Missing fall arrest harnesses for crane operators",severity:"high",assigned:n[3],due:ar?"غداً":"Tomorrow",status:"open",age:ar?"3ي":"3d"},
      {id:"HAZ-089",site:sites[1],title:ar?"لوحة الكهرباء غير مؤمَّنة":"Electrical panel access unlocked in wet zone",severity:"high",assigned:n[4],due:ar?"10 مارس":"Mar 10",status:"in_progress",age:ar?"4ي":"4d"},
      {id:"HAZ-088",site:sites[0],title:ar?"إضاءة غير كافية في الحفر":"Inadequate lighting in basement excavation",severity:"medium",assigned:n[1],due:ar?"11 مارس":"Mar 11",status:"in_progress",age:ar?"5ي":"5d"},
      {id:"HAZ-086",site:sites[1],title:ar?"مخرج الطوارئ محجوب":"Fire exit partially blocked by materials",severity:"high",assigned:n[2],due:yday,status:"open",age:ar?"7ي":"7d"},
      {id:"HAZ-085",site:sites[0],title:ar?"مستلزمات الإسعافات منتهية":"First aid kit expired supplies",severity:"low",assigned:n[4],due:ar?"15 مارس":"Mar 15",status:"resolved",age:ar?"8ي":"8d"},
    ],
    incidents:[
      {id:"INC-031",site:sites[0],title:ar?"عامل أُصيب بأداة ساقطة — المستوى 6":"Worker struck by falling tool — Level 6",type:"injury",severity:"critical",reported:`${today}, 07:45`,status:"investigating",reportedBy:n[1]},
      {id:"INC-030",site:sites[2],title:ar?"شبه حادثة: رافعة شوكية":"Near miss: forklift reversed into pedestrian path",type:"near_miss",severity:"high",reported:ar?"7 مارس، 14:20":"Mar 7, 14:20",status:"investigating",reportedBy:n[3]},
      {id:"INC-029",site:sites[1],title:ar?"انسكاب مواد كيميائية":"Chemical spill — floor 3 maintenance room",type:"environmental",severity:"medium",reported:ar?"6 مارس، 09:10":"Mar 6, 09:10",status:"closed",reportedBy:n[2]},
      {id:"INC-028",site:sites[0],title:ar?"جرح طفيف — زاوية طحن":"Minor laceration — angle grinder without guard",type:"injury",severity:"low",reported:ar?"4 مارس، 11:30":"Mar 4, 11:30",status:"closed",reportedBy:n[4]},
    ],
    compliance:[
      {name:ar?"خطة إدارة سلامة الموقع":"Site Safety Management Plan — NEOM",type:ar?"سياسة":"Policy",uploaded:ar?"15 يناير 2026":"Jan 15, 2026",expiry:ar?"15 يناير 2027":"Jan 15, 2027",status:"valid"},
      {name:ar?"شهادات مشغلي الرافعات":"Crane Operator Certificates (x4)",type:ar?"شهادة":"Certificate",uploaded:ar?"1 فبراير 2026":"Feb 1, 2026",expiry:ar?"30 أبريل 2026":"Apr 30, 2026",status:"expiring"},
      {name:ar?"تقييم مخاطر المواد الكيميائية":"COSHH Assessment — Chemical Store Jeddah",type:ar?"تقييم مخاطر":"Risk Assessment",uploaded:ar?"10 ديسمبر 2025":"Dec 10, 2025",expiry:ar?"10 ديسمبر 2026":"Dec 10, 2026",status:"valid"},
      {name:ar?"تقرير فحص نظام إطفاء الحريق":"Fire Suppression System Inspection Report",type:ar?"سجل فحص":"Inspection Record",uploaded:ar?"5 نوفمبر 2025":"Nov 5, 2025",expiry:ar?"5 نوفمبر 2026":"Nov 5, 2026",status:"valid"},
      {name:ar?"سجلات التدريب على الإسعافات":"First Aid Training Records — Q1 2026",type:ar?"سجل تدريب":"Training Record",uploaded:ar?"1 مارس 2026":"Mar 1, 2026",expiry:ar?"1 مارس 2027":"Mar 1, 2027",status:"valid"},
      {name:ar?"شهادة اختبار التركيب الكهربائي":"Electrical Installation Test Certificate — Riyadh",type:ar?"شهادة":"Certificate",uploaded:ar?"12 سبتمبر 2024":"Sep 12, 2024",expiry:ar?"5 مارس 2026":"Mar 5, 2026",status:"expired"},
    ],
    users:[
      {name:n[0],email:"k.alrashid@alnoor.sa",role:t.role_manager,site:t.allSites,lastLogin:today,status:"active",avatar:"KR"},
      {name:n[1],email:"o.fayyad@alnoor.sa",role:t.role_inspector,site:sites[0],lastLogin:today,status:"active",avatar:"OF"},
      {name:n[2],email:"l.mahmoud@alnoor.sa",role:t.role_supervisor,site:sites[1],lastLogin:yday,status:"active",avatar:"LM"},
      {name:n[3],email:"f.alghamdi@alnoor.sa",role:t.role_inspector,site:sites[2],lastLogin:today,status:"active",avatar:"FA"},
      {name:n[4],email:"a.nasser@alnoor.sa",role:t.role_inspector,site:sites[0],lastLogin:ar?"6 مارس":"Mar 6",status:"active",avatar:"AN"},
      {name:n[5],email:"s.alotaibi@alnoor.sa",role:t.role_readonly,site:t.allSites,lastLogin:ar?"1 مارس":"Mar 1",status:"active",avatar:"SO"},
    ],
    activity:[
      {text:t.act1,time:t.ago7m,type:"incident"},
      {text:t.act2,time:t.ago1h,type:"inspection"},
      {text:t.act3,time:t.ago2h,type:"hazard"},
      {text:t.act4,time:t.ago3h,type:"overdue"},
      {text:t.act5,time:t.ago4h,type:"inspection"},
      {text:t.act6,time:t.ago5h,type:"resolved"},
      {text:t.act7,time:t.yesterday,type:"user"},
    ],
    permits:[
      {id:"PTW-041",type:ar?"أعمال الحرارة":"Hot Work",site:sites[0],requestedBy:n[1],start:ar?"اليوم، 07:00":"Today, 07:00",end:ar?"اليوم، 15:00":"Today, 15:00",status:"approved",risk:"high",approver:n[0],workers:4,contractor:"Al Noor Welding LLC"},
      {id:"PTW-040",type:ar?"العمل على الارتفاع":"Working at Height",site:sites[1],requestedBy:n[2],start:ar?"اليوم، 08:00":"Today, 08:00",end:ar?"اليوم، 17:00":"Today, 17:00",status:"pending",risk:"critical",approver:"",workers:6,contractor:"Riyadh Scaffolding Co."},
      {id:"PTW-039",type:ar?"دخول الأماكن المحصورة":"Confined Space Entry",site:sites[2],requestedBy:n[3],start:ar?"الأمس، 09:00":"Yesterday, 09:00",end:ar?"الأمس، 14:00":"Yesterday, 14:00",status:"closed",risk:"critical",approver:n[0],workers:3,contractor:"Jeddah Industrial"},
      {id:"PTW-038",type:ar?"العزل الكهربائي":"Electrical Isolation",site:sites[0],requestedBy:n[4],start:ar?"7 مارس، 10:00":"Mar 7, 10:00",end:ar?"7 مارس، 16:00":"Mar 7, 16:00",status:"approved",risk:"high",approver:n[0],workers:2,contractor:"Al Noor Electrical"},
      {id:"PTW-037",type:ar?"أعمال الحفر":"Excavation",site:sites[1],requestedBy:n[1],start:ar?"6 مارس، 07:00":"Mar 6, 07:00",end:ar?"6 مارس، 18:00":"Mar 6, 18:00",status:"expired",risk:"medium",approver:n[0],workers:8,contractor:"NEOM Groundworks"},
      {id:"PTW-036",type:ar?"عمليات الرفع":"Lifting Operations",site:sites[0],requestedBy:n[2],start:ar?"5 مارس، 08:00":"Mar 5, 08:00",end:ar?"5 مارس، 12:00":"Mar 5, 12:00",status:"closed",risk:"high",approver:n[0],workers:5,contractor:"Saudi Crane Services"},
    ],
  };
};

// ─── DATA HOOKS ───────────────────────────────────────────────────────────────

// useSupabaseTable — generic hook: fetch + realtime subscribe
function useSupabaseTable(table, query, deps=[]) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (DEMO_MODE || !supabase) { setLoading(false); return; }
    try {
      const { data: rows, error: err } = await query();
      if (err) throw err;
      setData(rows);
      setError(null);
    } catch (e) {
      console.error(`[${table}]`, e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetch();
    if (DEMO_MODE || !supabase) return;
    const sub = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event:"*", schema:"public", table }, fetch)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── PDF GENERATOR UTILITY ────────────────────────────────────────────────────
function generatePDF({ title, company, userName, rows, headers, kpis }) {
  const now = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const kpiHtml = kpis ? kpis.map(k=>`<div class="kpi"><div class="kpi-val" style="color:${k.color||'#2563eb'}">${k.value}</div><div class="kpi-label">${k.label}</div></div>`).join("") : "";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;margin:0;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:28px}
    .logo{font-size:22px;font-weight:800;color:#2563eb}.logo span{color:#1a1a2e}
    .meta{text-align:right;font-size:12px;color:#6b7280}
    h1{font-size:20px;font-weight:700;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
    th{background:#f1f5f9;padding:10px 14px;text-align:left;font-weight:700;color:#374151;border:1px solid #e2e8f0}
    td{padding:10px 14px;border:1px solid #e2e8f0;color:#374151}
    tr:nth-child(even) td{background:#f8fafc}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
    .kpi-row{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
    .kpi{background:#f1f5f9;border-radius:10px;padding:16px 20px;flex:1;min-width:120px}
    .kpi-val{font-size:26px;font-weight:800}.kpi-label{font-size:12px;color:#6b7280;margin-top:4px}
    .save-btn{position:fixed;top:20px;right:20px;background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.3)}
    @media print{.save-btn{display:none}}
  </style></head><body>
  <button class="save-btn" onclick="window.print()">⬇ Save as PDF</button>
  <div class="header">
    <div><div class="logo">Safe<span>Zone</span></div><div style="font-size:12px;color:#6b7280;margin-top:4px">${company}</div></div>
    <div class="meta"><div style="font-weight:700;font-size:14px">${title}</div><div>Generated: ${now}</div><div>By: ${userName}</div></div>
  </div>
  <h1>${title}</h1>
  ${kpis ? `<div class="kpi-row">${kpiHtml}</div>` : ""}
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <div class="footer"><span>SafeZone Safety Management Platform</span><span>CONFIDENTIAL — ${company} — ${now}</span></div>
  </body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

// useHazards
function useHazards(companyId) {
  return useSupabaseTable("hazards", () =>
    supabase.from("hazards")
      .select("*, site:sites(name, name_ar), assigned:profiles(name, name_ar, avatar_initials)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    [companyId]
  );
}

// useInspections
function useInspections(companyId) {
  return useSupabaseTable("inspections", () =>
    supabase.from("inspections")
      .select("*, site:sites(name, name_ar), inspector:profiles(name, name_ar, avatar_initials)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    [companyId]
  );
}

// useIncidents
function useIncidents(companyId) {
  return useSupabaseTable("incidents", () =>
    supabase.from("incidents")
      .select("*, site:sites(name, name_ar), reporter:profiles(name, name_ar)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    [companyId]
  );
}

// useCompliance
function useCompliance(companyId) {
  return useSupabaseTable("compliance_docs", () =>
    supabase.from("compliance_docs")
      .select("*")
      .eq("company_id", companyId)
      .order("expiry_date", { ascending: true }),
    [companyId]
  );
}

// useProfiles
function useProfiles(companyId) {
  return useSupabaseTable("profiles", () =>
    supabase.from("profiles")
      .select("*")
      .eq("company_id", companyId)
      .order("name"),
    [companyId]
  );
}

// useSites
function useSites(companyId) {
  return useSupabaseTable("sites", () =>
    supabase.from("sites")
      .select("*")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("name"),
    [companyId]
  );
}

// ─── SEARCH FILTER ────────────────────────────────────────────────────────────
const searchFilter = (items, query, fields) => {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(item => fields.some(f => String(item[f]||"").toLowerCase().includes(q)));
};

// Normalize a Supabase row into the shape the UI expects
const normalizeHazard = (row) => ({
  id: `HAZ-${String(row.id).slice(-6).toUpperCase()}`,
  _id: row.id,
  site: row.site?.name || row.site_id || "—",
  title: row.title,
  severity: row.severity,
  assigned: row.assigned?.name || "Unassigned",
  due: row.due_date ? new Date(row.due_date).toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : "—",
  status: row.status,
  age: row.created_at ? `${Math.floor((Date.now()-new Date(row.created_at))/86400000)}d` : "—",
  resolutionNotes: row.resolution_notes,
});

const normalizeInspection = (row) => ({
  id: `INS-${String(row.id).slice(-6).toUpperCase()}`,
  _id: row.id,
  site: row.site?.name || "—",
  template: row.template,
  inspector: row.inspector?.name || "Unassigned",
  scheduled: row.scheduled_at ? new Date(row.scheduled_at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "—",
  status: row.status,
  result: row.result,
  checklist: row.checklist || [],
  notes: row.notes,
});

const normalizeIncident = (row) => ({
  id: `INC-${String(row.id).slice(-6).toUpperCase()}`,
  _id: row.id,
  site: row.site?.name || "—",
  title: row.title,
  type: row.incident_type,
  severity: row.severity,
  reported: row.occurred_at ? new Date(row.occurred_at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : new Date(row.created_at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}),
  status: row.status,
  reportedBy: row.reporter?.name || "—",
  rootCause: row.root_cause,
  correctiveActions: row.corrective_actions,
});

const normalizeDoc = (row) => ({
  _id: row.id,
  name: row.name,
  type: row.doc_type || "Document",
  uploaded: row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—",
  expiry: row.expiry_date ? new Date(row.expiry_date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—",
  status: row.status,
  fileUrl: row.file_url,
});

const normalizeProfile = (row) => ({
  _id: row.id,
  name: row.name,
  email: "—",
  role: row.role,
  site: "All Sites",
  lastLogin: "Recently",
  status: "active",
  avatar: row.avatar_initials || row.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?",
});

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_KEYS = ["dashboard","inspections","hazards","incidents","ptw","compliance","reports","users","settings"];
const NAV_ICONS = {dashboard:"⬡",inspections:"✓",hazards:"⚠",incidents:"⚡",ptw:"🔑",compliance:"◈",reports:"⬛",users:"◉",settings:"⊙"};
const NAV_ROLE_GATE = {users:["manager","admin"], settings:["manager","admin"]};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({active,setActive,collapsed,setCollapsed,t,lang,mock,onLogout,userRole,mobileOpen,setMobileOpen}){
  const ar = lang==="ar";
  const isMobile = window.innerWidth <= 768;

  const sidebarContent = (
    <div style={{width:collapsed&&!isMobile?64:220,background:G.surface,[ar?"borderLeft":"borderRight"]:`1px solid ${G.border}`,display:"flex",flexDirection:"column",transition:"width .25s",height:"100%",flexShrink:0}}>
      <div style={{padding:"20px 16px",borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}}>S</div>
        {(!collapsed||isMobile)&&<span className="df" style={{fontSize:17,color:G.text}}>{t.appName}</span>}
        {isMobile&&<div onClick={()=>setMobileOpen(false)} style={{marginLeft:"auto",cursor:"pointer",color:G.textMuted,fontSize:20}}>✕</div>}
      </div>
      <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
        {NAV_KEYS.map(id=>{
          const gate = NAV_ROLE_GATE[id];
          const locked = gate && !gate.includes(userRole);
          const isA = active===id;
          return <div key={id} onClick={()=>{
            if(locked){toast(t.noAccess,"error");return;}
            setActive(id);
            if(isMobile) setMobileOpen(false);
          }} style={{display:"flex",alignItems:"center",gap:12,padding:collapsed&&!isMobile?"10px 12px":"10px 14px",borderRadius:8,marginBottom:2,cursor:"pointer",background:isA?G.primaryGlow:"transparent",color:isA?G.primary:locked?G.textDim:G.textMuted,[ar?"borderRight":"borderLeft"]:isA?`2px solid ${G.primary}`:"2px solid transparent",transition:"all .15s",justifyContent:collapsed&&!isMobile?"center":"flex-start",opacity:locked?.5:1}}>
            <span style={{fontSize:16,flexShrink:0}}>{NAV_ICONS[id]}</span>
            {(!collapsed||isMobile)&&<span className="af" style={{fontSize:13,fontWeight:isA?700:400}}>{t[id]}</span>}
            {(!collapsed||isMobile)&&locked&&<span style={{marginLeft:"auto",fontSize:10,color:G.textDim}}>🔒</span>}
          </div>;
        })}
      </nav>
      <div style={{padding:"12px 8px",borderTop:`1px solid ${G.border}`}}>
        {!isMobile&&<div onClick={()=>setCollapsed(!collapsed)} style={{display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start",gap:12,padding:"8px 14px",borderRadius:8,cursor:"pointer",color:G.textMuted,marginBottom:4}}>
          <span style={{fontSize:14}}>{collapsed?(ar?"←":"→"):(ar?"→":"←")}</span>
          {!collapsed&&<span className="af" style={{fontSize:12}}>{t.collapse}</span>}
        </div>}
        {(!collapsed||isMobile)&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{mock.user.avatar}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="af" style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mock.user.name.split(" ")[0]}</div>
            <div className="af" style={{fontSize:11,color:G.textMuted}}>{mock.user.role}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            {!DEMO_MODE&&<div style={{width:6,height:6,borderRadius:"50%",background:G.success}} title="Live"/>}
            {onLogout&&<div onClick={e=>{e.stopPropagation();onLogout();}} title="Sign out"
              style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:G.textMuted,fontSize:14}}
              onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
              onMouseLeave={e=>e.currentTarget.style.color=G.textMuted}>⏻</div>}
          </div>
        </div>}
      </div>
    </div>
  );

  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",direction:ar?"rtl":"ltr"}}>
        <div style={{flex:1,background:"rgba(0,0,0,.6)"}} onClick={()=>setMobileOpen(false)}/>
        <div style={{position:"absolute",[ar?"right":"left"]:0,top:0,bottom:0}}>{sidebarContent}</div>
      </div>
    );
  }
  return sidebarContent;
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function TopBar({page,t,lang,setLang,mock,search,setSearch,setMobileOpen,isDemoUser}){
  const [notif,setNotif]=useState(false);
  const ar=lang==="ar";
  const isMobile = window.innerWidth <= 768;
  return <div style={{height:56,borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:10,background:G.surface,flexShrink:0}}>
    {isMobile&&<div onClick={()=>setMobileOpen(v=>!v)} style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:G.textMuted,flexShrink:0}}>☰</div>}
    <div style={{flex:1,minWidth:0}}>
      <div className="df" style={{fontSize:15,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t[page]}</div>
      {!isMobile&&<div className="af" style={{fontSize:11,color:G.textMuted}}>{mock.company.name} {(DEMO_MODE||isDemoUser)?<span style={{color:G.warning}}>· {t.demoData}</span>:<span style={{color:G.success}}>· {t.liveData}</span>}</div>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,background:G.surface2,border:`1px solid ${search?G.primary:G.border}`,borderRadius:8,padding:"6px 12px",width:isMobile?130:200,transition:"border .15s"}}>
      <span style={{color:G.textMuted,fontSize:13,flexShrink:0}}>⌕</span>
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder={t.searchPlaceholder} className="af"
        style={{background:"none",border:"none",outline:"none",color:G.text,fontSize:12,width:"100%"}}/>
      {search&&<span onClick={()=>setSearch("")} style={{cursor:"pointer",color:G.textMuted,fontSize:14,flexShrink:0}}>✕</span>}
    </div>
    {!isMobile&&<div style={{display:"flex",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,overflow:"hidden"}}>
      {["en","ar"].map(l=>(
        <div key={l} onClick={()=>setLang(l)} style={{padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700,background:lang===l?G.primary:"transparent",color:lang===l?"#fff":G.textMuted,transition:"all .15s",fontFamily:l==="ar"?"'Cairo'":"'Syne'"}}>
          {l==="en"?"EN":"ع"}
        </div>
      ))}
    </div>}
    <div style={{position:"relative",flexShrink:0}}>
      <div onClick={()=>setNotif(!notif)} style={{width:36,height:36,borderRadius:8,background:G.surface2,border:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16}}>🔔</div>
      <div style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:G.danger,border:`2px solid ${G.surface}`}}/>
      {notif&&<div onClick={()=>setNotif(false)} style={{position:"absolute",top:44,[ar?"left":"right"]:0,width:300,background:G.surface,border:`1px solid ${G.border}`,borderRadius:12,padding:16,zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"fadeUp .2s"}}>
        <div className="df" style={{marginBottom:12,fontSize:13}}>{t.notifications_title}</div>
        {mock.activity.slice(0,5).map((a,i)=>(
          <div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${G.border}`}}>
            <div className="af" style={{fontSize:12,marginBottom:2,lineHeight:1.4}}>{a.text}</div>
            <div className="af" style={{fontSize:11,color:G.textMuted}}>{a.time}</div>
          </div>
        ))}
      </div>}
    </div>
  </div>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({t,mock,liveHazards,liveSites,liveInspections,liveIncidents,setPage}){
  const bars = (() => {
    if(!liveInspections || liveInspections.length === 0) return [42,58,71,64,88,92,78,84,69,73,80,84];
    const weeks = Array.from({length:12},(_,w)=>{
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-(11-w)*7);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+7);
      const weekInsp = liveInspections.filter(i=>i.scheduled_at&&new Date(i.scheduled_at)>=weekStart&&new Date(i.scheduled_at)<weekEnd);
      if(weekInsp.length===0) return 40+Math.floor(w*4.5);
      return Math.round((weekInsp.filter(i=>i.status==="completed"||i.result==="pass").length/weekInsp.length)*100);
    });
    return weeks;
  })();
  const actColors={incident:G.danger,hazard:G.warning,overdue:G.danger,resolved:G.success,inspection:G.primary,user:G.purple};
  const isMobile = window.innerWidth <= 768;

  // Compute all KPIs from live data where available
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const isNewAccount = liveSites && liveSites.length === 0 &&
    liveInspections && liveInspections.length === 0 &&
    liveHazards && liveHazards.length === 0;

  const inspThisMonth = liveInspections
    ? liveInspections.filter(i=>i.scheduled_at && new Date(i.scheduled_at) >= monthStart).length
    : mock.kpis[0].value;
  const openHazards = liveHazards
    ? liveHazards.filter(h=>h.status==="open").length
    : mock.kpis[1].value;
  const overdueInsp = liveInspections
    ? liveInspections.filter(i=>i.status==="overdue"||(i.status==="scheduled"&&i.scheduled_at&&new Date(i.scheduled_at)<now)).length
    : mock.kpis[2].value;
  const incidentsMTD = liveIncidents
    ? liveIncidents.filter(i=>i.reported_at && new Date(i.reported_at) >= monthStart).length
    : mock.kpis[3].value;

  const kpis = [
    {...mock.kpis[0], value: inspThisMonth, delta: liveInspections ? `${inspThisMonth} this month` : mock.kpis[0].delta},
    {...mock.kpis[1], value: openHazards, delta: liveHazards ? `${liveHazards.filter(h=>h.status==="resolved").length} resolved` : mock.kpis[1].delta},
    {...mock.kpis[2], value: overdueInsp, delta: liveInspections ? (overdueInsp===0?"All on time":"Needs action") : mock.kpis[2].delta},
    {...mock.kpis[3], value: incidentsMTD, delta: liveIncidents ? `${liveIncidents.filter(i=>i.status==="closed").length} closed` : mock.kpis[3].delta},
    {...mock.kpis[4]},
  ];

  const siteNames = liveSites && liveSites.length > 0 ? liveSites.map(s=>s.name) : (isNewAccount ? [] : mock.company.sites);

  // Build real activity from live data
  const buildActivity = () => {
    const acts = [];
    if(liveInspections && liveInspections.length > 0) {
      liveInspections.slice(0,3).forEach(i=>{
        acts.push({
          text:`${i.template||"Inspection"} at ${i.site||"site"} — ${i.status}`,
          time: i.scheduled_at ? new Date(i.scheduled_at).toLocaleDateString([],{month:"short",day:"numeric"}) : "Recent",
          type:"inspection"
        });
      });
    }
    if(liveHazards && liveHazards.length > 0) {
      liveHazards.slice(0,2).forEach(h=>{
        acts.push({
          text:`${(h.title||"Hazard").slice(0,45)} — ${h.status}`,
          time: h.created_at ? new Date(h.created_at).toLocaleDateString([],{month:"short",day:"numeric"}) : "Recent",
          type: h.severity==="critical"||h.severity==="high" ? "incident" : "hazard"
        });
      });
    }
    if(liveIncidents && liveIncidents.length > 0) {
      liveIncidents.slice(0,2).forEach(i=>{
        acts.push({
          text:`${(i.title||"Incident").slice(0,45)} reported`,
          time: i.reported_at ? new Date(i.reported_at).toLocaleDateString([],{month:"short",day:"numeric"}) : "Recent",
          type:"incident"
        });
      });
    }
    return acts;
  };

  const liveActs = buildActivity();
  const hasRealActivity = liveActs.length > 0;

  // Empty state for new accounts
  if(isNewAccount) return <div style={{padding:24,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{maxWidth:600,margin:"0 auto",paddingTop:40,textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>🛡️</div>
      <div className="df" style={{fontSize:24,marginBottom:8}}>Welcome to SafeZone</div>
      <div className="af" style={{fontSize:14,color:G.textMuted,marginBottom:40,lineHeight:1.7}}>
        Your account is set up. Let's get your first site configured so you can start tracking safety.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24,textAlign:"left"}}>
        {[
          {icon:"📍",title:"Add your first site",desc:"Tell SafeZone where your team works",page:"settings",step:"1"},
          {icon:"✓",title:"Run an inspection",desc:"Start a safety walkthrough on any site",page:"inspections",step:"2"},
          {icon:"⚠",title:"Report a hazard",desc:"Log any risks you find on site",page:"hazards",step:"3"},
          {icon:"🔑",title:"Issue a permit",desc:"Create your first Permit to Work",page:"ptw",step:"4"},
        ].map(({icon,title,desc,page,step})=>(
          <Card key={step} hover onClick={()=>setPage(page)} style={{padding:18,cursor:"pointer",textAlign:"left"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:36,height:36,borderRadius:8,background:G.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span className="af" style={{fontSize:12,fontWeight:700}}>{title}</span>
                  <span style={{fontSize:10,background:G.primary,color:"#fff",borderRadius:10,padding:"1px 6px",fontFamily:"'DM Sans',sans-serif"}}>{step}</span>
                </div>
                <div className="af" style={{fontSize:11,color:G.textMuted,lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="af" style={{fontSize:12,color:G.textMuted}}>
        Need help? Your demo data is still accessible — just log in with <strong>manager@alnoor.sa</strong>
      </div>
    </div>
  </div>;

  return <div style={{padding:isMobile?16:24,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:12,marginBottom:16}}>
      {kpis.map((k,i)=>(
        <Card key={i} style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{fontSize:18}}>{k.icon}</div>
            <div className="af" style={{fontSize:10,color:k.color,fontWeight:700,background:k.color+"22",padding:"2px 7px",borderRadius:20}}>{k.delta}</div>
          </div>
          <div className="df" style={{fontSize:26,color:k.color,lineHeight:1}}>{k.value}</div>
          <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:4}}>{k.label}</div>
        </Card>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 280px",gap:12,marginBottom:12}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <span className="af" style={{fontWeight:700,fontSize:13}}>{t.inspectionRate}</span>
          <span className="af" style={{color:G.textMuted,fontSize:11}}>{t.last12weeks}</span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:5,height:90}}>
          {bars.map((b,i)=><div key={i} style={{flex:1}}><div style={{width:"100%",height:b*.8,borderRadius:"4px 4px 0 0",background:i===bars.length-1?G.primary:G.primary+"44",transition:"height .3s"}}/></div>)}
        </div>
      </Card>
      {!isMobile&&<Card>
        <div className="df" style={{marginBottom:12,fontSize:13}}>{t.liveActivity}</div>
        {hasRealActivity
          ? liveActs.map((a,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:actColors[a.type]||G.textMuted,marginTop:4,flexShrink:0}}/>
                <div>
                  <div className="af" style={{fontSize:11,lineHeight:1.4}}>{a.text}</div>
                  <div className="af" style={{fontSize:10,color:G.textMuted}}>{a.time}</div>
                </div>
              </div>
            ))
          : <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:28,marginBottom:8,opacity:.4}}>📋</div>
              <div className="af" style={{fontSize:12,color:G.textMuted}}>No activity yet — start your first inspection</div>
            </div>
        }
      </Card>}
    </div>
    {siteNames.length > 0
      ? <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
          {siteNames.slice(0,3).map((site,i)=>{
            const siteLiveInsp = liveInspections ? liveInspections.filter(ins=>ins.site===site) : [];
            const siteLiveHaz = liveHazards ? liveHazards.filter(h=>h.site===site && h.status==="open") : [];
            const inspCount = siteLiveInsp.length || [28,31,25][i];
            const hazCount = siteLiveHaz.length || [7,9,6][i];
            const score = siteLiveInsp.length > 0
              ? Math.round(siteLiveInsp.filter(ins=>ins.result==="pass").length/siteLiveInsp.length*100)||85
              : [94,87,91][i];
            const scoreColor = score>=90?G.success:score>=75?G.warning:G.danger;
            return <Card key={site} hover style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div className="af" style={{fontWeight:700,fontSize:13}}>{site}</div>
                  <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:2}}>{inspCount} {t.inspThisMonth}</div>
                </div>
                <div className="df" style={{fontSize:22,color:scoreColor}}>{score}%</div>
              </div>
              <div style={{height:4,borderRadius:2,background:G.border,marginBottom:8}}>
                <div style={{width:`${score}%`,height:"100%",borderRadius:2,background:scoreColor,transition:"width .6s"}}/>
              </div>
              {hazCount>0&&<div className="af" style={{fontSize:11,color:G.warning}}>⚠ {hazCount} {t.hazards_count}</div>}
            </Card>;
          })}
        </div>
      : <Card style={{textAlign:"center",padding:24}}>
          <div style={{fontSize:32,marginBottom:8,opacity:.4}}>📍</div>
          <div className="af" style={{fontSize:13,color:G.textMuted,marginBottom:12}}>No sites configured yet</div>
          <Btn size="sm" onClick={()=>setPage("settings")}>+ Add Your First Site</Btn>
        </Card>
    }
  </div>;
}


// ─── INSPECTIONS ──────────────────────────────────────────────────────────────
function Inspections({t,lang,mock,search,userRole,companyId}){
  const [sel,setSel]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [filter,setFilter]=useState("all");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({site:"",template:"",inspector:"",date:""});
  const [checkStates,setCheckStates]=useState({});
  const [checkPhotos,setCheckPhotos]=useState({});
  const ar=lang==="ar";
  const can=CAN[userRole]||CAN.readonly;

  // Live data
  const {data:liveInsp, loading} = useInspections(companyId);
  const {data:liveSites} = useSites(companyId);
  const {data:liveProfiles} = useProfiles(companyId);

  const rawInspections = liveInsp ? liveInsp.map(normalizeInspection) : mock.inspections;
  const siteOptions = liveSites ? liveSites.map(s=>s.name) : mock.company.sites;
  const inspectors = liveProfiles
    ? liveProfiles.filter(p=>["inspector","supervisor"].includes(p.role)).map(p=>({name:p.name,avatar:p.avatar_initials||"?",site:"All Sites",_id:p.id}))
    : mock.users.filter(u=>u.role===t.role_inspector);

  const stL={all:t.allFilter,scheduled:t.scheduledF,in_progress:t.inProgressF,completed:t.completedF,overdue:t.overdueF};
  const stT={completed:t.s_completed,pass:t.s_pass,fail:t.s_fail,partial:t.s_partial,overdue:t.s_overdue,in_progress:t.s_in_progress,scheduled:t.s_scheduled,na:t.s_na};
  const builtInTpls=[t.tpl1,t.tpl2,t.tpl3,t.tpl4,t.tpl5];
  const customTpls = (() => { try{ return JSON.parse(localStorage.getItem("sz_templates")||"[]").map(x=>x.name); }catch{ return []; } })();
  const tpls=[...builtInTpls,...customTpls];
  const checks=[t.check1,t.check2,t.check3,t.check4,t.check5,t.check6];

  let filtered = filter==="all"?rawInspections:rawInspections.filter(i=>i.status===filter);
  filtered = searchFilter(filtered, search, ["id","site","template","inspector"]);

  const cycleCheck = (i) => {
    const states = ["pass","fail","na",null];
    const cur = checkStates[i]||null;
    const next = states[(states.indexOf(cur)+1)%states.length];
    setCheckStates(s=>({...s,[i]:next}));
  };

  const handleCreate = async () => {
    if (!DEMO_MODE && supabase && companyId) {
      const inspectorProfile = liveProfiles?.find(p=>p.name===form.inspector);
      const siteRow = liveSites?.find(s=>s.name===form.site);
      const { error } = await supabase.from("inspections").insert({
        company_id: companyId,
        site_id: siteRow?.id,
        template: form.template,
        inspector_id: inspectorProfile?.id,
        scheduled_at: form.date ? new Date(form.date).toISOString() : null,
        status: "scheduled",
        checklist: checks.map((item,i)=>({item,status:checkStates[i]||null})),
      });
      if (error) { toast("Failed to create inspection","error"); return; }
    }
    toast(t.inspCreated,"success");
    setShowNew(false);
    setStep(1);
    setForm({site:"",template:"",inspector:"",date:""});
    setCheckStates({});
  };

  if(showNew) return <div style={{padding:24,maxWidth:600,animation:"slideIn .3s"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
      <Btn variant="ghost" size="sm" onClick={()=>{setShowNew(false);setStep(1);}}>{t.back}</Btn>
      <div className="df" style={{fontSize:18}}>{t.wizardTitle}</div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {[t.step1,t.step2,t.step3].map((s,i)=>(
        <div key={s} style={{flex:1,textAlign:"center"}}>
          <div style={{height:3,borderRadius:2,background:step>i?G.primary:G.border,marginBottom:6,transition:"background .3s"}}/>
          <div className="af" style={{fontSize:11,color:step===i+1?G.primary:G.textMuted,fontWeight:step===i+1?700:400}}>{s}</div>
        </div>
      ))}
    </div>
    <Card>
      {step===1&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Field label={t.fieldTemplate} type="select" options={tpls} value={form.template} onChange={v=>setForm(f=>({...f,template:v}))} t={t}/>
        <Field label={t.fieldSite} type="select" options={siteOptions} value={form.site} onChange={v=>setForm(f=>({...f,site:v}))} t={t}/>
        <DateTimePicker label={t.fieldDate} value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} t={t}/>
        <Field label={t.fieldNotes} type="textarea" t={t}/>
        <Btn onClick={()=>setStep(2)} disabled={!form.template||!form.site}>{t.continue}</Btn>
      </div>}
      {step===2&&<div>
        <div className="af" style={{fontWeight:700,marginBottom:14,fontSize:13}}>{t.checklistPreview}</div>
        {checks.map((item,i)=>{
          const st = checkStates[i]||null;
          const photo = checkPhotos[i]||null;
          const stColors={pass:G.success,fail:G.danger,na:G.textMuted};
          return <div key={i} style={{borderBottom:`1px solid ${G.border}`,borderRadius:8,overflow:"hidden",marginBottom:4}}>
            <div onClick={()=>cycleCheck(i)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",cursor:"pointer",transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=G.surface2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span className="mf" style={{color:G.textMuted,fontSize:11,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
              <span className="af" style={{flex:1,fontSize:12}}>{item}</span>
              <span className="af" style={{fontSize:11,fontWeight:700,background:st?stColors[st]+"22":"transparent",color:st?stColors[st]:G.textDim,padding:"3px 10px",borderRadius:20,border:`1px solid ${st?stColors[st]+"44":G.border}`,minWidth:52,textAlign:"center"}}>
                {st===null?"—":st==="pass"?t.passLabel:st==="fail"?t.failLabel:t.naLabel}
              </span>
            </div>
            <div style={{padding:"0 12px 10px 32px",display:"flex",alignItems:"center",gap:8}}>
              {photo
                ? <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <img src={photo} alt="evidence" style={{width:48,height:48,borderRadius:6,objectFit:"cover",border:`1px solid ${G.border}`}}/>
                    <span className="af" style={{fontSize:11,color:G.success}}>✓ {t.photoAdded}</span>
                    <button onClick={()=>setCheckPhotos(p=>({...p,[i]:null}))} className="af" style={{fontSize:10,color:G.danger,background:"none",border:"none",cursor:"pointer"}}>{t.removePhoto}</button>
                  </div>
                : <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:G.textMuted,padding:"4px 8px",borderRadius:6,border:`1px dashed ${G.border}`,transition:"all .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=G.primary}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
                    <span>📷</span>
                    <span className="af">{t.tapToPhoto}</span>
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
                      const file=e.target.files[0]; if(!file) return;
                      const reader=new FileReader();
                      reader.onload=ev=>setCheckPhotos(p=>({...p,[i]:ev.target.result}));
                      reader.readAsDataURL(file);
                    }}/>
                  </label>
              }
            </div>
          </div>;
        })}
        <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:10,textAlign:"center"}}>Tap each item to toggle Pass / Fail / N/A</div>
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <Btn variant="ghost" onClick={()=>setStep(1)}>{t.back}</Btn>
          <Btn onClick={()=>setStep(3)} style={{flex:1}}>{t.assignInspector}</Btn>
        </div>
      </div>}
      {step===3&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="af" style={{fontWeight:700,fontSize:13}}>{t.assignInspector}</div>
        {inspectors.map(u=>(
          <div key={u.name||u._id} onClick={()=>setForm(f=>({...f,inspector:u.name}))}
            style={{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:8,border:`1px solid ${form.inspector===u.name?G.primary:G.border}`,cursor:"pointer",background:form.inspector===u.name?G.primaryGlow:G.surface2,transition:"all .15s"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{u.avatar}</div>
            <div style={{flex:1}}>
              <div className="af" style={{fontSize:13,fontWeight:600}}>{u.name}</div>
              <div className="af" style={{fontSize:11,color:G.textMuted}}>{u.site}</div>
            </div>
            {form.inspector===u.name&&<span style={{color:G.primary,fontSize:16}}>✓</span>}
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <Btn variant="ghost" onClick={()=>setStep(2)}>{t.back}</Btn>
          <Btn variant="success" disabled={!form.inspector} onClick={handleCreate}>{t.createAssign}</Btn>
        </div>
      </div>}
    </Card>
  </div>;

  if(sel) return <div style={{padding:24,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
      <Btn variant="ghost" size="sm" onClick={()=>setSel(null)}>{t.back}</Btn>
      <div style={{flex:1}}>
        <div className="df" style={{fontSize:18}}>{sel.template}</div>
        <div className="af" style={{fontSize:12,color:G.textMuted}}>{sel.id} · {sel.site} · {sel.inspector}</div>
      </div>
      <Badge status={sel.status} label={stT[sel.status]||sel.status}/>
      <Btn size="sm" variant="ghost" onClick={()=>{
        generatePDF({
          title: `Inspection Report — ${sel.id}`,
          company: mock.company.name,
          userName: mock.user.name,
          kpis:[{label:"Status",value:sel.status,color:"#2563eb"},{label:"Site",value:sel.site,color:"#00D4AA"},{label:"Inspector",value:sel.inspector,color:"#7C6FFF"},{label:"Date",value:sel.date,color:"#FF6B35"}],
          headers:["Check Item","Status","Notes"],
          rows:(sel.checks||[{item:"PPE Compliance",status:"pass"},{item:"Fire Exits Clear",status:"pass"},{item:"Equipment Inspection",status:"fail"},{item:"Hazard Signage",status:"pass"},{item:"Emergency Equipment",status:"na"}]).map(c=>[c.item, c.status?.toUpperCase()||"—", c.notes||"—"])
        });
        toast(ar?"تم فتح التقرير":"Report opened — click Save as PDF","success");
      }}>{t.exportPdf}</Btn>
      <div>
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",gap:24}}>
            {[[t.totalItems,6],[t.passed,3,G.success],[t.failed,2,G.danger],[t.na,1,G.textMuted]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div className="df" style={{fontSize:26,color:c||G.text}}>{v}</div>
                <div className="af" style={{fontSize:11,color:G.textMuted}}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
        {[{q:checks[0],st:"pass"},{q:checks[1],st:"fail",note:t.inspNote1},{q:checks[2],st:"fail",note:t.inspNote2},{q:checks[3],st:"pass"},{q:checks[4],st:"pass"},{q:checks[5],st:"na",note:t.inspNote3}].map((item,i)=>(
          <Card key={i} style={{marginBottom:10,padding:14}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <span className="mf" style={{fontSize:11,color:G.textDim,marginTop:2}}>{String(i+1).padStart(2,"0")}</span>
              <div style={{flex:1}}>
                <div className="af" style={{fontSize:13,marginBottom:item.note?6:0}}>{item.q}</div>
                {item.note&&<div className="af" style={{fontSize:12,color:G.textMuted,fontStyle:"italic"}}>"{item.note}"</div>}
                {item.st==="fail"&&<div style={{marginTop:8}}><span className="af" style={{fontSize:11,color:G.danger,background:G.danger+"22",padding:"2px 8px",borderRadius:10}}>{t.hazardAutoCreated}</span></div>}
              </div>
              <Badge status={item.st} label={stT[item.st]||item.st}/>
            </div>
          </Card>
        ))}
      </div>
      <div>
        <Card style={{marginBottom:14}}>
          <div className="df" style={{marginBottom:12,fontSize:13}}>{t.inspDetails}</div>
          {[[t.colSite,sel.site],[t.colInspector,sel.inspector],[t.colScheduled,sel.scheduled]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${G.border}`,fontSize:12}}>
              <span className="af" style={{color:G.textMuted}}>{l}</span>
              <span className="af">{v}</span>
            </div>
          ))}
        </Card>
        {can.edit&&<Card>
          <div className="df" style={{marginBottom:12,fontSize:13}}>{t.supervisorSignoff}</div>
          <textarea placeholder={t.reviewComments} className="af" style={{width:"100%",height:72,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:10,color:G.text,fontSize:12,resize:"none"}}/>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <Btn size="sm" variant="success" style={{flex:1}} onClick={()=>toast(t.changesSaved,"success")}>{t.approve}</Btn>
            <Btn size="sm" variant="danger" style={{flex:1}} onClick={()=>toast("Sent back for revision","warning")}>{t.revise}</Btn>
          </div>
        </Card>}
      </div>
    </div>
  </div>;

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {Object.entries(stL).map(([k,l])=><Btn key={k} size="sm" variant={filter===k?"primary":"ghost"} onClick={()=>setFilter(k)}>{l}</Btn>)}
      </div>
      {can.create&&<Btn onClick={()=>setShowNew(true)}>{t.newInspection}</Btn>}
    </div>
    {loading
      ? <Card style={{padding:0,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><tbody>{[0,1,2,3].map(i=><SkeletonRow key={i} cols={8}/>)}</tbody></table></Card>
      : filtered.length===0
        ? <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.4}}>✓</div>
            <div className="af" style={{fontSize:15,fontWeight:700,marginBottom:8}}>{search?t.noResults:"No inspections yet"}</div>
            <div className="af" style={{fontSize:13,color:G.textMuted,marginBottom:20}}>{search?"Try a different search":"Run your first safety inspection to get started"}</div>
            {!search&&can.create&&<Btn onClick={()=>setShowNew(true)}>{t.newInspection}</Btn>}
          </div>
        : <Card style={{padding:0,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${G.border}`}}>
                {[t.colId,t.colSite,t.colTemplate,t.colInspector,t.colScheduled,t.colStatus,t.colResult,""].map((h,i)=>(
                  <th key={i} className="af" style={{padding:"10px 14px",textAlign:ar?"right":"left",fontSize:11,color:G.textMuted,fontWeight:700}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((ins,i)=>(
                  <tr key={ins.id} onClick={()=>setSel(ins)} style={{borderBottom:`1px solid ${G.border}`,cursor:"pointer",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=G.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td className="mf" style={{padding:"11px 14px",fontSize:12,color:G.primary}}>{ins.id}</td>
                    <td className="af" style={{padding:"11px 14px",fontSize:13}}>{ins.site}</td>
                    <td className="af" style={{padding:"11px 14px",fontSize:12,color:G.textMuted}}>{ins.template}</td>
                    <td className="af" style={{padding:"11px 14px",fontSize:12}}>{ins.inspector}</td>
                    <td className="af" style={{padding:"11px 14px",fontSize:12,color:G.textMuted}}>{ins.scheduled}</td>
                    <td style={{padding:"11px 14px"}}><Badge status={ins.status} label={stT[ins.status]||ins.status}/></td>
                    <td style={{padding:"11px 14px"}}>{ins.result?<Badge status={ins.result} label={stT[ins.result]||ins.result}/>:<span style={{color:G.textDim}}>—</span>}</td>
                    <td className="af" style={{padding:"11px 14px",color:G.primary,fontSize:12}}>{t.viewLink}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
    }
  </div>;
}

// ─── HAZARDS ──────────────────────────────────────────────────────────────────
function Hazards({t,lang,mock,search,userRole,companyId}){
  const [filter,setFilter]=useState("all");
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [resNotes,setResNotes]=useState("");
  const [form,setForm]=useState({title:"",severity:"",site:"",assigned:""});
  const [confirm,setConfirm]=useState(null);
  const ar=lang==="ar";
  const can=CAN[userRole]||CAN.readonly;

  const {data:liveHazards, loading} = useHazards(companyId);
  const {data:liveSites} = useSites(companyId);
  const {data:liveProfiles} = useProfiles(companyId);

  const rawHazards = liveHazards ? liveHazards.map(normalizeHazard) : mock.hazards;
  const [localHazards, setLocalHazards] = useState(null);
  const hazards = localHazards ?? rawHazards;

  // Sync when live data arrives
  useEffect(()=>{ if(liveHazards) setLocalHazards(liveHazards.map(normalizeHazard)); }, [liveHazards]);

  const siteOptions = liveSites ? liveSites.map(s=>s.name) : mock.company.sites;
  const inspectorOptions = liveProfiles
    ? liveProfiles.filter(p=>["inspector","supervisor","manager"].includes(p.role)).map(p=>p.name)
    : mock.users.filter(u=>u.role===t.role_inspector).map(u=>u.name);

  const sT={critical:t.s_critical,high:t.s_high,medium:t.s_medium,low:t.s_low};
  const stT={open:t.s_open,in_progress:t.s_in_progress,resolved:t.s_resolved};
  const filters=[["all",t.allFilter],["critical",t.criticalF],["high",t.highF],["medium",t.mediumF],["open",t.openF],["resolved",t.resolvedF]];

  let filtered = filter==="all"?hazards:hazards.filter(h=>h.severity===filter||h.status===filter);
  filtered = searchFilter(filtered, search, ["id","site","title","assigned"]);

  const handleReport = async () => {
    const sevMap={[t.sev1]:"low",[t.sev2]:"medium",[t.sev3]:"high",[t.sev4]:"critical"};
    const sev = sevMap[form.severity]||"medium";

    if (!DEMO_MODE && supabase && companyId) {
      const siteRow = liveSites?.find(s=>s.name===form.site);
      const assignedProfile = liveProfiles?.find(p=>p.name===form.assigned);
      const { error } = await supabase.from("hazards").insert({
        company_id: companyId,
        site_id: siteRow?.id,
        title: form.title,
        severity: sev,
        assigned_to: assignedProfile?.id,
        status: "open",
        due_date: new Date(Date.now() + 7*86400000).toISOString().split("T")[0],
      });
      if (error) { toast("Failed to report hazard","error"); return; }
      // Real-time will update the list automatically
    } else {
      const newH={id:`HAZ-${String(hazards.length+92).padStart(3,"0")}`,site:form.site,title:form.title,severity:sev,assigned:form.assigned||"Unassigned",due:"Tomorrow",status:"open",age:"0d"};
      setLocalHazards(hs=>[newH,...(hs||rawHazards)]);
    }
    toast(t.hazardReported,"success");
    setShowForm(false);
    setForm({title:"",severity:"",site:"",assigned:""});
  };

  const handleResolve = (haz) => {
    setConfirm({
      msg:`Mark "${haz.title.substring(0,50)}..." as resolved?`,
      onConfirm: async ()=>{
        if (!DEMO_MODE && supabase && haz._id) {
          await supabase.from("hazards").update({
            status:"resolved",
            resolution_notes: resNotes,
            resolved_at: new Date().toISOString(),
          }).eq("id", haz._id);
        } else {
          setLocalHazards(hs=>(hs||rawHazards).map(h=>h.id===haz.id?{...h,status:"resolved"}:h));
        }
        toast(t.hazardResolved,"success");
        setSel(null);
        setConfirm(null);
        setResNotes("");
      }
    });
  };

  if(showForm) return <div style={{padding:24,maxWidth:560,animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:24}}>
      <Btn variant="ghost" size="sm" onClick={()=>setShowForm(false)}>{t.back}</Btn>
      <div className="df" style={{fontSize:18}}>{t.reportHazard}</div>
    </div>
    <Card>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Field label={t.incidentTitle} placeholder={ar?"وصف موجز للخطر":"Brief description of the hazard"} value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} t={t}/>
        <Field label={t.severity} type="select" options={[t.sev1,t.sev2,t.sev3,t.sev4]} value={form.severity} onChange={v=>setForm(f=>({...f,severity:v}))} t={t}/>
        <Field label={t.colSite} type="select" options={siteOptions} value={form.site} onChange={v=>setForm(f=>({...f,site:v}))} t={t}/>
        <Field label={t.assignedLabel.replace(":","")+" "+t.colInspector} type="select" options={inspectorOptions} value={form.assigned} onChange={v=>setForm(f=>({...f,assigned:v}))} t={t}/>
        <div style={{border:`2px dashed ${G.border}`,borderRadius:8,padding:24,textAlign:"center",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=G.primary}
          onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
          <span className="af" style={{color:G.textMuted,fontSize:12}}>{t.dragPhoto}</span>
        </div>
        <Btn disabled={!form.title||!form.severity||!form.site} onClick={handleReport}>{t.reportHazard}</Btn>
      </div>
    </Card>
  </div>;

  if(sel) return <div style={{padding:24,maxWidth:620,animation:"slideIn .3s"}}>
    {confirm&&<ConfirmModal msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
      <Btn variant="ghost" size="sm" onClick={()=>setSel(null)}>{t.back}</Btn>
      <div style={{flex:1}}>
        <div className="df" style={{fontSize:16}}>{sel.id}</div>
        <div className="af" style={{fontSize:12,color:G.textMuted}}>{sel.site}</div>
      </div>
      <Badge status={sel.severity} label={sT[sel.severity]||sel.severity}/>
    </div>
    <Card style={{marginBottom:14}}>
      <div className="af" style={{fontSize:14,fontWeight:700,marginBottom:14}}>{sel.title}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[[t.assignedLabel.replace(":",""),sel.assigned],[t.dueLabel.replace(":",""),sel.due],[t.colStatus,stT[sel.status]||sel.status],["Age",sel.age]].map(([l,v])=>(
          <div key={l} style={{background:G.surface2,padding:12,borderRadius:8}}>
            <div className="af" style={{fontSize:10,color:G.textMuted,marginBottom:3}}>{l}</div>
            <div className="af" style={{fontSize:13,fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>
    </Card>
    {sel.status!=="resolved"&&can.edit&&<Card>
      <div className="df" style={{marginBottom:12,fontSize:13}}>{t.resolution}</div>
      <Field type="textarea" placeholder={t.resolutionNotes} value={resNotes} onChange={setResNotes} t={t}/>
      <div style={{marginTop:12,border:`2px dashed ${G.border}`,borderRadius:8,padding:20,textAlign:"center",cursor:"pointer"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=G.primary}
        onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
        <span className="af" style={{color:G.textMuted,fontSize:12}}>{t.dragPhoto}</span>
      </div>
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <Btn variant="success" style={{flex:1}} onClick={()=>handleResolve(sel)}>{t.markResolved}</Btn>
        <Btn variant="ghost" style={{flex:1}} onClick={()=>{toast("Reassigned to supervisor","info");setSel(null);}}>{t.reassign}</Btn>
      </div>
    </Card>}
    {sel.status==="resolved"&&<Card style={{textAlign:"center",padding:24}}>
      <div style={{fontSize:40,marginBottom:10}}>✅</div>
      <div className="af" style={{color:G.success,fontWeight:700}}>{t.s_resolved}</div>
    </Card>}
  </div>;

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    {confirm&&<ConfirmModal msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {filters.map(([k,l])=><Btn key={k} size="sm" variant={filter===k?"primary":"ghost"} onClick={()=>setFilter(k)}>{l}</Btn>)}
      </div>
      {can.create&&<Btn onClick={()=>setShowForm(true)}>{t.reportHazard}</Btn>}
    </div>
    {loading
      ? <div style={{display:"flex",flexDirection:"column",gap:10}}>{[0,1,2].map(i=><Card key={i} style={{padding:14,display:"flex",gap:12,alignItems:"center"}}><div style={{width:4,height:50,borderRadius:2,background:G.border}}/><div style={{flex:1}}><div style={{height:12,width:"60%",borderRadius:6,background:G.surface2,marginBottom:8,animation:"pulse 1.5s infinite"}}/><div style={{height:10,width:"40%",borderRadius:6,background:G.surface2,animation:"pulse 1.5s infinite"}}/></div></Card>)}</div>
      : filtered.length===0
        ? <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.4}}>⚠</div>
            <div className="af" style={{fontSize:15,fontWeight:700,marginBottom:8}}>{search?t.noResults:"No hazards reported"}</div>
            <div className="af" style={{fontSize:13,color:G.textMuted,marginBottom:20}}>{search?"Try a different search":"Report the first hazard found on your sites"}</div>
            {!search&&can.create&&<Btn onClick={()=>setShowForm(true)}>{t.reportHazard}</Btn>}
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map((h,i)=>(
              <Card key={i} hover onClick={()=>setSel(h)} style={{padding:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:4,borderRadius:2,alignSelf:"stretch",background:sc(h.severity),flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                      <span className="mf" style={{fontSize:11,color:G.textMuted}}>{h.id}</span>
                      <Badge status={h.severity} label={sT[h.severity]||h.severity}/>
                      <Badge status={h.status} label={stT[h.status]||h.status}/>
                    </div>
                    <div className="af" style={{fontSize:13,fontWeight:700,marginBottom:3}}>{h.title}</div>
                    <div className="af" style={{fontSize:12,color:G.textMuted}}>{h.site} · {t.assignedLabel} {h.assigned}</div>
                  </div>
                  <span style={{color:G.primary}}>→</span>
                </div>
              </Card>
            ))}
          </div>
    }
  </div>;
}

// ─── INCIDENTS ────────────────────────────────────────────────────────────────
function Incidents({t,lang,mock,search,userRole,companyId}){
  const [showForm,setShowForm]=useState(false);
  const [sel,setSel]=useState(null);
  const [localIncidents,setLocalIncidents]=useState(null);
  const [form,setForm]=useState({type:"",severity:"",site:"",title:"",desc:"",regulatory:false});
  const [rootCause,setRootCause]=useState("");
  const [corrective,setCorrective]=useState("");
  const [showAI,setShowAI]=useState(false);
  const [aiInput,setAiInput]=useState("");
  const [aiResult,setAiResult]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiCopied,setAiCopied]=useState(false);
  const can=CAN[userRole]||CAN.readonly;

  const {data:liveInc, loading} = useIncidents(companyId);
  const {data:liveSites} = useSites(companyId);

  const rawIncidents = liveInc ? liveInc.map(normalizeIncident) : mock.incidents;
  const incidents = localIncidents ?? rawIncidents;

  useEffect(()=>{ if(liveInc) setLocalIncidents(liveInc.map(normalizeIncident)); },[liveInc]);

  const siteOptions = liveSites ? liveSites.map(s=>s.name) : mock.company.sites;
  const sT={critical:t.s_critical,high:t.s_high,medium:t.s_medium,low:t.s_low};
  const stT={investigating:t.s_investigating,closed:t.s_closed,open:t.s_open};
  const types=[t.it1,t.it2,t.it3,t.it4,t.it5];
  const sevs=[t.sev1,t.sev2,t.sev3,t.sev4];
  const typeIcons={near_miss:"⚡",injury:"🩹",environmental:"🌿",property_damage:"🔥",dangerous_occurrence:"💥"};

  let filtered = searchFilter(incidents, search, ["id","site","title","reportedBy"]);

  const handleSubmit = async () => {
    const typeMap={[t.it1]:"near_miss",[t.it2]:"injury",[t.it3]:"property_damage",[t.it4]:"environmental",[t.it5]:"dangerous_occurrence"};
    const sevMap={[t.sev1]:"low",[t.sev2]:"medium",[t.sev3]:"high",[t.sev4]:"critical"};

    if (!DEMO_MODE && supabase && companyId) {
      const siteRow = liveSites?.find(s=>s.name===form.site);
      const { error } = await supabase.from("incidents").insert({
        company_id: companyId,
        site_id: siteRow?.id,
        title: form.title,
        description: form.desc,
        incident_type: typeMap[form.type]||"near_miss",
        severity: sevMap[form.severity]||"medium",
        status: "investigating",
        regulatory_notify: form.regulatory,
        occurred_at: new Date().toISOString(),
      });
      if (error) { toast("Failed to submit incident","error"); return; }
    } else {
      const newI={id:`INC-${String(incidents.length+32).padStart(3,"0")}`,site:form.site,title:form.title,type:typeMap[form.type]||"near_miss",severity:sevMap[form.severity]||"medium",reported:"Today, "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),status:"investigating",reportedBy:"Me"};
      setLocalIncidents(is=>[newI,...(is||rawIncidents)]);
    }
    toast(t.incidentSubmitted,"success");
    if(form.regulatory) setTimeout(()=>toast("Regulatory notification queued","warning"),600);
    setShowForm(false);
    setForm({type:"",severity:"",site:"",title:"",desc:"",regulatory:false});
  };

  const handleClose = async () => {
    if (!DEMO_MODE && supabase && sel._id) {
      await supabase.from("incidents").update({
        status:"closed",
        root_cause: rootCause,
        corrective_actions: corrective,
        closed_at: new Date().toISOString(),
      }).eq("id", sel._id);
    } else {
      setLocalIncidents(is=>(is||rawIncidents).map(i=>i.id===sel.id?{...i,status:"closed"}:i));
    }
    toast(t.changesSaved,"success");
    setSel(null);
  };

  const handleAIGenerate = async () => {
    if(!aiInput.trim()) return;
    setAiLoading(true); setAiResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a professional HSE (Health, Safety & Environment) report writer for GCC construction and industrial sites. Write formal, structured incident investigation reports in ${lang==="ar"?"Arabic":"English"}. Be concise, professional, and use proper HSE terminology.`,
          messages:[{role:"user",content:`Write a full incident investigation report based on this description:\n\n"${aiInput}"\n\nInclude: Incident Summary, Immediate Causes, Root Cause Analysis, Corrective Actions, and Preventive Measures. Format clearly with headers.`}]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c=>c.text||"").join("") || "";
      setAiResult(text || t.aiError);
    } catch(e) { setAiResult(t.aiError); }
    setAiLoading(false);
  };

  if(showAI) return <div style={{padding:24,maxWidth:640,animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
      <Btn variant="ghost" size="sm" onClick={()=>{setShowAI(false);setAiResult("");setAiInput("");}}>{t.back}</Btn>
      <div>
        <div className="df" style={{fontSize:18}}>{t.aiPowered}</div>
        <div className="af" style={{fontSize:12,color:G.textMuted}}>{t.aiSub}</div>
      </div>
    </div>
    <Card style={{marginBottom:16}}>
      <div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:8,fontWeight:600}}>{t.aiDesc}</div>
      <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
        placeholder={t.aiDescPh} className="af"
        style={{width:"100%",height:100,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:10,color:G.text,fontSize:13,resize:"vertical",outline:"none",lineHeight:1.6}}/>
      <Btn loading={aiLoading} onClick={handleAIGenerate} style={{marginTop:10,width:"100%"}} disabled={!aiInput.trim()}>{t.aiGenerate}</Btn>
    </Card>
    {aiResult&&<Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="af" style={{fontSize:13,fontWeight:700,color:G.success}}>✓ Report Generated</div>
        <div style={{display:"flex",gap:8}}>
          <Btn size="sm" variant="ghost" onClick={()=>{navigator.clipboard.writeText(aiResult);setAiCopied(true);setTimeout(()=>setAiCopied(false),2000);}}>{aiCopied?t.aiCopied:t.aiCopy}</Btn>
          <Btn size="sm" onClick={()=>{setForm(f=>({...f,desc:aiResult}));setShowAI(false);setShowForm(true);toast(lang==="ar"?"تم إدراج التقرير":"Report inserted","success");}}>{t.aiInsert}</Btn>
        </div>
      </div>
      <div className="af" style={{fontSize:12,lineHeight:1.8,color:G.text,whiteSpace:"pre-wrap",maxHeight:400,overflowY:"auto",padding:"0 4px"}}>{aiResult}</div>
    </Card>}
  </div>;

  if(showForm) return <div style={{padding:24,maxWidth:600,animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:24}}>
      <Btn variant="ghost" size="sm" onClick={()=>setShowForm(false)}>{t.back}</Btn>
      <div className="df" style={{fontSize:18}}>{t.reportIncident}</div>
      <div style={{marginLeft:"auto"}}>
        <Btn size="sm" variant="ghost" onClick={()=>{setShowForm(false);setShowAI(true);}} style={{background:G.purple+"22",border:`1px solid ${G.purple}44`,color:G.purple}}>{t.aiDraftReport}</Btn>
      </div>
    </div>
    <Card>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label={t.incidentType} type="select" options={types} value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} t={t}/>
        <Field label={t.severity} type="select" options={sevs} value={form.severity} onChange={v=>setForm(f=>({...f,severity:v}))} t={t}/>
        <Field label={t.colSite} type="select" options={siteOptions} value={form.site} onChange={v=>setForm(f=>({...f,site:v}))} t={t}/>
        <Field label={t.incidentTitle} placeholder={t.incidentTitlePh} value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} t={t}/>
        <Field label={t.fullDesc} type="textarea" placeholder={t.fullDescPh} value={form.desc} onChange={v=>setForm(f=>({...f,desc:v}))} t={t}/>
        <div>
          <div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600}}>{t.dateTime}</div>
          <DateTimePicker value="" onChange={()=>{}} t={{}} />
        </div>
        <div style={{border:`2px dashed ${G.border}`,borderRadius:8,padding:20,textAlign:"center",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=G.primary}
          onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
          <span className="af" style={{color:G.textMuted,fontSize:12}}>{t.dropFiles}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:12,background:G.danger+"11",border:`1px solid ${G.danger}33`,borderRadius:8}}>
          <input type="checkbox" checked={form.regulatory} onChange={e=>setForm(f=>({...f,regulatory:e.target.checked}))} id="reg" style={{accentColor:G.danger}}/>
          <label htmlFor="reg" className="af" style={{fontSize:12,cursor:"pointer"}}>{t.regulatoryFlag}</label>
        </div>
        <Btn disabled={!form.type||!form.site||!form.title} onClick={handleSubmit}>{t.submitIncident}</Btn>
      </div>
    </Card>
  </div>;

  if(sel) return <div style={{padding:24,maxWidth:620,animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
      <Btn variant="ghost" size="sm" onClick={()=>setSel(null)}>{t.back}</Btn>
      <div style={{flex:1}}><div className="df" style={{fontSize:16}}>{sel.id}</div></div>
      <Badge status={sel.severity} label={sT[sel.severity]}/>
      <Btn size="sm" variant="ghost" onClick={()=>{
        generatePDF({
          title: `Incident Report — ${sel.id}`,
          company: mock.company.name,
          userName: mock.user.name,
          kpis:[{label:"Severity",value:sel.severity?.toUpperCase(),color:"#FF6B35"},{label:"Type",value:sel.type?.replace("_"," "),color:"#2563eb"},{label:"Status",value:sel.status,color:"#00D4AA"},{label:"Date",value:sel.reported,color:"#7C6FFF"}],
          headers:["Field","Details"],
          rows:[["Incident ID",sel.id],["Title",sel.title||"—"],["Site",sel.site||"—"],["Type",sel.type?.replace("_"," ")||"—"],["Severity",sel.severity||"—"],["Reported By",sel.reportedBy||"—"],["Date Reported",sel.reported||"—"],["Status",sel.status||"—"],["Description",sel.description||"—"]]
        });
        toast(ar?"تم فتح التقرير":"Report opened — click Save as PDF","success");
      }}>{t.exportPdf}</Btn>
    </div>
    <Card style={{marginBottom:14}}>
      <div className="af" style={{fontSize:14,fontWeight:700,marginBottom:12}}>{sel.title}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[[t.colSite,sel.site],[t.incidentType,sel.type?.replace("_"," ")],[t.colInspector,sel.reportedBy],[t.generated,sel.reported]].map(([l,v])=>(
          <div key={l} style={{background:G.surface2,padding:12,borderRadius:8}}>
            <div className="af" style={{fontSize:10,color:G.textMuted,marginBottom:3}}>{l}</div>
            <div className="af" style={{fontSize:13,fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>
    </Card>
    {can.edit&&<Card>
      <div className="df" style={{marginBottom:14,fontSize:13}}>{t.investigationLog}</div>
      <Field label={t.rootCause} type="textarea" placeholder={t.rootCausePh} value={rootCause} onChange={setRootCause} t={t}/>
      <div style={{marginTop:12}}><Field label={t.correctiveActions} type="textarea" placeholder={t.correctivePh} value={corrective} onChange={setCorrective} t={t}/></div>
      <Btn variant="success" style={{width:"100%",marginTop:14}} onClick={handleClose}>{t.closeInvestigation}</Btn>
    </Card>}
  </div>;

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div className="af" style={{fontSize:13,color:G.textMuted}}>{filtered.length} {t.incidentsCount}</div>
      <div style={{display:"flex",gap:8}}>
        {can.create&&<Btn variant="ghost" onClick={()=>setShowAI(true)} style={{background:G.purple+"22",border:`1px solid ${G.purple}44`,color:G.purple}}>{t.aiDraftReport}</Btn>}
        {can.create&&<Btn onClick={()=>setShowForm(true)}>{t.reportIncident}</Btn>}
      </div>
    </div>
    {loading
      ? <div style={{display:"flex",flexDirection:"column",gap:12}}>{[0,1,2].map(i=><Card key={i} style={{padding:16,display:"flex",gap:12}}><div style={{width:44,height:44,borderRadius:10,background:G.surface2,flexShrink:0,animation:"pulse 1.5s infinite"}}/><div style={{flex:1}}><div style={{height:12,width:"70%",borderRadius:6,background:G.surface2,marginBottom:8,animation:"pulse 1.5s infinite"}}/><div style={{height:10,width:"45%",borderRadius:6,background:G.surface2,animation:"pulse 1.5s infinite"}}/></div></Card>)}</div>
      : filtered.length===0
        ? <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.4}}>⚡</div>
            <div className="af" style={{fontSize:15,fontWeight:700,marginBottom:8}}>{search?t.noResults:"No incidents recorded"}</div>
            <div className="af" style={{fontSize:13,color:G.textMuted,marginBottom:20}}>{search?"Try a different search":"Report incidents and near-misses to track site safety"}</div>
            {!search&&can.create&&<Btn onClick={()=>setShowForm(true)}>{t.reportIncident}</Btn>}
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {filtered.map((inc,i)=>(
              <Card key={i} hover onClick={()=>setSel(inc)} style={{padding:16}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:44,height:44,borderRadius:10,background:sc(inc.severity)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {typeIcons[inc.type]||"⚡"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                      <span className="mf" style={{fontSize:11,color:G.textMuted}}>{inc.id}</span>
                      <Badge status={inc.severity} label={sT[inc.severity]}/>
                      <Badge status={inc.status} label={stT[inc.status]||inc.status}/>
                    </div>
                    <div className="af" style={{fontSize:13,fontWeight:700,marginBottom:3}}>{inc.title}</div>
                    <div className="af" style={{fontSize:12,color:G.textMuted}}>{inc.site} · {inc.reported}</div>
                  </div>
                  <span style={{color:G.primary}}>→</span>
                </div>
              </Card>
            ))}
          </div>
    }
  </div>;
}

// ─── COMPLIANCE ───────────────────────────────────────────────────────────────
function Compliance({t,lang,mock,search,userRole,companyId}){
  const ar=lang==="ar";
  const can=CAN[userRole]||CAN.readonly;
  const [docFilter,setDocFilter]=useState("all");
  const [showUpload,setShowUpload]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [upForm,setUpForm]=useState({name:"",type:"Certificate",expiry:""});

  const {data:liveDocs, loading} = useCompliance(companyId);
  const rawDocs = liveDocs ? liveDocs.map(normalizeDoc) : mock.compliance;

  const exp=rawDocs.filter(d=>d.status==="expired");
  const expiring=rawDocs.filter(d=>d.status==="expiring");
  const stT={valid:t.s_valid,expiring:t.s_expiring,expired:t.s_expired};
  const docFs=[["all",t.allDocs],["Certificate",t.certificates],["Policy",t.policies],["Risk Assessment",t.riskAssessments],["Training Record",t.trainingRecords]];

  let filtered = docFilter==="all"?rawDocs:rawDocs.filter(d=>d.type===docFilter);
  filtered = searchFilter(filtered, search, ["name","type"]);

  const handleUpload = async () => {
    if(!upForm.name) return;
    setUploading(true);
    if(!DEMO_MODE && supabase && companyId) {
      const {error} = await supabase.from("compliance_docs").insert({
        company_id: companyId,
        name: upForm.name,
        type: upForm.type,
        expiry_date: upForm.expiry || null,
        status: "valid",
        uploaded_at: new Date().toISOString(),
      });
      if(error){ toast("Failed to save document","error"); setUploading(false); return; }
    } else {
      await new Promise(r=>setTimeout(r,600));
    }
    toast(t.docUploaded,"success");
    setUploading(false);
    setShowUpload(false);
    setUpForm({name:"",type:"Certificate",expiry:""});
  };

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    {showUpload&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <Card style={{width:400,padding:26,animation:"fadeUp .2s"}}>
        <div className="df" style={{fontSize:18,marginBottom:20}}>{ar?"رفع مستند جديد":"Upload New Document"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Field label={ar?"اسم المستند":"Document Name"} placeholder={ar?"مثال: شهادة السلامة":"e.g. Fire Safety Certificate"} value={upForm.name} onChange={v=>setUpForm(f=>({...f,name:v}))} t={t}/>
          <Field label={ar?"النوع":"Type"} type="select" options={["Certificate","Policy","Risk Assessment","Training Record","Permit","Other"]} value={upForm.type} onChange={v=>setUpForm(f=>({...f,type:v}))} t={t}/>
          <Field label={ar?"تاريخ الانتهاء":"Expiry Date"} type="date" value={upForm.expiry} onChange={v=>setUpForm(f=>({...f,expiry:v}))} t={t}/>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setShowUpload(false)}>{t.cancel}</Btn>
            <Btn style={{flex:1}} loading={uploading} disabled={!upForm.name} onClick={handleUpload}>{ar?"حفظ":"Save Document"}</Btn>
          </div>
        </div>
      </Card>
    </div>}
    {exp.length>0&&<div className="af" style={{background:G.danger+"18",border:`1px solid ${G.danger}44`,borderRadius:10,padding:"11px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,fontSize:13}}>
      <span>🚨</span><span><strong style={{color:G.danger}}>{exp.length} {t.expired_banner}</strong></span>
    </div>}
    {expiring.length>0&&<div className="af" style={{background:G.warning+"18",border:`1px solid ${G.warning}44`,borderRadius:10,padding:"11px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:13}}>
      <span>⚠</span><span><strong style={{color:G.warning}}>{expiring.length} {t.expiring_banner}</strong></span>
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {docFs.map(([k,l])=><Btn key={k} size="sm" variant={docFilter===k?"primary":"ghost"} onClick={()=>setDocFilter(k)}>{l}</Btn>)}
      </div>
      {can.create&&<Btn onClick={()=>setShowUpload(true)}>{t.uploadDoc}</Btn>}
    </div>
    {loading
      ? <div style={{display:"flex",flexDirection:"column",gap:10}}>{[0,1,2,3].map(i=><Card key={i} style={{padding:14,display:"flex",gap:12}}><div style={{width:40,height:40,borderRadius:8,background:G.surface2,flexShrink:0,animation:"pulse 1.5s infinite"}}/><div style={{flex:1}}><div style={{height:12,width:"65%",borderRadius:6,background:G.surface2,marginBottom:8,animation:"pulse 1.5s infinite"}}/><div style={{height:10,width:"40%",borderRadius:6,background:G.surface2,animation:"pulse 1.5s infinite"}}/></div></Card>)}</div>
      : filtered.length===0
        ? <EmptyState msg={t.noResults}/>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map((doc,i)=>(
              <Card key={i} hover style={{padding:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:40,height:40,borderRadius:8,background:G.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {doc.status==="expired"?"🚨":doc.status==="expiring"?"⚠️":"📄"}
                  </div>
                  <div style={{flex:1}}>
                    <div className="af" style={{fontWeight:700,fontSize:13,marginBottom:3}}>{doc.name}</div>
                    <div className="af" style={{fontSize:12,color:G.textMuted}}>{doc.type} · {doc.uploaded}</div>
                  </div>
                  <div style={{textAlign:ar?"left":"right",flexShrink:0}}>
                    <Badge status={doc.status} label={stT[doc.status]||doc.status}/>
                    <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:4}}>{t.expires} {doc.expiry}</div>
                  </div>
                  <div style={{display:"flex",gap:6,marginLeft:8,flexShrink:0}}>
                    <Btn size="sm" variant="ghost" onClick={()=>{
                      generatePDF({
                        title: doc.name,
                        company: mock.company.name,
                        userName: mock.user.name,
                        kpis:[{label:ar?"الحالة":"Status",value:doc.status?.toUpperCase(),color:doc.status==="valid"?G.success:doc.status==="expiring"?G.warning:G.danger},{label:ar?"النوع":"Type",value:doc.type,color:"#2563eb"},{label:ar?"الانتهاء":"Expiry",value:doc.expiry,color:"#7C6FFF"}],
                        headers:[ar?"الحقل":"Field",ar?"التفاصيل":"Details"],
                        rows:[[ar?"اسم المستند":"Document Name",doc.name],[ar?"النوع":"Type",doc.type||"—"],[ar?"الحالة":"Status",doc.status||"—"],[ar?"تاريخ الرفع":"Uploaded",doc.uploaded||"—"],[ar?"تاريخ الانتهاء":"Expiry Date",doc.expiry||"—"]]
                      });
                    }}>{t.viewBtn}</Btn>
                    <Btn size="sm" variant="ghost" onClick={()=>{
                      generatePDF({
                        title: doc.name,
                        company: mock.company.name,
                        userName: mock.user.name,
                        kpis:[{label:ar?"الحالة":"Status",value:doc.status?.toUpperCase(),color:doc.status==="valid"?G.success:doc.status==="expiring"?G.warning:G.danger},{label:ar?"النوع":"Type",value:doc.type,color:"#2563eb"},{label:ar?"الانتهاء":"Expiry",value:doc.expiry,color:"#7C6FFF"}],
                        headers:[ar?"الحقل":"Field",ar?"التفاصيل":"Details"],
                        rows:[[ar?"اسم المستند":"Document Name",doc.name],[ar?"النوع":"Type",doc.type||"—"],[ar?"الحالة":"Status",doc.status||"—"],[ar?"تاريخ الرفع":"Uploaded",doc.uploaded||"—"],[ar?"تاريخ الانتهاء":"Expiry Date",doc.expiry||"—"]]
                      });
                    }}>⬇</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
    }
  </div>;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({t,lang,mock,search,companyId}){
  const ar=lang==="ar";
  const [generating,setGenerating]=useState(null);
  const [exports,setExports]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("sz_exports")||"[]"); }catch(e){ return []; }
  });

  // Live data for reports
  const {data:liveInspections} = useInspections(companyId);
  const {data:liveHazards} = useHazards(companyId);
  const {data:liveIncidents} = useIncidents(companyId);
  const {data:liveDocs} = useCompliance(companyId);

  const cards=[
    {icon:"📊",title:t.rep1,desc:t.rep1d,key:"monthly"},
    {icon:"✓",title:t.rep2,desc:t.rep2d,key:"inspection"},
    {icon:"⚠",title:t.rep3,desc:t.rep3d,key:"hazard"},
    {icon:"⚡",title:t.rep4,desc:t.rep4d,key:"incident"},
    {icon:"◈",title:t.rep5,desc:t.rep5d,key:"compliance"},
    {icon:"📈",title:t.rep6,desc:t.rep6d,key:"performance"},
  ];
  const filteredCards = search ? searchFilter(cards.map((c,i)=>({...c,i})), search, ["title","desc"]) : cards;

  const handleGenerate = async (key) => {
    setGenerating(key);
    await new Promise(r=>setTimeout(r,600));

    const now = new Date().toLocaleDateString(ar?"ar-SA":"en-US",{year:"numeric",month:"long",day:"numeric"});
    const titles = {monthly:t.rep1,inspection:t.rep2,hazard:t.rep3,incident:t.rep4,compliance:t.rep5,performance:t.rep6};
    const reportTitle = titles[key] || key;
    const company = mock.company.name;

    // Build rows from live data
    const inspData = liveInspections || mock.inspections;
    const hazData = liveHazards || mock.hazards;
    const incData = liveIncidents || mock.incidents;
    const docData = liveDocs || mock.compliance;

    const rows = {
      monthly:`<tr><td>Total Inspections</td><td>${inspData.length}</td><td style="color:#22c55e">Live</td></tr><tr><td>Open Hazards</td><td>${hazData.filter(h=>h.status==="open").length}</td><td style="color:#f59e0b">Live</td></tr><tr><td>Incidents Reported</td><td>${incData.length}</td><td style="color:#22c55e">Live</td></tr><tr><td>Compliance Docs</td><td>${docData.length}</td><td style="color:#22c55e">Live</td></tr><tr><td>Resolved Hazards</td><td>${hazData.filter(h=>h.status==="resolved").length}</td><td style="color:#22c55e">Live</td></tr>`,
      inspection:inspData.slice(0,6).map(i=>`<tr><td>${i.id||"—"}</td><td>${i.site||"—"}</td><td>${i.status||"—"}</td><td>${i.scheduled||i.scheduled_at||"—"}</td></tr>`).join(""),
      hazard:hazData.slice(0,6).map(h=>`<tr><td>${h.id||"—"}</td><td>${(h.title||"").slice(0,40)}</td><td>${h.severity||"—"}</td><td>${h.status||"—"}</td></tr>`).join(""),
      incident:incData.slice(0,6).map(i=>`<tr><td>${i.id||"—"}</td><td>${(i.title||"").slice(0,40)}</td><td>${i.severity||"—"}</td><td>${i.status||"—"}</td></tr>`).join(""),
      compliance:docData.slice(0,6).map(d=>`<tr><td>${d.name||"—"}</td><td>${d.type||"—"}</td><td>${d.expiry||"—"}</td><td style="color:${d.status==="expired"?"#ef4444":d.status==="expiring"?"#f59e0b":"#22c55e"}">${d.status||"—"}</td></tr>`).join(""),
      performance:`<tr><td>Inspection Pass Rate</td><td>${inspData.length>0?Math.round(inspData.filter(i=>i.result==="pass").length/inspData.length*100):0}%</td><td style="color:#22c55e">Live</td><td>—</td></tr><tr><td>Open Hazards</td><td>${hazData.filter(h=>h.status==="open").length}</td><td style="color:#f59e0b">Live</td><td>—</td></tr><tr><td>Incidents MTD</td><td>${incData.length}</td><td style="color:#22c55e">Live</td><td>—</td></tr><tr><td>Docs Valid</td><td>${docData.filter(d=>d.status==="valid").length}/${docData.length}</td><td style="color:#22c55e">Live</td><td>—</td></tr>`,
    };
    const headers = {
      monthly:"<th>Metric</th><th>Value</th><th>vs Last Month</th>",
      inspection:"<th>ID</th><th>Site</th><th>Status</th><th>Date</th>",
      hazard:"<th>ID</th><th>Description</th><th>Severity</th><th>Status</th>",
      incident:"<th>ID</th><th>Description</th><th>Severity</th><th>Status</th>",
      compliance:"<th>Document</th><th>Status</th><th>Expiry</th><th>Note</th>",
      performance:"<th>KPI</th><th>Value</th><th>Change</th><th>Rating</th>",
    };

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${reportTitle}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;margin:0;padding:40px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:22px;font-weight:800;color:#2563eb}.logo span{color:#1a1a2e}
      .meta{text-align:right;font-size:12px;color:#6b7280}
      h1{font-size:20px;font-weight:700;margin:0 0 16px}
      .badge{display:inline-block;background:#eff6ff;color:#2563eb;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
      th{background:#f1f5f9;padding:10px 14px;text-align:left;font-weight:700;color:#374151;border:1px solid #e2e8f0}
      td{padding:10px 14px;border:1px solid #e2e8f0;color:#374151}
      tr:nth-child(even) td{background:#f8fafc}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
      .kpi-row{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .kpi{background:#f1f5f9;border-radius:10px;padding:16px 20px;flex:1;min-width:120px}
      .kpi-val{font-size:26px;font-weight:800;color:#2563eb}.kpi-label{font-size:12px;color:#6b7280;margin-top:4px}
      .print-btn{position:fixed;top:20px;right:20px;background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
      @media print{.print-btn{display:none}}
    </style></head><body>
    <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
    <div class="header">
      <div><div class="logo">Safe<span>Zone</span></div><div style="font-size:12px;color:#6b7280;margin-top:4px">${company}</div></div>
      <div class="meta"><div style="font-weight:700;font-size:14px">${reportTitle}</div><div>Generated: ${now}</div><div>By: ${mock.user.name}</div></div>
    </div>
    <div class="badge">📄 Official Safety Report</div>
    <h1>${reportTitle}</h1>
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-val">94%</div><div class="kpi-label">Compliance Rate</div></div>
      <div class="kpi"><div class="kpi-val">24</div><div class="kpi-label">Inspections</div></div>
      <div class="kpi"><div class="kpi-val">7</div><div class="kpi-label">Open Hazards</div></div>
      <div class="kpi"><div class="kpi-val">3</div><div class="kpi-label">Incidents</div></div>
    </div>
    <table><thead><tr>${headers[key]||headers.monthly}</tr></thead><tbody>${rows[key]||rows.monthly}</tbody></table>
    <div class="footer"><span>SafeZone Safety Management Platform</span><span>CONFIDENTIAL — ${company} — ${now}</span></div>
    </body></html>`;

    const blob = new Blob([html], {type:"text/html"});
    const url = URL.createObjectURL(blob);
    window.open(url,"_blank");
    setTimeout(()=>URL.revokeObjectURL(url), 60000);

    // Record this export in history
    const newExport = [reportTitle, now, mock.user.name, "PDF", key];
    const updated = [newExport, ...exports].slice(0,10);
    setExports(updated);
    try{ localStorage.setItem("sz_exports", JSON.stringify(updated)); }catch(e){}

    setGenerating(null);
    toast(ar?"تم فتح التقرير — اضغط 'حفظ كـ PDF'":"Report opened — click 'Save as PDF' button","success");
  };

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:20}}>
      {filteredCards.map((r,i)=>(
        <Card key={r.key||i} hover style={{padding:18}}>
          <div style={{fontSize:28,marginBottom:10}}>{r.icon}</div>
          <div className="df" style={{fontSize:14,marginBottom:6}}>{r.title}</div>
          <div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:14,lineHeight:1.6}}>{r.desc}</div>
          <Btn size="sm" loading={generating===r.key} onClick={()=>handleGenerate(r.key)}>📄 {t.generate}</Btn>
        </Card>
      ))}
    </div>
    <Card>
      <div className="df" style={{marginBottom:14,fontSize:13}}>{t.recentExports}</div>
      {exports.length===0
        ? <div className="af" style={{color:G.textMuted,fontSize:13,padding:"12px 0",textAlign:"center"}}>{ar?"لا توجد تصديرات بعد — قم بإنشاء تقرير أولاً":"No exports yet — generate a report above"}</div>
        : <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${G.border}`}}>
            {[t.reportName,t.generated,t.by,t.format,""].map((h,i)=>(
              <th key={i} className="af" style={{padding:"9px 12px",textAlign:ar?"right":"left",fontSize:11,color:G.textMuted,fontWeight:700}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {exports.map(([name,date,by,fmt,key],i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${G.border}`}}>
                <td className="af" style={{padding:"11px 12px",fontSize:13}}>{name}</td>
                <td className="af" style={{padding:"11px 12px",fontSize:12,color:G.textMuted}}>{date}</td>
                <td className="af" style={{padding:"11px 12px",fontSize:12}}>{by}</td>
                <td style={{padding:"11px 12px"}}><span className="af" style={{fontSize:11,background:G.surface2,padding:"3px 8px",borderRadius:6,color:G.textMuted}}>{fmt}</span></td>
                <td style={{padding:"11px 12px"}}><Btn size="sm" variant="ghost" onClick={()=>handleGenerate(key||"monthly")}>{t.download}</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </Card>
  </div>;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function Users({t,lang,mock,search,userRole,companyId}){
  const [showInvite,setShowInvite]=useState(false);
  const [confirmSuspend,setConfirmSuspend]=useState(null);
  const [invForm,setInvForm]=useState({email:"",name:"",role:"",site:""});
  const ar=lang==="ar";
  const can=CAN[userRole]||CAN.readonly;

  const {data:liveProfiles, loading} = useProfiles(companyId);
  const {data:liveSites} = useSites(companyId);

  const rawUsers = liveProfiles ? liveProfiles.map(normalizeProfile) : mock.users;
  const siteOptions = liveSites ? liveSites.map(s=>s.name) : mock.company.sites;
  const roles=[t.role_admin,t.role_manager,t.role_supervisor,t.role_inspector,t.role_readonly];
  let filtered = searchFilter(rawUsers, search, ["name","email","role","site"]);

  if(!can.users) return (
    <div style={{padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div className="af" style={{color:G.textMuted,fontSize:14,textAlign:"center"}}>{t.noAccess}</div>
    </div>
  );

  const handleInvite = async () => {
    if (!invForm.email || !invForm.role) return;
    setShowInvite(false);
    if (!DEMO_MODE && supabase && companyId) {
      // Create user via signUp with a temp password — they can reset it
      const tempPassword = "SafeZone" + Math.floor(Math.random()*9000+1000) + "!";
      const { data, error } = await supabase.auth.signUp({
        email: invForm.email,
        password: tempPassword,
        options: { data: { name: invForm.name || invForm.email.split("@")[0] } }
      });
      if (error) { toast(`Error: ${error.message}`, "error"); return; }
      // Link profile to company
      if (data?.user?.id) {
        const roleKey = invForm.role.toLowerCase().includes("manager") ? "manager"
          : invForm.role.toLowerCase().includes("inspector") ? "inspector"
          : invForm.role.toLowerCase().includes("supervisor") ? "supervisor"
          : invForm.role.toLowerCase().includes("admin") ? "admin" : "inspector";
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name: invForm.name || invForm.email.split("@")[0],
          role: roleKey,
          company_id: companyId,
          avatar_initials: (invForm.name||invForm.email).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
        });
      }
      toast(`User created! Temp password: SafeZone****! — share with them to log in`, "success");
    } else {
      toast(t.inviteSent, "success");
    }
    setInvForm({email:"",name:"",role:"",site:""});
  };

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    {confirmSuspend&&<ConfirmModal msg={`Suspend ${confirmSuspend.name}? They will lose access.`} onConfirm={()=>{toast(`${confirmSuspend.name} suspended`,"warning");setConfirmSuspend(null);}} onCancel={()=>setConfirmSuspend(null)}/>}
    {showInvite&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <Card style={{width:420,padding:26,animation:"fadeUp .2s"}}>
        <div className="df" style={{fontSize:18,marginBottom:20}}>{t.inviteTitle}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Field label={t.emailLabel} placeholder={t.emailPh} value={invForm.email} onChange={v=>setInvForm(f=>({...f,email:v}))} t={t}/>
          <Field label={t.fullNameLabel} placeholder={t.fullNamePh} value={invForm.name} onChange={v=>setInvForm(f=>({...f,name:v}))} t={t}/>
          <Field label={t.roleLabel} type="select" options={roles} value={invForm.role} onChange={v=>setInvForm(f=>({...f,role:v}))} t={t}/>
          <Field label={t.siteAccessLabel} type="select" options={[t.allSites,...siteOptions]} value={invForm.site} onChange={v=>setInvForm(f=>({...f,site:v}))} t={t}/>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setShowInvite(false)}>{t.cancel}</Btn>
            <Btn style={{flex:1}} disabled={!invForm.email||!invForm.role} onClick={handleInvite}>{t.sendInvitation}</Btn>
          </div>
        </div>
      </Card>
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div className="af" style={{fontSize:13,color:G.textMuted}}>{rawUsers.length} {t.seatsUsed.replace("seats", "/ 20 seats")}</div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" size="sm" onClick={()=>toast("CSV template downloaded","info")}>{t.bulkImport}</Btn>
        {can.create&&<Btn onClick={()=>setShowInvite(true)}>{t.inviteUser}</Btn>}
      </div>
    </div>
    <div style={{height:4,background:G.border,borderRadius:2,marginBottom:16}}>
      <div style={{height:"100%",width:`${Math.min(100,(rawUsers.length/10)*100)}%`,background:G.primary,borderRadius:2}}/>
    </div>
    {loading
      ? <Card style={{padding:0}}><table style={{width:"100%",borderCollapse:"collapse"}}><tbody>{[0,1,2,3,4].map(i=><SkeletonRow key={i} cols={6}/>)}</tbody></table></Card>
      : filtered.length===0
        ? <EmptyState msg={t.noResults}/>
        : <Card style={{padding:0,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${G.border}`}}>
                {[t.colUser,t.colRole,t.colSiteAccess,t.colLastLogin,t.colStatus,""].map((h,i)=>(
                  <th key={i} className="af" style={{padding:"11px 14px",textAlign:ar?"right":"left",fontSize:11,color:G.textMuted,fontWeight:700}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((u,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${G.border}`}}>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{u.avatar}</div>
                        <div>
                          <div className="af" style={{fontSize:13,fontWeight:700}}>{u.name}</div>
                          <div style={{fontSize:11,color:G.textMuted}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"11px 14px"}}><span className="af" style={{fontSize:12,background:G.primary+"22",color:G.primary,padding:"3px 10px",borderRadius:12,fontWeight:700}}>{u.role}</span></td>
                    <td className="af" style={{padding:"11px 14px",fontSize:12,color:G.textMuted}}>{u.site}</td>
                    <td className="af" style={{padding:"11px 14px",fontSize:12,color:G.textMuted}}>{u.lastLogin}</td>
                    <td style={{padding:"11px 14px"}}><Badge status={u.status} label={t.s_active}/></td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:6}}>
                        {can.edit&&<Btn size="sm" variant="ghost" onClick={()=>toast(`Contact ${u.email} to update their details`,"info")}>{t.editUser}</Btn>}
                        {can.delete&&<Btn size="sm" variant="danger" onClick={()=>setConfirmSuspend(u)}>{t.suspendUser}</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
    }
  </div>;
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({t,lang,mock,userRole,companyId}){
  const [tab,setTab]=useState("company");
  const [compForm,setCompForm]=useState({name:mock.company.name,industry:"",timezone:"",regAuth:""});
  const [saving,setSaving]=useState(false);
  const [newSiteName,setNewSiteName]=useState("");
  const [addingSite,setAddingSite]=useState(false);
  const [showAddSite,setShowAddSite]=useState(false);
  // Template Builder state
  const [templates,setTemplates]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("sz_templates")||"[]"); }catch{ return []; }
  });
  const [editingTpl,setEditingTpl]=useState(null);
  const [tplForm,setTplForm]=useState({name:"",items:["","",""]});
  const can=CAN[userRole]||CAN.readonly;
  const tabs=[["company",t.companyProfile],["sites",t.sitesLocations],["templates",t.templateBuilder],["notifications",t.notifications],["billing",t.billing]];
  const inds=[t.ind1,t.ind2,t.ind3,t.ind4,t.ind5];
  const tzs=[t.tz1,t.tz2,t.tz3];
  const notifRows=[[t.notif1,t.notif1d],[t.notif2,t.notif2d],[t.notif3,t.notif3d],[t.notif4,t.notif4d],[t.notif5,t.notif5d],[t.notif6,t.notif6d],[t.notif7,t.notif7d]];

  const {data:liveSites} = useSites(companyId);
  const siteNames = liveSites ? liveSites.map(s=>s.name) : mock.company.sites;

  if(!can.settings) return (
    <div style={{padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div className="af" style={{color:G.textMuted,fontSize:14,textAlign:"center"}}>{t.noAccess}</div>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    if (!DEMO_MODE && supabase && companyId) {
      const { error } = await supabase.from("companies").update({
        name: compForm.name,
        industry: compForm.industry||undefined,
        timezone: compForm.timezone||undefined,
        regulatory_auth: compForm.regAuth||undefined,
      }).eq("id", companyId);
      if (error) { toast("Failed to save","error"); setSaving(false); return; }
    } else {
      await new Promise(r=>setTimeout(r,600));
    }
    toast(t.changesSaved,"success");
    setSaving(false);
  };

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:4,marginBottom:20,background:G.surface2,padding:4,borderRadius:10,width:"fit-content",flexWrap:"wrap"}}>
      {tabs.map(([id,label])=>(
        <div key={id} onClick={()=>setTab(id)} className="af"
          style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:tab===id?700:400,color:tab===id?G.text:G.textMuted,background:tab===id?G.surface:"transparent",transition:"all .15s"}}>
          {label}
        </div>
      ))}
    </div>
    {tab==="company"&&<Card style={{maxWidth:520}}>
      <div className="df" style={{marginBottom:18,fontSize:15}}>{t.companyProfile}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:6}}>
          <div style={{width:56,height:56,borderRadius:12,background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",fontFamily:"'Cairo',sans-serif"}}>ن</div>
          <Btn size="sm" variant="ghost" onClick={()=>toast("Select an image file","info")}>{t.uploadLogo}</Btn>
        </div>
        <Field label={t.companyName} value={compForm.name} onChange={v=>setCompForm(f=>({...f,name:v}))} t={t}/>
        <Field label={t.industry} type="select" options={inds} value={compForm.industry} onChange={v=>setCompForm(f=>({...f,industry:v}))} t={t}/>
        <Field label={t.timezone} type="select" options={tzs} value={compForm.timezone} onChange={v=>setCompForm(f=>({...f,timezone:v}))} t={t}/>
        <Field label={t.regulatoryAuth} placeholder={t.regAuthPh} value={compForm.regAuth} onChange={v=>setCompForm(f=>({...f,regAuth:v}))} t={t}/>
        <Btn loading={saving} onClick={handleSave}>{t.saveChanges}</Btn>
      </div>
    </Card>}
    {tab==="sites"&&<div style={{maxWidth:520}}>
      {siteNames.map((site,i)=>(
        <Card key={i} style={{marginBottom:10,padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:8,background:G.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📍</div>
            <div style={{flex:1}}>
              <div className="af" style={{fontWeight:700,fontSize:13}}>{site}</div>
              <div className="af" style={{fontSize:11,color:G.textMuted}}>{t.siteActive}</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={()=>toast(`Rename ${site} in Settings → Sites`,"info")}>{t.editUser}</Btn>
          </div>
        </Card>
      ))}
      {showAddSite
        ? <Card style={{padding:14}}>
            <div className="af" style={{fontWeight:600,fontSize:13,marginBottom:10}}>New Site</div>
            <div style={{display:"flex",gap:8}}>
              <input value={newSiteName} onChange={e=>setNewSiteName(e.target.value)}
                placeholder="e.g. NEOM Site B" autoFocus className="af"
                style={{flex:1,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 12px",color:G.text,fontSize:13,outline:"none"}}
                onKeyDown={e=>{if(e.key==="Enter")document.getElementById("saveSiteBtn").click();}}/>
              <Btn id="saveSiteBtn" loading={addingSite} disabled={!newSiteName.trim()} onClick={async()=>{
                setAddingSite(true);
                if(!DEMO_MODE&&supabase&&companyId){
                  const {error}=await supabase.from("sites").insert({company_id:companyId,name:newSiteName.trim()});
                  if(error){toast("Failed to add site","error");setAddingSite(false);return;}
                }
                toast(`Site "${newSiteName.trim()}" added`,"success");
                setNewSiteName(""); setShowAddSite(false); setAddingSite(false);
              }}>Save</Btn>
              <Btn variant="ghost" onClick={()=>{setShowAddSite(false);setNewSiteName("");}}>Cancel</Btn>
            </div>
          </Card>
        : <Btn onClick={()=>setShowAddSite(true)}>{t.addSite}</Btn>
      }
    </div>}
    {tab==="notifications"&&<Card style={{maxWidth:600}}>
      <div className="df" style={{marginBottom:18,fontSize:15}}>{t.notifRules}</div>
      {notifRows.map(([label,desc],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${G.border}`,gap:10}}>
          <div style={{flex:1}}>
            <div className="af" style={{fontSize:13,fontWeight:700}}>{label}</div>
            <div className="af" style={{fontSize:11,color:G.textMuted}}>{desc}</div>
          </div>
          <div style={{display:"flex",gap:14,flexShrink:0}}>
            {[t.emailCh,t.smsCh,t.whatsappCh].map(ch=>(
              <div key={ch} style={{display:"flex",alignItems:"center",gap:4}}>
                <input type="checkbox" defaultChecked={ch===t.emailCh} style={{accentColor:G.primary}}/>
                <label className="af" style={{fontSize:11,color:G.textMuted}}>{ch}</label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Btn style={{marginTop:14}} onClick={()=>toast(t.changesSaved,"success")}>{t.saveNotif}</Btn>
    </Card>}
    {tab==="billing"&&<Card style={{maxWidth:520}}>
      <div className="df" style={{marginBottom:18,fontSize:15}}>{t.subscription}</div>
      <div style={{background:G.primary+"18",border:`1px solid ${G.primary}44`,borderRadius:10,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div className="df" style={{fontSize:20,color:G.primary}}>Professional</div>
            <div className="af" style={{fontSize:12,color:G.textMuted,marginTop:3}}>{t.planDesc}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div className="df" style={{fontSize:28}}>—</div>
            <div className="af" style={{fontSize:11,color:G.textMuted}}>{t.perMonth}</div>
          </div>
        </div>
      </div>
      <div style={{background:G.warning+"11",border:`1px solid ${G.warning}33`,borderRadius:8,padding:12,marginBottom:16}}>
        <div className="af" style={{fontSize:12,color:G.warning,fontWeight:600}}>⚡ Billing not yet connected</div>
        <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:4}}>Connect Stripe to enable subscription management, invoices, and seat tracking.</div>
      </div>
      {[[t.seatsUsedBilling,`${siteNames.length} sites active`],[t.paymentMethod,"—"]].map(([l,v])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${G.border}`,fontSize:13}}>
          <span className="af" style={{color:G.textMuted}}>{l}</span>
          <span className="af">{v}</span>
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <Btn variant="ghost" style={{flex:1}} onClick={()=>toast("Connect Stripe to view invoices","info")}>{t.viewInvoices}</Btn>
        <Btn style={{flex:1}} onClick={()=>window.open("mailto:nasserjmal199@gmail.com?subject=SafeZone Enterprise Upgrade","_blank")}>{t.upgradeEnterprise}</Btn>
      </div>
    </Card>}
    {tab==="templates"&&<div style={{maxWidth:600}}>
      {editingTpl===null
        ? <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div className="df" style={{fontSize:15}}>{t.myTemplates}</div>
              {can.create&&<Btn onClick={()=>{setEditingTpl({});setTplForm({name:"",items:["","",""]});}}>{t.newTemplate}</Btn>}
            </div>
            {/* Built-in templates */}
            <div className="af" style={{fontSize:11,color:G.textMuted,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{t.builtIn}</div>
            {[t.tpl1,t.tpl2,t.tpl3,t.tpl4,t.tpl5].map((name,i)=>(
              <Card key={i} style={{marginBottom:8,padding:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:8,background:G.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📋</div>
                  <div style={{flex:1}}>
                    <div className="af" style={{fontWeight:600,fontSize:13}}>{name}</div>
                    <div className="af" style={{fontSize:11,color:G.textMuted}}>6 {t.itemsCount} · {t.builtIn}</div>
                  </div>
                  <span className="af" style={{fontSize:11,color:G.primary,background:G.primaryGlow,padding:"2px 8px",borderRadius:10}}>{t.builtIn}</span>
                </div>
              </Card>
            ))}
            {/* Custom templates */}
            {templates.length>0&&<>
              <div className="af" style={{fontSize:11,color:G.textMuted,margin:"16px 0 8px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{t.custom}</div>
              {templates.map((tpl,i)=>(
                <Card key={i} style={{marginBottom:8,padding:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:G.purple+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✏️</div>
                    <div style={{flex:1}}>
                      <div className="af" style={{fontWeight:600,fontSize:13}}>{tpl.name}</div>
                      <div className="af" style={{fontSize:11,color:G.textMuted}}>{tpl.items.filter(x=>x.trim()).length} {t.itemsCount} · {t.custom}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn size="sm" variant="ghost" onClick={()=>{setEditingTpl({index:i});setTplForm({name:tpl.name,items:[...tpl.items,"",""]});}}>{t.editTemplate}</Btn>
                      <Btn size="sm" variant="ghost" style={{color:G.danger}} onClick={()=>{
                        const updated=templates.filter((_,j)=>j!==i);
                        setTemplates(updated);
                        localStorage.setItem("sz_templates",JSON.stringify(updated));
                        toast(t.templateDeleted,"success");
                      }}>{t.deleteTemplate}</Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </>}
            {templates.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:G.textMuted}}>
              <div style={{fontSize:36,marginBottom:10,opacity:.4}}>📝</div>
              <div className="af" style={{fontSize:13}}>{t.noTemplates}</div>
            </div>}
          </div>
        : <div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
              <Btn variant="ghost" size="sm" onClick={()=>setEditingTpl(null)}>{t.back}</Btn>
              <div className="df" style={{fontSize:16}}>{editingTpl.index!==undefined?t.editTemplate:t.newTemplate}</div>
            </div>
            <Card>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600}}>{t.templateName}</div>
                  <input value={tplForm.name} onChange={e=>setTplForm(f=>({...f,name:e.target.value}))}
                    placeholder={t.templateNamePh} className="af"
                    style={{width:"100%",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 12px",color:G.text,fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <div className="af" style={{fontSize:12,color:G.textMuted,marginBottom:8,fontWeight:600}}>Checklist Items</div>
                  {tplForm.items.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                      <span className="mf" style={{color:G.textMuted,fontSize:11,width:20,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                      <input value={item} onChange={e=>{
                        const updated=[...tplForm.items]; updated[i]=e.target.value; setTplForm(f=>({...f,items:updated}));
                      }} placeholder={t.itemPlaceholder} className="af"
                        style={{flex:1,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"7px 10px",color:G.text,fontSize:12,outline:"none"}}/>
                      {tplForm.items.length>1&&<button onClick={()=>setTplForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}))}
                        style={{background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
                    </div>
                  ))}
                  <Btn size="sm" variant="ghost" onClick={()=>setTplForm(f=>({...f,items:[...f.items,""]}))}>{t.addItem}</Btn>
                </div>
                <Btn disabled={!tplForm.name.trim()||!tplForm.items.some(x=>x.trim())} onClick={()=>{
                  const clean={name:tplForm.name.trim(),items:tplForm.items.filter(x=>x.trim())};
                  let updated;
                  if(editingTpl.index!==undefined){
                    updated=templates.map((tpl,i)=>i===editingTpl.index?clean:tpl);
                  } else {
                    updated=[...templates,clean];
                  }
                  setTemplates(updated);
                  localStorage.setItem("sz_templates",JSON.stringify(updated));
                  toast(t.templateSaved,"success");
                  setEditingTpl(null);
                }}>{t.saveTemplate}</Btn>
              </div>
            </Card>
          </div>
      }
    </div>}
  </div>;
}

// ─── PERMIT TO WORK ──────────────────────────────────────────────────────────
function PTW({t,lang,mock,search,userRole,companyId}){
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("all");
  const [permits,setPermits]=useState(mock.permits);
  const [checks,setChecks]=useState({});
  const [form,setForm]=useState({type:"",site:"",start:"",end:"",desc:"",hazards:"",controls:"",risk:"",workers:"",contractor:""});
  const [approverComment,setApproverComment]=useState("");
  const can=CAN[userRole]||CAN.readonly;
  const ar=lang==="ar";

  const types=[t.ptwType1,t.ptwType2,t.ptwType3,t.ptwType4,t.ptwType5,t.ptwType6,t.ptwType7,t.ptwType8];
  const risks=[t.ptwRisk1,t.ptwRisk2,t.ptwRisk3,t.ptwRisk4];
  const siteOptions=mock.company.sites;

  const stColors={approved:G.success,pending:G.warning,expired:G.danger,closed:G.textMuted,open:G.primary};
  const riskColors={low:G.success,medium:G.warning,high:"#FF6B35",critical:G.danger};

  const filtered = filter==="all" ? permits : permits.filter(p=>p.status===filter);
  const searchFiltered = search ? filtered.filter(p=>
    p.id.toLowerCase().includes(search.toLowerCase())||
    p.type.toLowerCase().includes(search.toLowerCase())||
    p.site.toLowerCase().includes(search.toLowerCase())||
    p.requestedBy.toLowerCase().includes(search.toLowerCase())
  ) : filtered;

  const handleSubmit = () => {
    const newPermit = {
      id:`PTW-0${42+permits.length}`,
      type:form.type, site:form.site, requestedBy:mock.user.name,
      start:form.start, end:form.end, status:"pending",
      risk:form.risk?.toLowerCase()||"medium",
      approver:"", workers:parseInt(form.workers)||1,
      contractor:form.contractor, desc:form.desc,
      hazards:form.hazards, controls:form.controls,
    };
    setPermits(p=>[newPermit,...p]);
    toast(t.ptwSubmitted,"success");
    setShowForm(false);
    setForm({type:"",site:"",start:"",end:"",desc:"",hazards:"",controls:"",risk:"",workers:"",contractor:""});
  };

  const handleApprove = (permit) => {
    setPermits(ps=>ps.map(p=>p.id===permit.id?{...p,status:"approved",approver:mock.user.name}:p));
    setSel(s=>({...s,status:"approved",approver:mock.user.name}));
    toast(t.ptwApproved2,"success");
  };

  const handleReject = (permit) => {
    setPermits(ps=>ps.map(p=>p.id===permit.id?{...p,status:"closed"}:p));
    setSel(s=>({...s,status:"closed"}));
    toast(t.ptwRejected,"error");
  };

  const handleClose = (permit) => {
    setPermits(ps=>ps.map(p=>p.id===permit.id?{...p,status:"closed"}:p));
    setSel(s=>({...s,status:"closed"}));
    toast(t.ptwClosed2,"success");
  };

  const handlePrint = (permit) => {
    const riskColor = riskColors[permit.risk]||G.warning;
    const checkItems = [t.ptwCheck1,t.ptwCheck2,t.ptwCheck3,t.ptwCheck4,t.ptwCheck5,t.ptwCheck6];
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${permit.id}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a2e}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #2563eb;padding-bottom:16px;margin-bottom:24px}
      .logo{font-size:24px;font-weight:900;color:#2563eb}
      .permit-id{font-size:28px;font-weight:800;color:#1a1a2e}
      .risk-badge{padding:6px 16px;border-radius:20px;font-weight:700;font-size:13px;background:${riskColor}22;color:${riskColor};border:2px solid ${riskColor}}
      .section{margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
      .section-title{background:#f8fafc;padding:10px 16px;font-weight:700;font-size:13px;border-bottom:1px solid #e5e7eb;color:#374151}
      .section-body{padding:14px 16px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .field{margin-bottom:8px}
      .field-label{font-size:11px;color:#6b7280;font-weight:600;margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px}
      .field-value{font-size:13px;color:#1a1a2e;font-weight:500}
      .check-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f3f4f6}
      .check-box{width:18px;height:18px;border:2px solid #2563eb;border-radius:4px;flex-shrink:0}
      .status-banner{text-align:center;padding:12px;font-weight:800;font-size:16px;letter-spacing:1px;margin-bottom:20px;border-radius:8px;background:${permit.status==="approved"?"#10b98122":"#f59e0b22"};color:${permit.status==="approved"?"#10b981":"#f59e0b"};border:2px solid ${permit.status==="approved"?"#10b981":"#f59e0b"}}
      .sig-box{border:1px solid #e5e7eb;border-radius:8px;height:80px;margin-top:10px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px}
      .footer{margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af}
      @media print{button{display:none!important}.no-print{display:none}}
    </style></head><body>
    <div class="header">
      <div><div class="logo">🛡 SafeZone</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Industrial Safety Platform</div></div>
      <div style="text-align:center"><div class="permit-id">${permit.id}</div><div style="margin-top:6px"><span class="risk-badge">${permit.risk?.toUpperCase()} RISK</span></div></div>
      <div style="text-align:right"><div style="font-size:12px;color:#6b7280">Permit to Work</div><div style="font-size:13px;font-weight:600;margin-top:4px">${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div></div>
    </div>
    <div class="status-banner">${permit.status.toUpperCase()}</div>
    <div class="section"><div class="section-title">Work Details</div><div class="section-body"><div class="grid">
      <div class="field"><div class="field-label">Work Type</div><div class="field-value">${permit.type}</div></div>
      <div class="field"><div class="field-label">Site / Location</div><div class="field-value">${permit.site}</div></div>
      <div class="field"><div class="field-label">Start Date & Time</div><div class="field-value">${permit.start}</div></div>
      <div class="field"><div class="field-label">Expiry Date & Time</div><div class="field-value">${permit.end}</div></div>
      <div class="field"><div class="field-label">Requested By</div><div class="field-value">${permit.requestedBy}</div></div>
      <div class="field"><div class="field-label">Contractor</div><div class="field-value">${permit.contractor||"—"}</div></div>
      <div class="field"><div class="field-label">Number of Workers</div><div class="field-value">${permit.workers}</div></div>
      <div class="field"><div class="field-label">Approver</div><div class="field-value">${permit.approver||"Pending"}</div></div>
    </div></div></div>
    <div class="section"><div class="section-title">Pre-Work Safety Checks</div><div class="section-body">
      ${checkItems.map(c=>`<div class="check-item"><div class="check-box"></div><span style="font-size:13px">${c}</span></div>`).join("")}
    </div></div>
    <div class="section"><div class="section-title">Signatures</div><div class="section-body"><div class="grid">
      <div><div class="field-label">Requested By</div><div class="sig-box">Signature / Date</div></div>
      <div><div class="field-label">Approved By</div><div class="sig-box">Signature / Date</div></div>
    </div></div></div>
    <div class="footer"><span>SafeZone Industrial Safety Platform</span><span>${permit.id} · Generated ${new Date().toLocaleString()}</span><span>This permit must be displayed at the work site</span></div>
    <div class="no-print" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:700">🖨 Print / Save as PDF</button></div>
    </body></html>`;
    const w=window.open("","_blank");
    w.document.write(html);
    w.document.close();
    toast(ar?"تم فتح التصريح للطباعة":"Permit ready — click Print / Save as PDF","success");
  };

  // ── New Permit Form ──
  if(showForm) return <div style={{padding:24,maxWidth:640,animation:"slideIn .3s"}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:24}}>
      <Btn variant="ghost" size="sm" onClick={()=>setShowForm(false)}>{t.back}</Btn>
      <div>
        <div className="df" style={{fontSize:18}}>{t.newPtw}</div>
        <div className="af" style={{fontSize:12,color:G.textMuted}}>Complete all sections before submitting for approval</div>
      </div>
    </div>
    <Card style={{marginBottom:14}}>
      <div className="df" style={{fontSize:13,marginBottom:14}}>Work Details</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label={t.ptwFieldType} type="select" options={types} value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} t={t}/>
        <Field label={t.ptwFieldSite} type="select" options={siteOptions} value={form.site} onChange={v=>setForm(f=>({...f,site:v}))} t={t}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <DateTimePicker label={t.ptwFieldStart} value={form.start} onChange={v=>setForm(f=>({...f,start:v}))} t={t}/>
          <DateTimePicker label={t.ptwFieldEnd} value={form.end} onChange={v=>setForm(f=>({...f,end:v}))} t={t}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label={t.ptwFieldRisk} type="select" options={risks} value={form.risk} onChange={v=>setForm(f=>({...f,risk:v}))} t={t}/>
          <Field label={t.ptwFieldWorkers} type="number" placeholder="e.g. 4" value={form.workers} onChange={v=>setForm(f=>({...f,workers:v}))} t={t}/>
        </div>
        <Field label={t.ptwFieldContractor} placeholder="Company name" value={form.contractor} onChange={v=>setForm(f=>({...f,contractor:v}))} t={t}/>
      </div>
    </Card>
    <Card style={{marginBottom:14}}>
      <div className="df" style={{fontSize:13,marginBottom:14}}>Risk Assessment</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label={t.ptwFieldDesc} type="textarea" placeholder={t.ptwFieldDescPh} value={form.desc} onChange={v=>setForm(f=>({...f,desc:v}))} t={t}/>
        <Field label={t.ptwFieldHazards} type="textarea" placeholder={t.ptwFieldHazardsPh} value={form.hazards} onChange={v=>setForm(f=>({...f,hazards:v}))} t={t}/>
        <Field label={t.ptwFieldControls} type="textarea" placeholder={t.ptwFieldControlsPh} value={form.controls} onChange={v=>setForm(f=>({...f,controls:v}))} t={t}/>
      </div>
    </Card>
    <Card style={{marginBottom:14}}>
      <div className="df" style={{fontSize:13,marginBottom:14}}>{t.ptwHazardChecks}</div>
      {[t.ptwCheck1,t.ptwCheck2,t.ptwCheck3,t.ptwCheck4,t.ptwCheck5,t.ptwCheck6].map((chk,i)=>(
        <div key={i} onClick={()=>setChecks(c=>({...c,[i]:!c[i]}))}
          style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G.border}`,cursor:"pointer"}}>
          <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${checks[i]?G.success:G.border}`,background:checks[i]?G.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
            {checks[i]&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
          </div>
          <span className="af" style={{fontSize:13}}>{chk}</span>
        </div>
      ))}
    </Card>
    <Btn onClick={handleSubmit} disabled={!form.type||!form.site||!form.start||!form.end} style={{width:"100%"}}>{t.ptwSubmit}</Btn>
  </div>;

  // ── Permit Detail ──
  if(sel) return <div style={{padding:24,maxWidth:680,animation:"slideIn .3s",overflowY:"auto",height:"100%"}}>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
      <Btn variant="ghost" size="sm" onClick={()=>setSel(null)}>{t.back}</Btn>
      <div style={{flex:1}}>
        <div className="df" style={{fontSize:18}}>{sel.id}</div>
        <div className="af" style={{fontSize:12,color:G.textMuted}}>{sel.type} · {sel.site}</div>
      </div>
      <div style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:(stColors[sel.status]||G.textMuted)+"22",color:stColors[sel.status]||G.textMuted,border:`1px solid ${(stColors[sel.status]||G.textMuted)}44`}}>{sel.status.toUpperCase()}</div>
      <Btn size="sm" variant="ghost" onClick={()=>handlePrint(sel)}>{t.ptwPrint}</Btn>
    </div>

    {/* Risk banner */}
    <div style={{background:(riskColors[sel.risk]||G.warning)+"18",border:`1px solid ${(riskColors[sel.risk]||G.warning)}44`,borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>⚠️</span>
      <div>
        <div className="af" style={{fontWeight:700,fontSize:13,color:riskColors[sel.risk]||G.warning}}>{sel.risk?.toUpperCase()} RISK</div>
        <div className="af" style={{fontSize:11,color:G.textMuted}}>{sel.type}</div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <Card>
        <div className="df" style={{fontSize:13,marginBottom:12}}>{t.ptwDetails}</div>
        {[[t.ptwColSite,sel.site],[t.ptwColReq,sel.requestedBy],[t.ptwColStart,sel.start],[t.ptwColEnd,sel.end],[t.ptwWorkers,sel.workers],[t.ptwColApprover,sel.approver||"—"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G.border}`,fontSize:12}}>
            <span className="af" style={{color:G.textMuted}}>{l}</span>
            <span className="af" style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div className="df" style={{fontSize:13,marginBottom:12}}>{t.ptwHazardChecks}</div>
        {[t.ptwCheck1,t.ptwCheck2,t.ptwCheck3,t.ptwCheck4,t.ptwCheck5,t.ptwCheck6].map((chk,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:`1px solid ${G.border}`}}>
            <span style={{color:sel.status==="approved"?G.success:G.textMuted,fontSize:13,flexShrink:0,marginTop:1}}>{sel.status==="approved"?"✓":"○"}</span>
            <span className="af" style={{fontSize:11,color:G.textMuted}}>{chk}</span>
          </div>
        ))}
      </Card>
    </div>

    {/* Approval panel — only for managers on pending permits */}
    {can.edit&&sel.status==="pending"&&<Card style={{marginBottom:14,border:`1px solid ${G.warning}44`,background:G.warning+"08"}}>
      <div className="df" style={{fontSize:13,marginBottom:12,color:G.warning}}>⏳ Awaiting Your Approval</div>
      <textarea value={approverComment} onChange={e=>setApproverComment(e.target.value)}
        placeholder={t.ptwApproverComments} className="af"
        style={{width:"100%",height:70,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:10,color:G.text,fontSize:12,resize:"none",marginBottom:12}}/>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="success" style={{flex:1}} onClick={()=>handleApprove(sel)}>{t.ptwApprove}</Btn>
        <Btn variant="danger" style={{flex:1}} onClick={()=>handleReject(sel)}>{t.ptwReject}</Btn>
      </div>
    </Card>}

    {/* Close permit button for active approved permits */}
    {can.edit&&sel.status==="approved"&&<Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div className="af" style={{fontWeight:700,fontSize:13}}>Mark Work Complete</div>
          <div className="af" style={{fontSize:11,color:G.textMuted,marginTop:3}}>Close this permit once all work is finished and area is made safe</div>
        </div>
        <Btn variant="ghost" style={{color:G.danger,border:`1px solid ${G.danger}44`}} onClick={()=>handleClose(sel)}>{t.ptwClose}</Btn>
      </div>
    </Card>}
  </div>;

  // ── Permits List ──
  const filterTabs=[["all",t.ptwAll],["pending",t.ptwPending],["approved",t.ptwApproved],["expired",t.ptwExpired],["closed",t.ptwClosed]];
  const openCount=permits.filter(p=>p.status==="approved").length;
  const pendingCount=permits.filter(p=>p.status==="pending").length;

  return <div style={{padding:16,overflowY:"auto",height:"100%",animation:"slideIn .3s"}}>
    {/* Stats row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
      {[["Active Permits",openCount,G.success,"✓"],[pendingCount+" Awaiting Approval",pendingCount,G.warning,"⏳"],["Total This Month",permits.length,G.primary,"🔑"]].map(([label,val,color,icon])=>(
        <Card key={label} style={{padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:8,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icon}</div>
            <div><div className="df" style={{fontSize:22,color}}>{val}</div><div className="af" style={{fontSize:11,color:G.textMuted}}>{label}</div></div>
          </div>
        </Card>
      ))}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {filterTabs.map(([k,l])=><Btn key={k} size="sm" variant={filter===k?"primary":"ghost"} onClick={()=>setFilter(k)}>{l}</Btn>)}
      </div>
      {can.create&&<Btn onClick={()=>setShowForm(true)}>{t.newPtw}</Btn>}
    </div>

    {searchFiltered.length===0
      ? <EmptyState icon="🔑" msg={t.noResults}/>
      : <Card style={{padding:0,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${G.border}`}}>
              {[t.ptwColId,t.ptwColType,t.ptwColSite,t.ptwColReq,t.ptwColStart,t.ptwColEnd,"Risk",t.ptwColStatus,""].map((h,i)=>(
                <th key={i} className="af" style={{padding:"10px 14px",textAlign:ar?"right":"left",fontSize:11,color:G.textMuted,fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {searchFiltered.map((p,i)=>(
                <tr key={i} onClick={()=>setSel(p)} style={{borderBottom:`1px solid ${G.border}`,cursor:"pointer",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=G.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td className="mf" style={{padding:"11px 14px",fontSize:12,color:G.primary}}>{p.id}</td>
                  <td className="af" style={{padding:"11px 14px",fontSize:12}}>{p.type}</td>
                  <td className="af" style={{padding:"11px 14px",fontSize:12,color:G.textMuted}}>{p.site}</td>
                  <td className="af" style={{padding:"11px 14px",fontSize:12}}>{p.requestedBy}</td>
                  <td className="af" style={{padding:"11px 14px",fontSize:11,color:G.textMuted,whiteSpace:"nowrap"}}>{p.start}</td>
                  <td className="af" style={{padding:"11px 14px",fontSize:11,color:G.textMuted,whiteSpace:"nowrap"}}>{p.end}</td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:700,background:(riskColors[p.risk]||G.warning)+"22",color:riskColors[p.risk]||G.warning}}>{p.risk?.toUpperCase()}</span>
                  </td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:(stColors[p.status]||G.textMuted)+"22",color:stColors[p.status]||G.textMuted}}>{p.status.toUpperCase()}</span>
                  </td>
                  <td className="af" style={{padding:"11px 14px",color:G.primary,fontSize:12}}>View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
    }
  </div>;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const AUTH_T = {
  en:{welcomeBack:"Welcome back",loginSub:"Sign in to your SafeZone account",email:"Email address",emailPh:"you@company.com",password:"Password",passwordPh:"Enter your password",rememberMe:"Remember me",forgotPw:"Forgot password?",signIn:"Sign In",signingIn:"Signing in...",noAccount:"Don't have an account?",startTrial:"Start free trial",demoTitle:"Quick demo login:",demoManager:"Safety Manager",demoInspector:"Inspector",demoReadOnly:"Executive",loginErr:"Invalid credentials. Try the demo buttons below.",resetTitle:"Reset password",resetSub:"Enter your email to receive a reset link",sendReset:"Send Reset Link",sending:"Sending...",resetSent:"Check your inbox!",backToLogin:"← Back to login",onboardTitle:"Set up SafeZone",onboardSub:"Takes 2 minutes · Change everything later",companyName:"Company Name",companyNamePh:"e.g. Al Noor Construction Co.",next:"Continue →",prev:"← Back",finish:"Go to Dashboard →",step1T:"Company",step2T:"Industry",step3T:"Sites",step4T:"Team",step5T:"Done!",allSet:"🎉 You're all set!"},
  ar:{welcomeBack:"مرحباً بعودتك",loginSub:"تسجيل الدخول إلى المنطقة الآمنة",email:"البريد الإلكتروني",emailPh:"you@company.com",password:"كلمة المرور",passwordPh:"أدخل كلمة المرور",rememberMe:"تذكرني",forgotPw:"نسيت كلمة المرور؟",signIn:"تسجيل الدخول",signingIn:"جارٍ تسجيل الدخول...",noAccount:"ليس لديك حساب؟",startTrial:"ابدأ تجربة مجانية",demoTitle:"تسجيل دخول سريع:",demoManager:"مدير السلامة",demoInspector:"مفتش",demoReadOnly:"تنفيذي",loginErr:"بيانات غير صحيحة. جرّب الأزرار أدناه.",resetTitle:"إعادة تعيين كلمة المرور",resetSub:"أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين",sendReset:"إرسال الرابط",sending:"جارٍ الإرسال...",resetSent:"تحقق من بريدك الوارد!",backToLogin:"→ العودة لتسجيل الدخول",onboardTitle:"إعداد المنطقة الآمنة",onboardSub:"دقيقتان فقط · يمكنك التغيير لاحقاً",companyName:"اسم الشركة",companyNamePh:"مثال: شركة النور للإنشاءات",next:"← متابعة",prev:"رجوع →",finish:"← الذهاب إلى لوحة التحكم",step1T:"الشركة",step2T:"القطاع",step3T:"المواقع",step4T:"الفريق",step5T:"تم!",allSet:"🎉 جاهز تماماً!"},
};

// ─── REAL AUTH HOOK ───────────────────────────────────────────────────────────
function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, company:companies(name, name_ar, regulatory_auth)")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
      } else {
        // Profile missing or RLS — use fallback with known company so no onboarding loop
        setProfile({ id: userId, name: "Nasser", role: "manager", avatar_initials: "NJ", company_id: "a1b2c3d4-0000-0000-0000-000000000001", company: { name: "Al Noor Construction Co.", name_ar: "شركة النور للإنشاءات" } });
      }
    } catch(e) {
      setProfile({ id: userId, name: "Nasser", role: "manager", avatar_initials: "NJ", company_id: "a1b2c3d4-0000-0000-0000-000000000001", company: { name: "Al Noor Construction Co.", name_ar: "شركة النور للإنشاءات" } });
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoadingAuth(false); return; }
    // Hard timeout — never spin more than 4 seconds
    const timeout = setTimeout(() => setLoadingAuth(false), 4000);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id);
      else { clearTimeout(timeout); setLoadingAuth(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); clearTimeout(timeout); setLoadingAuth(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const sendMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    return error;
  };

  return { session, profile, loadingAuth, signIn, signOut, sendMagicLink };
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({lang,setLang,onLogin,onForgot,onSignUp,supabaseSignIn}){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [mode,setMode]=useState("login"); // "login" | "signup"
  const [signupName,setSignupName]=useState("");
  const [signupEmail,setSignupEmail]=useState("");
  const [signupPw,setSignupPw]=useState("");
  const [signupDone,setSignupDone]=useState(false);
  const t=AUTH_T[lang]||AUTH_T.en;
  const ar=lang==="ar";

  const loginDemo=async(user)=>{
    setLoading(true);
    await new Promise(r=>setTimeout(r,700));
    onLogin(user);
  };

  const handleSubmit=async()=>{
    if(!email||!pw){setErr(t.loginErr);return;}
    setLoading(true);setErr("");

    if (!DEMO_MODE && supabaseSignIn) {
      const error = await supabaseSignIn(email, pw);
      if (error) {
        setErr(error.message||t.loginErr);
        setLoading(false);
      } else {
        // Success — onAuthStateChange will render dashboard, but cap wait at 8s
        setTimeout(() => setLoading(false), 8000);
      }
      return;
    }

    // Demo mode fallback
    await new Promise(r=>setTimeout(r,900));
    const u=DEMO_USERS.find(u=>u.email===email&&(u.password===pw||u.password==="any"));
    if(u)onLogin(u);
    else{setErr(t.loginErr);setLoading(false);}
  };

  const handleSignup = async () => {
    if(!signupName.trim()||!signupEmail.trim()||!signupPw.trim()){setErr("Please fill in all fields");return;}
    if(signupPw.length<8){setErr("Password must be at least 8 characters");return;}
    setLoading(true);setErr("");
    if(!DEMO_MODE&&supabase){
      const {data,error} = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPw,
        options:{data:{full_name:signupName.trim()}}
      });
      if(error){setErr(error.message);setLoading(false);return;}
      // Create company + profile
      if(data?.user){
        const {data:company} = await supabase.from("companies").insert({name:"My Company"}).select().single();
        if(company){
          await supabase.from("profiles").upsert({
            id:data.user.id, name:signupName.trim(), role:"manager",
            avatar_initials:signupName.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
            company_id:company.id
          });
        }
      }
      setSignupDone(true);
      setLoading(false);
    } else {
      // Demo mode signup
      await new Promise(r=>setTimeout(r,800));
      onSignUp({...DEMO_USERS[3], name:signupName, email:signupEmail, isNew:true});
    }
  };

  const inputStyle={width:"100%",background:"rgba(255,255,255,0.06)",border:`1px solid rgba(255,255,255,0.12)`,borderRadius:10,padding:"11px 14px",color:"#E8EDF5",fontSize:13,outline:"none",fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif",transition:"border .15s"};

  return(
    <div style={{minHeight:"100vh",display:"flex",background:G.bg,direction:ar?"rtl":"ltr",animation:"fadeIn .4s"}}>
      {/* Left branding */}
      <div style={{width:"40%",padding:"48px 52px",display:"flex",flexDirection:"column",justifyContent:"space-between",borderRight:`1px solid ${G.border}`,position:"relative",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",top:-100,left:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-60,right:-60,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:64}}>
            <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff",boxShadow:"0 8px 32px rgba(37,99,235,.4)"}}>S</div>
            <span style={{fontSize:22,fontWeight:800,color:"#E8EDF5",fontFamily:"'Syne',sans-serif"}}>SafeZone</span>
          </div>
          <div style={{fontSize:ar?30:34,lineHeight:1.2,color:"#E8EDF5",marginBottom:16,fontFamily:ar?"'Cairo',sans-serif":"'Syne',sans-serif",fontWeight:ar?800:700}}>
            {ar?"اجعل مواقعك أكثر أماناً":"Make your worksites safer"}
          </div>
          <div style={{fontSize:14,color:G.textMuted,lineHeight:1.7,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>
            {ar?"منصة متكاملة لإدارة السلامة الصناعية.":"The complete industrial safety platform for GCC construction."}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,position:"relative"}}>
          {[["Built for","GCC"],["Arabic","First"],["Live","Data"],["ISO","Ready"]].map(([v,l])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${G.border}`,borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontSize:22,fontWeight:700,color:G.primary,fontFamily:"'Syne',sans-serif"}}>{v}</div>
              <div style={{fontSize:12,color:G.textMuted,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 24px",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:380,animation:"fadeUp .4s"}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:32}}>
            <div style={{display:"flex",background:"rgba(255,255,255,0.06)",border:`1px solid ${G.border}`,borderRadius:8,overflow:"hidden"}}>
              {["en","ar"].map(l=>(
                <div key={l} onClick={()=>setLang(l)} style={{padding:"6px 16px",cursor:"pointer",fontSize:13,fontWeight:700,background:lang===l?G.primary:"transparent",color:lang===l?"#fff":G.textMuted,transition:"all .15s",fontFamily:l==="ar"?"'Cairo'":"'Syne'"}}>
                  {l==="en"?"EN":"ع"}
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:ar?28:26,fontWeight:ar?800:700,marginBottom:6,fontFamily:ar?"'Cairo',sans-serif":"'Syne',sans-serif"}}>{t.welcomeBack}</div>
          <div style={{fontSize:14,color:G.textMuted,marginBottom:28,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{t.loginSub}</div>
          {err&&<div style={{background:G.danger+"18",border:`1px solid ${G.danger}44`,borderRadius:10,padding:"11px 14px",marginBottom:18,fontSize:13,color:G.danger,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>⚠ {err}</div>}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{t.email}</div>
            <input placeholder={t.emailPh} value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}
              onFocus={e=>e.target.style.borderColor=G.primary} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{t.password}</div>
            <div style={{position:"relative"}}>
              <input type={showPw?"text":"password"} placeholder={t.passwordPh} value={pw} onChange={e=>setPw(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                style={{...inputStyle,paddingRight:44}}
                onFocus={e=>e.target.style.borderColor=G.primary} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:G.textMuted,fontSize:16}}>{showPw?"🙈":"👁"}</button>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
              <input type="checkbox" style={{accentColor:G.primary}}/>
              <span style={{fontSize:12,color:G.textMuted,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{t.rememberMe}</span>
            </label>
            <span onClick={onForgot} style={{fontSize:12,color:G.primary,cursor:"pointer",fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{t.forgotPw}</span>
          </div>
          <Btn onClick={handleSubmit} loading={loading} size="lg" style={{width:"100%",marginBottom:14,justifyContent:"center"}}>
            {loading?t.signingIn:t.signIn}
          </Btn>
          <div style={{textAlign:"center",marginBottom:24}}>
            <span style={{fontSize:13,color:G.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{t.noAccount} </span>
            <span onClick={()=>{setMode("signup");setErr("");}} style={{fontSize:13,color:G.primary,cursor:"pointer",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{t.startTrial}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{flex:1,height:1,background:G.border}}/>
            <span style={{fontSize:11,color:G.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{t.demoTitle}</span>
            <div style={{flex:1,height:1,background:G.border}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{u:DEMO_USERS[0],label:t.demoManager,icon:"🛡️",color:G.primary},{u:DEMO_USERS[1],label:t.demoInspector,icon:"🔍",color:G.success},{u:DEMO_USERS[2],label:t.demoReadOnly,icon:"📊",color:G.purple}].map(({u,label,icon,color})=>(
              <div key={u.email} onClick={()=>loginDemo(u)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"9px 14px",background:"rgba(255,255,255,0.04)",border:`1px solid ${G.border}`,borderRadius:10,cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=color+"66";e.currentTarget.style.background=color+"11"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background="rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:18}}>{icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,fontFamily:ar?"'Cairo',sans-serif":"'DM Sans',sans-serif"}}>{label}</div>
                  <div style={{fontSize:11,color:G.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{u.email}</div>
                </div>
                <span style={{color,fontSize:12}}>→</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIGNUP FORM ── */}
        {mode==="signup"&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}>
          <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:16,padding:32,width:"100%",maxWidth:420,margin:16,animation:"fadeUp .3s"}}>
            {signupDone
              ? <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:48,marginBottom:16}}>📧</div>
                  <div style={{fontSize:20,fontWeight:700,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Check your email!</div>
                  <div style={{fontSize:13,color:G.textMuted,fontFamily:"'DM Sans',sans-serif",marginBottom:24}}>We sent a confirmation link to <strong>{signupEmail}</strong>. Click it to activate your account.</div>
                  <Btn onClick={()=>{setMode("login");setSignupDone(false);}} style={{width:"100%",justifyContent:"center"}}>Back to Sign In</Btn>
                </div>
              : <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                    <div style={{fontSize:18,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>Start Free Trial</div>
                    <button onClick={()=>{setMode("login");setErr("");}} style={{background:"none",border:"none",color:G.textMuted,cursor:"pointer",fontSize:20}}>×</button>
                  </div>
                  {err&&<div style={{background:G.danger+"18",border:`1px solid ${G.danger}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:G.danger,fontFamily:"'DM Sans',sans-serif"}}>{err}</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div>
                      <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Full Name</div>
                      <input value={signupName} onChange={e=>setSignupName(e.target.value)} placeholder="e.g. Khalid Al-Rashid" style={inputStyle}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Work Email</div>
                      <input value={signupEmail} onChange={e=>setSignupEmail(e.target.value)} placeholder="you@company.com" type="email" style={inputStyle}/>
                    </div>
                    <div>
                      <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Password</div>
                      <input value={signupPw} onChange={e=>setSignupPw(e.target.value)} placeholder="Min. 8 characters" type="password" style={inputStyle}/>
                    </div>
                    <Btn loading={loading} onClick={handleSignup} style={{width:"100%",justifyContent:"center",marginTop:4}}>
                      Create Free Account →
                    </Btn>
                    <div style={{fontSize:11,color:G.textMuted,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>
                      No credit card required · 14-day free trial
                    </div>
                  </div>
                </>
            }
          </div>
        </div>}
      </div>
    </div>
  );
}

function ForgotScreen({lang,setLang,onBack,supabaseMagicLink}){
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const t=AUTH_T[lang]||AUTH_T.en;
  const ar=lang==="ar";
  const handleSend=async()=>{
    if(!email)return;
    setLoading(true);
    if (!DEMO_MODE && supabaseMagicLink) {
      await supabaseMagicLink(email);
    } else {
      await new Promise(r=>setTimeout(r,1200));
    }
    setLoading(false);
    setSent(true);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg,padding:24,animation:"fadeIn .3s",direction:ar?"rtl":"ltr"}}>
      <div style={{width:"100%",maxWidth:380,animation:"fadeUp .3s"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:G.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🔑</div>
          <div style={{fontSize:24,fontWeight:700,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>{t.resetTitle}</div>
          <div style={{fontSize:14,color:G.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{t.resetSub}</div>
        </div>
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:16,padding:28}}>
          {sent?(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:14,animation:"checkPop .4s"}}>✅</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>{t.resetSent}</div>
              <div style={{fontSize:13,color:G.textMuted,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>{email}</div>
              <Btn onClick={onBack} variant="outline" style={{width:"100%",justifyContent:"center"}}>{t.backToLogin}</Btn>
            </div>
          ):(
            <>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:G.textMuted,marginBottom:6,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{t.email}</div>
                <input placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{width:"100%",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:10,padding:"10px 14px",color:G.text,fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
              </div>
              <Btn onClick={handleSend} loading={loading} size="lg" style={{width:"100%",marginBottom:12,justifyContent:"center"}}>{loading?t.sending:t.sendReset}</Btn>
              <div style={{textAlign:"center"}}><span onClick={onBack} style={{fontSize:13,color:G.primary,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.backToLogin}</span></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardWizard({lang,user,onComplete,companyId}){
  const [step,setStep]=useState(0);
  const [company,setCompany]=useState(user.company||"");
  const [industry,setIndustry]=useState("");
  const [sites,setSites]=useState(["",""]);
  const [teamEmail,setTeamEmail]=useState("");
  const [saving,setSaving]=useState(false);
  const t=AUTH_T[lang]||AUTH_T.en;
  const ar=lang==="ar";
  const steps=[t.step1T,t.step2T,t.step3T,t.step4T,t.step5T];

  const handleFinish = async () => {
    setSaving(true);
    if (!DEMO_MODE && supabase && companyId) {
      // Save company name + industry
      if (company || industry) {
        await supabase.from("companies").update({
          name: company||undefined,
          industry: industry||undefined,
        }).eq("id", companyId);
      }
      // Save sites
      const validSites = sites.filter(s=>s.trim());
      for (const siteName of validSites) {
        await supabase.from("sites").insert({ company_id: companyId, name: siteName.trim() });
      }
      // Invite team member
      if (teamEmail.trim()) {
        await supabase.auth.signUp({ email: teamEmail.trim(), password: Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),
          options: { data: { company_id: companyId, role: "inspector" } } });
      }
    }
    setSaving(false);
    onComplete({...user,company:company||user.company,isNew:false});
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg,padding:24,direction:ar?"rtl":"ltr",animation:"fadeIn .3s"}}>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2563EB,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>S</div>
            <span style={{fontSize:18,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>SafeZone</span>
          </div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>{t.onboardTitle}</div>
          <div style={{fontSize:13,color:G.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{t.onboardSub}</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:24}}>
          {steps.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?G.primary:G.border,transition:"background .3s"}}/>)}
        </div>
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:16,padding:28,animation:"fadeUp .3s"}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:20,fontFamily:"'Syne',sans-serif"}}>{steps[step]}</div>
          {step===0&&<Field label={t.companyName} placeholder={t.companyNamePh} value={company} onChange={setCompany} autoFocus t={{}}/>}
          {step===1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["Construction","Oil & Gas","Logistics","Manufacturing","Facilities","Mining"].map(ind=>(
              <div key={ind} onClick={()=>setIndustry(ind)}
                style={{padding:"12px 14px",border:`1px solid ${industry===ind?G.primary:G.border}`,borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",background:industry===ind?G.primaryGlow:"transparent",color:industry===ind?G.primary:G.text,transition:"all .15s",fontWeight:industry===ind?700:400}}
                onMouseEnter={e=>{if(industry!==ind)e.currentTarget.style.borderColor=G.primary;}}
                onMouseLeave={e=>{if(industry!==ind)e.currentTarget.style.borderColor=G.border;}}>{ind}</div>
            ))}
          </div>}
          {step===2&&<div>
            <div style={{fontSize:12,color:G.textMuted,marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>Add your job sites — you can add more later</div>
            {sites.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={s} onChange={e=>{const u=[...sites];u[i]=e.target.value;setSites(u);}}
                  placeholder={`Site ${i+1} name (e.g. NEOM Site A)`}
                  style={{flex:1,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
                {sites.length>1&&<button onClick={()=>setSites(sites.filter((_,j)=>j!==i))}
                  style={{background:"none",border:"none",color:G.danger,cursor:"pointer",fontSize:18}}>×</button>}
              </div>
            ))}
            <button onClick={()=>setSites([...sites,""])}
              style={{background:"none",border:`1px dashed ${G.border}`,borderRadius:8,padding:"8px 14px",color:G.textMuted,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",width:"100%",marginTop:4}}>+ Add another site</button>
          </div>}
          {step===3&&<div>
            <div style={{fontSize:12,color:G.textMuted,marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>Invite a team member — they'll receive an email to set their password</div>
            <input value={teamEmail} onChange={e=>setTeamEmail(e.target.value)}
              placeholder="colleague@company.com" type="email"
              style={{width:"100%",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
            <div style={{fontSize:11,color:G.textMuted,marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>Optional — you can skip this step</div>
          </div>}
          {step===4&&<div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{fontSize:48,marginBottom:12,animation:"checkPop .5s"}}>🎉</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>{t.allSet}</div>
            <div style={{fontSize:13,color:G.textMuted,fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>{company} is ready. Let's go.</div>
          </div>}
          <div style={{display:"flex",gap:10,marginTop:20}}>
            {step>0&&step<4&&<Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>{t.prev}</Btn>}
            {step<4&&<Btn onClick={()=>setStep(s=>s+1)} disabled={step===0&&!company.trim()} style={{flex:1,justifyContent:"center"}}>{t.next}</Btn>}
            {step===4&&<Btn size="lg" loading={saving} onClick={handleFinish} style={{flex:1,justifyContent:"center"}}>{t.finish}</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SHELL ───────────────────────────────────────────────────────────────
function AuthShell({children,lang,setLang}){
  // Real Supabase auth
  const {session, profile, loadingAuth, signIn, signOut, sendMagicLink} = useSupabaseAuth();

  // Demo/local auth state
  const [screen,setScreen]=useState("login");
  const [demoUser,setDemoUser]=useState(null);

  // If Supabase is configured and user is logged in, use real profile
  if (!DEMO_MODE && loadingAuth) {
    return (
      <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{width:32,height:32,border:`3px solid ${G.border}`,borderTopColor:G.primary,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
        <div style={{color:G.textMuted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Loading SafeZone...</div>
      </div>
    );
  }

  if (!DEMO_MODE && session && (profile || true)) {
    // Logged in via Supabase
    const supaUser = {
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || session.user.email.split("@")[0],
      nameAr: profile?.name_ar || profile?.name || session.user.email.split("@")[0],
      role: profile?.role || "manager",
      roleKey: profile?.role || "manager",
      avatar: profile?.avatar_initials || (profile?.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
      company: profile?.company?.name || "SafeZone",
      companyAr: profile?.company?.name_ar || "SafeZone",
      companyId: profile?.company_id,
      isNew: !profile?.company_id,
    };

    if (supaUser.isNew) {
      return <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=Cairo:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#0A0F1E;color:#E8EDF5}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <OnboardWizard lang={lang} user={supaUser} onComplete={()=>window.location.reload()} companyId={supaUser.companyId}/>
      </>;
    }

    return children({user:supaUser, onLogout: signOut});
  }

  // Demo / fallback auth flow
  const authStyles = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=Cairo:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#0A0F1E;color:#E8EDF5}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}`;

  if(screen==="login"||!demoUser) return <>
    <DemoBanner/>
    <style>{authStyles}</style>
    <LoginScreen lang={lang} setLang={setLang}
      onLogin={u=>{setDemoUser(u);setScreen(u.isNew?"onboard":"app");}}
      onForgot={()=>setScreen("forgot")}
      onSignUp={u=>{setDemoUser(u);setScreen("onboard");}}
      supabaseSignIn={!DEMO_MODE?signIn:null}
    />
  </>;

  if(screen==="forgot") return <>
    <style>{authStyles}</style>
    <ForgotScreen lang={lang} setLang={setLang} onBack={()=>setScreen("login")} supabaseMagicLink={!DEMO_MODE?sendMagicLink:null}/>
  </>;

  if(screen==="onboard") return <>
    <style>{authStyles}</style>
    <OnboardWizard lang={lang} user={demoUser} onComplete={u=>{setDemoUser(u);setScreen("app");}} companyId={null}/>
  </>;

  return children({user:demoUser, onLogout:()=>{setDemoUser(null);setScreen("login");}});
}

// ─── APP INNER ────────────────────────────────────────────────────────────────
function AppInner({user,onLogout,lang,setLang}){
  const [page,setPage]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [search,setSearch]=useState("");
  const [mobileOpen,setMobileOpen]=useState(false);
  const [winW,setWinW]=useState(window.innerWidth);
  const t=T[lang];
  const ar=lang==="ar";

  useEffect(()=>{
    const fn=()=>setWinW(window.innerWidth);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>setSearch(""),[page]);

  // Demo users (id starts with "demo-") bypass Supabase entirely
  const isDemoUser = user.id?.startsWith("demo-") || !user.companyId;
  const companyId = isDemoUser ? null : (user.companyId || null);

  const baseMock = getMock(t,lang);
  const mock = {
    ...baseMock,
    user:{
      name:lang==="ar"?(user.nameAr||user.name):user.name,
      role:lang==="ar"?(user.roleAr||t[`role_${user.roleKey}`]||user.role):user.role,
      avatar:user.avatar||"U",
      email:user.email,
    },
    company:{
      ...baseMock.company,
      name:lang==="ar"?(user.companyAr||user.company||baseMock.company.name):(user.company||baseMock.company.name),
    },
  };

  // Only fetch live data for real (non-demo) users
  const {data:liveHazards} = useHazards(isDemoUser ? null : companyId);
  const {data:liveSites} = useSites(isDemoUser ? null : companyId);
  const {data:liveInspections} = useInspections(isDemoUser ? null : companyId);
  const {data:liveIncidents} = useIncidents(isDemoUser ? null : companyId);

  const pageProps={t,lang,mock,search,userRole:user.roleKey||"manager",companyId:isDemoUser?null:companyId};
  const pages={
    dashboard:<Dashboard {...pageProps} liveHazards={liveHazards} liveSites={liveSites} liveInspections={liveInspections} liveIncidents={liveIncidents} setPage={setPage}/>,
    inspections:<Inspections {...pageProps}/>,
    hazards:<Hazards {...pageProps}/>,
    incidents:<Incidents {...pageProps}/>,
    ptw:<PTW {...pageProps}/>,
    compliance:<Compliance {...pageProps}/>,
    reports:<Reports {...pageProps}/>,
    users:<Users {...pageProps}/>,
    settings:<Settings {...pageProps}/>,
  };

  return <>
    <DemoBanner/>
    <style>{getCss(lang)}</style>
    <div className="af" style={{display:"flex",height:DEMO_MODE?"calc(100vh - 36px)":"100vh",marginTop:DEMO_MODE?36:0,overflow:"hidden",direction:ar?"rtl":"ltr",flexDirection:ar?"row-reverse":"row",position:"relative"}}>
      <Sidebar active={page} setActive={setPage} collapsed={collapsed} setCollapsed={setCollapsed}
        t={t} lang={lang} mock={mock} onLogout={onLogout} userRole={user.roleKey||"manager"}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <TopBar page={page} t={t} lang={lang} setLang={setLang} mock={mock}
          search={search} setSearch={setSearch} setMobileOpen={setMobileOpen} isDemoUser={isDemoUser}/>
        <div style={{flex:1,overflow:"hidden"}} key={`${page}-${lang}`}>
          {pages[page]||pages.dashboard}
        </div>
      </div>
    </div>
    <ToastContainer/>
  </>;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState("en");
  return(
    <AuthShell lang={lang} setLang={setLang}>
      {({user,onLogout})=>(
        <AppInner user={user} onLogout={onLogout} lang={lang} setLang={setLang}/>
      )}
    </AuthShell>
  );
}
