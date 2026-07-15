/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole, Member } from '../types';
import { LogIn, ShieldAlert, Award, User, GraduationCap } from 'lucide-react';

interface LoginScreenProps {
  members: Member[];
  onLogin: (role: UserRole, memberId?: string, name?: string) => void;
}

export default function LoginScreen({ members, onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [adminUsername, setAdminUsername] = useState('admin_soko');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [pengawasUsername, setPengawasUsername] = useState('pengawas_soko');
  const [pengawasPassword, setPengawasPassword] = useState('••••••••');

  const activeMembers = members.filter(m => m.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'admin') {
      onLogin('admin', undefined, 'Hj. Endang Setyowati (Admin/Bendahara)');
    } else if (selectedRole === 'pengawas') {
      onLogin('pengawas', undefined, 'Dra. H. Sugeng, M.Pd. (Pengawas)');
    } else {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) {
        onLogin('anggota', member.id, member.name);
      } else if (activeMembers.length > 0) {
        // Fallback to first member
        onLogin('anggota', activeMembers[0].id, activeMembers[0].name);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <GraduationCap size={36} />
          </div>
          <h2 className="text-2xl font-extrabold font-sans text-white tracking-tight">
            Koperasi Simpan Pinjam
          </h2>
          <p className="text-sm font-bold text-indigo-400 tracking-wide uppercase mt-1">
            SMAN 1 Soko, Tuban
          </p>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Sistem Informasi Keuangan & SHU Warga Sekolah
          </p>
        </div>

        {/* Tab Selector for Roles */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/40 border border-white/5 rounded-xl" id="role-selector">
          <button
            type="button"
            id="role-admin-btn"
            onClick={() => setSelectedRole('admin')}
            className={`py-2.5 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all duration-150 ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={16} />
            Admin
          </button>
          <button
            type="button"
            id="role-pengawas-btn"
            onClick={() => setSelectedRole('pengawas')}
            className={`py-2.5 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all duration-150 ${
              selectedRole === 'pengawas'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={16} />
            Pengawas
          </button>
          <button
            type="button"
            id="role-anggota-btn"
            onClick={() => setSelectedRole('anggota')}
            className={`py-2.5 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all duration-150 ${
              selectedRole === 'anggota'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={16} />
            Anggota
          </button>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {selectedRole === 'admin' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username Admin</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm glass-input focus:outline-none"
                  placeholder="admin_soko"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm glass-input focus:outline-none"
                  placeholder="Password"
                  required
                />
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-200 leading-relaxed">
                  <strong>Akses Admin:</strong> Mencakup pencatatan transaksi harian, pengelolaan anggota (masuk/keluar), pengaturan suku bunga, perhitungan SHU, dan bagi hasil pengurus.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'pengawas' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username Pengawas</label>
                <input
                  type="text"
                  value={pengawasUsername}
                  onChange={(e) => setPengawasUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm glass-input focus:outline-none"
                  placeholder="pengawas_soko"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={pengawasPassword}
                  onChange={(e) => setPengawasPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm glass-input focus:outline-none"
                  placeholder="Password"
                  required
                />
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-200 leading-relaxed">
                  <strong>Akses Pengawas:</strong> Hak akses peninjauan laporan (Auditing). Dapat memeriksa seluruh detail keuangan, buku kas, aset, dan Laporan RAT tanpa hak merubah data.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'anggota' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Akun Anggota</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm glass-input focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Anggota --</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.type === 'guru' ? 'Guru' : member.type === 'karyawan' ? 'Karyawan' : 'Siswa'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-emerald-200 leading-relaxed">
                  <strong>Akses Anggota:</strong> Portal pribadi warga sekolah untuk memantau saldo simpanan pokok/wajib/sukarela, memonitor pinjaman pribadi, dan melihat jatah SHU tahunan.
                </p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              id="submit-login-btn"
              className="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white glass-btn-primary shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={18} />
              Masuk ke Sistem
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-2xs text-slate-400 font-mono">
            Koperasi SMAN 1 Soko v1.2 • Kab. Tuban, Jawa Timur
          </p>
        </div>
      </div>
    </div>
  );
}
