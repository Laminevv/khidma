const fs = require('fs');

const arPath = './i18n/ar.json';
const enPath = './i18n/en.json';
const frPath = './i18n/fr.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const arMessages = {
  timeAgo: {
    now: 'الآن',
    mins: 'د',
    hours: 'س',
    days: 'ي'
  },
  notification: {
    title: 'رسالة جديدة 💬',
    body: 'لديك رسالة جديدة بانتظارك.'
  },
  attachment: '📎 مرفق',
  conversations: 'المحادثات',
  noActiveConversations: 'لا توجد محادثات نشطة',
  startConversation: 'ابدأ المحادثة...',
  inbox: 'صندوق المحادثات',
  inboxDesc: 'اختر محادثة من القائمة الجانبية أو ابدأ التواصل مع المستقلين والعملاء لتنسيق مشاريعك.',
  startConversationGreeting: 'ابدأ المحادثة 👋',
  typeMessage: 'اكتب رسالة هنا...'
};

const enMessages = {
  timeAgo: {
    now: 'Just now',
    mins: 'm',
    hours: 'h',
    days: 'd'
  },
  notification: {
    title: 'New Message 💬',
    body: 'You have a new message waiting.'
  },
  attachment: '📎 Attachment',
  conversations: 'Conversations',
  noActiveConversations: 'No active conversations',
  startConversation: 'Start a conversation...',
  inbox: 'Inbox',
  inboxDesc: 'Select a conversation from the sidebar or start communicating with freelancers and clients to coordinate your projects.',
  startConversationGreeting: 'Start the conversation 👋',
  typeMessage: 'Type a message here...'
};

const frMessages = {
  timeAgo: {
    now: "À l'instant",
    mins: 'm',
    hours: 'h',
    days: 'j'
  },
  notification: {
    title: 'Nouveau message 💬',
    body: 'Vous avez un nouveau message en attente.'
  },
  attachment: '📎 Pièce jointe',
  conversations: 'Conversations',
  noActiveConversations: 'Aucune conversation active',
  startConversation: 'Démarrer une conversation...',
  inbox: 'Boîte de réception',
  inboxDesc: 'Sélectionnez une conversation dans la barre latérale ou commencez à communiquer avec les freelances et les clients pour coordonner vos projets.',
  startConversationGreeting: 'Démarrez la conversation 👋',
  typeMessage: 'Tapez un message ici...'
};

ar.messages = arMessages;
en.messages = enMessages;
fr.messages = frMessages;

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n');

console.log("Messages translations added successfully.");
