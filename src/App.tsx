/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, UserSession, Member, Transaction, Asset, CoopConfig, ManagerHonorarium, SHUDistributionResult } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_ASSETS, DEFAULT_CONFIG, INITIAL_MANAGERS } from './initialData';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import MembersTab from './components/MembersTab';
import TransactionsTab from './components/TransactionsTab';
import SHUTab from './components/SHUTab';
import RATTab from './components/RATTab';
import DatabaseTab from './components/DatabaseTab';
import { Landmark, Users, ReceiptText, Percent, FileText, Database, LogOut, GraduationCap, ShieldAlert, BadgeInfo, Coins, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';

export default function App() {
  // --- Persistent States ---
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('coop_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('coop_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('coop_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('coop_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [config, setConfig] = useState<CoopConfig>(() => {
    const saved = localStorage.getItem('coop_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [managers, setManagers] = useState<ManagerHonorarium[]>(() => {
    const saved = localStorage.getItem('coop_managers');
    return saved ? JSON.parse(saved) : INITIAL_MANAGERS;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    const role = session?.role;
    return role === 'anggota' ? 'portal' : 'dashboard';
  });

  // Save states to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('coop_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('coop_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('coop_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('coop_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('coop_managers', JSON.stringify(managers));
  }, [managers]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('coop_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('coop_session');
    }
  }, [session]);

  // --- Auth Handlers ---
  const handleLogin = (role: UserRole, memberId?: string, name?: string) => {
    const newSession: UserSession = {
      role,
      memberId,
      name: name || (role === 'admin' ? 'Administrator' : 'Pengawas SMAN 1 Soko')
    };
    setSession(newSession);
    setActiveTab(role === 'anggota' ? 'portal' : 'dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('coop_session');
  };

  // --- Member Actions ---
  const handleAddMember = (memberData: Omit<Member, 'totalInterestPaid'>, initialPokok: number) => {
    // 1. Add Member
    const newMember: Member = {
      ...memberData,
      totalInterestPaid: 0
    };
    setMembers(prev => [newMember, ...prev]);

    // 2. Record Simpanan Pokok Transaction automatically
    const txId = `TX-MP-${Date.now().toString().slice(-4)}`;
    const newTx: Transaction = {
      id: txId,
      date: memberData.joinDate,
      type: 'simpanan_pokok',
      memberId: memberData.id,
      memberName: memberData.name,
      amount: initialPokok,
      description: `Setoran Simpanan Pokok pendaftaran ${memberData.name}`,
      recordedBy: session?.name || 'Sistem'
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Update Cash Tunai Asset
    setAssets(prev => prev.map(a => {
      if (a.id === 'AST-01') { // Kas Tunai
        return {
          ...a,
          value: a.value + initialPokok,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    }));
  };

  const handleRemoveMember = (id: string, withdrawSavings: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const member = members.find(m => m.id === id);
    if (!member) return;

    const totalSavingsOfMember = member.simpananPokok + member.simpananWajib + member.simpananSukarela;

    // 1. Withdraw Savings if requested
    if (withdrawSavings && totalSavingsOfMember > 0) {
      const txId = `TX-OUT-${Date.now().toString().slice(-4)}`;
      const newTx: Transaction = {
        id: txId,
        date: today,
        type: 'tarik_simpanan',
        memberId: member.id,
        memberName: member.name,
        amount: totalSavingsOfMember,
        description: `Pengembalian seluruh simpanan karena mengundurkan diri (Anggota Keluar)`,
        recordedBy: session?.name || 'Sistem'
      };
      setTransactions(prev => [newTx, ...prev]);

      // Reduce Cash Tunai Asset
      setAssets(prev => prev.map(a => {
        if (a.id === 'AST-01') { // Kas Tunai
          return {
            ...a,
            value: Math.max(0, a.value - totalSavingsOfMember),
            lastUpdated: today
          };
        }
        return a;
      }));
    }

    // 2. Mark as inactive & set leaf date
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: 'inactive' as const,
          leaveDate: today,
          simpananPokok: 0,
          simpananWajib: 0,
          simpananSukarela: 0
        };
      }
      return m;
    }));
  };

  // --- Transaction Actions ---
  const handleAddTransaction = (txData: Omit<Transaction, 'id'>) => {
    const txId = `TX-${Date.now().toString().slice(-5)}`;
    const newTx: Transaction = {
      ...txData,
      id: txId
    };

    // 1. Save Transaction
    setTransactions(prev => [newTx, ...prev]);

    // 2. Update Member Financial Snapshot
    if (txData.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id === txData.memberId) {
          if (txData.type === 'simpanan_pokok') {
            return { ...m, simpananPokok: m.simpananPokok + txData.amount };
          } else if (txData.type === 'simpanan_wajib') {
            return { ...m, simpananWajib: m.simpananWajib + txData.amount };
          } else if (txData.type === 'simpanan_sukarela') {
            return { ...m, simpananSukarela: m.simpananSukarela + txData.amount };
          } else if (txData.type === 'tarik_simpanan') {
            return { ...m, simpananSukarela: Math.max(0, m.simpananSukarela - txData.amount) };
          } else if (txData.type === 'pinjaman_baru') {
            return { ...m, loanBalance: m.loanBalance + txData.amount };
          } else if (txData.type === 'bayar_cicilan') {
            const newInterestPaid = m.totalInterestPaid + (txData.interestAmount || 0);
            return { 
              ...m, 
              loanBalance: Math.max(0, m.loanBalance - txData.amount),
              totalInterestPaid: newInterestPaid
            };
          }
        }
        return m;
      }));
    }

    // 3. Update Cash Asset or Outstanding Loan Asset
    const isIncoming = ['simpanan_pokok', 'simpanan_wajib', 'simpanan_sukarela', 'bayar_cicilan', 'kas_masuk_lain'].includes(txData.type);
    const amountToChange = txData.amount + (txData.interestAmount || 0);

    setAssets(prev => prev.map(a => {
      // Kas Tunai Asset
      if (a.id === 'AST-01') {
        const newValue = isIncoming ? (a.value + amountToChange) : (a.value - amountToChange);
        return {
          ...a,
          value: Math.max(0, newValue),
          lastUpdated: txData.date
        };
      }
      return a;
    }));
  };

  // --- Configuration Handlers ---
  const handleUpdateConfig = (newConfig: Partial<CoopConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleUpdateManagers = (newManagers: ManagerHonorarium[]) => {
    setManagers(newManagers);
  };

  // --- SHU Distribution Handler ---
  const handleDistributeSHU = (results: SHUDistributionResult[], totalAmount: number) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Add SHU amount to member's simpananSukarela
    setMembers(prev => prev.map(m => {
      const personalResult = results.find(r => r.memberId === m.id);
      if (personalResult && personalResult.totalSHUMember > 0) {
        return {
          ...m,
          simpananSukarela: m.simpananSukarela + personalResult.totalSHUMember
        };
      }
      return m;
    }));

    // 2. Dispatches overall transaction logging
    const txId = `TX-SHU-${Date.now().toString().slice(-4)}`;
    const newTx: Transaction = {
      id: txId,
      date: today,
      type: 'pembagian_shu',
      amount: totalAmount,
      description: `Bagi Hasil SHU RAT warga sekolah SMAN 1 Soko didistribusikan ke simpanan sukarela anggota`,
      recordedBy: session?.name || 'Sistem'
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Update Assets (SHU reduces total operational cash in hand as distributed back to members savings ledger,
    // but in terms of overall cooperative assets, it's a rearrangement of passiva reserves to savings capital)
    setAssets(prev => prev.map(a => {
      if (a.id === 'AST-01') {
        return {
          ...a,
          value: Math.max(0, a.value - totalAmount), // Distributed
          lastUpdated: today
        };
      }
      return a;
    }));
  };

  // --- Anggota Portal Specific Sub-States & Mock Request Submit ---
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [personalTransactions, setPersonalTransactions] = useState<Transaction[]>([]);
  const [personalSavingsSum, setPersonalSavingsSum] = useState(0);

  // Load active selected member statistics if logged in as Member
  useEffect(() => {
    if (session?.role === 'anggota' && session.memberId) {
      const activeMem = members.find(m => m.id === session.memberId);
      if (activeMem) {
        setSelectedMember(activeMem);
        setPersonalSavingsSum(activeMem.simpananPokok + activeMem.simpananWajib + activeMem.simpananSukarela);
        // Filter transactions
        setPersonalTransactions(transactions.filter(t => t.memberId === activeMem.id));
      }
    }
  }, [session, members, transactions]);

  const [simType, setSimType] = useState<'saving' | 'loan'>('saving');
  const [simAmount, setSimAmount] = useState<number>(500000);
  const [simMonths, setSimMonths] = useState<number>(12);

  const estimatedInterestPerMonth = simType === 'loan' ? Math.round(simAmount * (config.loanInterestRate / 100)) : 0;
  const estimatedInstallment = simType === 'loan' ? Math.round((simAmount / simMonths) + estimatedInterestPerMonth) : 0;

  const handleMemberSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Permohonan ${simType === 'saving' ? 'Menabung Sukarela' : 'Pengajuan Pinjaman Baru'} sebesar Rp ${simAmount.toLocaleString()} berhasil dikirim ke Pengurus SMAN 1 Soko. Silakan hubungi bendahara Hj. Endang Setyowati untuk verifikasi berkas.`);
  };

  if (!session) {
    return <LoginScreen members={members} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] flex flex-col md:flex-row font-sans text-slate-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 glass-sidebar text-slate-300 flex flex-col shrink-0">
        {/* Logo Brand */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 text-white rounded-xl shadow-lg">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-tight leading-none">Koperasi Soko</h1>
            <span className="text-3xs text-indigo-300 font-mono tracking-wider">SMAN 1 SOKO • TUBAN</span>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 bg-white/5 m-4 rounded-xl border border-white/10 flex items-start gap-3">
          <div className="p-1.5 bg-white/10 text-slate-300 rounded-lg shrink-0">
            {session.role === 'admin' ? <ShieldAlert size={16} className="text-indigo-400" /> : <ShieldAlert size={16} className="text-amber-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">{session.role} Portal</p>
            <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{session.name}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1" id="sidebar-nav">
          {session.role !== 'anggota' ? (
            <>
              {/* Admin & Pengawas Tabs */}
              <button
                onClick={() => setActiveTab('dashboard')}
                id="tab-dashboard-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark size={16} />
                Beranda Utama
              </button>

              <button
                onClick={() => setActiveTab('anggota')}
                id="tab-members-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'anggota' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={16} />
                Data Anggota
              </button>

              <button
                onClick={() => setActiveTab('transaksi')}
                id="tab-transactions-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'transaksi' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ReceiptText size={16} />
                Jurnal Buku Kas
              </button>

              <button
                onClick={() => setActiveTab('shu')}
                id="tab-shu-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'shu' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent size={16} />
                Suku Jasa & SHU
              </button>

              <button
                onClick={() => setActiveTab('rat')}
                id="tab-rat-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'rat' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText size={16} />
                Laporan RAT
              </button>

              <button
                onClick={() => setActiveTab('database')}
                id="tab-database-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'database' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database size={16} />
                Setup Google Sheets
              </button>
            </>
          ) : (
            <>
              {/* Member specific Portal Sidebar Navigation */}
              <button
                onClick={() => setActiveTab('portal')}
                id="tab-portal-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'portal' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark size={16} />
                Portal Anggota
              </button>

              <button
                onClick={() => setActiveTab('portal-history')}
                id="tab-portal-history-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'portal-history' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ReceiptText size={16} />
                Riwayat Tabungan
              </button>

              <button
                onClick={() => setActiveTab('portal-request')}
                id="tab-portal-request-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'portal-request' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins size={16} />
                Simulasi Pengajuan
              </button>

              <button
                onClick={() => setActiveTab('database')}
                id="tab-portal-database-btn"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'database' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database size={16} />
                Informasi Database
              </button>
            </>
          )}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors flex items-center gap-3 cursor-pointer"
          >
            <LogOut size={16} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Panel Content area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        
        {/* Render Active Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            members={members}
            transactions={transactions}
            assets={assets}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'anggota' && (
          <MembersTab
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            userRole={session.role}
          />
        )}

        {activeTab === 'transaksi' && (
          <TransactionsTab
            transactions={transactions}
            members={members}
            config={config}
            onAddTransaction={handleAddTransaction}
            userRole={session.role}
          />
        )}

        {activeTab === 'shu' && (
          <SHUTab
            members={members}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onDistributeSHU={handleDistributeSHU}
            managers={managers}
            onUpdateManagers={handleUpdateManagers}
            userRole={session.role}
          />
        )}

        {activeTab === 'rat' && (
          <RATTab
            members={members}
            transactions={transactions}
            assets={assets}
            config={config}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseTab
            members={members}
            transactions={transactions}
            assets={assets}
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {/* --- PORTAL ANGGOTA INTERFACES (ONLY FOR ROLE: ANGGOTA) --- */}
        {activeTab === 'portal' && selectedMember && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 backdrop-blur-md rounded-2xl p-6 text-white border border-emerald-500/20 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 pointer-events-none">
                <Landmark size={240} />
              </div>
              <div className="relative z-10">
                <span className="bg-emerald-500/30 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Portal Keuangan Anggota
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-sans mt-3 tracking-tight">
                  Halo, {selectedMember.name}
                </h1>
                <p className="text-xs text-emerald-200 font-mono mt-1">
                  ID: {selectedMember.id} • Status: {selectedMember.status === 'active' ? 'AKTIF (Masuk)' : 'KELUAR'}
                </p>
              </div>
            </div>

            {/* Balances Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-slate-300 font-semibold block">Total Simpanan Anda</span>
                <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">
                  {personalSavingsSum.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </h3>
                <div className="text-3xs text-slate-300 mt-3 font-mono space-y-1">
                  <div className="flex justify-between border-b border-white/5 pb-0.5"><span>Pokok:</span> <span>Rp {selectedMember.simpananPokok.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5"><span>Wajib:</span> <span>Rp {selectedMember.simpananWajib.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Sukarela:</span> <span>Rp {selectedMember.simpananSukarela.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-slate-300 font-semibold block">Sisa Pinjaman Aktif</span>
                <h3 className={`text-2xl font-extrabold mt-1 font-mono ${selectedMember.loanBalance > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {selectedMember.loanBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </h3>
                <p className="text-3xs text-slate-400 mt-3 leading-relaxed">
                  Sisa angsuran pokok yang harus dilunasi kepada Bendahara SMAN 1 Soko.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-semibold block">Estimasi SHU RAT Anda</span>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                    {/* Estimate personal SHU based on mock pool size (e.g., 12 million total) */}
                    {Math.round(
                      ( (selectedMember.simpananPokok + selectedMember.simpananWajib + selectedMember.simpananSukarela) / 
                        members.reduce((sum, m) => sum + (m.simpananPokok + m.simpananWajib + m.simpananSukarela), 0) * 
                        (config.shuJasaSimpan / 100) * 12000000 ) +
                      ( (selectedMember.totalInterestPaid) / 
                        Math.max(1, members.reduce((sum, m) => sum + m.totalInterestPaid, 0)) * 
                        (config.shuJasaPinjam / 100) * 12000000 )
                    ).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </h3>
                </div>
                <p className="text-3xs text-slate-400 mt-3 leading-relaxed">
                  Akumulasi bagi hasil proporsional berdasarkan kontribusi simpanan dan bunga pinjaman Anda.
                </p>
              </div>
            </div>

            {/* Quick member notices */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3">
              <BadgeInfo size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200 leading-relaxed">
                <strong>Kebijakan Anggota:</strong> Berdasarkan peraturan RAT SMAN 1 Soko, seluruh anggota diwajibkan menyetor Simpanan Wajib sebesar Rp 100.000 per bulan (untuk Guru/Staf) atau Rp 5.000 per bulan (untuk Siswa). Penarikan Simpanan Sukarela dapat dilakukan kapan saja melalui bendahara.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portal-history' && selectedMember && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Riwayat Buku Tabungan Anda</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">Catatan seluruh setoran dan penarikan pribadi Anda</p>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <table className="w-full border-collapse text-left text-sm" id="portal-history-table">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Tanggal & ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Jenis Transaksi</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Keterangan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Jumlah (Rupiah)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {personalTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs">
                        Belum ada riwayat transaksi terdaftar untuk akun Anda.
                      </td>
                    </tr>
                  ) : (
                    personalTransactions.map((tx) => {
                      const isPositive = ['simpanan_pokok', 'simpanan_wajib', 'simpanan_sukarela', 'bayar_cicilan'].includes(tx.type);
                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">{tx.date}<br/><span className="text-3xs">{tx.id}</span></td>
                          <td className="px-6 py-4">
                            <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                              isPositive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                            }`}>
                              {tx.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300">{tx.description}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-100">
                            {isPositive ? '+' : '-'}{tx.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'portal-request' && selectedMember && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Kalkulator Simulasi & Pengajuan Baru</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">Simulasikan angsuran pinjaman atau setor tabungan baru</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Input */}
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                  <Percent size={16} className="text-indigo-400" />
                  Formulir Simulasi Pengajuan
                </h3>

                <form onSubmit={handleMemberSimSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Pengajuan</label>
                    <div className="grid grid-cols-2 gap-2" id="sim-type-selector">
                      <button
                        type="button"
                        onClick={() => setSimType('saving')}
                        className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                          simType === 'saving' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Setor Tabungan Sukarela
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimType('loan')}
                        className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                          simType === 'loan' ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300' : 'bg-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ajukan Pinjaman Baru
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Pengajuan (Rupiah)</label>
                    <input
                      type="number"
                      min={10000}
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full px-4 py-2 text-sm glass-input focus:outline-none font-mono"
                    />
                  </div>

                  {simType === 'loan' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Jangka Waktu Angsuran (Tenor)</label>
                      <select
                        value={simMonths}
                        onChange={(e) => setSimMonths(Number(e.target.value))}
                        className="w-full px-4 py-2 text-sm glass-input focus:outline-none"
                      >
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                        <option value="12">12 Bulan (1 Tahun)</option>
                        <option value="24">24 Bulan (2 Tahun)</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="submit-portal-request-btn"
                    className="w-full py-2.5 glass-btn-primary font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                  >
                    Kirim Pengajuan ke Pengurus
                  </button>
                </form>
              </div>

              {/* Live Simulasi Output results */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    <FileText size={16} className="text-emerald-400" />
                    Hasil Simulasi Kalkulator
                  </h3>

                  {simType === 'loan' ? (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-300">Jumlah Pinjaman Pokok</span>
                        <span className="font-mono font-bold text-white">Rp {simAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-300">Bunga Jasa ({config.loanInterestRate}% per bulan)</span>
                        <span className="font-mono font-bold text-rose-300">Rp {estimatedInterestPerMonth.toLocaleString()} / bln</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-300">Tenor Angsuran</span>
                        <span className="font-mono font-bold text-white">{simMonths} Bulan</span>
                      </div>
                      <div className="flex justify-between pt-2 text-sm font-extrabold text-indigo-200">
                        <span>ESTIMASI ANGSURAN BULANAN</span>
                        <span className="font-mono text-indigo-300">Rp {estimatedInstallment.toLocaleString()} / bln</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <p className="text-slate-300 leading-relaxed">
                        Anda mensimulasikan setoran tabungan sukarela sebesar <strong>Rp {simAmount.toLocaleString()}</strong>. Tabungan ini tidak mengikat, mendapatkan jatah proporsi bagi hasil SHU RAT, dan dapat ditarik kembali secara tunai kapan saja.
                      </p>
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-200 font-medium">
                        Estimasi Kenaikan Proporsi SHU Anda: +0.45% per tahun buku
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-3xs text-slate-400 mt-4 leading-normal">
                  * Hasil perhitungan di atas merupakan estimasi kasar. Keputusan akhir mutlak mengacu pada kesepakatan tertulis saat akad di hadapan bendahara koperasi SMAN 1 Soko.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
