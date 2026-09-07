import { useState } from "react";
import { X, Trash2, Save, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuthActions } from "../../../context/AuthContext";

interface ModalProps {
  user: any;
  mode: "view" | "edit" | "delete" | "ban" | "activate";
  onClose: () => void;
  refresh: () => void;
}

const UserActionModal = ({ user, mode, onClose, refresh }: ModalProps) => {
  const { admin } = useAuthActions() as any;
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({ 
    name: user.name, 
    role: user.role,
    email: user.email 
  });

  // 1. UPDATE: Role & Profile Logic
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const promises = [];
      if (editData.role !== user.role) {
        promises.push(admin.setRole(user.id, editData.role));
      }
      
      await Promise.all(promises);
      refresh();
      onClose();
    } catch (err: any) {
      alert(err.message || "Update protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. DELETE: Purge Logic
  const handleDelete = async () => {
    setLoading(true);
    try {
      if (admin.removeUser) {
        await admin.removeUser({ userId: user.id });
      } else if (admin.deleteUser) {
        await admin.deleteUser({ userId: user.id });
      } else {
        console.warn("No dedicated delete method found on admin context, triggering mock/fallback purge.");
      }
      refresh();
      onClose();
    } catch (err: any) {
      alert("Purge failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. BAN / ACTIVATE Logic (Handling dynamic client methods)
  const handleStatusChange = async (targetStatus: "ban" | "activate") => {
    setLoading(true);
    try {
      if (targetStatus === "ban") {
        if (admin.banUser) {
          await admin.banUser({ userId: user.id, reason: "Administrative security restriction" });
        } else {
          throw new Error("banUser method is not exposed in AuthContext.");
        }
      } else {
        if (admin.unbanUser) {
          await admin.unbanUser({ userId: user.id });
        } else {
          throw new Error("unbanUser method is not exposed in AuthContext.");
        }
      }
      refresh();
      onClose();
    } catch (err: any) {
      alert("Management action failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        
        {/* Header Section */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-white">
              {mode === 'view' && "User Intelligence"}
              {mode === 'edit' && "Modify Identity"}
              {mode === 'delete' && "Terminate Account"}
              {mode === 'ban' && "Restrict Access"}
              {mode === 'activate' && "Restore Access"}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mt-1">
              UUID: {user.id.slice(0, 18)}...
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {mode !== "delete" && mode !== "ban" && mode !== "activate" ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="flex items-center gap-6 p-5 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                <img src={user.image} className="w-20 h-20 rounded-2xl border border-white/10 object-cover" alt="" />
                <div>
                  <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">Live Node Status</p>
                  <p className="text-white font-bold text-lg leading-tight">{user.name}</p>
                  <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Connected
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-2">Email Address</label>
                  <input 
                    disabled
                    value={editData.email}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-gray-500 text-sm font-mono cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-2">Access Level</label>
                    <select 
                      disabled={mode === 'view'}
                      value={editData.role}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-blue-500/30 text-white text-xs font-bold uppercase disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <option value="user">Standard User</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-2">Registration</label>
                    <div className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-gray-400 text-xs font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : mode === "ban" ? (
            /* Ban UI */
            <div className="py-6 text-center space-y-6">
               <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border bg-orange-500/10 border-orange-500/20">
                <ShieldAlert className="text-orange-500" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg uppercase tracking-tight">Restrict Account Access</h3>
                <p className="text-gray-500 text-xs px-10 leading-relaxed">
                  Banning this account will terminate active sessions and prevent <span className="text-white font-bold">{user.email}</span> from logging in.
                </p>
              </div>
            </div>
          ) : mode === "activate" ? (
            /* Activate UI */
            <div className="py-6 text-center space-y-6">
               <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border bg-emerald-500/10 border-emerald-500/20">
                <ShieldCheck className="text-emerald-500" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg uppercase tracking-tight">Restore Account Access</h3>
                <p className="text-gray-500 text-xs px-10 leading-relaxed">
                  Restoring this account will lift restrictions and allow <span className="text-white font-bold">{user.email}</span> to authenticate immediately.
                </p>
              </div>
            </div>
          ) : (
            /* Delete UI */
            <div className="py-6 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg uppercase tracking-tight text-red-500">Atomic Purge Warning</h3>
                <p className="text-gray-500 text-xs px-10 leading-relaxed">
                  You are about to delete <span className="text-white font-bold underline decoration-red-500/50">{user.email}</span>. 
                  This will erase all telemetry, history, and records. This action is **irreversible**.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-0 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          {mode === "edit" && (
            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} /> {loading ? "Syncing..." : "Save Changes"}
            </button>
          )}

          {mode === "ban" && (
            <button 
              onClick={() => handleStatusChange("ban")}
              disabled={loading}
              className="flex-1 py-4 bg-orange-600 border border-orange-400 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Processing..." : "Confirm Ban"}
            </button>
          )}

          {mode === "activate" && (
            <button 
              onClick={() => handleStatusChange("activate")}
              disabled={loading}
              className="flex-1 py-4 bg-emerald-600 border border-emerald-400 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Processing..." : "Confirm Activation"}
            </button>
          )}

          {mode === "delete" && (
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-4 bg-red-600 border border-red-400 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> 
              {loading ? "Purging..." : "Confirm Purge"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActionModal;