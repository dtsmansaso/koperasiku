/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'pengawas' | 'anggota';

export interface UserSession {
  role: UserRole;
  memberId?: string;
  name: string;
}

export type MemberStatus = 'active' | 'inactive';
export type MemberType = 'guru' | 'karyawan' | 'siswa';

export interface Member {
  id: string; // NIK / NIS / Unique ID
  name: string;
  type: MemberType;
  status: MemberStatus;
  joinDate: string;
  leaveDate?: string;
  // Financial snapshot
  simpananPokok: number;   // Paid once on join
  simpananWajib: number;   // Paid monthly
  simpananSukarela: number;// Flexible savings
  loanBalance: number;     // Remaining unpaid loan
  totalInterestPaid: number; // Historical loan interest paid (crucial for SHU Jasa Pinjam)
  phone?: string;
}

export type TransactionType =
  | 'simpanan_pokok'
  | 'simpanan_wajib'
  | 'simpanan_sukarela'
  | 'pinjaman_baru'
  | 'bayar_cicilan'
  | 'biaya_operasional'
  | 'kas_masuk_lain'
  | 'pembagian_shu'
  | 'tarik_simpanan';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  memberId?: string; // Optional for general operational transactions
  memberName?: string; // Cache for easy viewing
  amount: number;
  interestAmount?: number; // Part of payment that is loan interest (jasa pinjam)
  description: string;
  recordedBy: string; // User name
}

export type AssetCategory = 'cash' | 'bank' | 'receivable' | 'inventory' | 'other';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  description: string;
  lastUpdated: string;
}

export interface CoopConfig {
  loanInterestRate: number; // e.g. 1.5% per month
  // SHU Percentage Allocations (must total 100%)
  shuJasaSimpan: number; // e.g. 30% for savings contribution
  shuJasaPinjam: number; // e.g. 25% for loan interest contribution
  shuPengurus: number;   // e.g. 15% for managers honorarium
  shuCadangan: number;   // e.g. 20% for cooperative reserve
  shuSosial: number;     // e.g. 5% for social funds
  shuPendidikan: number; // e.g. 5% for educational funds
  googleSheetUrl?: string;
  appsScriptUrl?: string;
}

export interface ManagerHonorarium {
  id: string;
  name: string;
  role: string;
  sharePercentage: number; // % of total manager SHU budget (e.g. Leader 40%, Secretary 30%, Treasurer 30%)
}

export interface SHUDistributionResult {
  memberId: string;
  memberName: string;
  memberType: MemberType;
  savingsRatio: number;
  loanInterestRatio: number;
  shuJasaSimpanAmount: number;
  shuJasaPinjamAmount: number;
  totalSHUMember: number;
}
