import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendUserConfirmation(user: any, token: string) {
        // NOTE: This must point to the BACKEND server because the backend handles the activation logic and redirects to the frontend.
        // Assuming Backend runs on port 5000 by default (as seen in main.ts).
        const domain = process.env.BACKEND_URL || 'http://localhost:3004';
        const url = `${domain}/auth/activate?token=${token}`;

        await this.mailerService.sendMail({
            to: user.email,
            from: '"Fintrack Support" <support@fintrack.id>',
            subject: 'Welcome to FinTrack! Confirm your Email',
            html: `
        <h1>Welcome ${user.full_name}</h1>
        <p>Please click below to confirm your email</p>
        <p>
            <a href="${url}">Aktivasi Akun</a>
        </p>
      `,
        });
    }

    async sendEmailChangeConfirmation(user: any, token: string) {
        const url = `http://localhost:3004/user/verify-email-change?token=${token}`;

        await this.mailerService.sendMail({
            to: user.new_email,
            from: '"Fintrack Support" <support@fintrack.id>',
            subject: 'FinTrack - Konfirmasi Perubahan Email',
            html: `
        <h1>Halo ${user.full_name}</h1>
        <p>Anda meminta untuk mengubah email akun Anda menjadi ${user.new_email}.</p>
        <p>Silakan klik tautan di bawah ini untuk mengonfirmasi perubahan ini:</p>
        <p>
            <a href="${url}">Verifikasi Perubahan Email</a>
        </p>
        <p>Jika Anda tidak meminta ini, abaikan email ini.</p>
      `,
        });
    }
}
