# Portfolio Tracker CLI

A command-line tool for tracking your investment portfolio built with TypeScript and Node.js.

## Features

- Track positions in stocks, ETFs, crypto, and other assets
- Fetch real-time prices from Yahoo Finance API
- Store historical price data for each asset
- Calculate performance metrics (gain/loss, percentage changes)
- View your portfolio online or offline
- Update historical price data with weekly intervals

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/portfolio-tracker.git
   cd portfolio-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Link the CLI tool globally (optional):
   ```bash
   npm link
   ```

## Usage

### View your portfolio with current prices

```bash
npm start
# or if globally linked
portfolio
```

### View your portfolio offline (no price fetching)

```bash
npm start -- --offline
# or if globally linked
portfolio --offline
```

### Update historical price data

```bash
npm start -- --update
# or if globally linked
portfolio --update
```

## Data Structure

The portfolio tracker stores all data in JSON files:

- `data/portfolio.json`: Contains the main portfolio summary with all assets and their latest values.
- `data/assets/{SYMBOL}.json`: Individual files for each asset containing:
    - Asset information (symbol, name, type, etc.)
    - Transaction history (buys, sells, dividends, etc.)
    - Historical price data

## Adding Assets

Currently, assets must be added manually by creating the appropriate JSON files in the data directory. In future versions, an interactive command will be available to add assets through the CLI.

## Roadmap

- Add interactive commands for portfolio management (add/edit/remove assets)
- Implement transaction recording functionality
- Add data visualization capabilities
- Support for multiple portfolios
- Performance reporting for different time periods
- Export functionality (CSV, PDF)
- Web interface

## License

MIT
