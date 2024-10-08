const activeCommands = new Map<string, Set<string>>();


export function isCommandActive(commandKey: string, userId: string): boolean {
    const activeUsers = activeCommands.get(commandKey);
    return activeUsers ? activeUsers.has(userId) : false;
}

export function addActiveCommand(commandKey: string, userId: string): void {
    if (!activeCommands.has(commandKey)) {
        activeCommands.set(commandKey, new Set());
    }
    activeCommands.get(commandKey)!.add(userId);
}

export function removeActiveCommand(commandKey: string, userId: string): void {
    const activeUsers = activeCommands.get(commandKey);
    if (activeUsers) {
        activeUsers.delete(userId);
        if (activeUsers.size === 0) {
            activeCommands.delete(commandKey);
        }
    }
}

