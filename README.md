Box Node.js SDK
===============

[![Greenkeeper badge](https://badges.greenkeeper.io/box/box-node-sdk.svg)](https://greenkeeper.io/)

[![Project Status](http://opensource.box.com/badges/active.svg)](http://opensource.box.com/badges)

A Node.js interface to the [Box Content API](https://developers.box.com/docs/).

Getting Started Docs: https://developer.box.com/guides/tooling/sdks/node/

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Getting Started](#getting-started)
- [Creating API Clients](#creating-api-clients)
  - [Basic Client](#basic-client)
  - [Persistent Client](#persistent-client)
  - [App Auth Client](#app-auth-client)
- [Using the Client to Make API Calls](#using-the-client-to-make-api-calls)
  - [Constructing API Calls Manually](#constructing-api-calls-manually)
- [Questions, Bugs, and Feature Requests?](#questions-bugs-and-feature-requests)
- [Contributing to the Box Node.js SDK](#contributing-to-the-box-nodejs-sdk)
- [Changelog](#changelog)
- [Copyright and License](#copyright-and-license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Installation
------------

```
npm install --save box-node-sdk
```

Getting Started
---------------

To get started with the SDK, get a Developer Token from the Configuration page
of your app in the [Box Developer Console][dev-console].
You can use this token to make test calls for your own Box account.

```js
var BoxSDK = require('box-node-sdk');

// Initialize the SDK with your app credentials
var sdk = new BoxSDK({
  clientID: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET'
});

// Create a basic API client, which does not automatically refresh the access token
var client = sdk.getBasicClient('DEVELOPER_TOKEN');

// Get your own user object from the Box API
// All client methods return a promise that resolves to the results of the API call,
// or rejects when an error occurs
client.users.get(client.CURRENT_USER_ID)
	.then(user => console.log('Hello', user.name, '!'))
	.catch(err => console.log('Got an error!', err));
```

[dev-console]: https://app.box.com/developers/console

Creating API Clients
--------------------

Clients are used to communicate with the API on behalf of a user.

Box supports three different types of client:

- **Basic Client:** Simple, makes calls via the given access token until the access token expires
- **Persistent Client:** For use with traditional OAuth2 apps, can refresh its tokens automatically and persist them via a token store
- **App Auth Client:** Uses the app auth JWT grant to act on behalf of app/managed users and create new tokens automatically

### Basic Client

Returns a Box Client with a Basic API Session. The client is able to make requests on behalf of a user. A basic session has no access to a user's refresh token. Because of this, once the session's tokens expire the client cannot recover and a new session will need to be generated.

```js
var client = BoxSDK.getBasicClient('ACCESS_TOKEN');
```

### Persistent Client

Returns a Box Client with a persistent API session. A persistent API session helps manage the user's tokens, and can refresh them automatically if the access token expires. If a central data-store is given, the session can read & write tokens to it.

> NOTE: If tokenInfo or tokenStore are formatted incorrectly, this method will throw an error. If you haven't explicitly created either of these objects or are otherwise not completely confident in their validity, you should wrap your call to getPersistentClient in a try-catch to handle any potential errors.

If you do not provide a token store object, the SDK will continue refreshing tokens locally as long
as the Node.js process lives, but will not able to restore the user's authentication on process
restart or share that authentication state between different processes.
```js
var client = sdk.getPersistentClient(tokenInfo, null);
```

Providing a token store will allow the SDK to persist the user's authentication state
so that you can resume making API calls as a user if the Node.js process needs to restart,
or share the authentication state between multiple different processes.
```js
var client = sdk.getPersistentClient(tokenInfo, tokenStore);
```

The token store is the interface used by persistent clients to interact with the consumer app's central storage layer. For a token store to be valid, it must have the following three methods:

```js
store.read(function(err, data) {}); // read TokenInfo from app central store.
store.write(tokenInfo, function(err, data) {}); // write TokenInfo to the app's central store.
store.clear(function(err, data) {}); // delete TokenInfo from the app's central store.
```

Note that these methods don't pass in identifying information as arguments. You'll most likely need to create them on-demand for each client.

### App Auth Client

App Auth allows an app to fully manage the Box accounts of its users; they do not
have direct login credentials to Box and all operations are performed through the API
using a JWT grant.

If you have a JSON configuration file from the [Box Developer Console][dev-console]
that includes your private key information, you can import that directly to create an SDK instance:

```js
var sdkConfig = require('/path/to/config.json');
var sdk = BoxSDK.getPreconfiguredInstance(sdkConfig);

// Get the service account client, used to create and manage app user accounts
// The enterprise ID is pre-populated by the JSON configuration,
// so you don't need to specify it here
var serviceAccountClient = sdk.getAppAuthClient('enterprise');

// Get an app user or managed user client
var appUserClient = sdk.getAppAuthClient('user', 'YOUR-APP-USER-ID');
```

Otherwise, you can manually pass the necessary configuration parameters to the SDK:

```js
var sdk = new BoxSDK({
	clientID: 'CLIENT_ID',
	clientSecret: 'CLIENT_SECRET',
	appAuth: {
		keyID: 'PUBLIC_KEY_ID',
		privateKey: 'PRIVATE_KEY',
		passphrase: 'PRIVATE_KEY_PASSPHRASE'
	}
});

// Get the service account client, used to create and manage app user accounts
var serviceAccountClient = sdk.getAppAuthClient('enterprise', 'APP_ENTERPRISE_ID');

// Get an app user or managed user client
var appUserClient = sdk.getAppAuthClient('user', 'YOUR-APP-USER-ID');
```


Using the Client to Make API Calls
----------------------------------

The different API endpoints you can call are represented as methods, grouped into
managers by the type of object they interact with.

For example:
```js
// Get the user opject for the current user
client.users.get(client.CURRENT_USER_ID)
	.then(currentUser => { /* ... */ })
	.catch(error => { /* handle any errors */ });

// Update the name for folder with ID 123
client.folders.update('123', { name: 'New Folder Name' })
	.then(folderInfo => { /* ... */ })
	.catch(error => { /* handle any errors */ });

// Upload a new file to folder 123
client.files.uploadFile('123', 'bicycle.png', fileContents)
	.then(fileObject => { /* ... */ })
	.catch(error => { /* handle any errors */ });

// Delete the comment with ID 456
client.comments.delete('456')
	.then(() => { /* ... */ })
	.catch(error => { /* handle any errors */ });
```

For complete documentation about the available operations, please see
the [SDK documentation pages](./docs) and the auto-generated
[JSDocs](https://rawgit.com/box/box-node-sdk/main/docs/jsdoc/index.html).
These contain detailed information about which methods are available and
how to use them.

### Constructing API Calls Manually

The SDK also exposes low-level request methods for constructing your own API calls.
These can be useful for adding your own API calls that aren't yet explicitly supported by the SDK.

The low-level methods always return a response object that contains the raw API response, and do not
turn non-2xx status codes into errors like the normal client methods do.

```js
// GET /files/123?fields=id,name
client.get('/files/123', {qs: {fields: 'id,name'}})
	.then(response => { /* ... */ })
	.catch(error => { /* handle any errors */ });

// PUT /files/123
// {
//     "name": "New File Name"
// }
client.put('/files/123', {body: {name: 'New File Name'}});
	.then(response => { /* ... */ })
	.catch(error => { /* handle any errors */ });

// DELETE /files/123
client.del('/files/123');
	.then(response => { /* ... */ })
	.catch(error => { /* handle any errors */ });
```

Questions, Bugs, and Feature Requests?
--------------------------------------

[Browse the issues tickets](https://github.com/box/box-node-sdk/issues)! Or, if that doesn't work, [file a new one](https://github.com/box/box-node-sdk/issues/new) and someone will get back to you.   If you have general questions about the
Box API, you can post to the [Box Developer Forum](https://community.box.com/t5/Developer-Forum/bd-p/DeveloperForum).


Contributing to the Box Node.js SDK
-----------------------------------

1. Clone this repo.
1. Run `npm install`.
1. Run `npm test` to ensure everything is working.
1. Make the changes you want in the `lib/` directory.  Be sure to add corresponding tests
in the `tests/` directory!
1. Create a pull request with your changes — we'll review it and help you get it merged.

For more information, please see [the Contribution guidelines](./CONTRIBUTING.md).

Changelog
----------

See [CHANGELOG.md](./CHANGELOG.md).

Copyright and License
---------------------

Copyright 2018 Box, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
