import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Papa from 'papaparse';
import {
  Users,
  Mail,
  Phone,
  Search,
  Sparkles,
  Save,
  MessageCircle,
  Send,
  X,
  GripVertical,
  Plus,
  Trash2,
  Filter,
  Download,
  Upload,
  FolderOpen,
  Edit2,
  MoreVertical,
  Gift,
  Trophy,
  Star,
  Settings,
  Clock,
  ChevronDown,
  ChevronUp,
  Bell,
  AlertCircle,
  Calendar,
  Flag,
  CheckCircle,
  PhoneCall,
  LayoutGrid,
  List,
  DollarSign,
} from 'lucide-react';

// Always parse DB timestamps as UTC (PostgreSQL returns without 'Z', may use space instead of 'T')
function parseTS(ts) {
  if (!ts) return new Date(0);
  // Already a Date object
  if (ts instanceof Date) return ts;
  const s = String(ts).trim();
  // Already has timezone indicator — parse as-is
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  // ISO-like with T separator but no zone — treat as UTC
  if (s.includes('T')) return new Date(s + 'Z');
  // Space-separated (PostgreSQL default) — normalize to T then treat as UTC
  return new Date(s.replace(' ', 'T').replace(/\.\d+$/, '') + 'Z');
}

function fmtTime(ts) {
  const d = parseTS(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDateTime(ts) {
  const d = parseTS(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// Wraps horizontally-scrollable content and shows a floating scrollbar pinned to the
// viewport bottom when the content's native scrollbar is below the fold. Once the
// container's bottom scrolls into view, the floating bar hides and the native
// scrollbar at the bottom of the cards list takes over.
function StickyHorizontalScroller({ children, className = '' }) {
  const containerRef = useRef(null);
  const floatingRef = useRef(null);
  const [bar, setBar] = useState({ visible: false, contentWidth: 0, clientWidth: 0, left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let syncing = false;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      const viewH = window.innerHeight;
      const overflowing = container.scrollWidth > container.clientWidth + 1;
      const visible = overflowing && rect.bottom > viewH + 4 && rect.top < viewH;
      setBar({
        visible,
        contentWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
        left: rect.left,
        width: rect.width,
      });
    };

    const onContainerScroll = () => {
      if (syncing) return;
      const f = floatingRef.current;
      if (!f) return;
      syncing = true;
      f.scrollLeft = container.scrollLeft;
      syncing = false;
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    container.addEventListener('scroll', onContainerScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      container.removeEventListener('scroll', onContainerScroll);
    };
  }, []);

  useEffect(() => {
    const f = floatingRef.current;
    const c = containerRef.current;
    if (!f || !c) return;
    const onScroll = () => {
      if (c.scrollLeft !== f.scrollLeft) c.scrollLeft = f.scrollLeft;
    };
    f.addEventListener('scroll', onScroll, { passive: true });
    // Seed the floating bar's position to match the container
    f.scrollLeft = c.scrollLeft;
    return () => f.removeEventListener('scroll', onScroll);
  }, [bar.visible, bar.contentWidth]);

  return (
    <>
      <div ref={containerRef} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      {bar.visible && (
        <div
          ref={floatingRef}
          className="fixed z-30 overflow-x-auto bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_6px_rgba(0,0,0,0.05)]"
          style={{ bottom: 0, left: bar.left, width: bar.width, height: 14 }}
        >
          <div style={{ width: bar.contentWidth, height: 1 }} />
        </div>
      )}
    </>
  );
}

// Card renderer for the Booking Revenue / Transaction Revenue drill-down modal.
// Shows the customer + service/transaction info and an editable notes field that
// saves on blur (or debounced on change for snappier feedback).
function DrilldownCard({ item, kind, onSaveNote }) {
  const initialNote = kind === 'bookings' ? (item.job_notes || '') : (item.notes || '');
  const [note, setNote] = useState(initialNote);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const saveTimer = useRef(null);

  const scheduleSave = (value) => {
    setNote(value);
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await onSaveNote(value);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
    }, 700);
  };

  if (kind === 'bookings') {
    const dateStr = item.booking_date
      ? new Date(item.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    const statusColor = item.status === 'completed' ? 'bg-green-100 text-green-700'
      : item.status === 'cancelled' ? 'bg-red-100 text-red-700'
      : item.status === 'confirmed' ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-700';
    return (
      <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{item.customer_name || '—'}</p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-500">
              {item.customer_email && <span className="truncate">{item.customer_email}</span>}
              {item.customer_phone && <span>{item.customer_phone}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-green-700">${parseFloat(item.total_amount || 0).toFixed(2)}</p>
            <span className={`inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {item.status || 'booked'}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{dateStr}{item.start_time ? ` · ${item.start_time}` : ''}</span>
          </div>
          {item.services && (
            <div className="flex items-start gap-2 text-gray-600">
              <Sparkles className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
              <span className="flex-1">{item.services}</span>
            </div>
          )}
          {item.source && <div className="text-[11px] text-gray-400">Source: {item.source}</div>}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Notes</label>
            {saveState === 'saving' && <span className="text-[10px] text-gray-400">Saving...</span>}
            {saveState === 'saved' && <span className="text-[10px] text-green-600">Saved ✓</span>}
          </div>
          <textarea
            value={note}
            onChange={e => scheduleSave(e.target.value)}
            placeholder="Add a note about this booking..."
            rows={2}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>
      </div>
    );
  }

  // transactions
  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const net = parseFloat(item.amount || 0) - parseFloat(item.refund_amount || 0);
  const customer = item.customer_name || item.booking_customer_name || '—';
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{customer}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-500">
            {item.customer_email && <span className="truncate">{item.customer_email}</span>}
            {item.customer_phone && <span>{item.customer_phone}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-green-700">${net.toFixed(2)}</p>
          {parseFloat(item.refund_amount || 0) > 0 && (
            <p className="text-[10px] text-red-500">refund ${parseFloat(item.refund_amount).toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="capitalize">{item.processor || 'payment'}</span>
          {item.card_brand && <span>· {item.card_brand}{item.card_last_four ? ` ****${item.card_last_four}` : ''}</span>}
        </div>
        {item.invoice_number && <div className="text-[11px] text-gray-400">Invoice #{item.invoice_number}</div>}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Notes</label>
          {saveState === 'saving' && <span className="text-[10px] text-gray-400">Saving...</span>}
          {saveState === 'saved' && <span className="text-[10px] text-green-600">Saved ✓</span>}
        </div>
        <textarea
          value={note}
          onChange={e => scheduleSave(e.target.value)}
          placeholder="Add a note about this transaction..."
          rows={2}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>
    </div>
  );
}

export default function CustomersLeads({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTabRaw] = useState(() => localStorage.getItem('crmActiveTab') || 'analytics');
  const setActiveTab = (t) => {
    setActiveTabRaw(t);
    if (t) localStorage.setItem('crmActiveTab', t);
  };
  const [leadTables, setLeadTables] = useState([
    { id: 'default', name: 'All Leads', leads: [] }
  ]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [smsConversation, setSmsConversation] = useState([]);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [newSmsMessage, setNewSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [activeLeadTable, setActiveLeadTable] = useState('default');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [editingTableName, setEditingTableName] = useState(null);
  const [newRecord, setNewRecord] = useState({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationType, setConversationType] = useState('chat'); // 'chat' | 'sms'
  const [smsLeads, setSmsLeads] = useState([]);
  const [selectedSmsLead, setSelectedSmsLead] = useState(null);
  const [smsLeadMessages, setSmsLeadMessages] = useState([]);
  const [loadingSmsLeads, setLoadingSmsLeads] = useState(false);
  const [loadingSmsMessages, setLoadingSmsMessages] = useState(false);
  const [viewingLeadEditMode, setViewingLeadEditMode] = useState(false);
  const [viewingLeadEdit, setViewingLeadEdit] = useState({});
  const [viewingLeadSmsMessages, setViewingLeadSmsMessages] = useState([]);
  const [viewingLeadSmsLoading, setViewingLeadSmsLoading] = useState(false);
  const [viewingLeadChatMessages, setViewingLeadChatMessages] = useState([]);
  const [viewingLeadChatLoading, setViewingLeadChatLoading] = useState(false);
  const [viewingLeadConvTab, setViewingLeadConvTab] = useState('sms'); // 'sms' | 'chat'
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [viewingCustomerEditMode, setViewingCustomerEditMode] = useState(false);
  const [viewingCustomerEdit, setViewingCustomerEdit] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Enhanced lead detail
  const [viewingLeadDetail, setViewingLeadDetail] = useState(null);
  const [viewingLeadDetailLoading, setViewingLeadDetailLoading] = useState(false);

  // Source filter for leads
  const [sourceFilter, setSourceFilter] = useState('all');

  // Board vs table view for leads
  const [leadViewMode, setLeadViewMode] = useState('board');

  // Analytics tab
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [totalBookingRevenue, setTotalBookingRevenue] = useState(0);
  const [totalTransactionRevenue, setTotalTransactionRevenue] = useState(0);
  const [totalTransactionTax, setTotalTransactionTax] = useState(0);

  // Analytics date range
  const [analyticsRange, setAnalyticsRange] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('analyticsRange') || 'null');
      if (saved && saved.preset) return saved;
    } catch {}
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const iso = (d) => d.toISOString().slice(0, 10);
    return { preset: 'this_month', startDate: iso(first), endDate: iso(now) };
  });
  const [showRangeMenu, setShowRangeMenu] = useState(false);

  const applyRangePreset = (preset) => {
    const iso = (d) => d.toISOString().slice(0, 10);
    const now = new Date();
    let startDate = null, endDate = null;
    if (preset === 'this_month') {
      startDate = iso(new Date(now.getFullYear(), now.getMonth(), 1));
      endDate = iso(now);
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = iso(first); endDate = iso(last);
    } else if (preset === 'last_3_months') {
      const s = new Date(now); s.setMonth(s.getMonth() - 3);
      startDate = iso(s); endDate = iso(now);
    } else if (preset === 'last_6_months') {
      const s = new Date(now); s.setMonth(s.getMonth() - 6);
      startDate = iso(s); endDate = iso(now);
    } else if (preset === 'this_year') {
      startDate = iso(new Date(now.getFullYear(), 0, 1)); endDate = iso(now);
    } else if (preset === 'all_time') {
      startDate = null; endDate = null;
    }
    const next = { preset, startDate, endDate };
    setAnalyticsRange(next);
    localStorage.setItem('analyticsRange', JSON.stringify(next));
    setShowRangeMenu(false);
  };

  const setCustomRange = (field, value) => {
    const next = { ...analyticsRange, preset: 'custom', [field]: value };
    setAnalyticsRange(next);
    localStorage.setItem('analyticsRange', JSON.stringify(next));
  };

  const rangeLabel = (() => {
    const map = {
      this_month: 'This Month',
      last_month: 'Last Month',
      last_3_months: 'Last 3 Months',
      last_6_months: 'Last 6 Months',
      this_year: 'This Year',
      all_time: 'All Time',
      custom: 'Custom',
    };
    return map[analyticsRange.preset] || 'This Month';
  })();
  const [adSpendEntries, setAdSpendEntries] = useState([]);
  const [showAdSpendModal, setShowAdSpendModal] = useState(false);

  // Revenue drill-down modal ('bookings' | 'transactions' | null)
  const [revenueDrilldown, setRevenueDrilldown] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownItems, setDrilldownItems] = useState([]);
  const [drilldownSearch, setDrilldownSearch] = useState('');

  const openRevenueDrilldown = async (kind) => {
    setRevenueDrilldown(kind);
    setDrilldownSearch('');
    setDrilldownItems([]);
    setDrilldownLoading(true);
    try {
      const qs = new URLSearchParams();
      if (analyticsRange.startDate) qs.set('startDate', analyticsRange.startDate);
      if (analyticsRange.endDate) qs.set('endDate', analyticsRange.endDate);
      const endpoint = kind === 'bookings' ? 'bookings' : 'transactions';
      const url = `${apiUrl}/api/leads/analytics/${endpoint}${qs.toString() ? '?' + qs.toString() : ''}`;
      const res = await authFetch(url).then(r => r.json());
      setDrilldownItems(kind === 'bookings' ? (res.bookings || []) : (res.transactions || []));
    } catch (e) {
      console.error('Drill-down fetch failed:', e);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const closeRevenueDrilldown = () => {
    setRevenueDrilldown(null);
    setDrilldownItems([]);
  };

  const saveDrilldownNote = async (id, note) => {
    const endpoint = revenueDrilldown === 'bookings' ? 'bookings' : 'transactions';
    try {
      await authFetch(`${apiUrl}/api/leads/analytics/${endpoint}/${id}/note`, {
        method: 'PUT',
        body: JSON.stringify({ note })
      });
    } catch (e) {
      console.error('Save note failed:', e);
    }
  };
  const [adSpendForm, setAdSpendForm] = useState({ source: '', amount: '', month: new Date().toISOString().slice(0, 7), notes: '' });

  // Ad platform connections
  const [adConnections, setAdConnections] = useState([]);
  const [adConnecting, setAdConnecting] = useState(null); // platform being connected
  const [adSyncing, setAdSyncing] = useState(null); // platform being synced
  const [adConnectToast, setAdConnectToast] = useState(null); // { type: 'success'|'error', platform }
  const [adVerifications, setAdVerifications] = useState([]); // [{ platform, email, status }]
  const [showVerifyModal, setShowVerifyModal] = useState(null); // platform key
  const [verifyEmail, setVerifyEmail] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Board drag-and-drop (cards)
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Board drag-to-reorder columns
  const [draggingStageKey, setDraggingStageKey] = useState(null);
  const [dragOverStageKey, setDragOverStageKey] = useState(null);

  // Board column order (persisted)
  const [stageOrder, setStageOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sorce_stageOrder') || 'null') || ['new','needs_callback','contacted','converted','not_interested']; }
    catch { return ['new','needs_callback','contacted','converted','not_interested']; }
  });

  // Board column custom colors (persisted)
  const [stageColors, setStageColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sorce_stageColors') || '{}'); } catch { return {}; }
  });

  // Board column rename
  const [stageLabels, setStageLabels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sorce_stageLabels') || '{}'); } catch { return {}; }
  });
  const [editingStageKey, setEditingStageKey] = useState(null);
  const [editingStageLabel, setEditingStageLabel] = useState('');

  // Source tag rules: [{ source, tag, color }]
  const [sourceTagRules, setSourceTagRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sorce_sourceTagRules') || '[]'); } catch { return []; }
  });
  const [showTagRulesModal, setShowTagRulesModal] = useState(false);
  const [tagRuleForm, setTagRuleForm] = useState({ source: '', tag: '', color: '#3b82f6' });

  // CSV mapper state
  const [csvMapper, setCsvMapper] = useState(null); // { headers, rows, tab }
  const [csvMappings, setCsvMappings] = useState({});
  const [csvImporting, setCsvImporting] = useState(false);

  // Rewards state
  const [rewardsConfig, setRewardsConfig] = useState({
    enabled: false,
    bookingsRequired: 5,
    rewardDescription: '',
    couponAfterBooking: false,
    couponDescription: '',
    couponFrequency: 'every',
    smsTiming: 'after_completed',
    smsDelayHours: 1,
    smsTemplate: ''
  });
  const [rewardsCustomers, setRewardsCustomers] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [savingRewards, setSavingRewards] = useState(false);
  const [showRewardsConfig, setShowRewardsConfig] = useState(false);

  // Get current leads from active table
  const getCurrentLeads = () => {
    const table = leadTables.find(t => t.id === activeLeadTable);
    return table ? table.leads : [];
  };

  // Update leads in active table
  const setCurrentLeads = (leads) => {
    setLeadTables(leadTables.map(table => 
      table.id === activeLeadTable ? { ...table, leads } : table
    ));
  };

  const loadSmsConversation = async (leadId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}/sms-conversation`);
      const data = await response.json();
      setSmsConversation(data.messages || []);
    } catch (error) {
      console.error('Error loading SMS conversation:', error);
    }
  };

  const exportToCSV = () => {
    const data = activeTab === 'leads' ? getCurrentLeads() : customers;
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = activeTab === 'leads' 
      ? ['ID', 'Name', 'Status', 'Phone', 'Email', 'Source', 'Notes']
      : ['ID', 'Name', 'Phone', 'Email', 'Service Booked', 'Service Date', 'Left Review', 'Notes'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(record => {
      const values = activeTab === 'leads'
        ? [
            record.id,
            `"${record.name || ''}"`,
            record.status || '',
            record.phone || '',
            record.email || '',
            record.source || '',
            `"${record.notes || ''}"`
          ]
        : [
            record.id,
            `"${record.name || ''}"`,
            record.phone || '',
            record.email || '',
            `"${record.last_service || ''}"`,
            record.last_service_date || '',
            record.left_review || '',
            `"${record.notes || ''}"`
          ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tableName = activeTab === 'leads' 
      ? leadTables.find(t => t.id === activeLeadTable)?.name || 'leads'
      : 'customers';
    a.download = `${tableName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // CSV parsing is handled by PapaParse in importFromCSV below.

  // Auto-detect which CSV column index best matches a set of keyword aliases.
  // Three-pass: exact → substring excluding "type"/"label"/"format" columns → any substring.
  const detectCol = (headers, ...aliases) => {
    const norm = s => s.replace(/[\s_\-]/g, '').toLowerCase();
    const isMetaCol = h => { const n = norm(h); return n.endsWith('type') || n.endsWith('label') || n.endsWith('format') || n.endsWith('category'); };
    // Pass 1: exact match
    for (const alias of aliases) {
      const na = norm(alias);
      const idx = headers.findIndex(h => norm(h) === na);
      if (idx !== -1) return idx;
    }
    // Pass 2: substring match, skip meta/type columns
    for (const alias of aliases) {
      const na = norm(alias);
      const idx = headers.findIndex(h => {
        const nh = norm(h);
        if (!nh || isMetaCol(h)) return false;
        return nh.includes(na) || na.includes(nh);
      });
      if (idx !== -1) return idx;
    }
    // Pass 3: any substring match (fallback)
    for (const alias of aliases) {
      const na = norm(alias);
      const idx = headers.findIndex(h => {
        const nh = norm(h);
        if (!nh) return false;
        return nh.includes(na) || na.includes(nh);
      });
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Phase 1: parse CSV with PapaParse → auto-detect columns → open mapping modal
  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    Papa.parse(file, {
      // Treat first row as data (we extract headers ourselves so detectCol can match raw values)
      header: false,
      // Drop rows that are entirely empty — but keep rows that have any non-empty cell
      skipEmptyLines: 'greedy',
      // Trim whitespace; PapaParse handles quoted fields, embedded commas, CRLF, escaped quotes
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (results) => {
        try {
          const allRows = results.data;
          // Surface non-fatal parse warnings but don't block — papaparse recovers from most issues
          if (results.errors && results.errors.length > 0) {
            console.warn('[CSV] PapaParse warnings:', results.errors.slice(0, 5));
          }
          if (!allRows || allRows.length < 2) {
            alert('CSV file is empty or has no data rows.');
            return;
          }

          const rawHeaders = allRows[0].map(h => (h == null ? '' : String(h)));
          const headers = rawHeaders.map(h => h.toLowerCase().trim());
          const dataRows = allRows.slice(1);

          // Auto-detect common column patterns — more specific aliases listed first
          const detected = {
            fullName:    detectCol(headers, 'fullname', 'customername', 'contactname', 'clientname', 'displayname', 'companyname', 'businessname', 'accountname', 'organizationname', 'name', 'customer', 'contact', 'client', 'account', 'company', 'business', 'organization'),
            firstName:   detectCol(headers, 'firstname', 'givenname', 'fname', 'first'),
            lastName:    detectCol(headers, 'lastname', 'familyname', 'surname', 'lname', 'last'),
            email:       detectCol(headers, 'email1value', 'email2value', 'emailaddress', 'primaryemail', 'contactemail', 'email1', 'email', 'e-mail'),
            phone:       detectCol(headers, 'phone1value', 'phone2value', 'primaryphone', 'mobilephone', 'cellphone', 'homephone', 'workphone', 'phonenumber', 'mobile', 'cell', 'telephone', 'tel', 'phone'),
            service:     detectCol(headers, 'lastservice', 'servicetype', 'service', 'product'),
            serviceDate: detectCol(headers, 'lastservicedate', 'servicedate', 'lastvisit', 'visitdate', 'appointmentdate', 'date'),
            notes:       detectCol(headers, 'notes', 'note', 'comments', 'comment', 'description', 'memo'),
            // leads-only
            status:      detectCol(headers, 'leadstatus', 'status'),
            source:      detectCol(headers, 'leadsource', 'source', 'channel'),
          };
          console.log(`[CSV] Parsed ${dataRows.length} data rows from ${rawHeaders.length} columns`);
          console.log('[CSV] Headers:', rawHeaders);
          console.log('[CSV] Detected mappings:', detected);

          setCsvMappings(detected);
          setCsvMapper({ headers: rawHeaders, rows: dataRows, tab: activeTab });
        } catch (err) {
          console.error('CSV parse error:', err);
          alert('Failed to read CSV file.');
        }
      },
      error: (err) => {
        console.error('CSV read error:', err);
        alert('Failed to read CSV file.');
      },
    });
  };

  // Phase 2: user confirmed mappings → build records → call API
  const confirmCSVImport = async () => {
    if (!csvMapper) return;
    setCsvImporting(true);
    try {
      const { rows, tab } = csvMapper;
      const m = csvMappings;

      const getVal = (row, idx) => (idx != null && idx >= 0 && row[idx] != null ? row[idx].trim() : '');
      const cleanPhone = (v) => v.replace(/^'+/, '').replace(/\D/g, '') ? v.replace(/^'+/, '').trim() : '';

      const totalParsed = rows.length;
      const buildRecord = (row, isLead) => {
        let name = getVal(row, m.fullName);
        let email = getVal(row, m.email);
        if (!name && m.firstName >= 0) {
          const fn = getVal(row, m.firstName);
          const ln = m.lastName >= 0 ? getVal(row, m.lastName) : '';
          if (ln.includes('@') && !email) { name = fn; email = ln; }
          else name = [fn, ln].filter(Boolean).join(' ');
        }
        if (!name && email) name = email.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (!name) name = 'Unknown';
        const base = {
          name,
          email: email || null,
          phone: cleanPhone(getVal(row, m.phone)) || null,
          notes: getVal(row, m.notes) || null,
        };
        return isLead
          ? { ...base, status: getVal(row, m.status) || 'new', source: getVal(row, m.source) || 'manual' }
          : { ...base, last_service: getVal(row, m.service) || null, last_service_date: getVal(row, m.serviceDate) || null };
      };

      if (tab === 'leads') {
        const all = rows.map(r => buildRecord(r, true));
        const leads = all.filter(r => r.name !== 'Unknown' || r.email || r.phone);
        const droppedNoIdentity = all.length - leads.length;

        const response = await authFetch(`${apiUrl}/api/leads/bulk-import`, {
          method: 'POST', body: JSON.stringify({ leads })
        });
        const data = await response.json();
        if (!response.ok) { alert('Import failed: ' + (data.error || 'Unknown error')); return; }
        const parts = [`Parsed from CSV: ${totalParsed}`, `Imported: ${data.successCount}`];
        if (data.duplicateCount > 0) parts.push(`Duplicates skipped: ${data.duplicateCount}`);
        if (data.errorCount > 0) parts.push(`Errors: ${data.errorCount}`);
        if (droppedNoIdentity > 0) parts.push(`Dropped (no name/email/phone): ${droppedNoIdentity}`);
        alert('Import complete!\n' + parts.join('\n'));
        setCsvMapper(null);
        fetchLeads();
      } else {
        const all = rows.map(r => buildRecord(r, false));
        const customers = all.filter(r => r.name !== 'Unknown' || r.email || r.phone);
        const droppedNoIdentity = all.length - customers.length;

        const response = await authFetch(`${apiUrl}/api/customers/bulk-import`, {
          method: 'POST', body: JSON.stringify({ customers })
        });
        const data = await response.json();
        if (!response.ok) { alert('Import failed: ' + (data.error || 'Unknown error')); return; }
        const parts = [`Parsed from CSV: ${totalParsed}`, `Imported: ${data.successCount}`];
        if (data.duplicateCount > 0) parts.push(`Duplicates skipped: ${data.duplicateCount}`);
        if (data.errorCount > 0) parts.push(`Errors: ${data.errorCount}`);
        if (droppedNoIdentity > 0) parts.push(`Dropped (no name/email/phone): ${droppedNoIdentity}`);
        alert('Import complete!\n' + parts.join('\n'));
        setCsvMapper(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error('CSV import error:', err);
      alert('Import failed. Please try again.');
    } finally {
      setCsvImporting(false);
    }
  };

  const fetchAdConnections = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/ad-platforms/connections`).then(r => r.json());
      setAdConnections(res.connections || []);
    } catch { setAdConnections([]); }
    try {
      const vres = await authFetch(`${apiUrl}/api/ad-platforms/verification-requests`).then(r => r.json());
      setAdVerifications(vres.requests || []);
    } catch { setAdVerifications([]); }
  };

  const submitVerification = async () => {
    if (!showVerifyModal || !verifyEmail) return;
    setSubmittingVerify(true);
    try {
      const res = await authFetch(`${apiUrl}/api/ad-platforms/verification-requests`, {
        method: 'POST',
        body: JSON.stringify({ platform: showVerifyModal, email: verifyEmail }),
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      setShowVerifyModal(null);
      setVerifyEmail('');
      fetchAdConnections();
      setAdConnectToast({ type: 'success', msg: 'Request submitted! You\'ll get an email when approved.' });
      setTimeout(() => setAdConnectToast(null), 5000);
    } catch (e) {
      setAdConnectToast({ type: 'error', msg: e.message || 'Failed to submit' });
      setTimeout(() => setAdConnectToast(null), 4000);
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Backend URL paths use hyphens (google-ads), DB/state keys use underscores (google_ads)
  const toPath = (p) => p.replace(/_/g, '-');

  const connectAdPlatform = async (platform) => {
    setAdConnecting(platform);
    try {
      const res = await authFetch(`${apiUrl}/api/ad-platforms/${toPath(platform)}/auth`).then(r => r.json());
      if (res.url) window.location.href = res.url;
    } catch {
      setAdConnecting(null);
    }
  };

  const disconnectAdPlatform = async (platform) => {
    if (!confirm(`Disconnect ${platformLabel(platform)}? Synced spend data will remain.`)) return;
    await authFetch(`${apiUrl}/api/ad-platforms/${toPath(platform)}`, { method: 'DELETE' });
    fetchAdConnections();
  };

  const syncAdPlatform = async (platform) => {
    setAdSyncing(platform);
    try {
      const r = await authFetch(`${apiUrl}/api/ad-platforms/${toPath(platform)}/sync`, { method: 'POST' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      fetchAnalytics();
      const months = data.synced_months ?? 0;
      setAdConnectToast({
        type: 'success',
        msg: months > 0
          ? `${platformLabel(platform)} synced (${months} month${months === 1 ? '' : 's'})`
          : `${platformLabel(platform)}: no spend data returned`,
      });
    } catch (e) {
      setAdConnectToast({ type: 'error', msg: `${platformLabel(platform)} sync failed: ${e.message}` });
    } finally {
      setAdSyncing(null);
      setTimeout(() => setAdConnectToast(null), 8000);
    }
  };

  const platformLabel = (p) => ({ google_ads: 'Google Ads', google_lsa: 'Google LSA', meta: 'Meta Ads' }[p] || p);

  useEffect(() => {
    fetchLeads();
    fetchCustomers();
    fetchAnalytics();
    fetchAdConnections();

    // Handle OAuth callback redirect
    const params = new URLSearchParams(window.location.search);
    const adConnect = params.get('ad_connect');
    const platform = params.get('platform');
    if (adConnect && platform) {
      setActiveTab('analytics');
      setAdConnectToast({
        type: adConnect === 'success' ? 'success' : 'error',
        msg: adConnect === 'success'
          ? `${platformLabel(platform)} connected! Spend data synced.`
          : `Failed to connect ${platformLabel(platform)}. Please try again.`,
      });
      // Clean up URL without re-rendering
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setAdConnectToast(null), 5000);
    }
  }, []);

  // Re-fetch analytics when the date range changes
  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsRange.startDate, analyticsRange.endDate]);

  const openViewingLead = (lead) => {
    setViewingLead(lead);
    setViewingLeadDetail(null);
    setViewingLeadDetailLoading(true);
    setViewingLeadEditMode(false);
    setViewingLeadEdit({ status: lead.status || 'new', notes: lead.notes || '', priority: lead.priority || '', follow_up_date: lead.follow_up_date || '' });
    setViewingLeadSmsMessages([]);
    setViewingLeadChatMessages([]);
    const isChatLead = lead.source === 'ai_chat_agent';
    setViewingLeadConvTab(isChatLead ? 'chat' : 'sms');

    // Fetch enhanced detail (bookings, spending, etc.)
    authFetch(`${apiUrl}/api/leads/${lead.id}/detail`)
      .then(r => r.json())
      .then(d => setViewingLeadDetail(d))
      .catch(() => setViewingLeadDetail(null))
      .finally(() => setViewingLeadDetailLoading(false));

    if (lead.phone) {
      setViewingLeadSmsLoading(true);
      authFetch(`${apiUrl}/api/leads/${lead.id}/sms-conversation`)
        .then(r => r.json())
        .then(d => setViewingLeadSmsMessages(d.messages || []))
        .catch(() => setViewingLeadSmsMessages([]))
        .finally(() => setViewingLeadSmsLoading(false));
    }

    if (isChatLead) {
      setViewingLeadChatLoading(true);
      authFetch(`${apiUrl}/api/leads/${lead.id}/chat-conversation`)
        .then(r => r.json())
        .then(d => setViewingLeadChatMessages(d.messages || []))
        .catch(() => setViewingLeadChatMessages([]))
        .finally(() => setViewingLeadChatLoading(false));
    }
  };

  // Lock body scroll when lead detail overlay is open (prevents background scrolling + top gap)
  useEffect(() => {
    if (viewingLead) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [viewingLead]);

  // Move a lead to a new stage via drag-and-drop
  const moveLeadToStage = async (leadId, newStatus) => {
    setLeadTables(prev => prev.map(t => ({
      ...t,
      leads: t.leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    })));
    try {
      await authFetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      fetchLeads();
    }
  };

  // Save a custom stage label
  const saveStageLabel = (key, label) => {
    const trimmed = (label || '').trim();
    const updated = { ...stageLabels };
    if (trimmed) updated[key] = trimmed;
    else delete updated[key];
    setStageLabels(updated);
    localStorage.setItem('sorce_stageLabels', JSON.stringify(updated));
    setEditingStageKey(null);
  };

  // Save / update source tag rules
  const saveTagRule = () => {
    if (!tagRuleForm.source || !tagRuleForm.tag) return;
    const updated = sourceTagRules.filter(r => r.source !== tagRuleForm.source);
    updated.push({ ...tagRuleForm });
    setSourceTagRules(updated);
    localStorage.setItem('sorce_sourceTagRules', JSON.stringify(updated));
    setTagRuleForm({ source: '', tag: '', color: '#3b82f6' });
  };

  const deleteTagRule = (source) => {
    const updated = sourceTagRules.filter(r => r.source !== source);
    setSourceTagRules(updated);
    localStorage.setItem('sorce_sourceTagRules', JSON.stringify(updated));
  };

  // Get tag label for a source (falls back to formatLabel)
  const getTagLabel = (source) => {
    const rule = sourceTagRules.find(r => r.source === source);
    return rule ? rule.tag : formatLabel(source || 'unknown');
  };

  const getTagStyle = (source) => {
    const rule = sourceTagRules.find(r => r.source === source);
    if (rule) {
      const hex = rule.color.replace('#', '');
      const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      return { bg: `rgba(${r},${g},${b},0.12)`, text: rule.color };
    }
    return null;
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (analyticsRange.startDate) qs.set('startDate', analyticsRange.startDate);
      if (analyticsRange.endDate) qs.set('endDate', analyticsRange.endDate);
      const url = `${apiUrl}/api/leads/analytics/sources${qs.toString() ? '?' + qs.toString() : ''}`;
      const srcRes = await authFetch(url).then(r => r.json());
      setAnalyticsData(srcRes.sources || []);
      setTotalBookingRevenue(parseFloat(srcRes.total_booking_revenue || 0));
      setTotalTransactionRevenue(parseFloat(srcRes.total_transaction_revenue || 0));
      setTotalTransactionTax(parseFloat(srcRes.total_transaction_tax || 0));
    } catch (e) {
      console.error('Analytics fetch error:', e);
      setAnalyticsData([]);
    } finally {
      setAnalyticsLoading(false);
    }
    // Ad spend is optional — fetch separately so it doesn't block analytics
    try {
      const spendRes = await authFetch(`${apiUrl}/api/leads/ad-spend`).then(r => r.json());
      setAdSpendEntries(spendRes.entries || []);
    } catch { setAdSpendEntries([]); }
    fetchAdConnections();
  };

  const saveAdSpend = async () => {
    if (!adSpendForm.source || !adSpendForm.amount || !adSpendForm.month) return;
    try {
      await authFetch(`${apiUrl}/api/leads/ad-spend`, {
        method: 'POST',
        body: JSON.stringify({ ...adSpendForm, amount: parseFloat(adSpendForm.amount) }),
      });
      setShowAdSpendModal(false);
      setAdSpendForm({ source: '', amount: '', month: new Date().toISOString().slice(0, 7), notes: '' });
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  const deleteAdSpend = async (id) => {
    try {
      await authFetch(`${apiUrl}/api/leads/ad-spend/${id}`, { method: 'DELETE' });
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  const saveViewingLeadEdit = async () => {
    if (!viewingLead) return;
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${viewingLead.id}`, {
        method: 'PATCH',
        body: JSON.stringify(viewingLeadEdit)
      });
      if (response.ok) {
        const updated = { ...viewingLead, ...viewingLeadEdit };
        setViewingLead(updated);
        setCurrentLeads(getCurrentLeads().map(l => l.id === viewingLead.id ? updated : l));
        setViewingLeadEditMode(false);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const saveViewingCustomerEdit = async () => {
    if (!viewingCustomer) return;
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${viewingCustomer.id}`, {
        method: 'PATCH',
        body: JSON.stringify(viewingCustomerEdit)
      });
      if (response.ok) {
        const updated = { ...viewingCustomer, ...viewingCustomerEdit };
        setViewingCustomer(updated);
        setCustomers(customers.map(c => c.id === viewingCustomer.id ? updated : c));
        setViewingCustomerEditMode(false);
      }
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        
        if (fetchedLeads.length === 0) {
          // Demo data
          setLeadTables([
            {
              id: 'default',
              name: 'All Leads',
              leads: [
                {
                  id: 'demo-1',
                  name: 'John Doe - Test Lead',
                  status: 'new',
                  phone: '+1234567890',
                  email: 'johndoe@example.com',
                  source: 'lead_form',
                  notes: 'This is a test lead — add your first real lead to replace it'
                }
              ]
            }
          ]);
        } else {
          // Group leads by table_id
          const tableMap = new Map();
          fetchedLeads.forEach(lead => {
            const tableId = lead.table_id || 'default';
            if (!tableMap.has(tableId)) {
              tableMap.set(tableId, {
                id: tableId,
                name: lead.table_name || 'All Leads',
                leads: []
              });
            }
            tableMap.get(tableId).leads.push(lead);
          });
          
          setLeadTables(Array.from(tableMap.values()));
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeadTables([
        {
          id: 'default',
          name: 'All Leads',
          leads: [
            {
              id: 'demo-1',
              name: 'John Smith',
              status: 'new',
              phone: '+1234567890',
              email: 'john.smith@example.com',
              source: 'lead_form',
              notes: 'Interested in ceramic coating'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        const fetchedCustomers = data.customers || [];
        if (fetchedCustomers.length === 0) {
          setCustomers([
            {
              id: 'demo-1',
              name: 'John Doe - Test Customer',
              phone: '+1234567890',
              email: 'johndoe@example.com',
              last_service: 'Example Service',
              last_service_date: '2024-01-15',
              left_review: 'N',
              notes: 'This is a test customer — add your first real customer to replace it'
            }
          ]);
        } else {
          setCustomers(fetchedCustomers);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([
        {
          id: 'demo-1',
          name: 'Jane Doe',
          phone: '+1987654321',
          email: 'jane.doe@example.com',
          last_service: 'Paint Correction',
          last_service_date: '2024-01-15',
          left_review: 'Y',
          notes: 'Great customer, always on time'
        }
      ]);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await authFetch(`${apiUrl}/api/chat/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchConversationMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      const response = await authFetch(`${apiUrl}/api/chat/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchSmsLeadConversations = async () => {
    try {
      setLoadingSmsLeads(true);
      const response = await authFetch(`${apiUrl}/api/leads/sms-conversations`);
      if (response.ok) {
        const data = await response.json();
        setSmsLeads(data.leads || []);
      } else {
        console.error('SMS conversations endpoint returned', response.status);
      }
    } catch (error) {
      console.error('Error fetching SMS conversations:', error);
    } finally {
      setLoadingSmsLeads(false);
    }
  };

  const fetchSmsLeadMessages = async (leadId) => {
    try {
      setLoadingSmsMessages(true);
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}/sms-conversation`);
      if (response.ok) {
        const data = await response.json();
        setSmsLeadMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching SMS messages:', error);
    } finally {
      setLoadingSmsMessages(false);
    }
  };

  const fetchRewardsData = async () => {
    try {
      setLoadingRewards(true);
      const [configRes, custRes] = await Promise.all([
        authFetch(`${apiUrl}/api/rewards/config`),
        authFetch(`${apiUrl}/api/rewards/customers`)
      ]);
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.config) {
          setRewardsConfig({
            enabled: configData.config.enabled,
            bookingsRequired: configData.config.bookings_required,
            rewardDescription: configData.config.reward_description || '',
            couponAfterBooking: configData.config.coupon_after_booking,
            couponDescription: configData.config.coupon_description || '',
            couponFrequency: configData.config.coupon_frequency || 'every',
            smsTiming: configData.config.sms_timing || 'after_completed',
            smsDelayHours: configData.config.sms_delay_hours || 1,
            smsTemplate: configData.config.sms_template || ''
          });
        }
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        setRewardsCustomers(custData.customers || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const saveRewardsConfig = async () => {
    try {
      setSavingRewards(true);
      const response = await authFetch(`${apiUrl}/api/rewards/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardsConfig)
      });
      if (response.ok) {
        const data = await response.json();
        alert('Rewards settings saved!');
      }
    } catch (error) {
      console.error('Error saving rewards config:', error);
      alert('Failed to save rewards settings');
    } finally {
      setSavingRewards(false);
    }
  };

  const sendManualSms = async () => {
    if (!newSmsMessage.trim() || !selectedLead) return;
    
    setSendingSms(true);
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${selectedLead.id}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newSmsMessage })
      });
      
      if (response.ok) {
        setNewSmsMessage('');
        await loadSmsConversation(selectedLead.id);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const createLeadTable = () => {
    if (!newTableName.trim()) return;
    
    const newTable = {
      id: `table-${Date.now()}`,
      name: newTableName.trim(),
      leads: []
    };
    
    setLeadTables([...leadTables, newTable]);
    setActiveLeadTable(newTable.id);
    setNewTableName('');
    setShowAddTableModal(false);
  };

  const renameLeadTable = (tableId, newName) => {
    if (!newName.trim()) return;
    
    setLeadTables(leadTables.map(table => 
      table.id === tableId ? { ...table, name: newName.trim() } : table
    ));
    setEditingTableName(null);
  };

  const deleteLeadTable = (tableId) => {
    if (tableId === 'default') {
      alert('Cannot delete the default table');
      return;
    }
    
    if (!confirm('Delete this lead table? All leads in it will be deleted.')) return;
    
    setLeadTables(leadTables.filter(table => table.id !== tableId));
    if (activeLeadTable === tableId) {
      setActiveLeadTable('default');
    }
    setShowTableMenu(null);
  };

  const updateLeadField = async (leadId, field, value) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.map(l => l.id === leadId ? { ...l, [field]: value } : l));
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const updateCustomerField = async (customerId, field, value) => {
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        setCustomers(customers.map(c => c.id === customerId ? { ...c, [field]: value } : c));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCellEdit = (id, field, currentValue) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };

  const saveCellEdit = () => {
    if (editingCell) {
      if (activeTab === 'leads') {
        updateLeadField(editingCell.id, editingCell.field, editValue);
      } else {
        updateCustomerField(editingCell.id, editingCell.field, editValue);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const addRecord = async () => {
    try {
      if (activeTab === 'leads') {
        const response = await authFetch(`${apiUrl}/api/leads`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            status: newRecord.status || 'new',
            source: newRecord.source || 'manual',
            notes: newRecord.notes || '',
            table_id: activeLeadTable
          })
        });

        const data = await response.json();

        if (response.ok) {
          const currentLeads = getCurrentLeads();
          setCurrentLeads([...currentLeads.filter(l => !String(l.id).startsWith('demo')), data.lead]);
          setShowAddModal(false);
          setNewRecord({});
          alert('Lead added successfully!');
          // Mark onboarding step 5 complete
          window.dispatchEvent(new CustomEvent('onboarding-step-complete', {
            detail: { step: 5 }
          }));
        } else {
          alert(`Failed to add lead: ${data.error || 'Unknown error'}`);
        }
      } else {
        const response = await authFetch(`${apiUrl}/api/customers`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            last_service: newRecord.last_service || '',
            last_service_date: newRecord.last_service_date || null,
            left_review: newRecord.left_review || 'N',
            notes: newRecord.notes || ''
          })
        });

        const data = await response.json();

        if (response.ok) {
          setCustomers([...customers.filter(c => !String(c.id).startsWith('demo')), data.customer]);
          setShowAddModal(false);
          setNewRecord({});
          alert('Customer added successfully!');
          // Mark onboarding step 5 complete
          window.dispatchEvent(new CustomEvent('onboarding-step-complete', {
            detail: { step: 5 }
          }));
        } else {
          alert(`Failed to add customer: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record. Check console for details.');
    }
  };

  const deleteLead = async (leadId) => {
    if (String(leadId).startsWith('demo')) {
      alert('Cannot delete demo data');
      return;
    }
    if (!confirm('Delete this lead?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, { method: 'DELETE' });
      if (response.ok) {
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.filter(l => l.id !== leadId));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const deleteCustomer = async (customerId) => {
    if (String(customerId).startsWith('demo')) {
      alert('Cannot delete demo data');
      return;
    }
    if (!confirm('Delete this customer?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${customerId}`, { method: 'DELETE' });
      if (response.ok) setCustomers(customers.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const convertLeadToCustomer = async () => {
    if (!convertingLead) return;

    setIsConverting(true);
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${convertingLead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({
          notes: convertingLead.notes || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add new customer to list
        setCustomers([...customers, data.customer]);
        // Remove lead from current table
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.filter(l => l.id !== convertingLead.id));
        // Close modal
        setShowConvertModal(false);
        setConvertingLead(null);
        // Switch to customers tab
        setActiveTab('customers');
        alert('Lead converted to customer successfully!');
      } else {
        const error = await response.json();
        alert('Failed to convert: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead');
    } finally {
      setIsConverting(false);
    }
  };

  const currentLeads = getCurrentLeads();
  const allLeadsForSources = leadTables.flatMap(t => t.leads);
  const availableSources = [...new Set(allLeadsForSources.map(l => l.source).filter(Boolean))].sort();

  const filteredLeads = currentLeads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const leadStats = {
    total: currentLeads.length,
    new: currentLeads.filter(l => l.status === 'new').length,
    contacted: currentLeads.filter(l => l.status === 'contacted_email' || l.status === 'contacted_sms').length,
    converted: currentLeads.filter(l => l.status === 'converted').length,
  };

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.total_jobs > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
  };

  const leadColumns = [
    { key: 'name', label: 'Name', width: '200px', editable: true },
    { key: 'created_at', label: 'Date In', width: '140px', editable: false, type: 'datetime' },
    { key: 'status', label: 'Stage', width: '180px', editable: true, type: 'select', options: ['new', 'contacted_email', 'contacted_sms', 'qualified', 'converted', 'not_interested'] },
    { key: 'priority', label: 'Priority', width: '120px', editable: true, type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
    { key: 'follow_up_date', label: 'Follow-Up', width: '140px', editable: true, type: 'date' },
    { key: 'phone', label: 'Phone', width: '150px', editable: true },
    { key: 'email', label: 'Email', width: '250px', editable: true },
    { key: 'source', label: 'Source', width: '150px', editable: true, type: 'select', options: ['ai_chat_agent', 'lead_form', 'manual'] },
    { key: 'notes', label: 'Notes', width: '300px', editable: true },
  ];

  // Returns age info for a lead — used for "Needs Check-Up" flagging
  const getLeadAgeFlag = (lead) => {
    if (!lead.created_at) return null;
    const terminalStatuses = ['converted', 'not_interested'];
    if (terminalStatuses.includes(lead.status)) return null;
    const ageMs = Date.now() - parseTS(lead.created_at).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (ageDays >= 14) return { label: 'Needs Check-Up', days: ageDays, level: 'urgent' };
    if (ageDays >= 7) return { label: 'Follow Up', days: ageDays, level: 'warn' };
    return null;
  };

  // Returns true if a lead's follow_up_date is today or in the past
  const isFollowUpOverdue = (lead) => {
    if (!lead.follow_up_date) return false;
    return parseTS(lead.follow_up_date) <= new Date();
  };

  const customerColumns = [
    { key: 'name', label: 'Name', width: '200px', editable: true },
    { key: 'phone', label: 'Phone', width: '150px', editable: true },
    { key: 'email', label: 'Email', width: '250px', editable: true },
    { key: 'last_service', label: 'Service Booked', width: '200px', editable: true },
    { key: 'last_service_date', label: 'Service Date', width: '150px', editable: true, type: 'date' },
    { key: 'left_review', label: 'Left Review', width: '120px', editable: true, type: 'select', options: ['Y', 'N'] },
    { key: 'notes', label: 'Notes', width: '300px', editable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Management</h1>
            <p className="text-gray-600 mt-1">Leads, customers, analytics and source ROI</p>
          </div>
        </div>

        {/* Tabs */}
        {/* Mobile: native select dropdown */}
        <div className="md:hidden border-b border-gray-200 bg-gray-50 px-4 py-3">
          <select
            value={activeTab}
            onChange={e => {
              const val = e.target.value;
              setSearchTerm('');
              setEditingCell(null);
              setActiveTab(val);
              if (val === 'conversations') { fetchConversations(); fetchSmsLeadConversations(); }
              if (val === 'rewards') fetchRewardsData();
              if (val === 'analytics') fetchAnalytics();
            }}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 shadow-sm"
          >
            <option value="leads">Leads ({leadTables.reduce((sum, t) => sum + t.leads.length, 0)})</option>
            <option value="customers">Customers ({customerStats.total})</option>
            <option value="conversations">Conversations</option>
            <option value="rewards">Rewards</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>
        {/* Desktop: horizontal tabs */}
        <div className="hidden md:block border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => { setActiveTab('analytics'); setSearchTerm(''); setEditingCell(null); fetchAnalytics(); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'analytics' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Analytics
              </div>
              {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('leads'); setSearchTerm(''); setEditingCell(null); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'leads' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Leads ({leadTables.reduce((sum, t) => sum + t.leads.length, 0)})
              </div>
              {activeTab === 'leads' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('customers'); setSearchTerm(''); setEditingCell(null); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'customers' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers ({customerStats.total})
              </div>
              {activeTab === 'customers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('conversations'); setSearchTerm(''); setEditingCell(null); fetchConversations(); fetchSmsLeadConversations(); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'conversations' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversations
              </div>
              {activeTab === 'conversations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('rewards'); setSearchTerm(''); setEditingCell(null); fetchRewardsData(); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'rewards' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Rewards
              </div>
              {activeTab === 'rewards' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
          </div>
        </div>

        {/* Lead Tables Tabs */}
        {activeTab === 'leads' && (
          <div className="border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {leadTables.map((table) => (
                <div key={table.id} className="relative group">
                  <button
                    onClick={() => setActiveLeadTable(table.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeLeadTable === table.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {editingTableName === table.id ? (
                        <input
                          type="text"
                          defaultValue={table.name}
                          onBlur={(e) => renameLeadTable(table.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renameLeadTable(table.id, e.target.value);
                            if (e.key === 'Escape') setEditingTableName(null);
                          }}
                          className="px-2 py-1 border border-blue-500 rounded text-sm w-40"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          {table.name}
                          <span className="text-xs opacity-60">({table.leads.length})</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  {/* Table Menu */}
                  {activeLeadTable === table.id && table.id !== 'default' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTableMenu(showTableMenu === table.id ? null : table.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showTableMenu === table.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                          <button
                            onClick={() => {
                              setEditingTableName(table.id);
                              setShowTableMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Rename
                          </button>
                          <button
                            onClick={() => deleteLeadTable(table.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Table Button */}
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Table
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Needs Attention banner */}
      {activeTab === 'leads' && (() => {
        const allLeads = leadTables.flatMap(t => t.leads);
        const urgentCount = allLeads.filter(l => getLeadAgeFlag(l)?.level === 'urgent').length;
        const warnCount = allLeads.filter(l => getLeadAgeFlag(l)?.level === 'warn').length;
        const overdueCount = allLeads.filter(l => isFollowUpOverdue(l)).length;
        if (urgentCount === 0 && warnCount === 0 && overdueCount === 0) return null;
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-800">Leads need attention:</span>
            {urgentCount > 0 && <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{urgentCount} overdue (14+ days)</span>}
            {warnCount > 0 && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{warnCount} need follow-up (7+ days)</span>}
            {overdueCount > 0 && <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{overdueCount} follow-up date passed</span>}
          </div>
        );
      })()}

      {/* Table (leads/customers) */}
      {(activeTab === 'leads' || activeTab === 'customers') && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
            </div>
            {activeTab === 'leads' && (
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white flex-shrink-0 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {availableSources.map(s => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'leads' && (
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setLeadViewMode('board')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${leadViewMode === 'board' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="Pipeline board"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline">Board</span>
                </button>
                <button
                  onClick={() => setLeadViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition border-l border-gray-300 ${leadViewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden md:inline">Table</span>
                </button>
              </div>
            )}
            {activeTab === 'leads' && (
              <button
                onClick={() => setShowTagRulesModal(true)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5"
                title="Configure source tag labels"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden md:inline">Tags</span>
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                onClick={e => { e.target.value = ''; }}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setShowAddModal(true);
                setNewRecord({});
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === 'leads' ? 'Lead' : 'Customer'}
            </button>
          </div>
        </div>

        {/* ── Pipeline Board View ── */}
        {!loading && activeTab === 'leads' && leadViewMode === 'board' && (() => {
          // Default stage definitions — order + colors can be overridden via state
          const STAGE_DEFAULTS = {
            new:            { label: 'New',            color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
            needs_callback: { label: 'Needs Callback', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
            contacted:      { label: 'Contacted',      color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
            converted:      { label: 'Converted',      color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
            not_interested: { label: 'Not Interested', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
          };

          const hexToRgba = (hex, a) => {
            const h = hex.replace('#','');
            const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
            return `rgba(${r},${g},${b},${a})`;
          };

          const STAGES = stageOrder.map(key => {
            const def = STAGE_DEFAULTS[key];
            if (!def) return null;
            const customColor = stageColors[key];
            const color = customColor || def.color;
            return {
              key,
              label: def.label,
              color,
              bg: customColor ? hexToRgba(color, 0.08) : def.bg,
              border: customColor ? hexToRgba(color, 0.35) : def.border,
            };
          }).filter(Boolean);

          // normalise multi-variant statuses into board buckets
          const normaliseStage = s => {
            if (!s || s === 'new') return 'new';
            if (s === 'needs_callback') return 'needs_callback';
            if (s === 'qualified') return 'needs_callback'; // migrate old "qualified" leads
            if (s.startsWith('contacted')) return 'contacted';
            if (s === 'converted') return 'converted';
            if (s === 'not_interested') return 'not_interested';
            return 'new';
          };

          const allLeads = leadTables.flatMap(t => t.leads);
          const leadsToShow = sourceFilter === 'all' ? allLeads : allLeads.filter(l => l.source === sourceFilter);
          const byStage = {};
          STAGES.forEach(s => { byStage[s.key] = []; });
          leadsToShow.forEach(l => {
            const bucket = normaliseStage(l.status);
            if (byStage[bucket]) byStage[bucket].push(l);
          });

          const fmt$ = v => v ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '';
          const defaultSourceColors = {
            ai_chat_agent: { bg: '#ede9fe', text: '#6d28d9' },
            lead_form:      { bg: '#dbeafe', text: '#1d4ed8' },
            google_lsa:     { bg: '#dcfce7', text: '#15803d' },
            inbound_call:   { bg: '#fef3c7', text: '#b45309' },
            manual:         { bg: '#f3f4f6', text: '#374151' },
          };
          const srcStyle = s => getTagStyle(s) || defaultSourceColors[s] || { bg: '#f3f4f6', text: '#374151' };

          const addCustomStage = () => {
            const key = `custom_${Date.now()}`;
            const newOrder = [...stageOrder, key];
            setStageOrder(newOrder);
            localStorage.setItem('sorce_stageOrder', JSON.stringify(newOrder));
            // Set a default color + label for the new stage
            const updated = { ...stageColors, [key]: '#6366f1' };
            setStageColors(updated);
            localStorage.setItem('sorce_stageColors', JSON.stringify(updated));
            const labelUpdated = { ...stageLabels, [key]: 'New Stage' };
            setStageLabels(labelUpdated);
            localStorage.setItem('sorce_stageLabels', JSON.stringify(labelUpdated));
            // Open rename immediately
            setTimeout(() => { setEditingStageKey(key); setEditingStageLabel('New Stage'); }, 50);
          };

          return (
            <StickyHorizontalScroller className="pb-4">
              <div className="flex gap-4 min-w-max px-1 pt-2 items-start">
                {STAGES.map(stage => {
                  const cards = byStage[stage.key] || [];
                  const isCardDropTarget = dragOverStage === stage.key && !draggingStageKey;
                  const isColumnDropTarget = dragOverStageKey === stage.key && draggingStageKey && draggingStageKey !== stage.key;
                  return (
                    <div
                      key={stage.key}
                      className={`w-72 flex-shrink-0 flex flex-col transition-all ${isColumnDropTarget ? 'scale-[1.02]' : ''} ${draggingStageKey === stage.key ? 'opacity-50' : ''}`}
                      onDragOver={e => {
                        e.preventDefault();
                        if (draggingStageKey) setDragOverStageKey(stage.key);
                        else setDragOverStage(stage.key);
                      }}
                      onDragLeave={() => { setDragOverStage(null); setDragOverStageKey(null); }}
                      onDrop={e => {
                        e.preventDefault();
                        setDragOverStage(null);
                        setDragOverStageKey(null);
                        if (draggingStageKey && draggingStageKey !== stage.key) {
                          // Reorder columns
                          const from = stageOrder.indexOf(draggingStageKey);
                          const to = stageOrder.indexOf(stage.key);
                          if (from !== -1 && to !== -1) {
                            const next = [...stageOrder];
                            next.splice(from, 1);
                            next.splice(to, 0, draggingStageKey);
                            setStageOrder(next);
                            localStorage.setItem('sorce_stageOrder', JSON.stringify(next));
                          }
                          setDraggingStageKey(null);
                        } else if (draggingLeadId) {
                          moveLeadToStage(draggingLeadId, stage.key);
                          setDraggingLeadId(null);
                        }
                      }}
                    >
                      {/* Column header — drag grip to reorder, dot to change color, double-click label to rename */}
                      <div
                        className={`flex items-center gap-1.5 px-2 py-2.5 rounded-t-xl mb-0.5 transition-all ${isColumnDropTarget ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                        style={{ backgroundColor: stage.bg, border: `1px solid ${stage.border}` }}
                      >
                        {/* Grip — drag to reorder column */}
                        <div
                          draggable
                          onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDraggingStageKey(stage.key); }}
                          onDragEnd={() => { setDraggingStageKey(null); setDragOverStageKey(null); }}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 -ml-0.5"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Color dot — click to open color picker */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-150 transition-transform ring-1 ring-white"
                            style={{ backgroundColor: stage.color }}
                            title="Click to change color"
                            onClick={() => document.getElementById(`cp-${stage.key}`)?.click()}
                          />
                          <input
                            id={`cp-${stage.key}`}
                            type="color"
                            value={stage.color}
                            onChange={e => {
                              const c = e.target.value;
                              const updated = { ...stageColors, [stage.key]: c };
                              setStageColors(updated);
                              localStorage.setItem('sorce_stageColors', JSON.stringify(updated));
                            }}
                            className="absolute opacity-0 w-0 h-0 pointer-events-none"
                          />
                        </div>

                        {/* Label — double-click to rename */}
                        <div className="flex-1 min-w-0">
                          {editingStageKey === stage.key ? (
                            <input
                              autoFocus
                              value={editingStageLabel}
                              onChange={e => setEditingStageLabel(e.target.value)}
                              onBlur={() => saveStageLabel(stage.key, editingStageLabel)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveStageLabel(stage.key, editingStageLabel);
                                if (e.key === 'Escape') setEditingStageKey(null);
                              }}
                              className="text-sm font-bold bg-transparent border-b outline-none w-full"
                              style={{ color: stage.color, borderColor: stage.color }}
                            />
                          ) : (
                            <span
                              className="text-sm font-bold cursor-text select-none truncate block"
                              style={{ color: stage.color }}
                              title="Double-click to rename"
                              onDoubleClick={() => { setEditingStageKey(stage.key); setEditingStageLabel(stageLabels[stage.key] || stage.label); }}
                            >
                              {stageLabels[stage.key] || stage.label}
                            </span>
                          )}
                        </div>

                        <span className="font-semibold bg-white px-1.5 py-0.5 rounded-full border text-xs text-gray-500 flex-shrink-0" style={{ borderColor: stage.border }}>{cards.length}</span>
                      </div>

                      {/* Cards drop zone */}
                      <div
                        className={`flex flex-col gap-2 flex-1 min-h-[120px] rounded-b-xl p-1 transition-all ${isCardDropTarget ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}
                      >
                        {cards.length === 0 ? (
                          <div className={`border-2 border-dashed rounded-xl h-20 flex items-center justify-center ${isCardDropTarget ? 'border-blue-400' : 'border-gray-200'}`}>
                            <span className="text-xs text-gray-300">{isCardDropTarget ? 'Drop here' : 'No leads'}</span>
                          </div>
                        ) : cards.map(lead => {
                          const ss = srcStyle(lead.source);
                          const ageFlag = getLeadAgeFlag(lead);
                          const overdue = isFollowUpOverdue(lead);
                          return (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDraggingLeadId(lead.id); }}
                              onDragEnd={() => { setDraggingLeadId(null); setDragOverStage(null); }}
                              onClick={() => openViewingLead(lead)}
                              className={`bg-white rounded-xl border border-gray-200 p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group ${draggingLeadId === lead.id ? 'opacity-50' : ''}`}
                            >
                              {/* Name row */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">{lead.name || 'Unnamed'}</p>
                                <div className="flex gap-1 flex-shrink-0">
                                  {stage.key === 'needs_callback' && <PhoneCall className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" title="Needs callback" />}
                                  {ageFlag?.level === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" title={ageFlag.label} />}
                                  {ageFlag?.level === 'warn' && <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" title={ageFlag.label} />}
                                  {overdue && <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" title="Follow-up overdue" />}
                                </div>
                              </div>

                              {/* Contact */}
                              <div className="space-y-1 mb-2.5">
                                {lead.email && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {lead.service && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <CheckCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{lead.service}</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ss.bg, color: ss.text }}>
                                  {getTagLabel(lead.source)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {lead.estimated_value > 0 && (
                                    <span className="text-xs font-bold text-gray-700">{fmt$(lead.estimated_value)}</span>
                                  )}
                                  <span className="text-xs text-gray-400">{lead.created_at ? fmtDateTime(lead.created_at).split(',')[0] : ''}</span>
                                </div>
                              </div>

                              {lead.priority === 'urgent' && (
                                <div className="mt-2 px-2 py-0.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-semibold">🔥 Urgent</div>
                              )}
                              {lead.priority === 'high' && (
                                <div className="mt-2 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-600 font-semibold">⚡ High Priority</div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add lead button at bottom of column */}
                        <button
                          onClick={() => { setShowAddModal(true); setNewRecord({ status: stage.key }); }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add lead
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Section column */}
                <div className="w-52 flex-shrink-0 flex flex-col">
                  <button
                    onClick={addCustomStage}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all h-16 w-full"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>
              </div>
            </StickyHorizontalScroller>
          );
        })()}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : activeTab === 'leads' && leadViewMode === 'table' ? (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads in this table</h3>
                  <p className="text-gray-600">Add your first lead to get started</p>
                </div>
              ) : filteredLeads.map((lead) => {
                const ageFlag = getLeadAgeFlag ? getLeadAgeFlag(lead) : null;
                return (
                  <div key={lead.id} onClick={() => openViewingLead(lead)} className={`p-4 cursor-pointer active:bg-blue-50 ${ageFlag?.level === 'urgent' ? 'bg-red-50' : ageFlag?.level === 'warn' ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-blue-600 font-semibold text-sm">{lead.name || '—'}</span>
                          {ageFlag && <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${ageFlag.level === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}><AlertCircle className="w-3 h-3" />{ageFlag.label}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(lead.status)}`}>{formatLabel(lead.status)}</span>
                          {lead.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                          {lead.source && <span className={`px-2 py-0.5 rounded-full text-xs ${getSourceColor(lead.source)}`}>{formatLabel(lead.source)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); setConvertingLead(lead); setShowConvertModal(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Convert"><Users className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <LeadsTable
                leads={filteredLeads}
                columns={leadColumns}
                openViewingLead={openViewingLead}
                deleteLead={deleteLead}
                setConvertingLead={setConvertingLead}
                setShowConvertModal={setShowConvertModal}
                getLeadAgeFlag={getLeadAgeFlag}
                isFollowUpOverdue={isFollowUpOverdue}
              />
            </div>
          </>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
                  <p className="text-gray-600">Convert leads or add bookings</p>
                </div>
              ) : filteredCustomers.map((customer) => (
                <div key={customer.id} onClick={() => { setViewingCustomer(customer); setViewingCustomerEditMode(false); setViewingCustomerEdit({ name: customer.name, phone: customer.phone, email: customer.email, last_service: customer.last_service, last_service_date: customer.last_service_date, left_review: customer.left_review, notes: customer.notes }); }} className="p-4 cursor-pointer active:bg-blue-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-blue-600 font-semibold text-sm">{customer.name || '—'}</span>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {customer.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                        {customer.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
                        {customer.last_service && <span className="text-xs text-gray-600 truncate">{customer.last_service}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <CustomersTable
                customers={filteredCustomers}
                columns={customerColumns}
                openViewingCustomer={(c) => { setViewingCustomer(c); setViewingCustomerEditMode(false); setViewingCustomerEdit({ name: c.name, phone: c.phone, email: c.email, last_service: c.last_service, last_service_date: c.last_service_date, left_review: c.left_review, notes: c.notes }); }}
                deleteCustomer={deleteCustomer}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-sm text-gray-600">
          {activeTab === 'leads' ? filteredLeads.length : filteredCustomers.length} records
        </div>
      </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex" style={{ height: '700px' }}>
          {/* Conversation List */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Type Toggle */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex gap-1">
              <button
                onClick={() => { setConversationType('chat'); setSelectedSmsLead(null); setSmsLeadMessages([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${conversationType === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat Agent
              </button>
              <button
                onClick={() => { setConversationType('sms'); setSelectedConversation(null); setConversationMessages([]); fetchSmsLeadConversations(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${conversationType === 'sms' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Phone className="w-3.5 h-3.5" />
                Lead SMS
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationType === 'chat' ? (
                loadingConversations ? (
                  <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-3 text-sm">Loading...</p></div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No chat conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Chat conversations from your website will appear here</p>
                  </div>
                ) : (
                  conversations
                    .filter(c => !conversationSearch || (c.lead_name || '').toLowerCase().includes(conversationSearch.toLowerCase()) || (c.first_message || '').toLowerCase().includes(conversationSearch.toLowerCase()))
                    .map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedConversation(conv); fetchConversationMessages(conv.id); setTimeout(() => { if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0; }, 50); }}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {conv.lead_name || 'Website Visitor'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${conv.source === 'embed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {conv.source === 'embed' ? 'Website Chat' : 'SMS Agent'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.first_message || 'No messages'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{parseTS(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {fmtTime(conv.created_at)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          conv.outcome === 'booked' ? 'bg-green-100 text-green-700' :
                          conv.outcome === 'callback' ? 'bg-amber-100 text-amber-700' :
                          conv.outcome === 'no_response' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {conv.outcome === 'booked' ? '✓ Booked' :
                           conv.outcome === 'callback' ? '📞 Call Back' :
                           conv.outcome === 'no_response' ? 'No response' :
                           "Didn't book"}
                        </span>
                      </div>
                    </button>
                  ))
                )
              ) : (
                loadingSmsLeads ? (
                  <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div><p className="text-gray-500 mt-3 text-sm">Loading...</p></div>
                ) : smsLeads.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No SMS conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Lead SMS conversations will appear here once your agent sends messages</p>
                  </div>
                ) : (
                  smsLeads
                    .filter(l => !conversationSearch || (l.name || '').toLowerCase().includes(conversationSearch.toLowerCase()) || (l.last_message || '').toLowerCase().includes(conversationSearch.toLowerCase()))
                    .map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => { setSelectedSmsLead(lead); fetchSmsLeadMessages(lead.id); }}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${selectedSmsLead?.id === lead.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">{lead.name || 'Unknown Lead'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lead.status === 'contacted_sms' ? 'bg-green-100 text-green-700' : lead.status === 'sms_failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {lead.status === 'contacted_sms' ? 'Contacted' : lead.status === 'sms_failed' ? 'Failed' : lead.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{lead.last_message || 'No messages'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{lead.phone}</span>
                        <span className="text-xs text-gray-400">{lead.last_message_at ? parseTS(lead.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}{' '}{lead.message_count} msg{lead.message_count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col">
            {conversationType === 'chat' ? (
              !selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Select a conversation</p>
                    <p className="text-gray-400 text-sm mt-1">Choose from the list to view messages</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {selectedConversation.lead_name || 'Website Visitor'}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            selectedConversation.outcome === 'booked' ? 'bg-green-100 text-green-700' :
                            selectedConversation.outcome === 'callback' ? 'bg-amber-100 text-amber-700' :
                            selectedConversation.outcome === 'no_response' ? 'bg-gray-100 text-gray-500' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {selectedConversation.outcome === 'booked' ? '✓ Booked' :
                             selectedConversation.outcome === 'callback' ? '📞 Call Back' :
                             selectedConversation.outcome === 'no_response' ? 'No response' :
                             "Didn't book"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(selectedConversation.created_at)} &middot; {selectedConversation.source === 'embed' ? 'Website Chat Agent' : 'SMS Text Agent'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {selectedConversation.outcome !== 'callback' && (
                          <button
                            onClick={async () => {
                              await authFetch(`${apiUrl}/api/chat/conversations/${selectedConversation.id}/outcome`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ outcome: 'callback' }),
                              });
                              setSelectedConversation(c => ({ ...c, outcome: 'callback' }));
                              setConversations(cs => cs.map(c => c.id === selectedConversation.id ? { ...c, outcome: 'callback' } : c));
                            }}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Call Back
                          </button>
                        )}
                        {selectedConversation.outcome !== 'booked' && (
                          <button
                            onClick={async () => {
                              await authFetch(`${apiUrl}/api/chat/conversations/${selectedConversation.id}/outcome`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ outcome: 'booked' }),
                              });
                              setSelectedConversation(c => ({ ...c, outcome: 'booked' }));
                              setConversations(cs => cs.map(c => c.id === selectedConversation.id ? { ...c, outcome: 'booked' } : c));
                            }}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Booked
                          </button>
                        )}
                        <button onClick={() => { setSelectedConversation(null); setConversationMessages([]); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                    {loadingMessages ? (
                      <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="text-center py-12"><p className="text-gray-400 text-sm">No messages in this conversation</p></div>
                    ) : (
                      conversationMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-white border border-gray-200 text-gray-900' : 'bg-blue-600 text-white'}`}>
                            <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-100'}`}>{msg.role === 'user' ? 'Customer' : 'AI Agent'}</div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-200'}`}>{fmtTime(msg.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )
            ) : (
              !selectedSmsLead ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Phone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Select a lead</p>
                    <p className="text-gray-400 text-sm mt-1">Choose a lead to view their conversation and form submission</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden">
                  {/* Contact Form Data */}
                  <div className="w-64 border-r border-gray-200 overflow-y-auto bg-white flex-shrink-0">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-700">Form Submission</h4>
                      <button onClick={() => { setSelectedSmsLead(null); setSmsLeadMessages([]); }} className="p-1 text-gray-400 hover:text-gray-600 rounded transition"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Name</p><p className="text-gray-900 font-medium">{selectedSmsLead.name || '—'}</p></div>
                      {selectedSmsLead.phone && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone</p><p className="text-gray-700">{selectedSmsLead.phone}</p></div>}
                      {selectedSmsLead.email && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p><p className="text-gray-700 break-all">{selectedSmsLead.email}</p></div>}
                      {selectedSmsLead.service && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Service Requested</p><p className="text-gray-700">{selectedSmsLead.service}</p></div>}
                      {selectedSmsLead.message && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p><p className="text-gray-700 whitespace-pre-wrap">{selectedSmsLead.message}</p></div>}
                      {selectedSmsLead.notes && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p><p className="text-gray-600 italic">{selectedSmsLead.notes}</p></div>}
                      <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Submitted</p><p className="text-gray-500">{parseTS(selectedSmsLead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedSmsLead.status === 'contacted_sms' ? 'bg-green-100 text-green-700' : selectedSmsLead.status === 'sms_failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {selectedSmsLead.status === 'contacted_sms' ? 'Contacted' : selectedSmsLead.status === 'sms_failed' ? 'Failed' : selectedSmsLead.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SMS Thread */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">{selectedSmsLead.name} · SMS Conversation</p>
                      <p className="text-xs text-gray-400">{selectedSmsLead.message_count} message{selectedSmsLead.message_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                      {loadingSmsMessages ? (
                        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>
                      ) : smsLeadMessages.length === 0 ? (
                        <div className="text-center py-12"><p className="text-gray-400 text-sm">No messages in this conversation</p></div>
                      ) : (
                        smsLeadMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.direction === 'incoming' ? 'bg-white border border-gray-200 text-gray-900' : 'bg-green-600 text-white'}`}>
                              <div className={`text-xs font-medium mb-1 ${msg.direction === 'incoming' ? 'text-gray-400' : 'text-green-100'}`}>{msg.direction === 'incoming' ? 'Customer' : 'AI Agent'}</div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-xs mt-2 ${msg.direction === 'incoming' ? 'text-gray-400' : 'text-green-200'}`}>{fmtTime(msg.created_at)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Rewards Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setShowRewardsConfig(!showRewardsConfig)}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Rewards Program Settings</h3>
                  <p className="text-sm text-gray-500">Configure your loyalty rewards program</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${rewardsConfig.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {rewardsConfig.enabled ? 'Active' : 'Inactive'}
                </span>
                {showRewardsConfig ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {showRewardsConfig && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900">Enable Rewards Program</label>
                    <p className="text-sm text-gray-500">Automatically reward loyal customers</p>
                  </div>
                  <button
                    onClick={() => setRewardsConfig({ ...rewardsConfig, enabled: !rewardsConfig.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rewardsConfig.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rewardsConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Milestone Reward */}
                <div className="bg-amber-50 rounded-xl p-5 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    Milestone Reward
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bookings required to earn reward</label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={rewardsConfig.bookingsRequired}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, bookingsRequired: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                        onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 2) setRewardsConfig(c => ({ ...c, bookingsRequired: 5 })); }}
                        onDoubleClick={(e) => e.target.select()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reward description</label>
                      <input
                        type="text"
                        value={rewardsConfig.rewardDescription}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, rewardDescription: e.target.value })}
                        placeholder="e.g., Free interior detail, 50% off next service"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon After Booking */}
                <div className="bg-green-50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-600" />
                      Return Coupon
                    </h4>
                    <button
                      onClick={() => setRewardsConfig({ ...rewardsConfig, couponAfterBooking: !rewardsConfig.couponAfterBooking })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rewardsConfig.couponAfterBooking ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rewardsConfig.couponAfterBooking ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {rewardsConfig.couponAfterBooking && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon offer</label>
                        <input
                          type="text"
                          value={rewardsConfig.couponDescription}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, couponDescription: e.target.value })}
                          placeholder="e.g., 10% off your next booking"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={rewardsConfig.couponFrequency}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, couponFrequency: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="every">After every booking</option>
                          <option value="every_other">Every other booking</option>
                          <option value="every_third">Every 3rd booking</option>
                          <option value="first_only">First booking only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS Timing */}
                <div className="bg-blue-50 rounded-xl p-5 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    SMS Delivery Timing
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">When to send reward/coupon text</label>
                      <select
                        value={rewardsConfig.smsTiming}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsTiming: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="after_completed">After job is completed</option>
                        <option value="after_booking">Right after booking</option>
                        <option value="delay_after_booking">Delayed after booking</option>
                        <option value="delay_after_completed">Delayed after completion</option>
                      </select>
                    </div>
                    {(rewardsConfig.smsTiming === 'delay_after_booking' || rewardsConfig.smsTiming === 'delay_after_completed') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delay (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={rewardsConfig.smsDelayHours}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsDelayHours: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMS template (optional)</label>
                    <textarea
                      value={rewardsConfig.smsTemplate}
                      onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsTemplate: e.target.value })}
                      placeholder="e.g., Hey {name}! Thanks for being a loyal customer. Here's your reward: {reward}. Book your next appointment today!"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Use {'{name}'} for customer name, {'{reward}'} for reward description, {'{bookings}'} for booking count</p>
                  </div>
                </div>

                <button
                  onClick={saveRewardsConfig}
                  disabled={savingRewards}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {savingRewards ? 'Saving...' : 'Save Rewards Settings'}
                </button>
              </div>
            )}
          </div>

          {/* Customer Rewards Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                Customer Progress
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track how close each customer is to earning their reward ({rewardsConfig.bookingsRequired} bookings needed)
              </p>
            </div>

            {loadingRewards ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-3 text-sm">Loading...</p>
              </div>
            ) : rewardsCustomers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No customers with bookings yet</p>
                <p className="text-gray-400 text-xs mt-1">Customers will appear here after their first booking</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rewardsCustomers.map(customer => {
                  const progress = Math.min((customer.booking_count / rewardsConfig.bookingsRequired) * 100, 100);
                  const earned = customer.booking_count >= rewardsConfig.bookingsRequired;
                  return (
                    <div key={customer.id} className={`p-4 flex items-center gap-4 ${earned ? 'bg-amber-50' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${earned ? 'bg-amber-200' : 'bg-gray-100'}`}>
                        {earned ? <Trophy className="w-5 h-5 text-amber-700" /> : <Users className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{customer.name}</span>
                          {earned && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">Reward Earned!</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {customer.email && <span>{customer.email}</span>}
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.last_service && <span>Last: {customer.last_service}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${earned ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {customer.booking_count} / {rewardsConfig.bookingsRequired}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">${Number(customer.lifetime_value || 0).toFixed(0)}</p>
                        <p className="text-xs text-gray-400">lifetime</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddTableModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Lead Table</h2>
              <button onClick={() => setShowAddTableModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ceramic Coating Leads"
                  onKeyDown={(e) => e.key === 'Enter' && createLeadTable()}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddTableModal(false);
                    setNewTableName('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createLeadTable}
                  disabled={!newTableName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Add New {activeTab === 'leads' ? 'Lead' : 'Customer'}
                {activeTab === 'leads' && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    to {leadTables.find(t => t.id === activeLeadTable)?.name}
                  </span>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewRecord({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'leads' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newRecord.name || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRecord.email || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newRecord.phone || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    <select
                      value={newRecord.status || 'new'}
                      onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="contacted_email">Contacted (Email)</option>
                      <option value="contacted_sms">Contacted (SMS)</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                      value={newRecord.source || 'manual'}
                      onChange={(e) => setNewRecord({ ...newRecord, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manual">Manual</option>
                      <option value="lead_form">Lead Form</option>
                      <option value="ai_chat_agent">AI Chat Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newRecord.notes || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Add any notes..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newRecord.name || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRecord.email || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newRecord.phone || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Booked</label>
                    <input
                      type="text"
                      value={newRecord.last_service || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, last_service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paint Correction"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                    <input
                      type="date"
                      value={newRecord.last_service_date || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, last_service_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Review</label>
                    <select
                      value={newRecord.left_review || 'N'}
                      onChange={(e) => setNewRecord({ ...newRecord, left_review: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newRecord.notes || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Add any notes..."
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRecord({});
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addRecord}
                  disabled={!newRecord.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {activeTab === 'leads' ? 'Lead' : 'Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail — full page overlay (portal so parent CSS transforms don't clip it) */}
      {viewingLead && createPortal(
        <div className="fixed inset-0 bg-white z-[60] overflow-y-auto">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4 flex items-start justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{viewingLead.name || 'Unnamed Lead'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(viewingLead.status)}`}>{formatLabel(viewingLead.status)}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSourceColor(viewingLead.source)}`}>{formatLabel(viewingLead.source)}</span>
                {viewingLeadDetail?.isRecurring && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Recurring</span>
                )}
                {viewingLeadDetail?.lead?.left_review === 'Y' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">⭐ Left Review</span>
                )}
              </div>
              {viewingLead.created_at && (
                <p className="text-sm text-gray-500 mt-1">Inquired {fmtDateTime(viewingLead.created_at)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => setViewingLeadEditMode(!viewingLeadEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewingLeadEditMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => { setConvertingLead(viewingLead); setShowConvertModal(true); setViewingLead(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition"
              >
                <Users className="w-3.5 h-3.5" />
                Convert
              </button>
              <button onClick={() => { setViewingLead(null); setViewingLeadDetail(null); setViewingLeadEditMode(false); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 space-y-5">

              {/* Revenue & Booking Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-4">Revenue Summary</h3>
                {viewingLeadDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>Loading...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">${(viewingLeadDetail?.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Spent</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{viewingLeadDetail?.totalBookings || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Bookings</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{viewingLeadDetail?.completedBookings || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Completed Jobs</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className={`text-sm font-bold ${viewingLeadDetail?.isRecurring ? 'text-purple-600' : 'text-gray-500'}`}>
                        {viewingLeadDetail?.isRecurring ? 'Yes' : 'No'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Recurring</p>
                    </div>
                  </div>
                )}
                {viewingLeadDetail?.lastBookingDate && (
                  <div className="mt-3 pt-3 border-t border-blue-100">
                    <p className="text-xs text-gray-500">Last booking</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {new Date(viewingLeadDetail.lastBookingDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {viewingLeadDetail.lastBookingServices && (
                      <p className="text-xs text-gray-500 mt-0.5">{viewingLeadDetail.lastBookingServices}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact Info</h3>
                <div className="space-y-2.5">
                  {viewingLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${viewingLead.email}`} className="text-blue-600 hover:underline text-sm">{viewingLead.email}</a>
                    </div>
                  )}
                  {viewingLead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${viewingLead.phone}`} className="text-blue-600 hover:underline text-sm">{viewingLead.phone}</a>
                    </div>
                  )}
                  {viewingLead.created_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Inquired {fmtDateTime(viewingLead.created_at)}</span>
                    </div>
                  )}
                  {viewingLead.follow_up_date && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Follow-up: {new Date(viewingLead.follow_up_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {viewingLead.sms_consent !== undefined && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${viewingLead.sms_consent ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {viewingLead.sms_consent && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <p className="text-xs text-gray-500">SMS consent {viewingLead.sms_consent ? 'given' : 'not given'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Source & Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Lead Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Source</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSourceColor(viewingLead.source)}`}>{formatLabel(viewingLead.source)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(viewingLead.status)}`}>{formatLabel(viewingLead.status)}</span>
                  </div>
                  {viewingLead.priority && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Priority</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewingLead.priority === 'urgent' ? 'bg-red-100 text-red-700' : viewingLead.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{formatLabel(viewingLead.priority)}</span>
                    </div>
                  )}
                  {viewingLeadDetail?.lead?.left_review && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Google Review</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewingLeadDetail.lead.left_review === 'Y' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {viewingLeadDetail.lead.left_review === 'Y' ? '⭐ Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {viewingLead.google_lsa_lead_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Google LSA</span>
                      <span className="text-xs text-gray-700 font-mono">{viewingLead.google_lsa_lead_id}</span>
                    </div>
                  )}
                  {viewingLead.call_duration > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Call Duration</span>
                      <span className="text-xs text-gray-700">{Math.floor(viewingLead.call_duration / 60)}m {viewingLead.call_duration % 60}s</span>
                    </div>
                  )}
                </div>
                {viewingLead.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingLead.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-5">

              {/* Edit Panel */}
              {viewingLeadEditMode && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                  <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-4">Edit Lead</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Status</label>
                      <select value={viewingLeadEdit.status || ''} onChange={e => setViewingLeadEdit(v => ({ ...v, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="new">New</option>
                        <option value="needs_callback">Needs Callback</option>
                        <option value="contacted">Contacted</option>
                        <option value="contacted_sms">Contacted (SMS)</option>
                        <option value="converted">Converted</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                      <select value={viewingLeadEdit.priority || ''} onChange={e => setViewingLeadEdit(v => ({ ...v, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Normal</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Follow-Up Date</label>
                      <input type="date" value={viewingLeadEdit.follow_up_date || ''} onChange={e => setViewingLeadEdit(v => ({ ...v, follow_up_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                      <textarea value={viewingLeadEdit.notes || ''} onChange={e => setViewingLeadEdit(v => ({ ...v, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Add notes..." />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveViewingLeadEdit} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Save Changes</button>
                    <button onClick={() => setViewingLeadEditMode(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </div>
              )}

              {/* What They Inquired About */}
              {(viewingLead.service || viewingLead.message) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What They Inquired About</h3>
                  <div className="space-y-3">
                    {viewingLead.service && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-0.5">Service</span>
                        <span className="text-sm font-semibold text-gray-900">{viewingLead.service}</span>
                      </div>
                    )}
                    {viewingLead.message && (() => {
                      const parts = viewingLead.message.split(' | ').map(p => p.trim()).filter(Boolean);
                      const isParseable = parts.length > 1 && parts.every(p => p.includes(': '));
                      if (isParseable) {
                        return (
                          <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                            {parts.map((part, i) => {
                              const colonIdx = part.indexOf(': ');
                              const key = part.slice(0, colonIdx);
                              const val = part.slice(colonIdx + 2);
                              return (
                                <div key={i} className={`flex gap-3 px-4 py-2.5 ${i < parts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                  <p className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{key}</p>
                                  <p className="text-sm text-gray-900 font-medium">{val}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      return <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3">{viewingLead.message}</p>;
                    })()}
                    {viewingLead.call_transcript && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Call Transcript</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto">{viewingLead.call_transcript}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Booking History */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Booking History</h3>
                {viewingLeadDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>Loading...</div>
                ) : !viewingLeadDetail?.bookings?.length ? (
                  <p className="text-sm text-gray-400 italic">No bookings found for this lead.</p>
                ) : (
                  <div className="space-y-2">
                    {viewingLeadDetail.bookings.map((b, idx) => (
                      <div key={b.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date((b.booking_date || '').toString().slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {b.start_time && <span className="text-xs text-gray-500">{fmtTime(b.start_time)}</span>}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {formatLabel(b.status)}
                            </span>
                          </div>
                          {b.services && <p className="text-xs text-gray-500 mt-0.5 truncate">{b.services}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">${parseFloat(b.total_amount || 0).toFixed(0)}</p>
                          {b.payment_status && <p className="text-xs text-gray-400">{formatLabel(b.payment_status)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation History */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversations</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setViewingLeadConvTab('sms')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${viewingLeadConvTab === 'sms' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>SMS</button>
                    <button onClick={() => setViewingLeadConvTab('chat')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${viewingLeadConvTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Chat Agent</button>
                  </div>
                </div>
                {viewingLeadConvTab === 'chat' ? (
                  viewingLeadChatLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>Loading...</div>
                  ) : viewingLeadChatMessages.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No chat messages found for this lead.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {viewingLeadChatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'}`}>
                            <p className={`text-xs font-medium mb-0.5 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-200'}`}>{msg.role === 'user' ? 'Customer' : 'AI Agent'}</p>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-200'}`}>{fmtDateTime(msg.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  !viewingLead.phone ? (
                    <p className="text-sm text-gray-400 italic">No phone number — no SMS conversation available.</p>
                  ) : viewingLeadSmsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>Loading...</div>
                  ) : viewingLeadSmsMessages.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No SMS messages yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {viewingLeadSmsMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.direction === 'incoming' ? 'bg-gray-100 text-gray-900' : 'bg-green-600 text-white'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.direction === 'incoming' ? 'text-gray-400' : 'text-green-200'}`}>{fmtDateTime(msg.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Analytics Tab ─────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lead Source Analytics</h2>
              <p className="text-sm text-gray-500 mt-0.5">Revenue, conversion, and ROI by acquisition channel</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date range selector */}
              <div className="relative">
                <button
                  onClick={() => setShowRangeMenu(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <Clock className="w-4 h-4 text-gray-500" />
                  {rangeLabel}
                  {analyticsRange.preset !== 'all_time' && analyticsRange.startDate && (
                    <span className="text-xs text-gray-500">
                      ({analyticsRange.startDate}{analyticsRange.endDate ? ` → ${analyticsRange.endDate}` : ''})
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showRangeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowRangeMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
                      {[
                        ['this_month', 'This Month'],
                        ['last_month', 'Last Month'],
                        ['last_3_months', 'Last 3 Months'],
                        ['last_6_months', 'Last 6 Months'],
                        ['this_year', 'This Year'],
                        ['all_time', 'All Time'],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => applyRangePreset(key)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${analyticsRange.preset === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 px-3 mb-1 font-semibold">Custom</p>
                        <div className="flex items-center gap-2 px-3 py-1">
                          <input
                            type="date"
                            value={analyticsRange.startDate || ''}
                            onChange={e => setCustomRange('startDate', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <span className="text-xs text-gray-400">→</span>
                          <input
                            type="date"
                            value={analyticsRange.endDate || ''}
                            onChange={e => setCustomRange('endDate', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowAdSpendModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Log Ad Spend
              </button>
            </div>
          </div>

          {/* Verification request modal (always rendered, controlled by state) */}
          {showVerifyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowVerifyModal(null)}>
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Submit {platformLabel(showVerifyModal)} Account</h3>
                  <button onClick={() => setShowVerifyModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the Google account email associated with your {platformLabel(showVerifyModal)} account. We'll verify access and email you when you're approved to connect (usually within 24 hours).
                </p>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Email</label>
                <input
                  type="email"
                  value={verifyEmail}
                  onChange={e => setVerifyEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitVerification}
                    disabled={!verifyEmail || submittingVerify}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingVerify ? 'Submitting…' : 'Submit Request'}
                  </button>
                  <button onClick={() => setShowVerifyModal(null)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast notification */}
          {adConnectToast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${adConnectToast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {adConnectToast.type === 'success' ? '✓' : '✕'} {adConnectToast.msg}
            </div>
          )}

          {analyticsLoading ? (
            <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-3">Loading analytics...</p></div>
          ) : !analyticsData ? (
            <div className="text-center py-16 text-gray-400">Click the Analytics tab again to load data.</div>
          ) : analyticsData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No lead data yet.</div>
          ) : (() => {
            const totalLeads = analyticsData.reduce((s, r) => s + r.lead_count, 0);
            const totalSpend = analyticsData.reduce((s, r) => s + r.ad_spend, 0);
            // Backend already returns transaction revenue minus the user's default tax rate
            const transactionRevenueNoTax = Math.max(0, totalTransactionRevenue);
            // ROI uses real transaction revenue minus tax (non-tax number)
            const overallRoi = totalSpend > 0 ? (((transactionRevenueNoTax - totalSpend) / totalSpend) * 100).toFixed(1) : null;

            // Pie chart helpers
            const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
            const pieData = analyticsData.map((r, i) => ({ label: formatLabel(r.source), value: r.lead_count, color: COLORS[i % COLORS.length] }));
            const total = pieData.reduce((s, d) => s + d.value, 0);
            let cumAngle = -Math.PI / 2;
            const slices = pieData.map(d => {
              const angle = (d.value / Math.max(total, 1)) * 2 * Math.PI;
              const start = cumAngle;
              cumAngle += angle;
              const r = 80;
              const cx = 100, cy = 100;
              const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
              const x2 = cx + r * Math.cos(start + angle), y2 = cy + r * Math.sin(start + angle);
              const large = angle > Math.PI ? 1 : 0;
              return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z` };
            });

            return (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Leads', value: totalLeads, color: 'blue' },
                    { label: 'Booking Revenue', value: `$${totalBookingRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'green', onClick: () => openRevenueDrilldown('bookings') },
                    {
                      label: 'Transaction Revenue',
                      value: `$${transactionRevenueNoTax.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
                      subValue: `+tax $${totalTransactionTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      color: 'green',
                      onClick: () => openRevenueDrilldown('transactions'),
                    },
                    { label: 'Total Ad Spend', value: `$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'orange' },
                    { label: 'Overall ROI', value: overallRoi !== null ? `${overallRoi}%` : 'N/A', color: overallRoi !== null && overallRoi > 0 ? 'green' : 'red' },
                  ].map(kpi => (
                    <div
                      key={kpi.label}
                      onClick={kpi.onClick}
                      className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 ${kpi.color === 'green' ? 'border-l-green-500' : kpi.color === 'blue' ? 'border-l-blue-500' : kpi.color === 'orange' ? 'border-l-amber-500' : 'border-l-red-500'} ${kpi.onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition' : ''}`}
                    >
                      <p className="text-xs text-gray-500 font-medium flex items-center justify-between">
                        {kpi.label}
                        {kpi.onClick && <span className="text-[10px] text-blue-600 font-semibold">View →</span>}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.color === 'green' ? 'text-green-700' : kpi.color === 'blue' ? 'text-blue-700' : kpi.color === 'orange' ? 'text-amber-600' : 'text-red-600'}`}>{kpi.value}</p>
                      {kpi.subValue && <p className="text-xs text-gray-500 mt-1">{kpi.subValue}</p>}
                    </div>
                  ))}
                </div>

                {/* Pie chart + source table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Pie chart */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 self-start">Leads by Source</h3>
                    <svg viewBox="0 0 200 200" className="w-44 h-44">
                      {slices.map((s, i) => (
                        <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />
                      ))}
                    </svg>
                    <div className="mt-4 space-y-1.5 w-full">
                      {slices.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-gray-600 truncate flex-1">{s.label}</span>
                          <span className="text-xs font-semibold text-gray-700">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source table */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">ROI by Source</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Source</th>
                            <th className="px-4 py-3 text-right font-medium">Leads</th>
                            <th className="px-4 py-3 text-right font-medium">Converted</th>
                            <th className="px-4 py-3 text-right font-medium">Revenue</th>
                            <th className="px-4 py-3 text-right font-medium">Ad Spend</th>
                            <th className="px-4 py-3 text-right font-medium">Cost/Lead</th>
                            <th className="px-4 py-3 text-right font-medium">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analyticsData.map((row, i) => (
                            <tr key={row.source || i} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="font-medium text-gray-900">{formatLabel(row.source)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">{row.lead_count}</td>
                              <td className="px-4 py-3 text-right text-gray-700">{row.converted_count}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-700">${Number(row.revenue).toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {row.ad_spend > 0 ? `$${Number(row.ad_spend).toLocaleString('en-US', { minimumFractionDigits: 0 })}` : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {row.cost_per_lead ? `$${row.cost_per_lead}` : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.roi !== null ? (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${parseFloat(row.roi) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {parseFloat(row.roi) >= 0 ? '+' : ''}{row.roi}%
                                  </span>
                                ) : <span className="text-gray-300 text-xs">No spend logged</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Ad Spend Log */}
                {adSpendEntries.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Ad Spend Log</h3>
                      <button onClick={() => setShowAdSpendModal(true)} className="text-xs text-blue-600 hover:underline">+ Add Entry</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Source</th>
                            <th className="px-4 py-3 text-left font-medium">Month</th>
                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium">Notes</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {adSpendEntries.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{formatLabel(e.source)}</td>
                              <td className="px-4 py-3 text-gray-600">{e.month}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(e.amount).toFixed(2)}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{e.notes || '—'}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => deleteAdSpend(e.id)} className="text-xs text-red-500 hover:text-red-700 transition">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Ad Platform Connections — always rendered, regardless of analyticsData */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Ad Platform Connections</h3>
                <p className="text-xs text-gray-500 mt-0.5">Auto-sync ad spend from Google Ads and Google Local Services</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'google_ads', label: 'Google Ads', icon: '🔵', color: 'blue', needsVerify: true },
                { key: 'google_lsa', label: 'Google LSA', icon: '🟢', color: 'green', needsVerify: true },
              ].map(card => {
                const conn = adConnections.find(c => c.platform === card.key);
                const verif = adVerifications.find(v => v.platform === card.key);
                const isConnected = !!conn;
                const isConnecting = adConnecting === card.key;
                const isSyncing = adSyncing === card.key;
                const verifStatus = verif?.status;

                return (
                  <div key={card.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{card.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{card.label}</p>
                          {isConnected ? (
                            <p className="text-xs text-green-600 font-medium mt-0.5">✓ Connected</p>
                          ) : verifStatus === 'pending' ? (
                            <p className="text-xs text-amber-600 font-medium mt-0.5">⏳ Pending verification</p>
                          ) : verifStatus === 'verified' ? (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">✓ Verified — ready to connect</p>
                          ) : verifStatus === 'rejected' ? (
                            <p className="text-xs text-red-600 font-medium mt-0.5">✕ Verification rejected</p>
                          ) : card.needsVerify ? (
                            <p className="text-xs text-gray-500 mt-0.5">Not verified</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-0.5">Not connected</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {isConnected ? (
                      <div className="space-y-2">
                        {conn.last_synced_at && (
                          <p className="text-xs text-gray-500">Last synced: {new Date(conn.last_synced_at).toLocaleString()}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => syncAdPlatform(card.key)}
                            disabled={isSyncing}
                            className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            {isSyncing ? 'Syncing…' : 'Sync now'}
                          </button>
                          <button
                            onClick={() => disconnectAdPlatform(card.key)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium transition"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : verifStatus === 'verified' ? (
                      <button
                        onClick={() => connectAdPlatform(card.key)}
                        disabled={isConnecting}
                        className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {isConnecting ? 'Connecting…' : `Connect ${card.label}`}
                      </button>
                    ) : verifStatus === 'pending' ? (
                      <div className="text-xs text-gray-500 italic py-2 text-center bg-amber-50 rounded-md">
                        Awaiting admin approval. Check your email soon.
                      </div>
                    ) : verifStatus === 'rejected' ? (
                      <button
                        onClick={() => { setVerifyEmail(''); setShowVerifyModal(card.key); }}
                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition"
                      >
                        Resubmit for verification
                      </button>
                    ) : card.needsVerify ? (
                      <button
                        onClick={() => { setVerifyEmail(''); setShowVerifyModal(card.key); }}
                        className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        Submit for verification
                      </button>
                    ) : (
                      <button
                        onClick={() => connectAdPlatform(card.key)}
                        disabled={isConnecting}
                        className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {isConnecting ? 'Connecting…' : `Connect ${card.label}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Drill-down Modal (Bookings / Transactions) */}
      {revenueDrilldown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={closeRevenueDrilldown}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {revenueDrilldown === 'bookings' ? 'Booking Revenue — All Bookings' : 'Transaction Revenue — All Transactions'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {analyticsRange.startDate ? `${analyticsRange.startDate}${analyticsRange.endDate ? ` → ${analyticsRange.endDate}` : ''}` : 'All time'}
                  {` · ${drilldownItems.length} item${drilldownItems.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={drilldownSearch}
                    onChange={e => setDrilldownSearch(e.target.value)}
                    placeholder="Search name, service..."
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 w-56"
                  />
                </div>
                <button onClick={closeRevenueDrilldown} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6">
              {drilldownLoading ? (
                <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-3">Loading...</p></div>
              ) : (() => {
                const q = drilldownSearch.trim().toLowerCase();
                const filtered = drilldownItems.filter(item => {
                  if (!q) return true;
                  const hay = revenueDrilldown === 'bookings'
                    ? `${item.customer_name || ''} ${item.customer_email || ''} ${item.services || ''} ${item.source || ''}`
                    : `${item.customer_name || item.booking_customer_name || ''} ${item.customer_email || ''} ${item.processor || ''} ${item.invoice_number || ''}`;
                  return hay.toLowerCase().includes(q);
                });
                if (filtered.length === 0) {
                  return <div className="text-center py-12 text-gray-400 text-sm">No {revenueDrilldown} in this range.</div>;
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(item => (
                      <DrilldownCard
                        key={item.id}
                        item={item}
                        kind={revenueDrilldown}
                        onSaveNote={(note) => saveDrilldownNote(item.id, note)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Ad Spend Modal */}
      {showAdSpendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdSpendModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Log Ad Spend</h3>
              <button onClick={() => setShowAdSpendModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Source / Platform</label>
                <input
                  list="ad-sources"
                  value={adSpendForm.source}
                  onChange={e => setAdSpendForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="e.g. google_ads, google_lsa, meta, yelp..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="ad-sources">
                  <option value="google_ads" />
                  <option value="google_lsa" />
                  <option value="meta" />
                  <option value="yelp" />
                  <option value="nextdoor" />
                  <option value="thumbtack" />
                  <option value="angi" />
                  <option value="homeadvisor" />
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adSpendForm.amount}
                    onChange={e => setAdSpendForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Month</label>
                  <input
                    type="month"
                    value={adSpendForm.month}
                    onChange={e => setAdSpendForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Notes (optional)</label>
                <input
                  type="text"
                  value={adSpendForm.notes}
                  onChange={e => setAdSpendForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Campaign name, notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveAdSpend} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Save Entry</button>
              <button onClick={() => setShowAdSpendModal(false)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Source Tag Rules Modal */}
      {showTagRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowTagRulesModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Source Tag Labels</h3>
                <p className="text-xs text-gray-400 mt-0.5">Customize how source names appear on lead cards</p>
              </div>
              <button onClick={() => setShowTagRulesModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Existing rules */}
            {sourceTagRules.length > 0 && (
              <div className="mb-5 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active Tags</p>
                {sourceTagRules.map(rule => (
                  <div key={rule.source} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{formatLabel(rule.source)}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-1" style={{ backgroundColor: rule.color + '20', color: rule.color }}>{rule.tag}</span>
                    <div className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300" style={{ backgroundColor: rule.color }} />
                    <button onClick={() => deleteTagRule(rule.source)} className="p-1 text-gray-400 hover:text-red-500 transition flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new rule */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Add / Update Tag</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Source</label>
                  <select
                    value={tagRuleForm.source}
                    onChange={e => setTagRuleForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source…</option>
                    <option value="lead_form">lead_form</option>
                    <option value="ai_chat_agent">ai_chat_agent</option>
                    <option value="google_lsa">google_lsa</option>
                    <option value="inbound_call">inbound_call</option>
                    <option value="manual">manual</option>
                    {leadTables.flatMap(t => t.leads).map(l => l.source).filter((s, i, arr) => s && arr.indexOf(s) === i && !['lead_form','ai_chat_agent','google_lsa','inbound_call','manual'].includes(s)).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tag Label</label>
                  <input
                    type="text"
                    value={tagRuleForm.tag}
                    onChange={e => setTagRuleForm(f => ({ ...f, tag: e.target.value }))}
                    placeholder="e.g. Website Lead"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs text-gray-500">Badge Color</label>
                <input type="color" value={tagRuleForm.color} onChange={e => setTagRuleForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-300" />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: tagRuleForm.color + '20', color: tagRuleForm.color }}>{tagRuleForm.tag || 'Preview'}</span>
              </div>
              <button
                onClick={saveTagRule}
                disabled={!tagRuleForm.source || !tagRuleForm.tag}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40"
              >
                Save Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Panel */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end" onClick={() => { setViewingCustomer(null); setViewingCustomerEditMode(false); }}>
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingCustomer.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{viewingCustomer.total_jobs ? `${viewingCustomer.total_jobs} booking${viewingCustomer.total_jobs !== 1 ? 's' : ''}` : 'No bookings'}{viewingCustomer.lifetime_value ? ` · $${Number(viewingCustomer.lifetime_value).toFixed(2)} lifetime` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewingCustomerEditMode(!viewingCustomerEditMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewingCustomerEditMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => { setViewingCustomer(null); setViewingCustomerEditMode(false); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Contact */}
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</h3>
              <div className="space-y-2">
                {viewingCustomer.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><a href={`mailto:${viewingCustomer.email}`} className="text-blue-600 hover:underline text-sm">{viewingCustomer.email}</a></div>}
                {viewingCustomer.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><a href={`tel:${viewingCustomer.phone}`} className="text-blue-600 hover:underline text-sm">{viewingCustomer.phone}</a></div>}
              </div>
            </div>

            {/* Service History */}
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Service History</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {viewingCustomer.last_service && <div><p className="text-xs text-gray-400 mb-1">Last Service</p><p className="text-gray-900 font-medium">{viewingCustomer.last_service}</p></div>}
                {viewingCustomer.last_service_date && <div><p className="text-xs text-gray-400 mb-1">Last Visit</p><p className="text-gray-900">{new Date(viewingCustomer.last_service_date.toString().slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>}
                {viewingCustomer.left_review && <div><p className="text-xs text-gray-400 mb-1">Left Review</p><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewingCustomer.left_review === 'Y' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{viewingCustomer.left_review === 'Y' ? 'Yes' : 'No'}</span></div>}
              </div>
              {viewingCustomer.notes && <div className="mt-3"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingCustomer.notes}</p></div>}
            </div>

            {/* Edit Panel */}
            {viewingCustomerEditMode && (
              <div className="p-5 border-b border-blue-100 bg-blue-50">
                <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-4">Edit Customer</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input type="text" value={viewingCustomerEdit.phone || ''} onChange={e => setViewingCustomerEdit(v => ({ ...v, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                    <div><label className="text-xs text-gray-500 mb-1 block">Email</label><input type="text" value={viewingCustomerEdit.email || ''} onChange={e => setViewingCustomerEdit(v => ({ ...v, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                  </div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Last Service</label><input type="text" value={viewingCustomerEdit.last_service || ''} onChange={e => setViewingCustomerEdit(v => ({ ...v, last_service: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-500 mb-1 block">Last Visit Date</label><input type="date" value={viewingCustomerEdit.last_service_date?.toString().slice(0,10) || ''} onChange={e => setViewingCustomerEdit(v => ({ ...v, last_service_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                    <div><label className="text-xs text-gray-500 mb-1 block">Left Review</label><select value={viewingCustomerEdit.left_review || 'N'} onChange={e => setViewingCustomerEdit(v => ({ ...v, left_review: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="N">No</option><option value="Y">Yes</option></select></div>
                  </div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Notes</label><textarea value={viewingCustomerEdit.notes || ''} onChange={e => setViewingCustomerEdit(v => ({ ...v, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="Add notes..." /></div>
                  <div className="flex gap-2">
                    <button onClick={saveViewingCustomerEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Save Changes</button>
                    <button onClick={() => setViewingCustomerEditMode(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSmsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-white md:rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col" style={{ maxHeight: '100dvh' }}>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white md:rounded-t-2xl flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold">SMS Conversation</h2>
                <p className="text-green-100 mt-1">{selectedLead.name} • {selectedLead.phone}</p>
              </div>
              <button
                onClick={() => {
                  setShowSmsModal(false);
                  setSelectedLead(null);
                  setSmsConversation([]);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-gray-50">
              {smsConversation.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No SMS messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smsConversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          msg.direction === 'outgoing'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-500'
                          }`}
                        >
                          {fmtDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-gray-200 bg-white md:rounded-b-2xl flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSmsMessage}
                  onChange={(e) => setNewSmsMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendManualSms()}
                  placeholder="Type your message..."
                  maxLength="320"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={sendManualSms}
                  disabled={sendingSms || !newSmsMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingSms ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{newSmsMessage.length} / 320 characters</p>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Customer Modal */}
      {showConvertModal && convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-amber-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Convert to Customer</h2>
              <p className="text-amber-100 mt-1">{convertingLead.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lead Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {convertingLead.name}</p>
                  <p><span className="font-medium">Email:</span> {convertingLead.email || '-'}</p>
                  <p><span className="font-medium">Phone:</span> {convertingLead.phone || '-'}</p>
                  <p><span className="font-medium">Source:</span> {convertingLead.source || 'manual'}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This will create a new customer record and mark the lead as converted.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertingLead(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={convertLeadToCustomer}
                disabled={isConverting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-lg hover:from-amber-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>Converting...</>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Convert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Column Mapper Modal */}
      {csvMapper && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Map CSV Columns</h2>
                <p className="text-amber-100 text-sm mt-0.5">{csvMapper.rows.length} rows detected — confirm which columns hold which data</p>
              </div>
              <button onClick={() => setCsvMapper(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Column mapping grid */}
              <div className="grid grid-cols-2 gap-3">
                {(csvMapper.tab === 'leads' ? [
                  { key: 'fullName',  label: 'Full Name' },
                  { key: 'firstName', label: 'First Name' },
                  { key: 'lastName',  label: 'Last Name' },
                  { key: 'email',     label: 'Email' },
                  { key: 'phone',     label: 'Phone' },
                  { key: 'status',    label: 'Status' },
                  { key: 'source',    label: 'Source' },
                  { key: 'notes',     label: 'Notes' },
                ] : [
                  { key: 'fullName',    label: 'Full Name' },
                  { key: 'firstName',   label: 'First Name' },
                  { key: 'lastName',    label: 'Last Name' },
                  { key: 'email',       label: 'Email' },
                  { key: 'phone',       label: 'Phone' },
                  { key: 'service',     label: 'Last Service' },
                  { key: 'serviceDate', label: 'Service Date' },
                  { key: 'notes',       label: 'Notes' },
                ]).map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
                    <select
                      value={csvMappings[field.key] ?? -1}
                      onChange={e => setCsvMappings(prev => ({ ...prev, [field.key]: parseInt(e.target.value, 10) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value={-1}>— Not in CSV —</option>
                      {csvMapper.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview (first 3 rows)</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvMapper.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvMapper.rows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-t border-gray-100">
                          {csvMapper.headers.map((_, ci) => (
                            <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[160px] truncate border-r border-gray-100 last:border-r-0">
                              {row[ci] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Tip:</strong> Only "Full Name" or "First Name" is required. All other fields are optional — rows missing email or phone will still be imported.
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setCsvMapper(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCSVImport}
                disabled={csvImporting}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {csvImporting ? 'Importing...' : `Import ${csvMapper.rows.length} Rows`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// LeadsTable component
function LeadsTable({ leads, columns, openViewingLead, deleteLead, setConvertingLead, setShowConvertModal, getLeadAgeFlag, isFollowUpOverdue }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads in this table</h3>
        <p className="text-gray-600">Add your first lead to get started</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: col.width }}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                {col.label}
              </div>
            </th>
          ))}
          <th className="w-12 px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {leads.map((lead, idx) => {
          const ageFlag = getLeadAgeFlag ? getLeadAgeFlag(lead) : null;
          const followUpOverdue = isFollowUpOverdue ? isFollowUpOverdue(lead) : false;
          return (
          <tr key={lead.id} onClick={() => openViewingLead(lead)} className={`cursor-pointer hover:bg-blue-50 transition ${ageFlag?.level === 'urgent' ? 'bg-red-50' : ageFlag?.level === 'warn' ? 'bg-amber-50' : ''}`}>
            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm">
                {col.key === 'name' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-blue-600 font-medium">{lead.name || <span className="text-gray-400">-</span>}</span>
                    {ageFlag && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${ageFlag.level === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        <AlertCircle className="w-3 h-3" />{ageFlag.label}
                      </span>
                    )}
                  </div>
                ) : col.key === 'status' ? (
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
                ) : col.key === 'priority' ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lead.priority === 'urgent' ? 'bg-red-100 text-red-700' : lead.priority === 'high' ? 'bg-orange-100 text-orange-700' : lead.priority === 'low' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>{formatLabel(lead.priority || 'normal')}</span>
                ) : col.key === 'follow_up_date' ? (
                  lead.follow_up_date ? (
                    <span className={`flex items-center gap-1 text-xs font-medium ${followUpOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                      {followUpOverdue && <Bell className="w-3 h-3" />}
                      {new Date(lead.follow_up_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>
                ) : col.key === 'source' ? (
                  <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
                ) : col.type === 'datetime' ? (
                  lead[col.key] ? <span className="text-gray-600 text-xs">{parseTS(lead[col.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-gray-400">—</span>
                ) : (
                  <span className="text-gray-700">{lead[col.key] || <span className="text-gray-400">—</span>}</span>
                )}
              </td>
            ))}
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setConvertingLead(lead); setShowConvertModal(true); }} className="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Convert to Customer"><Users className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete Lead"><Trash2 className="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CustomersTable({ customers, columns, openViewingCustomer, deleteCustomer }) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
        <p className="text-gray-600">Convert leads or add bookings</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: col.width }}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                {col.label}
              </div>
            </th>
          ))}
          <th className="w-12 px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {customers.map((customer, idx) => (
          <tr key={customer.id} onClick={() => openViewingCustomer(customer)} className="cursor-pointer hover:bg-blue-50 transition">
            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm">
                {col.key === 'name' ? (
                  <span className="text-blue-600 font-medium">{customer.name || <span className="text-gray-400">—</span>}</span>
                ) : col.key === 'left_review' ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer[col.key] === 'Y' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{customer[col.key] === 'Y' ? 'Yes' : 'No'}</span>
                ) : col.key === 'last_service_date' ? (
                  customer[col.key] ? (() => { const d = customer[col.key].toString().slice(0, 10).split('-'); return new Date(d[0], d[1] - 1, d[2]).toLocaleDateString(); })() : <span className="text-gray-400">—</span>
                ) : (
                  <span className="text-gray-700">{customer[col.key] || <span className="text-gray-400">—</span>}</span>
                )}
              </td>
            ))}
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getStatusColor(status) {
  const colors = {
    new: 'bg-yellow-100 text-yellow-700',
    needs_callback: 'bg-red-100 text-red-700',
    contacted_email: 'bg-blue-100 text-blue-700',
    contacted_sms: 'bg-green-100 text-green-700',
    qualified: 'bg-amber-100 text-amber-700',
    converted: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function getSourceColor(source) {
  const colors = {
    ai_chat_agent: 'bg-amber-100 text-amber-700',
    lead_form: 'bg-blue-100 text-blue-700',
    manual: 'bg-gray-100 text-gray-700',
  };
  return colors[source] || 'bg-gray-100 text-gray-700';
}

function formatLabel(value) {
  if (!value) return '-';
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
