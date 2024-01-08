import nodemailer from 'nodemailer';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM, EMAIL_SERVICE } = process.env;

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});
class Mail {
  static send(email, subject, template,   params = {}, attachments=null) {
    const ejs = fs.readFileSync(path.join(path.resolve(), '/src/views/', `${template}.ejs`), 'utf-8');
    const html = _.template(ejs)(params);
    return transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
      attachments
    });
  }
}
export default Mail;