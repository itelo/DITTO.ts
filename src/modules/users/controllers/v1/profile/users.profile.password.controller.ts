import { Request, Response } from "express";
import path from "path";
import configStack from "@config/index";
import User, { UserModel } from "@models/user.model";
import nodemailer from "nodemailer";
import async from "async";
import crypto from "crypto";
import util from "util";
import { responsePathAsArray } from "graphql";
const config = configStack.config;

const smtpTransport = nodemailer.createTransport(config.mailer.options);

interface RequestWithUser extends Request {
  user: UserModel;
}

export async function forgot(req: Request, res: Response) {
  const render = renderAsPromise(req, res);
  const cryptoRandom = util.promisify(crypto.randomBytes);

  let token = "";
  let emailHTML = "";
  let user: UserModel | null;
  const usernameOrEmail = String(req.body.usernameOrEmail).toLowerCase();

  // Create the token to reset password
  try {
    const buffer = await cryptoRandom(20);
    token = buffer.toString("hex");
  } catch (err) {
    console.log("DEU RUIM");
  }

  try {
    user = await User.findOne(
      {
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      },
      "-salt -password"
    );
  } catch (err) {
    // deu merda
    console.log(err);
    return res.status(400).send({
      message: "No account with that username or email has been found"
    });
  }

  if (!user) {
    return res.status(400).send({
      message: "No account with that username or email has been found"
    });
  }

  // Save the token inside the user document
  if (user.provider !== "local") {
    // TODO: add anothers provider inside additional provider
    return res.status(400).send({
      message:
        "It seems like you signed up using your " +
        user.provider +
        " account, please sign in using that provider."
    });
  }
  try {
    user.reset_password_token = token;
    user.reset_password_expires = Date.now() + 3600000; // 1 hour
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      message: "Sorry, error while getting token"
    });
  }

  let httpTransport = "http://";
  if (config.secure && config.secure.ssl === true) {
    httpTransport = "https://";
  }
  const baseUrl = config.domain || httpTransport + req.headers.host;

  try {
    emailHTML = await render(
      `${config.outDir}/modules/users/templates/reset-password-email`,
      {
        name: user.display_name,
        appName: config.app.title,
        url: `${baseUrl}/api/auth/reset/${token}`
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      message: "Failure sending email"
    });
  }

  const mailOptions = {
    to: user.email,
    from: config.mailer.from,
    subject: "Password Reset",
    html: emailHTML
  };
  try {
    await smtpTransport.sendMail(mailOptions);
    res.send({
      message:
        "An email has been sent to the provided email with further instructions."
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      message: "Failure sending email"
    });
  }
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

/**
 * Reset password POST from email token
 */
export async function reset(req: Request, res: Response) {
  // Init Variables
  const passwordDetails = req.body;
  const render = renderAsPromise(req, res);
  let user: UserModel | null | undefined = undefined;

  try {
    user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (!user) {
      return res.status(400).send({
        message: "Password reset token is invalid or has expired."
      });
    }
  }

  user.password = passwordDetails.newPassword;
  user.reset_password_token = undefined;
  user.reset_password_expires = undefined;

  try {
    await user.save();
  } catch (err) {
    return res.status(422).send({
      message: err
    });
  }

  try {
    const emailHTML = await render(
      `${config.outDir}/modules/users/templates/reset-password-confirm-email`,
      {
        name: user.display_name,
        appName: config.app.title
      }
    );

    const mailOptions = {
      to: user.email,
      from: config.mailer.from,
      subject: "Your password has been changed",
      html: emailHTML
    };

    smtpTransport.sendMail(mailOptions);
  } catch (err) {}
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

const renderAsPromise = (req: Request, res: Response) => (
  path: string,
  options: any
) => {
  return new Promise<string>((resolve, reject) => {
    res.render(path, options, (err, success) => {
      if (err) {
        reject(err);
      }
      resolve(success);
    });
  });
};
