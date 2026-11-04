import { HomePageService } from 'rp-travel-ui';

export function toSelectedCurrency(
  home: HomePageService,
  amount: number,
  source?: string | null,
): number {
  const selected = home.selectedCurrency;
  const value = Number(amount);
  if (!Number.isFinite(value) || !value) return 0;

  const sourceCode = String(source || '').trim().toUpperCase();
  if (!sourceCode || !selected?.Currency_Code || sourceCode === selected.Currency_Code) {
    return value;
  }

  const sourceRate = Number(
    home.allCurrency?.find((currency) => currency.Currency_Code === sourceCode)?.rate,
  );
  const targetRate = Number(selected.rate);
  if (!sourceRate || !targetRate) return value;

  const converted = (value / sourceRate) * targetRate;
  const factor = targetRate === 1 ? 1000 : 100;
  return parseFloat((Math.round(converted * factor) / factor).toFixed(targetRate === 1 ? 3 : 2));
}
