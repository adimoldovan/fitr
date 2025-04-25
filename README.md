# Investment Portfolio Tracker

A command-line tool for tracking your investment portfolio built with TypeScript and Node.js.

## Requirements

- Node.js 18 or higher
- npm 8 or higher

## Features

- Track positions in stocks, ETFs, crypto, and other assets
- Fetch real-time prices from Yahoo Finance API
- Store historical price data for each asset
- Calculate performance metrics (gain/loss, percentage changes)
- View your portfolio online or offline

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g fitr
```

### Option 2: Local Development Setup

```bash
git clone https://github.com/adimoldovan/fitr.git
cd fitr
npm install
npm run build
npm link
```

## Usage

Run `fitr` to start the program. The following commands are available:

### Quick Start

Here's a simple workflow to get started:

1. Install the tool: `npm install -g fitr`
2. Add your first transaction: `fitr transaction add`
3. View your portfolio: `fitr`
4. Sync latest prices: `fitr -s`

### Main Commands

- `fitr`: Display your portfolio summary
  - `-s, --sync`: Fetch and update historical price data for all assets and calculate portfolio performance
  - `-g, --growth-rate <rate>`: Set the expected annual growth rate for portfolio predictions (default: 0.07)
  - `-p, --skip-prediction`: Hide the prediction table
  - `-v, --verbose`: Enable verbose logging mode
  - `-D, --dev-data`: Use development data directory
  - `--help, -h`: Display help information

### Transaction Management

- `fitr transaction add`: Add a new transaction
  - `--help, -h`: Display help information

- `fitr transaction list`: List transactions
  - `-s, --symbol <symbol>`: Filter transactions by asset symbol
  - `--help, -h`: Display help information

## Data Structure

The portfolio tracker stores all data in JSON files in your home directory or iCloud Drive for MacOS:

- `config.json`: Configuration file
- `portfolio.json`: Contains the main portfolio summary with all assets and their latest values
- `prices/{SYMBOL}.json`: Historical prices for each asset
- `transactions/{SYMBOL}.json`: Transactions data for each asset
- `currency.json`: Currency exchange rates cache

When using the `-D, --dev-data` flag, data is stored in the `data/` directory of your current working directory instead.

## Uninstall

```bash
npm uninstall -g fitr
```