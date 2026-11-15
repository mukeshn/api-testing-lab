package com.mukeshn.api.bank;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import java.util.Map;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class OAuthScopesTest {
    private static final String BASE = System.getProperty("base.url", "http://localhost:4173");

    private String token(String client, String secret, String scope) {
        var req = given().baseUri(BASE).auth().preemptive().basic(client, secret).formParam("grant_type", "client_credentials");
        if (scope != null) req.formParam("scope", scope);
        return req.post("/api/bank/oauth/token").then().statusCode(200).body("token_type", equalTo("Bearer")).extract().path("access_token");
    }

    @DataProvider
    public Object[][] matrix() {
        return new Object[][] {
            {"partner-app", "p4rtn3r-s3cret", null, 200, 201},
            {"partner-app", "p4rtn3r-s3cret", "accounts:read", 200, 403},
            {"readonly-app", "r34d-0nly", null, 200, 403},
        };
    }

    @Test(dataProvider = "matrix")
    public void scopeMatrix(String client, String secret, String scope, int readStatus, int writeStatus) {
        String t = token(client, secret, scope);
        given().baseUri(BASE).auth().oauth2(t).get("/api/bank/accounts").then().statusCode(readStatus);
        given().baseUri(BASE).auth().oauth2(t).contentType("application/json")
                .body(Map.of("fromAccountId", "ACC-001", "beneficiaryName", "Scope Test", "iban", "DE89370400440532013000".replace("DE89370400440532013000", "DE02120300000000202051"), "amount", 1))
                .post("/api/bank/transfers").then().statusCode(writeStatus);
    }

    @Test
    public void invalidClientAndScope() {
        given().baseUri(BASE).formParam("grant_type", "client_credentials").formParam("client_id", "partner-app").formParam("client_secret", "nope")
                .post("/api/bank/oauth/token").then().statusCode(401).body("error", equalTo("invalid_client"));
        given().baseUri(BASE).auth().preemptive().basic("readonly-app", "r34d-0nly").formParam("grant_type", "client_credentials").formParam("scope", "admin")
                .post("/api/bank/oauth/token").then().statusCode(400).body("error", equalTo("invalid_scope"));
    }

    @Test
    public void ibanValidationEndpoint() {
        given().baseUri(BASE).contentType("application/json").body(Map.of("iban", "de89 3704 0044 0532 0130 00"))
                .post("/api/bank/iban/validate").then().body("valid", is(true)).body("bankCode", equalTo("37040044")).body("iban", equalTo("DE89370400440532013000"));
    }
}
