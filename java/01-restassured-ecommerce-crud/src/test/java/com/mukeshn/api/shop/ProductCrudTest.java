package com.mukeshn.api.shop;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import java.util.Map;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class ProductCrudTest {
    private RequestSpecification admin;
    private RequestSpecification anon;
    private int productId;

    @BeforeClass
    public void auth() {
        String base = System.getProperty("base.url", "http://localhost:4173");
        anon = new RequestSpecBuilder().setBaseUri(base).setBasePath("/api/shop").setContentType(ContentType.JSON).build();
        String token = given().spec(anon).body(Map.of("email", "admin@shop.test", "password", "Adm1n!2026"))
                .post("/auth/login").then().statusCode(200).extract().path("token");
        admin = new RequestSpecBuilder().addRequestSpecification(anon).addHeader("Authorization", "Bearer " + token).build();
    }

    @Test
    public void create() {
        productId = given().spec(admin).body(Map.of("name", "RA Gloves " + System.nanoTime(), "category", "Accessories", "price", 18.5, "stock", 12))
                .when().post("/products")
                .then().statusCode(201).header("Location", matchesPattern("/api/shop/products/\\d+"))
                .body("sku", startsWith("SKU-")).body("price", equalTo(18.5f))
                .extract().path("id");
    }

    @Test(dependsOnMethods = "create")
    public void readUpdatePatch() {
        given().spec(anon).get("/products/{id}", productId).then().statusCode(200).body("stock", equalTo(12));
        given().spec(admin).body(Map.of("name", "RA Gloves Pro", "price", 21.0)).put("/products/{id}", productId).then().body("name", equalTo("RA Gloves Pro"));
        given().spec(admin).body(Map.of("stock", 0)).patch("/products/{id}", productId).then().body("stock", equalTo(0)).body("price", equalTo(21.0f));
    }

    @Test(dependsOnMethods = "readUpdatePatch")
    public void delete() {
        given().spec(admin).delete("/products/{id}", productId).then().statusCode(204);
        given().spec(anon).get("/products/{id}", productId).then().statusCode(404).body("error", equalTo("NOT_FOUND"));
    }

    @Test
    public void listIsFilterableAndSorted() {
        given().spec(anon).queryParam("category", "Footwear").queryParam("sort", "price-desc").get("/products")
                .then().statusCode(200).body("items.category", everyItem(equalTo("Footwear")))
                .body("items[0].price", greaterThanOrEqualTo(150f));
    }

    @Test
    public void anonymousCannotCreate() {
        given().spec(anon).body(Map.of("name", "x", "category", "Apparel", "price", 1)).post("/products").then().statusCode(401);
    }
}
