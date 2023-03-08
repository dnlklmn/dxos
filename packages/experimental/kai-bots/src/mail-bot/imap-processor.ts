//
// Copyright 2023 DXOS.org
//

import sub from 'date-fns/sub';
import { convert } from 'html-to-text';
import { Config as ImapConfig } from 'imap';
import imaps, { Message as ImapMessage } from 'imap-simple';
import { simpleParser, EmailAddress } from 'mailparser';

import { Message } from '@dxos/kai-types';
import { log } from '@dxos/log';

const toArray = (value: any) => (Array.isArray(value) ? value : [value]);

// Protonmail bridge (local IMAP server) as alternative to Gmail, which requires a registered Google workspace.
// https://proton.me/blog/bridge-security-model
// NOTE: Configure bridge settings: SSL; download the cert.

// TODO(burdon): Object with spam and blacklist arrays.
const blacklist = [/noreply/, /no-reply/, /notifications/, /billing/, /support/];

export class ImapProcessor {
  constructor(private readonly _config: ImapConfig) {}

  /**
   * Make IMAP request.
   */
  async requestMessages({ days }: { days: number } = { days: 28 }): Promise<Message[]> {
    // https://www.npmjs.com/package/imap-simple
    log.info('connecting...', { config: this._config });
    const connection = await imaps.connect({ imap: this._config! });
    await connection.openBox('INBOX');
    log.info('connected');

    // https://github.com/mscdex/node-imap
    const messages = await connection.search(['ALL', ['SINCE', sub(Date.now(), { days })]], {
      bodies: [''],
      markSeen: false
    });

    log.info('received', { messages: messages.length });

    log.info('disconnecting...');
    await connection.end();
    log.info('disconnected');

    return this.parseMessages(messages);
  }

  /**
   * Parse raw IMAP messages.
   */
  private async parseMessages(rawMessages: ImapMessage[]): Promise<Message[]> {
    const messages = await Promise.all(
      rawMessages.map(async (raw): Promise<Message | undefined> => {
        // https://nodemailer.com/extras/mailparser
        const input: string = raw.parts[0].body;
        const { messageId, date, from, to, subject, text, textAsHtml } = await simpleParser(input);
        if (!messageId || !date || !from || !to || !subject) {
          return;
        }

        const convertToContact = ({ address: email, name }: EmailAddress): Message.Contact =>
          new Message.Contact({ email, name: name?.length ? name : undefined });

        const message = new Message({
          source: {
            guid: messageId
          },
          date: date.toISOString(),
          from: convertToContact(from.value[0]),
          to: toArray(to).map((to) => convertToContact(to.value[0])),
          subject
        });

        // Skip bulk mail.
        if (!message.from?.email || blacklist.some((regex) => regex.test(message.from!.email!))) {
          return;
        }

        // TODO(burdon): Custom parsing (e.g., remove links, images).
        // https://www.npmjs.com/package/html-to-text
        let body = text ?? '';
        if (textAsHtml) {
          let str = convert(textAsHtml, {
            selectors: [
              { selector: 'a', format: 'skip' },
              { selector: 'img', format: 'skip' }
            ]
          });

          // TODO(burdon): Heuristics.
          {
            // TODO(burdon): Remove brackets around removed links/images.
            str = str.replace(/\[\]/g, '');

            // Remove multiple newlines.
            str = str.replace(/\n+/g, '\n');
          }
          {
            // Spam.
            const idx = str.indexOf('unsubscribe');
            if (idx !== -1) {
              return undefined;
            }
          }
          {
            const idx = str.indexOf('---------- Forwarded message ---------');
            if (idx !== -1) {
              str = str.slice(0, idx);
            }
          }

          body = str;
        }

        message.body = body;
        return message;
      })
    );

    const filteredMessages: Message[] = messages.filter(Boolean) as Message[];
    return filteredMessages;
  }
}
