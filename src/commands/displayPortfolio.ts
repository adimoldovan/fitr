import {
    getPortfolio
} from '../services/portfolioService.js';

import {getCurrencyExchangeRate} from '../services/currencyService.js';

import {
    formatNumber,
    getColoredFormatedNumber,
} from '../utils/formatUtils.js';

import {Logger} from '../utils/logger.js';

function calculatePMT(rate: number, nper: number, pv: number, fv: number): string {
    //PMT(annualGrowthRate/12,noOfYears*12,currentValue,targetValue)
    const pvif = Math.pow(1 + rate, nper);

    if (rate === 0) {
        return formatNumber(-(pv + fv) / nper, 0);
    }

    return formatNumber(rate * (fv + pv * pvif) / ((pvif - 1)), 0);
}

function generateTargets(currentValue: number): number[] {
    const start = Math.ceil(currentValue / 100000) * 100000;
    const targets = [];

    for (let target = start; target <= 2000000; target += 100000) {
        targets.push(target);
    }

    return targets;
}

async function displayPrediction(currentValue: number, annualGrowthRate: number = 0.07): Promise<void> {
    Logger.debug(`Calculating monthly investment needed ${(annualGrowthRate * 100).toFixed(2)}% annual growth rate`);
    const monthlyRate = annualGrowthRate / 12;
    const years = 20;

    const targets = generateTargets(currentValue);
    const yearsData = [];

    for (let i = 1; i <= years; i++) {
        const yearData: Record<string, string> = {year: i.toString()};

        for (const target of targets) {
            const key = target >= 1000000 ? `${(target / 1000000).toFixed(1)}m` : `${target / 1000}k`;
            yearData[key] = calculatePMT(
                monthlyRate,
                i * 12,
                -currentValue,
                target
            );
        }
        yearsData.push(yearData);
    }

    Logger.printTable(yearsData, true, `Yearly Investment Needed assuming ${((annualGrowthRate * 100).toFixed(2))}% annual growth rate`);
}

/**
 * Display the current portfolio with latest prices
 */
export async function displayPortfolio(convert: boolean, annualGrowthRate: string): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first.');
            return;
        }

        if (convert) {
            let eurValue: number = 0;
            const valueInCurrenciesDataTable = [];

            for (const curr of (portfolio.currencies || [])) {
                Logger.debug(`Calculating total portfolio in ${curr.currency}`);
                let valueInCurrency: number = 0;
                for (const c of (portfolio.currencies || [])) {
                    if (c.currency.toUpperCase() === curr.currency.toUpperCase()) {
                        valueInCurrency += c.value;
                    } else {
                        const exchangeRate = await getCurrencyExchangeRate(c.currency, curr.currency);
                        valueInCurrency += c.value * exchangeRate;
                    }
                }

                if (curr.currency.toUpperCase() === 'EUR') {
                    eurValue = valueInCurrency;
                }

                valueInCurrenciesDataTable.push({
                    'TOTAL': `${curr.currency.toUpperCase()}\t${formatNumber(valueInCurrency)}`
                });
            }

            Logger.printTable(valueInCurrenciesDataTable, false, 'Total portfolio value');

            await displayPrediction(eurValue, parseFloat(annualGrowthRate));
        }

        const summaryTableData = []

        for (const currency of (portfolio.currencies || [])) {
            summaryTableData.push({
                'Currency': currency.currency,
                'Value': formatNumber(currency.value),
                'Cost': formatNumber(currency.cost),
                'P&L': `${getColoredFormatedNumber(currency.profit)}\t${getColoredFormatedNumber(currency.profitPercentage, '%')}`
            })
        }

        Logger.printTable(summaryTableData, true, 'Portfolio value by currency');

        const tableData = [];

        for (const asset of portfolio.assets) {
            tableData.push({
                'Symbol': asset.symbol,
                'Name': asset.name,
                'ISIN': asset.isin,
                'Value': formatNumber(asset.currentValue),
                'Quantity': formatNumber(asset.quantity, 4),
                'Avg Cost': formatNumber(asset.avgCost),
                'Current Price': formatNumber(asset.lastPrice),
                'Currency': asset.currency,
                'Updated': asset.lastUpdated,
                'P&L': `${getColoredFormatedNumber(asset.profit)}\t${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
            });
        }

        Logger.printTable(tableData, true, 'Assets');

    } catch (error) {
        Logger.error('', error);
        throw new Error(`Failed to display portfolio!`);
    }
}


