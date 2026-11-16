Feature: Get Hello World endpoint

  Scenario: Service returns Hello World response
    Given the service is running
    When the client requests GET /hello
    Then the response status code is 200
    And the response content type is application/json
    And the response body is {"message":"Hello, world!"}
