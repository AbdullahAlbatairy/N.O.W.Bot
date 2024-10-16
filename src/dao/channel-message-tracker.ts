interface ChannelMessageTracker {
    channel_id: string;
    from_message_id: string | null;
    to_message_id: string | null;
    is_finished: boolean;
}