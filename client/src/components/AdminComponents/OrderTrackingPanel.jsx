import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

const STATUS_OPTIONS = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  placed: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Placed' },
  confirmed: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Confirmed' },
  shipped: { bg: '#ecfeff', border: '#a5f3fc', text: '#0891b2', label: 'Shipped' },
  out_for_delivery: { bg: '#fefce8', border: '#fde68a', text: '#ca8a04', label: 'Out for delivery' },
  delivered: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Delivered' },
  cancelled: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Cancelled' },
};

export default function OrderTrackingPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [error, setError] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/orders`, { withCredentials: true });
      setOrders(res.data.orders || []);
      setError('');
      setStatusDrafts((prev) => {
        const next = { ...prev };
        (res.data.orders || []).forEach((order) => {
          if (!next[order._id]) {
            next[order._id] = order.status;
          }
        });
        return next;
      });
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const grouped = useMemo(() => ({
    active: orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled'),
    closed: orders.filter((order) => order.status === 'delivered' || order.status === 'cancelled'),
  }), [orders]);

  const handleStatusChange = (orderId, value) => {
    setStatusDrafts((prev) => ({ ...prev, [orderId]: value }));
  };

  const updateStatus = async (orderId) => {
    setSavingOrderId(orderId);
    try {
      const status = statusDrafts[orderId];
      await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, { status }, { withCredentials: true });
      await fetchOrders();
    } catch {
      setError('Failed to update order status.');
    } finally {
      setSavingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="h-4 w-32 rounded mb-3" style={{ backgroundColor: '#e8e4dc' }} />
            <div className="h-3 w-2/3 rounded mb-2" style={{ backgroundColor: '#e8e4dc' }} />
            <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#e8e4dc' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { title: 'Active Orders', items: grouped.active },
          { title: 'Completed / Cancelled', items: grouped.closed },
        ].map((section) => (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold" style={{ color: '#1e293b' }}>{section.title}</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                {section.items.length}
              </span>
            </div>

            {section.items.length === 0 ? (
              <div className="rounded-2xl border p-6 text-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#64748b' }}>
                No orders in this section.
              </div>
            ) : (
              section.items.map((order) => {
                const st = STATUS_STYLES[order.status] || STATUS_STYLES.placed;
                const currentDraft = statusDrafts[order._id] || order.status;
                const timeline = order.trackingNotes || [];

                return (
                  <div key={order._id} className="rounded-2xl border p-5" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.text }}>
                            {st.label}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                            #{order.orderNumber}
                          </span>
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{order.item?.title}</p>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                          Buyer: {order.buyer?.username || order.buyer?.email || 'Unknown'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                          Seller: {order.seller?.username || order.seller?.email || 'Unknown'}
                        </p>
                      </div>
                      <p className="text-sm font-extrabold" style={{ color: '#1d4ed8' }}>₹{order.amount}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Update Status</label>
                        <select
                          value={currentDraft}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' }}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{STATUS_STYLES[status]?.label || status}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => updateStatus(order._id)}
                          disabled={savingOrderId === order._id}
                          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}
                        >
                          {savingOrderId === order._id ? 'Saving…' : 'Update Status'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Tracking Notes</p>
                      <div className="space-y-2">
                        {timeline.slice(-4).map((entry, idx) => (
                          <div key={`${entry.status}-${idx}`} className="flex items-start gap-2">
                            <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: (STATUS_STYLES[entry.status] || STATUS_STYLES.placed).text }} />
                            <div>
                              <p className="text-xs font-bold" style={{ color: '#1e293b' }}>{STATUS_STYLES[entry.status]?.label || entry.status}</p>
                              <p className="text-[11px]" style={{ color: '#64748b' }}>{entry.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={fetchOrders} className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#475569' }}>
          Refresh Orders
        </button>
      </div>
    </div>
  );
}
