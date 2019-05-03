// This simple node server app uses express and gets deployed 
// on cluster nodes managed by docker swarm.

const os = require("os");
const express = require("express");

const server_app = express();

server_app.get("/", (req, res) => {
	res.send("Hey from Swarm hostname " + os.hostname());
});

server_app.listen(9999, () => {
	console.log("Server is listening on port 9999");
});
