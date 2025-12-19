import { Coin, BannerData, Transaction, Notification, FAQ } from './types';

// Market coins - prices will be fetched from real APIs (CoinGecko, Jupiter, DEXScreener)
// Initial prices are placeholders and will be replaced with real-time data
export const MOCK_COINS: Coin[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0, // No mock balance - only show real wallet balances
    balanceUsd: 0,
    color: '#F7931A',
    about: 'Bitcoin is the first successful internet money based on peer-to-peer technology.',
    chartData: [{ value: 2300000 }, { value: 2320000 }, { value: 2310000 }, { value: 2340000 }, { value: 2350000 }, { value: 2380000 }, { value: 2350000 }],
    logoURI: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0, // No mock balance - only show real wallet balances
    balanceUsd: 0,
    color: '#627EEA',
    about: 'Ethereum is a decentralized platform that runs smart contracts.',
    chartData: [{ value: 87000 }, { value: 86000 }, { value: 86500 }, { value: 85500 }, { value: 85000 }, { value: 84500 }, { value: 85000 }],
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0, // No mock balance - only show real wallet balances
    balanceUsd: 0,
    color: '#26A17B',
    about: 'Tether is a stablecoin pegged to the US Dollar.',
    chartData: [{ value: 34.4 }, { value: 34.5 }, { value: 34.5 }, { value: 34.49 }, { value: 34.5 }, { value: 34.51 }, { value: 34.5 }],
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0, // No mock balance - only show real wallet balances
    balanceUsd: 0,
    color: '#F3BA2F',
    about: 'BNB is the cryptocurrency coin that powers the Binance ecosystem.',
    chartData: [{ value: 17000 }, { value: 17200 }, { value: 17500 }, { value: 17800 }, { value: 18000 }, { value: 18200 }, { value: 18000 }],
    logoURI: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 0, // Will be updated with real price from Jupiter API
    change24h: 0, // Will be updated with real price change
    balance: 0, // No mock balance - only show real wallet balances
    balanceUsd: 0,
    color: '#14F195',
    about: 'Solana is a high-performance blockchain supporting builders around the world.',
    chartData: [{ value: 3100 }, { value: 3200 }, { value: 3350 }, { value: 3400 }, { value: 3500 }, { value: 3600 }, { value: 3500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
  },
  {
    id: 'warp',
    symbol: 'WARP',
    name: 'Warp',
    price: 0, // Will be updated with real price from DEXScreener API
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#8B5CF6',
    about: 'Warp (WARP) is a token on BNB Chain. Price is fetched in real-time from DEXScreener API.',
    chartData: [{ value: 15.0 }, { value: 15.05 }, { value: 15.1 }, { value: 15.07 }, { value: 15.08 }, { value: 15.06 }, { value: 15.07 }]
  },
  {
    id: 'jdh',
    symbol: 'JDH',
    name: 'JDH Token',
    price: 0, // Will be updated with real price from DEXScreener/Jupiter API
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#14F195',
    about: 'JDH Token (JDH) is a token on Solana blockchain. Price is fetched in real-time from Jupiter Price API.',
    chartData: [{ value: 1.75 }, { value: 1.72 }, { value: 1.70 }, { value: 1.68 }, { value: 1.69 }, { value: 1.67 }, { value: 1.68 }],
    logoURI: 'https://img2.pic.in.th/pic/IMG_13847b26fb6a73c061f7.th.jpeg', // User provided logo
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#2775CA',
    about: 'USD Coin (USDC) is a fully collateralized US dollar stablecoin.',
    chartData: [{ value: 34.4 }, { value: 34.5 }, { value: 34.5 }, { value: 34.49 }, { value: 34.5 }, { value: 34.51 }, { value: 34.5 }],
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#23292F',
    about: 'XRP is a digital asset built for payments.',
    chartData: [{ value: 1950 }, { value: 1980 }, { value: 1990 }, { value: 2000 }, { value: 2010 }, { value: 1995 }, { value: 2000 }],
    logoURI: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#0033AD',
    about: 'Cardano is a blockchain platform for changemakers, innovators, and visionaries.',
    chartData: [{ value: 2550 }, { value: 2530 }, { value: 2520 }, { value: 2500 }, { value: 2490 }, { value: 2510 }, { value: 2500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/975/small/cardano.png'
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#C2A633',
    about: 'Dogecoin is an open source peer-to-peer digital currency.',
    chartData: [{ value: 11.8 }, { value: 12.0 }, { value: 12.2 }, { value: 12.5 }, { value: 12.6 }, { value: 12.4 }, { value: 12.5 }],
    logoURI: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png'
  },
  {
    id: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#8247E5',
    about: 'Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.',
    chartData: [{ value: 820 }, { value: 830 }, { value: 840 }, { value: 850 }, { value: 860 }, { value: 855 }, { value: 850 }],
    logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#E84142',
    about: 'Avalanche is the fastest smart contracts platform in the blockchain industry.',
    chartData: [{ value: 3550 }, { value: 3520 }, { value: 3510 }, { value: 3500 }, { value: 3490 }, { value: 3505 }, { value: 3500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/12559/small/avalanche-avax-logo.png'
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#E6007A',
    about: 'Polkadot enables different blockchains to transfer messages and value in a trust-free fashion.',
    chartData: [{ value: 4400 }, { value: 4450 }, { value: 4480 }, { value: 4500 }, { value: 4520 }, { value: 4510 }, { value: 4500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png'
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#375BD2',
    about: 'Chainlink is a decentralized oracle network that enables smart contracts to securely access off-chain data.',
    chartData: [{ value: 12100 }, { value: 12050 }, { value: 12020 }, { value: 12000 }, { value: 11980 }, { value: 12010 }, { value: 12000 }],
    logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#FF007A',
    about: 'Uniswap is a decentralized protocol for automated liquidity provision on Ethereum.',
    chartData: [{ value: 8350 }, { value: 8400 }, { value: 8450 }, { value: 8500 }, { value: 8550 }, { value: 8520 }, { value: 8500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
  },
  {
    id: 'litecoin',
    symbol: 'LTC',
    name: 'Litecoin',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#345D9D',
    about: 'Litecoin is a peer-to-peer Internet currency that enables instant payments.',
    chartData: [{ value: 12450 }, { value: 12480 }, { value: 12490 }, { value: 12500 }, { value: 12510 }, { value: 12505 }, { value: 12500 }],
    logoURI: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png'
  },
  {
    id: 'shiba-inu',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#FFA409',
    about: 'Shiba Inu is a decentralized meme token that has evolved into a vibrant ecosystem.',
    chartData: [{ value: 0.0014 }, { value: 0.00145 }, { value: 0.00148 }, { value: 0.0015 }, { value: 0.00152 }, { value: 0.00151 }, { value: 0.0015 }],
    logoURI: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png'
  },
  {
    id: 'tron',
    symbol: 'TRX',
    name: 'TRON',
    price: 0, // Will be updated with real price from CoinGecko
    change24h: 0, // Will be updated with real price change
    balance: 0,
    balanceUsd: 0,
    color: '#EB0029',
    about: 'TRON is a decentralized blockchain platform that aims to build a free, global digital content entertainment system.',
    chartData: [{ value: 455 }, { value: 452 }, { value: 451 }, { value: 450 }, { value: 449 }, { value: 450.5 }, { value: 450 }],
    logoURI: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png'
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