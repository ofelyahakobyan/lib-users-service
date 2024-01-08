import fs from 'fs';
import path from 'path';
import grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import hash from '../helpers/hash';
import { Users } from "../models";
import { v4 as uuidv4 } from 'uuid';
import Mail from '../services/mail';

const { JWT_SECRET } = process.env;

export default {
    async getUsersList({ request: req }, res) {
        try {
            const users = await Users.findAll();
            if (!users) {
                res({
                    code: grpc.status.NOT_FOUND,
                }, null);
                return;
            }
            res(null, {
                status: 'success',
                users,
            });
        } catch (e) {
            res({
                code: grpc.status.INTERNAL,
                details: e.message
            });
        }
    },
  // =========== USERS ACTIVITY HANDLERS ============ //
    async userRegistration({ request: req }, res) {
        try {
            const { firstName, lastName, password, email } = req;
            const exists = await Users.findOne({ where: { email } });
            if (exists) {
                res({
                    code: grpc.status.ALREADY_EXISTS,
                    details: 'user already registered',
                }, null);
                return;
            }

            const user = await Users.create({
                firstName,
                lastName,
                email,
                password
            });
            const token = jwt.sign(
                { userId: user.id, isAdmin: user.isAdmin },
                JWT_SECRET,
            );
            res(null, {
                status: 'success',
                message: 'user successfully registered',
                token,
                user,
            });
        } catch (e) {
            res({
                code: grpc.status.INTERNAL,
                details: e.message
            });
        }
    },
    async login({request:req}, res){
      try {
        const { password, email } = req;
        console.log(password, email, 'LOGIN');
        const user = await Users.findOne({
          where: {
            email,
            password: hash(password),
          },
        });
        if (!user) {
          res({
            code: grpc.status.NOT_FOUND,
            details: 'invalid password or username',
          }, null);
          return;
        }
        const token = jwt.sign(
          { userId: user.id, isAdmin: user.isAdmin },
          JWT_SECRET,
        );
        res(null, {
          status: 'success',
          message: 'user successfully logged in',
          token,
          user,
        });
      } catch (e) {
        res({
          code: grpc.status.INTERNAL,
          details: e.message
        });
      }
    },
    async forgotPassword({request:req}, res){
    try {
      const {  email } = req;
      const user = await Users.findOne({where: {email}});
      if (!user) {
        res({
          code: grpc.status.NOT_FOUND,
          details: 'user with this email does not exist',
        }, null);
        return;
      }
      const verificationCode = uuidv4();
      user.verificationCode = verificationCode;
      await user.save();

      console.log(path.join(path.resolve(), '/src/handlers', 'file.txt'), 888);
      const file = path.join(path.resolve(), '/src/handlers', 'file.txt');
      //TODO  Mail sender logic should be here

      const attachments = [
        {   // utf-8 string as an attachment
          filename: 'attach.txt',
          content: 'hello world!'
        },
        {   // stream as an attachment
          filename: 'text4.txt',
          content: fs.createReadStream(file)
        },
      ]

      Mail.send(email, 'Reset Password', 'resetPassword', {
        email,
        firstName: user.firstName || 'user',
        lastName: user.lastName,
        verificationCode,
      }, attachments);
      res(null, {
        status: 'success',
        message: 'verification code is sent to email address',
      });
    } catch (e) {
      res({
        code: grpc.status.INTERNAL,
        details: e.message
      });
    }
  },
    async resetPassword({request:req}, res) {
      try {
        const {email, verificationCode, newPassword} = req;
        const user = await Users.findOne({where: {email, verificationCode}});
        if (!user) {
          res({
            code: grpc.status.NOT_FOUND,
            details: 'user does not exist',
          }, null);
          return;
        }
        user.password = newPassword;
        user.verificationCode = '';
        await user.save();
        res(null, {
          status: 'success',
          message: 'password has been changed',
          user
        });
      } catch (e) {
        res({
          code: grpc.status.INTERNAL,
          details: e.message
        });
      }
    },
  // ===========LOGGED-IN  USER PROFILE  HANDLERS ======= //
  async getProfile({ request: req }, res) {
    try {
      const { userId } = req;
      const user = await Users.findByPk(userId);
      if (!user) {
        res({
          code: grpc.status.NOT_FOUND,
          details: 'user should be logged in',
        }, null);
        return;
      }
      res(null, {
        status: 'success',
        user,
      });
    } catch (e) {
      res({
        code: grpc.status.INTERNAL,
        details: e.message
      });
    }
  },
  async editProfile({ request: req }, res) {
    try {
      const { userId, firstName=null, lastName=null, avatar=null, phone=null  } = req;
      const user = await Users.findByPk(userId);
      if (!user) {
        res({
          code: grpc.status.NOT_FOUND,
          details: 'user does not exist',
        }, null);
        return;
      }
       user.firstName=firstName || user.firstName;
       user.lastName=lastName || user.lastName;
       user.avatar=avatar || user.avatar;
       user.phone=phone || user.phone;
       user.save();
      res(null, {
        status: 'success',
        message:'profile successfully edited',
        user,
      });
    } catch (e) {
      res({
        code: grpc.status.INTERNAL,
        details: e.message
      });
    }
  },
  async getAdminProfile({ request: req }, res) {
    try {
      const { userId } = req;
      const user = await Users.findByPk(userId);
      if (!user || !user.isAdmin) {
        res({
          code: grpc.status.UNAUTHENTICATED,
          details: 'admin role is required',
        }, null);
        return;
      }
      res(null, {
        status: 'success',
        user,
      });
    } catch (e) {
      res({
        code: grpc.status.INTERNAL,
        details: e.message
      });
    }
  },
  // ========== SINGLE USER EXISTS CHECK ====== //
}