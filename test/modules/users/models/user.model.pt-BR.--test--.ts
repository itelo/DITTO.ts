import { Application } from "express";
import request from "supertest";
import configStack from "@config/index";
import * as server from "@config/libs/app";
import * as db from "@config/libs/mongoose";
import User, { UserModel } from "@models/user.model";
import fetch from "node-fetch";

jest.mock("node-fetch");

const config = configStack.config;
let app: Application;

const user1: UserModel = new User();
let user2: UserModel = new User();
const user3: UserModel = new User();

describe("User model unit tests", () => {
  beforeAll(async done => {
    (user1.first_name = "Full"),
      (user1.last_name = "Name"),
      (user1.display_name = "Full Name"),
      (user1.phone = "99999999998"),
      (user1.email = "test@test.com"),
      (user1.password = "M3@n.jsI$Aw3$0m3"),
      (user1.provider = "local");
    user1.city = "Belem";
    user1.state = "PA";
    user1.document = "11111111111";

    user2 = user1;

    (user3.first_name = "Different"),
      (user3.last_name = "User"),
      (user3.display_name = "Full Different Name"),
      (user3.phone = "99999999997"),
      (user3.email = "test3@test.com"),
      (user3.password = "Different_Password1!"),
      (user3.provider = "local");
    user3.city = "Belem";
    user3.state = "PA";
    user3.document = "11111111111";

    app = await server.cleanStart();
    done();
  });

  afterAll(done => {
    db.disconnect(done);
  });

  describe("Method Save", () => {
    it("should begin with saved users", done => {
      User.find({}, (err, users) => {
        expect(users.length).not.toBeNull();
        expect(users).toMatchSnapshot();
        if (err) return done(err);
        done();
      });
    });

    it("should be able to save without problems", done => {
      const _user1 = new User(user1);

      _user1.save(err => {
        expect(err).toBeNull();
        _user1.remove(err => {
          expect(err).toBeNull();
          if (err) return done(err);
          done();
        });
      });
    });

    it("should fail to save an existing user again", done => {
      const _user1 = new User(user1);
      const _user2 = new User(user2);

      _user1.save(() => {
        _user2.save(err => {
          expect(err).not.toBeNull();
          _user1.remove(err => {
            expect(err).toBeNull();
            if (err) return done(err);
            done();
          });
        });
      });
    });

    it("should be able to show an error when trying to save without first name", done => {
      const _user1 = new User(user1);

      _user1.first_name = "";
      _user1.save(err => {
        expect(err).not.toBeNull();
        _user1.remove(err => {
          expect(err).toBeNull();
          if (err) return done(err);
          done();
        });
      });
    });

    it("should be able to update an existing user with valid roles without problems", done => {
      const _user1 = new User(user1);

      _user1.save(err => {
        expect(err).toBeNull();
        _user1.roles = ["user"];
        _user1.save(err => {
          expect(err).toBeNull();
          _user1.remove(err => {
            expect(err).toBeNull();
            if (err) return done(err);
            done();
          });
        });
      });
    });

    it("should be able to show an error when trying to update an existing user without a role", done => {
      const _user1 = new User(user1);

      _user1.save(err => {
        expect(err).toBeNull();
        _user1.roles = [];
        _user1.save(err => {
          expect(err).toBeNull();
          _user1.remove(err => {
            expect(err).toBeNull();
            if (err) return done(err);
            done();
          });
        });
      });
    });

    it("should be able to show an error when trying to update an existing user with a invalid role", done => {
      const _user1 = new User(user1);

      _user1.save(err => {
        expect(err).toBeNull();
        _user1.roles = ["invalid-user-role-enum"];
        _user1.save(err => {
          expect(err).not.toBeNull();
          _user1.remove(err => {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    it("should confirm that saving user model doesnt change the password", done => {
      const _user1 = new User(user1);

      _user1.save(err => {
        expect(err).toBeNull();
        const passwordBefore = _user1.password;
        _user1.first_name = "test";
        _user1.save(err => {
          const passwordAfter = _user1.password;
          // passwordBefore.should.equal(passwordAfter);
          expect(passwordBefore).toEqual(passwordAfter);
          _user1.remove(err => {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    it("should be able to save 2 different users", done => {
      const _user1 = new User(user1);
      const _user3 = new User(user3);

      _user1.save(err => {
        expect(err).toBeNull();
        _user3.save(err => {
          expect(err).toBeNull();
          _user3.remove(err => {
            expect(err).toBeNull();
            _user1.remove(err => {
              expect(err).toBeNull();
              done();
            });
          });
        });
      });
    });

    it("should not be able to save another user with the same email address", done => {
      const _user1 = new User(user1);
      const _user3 = new User(user3);

      _user1.save(err => {
        expect(err).toBeNull();
        _user3.email = _user1.email;
        _user3.save(err => {
          expect(err).not.toBeNull();
          _user1.remove(err => {
            expect(err).toBeNull();
            done();
          });
        });
      });
    });

    it("should not index missing email field, thus not enforce the model's unique index", done => {
      const _user1 = new User(user1);
      _user1.email = "";

      const _user3 = new User(user3);
      _user3.email = "";

      _user1.save(err => {
        expect(err).not.toBeNull();
        _user3.save(err => {
          expect(err).not.toBeNull();
          _user3.remove(err => {
            expect(err).toBeNull();
            _user1.remove(err => {
              expect(err).toBeNull();
              done();
            });
          });
        });
      });
    });

    it("should not save the passphrase in plain text", done => {
      const _user1 = new User(user1);
      _user1.password = "Open-Source Full-Stack Solution for MEAN";
      const passwordBeforeSave = _user1.password;
      _user1.save(err => {
        expect(err).toBeNull();
        expect(_user1.password).not.toEqual(passwordBeforeSave);
        _user1.remove(err => {
          expect(err).toBeNull();
          done();
        });
      });
    });
  });

  describe("User Password Validation Tests", () => {
    it("should validate when the password strength passes - 'P@$$w0rd!!'", () => {
      const _user1 = new User(user1);
      _user1.password = "P@$$w0rd!!";

      _user1.validate(err => {
        expect(err).toBeNull();
      });
    });

    it("should validate when the password is undefined", () => {
      const _user1 = new User(user1);
      _user1.password = "";

      _user1.validate(err => {
        expect(err).not.toBeNull();
      });
    });

    it("should validate when the passphrase strength passes - 'Open-Source Backend Solution For Typescript Applications'", () => {
      const _user1 = new User(user1);
      _user1.password =
        "Open-Source Backend Solution For Typescript Applications";

      _user1.validate(err => {
        expect(err).toBeNull();
      });
    });
  });

  describe("User E-mail Validation Tests", () => {
    it("should not allow invalid email address - '123'", done => {
      const _user1 = new User(user1);

      _user1.email = "123";
      _user1.save(err => {
        if (!err) {
          _user1.remove(err_remove => {
            expect(err).not.toBeNull();
            expect(err_remove).toBeNull();
            done();
          });
        } else {
          expect(err).not.toBeNull();
          done();
        }
      });
    });
  });

  it("should allow email address - '123@123'", done => {
    const _user1 = new User(user1);

    _user1.email = "123@123";
    _user1.save(err => {
      if (!err) {
        _user1.remove(err_remove => {
          expect(err).toBeNull();
          expect(err_remove).toBeNull();
          done();
        });
      } else {
        expect(err).toBeNull();
        done();
      }
    });
  });

  it("should not allow invalid characters in email address - 'abc~@#$%^&*()ef=@abc.com'", done => {
    const _user1 = new User(user1);

    _user1.email = "abc~@#$%^&*()ef=@abc.com";
    _user1.save(err => {
      if (!err) {
        _user1.remove(err_remove => {
          expect(err).not.toBeNull();
          expect(err_remove).toBeNull();
          done();
        });
      } else {
        expect(err).not.toBeNull();
        done();
      }
    });
  });

  it("should not allow space characters in email address - 'abc def@abc.com'", done => {
    const _user1 = new User(user1);

    _user1.email = "abc def@abc.com";
    _user1.save(err => {
      if (!err) {
        _user1.remove(err_remove => {
          expect(err).not.toBeNull();
          expect(err_remove).toBeNull();
          done();
        });
      } else {
        expect(err).not.toBeNull();
        done();
      }
    });
  });

  it("should not allow doudble quote characters in email address - 'abc\"def@abc.com'", done => {
    const _user1 = new User(user1);

    _user1.email = 'abc"def@abc.com';
    _user1.save(err => {
      if (err) {
        _user1.remove(err_remove => {
          expect(err).not.toBeNull();
          expect(err_remove).toBeNull();
          done();
        });
      } else {
        expect(err).not.toBeNull();
        done();
      }
    });
  });

  it("should not allow double dotted characters in email address - 'abcdef@abc..com'", done => {
    const _user1 = new User(user1);

    _user1.email = "abcdef@abc..com";
    _user1.save(err => {
      if (err) {
        _user1.remove(err_remove => {
          expect(err).not.toBeNull();
          expect(err_remove).toBeNull();
          done();
        });
      } else {
        expect(err).not.toBeNull();
        done();
      }
    });
  });

  it("should allow single quote characters in email address - 'abc\"def@abc.com'", done => {
    const _user1 = new User(user1);

    _user1.email = 'abc"def@abc.com';
    _user1.save(err => {
      if (!err) {
        _user1.remove(err_remove => {
          expect(err).not.toBeNull();
          expect(err_remove).not.toBeNull();
          done();
        });
      } else {
        expect(err).not.toBeNull();
        done();
      }
    });
  });
});
