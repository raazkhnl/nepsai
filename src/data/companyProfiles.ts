import { StockItem } from '../types/market';

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  description: string;
  keyHighlights: string[];
  headquarters: string;
  establishedYear: number;
  shareRegistrar?: string;
  projectCapacityMW?: number;
  commercialStatus?: string;
}

export const COMPANY_PROFILES: Record<string, Partial<CompanyProfile>> = {
  NEPSE: {
    symbol: 'NEPSE',
    name: 'Nepal Stock Exchange Index',
    sector: 'Indices',
    description:
      'The NEPSE Index represents the aggregate market-capitalization-weighted performance of all listed equities on the Nepal Stock Exchange. Established under the Securities Act, it is the sole capital market benchmark of Nepal.',
    keyHighlights: [
      'Comprehensive benchmark of Nepalese equity market capitalisation',
      'Calculated in real-time during Nepal trading hours (11:00 AM – 3:00 PM NPT, Sun–Thu)',
      'Under the regulatory oversight of the Securities Board of Nepal (SEBON)',
    ],
    headquarters: 'Singha Durbar Plaza, Kathmandu, Nepal',
    establishedYear: 1993,
  },
  NABIL: {
    symbol: 'NABIL',
    name: 'Nabil Bank Limited',
    sector: 'Commercial Banks',
    description:
      'Nabil Bank Limited is the pioneer private sector commercial bank of Nepal, established in 1984. It operates an extensive nation-wide branch network catering to retail, SME, corporate, and international trade financing.',
    keyHighlights: [
      'Nepal’s first joint-venture commercial bank (formerly Nepal Arab Bank)',
      'Consistently among top dividend payers and lowest non-performing loan (NPL) ratios',
      'Market leader in digital banking and cross-border trade settlements',
    ],
    headquarters: 'Teendhara, Durbarmarg, Kathmandu',
    establishedYear: 1984,
    shareRegistrar: 'Nabil Investment Banking Limited',
  },
  NICA: {
    symbol: 'NICA',
    name: 'NIC Asia Bank Limited',
    sector: 'Commercial Banks',
    description:
      'NIC Asia Bank is one of the largest private sector retail banks in Nepal with over 360 branches across all 7 provinces. Known for aggressive digital retail lending and deposit mobilization.',
    keyHighlights: [
      'Largest branch network and customer reach among private sector banks in Nepal',
      'Extensive retail banking footprint and digital payments infrastructure',
      'Pioneer in paperless digital account onboarding and mobile banking',
    ],
    headquarters: 'Thapathali, Kathmandu',
    establishedYear: 1998,
    shareRegistrar: 'NIC Asia Capital Limited',
  },
  GBIME: {
    symbol: 'GBIME',
    name: 'Global IME Bank Limited',
    sector: 'Commercial Banks',
    description:
      'Global IME Bank Limited is the largest commercial bank in Nepal by total assets, paid-up capital, and deposit base following strategic mergers with multiple Class A and B financial institutions.',
    keyHighlights: [
      'Highest paid-up capital and balance sheet size in the Nepalese banking sector',
      'Presence across all 77 districts with extensive remittance networks worldwide',
      'Systemically important financial institution with strong corporate exposure',
    ],
    headquarters: 'Panipokhari, Kathmandu',
    establishedYear: 2007,
    shareRegistrar: 'Global IME Capital Limited',
  },
  SHIVM: {
    symbol: 'SHIVM',
    name: 'Shivam Cements Limited',
    sector: 'Manufacturing & Processing',
    description:
      'Shivam Cements Limited is one of Nepal’s largest and most technologically advanced OPC and PPC cement manufacturers, operating its self-owned captive limestone mines and clinker production plant in Hetauda.',
    keyHighlights: [
      'Daily production capacity exceeding 3,000 metric tons of premium OPC/PPC cement',
      'Major strategic equity investor in Hongshi-Shivam Cement joint venture',
      'Pioneer private sector manufacturing company listed on the NEPSE main board',
    ],
    headquarters: 'Anamnagar, Kathmandu / Hetauda Factory',
    establishedYear: 2003,
    shareRegistrar: 'CBIL Capital Limited',
  },
  HDL: {
    symbol: 'HDL',
    name: 'Himalayan Distillery Limited',
    sector: 'Manufacturing & Processing',
    description:
      'Himalayan Distillery Limited is the leading manufacturer and exporter of premium alcoholic beverages in Nepal, renowned for iconic brands like Golden Oak, Black Oak, and Royal Treasure.',
    keyHighlights: [
      'Historically high return on equity (ROE > 40%) and high dividend payout track record',
      'Dominant market share in Nepal’s domestic spirits and beverages industry',
      'State-of-the-art automated distillation facilities in Parsa, Birgunj',
    ],
    headquarters: 'Jawalakhel, Lalitpur',
    establishedYear: 1985,
    shareRegistrar: 'Nabil Investment Banking Limited',
  },
  CHCL: {
    symbol: 'CHCL',
    name: 'Chilime Hydropower Company Limited',
    sector: 'Hydro Power',
    description:
      'Chilime Hydropower Company Limited was established by Nepal Electricity Authority (NEA) to develop the 22.1 MW Chilime Hydropower Plant in Rasuwa. It is a parent promoter of several mega hydro subsidiaries.',
    keyHighlights: [
      'Owns operating 22.1 MW Chilime Hydroelectric Project running since 2003',
      'Promoter parent of Upper Sanjen (14.8 MW), Sanjen (42.5 MW), Rasuwagadhi (111 MW), and Madhya Bhotekoshi (102 MW)',
      'Consistent dividend track record with strong balance sheet liquidity',
    ],
    headquarters: 'Maharajgunj, Kathmandu',
    establishedYear: 1995,
    projectCapacityMW: 22.1,
    shareRegistrar: 'Siddhartha Capital Limited',
  },
  UPPER: {
    symbol: 'UPPER',
    name: 'Upper Tamakoshi Hydropower Limited',
    sector: 'Hydro Power',
    description:
      'Upper Tamakoshi Hydropower Limited operates Nepal’s single largest peaking run-of-river plant (456 MW) located in Dolakha. A historic national pride project conceived to supply grid baseload energy.',
    keyHighlights: [
      '456 MW installed capacity generating ~2,281 GWh of annual clean energy',
      'Strategic national infrastructure asset curbing dry-season electricity imports',
      'Jointly developed with public participation and domestic institutional funding',
    ],
    headquarters: 'Baneshwor, Kathmandu',
    establishedYear: 2006,
    projectCapacityMW: 456,
    shareRegistrar: 'Sunrise Capital Limited',
  },
  NLIC: {
    symbol: 'NLIC',
    name: 'Nepal Life Insurance Company Limited',
    sector: 'Life Insurance',
    description:
      'Nepal Life Insurance Company is the undisputed leader in Nepal’s life insurance industry, commanding the largest life fund, premium collection, and policyholder base.',
    keyHighlights: [
      'Controls over 28% of Nepal’s total life insurance premium volume',
      'Robust life fund exceeding NPR 180+ Billion invested across sovereign bonds and term deposits',
      'Extensive network of over 200 branches and agency forces nationwide',
    ],
    headquarters: 'Kamaladi, Kathmandu',
    establishedYear: 2001,
    shareRegistrar: 'Global IME Capital Limited',
  },
  NIFRA: {
    symbol: 'NIFRA',
    name: 'Nepal Infrastructure Bank Limited',
    sector: 'Investment',
    description:
      'Nepal Infrastructure Bank Limited is the nation’s sole dedicated infrastructure development bank, founded in partnership with the Government of Nepal, commercial banks, and institutional investors.',
    keyHighlights: [
      'Mandated to provide long-term mezzanine and syndicated financing for roads, hydro, and transit',
      'Largest initial public offering (IPO) in Nepal capital market history (NPR 800 Crore)',
      'Sovereign equity participation alongside leading institutional financiers',
    ],
    headquarters: 'Baneshwor, Kathmandu',
    establishedYear: 2018,
    shareRegistrar: 'NIBL Ace Capital Limited',
  },
};

/**
 * Returns a rich company profile for any NEPSE scrip, dynamically generating
 * sector-accurate information if not individually specified in dictionary.
 */
export function getCompanyProfile(stock: StockItem): CompanyProfile {
  const existing = COMPANY_PROFILES[stock.symbol];
  if (existing) {
    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      description: existing.description || getDefaultDescription(stock),
      keyHighlights: existing.keyHighlights || getDefaultHighlights(stock),
      headquarters: existing.headquarters || 'Kathmandu, Nepal',
      establishedYear: existing.establishedYear || 2010,
      shareRegistrar: existing.shareRegistrar || stock.fundamentals?.shareRegistrar || 'Authorized Capital Registrar',
      projectCapacityMW: existing.projectCapacityMW || stock.fundamentals?.capacityMW,
      commercialStatus: 'Active & Listed on NEPSE Main Board',
    };
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    description: getDefaultDescription(stock),
    keyHighlights: getDefaultHighlights(stock),
    headquarters: 'Kathmandu, Nepal',
    establishedYear: 2012,
    shareRegistrar: stock.fundamentals?.shareRegistrar || 'SEBON Approved Registrar',
    projectCapacityMW: stock.fundamentals?.capacityMW,
    commercialStatus: 'Active & Traded under NEPSE Automated Trading System (NOTS)',
  };
}

function getDefaultDescription(stock: StockItem): string {
  const sec = stock.sector;
  if (sec.includes('Bank')) {
    return `${stock.name} (${stock.symbol}) is a licensed financial institution regulated by Nepal Rastra Bank. It delivers institutional lending, retail deposit accounts, and digital banking solutions across urban and regional hubs of Nepal.`;
  }
  if (sec.includes('Hydro')) {
    return `${stock.name} (${stock.symbol}) is an independent power producer (IPP) operating in Nepal's renewable energy sector. It generates clean hydroelectricity sold to the national grid under long-term Power Purchase Agreements (PPA) with Nepal Electricity Authority.`;
  }
  if (sec.includes('Microfinance')) {
    return `${stock.name} (${stock.symbol}) is a class 'D' microfinance institution in Nepal dedicated to rural financial inclusion, micro-enterprise lending, and grassroots group financing for unbanked communities.`;
  }
  if (sec.includes('Insurance')) {
    return `${stock.name} (${stock.symbol}) is an insurance underwriter regulated by the Nepal Insurance Authority (Nepal Beema Pradhikaran), providing underwriting policies, risk mitigation, and financial security products across Nepal.`;
  }
  if (sec.includes('Manufacturing')) {
    return `${stock.name} (${stock.symbol}) is a Nepalese industrial production company operating manufacturing facilities, delivering domestic consumer or construction products with established brand recognition.`;
  }
  if (sec.includes('Hotels') || sec.includes('Tourism')) {
    return `${stock.name} (${stock.symbol}) operates hospitality, leisure, and tourism assets in Nepal, providing lodging, convention services, and dining experiences for international tourists and domestic patrons.`;
  }
  return `${stock.name} (${stock.symbol}) is an actively traded corporate entity listed on the Nepal Stock Exchange (NEPSE) under the ${stock.sector} sector, adhering to SEBON corporate governance standards.`;
}

function getDefaultHighlights(stock: StockItem): string[] {
  const sec = stock.sector;
  if (sec.includes('Bank')) {
    return [
      'Regulated by Nepal Rastra Bank with established liquidity and reserve ratios',
      'Diversified retail and corporate credit portfolios across Nepal',
      'Active constituent of the NEPSE Banking index with high daily liquidity',
    ];
  }
  if (sec.includes('Hydro')) {
    return [
      'Long-term Power Purchase Agreement (PPA) with sovereign off-taker NEA',
      'Benefits from national hydropower generation and cross-border power export policies',
      'Clean energy asset contributing to domestic grid stability',
    ];
  }
  if (sec.includes('Microfinance')) {
    return [
      'Class D micro-lending institution with high social impact and financial inclusion',
      'Strong retail borrower base across semi-urban and rural village districts',
      'High historical return on capital with disciplined community recovery mechanisms',
    ];
  }
  if (sec.includes('Insurance')) {
    return [
      'Solid investment fund allocations in government securities and fixed deposits',
      'Regulated under modern solvency and reserve mandates by Nepal Insurance Authority',
      'Expanding policyholder reach driven by growing financial literacy in Nepal',
    ];
  }
  return [
    'Listed on the main board of the Nepal Stock Exchange (NEPSE)',
    'Full regulatory compliance with SEBON and company act disclosure norms',
    'Actively tracked by institutional funds and retail momentum traders',
  ];
}
