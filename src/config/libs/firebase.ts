import firebaseAdmin from "firebase-admin";
import configStack from "@config/index";

let instance: any;
class Firebase {
  _app: firebaseAdmin.app.App;
  constructor() {
    if (instance) {
      return instance;
    }

    this._app = this.initializeApp();

    instance = this;
  }

  private initializeApp() {
    const config = configStack.config;
    return firebaseAdmin.initializeApp(config.firebase.app);
  }

  public app() {
    if (process.env.NODE_ENV === "test") {
      // @ts-ignore
      this.app = jest.fn(() => this);
    } else {
      try {
        this._app = firebaseAdmin.app();
      } catch (e) {
        this._app = this.initializeApp();
      }
    }

    return this._app;
  }
}

export default new Firebase();
