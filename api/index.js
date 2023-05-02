"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_api_1 = require("@slack/events-api");
const web_api_1 = require("@slack/web-api");
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("fs/promises"));
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
const slackWeb = new web_api_1.WebClient(SLACK_TOKEN);
const slackEvents = (0, events_api_1.createEventAdapter)(SLACK_SIGNING_SECRET);
const MESSAGES_TO_DELETE = new Set([
    'channel_join',
    'channel_name',
    'channel_purpose'
]);
slackEvents.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.subtype && MESSAGES_TO_DELETE.has(message.subtype)) {
        const log = `${message.channel}: ${message.text}`;
        console.log(log);
        yield promises_1.default.appendFile('messages.txt', `${log}\n`);
        const response = yield slackWeb.chat.delete({
            channel: message.channel,
            ts: message.ts,
            as_user: true
        });
        if (!response.ok) {
            console.error(response);
        }
    }
}));
const app = (0, express_1.default)();
app.use(express_1.default.static('public'));
app.get('/', (req, res) => {
    res.send('Slack messages cleaner is running');
});
app.use('/slack/events', slackEvents.requestListener());
app.listen(PORT, '0.0.0.0');
exports.default = app;
//# sourceMappingURL=index.js.map