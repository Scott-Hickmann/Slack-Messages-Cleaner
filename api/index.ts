import { createEventAdapter } from '@slack/events-api';
import { WebClient } from '@slack/web-api';
import express from 'express';

const SLACK_USER_TOKEN = process.env.SLACK_USER_TOKEN;
if (!SLACK_USER_TOKEN) {
  throw new Error('No SLACK_USER_TOKEN provided');
}
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
if (!SLACK_BOT_TOKEN) {
  throw new Error('No SLACK_BOT_TOKEN provided');
}
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
if (!SLACK_SIGNING_SECRET) {
  throw new Error('No SLACK_SIGNING_SECRET provided');
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
if (!PORT || isNaN(PORT)) {
  throw new Error('No PORT provided');
}
if (!process.env.SYSTEM_CHANNEL_ID) {
  throw new Error('No SYSTEM_CHANNEL_ID provided');
}
const SYSTEM_CHANNEL_ID = process.env.SYSTEM_CHANNEL_ID;

const slackWebUser = new WebClient(SLACK_USER_TOKEN);
const slackWebBot = new WebClient(SLACK_BOT_TOKEN);
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET, {
  waitForResponse: true
});

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
    const log = `<#${message.channel}>: <@${message.user}> ${message.text}`;
    console.log(log);
    const response = await slackWebUser.chat.delete({
      channel: message.channel,
      ts: message.ts,
      as_user: true
    });
    if (!response.ok) {
      console.error(response);
    }
    const response2 = await slackWebBot.chat.postMessage({
      channel: SYSTEM_CHANNEL_ID,
      text: log
    });
    if (!response2.ok) {
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
