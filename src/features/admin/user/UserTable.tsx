import { Mail, Calendar, Edit3, Trash2, Eye, CheckCircle2, UserX } from "lucide-react";
import { useState } from "react";
import UserActionModal from "./UserActionModal";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  banned?: boolean;
  banReason?: string | null;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  refresh: () => void;
}

const UserTable = ({ users, loading, refresh }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "delete" | "ban" | "activate" | null>(null);

  const openModal = (user: User, mode: "view" | "edit" | "delete" | "ban" | "activate") => {
    setSelectedUser(user);
    setModalMode(mode);
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-white/5">
            <th className="px-8 py-6">User Identity</th>
            <th className="px-8 py-6">Access Level</th>
            <th className="px-8 py-6">Status</th>
            <th className="px-8 py-6">Metadata</th>
            <th className="px-8 py-6 text-right">Operations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                 <td colSpan={5} className="px-8 py-8">
                    <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
                 </td>
              </tr>
            ))
          ) : users.map((user) => {
            // Check Better-Auth's boolean banned field directly
            const isBanned = user.banned === true;
            return (
              <tr key={user.id} className="group hover:bg-white/[0.02] transition-all duration-300">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={user.image} alt="" className="w-10 h-10 rounded-xl border border-white/10 object-cover" />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[#0a0a0a] rounded-full ${isBanned ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{user.name}</p>
                      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">UID: {user.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    isBanned 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                      <Mail size={12} className="text-blue-500/50" /> {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-tight">
                      <Calendar size={12} /> {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      title="View Profile" 
                      onClick={() => openModal(user, "view")} 
                      className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-xl border border-transparent hover:border-blue-500/20 transition-all cursor-pointer"
                    >
                      <Eye size={15} />
                    </button>
                    <button 
                      title="Edit User" 
                      onClick={() => openModal(user, "edit")} 
                      className="p-2.5 bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded-xl border border-transparent hover:border-amber-500/20 transition-all cursor-pointer"
                    >
                      <Edit3 size={15} />
                    </button>
                    {isBanned ? (
                      <button 
                        title="Activate Account" 
                        onClick={() => openModal(user, "activate")} 
                        className="p-2.5 bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded-xl border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    ) : (
                      <button 
                        title="Ban User" 
                        onClick={() => openModal(user, "ban")} 
                        className="p-2.5 bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 rounded-xl border border-transparent hover:border-orange-500/20 transition-all cursor-pointer"
                      >
                        <UserX size={15} />
                      </button>
                    )}
                    <button 
                      title="Delete Permanently" 
                      onClick={() => openModal(user, "delete")} 
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalMode && selectedUser && (
        <UserActionModal 
          user={selectedUser} 
          mode={modalMode} 
          onClose={() => setModalMode(null)} 
          refresh={refresh}
        />
      )}
    </div>
  );
};

export default UserTable;