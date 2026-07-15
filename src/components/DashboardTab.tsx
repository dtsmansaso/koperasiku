/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Transaction, Asset } from '../types';
import { Users, Landmark, HeartHandshake, ShieldAlert, BadgeCent, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';

interface DashboardTabProps {
  members: Member[];
  transactions: Transaction[];
  assets: Asset[];
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardTab({ members, transactions, assets, onNavigateToTab }: DashboardTabProps) {
  // Stats calculations
  const totalMembers = members.filter(m => m.status === 'active').length;
  const activeTeachers = members.filter(m => m.status === 'active' && m.type === 'guru').length;
  const activeStaff = members.filter(m => m.status === 'active' && m.type === 'karyawan').length;
  const activeStudents = members.filter(m => m.status === 'active' && m.type === 'siswa').length;

  const totalSimpananPokok = members.reduce((sum, m) => sum + m.simpananPokok, 0);
  const totalSimpananWajib = members.reduce((sum, m) => sum + m.simpananWajib, 0);
  const totalSimpananSukarela = members.reduce((sum, m) => sum + m.simpananSukarela, 0);
  const totalSavings = totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela;

  const totalOutstandingLoans = members.reduce((sum, m) => sum + m.loanBalance, 0);

  // Asset Categories
  const cashAsset = assets.filter(a => a.category === 'cash').reduce((sum, a) => sum + a.value, 0);
  const bankAsset = assets.filter(a => a.category === 'bank').reduce((sum, a) => sum + a.value, 0);
  const receivableAsset = totalOutstandingLoans; // Always up to date with member balances
  const otherAsset = assets.filter(a => a.category !== 'cash' && a.category !== 'bank' && a.category !== 'receivable').reduce((sum, a) => sum + a.value, 0);
  const totalAssetsValue = cashAsset + bankAsset + receivableAsset + otherAsset;

  // Recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Currency Formatter
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
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600/35 via-indigo-500/25 to-purple-600/35 backdrop-blur-md rounded-2xl p-6 text-white border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 pointer-events-none">
          <Landmark size={240} />
        </div>
        <div className="relative z-10">
          <span className="bg-indigo-500/30 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Selamat Datang di Portal Utama
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sans mt-3 tracking-tight">
            Koperasi Simpan Pinjam SMAN 1 Soko
          </h1>
          <p className="text-sm text-slate-200 max-w-2xl mt-2 leading-relaxed">
            Sistem informasi manajemen keuangan transparan, akuntabel, dan berbasis digital untuk guru, staf tata usaha, dan siswa SMA Negeri 1 Soko, Tuban.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Anggota */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="p-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Anggota Aktif</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalMembers} Orang</h3>
            <p className="text-2xs text-slate-400 mt-1 font-mono">
              {activeTeachers} Guru • {activeStaff} Staf • {activeStudents} Siswa
            </p>
          </div>
        </div>

        {/* Stat 2: Total Simpanan */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl shadow-lg">
            <Landmark size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Simpanan</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{formatIDR(totalSavings)}</h3>
            <p className="text-2xs text-slate-400 mt-1">
              Pokok, Wajib & Sukarela gabungan
            </p>
          </div>
        </div>

        {/* Stat 3: Piutang Pinjaman */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="p-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl shadow-lg">
            <HeartHandshake size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pinjaman Berjalan</p>
            <h3 className="text-2xl font-extrabold text-indigo-300 mt-1">{formatIDR(totalOutstandingLoans)}</h3>
            <p className="text-2xs text-slate-400 mt-1">
              Sedang diangsur oleh anggota
            </p>
          </div>
        </div>

        {/* Stat 4: Total Aset */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl shadow-lg">
            <BadgeCent size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Aset Koperasi</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{formatIDR(totalAssetsValue)}</h3>
            <p className="text-2xs text-slate-400 mt-1">
              Kas, Bank, Piutang & Toko
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Layout (Bento Grid Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Middle: Chart and Asset Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom SVG Visualization Card */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-sans flex items-center gap-2">
              <BadgeCent size={18} className="text-indigo-400" />
              Komposisi Portofolio Aset Koperasi
            </h3>

            {/* Custom SVG Bar Chart / Visual Flow representing proportions */}
            <div className="space-y-4">
              
              {/* Progress Bars for Asset Division */}
              <div className="space-y-3">
                {/* 1. Kas Bank */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Kas di Bank Jatim</span>
                    <span className="font-mono text-white">{formatIDR(bankAsset)} ({((bankAsset / totalAssetsValue) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(bankAsset / totalAssetsValue) * 100}%` }}></div>
                  </div>
                </div>

                {/* 2. Piutang Pinjaman */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Piutang Pinjaman (Di Anggota)</span>
                    <span className="font-mono text-white">{formatIDR(receivableAsset)} ({((receivableAsset / totalAssetsValue) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${(receivableAsset / totalAssetsValue) * 100}%` }}></div>
                  </div>
                </div>

                {/* 3. Kas Tunai Brankas */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Kas Tunai Koperasi</span>
                    <span className="font-mono text-white">{formatIDR(cashAsset)} ({((cashAsset / totalAssetsValue) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(cashAsset / totalAssetsValue) * 100}%` }}></div>
                  </div>
                </div>

                {/* 4. Inventaris & Barang Dagang Toko */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Inventaris & Barang Dagang</span>
                    <span className="font-mono text-white">{formatIDR(otherAsset)} ({((otherAsset / totalAssetsValue) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(otherAsset / totalAssetsValue) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Total Summary Bar */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Buku Kas & Inventaris SMAN 1 Soko</span>
                <span className="text-sm font-bold text-white">Total Likuiditas: {formatIDR(bankAsset + cashAsset)}</span>
              </div>
            </div>
          </div>

          {/* Quick Calculator / Savings breakdown info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <span className="text-2xs font-semibold text-emerald-300 uppercase tracking-wider block">Simpanan Pokok</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">{formatIDR(totalSimpananPokok)}</span>
              <span className="text-3xs text-emerald-400/80 font-mono mt-0.5 block">Modal Awal Anggota</span>
            </div>
            <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
              <span className="text-2xs font-semibold text-indigo-300 uppercase tracking-wider block">Simpanan Wajib</span>
              <span className="text-lg font-bold text-indigo-400 mt-1 block">{formatIDR(totalSimpananWajib)}</span>
              <span className="text-3xs text-indigo-400/80 font-mono mt-0.5 block">Iuran Berkala Bulanan</span>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
              <span className="text-2xs font-semibold text-purple-300 uppercase tracking-wider block">Simpanan Sukarela</span>
              <span className="text-lg font-bold text-purple-400 mt-1 block">{formatIDR(totalSimpananSukarela)}</span>
              <span className="text-3xs text-purple-400/80 font-mono mt-0.5 block">Simpanan Sukarela Anggota</span>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Transactions & Quick Links */}
        <div className="space-y-6">
          
          {/* Recent Ledger Actions */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-400" />
                Aktivitas Harian Terbaru
              </h3>
              <button 
                onClick={() => onNavigateToTab('transaksi')}
                className="text-2xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3.5 flex-1">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada transaksi tercatat.
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isPositive = ['simpanan_pokok', 'simpanan_wajib', 'simpanan_sukarela', 'bayar_cicilan', 'kas_masuk_lain'].includes(tx.type);
                  return (
                    <div key={tx.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                      <div className={`p-1.5 rounded-lg mt-0.5 ${isPositive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                          <span className={`text-xs font-mono font-bold whitespace-nowrap ml-2 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : '-'}{formatIDR(tx.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-3xs text-slate-400 font-medium truncate">Oleh: {tx.recordedBy}</p>
                          <span className="text-3xs text-slate-400 font-mono">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigateToTab('transaksi')}
                className="py-2 px-3 text-2xs font-semibold glass-btn-secondary rounded-lg text-center cursor-pointer"
              >
                + Transaksi Baru
              </button>
              <button 
                onClick={() => onNavigateToTab('anggota')}
                className="py-2 px-3 text-2xs font-semibold glass-btn-secondary rounded-lg text-center cursor-pointer"
              >
                + Tambah Anggota
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
