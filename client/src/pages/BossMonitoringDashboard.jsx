import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function BossMonitoringDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data)); }, []);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Monitoring Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Panel title="Users" rows={[['Total users', data?.users ?? 0]]} />
        <Panel title="Tasks" rows={(data?.tasks || []).map((x) => [x._id, x.count])} />
        <Panel title="Equipment" rows={(data?.equipment || []).map((x) => [x._id, x.count])} />
        <Panel title="Expenses" rows={(data?.expenses || []).map((x) => [`${x._id} (Rs ${x.amount})`, x.count])} />
      </div>
    </div>
  );
}

function Panel({ title, rows }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h3 className="mb-3 font-semibold">{title}</h3>{rows.map(([k, v]) => <div key={k} className="flex justify-between border-t border-slate-100 py-2 text-sm"><span>{k}</span><b>{v}</b></div>)}</div>;
}
