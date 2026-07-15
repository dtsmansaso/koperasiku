/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Transaction, Asset, CoopConfig, ManagerHonorarium } from './types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "197508122005011003",
    name: "Drs. H. Sugeng, M.Pd.",
    type: "guru",
    status: "active",
    joinDate: "2018-01-15",
    simpananPokok: 100000,
    simpananWajib: 1200000,
    simpananSukarela: 3450000,
    loanBalance: 4000000,
    totalInterestPaid: 450000,
    phone: "081234567890"
  },
  {
    id: "198203152010022001",
    name: "Sri Wahyuni, S.Pd.",
    type: "guru",
    status: "active",
    joinDate: "2019-03-20",
    simpananPokok: 100000,
    simpananWajib: 1000000,
    simpananSukarela: 1800000,
    loanBalance: 0,
    totalInterestPaid: 180000,
    phone: "081398765432"
  },
  {
    id: "198011242008011002",
    name: "Budi Santoso, S.Kom.",
    type: "guru",
    status: "active",
    joinDate: "2020-07-10",
    simpananPokok: 100000,
    simpananWajib: 800000,
    simpananSukarela: 950000,
    loanBalance: 1200000,
    totalInterestPaid: 90000,
    phone: "085233445566"
  },
  {
    id: "198504022015012003",
    name: "Retno Lestari, A.Md.",
    type: "karyawan",
    status: "active",
    joinDate: "2021-02-05",
    simpananPokok: 100000,
    simpananWajib: 700000,
    simpananSukarela: 500000,
    loanBalance: 0,
    totalInterestPaid: 45000,
    phone: "089877665544"
  },
  {
    id: "20080512001",
    name: "Ahmad Dani Prasetyo",
    type: "siswa",
    status: "active",
    joinDate: "2024-07-15",
    simpananPokok: 10000,
    simpananWajib: 60000,
    simpananSukarela: 150000,
    loanBalance: 0,
    totalInterestPaid: 0,
    phone: "081211223344"
  },
  {
    id: "20080923002",
    name: "Siti Aminah Nurul",
    type: "siswa",
    status: "active",
    joinDate: "2024-07-18",
    simpananPokok: 10000,
    simpananWajib: 60000,
    simpananSukarela: 220000,
    loanBalance: 0,
    totalInterestPaid: 0,
    phone: "087755443322"
  },
  {
    id: "197204151998031001",
    name: "Eko Purwanto, S.Pd.",
    type: "guru",
    status: "inactive",
    joinDate: "2015-08-10",
    leaveDate: "2026-02-10",
    simpananPokok: 0,
    simpananWajib: 0,
    simpananSukarela: 0,
    loanBalance: 0,
    totalInterestPaid: 320000,
    phone: "085344556677"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Historic & recent entries
  {
    id: "TX-001",
    date: "2026-07-01",
    type: "simpanan_wajib",
    memberId: "197508122005011003",
    memberName: "Drs. H. Sugeng, M.Pd.",
    amount: 100000,
    description: "Simpanan Wajib bulan Juli 2026",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-002",
    date: "2026-07-01",
    type: "simpanan_wajib",
    memberId: "198203152010022001",
    memberName: "Sri Wahyuni, S.Pd.",
    amount: 100000,
    description: "Simpanan Wajib bulan Juli 2026",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-003",
    date: "2026-07-02",
    type: "simpanan_sukarela",
    memberId: "198203152010022001",
    memberName: "Sri Wahyuni, S.Pd.",
    amount: 250000,
    description: "Setoran Simpanan Sukarela",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-004",
    date: "2026-07-03",
    type: "pinjaman_baru",
    memberId: "198011242008011002",
    memberName: "Budi Santoso, S.Kom.",
    amount: 1500000,
    description: "Realisasi pinjaman modal multiguna",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-005",
    date: "2026-07-05",
    type: "bayar_cicilan",
    memberId: "197508122005011003",
    memberName: "Drs. H. Sugeng, M.Pd.",
    amount: 500000,
    interestAmount: 75000,
    description: "Bayar cicilan ke-5 + Jasa Pinjam 1.5%",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-006",
    date: "2026-07-06",
    type: "biaya_operasional",
    amount: 120000,
    description: "Pembelian ATK dan Buku Kas Koperasi",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-007",
    date: "2026-07-08",
    type: "simpanan_wajib",
    memberId: "20080512001",
    memberName: "Ahmad Dani Prasetyo",
    amount: 5000,
    description: "Simpanan Wajib Siswa Juli 2026",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-008",
    date: "2026-07-10",
    type: "kas_masuk_lain",
    amount: 350000,
    description: "Penerimaan komisi penjualan seragam sekolah",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  },
  {
    id: "TX-009",
    date: "2026-07-12",
    type: "tarik_simpanan",
    memberId: "198504022015012003",
    memberName: "Retno Lestari, A.Md.",
    amount: 200000,
    description: "Penarikan Simpanan Sukarela untuk keperluan mendesak",
    recordedBy: "Hj. Endang Setyowati (Bendahara)"
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: "AST-01",
    name: "Kas Tunai Koperasi (Brankas)",
    category: "cash",
    value: 4850000,
    description: "Uang tunai yang disimpan di brankas ruang koperasi",
    lastUpdated: "2026-07-14"
  },
  {
    id: "AST-02",
    name: "Rekening Bank Jatim SMAN 1 Soko",
    category: "bank",
    value: 28450000,
    description: "Saldo kas koperasi di Bank Jatim Cabang Soko",
    lastUpdated: "2026-07-14"
  },
  {
    id: "AST-03",
    name: "Piutang Pinjaman Anggota",
    category: "receivable",
    value: 5200000,
    description: "Total akumulasi sisa pinjaman yang masih berjalan di anggota",
    lastUpdated: "2026-07-14"
  },
  {
    id: "AST-04",
    name: "Inventaris Toko Koperasi",
    category: "inventory",
    value: 7500000,
    description: "Stok seragam, atribut sekolah, ATK, dan makanan ringan",
    lastUpdated: "2026-07-14"
  }
];

export const DEFAULT_CONFIG: CoopConfig = {
  loanInterestRate: 1.5, // 1.5% jasa pinjam per bulan
  shuJasaSimpan: 30,     // 30% dari SHU dibagikan berdasar Simpanan
  shuJasaPinjam: 25,     // 25% dari SHU dibagikan berdasar Jasa Pinjam (bunga)
  shuPengurus: 15,       // 15% dari SHU untuk HR Pengurus
  shuCadangan: 20,       // 20% disimpan sebagai cadangan modal
  shuSosial: 5,          // 5% untuk dana sosial
  shuPendidikan: 5,      // 5% untuk dana pendidikan warga sekolah
  googleSheetUrl: "",
  appsScriptUrl: ""
};

export const INITIAL_MANAGERS: ManagerHonorarium[] = [
  { id: "MGR-01", name: "Dra. Siti Aminah", role: "Ketua Koperasi", sharePercentage: 40 },
  { id: "MGR-02", name: "Hj. Endang Setyowati", role: "Bendahara", sharePercentage: 30 },
  { id: "MGR-03", name: "M. Taufiq, S.Pd.", role: "Sekretaris", sharePercentage: 30 }
];
