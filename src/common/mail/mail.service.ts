import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendUserConfirmation(user: any, token: string) {
        const url = `http://localhost:3004/auth/activate?token=${token}`;

        await this.mailerService.sendMail({
            to: user.email,
            from: '"Support Team" <support@example.com>', // override default from
            subject: 'Welcome to FinTrack! Confirm your Email',
            // template: './confirmation', // `.hbs` extension is appended automatically
            // context: { // ✏️ filling curly brackets with content
            //   name: user.full_name,
            //   url,
            // },
            html: `
        <h1>Welcome ${user.full_name}</h1>
        <p>Please click below to confirm your email</p>
        <p>
            <a href="${url}">Aktivasi Akun</a>
        </p>
      `,
        });
    }
}
