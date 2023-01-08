/* eslint-disable no-unused-vars */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
    let res = await agent.get("/adminlogin");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: username,
      password: password,
      _csrf: csrfToken,
    });
  };


describe( "Online Election Application Test Suite" , () => {

    beforeAll(async () => {
        await db.sequelize.sync({ force: true });
        server = app.listen(4000, () => {});
        agent = request.agent(server);
      });
      afterAll(async () => {
        try {
          await db.sequelize.close();
          server.close();
        } catch (error) {
          console.log(error);
        }
      });

      test ( "simple test" , async() => {
        expect(true).toBe(true);
      });

});