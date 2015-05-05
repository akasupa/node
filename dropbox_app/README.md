## Dropbox 

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: 10hrs

### Features
* Created Server that listens on 8000 by default.
* Server has the following http methods implementations : PUT, POST, DELETE, GET and HEAD.
* The default TCP port for accept client connections is 9000.
* All changes are that server recieves are in sync on the client side too
* The client has to be connected to the server to keep in sync
* --dir can be used to specify the dir which server will use to create/update/delete files on

### Demo gif attached