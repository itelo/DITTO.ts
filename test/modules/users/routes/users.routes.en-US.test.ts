import { Application } from "express";
import request from "supertest";
import configStack from "@config/index";
import * as server from "@config/libs/app";
import * as db from "@config/libs/mongoose";
import { prettyFormatToJSON } from "@utils/pretty-format-toJSON";
expect.addSnapshotSerializer(prettyFormatToJSON);

jest.setTimeout(10000);

let app: Application;

describe("route:/api/v1/signup", () => {
  let token: string;
  beforeAll(async done => {
    app = await server.cleanStart();
    done();
  });

  afterAll(done => {
    db.disconnect(done);
  });

  it("success: all data correct", done => {
    const doc = {
      input: {
        body: {
          first_name: "ilu2",
          last_name: "minate2",
          phone: "1234567891",
          email: "iluminate@india2.com",
          password: "!(_Um1n4t3"
        }
      },
      output: {}
    };
    request(app)
      .post("/api/v1/signup")
      .send(doc.input.body)
      .expect(200)
      .end((err, res) => {
        const output = {
          body: res.body
        };

        expect(res.body.data.user).toHaveProperty("first_name", "ilu2");
        expect(res.body.data.user).toHaveProperty("last_name", "minate2");
        expect(res.body.data.user).toHaveProperty(
          "email",
          "iluminate@india2.com"
        );
        expect(res.body.data.user).toHaveProperty("provider", "local");
        expect(res.body.data.user).toHaveProperty("roles", ["user"]);
        expect(res.body.data.user).toHaveProperty("_id");
        expect(res.body.data.user).toHaveProperty("profile_image_urls");
        expect(res.body.data).toHaveProperty("token");

        doc.output = output;

        expect(doc).toMatchSnapshot();

        if (err) return done(err);
        done();
      });
  });

  it("fail: due to blank first name", done => {
    const doc = {
      input: {
        body: {
          first_name: "",
          last_name: "minate",
          phone: "1234567891",
          email: "aaailuminate@india2.com",
          password: "!(_Um1n4t3"
        }
      },
      output: {}
    };
    request(app)
      .post("/api/v1/signup")
      .send(doc.input.body)
      .expect(422)
      .set("content-Language", "en-US")
      .end((err, res) => {
        const output = {
          body: res.body
        };

        doc.output = output;
        expect(doc).toMatchSnapshot();
        expect(res.body.error.message).toBe("First name is required field");

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
        password: "!(_Um1n4t3"
      })
      .expect(422)
      .set("content-Language", "en-US")
      .end((err, res) => {
        // expect(res.body).toMatchSnapshot();
        expect(res.body.error.message).toBe("Last name is required field");

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
        password: "!(_Um1n4t3"
      })
      .expect(422)
      .set("content-Language", "en-US")
      .end((err, res) => {
        // expect(res.body).toMatchSnapshot();
        expect(res.body.error.message).toBe(
          "The email you passed is not a valid one"
        );

        if (err) return done(err);
        done();
      });
  });

  it("test /api/v1/signin", done => {
    request(app)
      .post("/api/v1/signin")
      .send({
        email: "iluminate@india2.com",
        password: "!(_Um1n4t3"
      })
      .expect(200)
      .end((err, res) => {
        // expect(res.body).toMatchSnapshot();
        token = `${configStack.config.jwt.prefix} ${res.body}`;

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
        // expect(res.body).toMatchSnapshot();
        if (err) return done(err);
        done();
      });
  });
});
