import { Request, Response } from "express";
import path from "path";
import configStack from "@config/index";
// const errorHandler = require(path.resolve(
//   "./modules/core/server/controllers/errors.server.controller"
//   ));
import User, { UserModel } from "@models/user.model";
// import nodemailer from "nodemailer";
import async from "async";
import crypto from "crypto";

// const smtpTransport = nodemailer.createTransport(config.mailer.options);

interface RequestWithUser extends Request {
  user: UserModel;
}

/**
 * Reset password GET from email token
 */
export async function validateResetToken(req: Request, res: Response) {
  try {
    const user = await User.findOne({
      reset_password_token: req.params.token,
      reset_password_expires: {
        $gt: Date.now()
      }
    });
    if (user) res.redirect(`/password/reset/${req.params.token}`);
  } finally {
    return res.redirect("/password/reset/invalid");
  }
}

interface RequestChangePassword extends RequestWithUser {
  body: {
    currentPassword: string;
    newPassword: string;
    verifyPassword: string;
  };
}

/**
 * Change Password
 */
export async function changePassword(
  req: RequestChangePassword,
  res: Response
) {
  // Init Variables
  const { currentPassword, newPassword, verifyPassword } = req.body;
  const user = (await User.findById(req.user._id)) as UserModel;

  if (!user.authenticate(currentPassword)) {
    return res.status(422).json({
      message: "Current password is incorrect"
    });
  }

  if (newPassword !== verifyPassword) {
    return res.status(422).json({
      message: "Passwords do not match"
    });
  }

  user.password = newPassword;

  try {
    await user.save();
  } catch (err) {
    console.error(err);
    // return res.status(422).json({
    // message: errorHandler.getErrorMessage(err)
    // });
  }

  return res.json({
    message: "Password changed successfully"
  });
}
