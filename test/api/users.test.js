const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

function getCookies(response) {
  return response.headers["set-cookie"].map((c) => c.split(";")[0]);
}

function expectLoginPage(res, inverse) {
  expect(res.statusCode).toEqual(200);
  if (inverse) {
    expect(res.text).not.toContain('form action="/users/login"');
  } else {
    expect(res.text).toContain('form action="/users/login"');
  }
}

describe("Users API", () => {
  const usersBase = "/users";
  const loginRoute = usersBase + "/login";
  const testRoute = "/dashboard";
  const registerRoute = usersBase + "/register";
  const logoutRoute = usersBase + "/logout";

  it("should not be accept wrong login", async () => {
    const response = await request.post(loginRoute).redirects(1).send({
      username: "pik",
      password: "kip"
    });
    expectLoginPage(response);
  });

  it("should not be accept wrong login with 'remember_me'", async () => {
    const response = await request.post(loginRoute).redirects(1).send({
      username: "pik",
      password: "kip",
      remember_me: "askdaksmdkasmdk"
    });
    expectLoginPage(response);
  });

  it("should not be able to login with 'missing credentials'", async () => {
    const response = await request.post(loginRoute).redirects(1).send();
    expectLoginPage(response);
  });

  it("should login with known account", async () => {
    const credentials = {
      name: "dewd",
      username: "dewd",
      password: "deeeeeeewd",
      password2: "deeeeeeewd",
      remember_me: "asdasdasd"
    };
    const response = await request
      .post(registerRoute)
      .redirects(1)
      .send(credentials);
    expect(response.statusCode).toEqual(200);

    const cookies = getCookies(response);
    expect(cookies).not.toBeUndefined();
    expect(cookies).toHaveLength(1);
    const cookieJar = cookies.join("; ");

    const responseLogin = await request
      .post(loginRoute)
      .set("Cookie", cookieJar)
      .redirects(2)
      .send(credentials);

    expect(responseLogin.headers.location).not.toEqual("/users/login");
    expect(responseLogin.headers.location).toBeUndefined();
    expect(responseLogin.redirects[0]).toContain("/dashboard");
    expectLoginPage(responseLogin, true);

    // Test remember_me functionality
    const responseLoggedInTest = await request
      .get(testRoute)
      .set("Cookie", cookieJar)
      .redirects(0)
      .send();
    expect(response.statusCode).not.toEqual(302);
    expectLoginPage(responseLoggedInTest, true);
  });
});
