/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, MemberType, MemberStatus } from '../types';
import { Search, UserPlus, UserCheck, UserMinus, Plus, Phone, Calendar, CreditCard, Filter, AlertCircle, X } from 'lucide-react';

interface MembersTabProps {
  members: Member[];
  onAddMember: (memberData: Omit<Member, 'totalInterestPaid'>, initialPokok: number) => void;
  onRemoveMember: (id: string, withdrawSavings: boolean) => void;
  userRole: string;
}

export default function MembersTab({ members, onAddMember, onRemoveMember, userRole }: MembersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberType, setNewMemberType] = useState<MemberType>('guru');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [initialPokok, setInitialPokok] = useState<number>(100000); // 100rb standard for guru/staf, 10rb for student

  // Leave member states
  const [selectedLeaveMember, setSelectedLeaveMember] = useState<Member | null>(null);
  const [withdrawOnLeave, setWithdrawOnLeave] = useState(true);

  const handleTypeChange = (type: MemberType) => {
    setNewMemberType(type);
    if (type === 'siswa') {
      setInitialPokok(10000);
    } else {
      setInitialPokok(100000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId || !newMemberName) return;

    // Check if ID already exists
    if (members.some(m => m.id === newMemberId)) {
      alert("ID Anggota / NIP / NIS sudah terdaftar di sistem!");
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    onAddMember({
      id: newMemberId,
      name: newMemberName,
      type: newMemberType,
      status: 'active',
      joinDate: today,
      simpananPokok: initialPokok,
      simpananWajib: 0,
      simpananSukarela: 0,
      loanBalance: 0,
      phone: newMemberPhone || undefined
    }, initialPokok);

    // Reset form
    setNewMemberId('');
    setNewMemberName('');
    setNewMemberType('guru');
    setNewMemberPhone('');
    setInitialPokok(100000);
    setShowAddForm(false);
  };

  const handleLeaveConfirm = () => {
    if (!selectedLeaveMember) return;
    
    // Safety check: Cannot leave if there is loan balance remaining!
    if (selectedLeaveMember.loanBalance > 0) {
      alert(`Anggota tidak dapat keluar karena masih memiliki saldo pinjaman berjalan sebesar: ${formatIDR(selectedLeaveMember.loanBalance)}. Harap melunasi pinjaman terlebih dahulu.`);
      return;
    }

    onRemoveMember(selectedLeaveMember.id, withdrawOnLeave);
    setSelectedLeaveMember(null);
  };

  // Filtered members list
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.includes(searchTerm);
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Direktori & Mutasi Anggota</h2>
          <p className="text-xs text-indigo-300 font-mono mt-0.5">SMA Negeri 1 Soko • Catatan Anggota Masuk & Keluar</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            id="open-add-member-btn"
            className="self-start sm:self-center glass-btn-primary text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            Anggota Masuk Baru
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari anggota berdasarkan nama atau NIP/NIS..."
            className="w-full pl-10 pr-4 py-2 text-sm glass-input focus:outline-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Filter Peran */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <Filter size={14} className="text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-200 bg-slate-900 border-none focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Peran</option>
              <option value="guru">Guru</option>
              <option value="karyawan">Staf Karyawan</option>
              <option value="siswa">Siswa</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <UserCheck size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-200 bg-slate-900 border-none focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif (Masuk)</option>
              <option value="inactive">Nonaktif (Keluar)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Members Grid/Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm" id="members-table">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Identitas Anggota</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Peran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Tanggal Gabung</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Total Simpanan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Sisa Pinjaman</th>
                {userRole === 'admin' && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-center">Tindakan</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada data anggota ditemukan dengan filter tersebut.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const totalSimpanan = member.simpananPokok + member.simpananWajib + member.simpananSukarela;
                  return (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{member.name}</div>
                        <div className="text-2xs text-slate-400 font-mono mt-0.5">ID/NIP: {member.id}</div>
                        {member.phone && (
                          <div className="text-3xs text-indigo-300 flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {member.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-2xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${
                          member.type === 'guru' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' :
                          member.type === 'karyawan' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' :
                          'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                        }`}>
                          {member.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-2xs font-semibold px-2.5 py-0.5 rounded-full ${
                          member.status === 'active' 
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' 
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                        }`}>
                          {member.status === 'active' ? 'Aktif' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300 font-mono">
                        {member.joinDate}
                        {member.leaveDate && <div className="text-3xs text-rose-400 font-sans mt-0.5">Keluar: {member.leaveDate}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-slate-100">{formatIDR(totalSimpanan)}</div>
                        <div className="text-3xs text-slate-400 font-mono">
                          P: {formatIDR(member.simpananPokok)} • W: {formatIDR(member.simpananWajib)} • S: {formatIDR(member.simpananSukarela)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-300 font-mono">
                        {member.loanBalance > 0 ? (
                          <span className="text-rose-400">{formatIDR(member.loanBalance)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-6 py-4 text-center">
                          {member.status === 'active' ? (
                            <button
                              onClick={() => setSelectedLeaveMember(member)}
                              className="text-2xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 mx-auto border border-rose-500/25 hover:bg-rose-950/20 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                              title="Proses Anggota Keluar"
                            >
                              <UserMinus size={12} />
                              Proses Keluar
                            </button>
                          ) : (
                            <span className="text-3xs text-slate-400 italic">Selesai / Keluar</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-white/10 transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 px-6 py-4 text-white flex justify-between items-center border-b border-white/10">
              <h3 className="font-bold font-sans flex items-center gap-2">
                <UserPlus size={18} />
                Penerimaan Anggota Masuk Baru
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Peran Anggota</label>
                <div className="grid grid-cols-3 gap-2" id="member-type-selector">
                  {(['guru', 'karyawan', 'siswa'] as MemberType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`py-2 text-xs font-bold rounded-lg capitalize border cursor-pointer transition-colors ${
                        newMemberType === t
                          ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-200'
                          : 'border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NIP / NIK / NIS (ID Unik)</label>
                <input
                  type="text"
                  required
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder={newMemberType === 'siswa' ? 'Contoh: 202407001' : 'Contoh: 1980xxxxxx'}
                  className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap (Sesuai SK/Rapor)</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nama lengkap beserta gelar"
                  className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon (WhatsApp)</label>
                <input
                  type="text"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                />
              </div>

              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-amber-300">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Simpanan Pokok Wajib Bayar</span>
                  <span className="font-mono">{formatIDR(initialPokok)}</span>
                </div>
                <p className="text-3xs text-amber-300/80 mt-2 leading-relaxed font-sans">
                  * Simpanan Pokok adalah iuran modal yang wajib disetor sekali saat masuk. Sistem akan mencatat transaksi masuk ini secara otomatis ke buku kas!
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="confirm-add-member-btn"
                  className="px-5 py-2 text-xs font-semibold text-white glass-btn-primary rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Member Modal Form */}
      {selectedLeaveMember && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-950/80 to-red-950/80 px-6 py-4 text-white flex justify-between items-center border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2">
                <UserMinus size={18} />
                Konfirmasi Pengunduran Diri Anggota
              </h3>
              <button onClick={() => setSelectedLeaveMember(null)} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-slate-300 text-xs leading-relaxed">
                Anda memproses pengunduran diri dari anggota berikut:
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 my-2 font-sans">
                  <div className="font-bold text-white">{selectedLeaveMember.name}</div>
                  <div className="text-2xs text-slate-400 font-mono mt-0.5">NIP/NIS: {selectedLeaveMember.id}</div>
                  <div className="text-2xs text-emerald-300 font-semibold mt-1">
                    Total Simpanan Tersimpan: {formatIDR(selectedLeaveMember.simpananPokok + selectedLeaveMember.simpananWajib + selectedLeaveMember.simpananSukarela)}
                  </div>
                </div>
              </div>

              {/* Settlement choice */}
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withdrawOnLeave}
                    onChange={(e) => setWithdrawOnLeave(e.target.checked)}
                    className="mt-1 rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Tarik Kembali Seluruh Simpanan</span>
                    <p className="text-3xs text-slate-400 leading-normal mt-0.5">
                      Koperasi akan membayarkan tunai seluruh simpanan pokok, wajib, dan sukarela milik anggota (total: {formatIDR(selectedLeaveMember.simpananPokok + selectedLeaveMember.simpananWajib + selectedLeaveMember.simpananSukarela)}) kembali ke yang bersangkutan. Kas koperasi akan berkurang otomatis.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex gap-2">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <p className="text-3xs text-rose-300 leading-relaxed">
                  <strong>PENTING:</strong> Tindakan ini akan menonaktifkan akun anggota. Status anggota akan berubah menjadi <strong>Keluar (Nonaktif)</strong>, dan saldo simpanan mereka diubah menjadi Rp 0 setelah ditarik.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedLeaveMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleLeaveConfirm}
                  id="confirm-leave-member-btn"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Proses & Keluarkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
