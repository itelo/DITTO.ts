import { Application } from "express";
import request from "supertest";
import configStack from "@config/index";
import * as server from "@config/libs/app";
import * as db from "@config/libs/mongoose";

jest.setTimeout(13000);

let app: Application;
describe("hello world", () => {
  let token: string;

  describe("test /api/v1/signup", () => {
    beforeAll(async done => {
      app = await server.cleanStart();
      done();
    });

    afterAll(done => {
      db.disconnect(done);
    });

    it("test /api/v1/signup all data correct", done => {
      request(app)
        .post("/api/v1/signup")
        .send({
          first_name: "ilu",
          last_name: "minate",
          phone: "1234567891",
          email: "aaailuminate@india2.com",
          password: "!(_Um1n4t3",
          city: "Belem",
          state: "PA",
          document: "11111111111"
        })
        .expect(200)
        .end((err, res) => {
          expect(res.body.data.user).toHaveProperty("first_name", "ilu");
          expect(res.body.data.user).toHaveProperty("last_name", "minate");
          expect(res.body.data.user).toHaveProperty(
            "email",
            "aaailuminate@india2.com"
          );
          expect(res.body.data.user).toHaveProperty("provider", "local");
          expect(res.body.data.user).toHaveProperty("roles", ["user"]);
          expect(res.body.data.user).toHaveProperty("city", "Belem");
          expect(res.body.data.user).toHaveProperty("state", "PA");
          expect(res.body.data.user).toHaveProperty("document", "11111111111");
          expect(res.body.data.user).toHaveProperty("_id");
          expect(res.body.data.user).toHaveProperty("profile_image_urls");
          expect(res.body.data).toHaveProperty("token");

          if (err) return done(err);
          done();
        });
    });

    it("blank first name /api/v1/signup", done => {
      request(app)
        .post("/api/v1/signup")
        .send({
          first_name: "",
          last_name: "minate",
          phone: "1234567891",
          email: "aaailuminate@india2.com",
          password: "!(_Um1n4t3",
          city: "Belem",
          state: "PA",
          document: "11111111111"
        })
        .expect(422)
        .end((err, res) => {
          expect(res.body.error.message).toBe(
            "Primeiro nome é um campo obrigatório"
          );
          if (err) return done(err);
          done();
        });
    });

    it("blank last name /api/v1/signup", done => {
      request(app)
        .post("/api/v1/signup")
        .send({
          first_name: "ilu",
          last_name: "",
          phone: "1234567891",
          email: "aaailuminate@india2.com",
          password: "!(_Um1n4t3",
          city: "Belem",
          state: "PA",
          document: "11111111111"
        })
        .expect(422)
        .end((err, res) => {
          expect(res.body.error.message).toBe(
            "Último nome é um campo obrigatório"
          );

          if (err) return done(err);
          done();
        });
    });

    it("blank email /api/v1/signup", done => {
      request(app)
        .post("/api/v1/signup")
        .send({
          first_name: "ilu",
          last_name: "minate",
          phone: "1234567891",
          email: "",
          password: "!(_Um1n4t3",
          city: "Belem",
          state: "PA",
          document: "11111111111"
        })
        .expect(422)
        .end((err, res) => {
          expect(res.body.error.message).toBe(
            "O email que você passou não é válido"
          );

          if (err) return done(err);
          done();
        });
    });

    it("test /api/v1/signin", done => {
      request(app)
        .post("/api/v1/signin")
        .send({
          first_name: "ilu",
          last_name: "minate",
          phone: "1234567891",
          email: "aaailuminate@india2.com",
          password: "!(_Um1n4t3",
          city: "Belem",
          state: "PA",
          document: "11111111111"
        })
        .expect(200)
        .end((err, res) => {
          token = `${configStack.config.jwt.prefix} ${res.body.data.token}`;

          if (err) return done(err);
          done();
        });
    });

    it("test /api/v1/users/me", done => {
      request(app)
        .get("/api/v1/users/me")
        .expect(200)
        .set({ Authorization: token })
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });
  });
});
