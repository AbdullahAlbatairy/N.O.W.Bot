interface ChannelMessageTracker {
    channelId: string;
    fromMessageId: string | null;
    toMessageId: string | null;
    isFinished: boolean;
}