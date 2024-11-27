
const THIRTY_DAYS = 30n * 24n * 60n * 60n * 1000n; // Approximate milliseconds for one month

export const THIRTY_DAYS_AGO = BigInt(BigInt(Date.now()) - THIRTY_DAYS); // Timestamp for 30 days ago
export const THREE_MONTHS_AGO = BigInt(Date.now()) - 3n * THIRTY_DAYS; // Timestamp for 3 months ago
export const SIX_MONTHS_AGO = BigInt(Date.now()) - 6n * THIRTY_DAYS;   // Timestamp for 6 months ago
export const ONE_YEAR_AGO = BigInt(Date.now()) - 12n * THIRTY_DAYS; 

export enum Period {
    THIRTY_DAYS_AGO = "for the last 30 days",
    THREE_MONTHS_AGO = "for the last 3 months",
    SIX_MONTHS_AGO = "for the last 6 months",
    ONE_YEAR_AGO = "for the last year",
}