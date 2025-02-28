# Investment Portfolio Tracker

A command-line tool for tracking your investment portfolio built with TypeScript and Node.js.

## Features

- Track positions in stocks, ETFs, crypto, and other assets
- Fetch real-time prices from Yahoo Finance API
- Store historical price data for each asset
- Calculate performance metrics (gain/loss, percentage changes)
- View your portfolio online or offline

## Installation

```bash
   npm install
   npm run build
   npm link
```

## Usage

Run ```fit``` to run the program.

### Options

- `--update`: Fetch the historical prices for all assets, calculates the latest values, and updates the portfolio summary.
- `--dev-data`: Load the sample data for testing purposes.
- `--debug`: Logs debug information to the console.
- `--currency`: Displays the total value of the portfolio in the specified currency (e.g., USD, EUR). Can specify multiple currencies, comma separated (e.g., `--currency USD,EUR`). The currency conversion rates are fetched from `exchangerate-api.com` and require the API key to be set as `EXCHANGE_RATE_API_KEY` the environment variable.
- `--help -h`: Display the help message.

## Data Structure

The portfolio tracker stores all data in JSON files:

- `data/portfolio.json`: Contains the main portfolio summary with all assets and their latest values.
- `data/prices/{SYMBOL}.json`: Historical prices for each asset containing.
- `data/transactions/{SYMBOL}.json`: Transactions dta for each asset.

## Uninstall

```bash
   npm unlink -g fi-tracker
```
