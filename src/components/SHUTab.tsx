/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, CoopConfig, SHUDistributionResult, ManagerHonorarium } from '../types';
import { Settings, Percent, Calculator, Coins, ShieldAlert, Award, FileSpreadsheet, Check, RefreshCw } from 'lucide-react';

interface SHUTabProps {
  members: Member[];
  config: CoopConfig;
  onUpdateConfig: (newConfig: Partial<CoopConfig>) => void;
  onDistributeSHU: (results: SHUDistributionResult[], totalAmount: number) => void;
  managers: ManagerHonorarium[];
  onUpdateManagers: (newManagers: ManagerHonorarium[]) => void;
  userRole: string;
}

export default function SHUTab({ members, config, onUpdateConfig, onDistributeSHU, managers, onUpdateManagers, userRole }: SHUTabProps) {
  // Config state
  const [loanRate, setLoanRate] = useState(config.loanInterestRate);
  const [jasaSimpan, setJasaSimpan] = useState(config.shuJasaSimpan);
  const [jasaPinjam, setJasaPinjam] = useState(config.shuJasaPinjam);
  const [jasaPengurus, setJasaPengurus] = useState(config.shuPengurus);
  const [danaCadangan, setDanaCadangan] = useState(config.shuCadangan);
  const [danaSosial, setDanaSosial] = useState(config.shuSosial);
  const [danaPendidikan, setDanaPendidikan] = useState(config.shuPendidikan);

  // SHU distribution state
  const [totalSHUInput, setTotalSHUInput] = useState<number>(12000000); // 12jt standard demo
  const [distributionResults, setDistributionResults] = useState<SHUDistributionResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isDistributed, setIsDistributed] = useState(false);

  // Sum check
  const totalAllocationPercentage = jasaSimpan + jasaPinjam + jasaPengurus + danaCadangan + danaSosial + danaPendidikan;

  // Recalculate if totals or members change
  const handleCalculate = () => {
    if (totalAllocationPercentage !== 100) {
      alert(`Total presentase alokasi SHU harus tepat 100%! Saat ini: ${totalAllocationPercentage}%`);
      return;
    }

    const activeMembers = members.filter(m => m.status === 'active');
    
    // Totals for proportions
    const totalSavingsOfCoop = activeMembers.reduce((sum, m) => sum + (m.simpananPokok + m.simpananWajib + m.simpananSukarela), 0);
    const totalInterestPaidOfCoop = activeMembers.reduce((sum, m) => sum + m.totalInterestPaid, 0);

    const poolJasaSimpan = (jasaSimpan / 100) * totalSHUInput;
    const poolJasaPinjam = (jasaPinjam / 100) * totalSHUInput;

    const results: SHUDistributionResult[] = activeMembers.map(m => {
      const personalSavings = m.simpananPokok + m.simpananWajib + m.simpananSukarela;
      const savingsRatio = totalSavingsOfCoop > 0 ? (personalSavings / totalSavingsOfCoop) : 0;
      const loanInterestRatio = totalInterestPaidOfCoop > 0 ? (m.totalInterestPaid / totalInterestPaidOfCoop) : 0;

      const shuJasaSimpanAmount = Math.round(savingsRatio * poolJasaSimpan);
      const shuJasaPinjamAmount = Math.round(loanInterestRatio * poolJasaPinjam);
      const totalSHUMember = shuJasaSimpanAmount + shuJasaPinjamAmount;

      return {
        memberId: m.id,
        memberName: m.name,
        memberType: m.type,
        savingsRatio,
        loanInterestRatio,
        shuJasaSimpanAmount,
        shuJasaPinjamAmount,
        totalSHUMember
      };
    });

    setDistributionResults(results);
    setIsCalculated(true);
    setIsDistributed(false);
  };

  const handleApplyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAllocationPercentage !== 100) {
      alert(`Gagal menyimpan! Total alokasi SHU harus tepat 100%. Saat ini: ${totalAllocationPercentage}%`);
      return;
    }

    onUpdateConfig({
      loanInterestRate: Number(loanRate),
      shuJasaSimpan: Number(jasaSimpan),
      shuJasaPinjam: Number(jasaPinjam),
      shuPengurus: Number(jasaPengurus),
      shuCadangan: Number(danaCadangan),
      shuSosial: Number(danaSosial),
      shuPendidikan: Number(danaPendidikan)
    });

    alert("Konfigurasi presentase jasa & pembagian SHU berhasil diperbarui!");
  };

  const handleDistribute = () => {
    if (!isCalculated || distributionResults.length === 0) return;
    const confirmDist = window.confirm(`Apakah Anda yakin ingin membagikan SHU total sebesar ${formatIDR(totalSHUInput)} ke masing-masing saldo simpanan sukarela anggota? Tindakan ini akan menambah saldo simpanan sukarela mereka secara otomatis.`);
    if (!confirmDist) return;

    onDistributeSHU(distributionResults, totalSHUInput);
    setIsDistributed(true);
    alert("Bagi Hasil SHU sukses! Jatah SHU masing-masing anggota telah ditambahkan otomatis ke saldo Simpanan Sukarela mereka, dan tercatat di Jurnal Kas.");
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Manager honorarium budget calculated
  const totalManagerBudget = (config.shuPengurus / 100) * totalSHUInput;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Pengaturan & Bagi Hasil Sisa Hasil Usaha (SHU)</h2>
        <p className="text-xs text-indigo-300 font-mono mt-0.5">SMA Negeri 1 Soko • Konfigurasi Prosentase, SHU Anggota, & Honorarium Pengurus</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Config Settings Form */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-sans flex items-center gap-2">
              <Percent size={18} className="text-indigo-400" />
              Suku Jasa & Alokasi SHU
            </h3>

            <form onSubmit={handleApplyConfig} className="space-y-4">
              {/* Loan Interest Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jasa Pinjaman (Bunga Bulanan %)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    disabled={userRole !== 'admin'}
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="w-full px-4.5 py-2 text-sm glass-input focus:outline-none font-mono"
                  />
                  <span className="absolute right-4.5 inset-y-0 flex items-center text-xs text-slate-400 font-mono">% / bln</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Alokasi Pembagian SHU RAT</span>
                
                {/* Alokasi Jasa Simpan */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">Jasa Simpanan (Modal)</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={jasaSimpan}
                      onChange={(e) => setJasaSimpan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Alokasi Jasa Pinjam */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">Jasa Pinjaman (Anggota)</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={jasaPinjam}
                      onChange={(e) => setJasaPinjam(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Alokasi Pengurus */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">HR Pengurus / Pengawas</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={jasaPengurus}
                      onChange={(e) => setJasaPengurus(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Alokasi Cadangan */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">Dana Cadangan Koperasi</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={danaCadangan}
                      onChange={(e) => setDanaCadangan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Alokasi Sosial */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">Dana Sosial & Pembangunan</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={danaSosial}
                      onChange={(e) => setDanaSosial(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Alokasi Pendidikan */}
                <div className="flex justify-between items-center gap-4">
                  <label className="text-xs font-medium text-slate-200">Dana Pendidikan Sekolah</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      disabled={userRole !== 'admin'}
                      value={danaPendidikan}
                      onChange={(e) => setDanaPendidikan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-right bg-slate-900 border-none rounded-lg focus:outline-none font-mono text-slate-100"
                    />
                    <span className="absolute right-2.5 inset-y-0 flex items-center text-3xs text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Total Summary indicators */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Total Persentase:</span>
                <span className={`font-bold font-mono ${totalAllocationPercentage === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalAllocationPercentage}%
                </span>
              </div>

              {userRole === 'admin' && (
                <button
                  type="submit"
                  id="save-percentage-config-btn"
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white glass-btn-primary cursor-pointer transition-colors shadow-md mt-2"
                >
                  Simpan Konfigurasi
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Middle/Right Column: Interactive Calculator & Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main SHU Calculator Engine */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-sans flex items-center gap-2">
              <Calculator size={18} className="text-emerald-400" />
              Kalkulator Pembagian SHU Anggota
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total SHU Bersih untuk Dibagi</label>
                <div className="relative">
                  <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={1000}
                    value={totalSHUInput}
                    onChange={(e) => setTotalSHUInput(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2 text-sm glass-input font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCalculate}
                  id="calculate-shu-btn"
                  className="flex-1 py-2 px-4.5 text-xs font-bold bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  <RefreshCw size={14} />
                  Hitung Proporsi SHU
                </button>

                {isCalculated && userRole === 'admin' && !isDistributed && (
                  <button
                    onClick={handleDistribute}
                    id="distribute-shu-btn"
                    className="py-2 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1 border border-indigo-500/20"
                  >
                    <Coins size={14} />
                    Bagikan ke Sukarela
                  </button>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            {isCalculated && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">Jasa Simpan ({config.shuJasaSimpan}%)</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatIDR((config.shuJasaSimpan / 100) * totalSHUInput)}</span>
                  </div>
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">Jasa Pinjam ({config.shuJasaPinjam}%)</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatIDR((config.shuJasaPinjam / 100) * totalSHUInput)}</span>
                  </div>
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">HR Pengurus ({config.shuPengurus}%)</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatIDR((config.shuPengurus / 100) * totalSHUInput)}</span>
                  </div>
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">Cadangan ({config.shuCadangan}%)</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatIDR((config.shuCadangan / 100) * totalSHUInput)}</span>
                  </div>
                </div>

                {/* Individual list results */}
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse text-left text-xs" id="shu-calculator-table">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-slate-200 font-bold uppercase tracking-wider">Nama Anggota</th>
                        <th className="px-4 py-3 text-slate-200 font-bold uppercase tracking-wider text-right">Jasa Simpanan</th>
                        <th className="px-4 py-3 text-slate-200 font-bold uppercase tracking-wider text-right">Jasa Pinjaman</th>
                        <th className="px-4 py-3 text-slate-200 font-bold uppercase tracking-wider text-right">Total SHU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {distributionResults.map((res) => (
                        <tr key={res.memberId} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-slate-200">
                            {res.memberName}
                            <span className="text-3xs text-slate-400 block font-mono capitalize">ID: {res.memberId} • {res.memberType}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-300">{formatIDR(res.shuJasaSimpanAmount)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-300">{formatIDR(res.shuJasaPinjamAmount)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">{formatIDR(res.totalSHUMember)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isDistributed && (
                  <div className="bg-emerald-500/15 p-4 rounded-xl border border-emerald-500/25 flex items-center gap-3">
                    <Check size={20} className="text-emerald-400" />
                    <p className="text-xs text-emerald-200 font-semibold">
                      Dana SHU Berhasil Ditransfer & Disinkronisasi! Anggota telah menerima bagi hasil secara real-time.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HR Pengurus Detail Breakdown Card */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-sans flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Honorarium (HR) Pengurus & Pengawas Koperasi
            </h3>

            <p className="text-xs text-slate-300 leading-normal mb-4">
              Dana bagi hasil pengurus disalurkan dari pos alokasi <strong>HR Pengurus/Pengawas ({config.shuPengurus}%)</strong>. Total alokasi dihitung berdasarkan total SHU RAT dikalikan prosentase pengurus.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center mb-4 text-amber-300">
              <span className="text-xs font-semibold">Total Anggaran HR Pengurus:</span>
              <span className="text-base font-extrabold font-mono">{formatIDR(totalManagerBudget)}</span>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-left text-xs" id="hr-pengurus-table">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-slate-200 font-bold uppercase">Nama Pengurus</th>
                    <th className="px-4 py-3 text-slate-200 font-bold uppercase text-center">Jabatan</th>
                    <th className="px-4 py-3 text-slate-200 font-bold uppercase text-center">Persentase</th>
                    <th className="px-4 py-3 text-slate-200 font-bold uppercase text-right">Honorarium Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {managers.map((mgr) => {
                    const personalHR = Math.round((mgr.sharePercentage / 100) * totalManagerBudget);
                    return (
                      <tr key={mgr.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-slate-200">{mgr.name}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{mgr.role}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-semibold text-slate-300">{mgr.sharePercentage}%</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-400">{formatIDR(personalHR)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
