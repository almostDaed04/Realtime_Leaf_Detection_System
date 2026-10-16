import { useState } from 'react';
import api from '../api/axios';

/**
 * AdminUserTable — Displays users with delete functionality.
 */
const AdminUserTable = ({ users, onUserDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}" and all their predictions?`)) {
      return;
    }

    setDeletingId(userId);
    setError('');

    try {
      await api.delete(`/admin/users/${userId}`);
      onUserDeleted(userId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-card overflow-hidden">
      {error && (
        <div className="alert alert-error m-4 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email verified</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Predictions</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg. confidence</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-300">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-200">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-400">{user.email}</td>
                <td className="px-6 py-5">
                  <span className={`
                    inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                    ${user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                      : 'bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50'
                    }
                  `}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`
                      inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                      ${user.accountStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : user.accountStatus === 'deactivated'
                        ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                        : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                      }
                    `}>
                      {user.accountStatus === 'deactivated' ? 'Paused' : user.accountStatus}
                    </span>
                    {user.accountStatus === 'deactivated' && user.deactivatedUntil && (
                      <span className="text-[11px] text-amber-400/80" title={`Scheduled until ${new Date(user.deactivatedUntil).toLocaleString()}`}>
                        Until {new Date(user.deactivatedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-400">{user.isVerified ? 'Yes' : 'No'}</td>
                <td className="px-6 py-5 text-sm text-slate-300 text-right">{user.predictionCount}</td>
                <td className="px-6 py-5 text-sm text-slate-300 text-right">
                  {user.averageConfidence == null ? '—' : `${user.averageConfidence}%`}
                </td>
                <td className="px-6 py-5 text-sm text-slate-400">
                  {formatDate(user.registrationDate)}
                </td>
                <td className="px-6 py-5 text-right">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(user._id, user.username)}
                      disabled={deletingId === user._id}
                      className="btn btn-danger text-xs py-1.5 px-3 hover:scale-105"
                    >
                      {deletingId === user._id ? (
                        <span className="spinner w-3 h-3 border-2 border-white/30 border-t-white"></span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center">
          <span className="text-4xl mb-3">👥</span>
          <p>No users found.</p>
        </div>
      )}
    </div>
  );
};

export default AdminUserTable;
