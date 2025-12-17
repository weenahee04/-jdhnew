import { Coin, BannerData, Transaction, Notification, FAQ } from './types';

export const MOCK_COINS: Coin[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 2350000, 
    change24h: 2.5,
    balance: 0.045,
    balanceUsd: 105750,
    color: '#F7931A',
    about: 'Bitcoin is the first successful internet money based on peer-to-peer technology.',
    chartData: [{ value: 2300000 }, { value: 2320000 }, { value: 2310000 }, { value: 2340000 }, { value: 2350000 }, { value: 2380000 }, { value: 2350000 }]
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 85000,
    change24h: -1.2,
    balance: 1.2,
    balanceUsd: 102000,
    color: '#627EEA',
    about: 'Ethereum is a decentralized platform that runs smart contracts.',
    chartData: [{ value: 87000 }, { value: 86000 }, { value: 86500 }, { value: 85500 }, { value: 85000 }, { value: 84500 }, { value: 85000 }]
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    price: 34.5,
    change24h: 0.01,
    balance: 5000,
    balanceUsd: 172500,
    color: '#26A17B',
    about: 'Tether is a stablecoin pegged to the US Dollar.',
    chartData: [{ value: 34.4 }, { value: 34.5 }, { value: 34.5 }, { value: 34.49 }, { value: 34.5 }, { value: 34.51 }, { value: 34.5 }]
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    price: 18000,
    change24h: 4.1,
    balance: 0.5,
    balanceUsd: 9000,
    color: '#F3BA2F',
    about: 'BNB is the cryptocurrency coin that powers the Binance ecosystem.',
    chartData: [{ value: 17000 }, { value: 17200 }, { value: 17500 }, { value: 17800 }, { value: 18000 }, { value: 18200 }, { value: 18000 }]
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 3500,
    change24h: 8.5,
    balance: 10,
    balanceUsd: 35000,
    color: '#14F195',
    about: 'Solana is a high-performance blockchain supporting builders around the world.',
    chartData: [{ value: 3100 }, { value: 3200 }, { value: 3350 }, { value: 3400 }, { value: 3500 }, { value: 3600 }, { value: 3500 }]
  },
  {
    id: 'warp',
    symbol: 'WARP',
    name: 'Warp',
    price: 15.07, // Fallback price: ~$0.4368 USD converted to THB (34.5 rate) - Will be updated with real price
    change24h: 0.0,
    balance: 0,
    balanceUsd: 0,
    color: '#8B5CF6',
    about: 'Warp (WARP) is a token on BNB Chain. Price is fetched in real-time from DEXScreener API.',
    chartData: [{ value: 15.0 }, { value: 15.05 }, { value: 15.1 }, { value: 15.07 }, { value: 15.08 }, { value: 15.06 }, { value: 15.07 }]
  }
];

export const BANNERS: BannerData[] = [
  {
    id: 1,
    title: 'Refer & Earn',
    subtitle: 'ชวนเพื่อนรับ Bitcoin ฟรี',
    imageUrl: 'https://picsum.photos/400/200?random=1',
    content: 'ชวนเพื่อนมาใช้งาน JDH Wallet วันนี้ รับค่าธรรมเนียมฟรี 10 ครั้ง และลุ้นรับ Bitcoin มูลค่ารวมกว่า 1 ล้านบาท'
  },
  {
    id: 2,
    title: 'Staking Rewards',
    subtitle: 'รับดอกเบี้ยสูงสุด 12% ต่อปี',
    imageUrl: 'https://picsum.photos/400/200?random=2',
    content: 'ฝากเหรียญ USDT, USDC หรือ ETH รับผลตอบแทนแบบ Passive Income สูงสุด 12% ต่อปี จ่ายดอกเบี้ยทุกวัน'
  },
  {
    id: 3,
    title: 'New Listing',
    subtitle: 'เหรียญใหม่มาแรงสัปดาห์นี้',
    imageUrl: 'https://picsum.photos/400/200?random=3',
    content: 'พบกับเหรียญ Meme ใหม่ล่าสุด PEPE, BONK และ FLOKI พร้อมให้เทรดแล้ววันนี้ที่ JDH Wallet'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'receive', coinSymbol: 'BTC', amount: 0.005, amountTHB: 11750, date: 'วันนี้, 10:30', status: 'completed' },
  { id: '2', type: 'send', coinSymbol: 'ETH', amount: 0.5, amountTHB: 42500, date: 'เมื่อวาน, 14:20', status: 'completed' },
  { id: '3', type: 'swap', coinSymbol: 'USDT', amount: 100, amountTHB: 3450, date: '2 ม.ค., 09:15', status: 'completed' },
  { id: '4', type: 'buy', coinSymbol: 'USDT', amount: 500, amountTHB: 17250, date: '1 ม.ค., 18:30', status: 'completed' },
  { id: '5', type: 'send', coinSymbol: 'BNB', amount: 1.2, amountTHB: 21600, date: '28 ธ.ค., 11:45', status: 'failed' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'เงินเข้าสำเร็จ', message: 'คุณได้รับ 0.005 BTC จาก External Wallet', time: '10:30', type: 'success', read: false },
  { id: 2, title: 'แจ้งเตือนราคา', message: 'ETH ราคาลงต่ำกว่า 80,000 บาท แตะเพื่อดูรายละเอียด', time: 'เมื่อวาน', type: 'info', read: true },
  { id: 3, title: 'ระบบความปลอดภัย', message: 'มีการเข้าสู่ระบบจากอุปกรณ์ใหม่ (iPhone 15 Pro)', time: '2 วันที่แล้ว', type: 'alert', read: true },
];

export const FAQS: FAQ[] = [
  { id: '1', question: 'วิธีการยืนยันตัวตน (KYC)?', answer: 'ไปที่เมนูตั้งค่า > บัญชี > ยืนยันตัวตน และทำตามขั้นตอนโดยใช้บัตรประชาชน' },
  { id: '2', question: 'ค่าธรรมเนียมการโอนเท่าไหร่?', answer: 'ค่าธรรมเนียมขึ้นอยู่กับเครือข่ายของเหรียญนั้นๆ (Gas Fee) โดย JDH ไม่คิดค่าธรรมเนียมเพิ่มเติม' },
  { id: '3', question: 'ลืมรหัสผ่านทำอย่างไร?', answer: 'กดที่ปุ่ม "ลืมรหัสผ่าน" ในหน้าเข้าสู่ระบบ ระบบจะส่งลิงก์รีเซ็ตไปที่อีเมลของคุณ' },
  { id: '4', question: 'วิธีสำรองข้อมูลกระเป๋า (Backup)?', answer: 'จดบันทึก Seed Phrase 12 คำ และเก็บไว้ในที่ปลอดภัย ห้ามถ่ายรูปหรือเก็บออนไลน์' },
];