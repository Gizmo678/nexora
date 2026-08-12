export interface CompanyProfile {
  companyName: string;
  tagline: string;
  legalName: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  gstin?: string;
}

export const COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Nexora',
  tagline: 'Operations, inventory and sales, beautifully connected.',
  legalName: 'Nexora Enterprise Solutions Pvt. Ltd.',
  address: 'Suite 402, Horizon Business Tech Park, Outer Ring Road',
  cityStateZip: 'Bengaluru, Karnataka 560103',
  phone: '+91 80 4920 1800',
  email: 'operations@nexora.io',
  website: 'www.nexora.io',
  gstin: '29AAACN1234F1Z5',
};
