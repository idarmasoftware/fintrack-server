import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL;

  async send(text: string): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL not set. Slack notification skipped.');
      return;
    }

    try {
      await axios.post(this.webhookUrl, {
        text,
      });
    } catch (error) {
      this.logger.error('Failed to send message to Slack', error);
    }
  }
}
