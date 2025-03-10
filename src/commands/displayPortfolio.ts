import {
    getPortfolio
} from '../services/portfolioService';
import {getCurrencyExchangeRate} from '../services/currencyService';
import {
    formatNumber,
    getColoredFormatedNumber, highlight,
} from '../utils/formatUtils';
import {Logger} from '../utils/logger';
import {Config} from "../config";

function calculatePMT(rate: number, nper: number, pv: number, fv: number): string {
    //PMT(annualGrowthRate/12,noOfYears*12,currentValue,targetValue)
    const pvif = Math.pow(1 + rate, nper);

    if (rate === 0) {
        return formatNumber(-(pv + fv) / nper, 0);
    }

    return formatNumber(rate * (fv + pv * pvif) / ((pvif - 1)), 0);
}

function generateTargets(currentValue: number): number[] {
    const start = Math.ceil(currentValue / Config.getInstance().getConfig().targetValuePace) * Config.getInstance().getConfig().minTargetValue;
    const targets = [];

    for (let target = start; target <= Config.getInstance().getConfig().maxTargetValue; target += Config.getInstance().getConfig().targetValuePace) {
        targets.push(target);
    }

    return targets;
}

async function displayPrediction(currentValue: number, annualGrowthRate: number = 0.07): Promise<void> {
    Logger.debug(`Calculating monthly investment needed ${(annualGrowthRate * 100).toFixed(2)}% annual growth rate`);

    const monthlyRate = annualGrowthRate / 12;
    const minYear = Config.getInstance().getConfig().minTargetYear;
    const maxYears = Config.getInstance().getConfig().maxTargetYear;

    const targets = generateTargets(currentValue);
    const yearsData = [];

    for (let i = minYear; i <= maxYears; i++) {
        const yearData: Record<string, string> = {year: (`${new Date().getFullYear() + i} (${i})`)};
        for (const target of targets) {
            const key = target >= 1000000 ? `${(target / 1000000).toFixed(2)}m` : `${(target / 1000).toFixed(0)}k`;
            const value = calculatePMT(
                monthlyRate,
                i * 12,
                -currentValue,
                target
            );
            yearData[key] = highlight(target === Config.getInstance().getConfig().highlightTargetValue, value);
        }
        yearsData.push(yearData);
    }

    Logger.printTable(yearsData, true, `Monthly Investment Needed - ${((annualGrowthRate * 100).toFixed(2))}% annual growth rate, current value of ${formatNumber(currentValue, 0)}`);
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
        const mainCurrency = Config.getInstance().getConfig().mainCurrency;
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
                'P&L': `${getColoredFormatedNumber(currency.profit)} ${getColoredFormatedNumber(currency.profitPercentage, '%')}`
            })
        }

        Logger.printTable(summaryTableData, true, 'Portfolio value by currency');
        // endregion

        // region Display assets
        const assetsData: Record<string, Record<string, string>[]> = {};
        portfolio.assets.sort((a, b) => b.currentValue - a.currentValue);

        for (const asset of portfolio.assets) {
            if (!assetsData[asset.type]) {
                assetsData[asset.type] = [];
            }

            assetsData[asset.type].push({
                'Symbol': asset.symbol,
                'Name': asset.name,
                'Currency': asset.currency,
                'Value': formatNumber(asset.currentValue),
                'P&L': `${getColoredFormatedNumber(asset.profit)} ${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
                'Current Price': formatNumber(asset.lastPrice),
                'Quantity': formatNumber(asset.quantity, 2),
                'Avg Price': formatNumber(asset.avgCost),
                'MWR': getColoredFormatedNumber(asset.mwr * 100, '%'),
                'TWR': getColoredFormatedNumber(asset.twr * 100, '%'),
                'Updated': asset.lastUpdated,
            });
        }

        for (const type in assetsData) {
            Logger.printTable(assetsData[type], true, `Assets - ${type}`);
        }
        // endregion

    } catch (error) {
        Logger.error('Failed to display portfolio!', error, true);
    }
}


