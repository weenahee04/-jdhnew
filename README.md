<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JDH Crypto Wallet

A modern, beautiful cryptocurrency wallet application built with React, TypeScript, and Vite. Features AI-powered market insights, seamless trading experience, and a user-friendly interface designed for Thai users.

## Features

- 💰 **Portfolio Management** - Track and manage your crypto assets
- 📊 **Market Overview** - Real-time cryptocurrency prices and trends
- 🤖 **AI Market Insights** - Powered by Google Gemini AI
- 🔄 **Swap & Trade** - Easy cryptocurrency swapping
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Beautiful emerald-themed interface
- 🔐 **Wallet Security** - Secure wallet creation and import
- 📈 **Transaction History** - Complete transaction tracking
- 🎁 **Rewards System** - Earn points and rewards
- 🪙 **Solana-first** - Real SOL transfer (mainnet/devnet), Jupiter swap-ready

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Google Generative AI** - AI market insights
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "jjdh a"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # AI (optional)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Solana
   # Helius RPC is recommended (mainnet), or use your QuickNode
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_key_here
   SOLANA_CLUSTER=mainnet-beta

   # Jupiter Swap API
   JUPITER_BASE_URL=https://quote-api.jup.ag
   ```
   
   To get a Gemini API key:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy and paste it into `.env.local`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
├── components/          # React components
│   ├── ActionModals.tsx      # Send/Receive/Swap modals
│   ├── AssetList.tsx         # Asset list component
│   ├── BottomNav.tsx         # Mobile navigation
│   ├── CoinDetail.tsx         # Coin detail view
│   ├── Onboarding.tsx        # Onboarding flow
│   ├── QuickActions.tsx      # Quick action buttons
│   ├── SecondaryViews.tsx    # Modals and overlays
│   ├── Sidebar.tsx           # Desktop sidebar
│   └── WalletSetup.tsx       # Wallet creation/import
├── services/           # API services
│   └── geminiService.ts      # Gemini AI integration
├── constants.ts        # Mock data and constants
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main application component
└── index.tsx          # Application entry point
```

## Features in Detail

### Portfolio View
- View total portfolio value
- Asset distribution visualization
- Individual asset management

### Market View
- Real-time price tracking
- Market filters (Top Gainers, Losers, etc.)
- AI-powered market insights

### Wallet Management
- Create new wallet with seed phrase
- Import existing wallet
- Secure backup and verification

### Transactions
- Complete transaction history
- Transaction details modal
- Filter by type and status

## Notes

- This is a demo application with mock data
- For production use, implement proper backend API integration
- Wallet functionality is simulated for demonstration purposes
- Always use secure practices for handling real cryptocurrency wallets

## License

This project is for demonstration purposes.

## Support

For issues or questions, please refer to the Help Center within the application or contact support.
