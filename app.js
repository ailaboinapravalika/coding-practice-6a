const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API - 1 GET states
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT *
    FROM state
    ;`;
  const allStatesDb = await db.all(getAllStatesQuery);
  const responseList = allStatesDb.map((eachState) => {
    return {
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    };
  });
  console.log(responseList);
  response.send(responseList);
});

// GET SINGLE STATE
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE 
    state_id = ${stateId}
    ;`;
  const stateDb = await db.get(getStateQuery);
  const responseOb = {
    stateId: stateDb.state_id,
    stateName: stateDb.state_name,
    population: stateDb.population,
  };
  response.send(responseOb);
});

// POST district API -3
app.post("/districts/", async (request, response) => {
  const districtBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtBody;
  const addDistQuery = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(addDistQuery);
  response.send("District Successfully Added");
});

// GET DISTRICT API - 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
        SELECT *
        FROM district
        WHERE
        district_id = ${districtId}
    ;`;
  const distDb = await db.get(getDistQuery);
  const responseDist = {
    districtId: distDb.district_id,
    districtName: distDb.district_name,
    stateId: distDb.state_id,
    cases: distDb.cases,
    cured: distDb.cured,
    active: distDb.active,
    deaths: distDb.deaths,
  };
  response.send(responseDist);
});

//DELETE A DISTRICT
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistQuery = `
        DELETE FROM district
        WHERE
        district_id = ${districtId}
        ;`;
  await db.run(deleteDistQuery);
  response.send("District Removed");
});

//UPDATE a district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const distDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = distDetails;

  const updateDistQuery = `
        UPDATE district 
        SET 
            district_name  = '${districtName}',
            state_id  = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
    ;`;
  await db.run(updateDistQuery);
  response.send("District Details Updated");
});

//GET STATISTICS API - 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
    SELECT district.cases,district.cured,district.active,district.deaths
    FROM state 
    LEFT JOIN district
    ON state.state_id = district.state_id
    WHERE
    state.state_id = ${stateId}
    ;`;
  const stateDb = await db.get(getStatisticsQuery);
  console.log(stateDb);
  const responseStatistics = {
    totalCases: stateDb.cases,
    totalCured: stateDb.cured,
    totalActive: stateDb.active,
    totalDeaths: stateDb.deaths,
  };
  response.send(responseStatistics);
});

// api - 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
        SELECT state.state_name
        FROM district 
        LEFT JOIN state
        ON district.state_id = state.state_id
        WHERE 
        district.district_id = ${districtId}
        ;`;
  const stateDb = await db.get(getDistQuery);
  const responseObj = {
    stateName: stateDb.state_name,
  };
  response.send(responseObj);
});

module.exports = app;
