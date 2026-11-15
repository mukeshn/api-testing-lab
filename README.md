    # API Testing Lab

    [![API tests](https://github.com/mukeshn/api-testing-lab/actions/workflows/playwright.yml/badge.svg)](https://github.com/mukeshn/api-testing-lab/actions/workflows/playwright.yml)
    ![RestAssured](https://img.shields.io/badge/RestAssured-6.3.0-5A9E4B)
    ![Playwright](https://img.shields.io/badge/Playwright-API-2EAD33?logo=playwright&logoColor=white)
    ![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)
    ![Projects](https://img.shields.io/badge/projects-7-blue)
    [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

    Seven API testing projects in two stacks (**Java + RestAssured** and **TypeScript + Playwright**) against REST, OData V4, Salesforce Composite and GraphQL endpoints.

    | # | Project | Domain | Technique |
    |---|---|---|---|
    | [01](java/01-restassured-ecommerce-crud) | RestAssured e-commerce CRUD | E-commerce | spec builders, `dependsOnMethods` lifecycle, Hamcrest GPath |
| [02](java/02-restassured-banking-oauth) | RestAssured OAuth2 scope matrix | Banking | preemptive Basic, client credentials, `@DataProvider` matrix |
| [03](projects/03-retail-inventory-playwright-request) | Retail inventory API with APIRequestContext | Retail | Playwright `request`, data-driven negatives, concurrency check |
| [04](projects/04-ecommerce-json-schema-ajv) | Contract tests with JSON Schema (ajv) | E-commerce | ajv + ajv-formats, `$ref` reuse, additionalProperties |
| [05](projects/05-salesforce-composite-graph) | Salesforce Composite and SOQL | Salesforce | OAuth client credentials, reference ids, `allOrNone` semantics |
| [06](projects/06-sap-odata-v4-query-builder) | Typed OData V4 query builder | SAP S/4HANA | small typed builder for $filter/$select/$expand, generated assertions |
| [07](projects/07-ecommerce-graphql) | GraphQL API testing | E-commerce | in-repo GraphQL server (graphql-js) wrapping the REST API, query/mutation/error tests |

    ```bash
    # TypeScript projects (SUT starts automatically)
    npm ci && npx playwright test
    npx playwright test --project=07-ecommerce-graphql

    # Java projects
    node sut/server.mjs &
    mvn -f java/pom.xml verify
    ```

    Related full suites: [rest-assured-banking-api](https://github.com/mukeshn/rest-assured-banking-api) · [playwright-api-ecommerce](https://github.com/mukeshn/playwright-api-ecommerce) · [sap-odata-api-tests](https://github.com/mukeshn/sap-odata-api-tests) · [postman-newman-retail-api](https://github.com/mukeshn/postman-newman-retail-api)
