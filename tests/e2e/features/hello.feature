Feature: Get Hello World endpoint (E2E)

  Scenario: Service returns Hello World response through assembled app
    Given the assembled service is running
    When the assembled client requests GET /hello
    Then the assembled response status code is 200
    And the assembled response content type is application/json
    And the assembled response body is {"message":"Hello, world!"}
