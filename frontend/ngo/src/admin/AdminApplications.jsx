import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function AdminApplications() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetchRows()
  }, [])

  async function fetchRows() {
    try {
      const data = await api('/api/admin/applications')
      setRows(data.applications || [])
    } catch {
      setRows([])
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api(`/api/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      setRows(rows.map(r => r.id === id ? { ...r, status } : r))
    } catch (e) {
      alert(`Could not update status: ${e.message}`)
    }
  }

  return (
    <div className="min-w-0">
      <h1 className="mb-2 text-[1.6rem] font-semibold text-green-900">
        Volunteer &amp; internship applications
      </h1>
      <p className="mb-5 text-sm text-slate-600">
        Submissions from public registration forms.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Date
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Kind
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Name
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Email
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Phone
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Interest
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Target Event
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600">
                Status
              </th>
              <th className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-right text-xs font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : ''}
                </td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">{a.kind}</td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">{a.name}</td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">{a.email}</td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">{a.phone || '—'}</td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">
                  {a.interest || a.message || '—'}
                </td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top font-medium text-emerald-700">
                  {a.event?.title || 'General / None'}
                </td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                    a.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {a.status || 'pending'}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-3.5 py-2.5 align-top text-right whitespace-nowrap">
                  {(!a.status || a.status === 'pending') && (
                    <div className="flex justify-end gap-3">
                       <button onClick={() => handleStatusChange(a.id, 'approved')} className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs cursor-pointer">Approve</button>
                       <button onClick={() => handleStatusChange(a.id, 'rejected')} className="text-red-600 hover:text-red-800 font-semibold text-xs cursor-pointer">Reject</button>
                    </div>
                  )}
                  {a.status && a.status !== 'pending' && (
                    <button onClick={() => handleStatusChange(a.id, 'pending')} className="text-slate-400 hover:text-slate-600 font-medium text-xs cursor-pointer">Reset</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
