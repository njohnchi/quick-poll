---
applyTo: '**'
description: 'rules for working with API endpoitns'
---
* All API endpoints follow the OpenAPI specification.
* When creating new resources (like users, polls, etc) use the following command to bootsrap all CRUD API endpoints: `npx hygen resource new --name [singular-resource-name-here]`
* ALWAYS read the created files for more direction (feel free to delete any that end up not being used)
* When creating one-off API endpoints (not full resources) bootstrap the API file with the command: `npx hygen api new --path [path-relative to server/api] --method [get, post, put, delete]`
* ALWAYS read the created files after running the hygen command.
* If you need to create an API endpoint that supports streaming:
    *  Don't use one of the hygen commands
    *  DO use the Nuxt MCP for reference
    *  Do define the return response with the `sendStream` function
