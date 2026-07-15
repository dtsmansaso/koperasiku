/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Transaction, TransactionType, CoopConfig } from '../types';
import { Search, Plus, Calendar, BadgeCent, Filter, ArrowUpRight, ArrowDownRight, Printer, RefreshCw, X, ReceiptText } from 'lucide-react';

interface TransactionsTabProps {
  transactions: Transaction[];
  members: Member[];
  config: CoopConfig;
  onAddTransaction: (txData: Omit<Transaction, 'id'>) => void;
  userRole: string;
}

type PeriodFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function TransactionsTab({ transactions, members, config, onAddTransaction, userRole }: TransactionsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // New transaction form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('simpanan_wajib');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [interestAmount, setInterestAmount] = useState<number>(0);
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const activeMembers = members.filter(m => m.status === 'active');

  // Trigger when txType or selectedMember changes to suggest descriptions or calculate interest
  useEffect(() => {
    if (selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) {
        const dateObj = new Date();
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const currentMonth = monthNames[dateObj.getMonth()];
        const currentYear = dateObj.getFullYear();

        if (txType === 'simpanan_wajib') {
          setTxAmount(member.type === 'siswa' ? 5000 : 100000);
          setTxDescription(`Simpanan Wajib ${member.name} bulan ${currentMonth} ${currentYear}`);
          setInterestAmount(0);
        } else if (txType === 'simpanan_sukarela') {
          setTxAmount(50000);
          setTxDescription(`Setor Simpanan Sukarela ${member.name}`);
          setInterestAmount(0);
        } else if (txType === 'tarik_simpanan') {
          setTxAmount(Math.min(50000, member.simpananSukarela));
          setTxDescription(`Tarik Simpanan Sukarela ${member.name}`);
          setInterestAmount(0);
        } else if (txType === 'pinjaman_baru') {
          setTxAmount(1000000);
          setTxDescription(`Pencairan Pinjaman Baru ${member.name}`);
          setInterestAmount(0);
        } else if (txType === 'bayar_cicilan') {
          // Suggest standard installment (e.g. 10% of total loan or full loan if small)
          const suggestedPrincipal = member.loanBalance > 0 ? Math.min(member.loanBalance, 500000) : 0;
          // Suggeset interest (loanBalance * config.loanInterestRate / 100)
          const suggestedInterest = member.loanBalance > 0 ? Math.round(member.loanBalance * (config.loanInterestRate / 100)) : 0;
          
          setTxAmount(suggestedPrincipal);
          setInterestAmount(suggestedInterest);
          setTxDescription(`Bayar Angsuran Pinjaman ${member.name}`);
        }
      }
    } else {
      if (txType === 'biaya_operasional') {
        setTxDescription('Pembelian ATK / Konsumsi pengurus');
        setTxAmount(50000);
        setInterestAmount(0);
      } else if (txType === 'kas_masuk_lain') {
        setTxDescription('Pemasukan toko koperasi sekolah');
        setTxAmount(100000);
        setInterestAmount(0);
      }
    }
  }, [txType, selectedMemberId, members, config.loanInterestRate]);

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      alert("Jumlah transaksi harus lebih besar dari 0!");
      return;
    }

    let mName = "";
    if (selectedMemberId) {
      const m = members.find(mem => mem.id === selectedMemberId);
      if (m) {
        mName = m.name;
        // Validation check for withdrawals
        if (txType === 'tarik_simpanan' && txAmount > m.simpananSukarela) {
          alert(`Penarikan melebihi saldo simpanan sukarela anggota! Saldo sukarela saat ini: ${formatIDR(m.simpananSukarela)}`);
          return;
        }
        // Validation check for repayments
        if (txType === 'bayar_cicilan' && txAmount > m.loanBalance) {
          alert(`Pembayaran cicilan melebihi sisa pinjaman anggota! Sisa pinjaman saat ini: ${formatIDR(m.loanBalance)}`);
          return;
        }
      }
    }

    onAddTransaction({
      date: txDate,
      type: txType,
      memberId: selectedMemberId || undefined,
      memberName: mName || undefined,
      amount: Number(txAmount),
      interestAmount: txType === 'bayar_cicilan' ? Number(interestAmount) : undefined,
      description: txDescription,
      recordedBy: userRole === 'admin' ? 'Hj. Endang Setyowati (Bendahara)' : 'Pengawas'
    });

    // Reset Form
    setSelectedMemberId('');
    setTxAmount(0);
    setInterestAmount(0);
    setTxDescription('');
    setShowAddForm(false);
  };

  // Filter logic for transaction history
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.memberName && tx.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (tx.memberId && tx.memberId.includes(searchTerm));
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    // Time period logic
    const txDateObj = new Date(tx.date);
    const today = new Date();
    
    let matchesPeriod = true;
    if (periodFilter === 'daily') {
      matchesPeriod = txDateObj.toDateString() === today.toDateString();
    } else if (periodFilter === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      matchesPeriod = txDateObj >= oneWeekAgo && txDateObj <= today;
    } else if (periodFilter === 'monthly') {
      matchesPeriod = txDateObj.getMonth() === today.getMonth() && txDateObj.getFullYear() === today.getFullYear();
    } else if (periodFilter === 'yearly') {
      matchesPeriod = txDateObj.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesType && matchesPeriod;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getFriendlyType = (type: TransactionType) => {
    switch (type) {
      case 'simpanan_pokok': return 'Simpanan Pokok';
      case 'simpanan_wajib': return 'Simpanan Wajib';
      case 'simpanan_sukarela': return 'Simpanan Sukarela';
      case 'tarik_simpanan': return 'Penarikan Sukarela';
      case 'pinjaman_baru': return 'Pencairan Pinjaman';
      case 'bayar_cicilan': return 'Angsuran Pinjaman';
      case 'biaya_operasional': return 'Biaya Operasional';
      case 'kas_masuk_lain': return 'Kas Masuk Lain';
      case 'pembagian_shu': return 'Pembagian SHU';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Arus Transaksi & Jurnal Buku Kas</h2>
          <p className="text-xs text-indigo-300 font-mono mt-0.5">SMA Negeri 1 Soko • Pencatatan Transaksi Harian, Mingguan, Bulanan, Tahunan</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            id="open-add-tx-btn"
            className="self-start sm:self-center glass-btn-primary text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Catat Transaksi Baru
          </button>
        )}
      </div>

      {/* Period Tabs & Search */}
      <div className="glass-panel p-4 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi berdasarkan deskripsi atau nama anggota..."
              className="w-full pl-10 pr-4 py-2 text-sm glass-input focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-200 bg-slate-900 border-none focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Jenis Jurnal</option>
              <option value="simpanan_pokok">Simpanan Pokok</option>
              <option value="simpanan_wajib">Simpanan Wajib</option>
              <option value="simpanan_sukarela">Simpanan Sukarela</option>
              <option value="tarik_simpanan">Penarikan Sukarela</option>
              <option value="pinjaman_baru">Pencairan Pinjaman</option>
              <option value="bayar_cicilan">Angsuran Pinjaman</option>
              <option value="biaya_operasional">Biaya Operasional</option>
              <option value="kas_masuk_lain">Pemasukan Toko/Lain</option>
              <option value="pembagian_shu">Pembagian SHU</option>
            </select>
          </div>
        </div>

        {/* Period selection */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1" id="period-selector">
          <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Periode:</span>
          {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              id={`period-btn-${p}`}
              onClick={() => setPeriodFilter(p)}
              className={`px-3.5 py-1.5 text-2xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
                periodFilter === p
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/20'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {p === 'all' ? 'Semua Jurnal' : p === 'daily' ? 'Hari Ini' : p === 'weekly' ? '7 Hari Terakhir' : p === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm" id="transactions-table">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Tanggal & ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Kategori Jurnal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Anggota Terkait</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Jumlah Pokok</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Jasa Pinjam</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Total Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada riwayat transaksi ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncoming = ['simpanan_pokok', 'simpanan_wajib', 'simpanan_sukarela', 'bayar_cicilan', 'kas_masuk_lain'].includes(tx.type);
                  const totalCashImpact = tx.amount + (tx.interestAmount || 0);

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white font-mono text-xs">{tx.date}</div>
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">{tx.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                          tx.type.startsWith('simpanan_') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' :
                          tx.type === 'bayar_cicilan' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' :
                          tx.type === 'pinjaman_baru' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25' :
                          tx.type === 'tarik_simpanan' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' :
                          tx.type === 'pembagian_shu' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' :
                          'bg-slate-500/15 text-slate-300 border border-slate-500/25'
                        }`}>
                          {getFriendlyType(tx.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tx.memberName ? (
                          <div>
                            <div className="font-bold text-slate-200 text-xs">{tx.memberName}</div>
                            <div className="text-3xs text-slate-400 font-mono">ID: {tx.memberId}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Umum / Kas</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate" title={tx.description}>
                        <div>{tx.description}</div>
                        <div className="text-3xs text-slate-400 mt-0.5">Dicatat oleh: {tx.recordedBy}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-100">
                        {formatIDR(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                        {tx.interestAmount ? (
                          <span className="text-emerald-400 font-bold">+{formatIDR(tx.interestAmount)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold font-mono text-xs ${isIncoming ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isIncoming ? '+' : '-'}{formatIDR(totalCashImpact)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 px-6 py-4 text-white flex justify-between items-center border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2">
                <ReceiptText size={18} />
                Pencatatan Jurnal Kas Koperasi Baru
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Jurnal</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                    className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none"
                  >
                    <option value="simpanan_wajib">Setoran Simpanan Wajib</option>
                    <option value="simpanan_sukarela">Setoran Simpanan Sukarela</option>
                    <option value="tarik_simpanan">Penarikan Simpanan Sukarela</option>
                    <option value="pinjaman_baru">Pencairan Pinjaman Baru</option>
                    <option value="bayar_cicilan">Penerimaan Angsuran Pinjaman</option>
                    <option value="biaya_operasional">Pengeluaran Biaya Operasional</option>
                    <option value="kas_masuk_lain">Kas Masuk Lainnya (Toko, dll)</option>
                  </select>
                </div>

                {/* Transaction Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                  />
                </div>

              </div>

              {/* Member association (if applicable) */}
              {!['biaya_operasional', 'kas_masuk_lain'].includes(txType) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hubungkan dengan Anggota</label>
                  <select
                    value={selectedMemberId}
                    required
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none"
                  >
                    <option value="">-- Pilih Anggota Koperasi --</option>
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type.toUpperCase()} • Sukarela: {formatIDR(m.simpananSukarela)} • Pinjaman: {formatIDR(m.loanBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amounts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Principal Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {txType === 'bayar_cicilan' ? 'Pembayaran Angsuran Pokok' : txType === 'biaya_operasional' ? 'Jumlah Pengeluaran' : 'Jumlah Uang'}
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    placeholder="Masukkan jumlah Rupiah"
                    className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                  />
                </div>

                {/* Repayment Interest (Interest suggesting) */}
                {txType === 'bayar_cicilan' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Jasa Pinjam / Bunga ({config.loanInterestRate}%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={interestAmount || ''}
                      onChange={(e) => setInterestAmount(Number(e.target.value))}
                      placeholder="Masukkan bunga jasa"
                      className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                    />
                  </div>
                )}

              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan Jurnal / Catatan</label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Isi rincian transaksi"
                  className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none"
                />
              </div>

              {/* Information disclaimer */}
              {selectedMemberId && (
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-3xs text-slate-300 leading-normal">
                  <strong>Efek Kas Koperasi:</strong>
                  {['simpanan_wajib', 'simpanan_sukarela', 'bayar_cicilan'].includes(txType) ? (
                    <span className="text-emerald-400 block mt-0.5">● Saldo Kas Koperasi bertambah +{formatIDR(txAmount + (txType === 'bayar_cicilan' ? interestAmount : 0))}. Saldo tabungan/pinjaman anggota akan terupdate otomatis!</span>
                  ) : txType === 'pinjaman_baru' ? (
                    <span className="text-rose-400 block mt-0.5">● Saldo Kas Koperasi berkurang -{formatIDR(txAmount)}. Saldo pinjaman anggota akan bertambah +{formatIDR(txAmount)}.</span>
                  ) : txType === 'tarik_simpanan' ? (
                    <span className="text-rose-400 block mt-0.5">● Saldo Kas Koperasi berkurang -{formatIDR(txAmount)}. Tabungan sukarela anggota ditarik & berkurang -{formatIDR(txAmount)}.</span>
                  ) : null}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="confirm-add-tx-btn"
                  className="px-5 py-2 text-xs font-semibold text-white glass-btn-primary rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
