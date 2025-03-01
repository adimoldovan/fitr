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

    Logger.printTable(yearsData, true, `Yearly Investment Needed - ${((annualGrowthRate * 100).toFixed(2))}% annual growth rate, current value of ${formatNumber(currentValue, 0)}`);
}

/**
 * Display the current portfolio with latest prices
 */
export async function displayPortfolio(annualGrowthRate: string, skipPrediction: boolean): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first.');
            return;
        }

        const currenciesWithoutExchangeRates = [];
        // region Convert the total portfolio value to main currency
        const mainCurrency = 'EUR';
        let valueInMainCurrency: number = 0;
        const valueInCurrenciesDataTable = [];

        for (const c1 of (portfolio.currencies || [])) {
            Logger.debug(`Calculating total portfolio in ${c1.currency}`);
            let valueInCurrency: number = 0;
            for (const c2 of (portfolio.currencies || [])) {
                if (c2.currency.toUpperCase() === c1.currency.toUpperCase()) {
                    valueInCurrency += c2.value;
                } else {
                    const exchangeRate = await getCurrencyExchangeRate(c2.currency, c1.currency);
                    if (exchangeRate === 0) {
                        Logger.debug(`Skip conversion from ${c2.currency} to ${c1.currency}`);
                        currenciesWithoutExchangeRates.push(c1.currency);
                        break;
                    }
                    valueInCurrency += c2.value * exchangeRate;
                }
            }

            if (c1.currency.toUpperCase() === mainCurrency.toUpperCase()) {
                valueInMainCurrency = valueInCurrency;
            }

            if (!currenciesWithoutExchangeRates.includes(c1.currency)) {
                valueInCurrenciesDataTable.push({
                    'TOTAL': `${c1.currency.toUpperCase()}\t${formatNumber(valueInCurrency)}`
                });
            }

        }

        if (valueInCurrenciesDataTable.length > 0) {
            Logger.printTable(valueInCurrenciesDataTable, false, 'Total portfolio value');
        }
        // endregion

        //region Display prediction
        if (!skipPrediction) {
            await displayPrediction(valueInMainCurrency, parseFloat(annualGrowthRate));
        }
        //endregion

        // region Display portfolio summary
        const summaryTableData = []

        for (const currency of (portfolio.currencies || [])) {
            summaryTableData.push({
                'Currency': currency.currency,
                'Value': formatNumber(currency.value, 0),
                'Cost': formatNumber(currency.cost, 0),
                'P&L': `${getColoredFormatedNumber(currency.profit)}\t${getColoredFormatedNumber(currency.profitPercentage, '%')}`
            })
        }

        Logger.printTable(summaryTableData, true, 'Portfolio value by currency');
        // endregion

        // region Display assets
        const tableData = [];

        for (const asset of portfolio.assets) {
            tableData.push({
                'Symbol': asset.symbol,
                'Name': asset.name,
                'Value': formatNumber(asset.currentValue),
                'Currency': asset.currency,
                'Current Price': formatNumber(asset.lastPrice),
                'Quantity': formatNumber(asset.quantity, 4),
                'Avg Cost': formatNumber(asset.avgCost),
                'Updated': asset.lastUpdated,
                'MWR': formatNumber(asset.mwr, 2),
                'P&L': `${getColoredFormatedNumber(asset.profit)}\t${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
            });
        }

        Logger.printTable(tableData, true, 'Assets');
        // endregion

    } catch (error) {
        Logger.error('Failed to display portfolio!', error, true);
    }
}


