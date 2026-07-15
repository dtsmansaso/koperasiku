/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Member, Transaction, Asset, CoopConfig } from '../types';
import { Printer, Calendar, FileText, Download, Building, Landmark, Signature, CheckSquare } from 'lucide-react';

interface RATTabProps {
  members: Member[];
  transactions: Transaction[];
  assets: Asset[];
  config: CoopConfig;
}

export default function RATTab({ members, transactions, assets, config }: RATTabProps) {
  const [selectedYear, setSelectedYear] = useState('2026');

  // Stats
  const activeMembersCount = members.filter(m => m.status === 'active').length;
  const activeTeachersCount = members.filter(m => m.status === 'active' && m.type === 'guru').length;
  const activeStaffCount = members.filter(m => m.status === 'active' && m.type === 'karyawan').length;
  const activeStudentsCount = members.filter(m => m.status === 'active' && m.type === 'siswa').length;

  const totalSimpanenPokok = members.reduce((sum, m) => sum + m.simpananPokok, 0);
  const totalSimpanenWajib = members.reduce((sum, m) => sum + m.simpananWajib, 0);
  const totalSimpanenSukarela = members.reduce((sum, m) => sum + m.simpananSukarela, 0);
  const totalSavings = totalSimpanenPokok + totalSimpanenWajib + totalSimpanenSukarela;

  const totalOutstandingLoans = members.reduce((sum, m) => sum + m.loanBalance, 0);

  // Asset Ledger
  const cashAsset = assets.filter(a => a.category === 'cash').reduce((sum, a) => sum + a.value, 0);
  const bankAsset = assets.filter(a => a.category === 'bank').reduce((sum, a) => sum + a.value, 0);
  const receivableAsset = totalOutstandingLoans;
  const otherAsset = assets.filter(a => a.category !== 'cash' && a.category !== 'bank' && a.category !== 'receivable').reduce((sum, a) => sum + a.value, 0);
  const totalAssets = cashAsset + bankAsset + receivableAsset + otherAsset;

  // Transactions logs totals
  const totalSimpananMasuk = transactions.filter(t => ['simpanan_pokok', 'simpanan_wajib', 'simpanan_sukarela'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
  const totalSimpananDitarik = transactions.filter(t => t.type === 'tarik_simpanan').reduce((sum, t) => sum + t.amount, 0);
  const totalPinjamanDisalurkan = transactions.filter(t => t.type === 'pinjaman_baru').reduce((sum, t) => sum + t.amount, 0);
  const totalAngsuranMasuk = transactions.filter(t => t.type === 'bayar_cicilan').reduce((sum, t) => sum + t.amount, 0);
  const totalBungaDiterima = transactions.filter(t => t.type === 'bayar_cicilan').reduce((sum, t) => sum + (t.interestAmount || 0), 0);
  const totalBiayaOperasional = transactions.filter(t => t.type === 'biaya_operasional').reduce((sum, t) => sum + t.amount, 0);
  const totalKasMasukLain = transactions.filter(t => t.type === 'kas_masuk_lain').reduce((sum, t) => sum + t.amount, 0);

  // SHU calculation: (Loan interest collected + Store commission/other cash entry) - Operational expense
  const estimatedSHUBersih = (totalBungaDiterima + totalKasMasukLain) - totalBiayaOperasional;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Selection & Print Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Laporan RAT (Rapat Anggota Tahunan)</h2>
          <p className="text-xs text-indigo-300 font-mono mt-0.5">SMA Negeri 1 Soko • Dokumen Buku Laporan Keuangan Tahunan</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Calendar size={14} className="text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-900 text-slate-200 border-none focus:outline-none cursor-pointer font-mono"
            >
              <option value="2026">Tahun Buku 2026</option>
              <option value="2025">Tahun Buku 2025</option>
              <option value="2024">Tahun Buku 2024</option>
            </select>
          </div>
          <button
            onClick={handlePrint}
            id="print-rat-btn"
            className="glass-btn-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer size={15} />
            Cetak Laporan RAT
          </button>
        </div>
      </div>

      {/* RAT Printable Report Layout */}
      <div className="glass-panel rounded-2xl p-6 sm:p-10 text-slate-300 space-y-8 font-sans print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 print:backdrop-blur-none" id="rat-report">
        
        {/* Report Header */}
        <div className="text-center space-y-1.5 border-b-2 border-white/20 print:border-slate-800 pb-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 print:text-slate-600">LAPORAN PERTANGGUNGJAWABAN PENGURUS</h3>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white print:text-blue-900 uppercase">KOPERASI SIMPAN PINJAM "WARGA SEKOLAH SMAN 1 SOKO"</h2>
          <p className="text-xs font-semibold text-slate-400 print:text-slate-600">Alamat: Jl. Raya Soko No. 1, Soko, Kabupaten Tuban, Jawa Timur - 62372</p>
          <p className="text-xs font-mono tracking-wider font-semibold text-indigo-300 bg-white/5 print:bg-slate-100 print:text-slate-500 py-1 px-4 inline-block rounded-md mt-1">
            TAHUN BUKU {selectedYear} • Berakhir per 31 Desember {selectedYear}
          </p>
        </div>

        {/* Section 1: Membership Report */}
        <div>
          <h4 className="text-sm font-bold bg-white/5 border border-white/10 print:bg-slate-100 print:text-slate-800 px-4 py-2 rounded-lg text-white flex items-center gap-2 mb-3">
            <CheckSquare size={16} className="text-indigo-400 print:text-blue-700" />
            I. LAPORAN PERKEMBANGAN KEANGGOTAAN
          </h4>
          <p className="text-xs text-slate-300 print:text-slate-600 mb-3 leading-relaxed">
            Hingga tutup buku tanggal 31 Desember {selectedYear}, perkembangan keanggotaan Koperasi Simpan Pinjam SMAN 1 Soko tercatat sebagai berikut:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-100">
              <span className="text-2xs text-slate-400 font-medium block">Total Keanggotaan</span>
              <span className="text-lg font-bold text-white print:text-slate-800 font-mono block mt-0.5">{activeMembersCount}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-100">
              <span className="text-2xs text-slate-400 font-medium block">Guru Pengajar</span>
              <span className="text-lg font-bold text-indigo-300 print:text-blue-700 font-mono block mt-0.5">{activeTeachersCount}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-100">
              <span className="text-2xs text-slate-400 font-medium block">Staf Karyawan</span>
              <span className="text-lg font-bold text-purple-300 print:text-indigo-700 font-mono block mt-0.5">{activeStaffCount}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-100">
              <span className="text-2xs text-slate-400 font-medium block">Anggota Siswa</span>
              <span className="text-lg font-bold text-amber-300 print:text-amber-700 font-mono block mt-0.5">{activeStudentsCount}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Balance Sheet summary */}
        <div>
          <h4 className="text-sm font-bold bg-white/5 border border-white/10 print:bg-slate-100 print:text-slate-800 px-4 py-2 rounded-lg text-white flex items-center gap-2 mb-3">
            <Building size={16} className="text-indigo-400 print:text-blue-700" />
            II. NERACA KEUANGAN KOPERASI (BALANCE SHEET)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            
            {/* Activa / Assets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 print:border-slate-200 pb-1 block">Aset (AKTIVA)</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">1. Kas Tunai (Brankas)</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(cashAsset)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">2. Kas di Bank Jatim</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(bankAsset)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">3. Piutang Pinjaman Anggota</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(receivableAsset)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">4. Persediaan Toko / Inventaris</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(otherAsset)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-white/20 print:border-slate-300 pt-1.5 font-bold text-indigo-300 print:text-blue-900">
                  <span>TOTAL AKTIVA</span>
                  <span className="font-mono">{formatIDR(totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Passiva / Capital */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 print:border-slate-200 pb-1 block">Kewajiban & Modal (PASSIVA)</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">1. Simpanan Pokok Anggota</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalSimpanenPokok)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">2. Simpanan Wajib Anggota</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalSimpanenWajib)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">3. Simpanan Sukarela Anggota</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalSimpanenSukarela)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-slate-600">4. Estimasi Dana Cadangan & SHU Terkumpul</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalAssets - totalSavings)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-white/20 print:border-slate-300 pt-1.5 font-bold text-indigo-300 print:text-blue-900">
                  <span>TOTAL PASSIVA</span>
                  <span className="font-mono">{formatIDR(totalAssets)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Profit and Loss Statement */}
        <div>
          <h4 className="text-sm font-bold bg-white/5 border border-white/10 print:bg-slate-100 print:text-slate-800 px-4 py-2 rounded-lg text-white flex items-center gap-2 mb-3">
            <Landmark size={16} className="text-indigo-400 print:text-blue-700" />
            III. LAPORAN HASIL USAHA & PERHITUNGAN SHU
          </h4>
          
          <div className="border border-white/10 print:border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 bg-white/5 border-b border-white/10 print:bg-slate-50 print:border-slate-200 px-4 py-2.5 font-bold text-slate-200 print:text-slate-700">
              <span>Pos Anggaran Hasil Usaha</span>
              <span className="text-right">Jumlah (Rupiah)</span>
            </div>
            
            <div className="p-4 space-y-2.5">
              
              {/* Pemasukan */}
              <div className="space-y-1">
                <span className="font-bold text-indigo-300 print:text-blue-800 uppercase block tracking-wider text-2xs">A. PENDAPATAN JASA KOPERASI</span>
                <div className="flex justify-between pl-3 text-slate-300 print:text-slate-600">
                  <span>1. Jasa Pinjaman / Bunga Terkumpul</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalBungaDiterima)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-300 print:text-slate-600">
                  <span>2. Pemasukan Lain (Komisi Toko, Atribut, dll)</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalKasMasukLain)}</span>
                </div>
                <div className="flex justify-between pl-3 border-t border-white/10 print:border-slate-100 pt-1.5 font-bold text-slate-200 print:text-slate-700">
                  <span>Total Pendapatan Kotor</span>
                  <span className="font-mono text-emerald-400 print:text-emerald-700">+{formatIDR(totalBungaDiterima + totalKasMasukLain)}</span>
                </div>
              </div>

              {/* Pengeluaran */}
              <div className="space-y-1 pt-2">
                <span className="font-bold text-rose-300 print:text-red-800 uppercase block tracking-wider text-2xs">B. BIAYA OPERASIONAL KOPERASI</span>
                <div className="flex justify-between pl-3 text-slate-300 print:text-slate-600">
                  <span>1. Pembelian ATK, Buku Kas, Cetak Form</span>
                  <span className="font-mono font-semibold text-white print:text-slate-800">{formatIDR(totalBiayaOperasional)}</span>
                </div>
                <div className="flex justify-between pl-3 border-t border-white/10 print:border-slate-100 pt-1.5 font-bold text-slate-200 print:text-slate-700">
                  <span>Total Biaya Operasional</span>
                  <span className="font-mono text-rose-400 print:text-rose-600">-{formatIDR(totalBiayaOperasional)}</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="border-t border-dashed border-white/20 print:border-slate-300 pt-3 flex justify-between font-extrabold text-sm text-slate-100 print:text-slate-800">
                <span>C. ESTIMASI SISA HASIL USAHA (SHU) BERSIH</span>
                <span className="font-mono text-emerald-400 print:text-emerald-800">{formatIDR(estimatedSHUBersih)}</span>
              </div>

            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs" id="signatures">
          <div>
            <p className="text-slate-400 print:text-slate-500">Mengetahui,</p>
            <p className="font-bold text-white print:text-slate-800 mt-0.5">Kepala Sekolah SMAN 1 Soko</p>
            <div className="h-20 flex items-center justify-center text-slate-500 italic">
              <Signature size={42} className="opacity-15" />
            </div>
            <p className="font-bold text-white print:text-slate-800 underline">Drs. H. SUGENG, M.Pd.</p>
            <p className="text-3xs text-slate-400 font-mono">NIP. 197508122005011003</p>
          </div>

          <div>
            <p className="text-slate-400 print:text-slate-500">Soko, Tuban, 31 Desember {selectedYear}</p>
            <p className="font-bold text-white print:text-slate-800 mt-0.5">Bendahara / Pengurus Koperasi</p>
            <div className="h-20 flex items-center justify-center text-slate-500 italic">
              <Signature size={42} className="opacity-15" />
            </div>
            <p className="font-bold text-white print:text-slate-800 underline">Hj. ENDANG SETYOWATI</p>
            <p className="text-3xs text-slate-400 print:text-slate-400 font-mono">Ketua Pengelola Keuangan</p>
          </div>
        </div>

      </div>

    </div>
  );
}
