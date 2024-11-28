
const THIRTY_DAYS_IN_MS = 30n * 24n * 60n * 60n * 1000n;

export function calculateTimestampForMonthsAgo(months: number): bigint {
    if (months < 1) {
        throw new Error("The period in months must be at least 1.");
    }

    const now = BigInt(Date.now());
    const periodInMilliseconds = BigInt(months) * THIRTY_DAYS_IN_MS;
    return now - periodInMilliseconds;
}
