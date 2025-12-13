import React from 'react';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  balance: number;
  balanceUsd: number;
  color: string;
  chartData: { value: number }[];
  about?: string; // Description for Coin Detail
  logoURI?: string; // Token logo URL
}

export enum NavTab {
  HOME = 'home',
  MARKET = 'market',
  SWAP = 'swap',
  WALLET = 'wallet',
  HISTORY = 'history',
  REWARDS = 'rewards',
  STAKING = 'staking',
  AIRDROP = 'airdrop',
  MINING = 'mining',
  SETTINGS = 'settings',
  HELP = 'help'
}

export type AppView = 
  | 'LANDING' 
  | 'ONBOARDING' 
  | 'AUTH_LOGIN' 
  | 'AUTH_REGISTER' 
  | 'WALLET_CREATE' 
  | 'WALLET_IMPORT' 
  | 'APP';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface BannerData {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  date?: string;
  content?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'buy';
  coinSymbol: string;
  amount: number;
  amountTHB: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}