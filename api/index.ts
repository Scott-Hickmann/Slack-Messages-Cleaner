import { createEventAdapter } from '@slack/events-api';
import { WebClient } from '@slack/web-api';
import express from 'express';
import fs from 'fs/promises';

const SLACK_TOKEN = process.env.SLACK_TOKEN;
if (!SLACK_TOKEN) {
  throw new Error('No SLACK_TOKEN provided');
}
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
if (!SLACK_SIGNING_SECRET) {
  throw new Error('No SLACK_SIGNING_SECRET provided');
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
if (!PORT || isNaN(PORT)) {
  throw new Error('No PORT provided');
}

const slackWeb = new WebClient(SLACK_TOKEN);
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);

interface Message {
  type: 'message';
  subtype?: string;
  ts: string;
  user: string;
  text: string;
  channel: string;
  event_ts: string;
  channel_type: string;
}

const MESSAGES_TO_DELETE = new Set([
  'channel_join',
  'channel_name',
  'channel_purpose'
]);

slackEvents.on('message', async (message: Message) => {
  if (message.subtype && MESSAGES_TO_DELETE.has(message.subtype)) {
    const log = `${message.channel}: ${message.text}`;
    console.log(log);
    await fs.appendFile('messages.txt', `${log}\n`);
    const response = await slackWeb.chat.delete({
      channel: message.channel,
      ts: message.ts,
      as_user: true
    });
    if (!response.ok) {
      console.error(response);
    }
  }
});

const app = express();

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.send('Slack messages cleaner is running');
});
app.use('/slack/events', slackEvents.requestListener());

app.listen(PORT, '0.0.0.0');

export default app;
